import mongoose, { Types } from 'mongoose';
import { StudyPlan } from '../models/studyPlan.model';
import { Student } from '../models/student.model';
import { Course } from '../models/course.model';
import { Topic } from '../models/topic.model';
import { AppError } from '../utils/AppError';
import {
  calculatePlanStartDateLagos,
  addDaysToLagosDate,
  getDaysBetweenDates,
  getDayOfWeekName,
  getLagosTodayString,
  deriveNextExamDate,
  validateExamDate,
} from '../utils/dateValidation';
import {
  IStudyPlan,
  IStudyPlanWeek,
  IStudyPlanDay,
  IStudyPlanTask,
  StudyTaskType,
} from '../types/studyPlan.types';

export class StudyPlanService {
  /**
   * Generates a new study plan with a deterministic continuous weekly skeleton.
   * Atomically archives any prior active plan, keeping only the last 3 archives.
   */
  async generatePlan(studentId: string): Promise<any> {
    if (!mongoose.isValidObjectId(studentId)) {
      throw new AppError('Invalid student ID format', 400);
    }

    const student = await Student.findById(studentId).populate('enrolledCourseIds');
    if (!student) {
      throw new AppError('Student not found', 404);
    }

    const enrolledCourses: any[] = student.enrolledCourseIds || [];
    if (enrolledCourses.length === 0) {
      throw new AppError('Student must be enrolled in at least one course to generate a study plan', 400);
    }

    // Parse courseExamDates map
    const rawMap = (student as any).courseExamDates || {};
    const plainDates: Record<string, string> =
      rawMap instanceof Map ? Object.fromEntries(rawMap.entries()) : { ...rawMap };

    // Resolve exam dates per course with legacy fallback
    const resolvedDates: Record<string, string> = {};
    const lagosToday = getLagosTodayString();

    for (const course of enrolledCourses) {
      const cId = course._id.toString();
      if (plainDates[cId] && plainDates[cId] >= lagosToday) {
        resolvedDates[cId] = plainDates[cId];
      } else if (student.nextExamDate && student.nextExamDate >= lagosToday) {
        resolvedDates[cId] = student.nextExamDate;
      }
    }

    // If still no dates available, fallback to 30 days from today
    if (Object.keys(resolvedDates).length === 0) {
      const defaultDate = addDaysToLagosDate(lagosToday, 30);
      for (const course of enrolledCourses) {
        resolvedDates[course._id.toString()] = defaultDate;
      }
    }

    // Compute plan startDate via 18:00 Lagos cutoff rule
    const startDate = calculatePlanStartDateLagos(new Date());

    // Latest exam date determines timeline
    const allExamDates = Object.values(resolvedDates).sort();
    const latestExamDate = allExamDates[allExamDates.length - 1];

    let totalSpanDays = getDaysBetweenDates(startDate, latestExamDate);
    if (totalSpanDays <= 0) {
      totalSpanDays = 7; // Minimum 1 week timeline
    }

    // Enforce 60-day cap
    const effectivePlanDays = Math.min(totalSpanDays, 60);
    const endDate = addDaysToLagosDate(startDate, effectivePlanDays);
    const totalWeeks = Math.max(1, Math.ceil(effectivePlanDays / 7));

    // Fetch topics for enrolled courses to populate rich skeleton tasks
    const enrolledCourseObjectIds = enrolledCourses.map((c) => c._id);
    const courseTopics = await Topic.find({ courseId: { $in: enrolledCourseObjectIds } }).lean();
    const topicsByCourse: Record<string, any[]> = {};
    for (const topic of courseTopics) {
      const cId = topic.courseId.toString();
      if (!topicsByCourse[cId]) topicsByCourse[cId] = [];
      topicsByCourse[cId].push(topic);
    }

    // Construct continuous weekly skeleton
    const weeks: IStudyPlanWeek[] = [];
    let currentWeekStart = startDate;

    for (let w = 1; w <= totalWeeks; w++) {
      const daysUntilEnd = getDaysBetweenDates(currentWeekStart, endDate);
      const weekDaysCount = Math.min(7, daysUntilEnd);
      const currentWeekEnd = addDaysToLagosDate(currentWeekStart, Math.max(0, weekDaysCount - 1));

      const isWeek1 = w === 1;
      const weekDays: IStudyPlanDay[] = [];

      for (let d = 0; d < weekDaysCount; d++) {
        const dayDate = addDaysToLagosDate(currentWeekStart, d);
        const dayName = getDayOfWeekName(dayDate);

        // Only generate tasks for Week 1 immediately; other weeks generated on-demand
        const tasks: IStudyPlanTask[] = isWeek1
          ? this.buildTasksForDay(dayDate, enrolledCourses, resolvedDates, topicsByCourse)
          : [];

        weekDays.push({
          date: dayDate,
          dayName,
          tasks,
        });
      }

      weeks.push({
        weekNumber: w,
        startDate: currentWeekStart,
        endDate: currentWeekEnd,
        status: isWeek1 ? 'READY' : 'NOT_STARTED',
        generatingStartedAt: null,
        summary: `Week ${w}: ${isWeek1 ? 'Foundation & Initial Practice' : 'Scheduled Milestone'}`,
        days: weekDays,
      });

      // Next week starts exactly the calendar day after current week ends (zero gaps)
      currentWeekStart = addDaysToLagosDate(currentWeekEnd, 1);
    }

    // 3. One active plan per student: atomic swap archives the old active plan
    await StudyPlan.updateMany(
      { studentId, status: 'active' },
      { $set: { status: 'archived', archivedReason: 'REPLACED_BY_NEW_PLAN' } }
    );

    // Keep last 3 archived plans only
    const archivedPlans = await StudyPlan.find({ studentId, status: 'archived' })
      .sort({ updatedAt: -1 })
      .select('_id');
    if (archivedPlans.length > 3) {
      const toDelete = archivedPlans.slice(3).map((p) => p._id);
      await StudyPlan.deleteMany({ _id: { $in: toDelete } });
    }

    // Create new active plan
    const newPlan = await StudyPlan.create({
      studentId: new Types.ObjectId(studentId),
      status: 'active',
      startDate,
      endDate,
      totalWeeks,
      examDatesSnapshot: new Map(Object.entries(resolvedDates)),
      skeletonVersion: 1,
      weeks,
    });

    return this.formatPlanResponse(newPlan, resolvedDates);
  }

  /**
   * Helper: Builds daily tasks respecting caps, exam day light revision, and exam date cutoff.
   */
  private buildTasksForDay(
    dayDate: string,
    enrolledCourses: any[],
    examDates: Record<string, string>,
    topicsByCourse: Record<string, any[]>
  ): IStudyPlanTask[] {
    const tasks: IStudyPlanTask[] = [];

    // Filter courses whose exam is on or after dayDate (no course after its exam date)
    const eligibleCourses = enrolledCourses.filter((course) => {
      const examDate = examDates[course._id.toString()];
      return !examDate || dayDate <= examDate;
    });

    if (eligibleCourses.length === 0) {
      return tasks;
    }

    // Rotate through up to 2 courses per day, capped at max 4-6 tasks
    const dayNumber = parseInt(dayDate.replace(/\D/g, ''), 10) || 1;
    const coursesForDay = eligibleCourses.slice(0, 2);

    for (const course of coursesForDay) {
      const cId = course._id.toString();
      const examDate = examDates[cId];
      const isExamDay = examDate === dayDate;
      const courseTopics = topicsByCourse[cId] || [];

      if (isExamDay) {
        // Exam day: light revision only
        tasks.push({
          _id: new Types.ObjectId(),
          courseId: course._id,
          title: `${course.code}: Final Exam Review & Formulas`,
          description: 'Light review of core definitions, high-yield formulas, and exam pacing tips.',
          type: 'REVISION',
          durationMinutes: 30,
          completedAt: null,
        });
      } else {
        const topic = courseTopics[dayNumber % Math.max(1, courseTopics.length)];
        const topicName = topic?.name || 'Core Fundamentals';

        // 1. Focused Study Task
        tasks.push({
          _id: new Types.ObjectId(),
          courseId: course._id,
          topicId: topic?._id,
          title: `${course.code}: ${topicName} Concept Study`,
          description: `Study key lecture notes and exam blueprints for ${topicName}.`,
          type: 'STUDY',
          durationMinutes: 45,
          completedAt: null,
        });

        // 2. Practice Task
        tasks.push({
          _id: new Types.ObjectId(),
          courseId: course._id,
          topicId: topic?._id,
          title: `${course.code}: Adaptive Practice Drill`,
          description: `Attempt 10-15 timed questions on ${topicName}.`,
          type: 'PRACTICE',
          durationMinutes: 30,
          completedAt: null,
        });
      }

      // Hard cap at max 6 tasks per day
      if (tasks.length >= 6) break;
    }

    return tasks.slice(0, 6);
  }

  /**
   * Retrieves the current active plan for a student.
   * Compares examDatesSnapshot to detect whether current student exam dates changed.
   */
  async getActivePlan(studentId: string): Promise<any> {
    if (!mongoose.isValidObjectId(studentId)) {
      throw new AppError('Invalid student ID format', 400);
    }

    const plan = await StudyPlan.findOne({ studentId, status: 'active' });
    if (!plan) {
      return null;
    }

    const student = await Student.findById(studentId);
    const rawMap = (student as any)?.courseExamDates || {};
    const currentDates: Record<string, string> =
      rawMap instanceof Map ? Object.fromEntries(rawMap.entries()) : { ...rawMap };

    // Check if dates are stale
    const snapshotRaw = plan.examDatesSnapshot || new Map();
    const snapshotDates: Record<string, string> =
      snapshotRaw instanceof Map
        ? Object.fromEntries(snapshotRaw.entries())
        : (snapshotRaw && typeof snapshotRaw === 'object' ? { ...(snapshotRaw as any) } : {});

    let isStale = false;
    for (const [cId, date] of Object.entries(currentDates)) {
      if (snapshotDates[cId] !== date) {
        isStale = true;
        break;
      }
    }

    return this.formatPlanResponse(plan, currentDates, isStale);
  }

  /**
   * Retrieves a specific plan by ID, verifying student ownership.
   */
  async getPlanById(studentId: string, planId: string): Promise<any> {
    if (!mongoose.isValidObjectId(planId)) {
      throw new AppError('Invalid plan ID format', 400);
    }

    const plan = await StudyPlan.findById(planId);
    if (!plan) {
      throw new AppError('Study plan not found', 404);
    }

    if (plan.studentId.toString() !== studentId) {
      throw new AppError('Access forbidden: plan belongs to another student', 403);
    }

    return this.formatPlanResponse(plan);
  }

  /**
   * Idempotently sets task completion status.
   * Uses findOneAndUpdate with arrayFilters and studentId guard.
   */
  async updateTaskCompletion(
    studentId: string,
    planId: string,
    taskId: string,
    completed: boolean
  ): Promise<{ completionPercentage: number; completed: boolean; completedAt: Date | null }> {
    if (!mongoose.isValidObjectId(planId)) {
      throw new AppError('Invalid plan ID format', 400);
    }
    if (!mongoose.isValidObjectId(taskId)) {
      throw new AppError('Invalid task ID format', 400);
    }

    const taskObjectId = new Types.ObjectId(taskId);
    const completedAt = completed ? new Date() : null;

    const updated = await StudyPlan.findOneAndUpdate(
      {
        _id: planId,
        studentId: new Types.ObjectId(studentId),
        'weeks.days.tasks._id': taskObjectId,
      },
      {
        $set: {
          'weeks.$[].days.$[].tasks.$[t].completedAt': completedAt,
        },
      },
      {
        arrayFilters: [{ 't._id': taskObjectId }],
        returnDocument: 'after',
      }
    );

    if (!updated) {
      throw new AppError('Task not found or access forbidden', 404);
    }

    const stats = this.computeCompletionStats(updated);
    return {
      completionPercentage: stats.completionPercentage,
      completed,
      completedAt,
    };
  }

  /**
   * On-demand generation for week n.
   */
  async generateWeek(studentId: string, planId: string, weekNumber: number): Promise<any> {
    if (!mongoose.isValidObjectId(planId)) {
      throw new AppError('Invalid plan ID format', 400);
    }

    const plan = await StudyPlan.findOne({ _id: planId, studentId: new Types.ObjectId(studentId) });
    if (!plan) {
      throw new AppError('Study plan not found or access forbidden', 404);
    }

    const weekIndex = plan.weeks.findIndex((w) => w.weekNumber === weekNumber);
    if (weekIndex === -1) {
      throw new AppError(`Week ${weekNumber} does not exist in this plan`, 404);
    }

    const week = plan.weeks[weekIndex];
    if (week.status === 'READY' && week.days.some((d) => d.tasks.length > 0)) {
      return this.formatPlanResponse(plan);
    }

    // Set status to GENERATING
    week.status = 'GENERATING';
    week.generatingStartedAt = new Date();
    await plan.save();

    const student = await Student.findById(studentId).populate('enrolledCourseIds');
    const enrolledCourses: any[] = student?.enrolledCourseIds || [];
    const courseTopics = await Topic.find({ courseId: { $in: enrolledCourses.map((c) => c._id) } }).lean();
    const topicsByCourse: Record<string, any[]> = {};
    for (const topic of courseTopics) {
      const cId = topic.courseId.toString();
      if (!topicsByCourse[cId]) topicsByCourse[cId] = [];
      topicsByCourse[cId].push(topic);
    }

    const rawDates = plan.examDatesSnapshot || new Map();
    const examDates: Record<string, string> =
      rawDates instanceof Map
        ? Object.fromEntries(rawDates.entries())
        : (rawDates && typeof rawDates === 'object' ? { ...(rawDates as any) } : {});

    // Populate week tasks
    for (const day of week.days) {
      day.tasks = this.buildTasksForDay(day.date, enrolledCourses, examDates, topicsByCourse);
    }

    week.status = 'READY';
    week.generatingStartedAt = null;
    week.summary = `Week ${weekNumber}: Focused Topic Drills & Mastery`;
    await plan.save();

    return this.formatPlanResponse(plan);
  }

  /**
   * Retries generating a week if it was stuck in GENERATING (> 2 minutes) or failed.
   */
  async retryWeek(studentId: string, planId: string, weekNumber: number): Promise<any> {
    if (!mongoose.isValidObjectId(planId)) {
      throw new AppError('Invalid plan ID format', 400);
    }

    const plan = await StudyPlan.findOne({ _id: planId, studentId: new Types.ObjectId(studentId) });
    if (!plan) {
      throw new AppError('Study plan not found or access forbidden', 404);
    }

    const week = plan.weeks.find((w) => w.weekNumber === weekNumber);
    if (!week) {
      throw new AppError(`Week ${weekNumber} does not exist in this plan`, 404);
    }

    // If stuck over 2 minutes in GENERATING or NOT_STARTED, reset and regenerate
    if (week.generatingStartedAt) {
      const elapsedMs = Date.now() - new Date(week.generatingStartedAt).getTime();
      if (elapsedMs < 2 * 60 * 1000 && week.status === 'GENERATING') {
        throw new AppError('Week generation is still in progress. Please wait before retrying.', 409);
      }
    }

    return this.generateWeek(studentId, planId, weekNumber);
  }

  /**
   * Formats the plan document for API response:
   * - Converts maps to plain objects
   * - Derives boolean 'completed' from completedAt !== null
   * - Computes completion statistics
   */
  private formatPlanResponse(plan: any, currentDates?: Record<string, string>, isStale = false) {
    const doc = plan.toObject ? plan.toObject() : { ...plan };
    const snapshotRaw = doc.examDatesSnapshot || {};
    const plainSnapshot: Record<string, string> =
      snapshotRaw instanceof Map ? Object.fromEntries(snapshotRaw.entries()) : { ...snapshotRaw };

    let totalTasks = 0;
    let completedTasks = 0;

    const formattedWeeks = (doc.weeks || []).map((week: any) => {
      const formattedDays = (week.days || []).map((day: any) => {
        const formattedTasks = (day.tasks || []).map((task: any) => {
          const isDone = task.completedAt !== null && task.completedAt !== undefined;
          totalTasks++;
          if (isDone) completedTasks++;
          return {
            ...task,
            completed: isDone,
          };
        });
        return {
          ...day,
          tasks: formattedTasks,
        };
      });
      return {
        ...week,
        days: formattedDays,
      };
    });

    const completionPercentage =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      _id: doc._id,
      studentId: doc.studentId,
      status: doc.status,
      startDate: doc.startDate,
      endDate: doc.endDate,
      totalWeeks: doc.totalWeeks,
      skeletonVersion: doc.skeletonVersion || 1,
      examDatesSnapshot: plainSnapshot,
      completionPercentage,
      totalTasks,
      completedTasks,
      stale: isStale,
      weeks: formattedWeeks,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  private computeCompletionStats(plan: any): { totalTasks: number; completedTasks: number; completionPercentage: number } {
    let totalTasks = 0;
    let completedTasks = 0;

    for (const week of plan.weeks || []) {
      for (const day of week.days || []) {
        for (const task of day.tasks || []) {
          totalTasks++;
          if (task.completedAt !== null && task.completedAt !== undefined) {
            completedTasks++;
          }
        }
      }
    }

    const completionPercentage =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return { totalTasks, completedTasks, completionPercentage };
  }
}

export const studyPlanService = new StudyPlanService();
