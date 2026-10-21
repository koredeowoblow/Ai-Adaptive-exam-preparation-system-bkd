import mongoose, { Types } from 'mongoose';
import request from 'supertest';
import app from '../src/app';
import { Student } from '../src/models/student.model';
import { Course } from '../src/models/course.model';
import { Department } from '../src/models/department.model';
import { Topic } from '../src/models/topic.model';
import { StudyPlan } from '../src/models/studyPlan.model';
import { studentService } from '../src/services/student.service';
import { studyPlanService } from '../src/services/studyPlan.service';
import { migrateLegacyExamDates } from '../src/scripts/migrate-legacy-exam-dates';
import {
  calculatePlanStartDateLagos,
  deriveNextExamDate,
  getLagosTodayString,
  addDaysToLagosDate,
  PLAN_START_CUTOFF_HOUR,
} from '../src/utils/dateValidation';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env';

describe('StudyPlan and courseExamDates Suite', () => {
  let studentA: any;
  let studentB: any;
  let tokenA: string;
  let tokenB: string;
  let dept: any;
  let course1: any;
  let course2: any;
  let courseOther: any;
  let topic1: any;
  let topic2: any;

  beforeEach(async () => {
    await StudyPlan.deleteMany({});
    await Student.deleteMany({});
    await Course.deleteMany({});
    await Department.deleteMany({});
    await Topic.deleteMany({});

    dept = await Department.create({
      name: 'Computer Science',
      description: 'Department of Computer Science',
      createdBy: new mongoose.Types.ObjectId(),
    });

    course1 = await Course.create({
      title: 'Data Structures',
      code: 'CSC201',
      departmentId: dept._id,
      level: 200,
    });

    course2 = await Course.create({
      title: 'Database Systems',
      code: 'CSC202',
      departmentId: dept._id,
      level: 200,
    });

    courseOther = await Course.create({
      title: 'General Chemistry',
      code: 'CHM101',
      departmentId: dept._id,
      level: 100,
    });

    topic1 = await Topic.create({
      name: 'Binary Trees',
      courseId: course1._id,
      order: 1,
    });

    topic2 = await Topic.create({
      name: 'Relational Algebra',
      courseId: course2._id,
      order: 1,
    });

    studentA = await Student.create({
      name: 'Student A',
      email: 'studentA@example.com',
      passwordHash: 'hashed_pw',
      departmentId: dept._id,
      level: '200L',
      enrolledCourseIds: [course1._id, course2._id],
      courseExamDates: new Map(),
      isOnboarded: true,
    });

    studentB = await Student.create({
      name: 'Student B',
      email: 'studentB@example.com',
      passwordHash: 'hashed_pw',
      departmentId: dept._id,
      level: '200L',
      enrolledCourseIds: [course1._id],
      courseExamDates: new Map(),
      isOnboarded: true,
    });

    tokenA = jwt.sign({ id: studentA._id.toString(), email: studentA.email, role: 'student' }, env.JWT_SECRET, { expiresIn: '1h' });
    tokenB = jwt.sign({ id: studentB._id.toString(), email: studentB.email, role: 'student' }, env.JWT_SECRET, { expiresIn: '1h' });
  });

  // =========================================================================
  // 1. START-DATE RULE (18:00 LAGOS CUTOFF)
  // =========================================================================
  describe('Start-Date Rule (Africa/Lagos calendar day)', () => {
    it('uses PLAN_START_CUTOFF_HOUR = 18 in one shared place', () => {
      expect(PLAN_START_CUTOFF_HOUR).toBe(18);
    });

    it('returns today when Lagos time is before 18:00', () => {
      // 10:00 AM UTC on 2026-10-21 is 11:00 AM in Lagos (UTC+1) -> before 18:00
      const morningDate = new Date('2026-10-21T10:00:00Z');
      const startDate = calculatePlanStartDateLagos(morningDate);
      expect(startDate).toBe('2026-10-21');
    });

    it('returns tomorrow when Lagos time is at or after 18:00', () => {
      // 18:30 UTC on 2026-10-21 is 19:30 in Lagos (UTC+1) -> after 18:00
      const eveningDate = new Date('2026-10-21T18:30:00Z');
      const startDate = calculatePlanStartDateLagos(eveningDate);
      expect(startDate).toBe('2026-10-22');
    });
  });

  // =========================================================================
  // 2. KEY SAFETY & BULK OVERWRITE
  // =========================================================================
  describe('Key Safety & Bulk Overwrite (PUT /students/course-exam-dates)', () => {
    it('rejects invalid ObjectId courseId format', async () => {
      const res = await request(app)
        .put('/api/v1/students/course-exam-dates')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          'not-an-objectid': '2026-11-20',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Invalid course ID format');
    });

    it('rejects courseId not in student enrolledCourseIds', async () => {
      const unenrolledCourseId = courseOther._id.toString();
      const res = await request(app)
        .put('/api/v1/students/course-exam-dates')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          [unenrolledCourseId]: '2026-11-20',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('not in enrolled courses');
    });

    it('rejects past dates or malformed dates', async () => {
      const res = await request(app)
        .put('/api/v1/students/course-exam-dates')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          [course1._id.toString()]: '2020-01-01',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('past');
    });

    it('accepts valid enrolled course dates and overwrites atomically', async () => {
      const today = getLagosTodayString();
      const date1 = addDaysToLagosDate(today, 15);
      const date2 = addDaysToLagosDate(today, 25);

      const res = await request(app)
        .put('/api/v1/students/course-exam-dates')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          courseExamDates: {
            [course1._id.toString()]: date1,
            [course2._id.toString()]: date2,
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.data.courseExamDates[course1._id.toString()]).toBe(date1);
      expect(res.body.data.courseExamDates[course2._id.toString()]).toBe(date2);
      // Derived nextExamDate is the earliest date (date1)
      expect(res.body.data.nextExamDate).toBe(date1);
    });
  });

  // =========================================================================
  // 3. DERIVED NEXT EXAM & SINGLE SOURCE OF TRUTH
  // =========================================================================
  describe('Derived nextExamDate Calculation', () => {
    it('computes earliest date >= Lagos today', () => {
      const today = getLagosTodayString();
      const date1 = addDaysToLagosDate(today, 10);
      const date2 = addDaysToLagosDate(today, 20);

      const map = {
        [course1._id.toString()]: date2,
        [course2._id.toString()]: date1,
      };

      const next = deriveNextExamDate(map, null, [course1._id, course2._id]);
      expect(next).toBe(date1);
    });

    it('falls back to legacy nextExamDate if courseExamDates is empty', () => {
      const today = getLagosTodayString();
      const legacy = addDaysToLagosDate(today, 12);

      const next = deriveNextExamDate({}, legacy, [course1._id]);
      expect(next).toBe(legacy);
    });

    it('ignores courseExamDates for courses student is not enrolled in', () => {
      const today = getLagosTodayString();
      const earlierDateForUnenrolled = addDaysToLagosDate(today, 5);
      const enrolledDate = addDaysToLagosDate(today, 15);

      const map = {
        [courseOther._id.toString()]: earlierDateForUnenrolled, // unenrolled
        [course1._id.toString()]: enrolledDate, // enrolled
      };

      // Only course1 enrolled
      const next = deriveNextExamDate(map, null, [course1._id]);
      expect(next).toBe(enrolledDate);
    });
  });

  // =========================================================================
  // 4. MIGRATION DRY-RUN
  // =========================================================================
  describe('Legacy Exam Date Migration Script', () => {
    it('runs dry run: matches candidate without mutating database', async () => {
      const futureDate = addDaysToLagosDate(getLagosTodayString(), 20);
      await Student.findByIdAndUpdate(studentA._id, {
        nextExamDate: futureDate,
        courseExamDates: new Map(),
      });

      const dryRun = await migrateLegacyExamDates({ apply: false });
      expect(dryRun.dryRun).toBe(true);
      expect(dryRun.matched).toBeGreaterThanOrEqual(1);
      expect(dryRun.migrated).toBe(0);

      // Verify db document was not mutated
      const doc = await Student.findById(studentA._id);
      expect((doc as any).courseExamDates?.size || 0).toBe(0);
    });

    it('applies migration with apply: true: populates courseExamDates and preserves legacy nextExamDate', async () => {
      const futureDate = addDaysToLagosDate(getLagosTodayString(), 20);
      await Student.findByIdAndUpdate(studentA._id, {
        nextExamDate: futureDate,
        courseExamDates: new Map(),
      });

      const applied = await migrateLegacyExamDates({ apply: true });
      expect(applied.dryRun).toBe(false);
      expect(applied.migrated).toBeGreaterThanOrEqual(1);

      const doc = await Student.findById(studentA._id);
      const map = Object.fromEntries((doc as any).courseExamDates.entries());
      expect(map[course1._id.toString()]).toBe(futureDate);
      expect(map[course2._id.toString()]).toBe(futureDate);
      // Legacy field preserved
      expect(doc?.nextExamDate).toBe(futureDate);
    });
  });

  // =========================================================================
  // 5. STUDYPLAN SCHEMA, GENERATION, 60-DAY CAP & WEEKLY CONTINUITY
  // =========================================================================
  describe('StudyPlan Generation & Scheduling Rules', () => {
    beforeEach(async () => {
      const today = getLagosTodayString();
      await request(app)
        .put('/api/v1/students/course-exam-dates')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          courseExamDates: {
            [course1._id.toString()]: addDaysToLagosDate(today, 14),
            [course2._id.toString()]: addDaysToLagosDate(today, 28),
          },
        });
    });

    it('generates study plan with continuous weekly skeleton and Week 1 ready', async () => {
      const res = await request(app)
        .post('/api/v1/study-plans/generate')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(201);
      const plan = res.body.data.plan;
      expect(plan.status).toBe('active');
      expect(plan.weeks.length).toBeGreaterThanOrEqual(4);

      // Week 1 is READY and has tasks
      expect(plan.weeks[0].status).toBe('READY');
      expect(plan.weeks[0].days[0].tasks.length).toBeGreaterThan(0);

      // Subsequent weeks are NOT_STARTED
      expect(plan.weeks[1].status).toBe('NOT_STARTED');

      // Weekly continuity: each week n+1 starts on the day after week n ends
      for (let i = 0; i < plan.weeks.length - 1; i++) {
        const currentWeekEnd = plan.weeks[i].endDate;
        const nextWeekStart = plan.weeks[i + 1].startDate;
        const expectedNextStart = addDaysToLagosDate(currentWeekEnd, 1);
        expect(nextWeekStart).toBe(expectedNextStart);
      }
    });

    it('caps study plan to 60 days when exam is beyond 60 days', async () => {
      const today = getLagosTodayString();
      // Set exam 90 days out
      await request(app)
        .put('/api/v1/students/course-exam-dates')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          courseExamDates: {
            [course1._id.toString()]: addDaysToLagosDate(today, 90),
          },
        });

      const res = await request(app)
        .post('/api/v1/study-plans/generate')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(201);
      const plan = res.body.data.plan;
      const days = (new Date(plan.endDate).getTime() - new Date(plan.startDate).getTime()) / (1000 * 60 * 60 * 24);
      expect(days).toBeLessThanOrEqual(60);
    });

    it('limits tasks per day to max 6', async () => {
      const res = await request(app)
        .post('/api/v1/study-plans/generate')
        .set('Authorization', `Bearer ${tokenA}`);

      const plan = res.body.data.plan;
      for (const day of plan.weeks[0].days) {
        expect(day.tasks.length).toBeLessThanOrEqual(6);
      }
    });

    it('schedules exam day as light revision only and never schedules a course after its exam date', async () => {
      const today = getLagosTodayString();
      const examDateCourse1 = addDaysToLagosDate(today, 2);

      await request(app)
        .put('/api/v1/students/course-exam-dates')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          courseExamDates: {
            [course1._id.toString()]: examDateCourse1,
            [course2._id.toString()]: addDaysToLagosDate(today, 20),
          },
        });

      const res = await request(app)
        .post('/api/v1/study-plans/generate')
        .set('Authorization', `Bearer ${tokenA}`);

      const plan = res.body.data.plan;
      const examDay = plan.weeks[0].days.find((d: any) => d.date === examDateCourse1);
      if (examDay) {
        const c1Tasks = examDay.tasks.filter((t: any) => t.courseId === course1._id.toString());
        for (const t of c1Tasks) {
          expect(t.type).toBe('REVISION');
        }
      }

      // Day after exam date: course1 must NOT appear in tasks
      const dayAfterExam = addDaysToLagosDate(examDateCourse1, 1);
      const nextDayObj = plan.weeks[0].days.find((d: any) => d.date === dayAfterExam);
      if (nextDayObj) {
        const c1AfterTasks = nextDayObj.tasks.filter((t: any) => t.courseId === course1._id.toString());
        expect(c1AfterTasks.length).toBe(0);
      }
    });

    it('enforces one active plan: atomic swap archives old plan and retains last 3 archives', async () => {
      // Generate 5 plans in succession
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/v1/study-plans/generate')
          .set('Authorization', `Bearer ${tokenA}`);
      }

      // Exactly 1 active plan
      const activePlans = await StudyPlan.find({ studentId: studentA._id, status: 'active' });
      expect(activePlans.length).toBe(1);

      // Max 3 archived plans retained
      const archivedPlans = await StudyPlan.find({ studentId: studentA._id, status: 'archived' });
      expect(archivedPlans.length).toBeLessThanOrEqual(3);
    });
  });

  // =========================================================================
  // 6. TASK COMPLETION & IDEMPOTENCY
  // =========================================================================
  describe('Task Completion (PUT /study-plans/:planId/tasks/:taskId)', () => {
    it('idempotently marks task completed and calculates completion percentage', async () => {
      const genRes = await request(app)
        .post('/api/v1/study-plans/generate')
        .set('Authorization', `Bearer ${tokenA}`);

      const plan = genRes.body.data.plan;
      const taskId = plan.weeks[0].days[0].tasks[0]._id;

      // 1. Mark completed = true
      const completeRes = await request(app)
        .put(`/api/v1/study-plans/${plan._id}/tasks/${taskId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ completed: true });

      expect(completeRes.status).toBe(200);
      expect(completeRes.body.data.completed).toBe(true);
      expect(completeRes.body.data.completionPercentage).toBeGreaterThan(0);

      // 2. Mark completed = true again (idempotent, percentage unchanged)
      const repeatRes = await request(app)
        .put(`/api/v1/study-plans/${plan._id}/tasks/${taskId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ completed: true });

      expect(repeatRes.status).toBe(200);
      expect(repeatRes.body.data.completionPercentage).toBe(completeRes.body.data.completionPercentage);

      // 3. Mark completed = false (unmark)
      const unmarkRes = await request(app)
        .put(`/api/v1/study-plans/${plan._id}/tasks/${taskId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ completed: false });

      expect(unmarkRes.status).toBe(200);
      expect(unmarkRes.body.data.completed).toBe(false);
      expect(unmarkRes.body.data.completionPercentage).toBe(0);
    });
  });

  // =========================================================================
  // 7. STALE PLAN DETECTION & ON-DEMAND WEEKS
  // =========================================================================
  describe('Stale Plan Detection & On-Demand Weeks', () => {
    it('detects stale plan when student course exam dates change after generation', async () => {
      const today = getLagosTodayString();
      await request(app)
        .put('/api/v1/students/course-exam-dates')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          courseExamDates: {
            [course1._id.toString()]: addDaysToLagosDate(today, 20),
          },
        });

      const genRes = await request(app)
        .post('/api/v1/study-plans/generate')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(genRes.body.data.plan.stale).toBe(false);

      // Now change exam date
      await request(app)
        .put('/api/v1/students/course-exam-dates')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          courseExamDates: {
            [course1._id.toString()]: addDaysToLagosDate(today, 25),
          },
        });

      // GET /study-plans/active must flag stale: true
      const activeRes = await request(app)
        .get('/api/v1/study-plans/active')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(activeRes.status).toBe(200);
      expect(activeRes.body.data.plan.stale).toBe(true);
    });

    it('generates next week on demand (POST /study-plans/:planId/weeks/:n/generate)', async () => {
      const genRes = await request(app)
        .post('/api/v1/study-plans/generate')
        .set('Authorization', `Bearer ${tokenA}`);

      const plan = genRes.body.data.plan;
      expect(plan.weeks[1].status).toBe('NOT_STARTED');

      const weekRes = await request(app)
        .post(`/api/v1/study-plans/${plan._id}/weeks/2/generate`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(weekRes.status).toBe(200);
      expect(weekRes.body.data.plan.weeks[1].status).toBe('READY');
      expect(weekRes.body.data.plan.weeks[1].days[0].tasks.length).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // 8. AUTHORIZATION & LEVEL PROMOTION
  // =========================================================================
  describe('Authorization & Level Promotion', () => {
    it('prevents Student B from viewing or modifying Student A study plan', async () => {
      const genRes = await request(app)
        .post('/api/v1/study-plans/generate')
        .set('Authorization', `Bearer ${tokenA}`);

      const plan = genRes.body.data.plan;
      const taskId = plan.weeks[0].days[0].tasks[0]._id;

      // Student B attempts to read Student A plan
      const getRes = await request(app)
        .get(`/api/v1/study-plans/${plan._id}`)
        .set('Authorization', `Bearer ${tokenB}`);
      expect(getRes.status).toBe(403);

      // Student B attempts to update task in Student A plan
      const putRes = await request(app)
        .put(`/api/v1/study-plans/${plan._id}/tasks/${taskId}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ completed: true });
      expect(putRes.status).toBe(404);
    });

    it('level promotion archives the active study plan', async () => {
      // 1. Create active plan for student A
      await request(app)
        .post('/api/v1/study-plans/generate')
        .set('Authorization', `Bearer ${tokenA}`);

      // Verify active plan exists
      let active = await StudyPlan.findOne({ studentId: studentA._id, status: 'active' });
      expect(active).not.toBeNull();

      // Create 300L course in department for valid promotion
      await Course.create({
        title: 'Advanced Algorithms',
        code: 'CSC301',
        departmentId: dept._id,
        level: 300,
      });

      // 2. Promote student A to 300L
      await studentService.promoteStudent(studentA._id.toString(), {
        targetLevel: '300L',
        nextExamDate: addDaysToLagosDate(getLagosTodayString(), 60),
      });

      // 3. Active plan must now be archived with reason LEVEL_PROMOTION
      active = await StudyPlan.findOne({ studentId: studentA._id, status: 'active' });
      expect(active).toBeNull();

      const archived = await StudyPlan.findOne({ studentId: studentA._id, status: 'archived', archivedReason: 'LEVEL_PROMOTION' });
      expect(archived).not.toBeNull();
    });
  });
});
