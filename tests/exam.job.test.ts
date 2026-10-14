import mongoose from 'mongoose';
import { processExamJob, examConnection } from '../src/jobs/exam.job';
import { PracticeSession } from '../src/models/practice.model';
import { Department } from '../src/models/department.model';
import { Course } from '../src/models/course.model';
import { Topic } from '../src/models/topic.model';
import { Question } from '../src/models/question.model';
import { Student } from '../src/models/student.model';
import { Role } from '../src/models/role.model';

describe('Exam Job Finalization & SETNX Deduplication Tests', () => {
  let student: any;
  let course: any;
  let topic: any;
  let question: any;

  beforeAll(async () => {
    const role = await Role.create({
      name: 'Student Job Role',
      slug: `student-job-${Date.now()}`,
      description: 'Job test role',
      isSystem: false,
      permissionIds: [],
    });

    student = await Student.create({
      name: 'Exam Job Student',
      email: `examjob_${Date.now()}@test.com`,
      passwordHash: 'dummyhash',
      roleIds: [role._id],
    });

    const department = await Department.create({
      name: `Exam Job Dept ${Date.now()}`,
      description: 'Job test department',
      createdBy: student._id,
    });

    course = await Course.create({
      title: 'Exam Job Course',
      code: `EJC${Date.now()}`.slice(0, 8),
      departmentId: department._id,
    });

    topic = await Topic.create({
      name: 'Exam Job Topic',
      courseId: course._id,
    });

    question = await Question.create({
      topicId: topic._id,
      questionText: 'What is 2 + 2 in exam job test?',
      options: [
        { id: 'A', text: '3' },
        { id: 'B', text: '4' },
      ],
      correctAnswer: 'B',
      explanation: '2 + 2 = 4',
      eloRating: 1000,
    });
  });

  it('should process exam job successfully on first run and intercept duplicate on second run via SETNX', async () => {
    const submissionId = new mongoose.Types.ObjectId().toString();
    const session = await PracticeSession.create({
      studentId: student._id,
      courseId: course._id,
      status: 'active',
      totalQuestions: 1,
      questionsServed: [
        {
          submissionId,
          questionId: question._id,
          topicId: topic._id,
          difficulty: question.eloRating,
          presentedAt: new Date(),
        },
      ],
      correctAnswers: 0,
      questionsAnswered: 0,
    });

    const jobData = {
      sessionId: (session as any)._id.toString(),
      studentId: student._id.toString(),
      answers: [
        {
          questionId: question._id.toString(),
          selectedAnswer: 'B',
          timeTaken: 12,
        },
      ],
    };

    // 1. First execution: should acquire SETNX dedup lock and succeed
    const firstResult = await processExamJob({ data: jobData });
    expect(firstResult).toEqual({ status: 'SUCCESS' });

    // Verify session updated to completed in database
    const updatedSession = await PracticeSession.findById((session as any)._id);
    expect(updatedSession?.status).toBe('completed');

    // 2. Second execution (duplicate/ghost job): should be intercepted by SETNX
    const secondResult = await processExamJob({ data: jobData });
    expect(secondResult).toEqual({ status: 'IGNORED_GHOST_JOB' });
  });

  it('should return ALREADY_FINALIZED if session is already completed and dedup key is cleared', async () => {
    const session = await PracticeSession.create({
      studentId: student._id,
      courseId: course._id,
      status: 'completed',
      totalQuestions: 1,
      questionsServed: [],
      correctAnswers: 0,
      questionsAnswered: 0,
    });

    // Clear any dedup key in redis to simulate session check without dedup hit
    await examConnection.del(`exam:job:finalize:${(session as any)._id.toString()}`);

    const jobData = {
      sessionId: (session as any)._id.toString(),
      studentId: student._id.toString(),
      answers: [],
    };

    const result = await processExamJob({ data: jobData });
    expect(result).toEqual({ status: 'ALREADY_FINALIZED' });
  });
});
