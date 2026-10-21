import mongoose from 'mongoose';
import { PracticeSession } from '../src/models/practice.model';
import { Student } from '../src/models/student.model';
import { Course } from '../src/models/course.model';
import { Department } from '../src/models/department.model';
import { Topic } from '../src/models/topic.model';
import { Question } from '../src/models/question.model';
import { groqProvider } from '../src/providers/groq.provider';
import { processExamJob, examConnection, examQueue } from '../src/jobs/exam.job';
import { practiceService } from '../src/services/practice.service';

describe('Grading Resilience and Fault-Tolerant Finalization', () => {
  let studentId: string;
  let courseId: string;
  let topicId: string;
  let questionIds: string[] = [];
  let questions: any[] = [];

  beforeAll(async () => {
    // Ensure mock redis configuration
    process.env.REDIS_HOST = 'mock';

    const dummyAdminId = new mongoose.Types.ObjectId();

    const dept = await Department.create({
      name: 'Resilience Engineering Dept',
      createdBy: dummyAdminId,
    });

    const course = await Course.create({
      departmentId: dept._id,
      code: 'RES901',
      title: 'Fault-Tolerant Distributed Systems',
      level: 400,
    });
    courseId = course._id.toString();

    const topic = await Topic.create({
      name: 'Resilience Patterns',
      courseId: course._id,
      order: 1,
    });
    topicId = topic._id.toString();

    const student = await Student.create({
      name: 'Resilience Test Student',
      email: `resilience_${Date.now()}@example.com`,
      passwordHash: 'HashedPassword123!',
      departmentId: dept._id,
      enrolledCourseIds: [course._id],
      level: '400L',
    });
    studentId = (student as any)._id.toString();

    // Create 5 Theory Questions
    for (let i = 1; i <= 5; i++) {
      const q = await Question.create({
        topicId: topic._id,
        questionText: `Explain resilience property number ${i} in distributed consensus.`,
        type: 'THEORY',
        explanation: `Comprehensive explanation of consensus resilience property ${i}.`,
        modelAnswer: `Model answer for resilience property ${i}`,
        rubric: [
          { point: 'Identifies failure detector correctly', weight: 0.5 },
          { point: 'Explains recovery mechanism accurately', weight: 0.5 },
        ],
        eloRating: 1200,
      });
      questionIds.push((q as any)._id.toString());
      questions.push(q);
    }
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  let testSessionId: string;

  it('1 of 5 answers times out (other 4 graded, session not FAILED)', async () => {
    // 1. Setup session with 5 theory questions
    const served = questions.map((q, idx) => ({
      submissionId: `sub_${idx}_${Date.now()}`,
      questionId: (q as any)._id,
      topicId: q.topicId,
      difficulty: 1,
      writtenAnswer: `Student theory submission for question ${idx + 1}`,
      gradingStatus: 'PENDING' as const,
    }));

    const session = await PracticeSession.create({
      studentId: new mongoose.Types.ObjectId(studentId),
      courseId: new mongoose.Types.ObjectId(courseId),
      questionsServed: served,
      totalQuestions: 5,
      questionsAnswered: 5,
      status: 'PENDING_GRADING',
      mode: 'quick',
    });
    testSessionId = (session as any)._id.toString();

    // 2. Mock groqProvider.gradeTheoryAnswer:
    // Questions 1-4 succeed, Question 5 times out / rejects
    jest.spyOn(groqProvider, 'gradeTheoryAnswer').mockImplementation(async (qText: string) => {
      if (qText.includes('number 5')) {
        throw new Error('Groq AI grading timeout after 30000ms (attempt failed)');
      }
      return { score: 0.85, feedback: 'Strong response covering rubric points.' };
    });

    const answersPayload = questions.map((q, idx) => ({
      questionId: q._id.toString(),
      writtenAnswer: `Student theory submission for question ${idx + 1}`,
      timeTaken: 25,
    }));

    // Process the exam job
    const result = await processExamJob({
      data: {
        sessionId: testSessionId,
        studentId,
        answers: answersPayload,
      },
    });

    expect(result.status).toBe('PENDING_GRADING');

    // Verify session state in database
    const updated = await PracticeSession.findById(testSessionId);
    expect(updated).not.toBeNull();
    // Session MUST stay PENDING_GRADING, not FAILED
    expect(updated!.status).toBe('PENDING_GRADING');

    // 4 items graded successfully
    const graded = updated!.questionsServed.filter((q) => q.gradingStatus === 'GRADED');
    expect(graded.length).toBe(4);
    for (const g of graded) {
      expect(g.score).toBe(0.85);
      expect(g.correct).toBe(true);
    }

    // 1 item timed out -> gradingStatus 'FAILED', written answer preserved, score not set to 0
    const failed = updated!.questionsServed.find((q) => q.gradingStatus === 'FAILED');
    expect(failed).toBeDefined();
    expect(failed!.writtenAnswer).toBe('Student theory submission for question 5');
    expect(failed!.score).toBeUndefined(); // Score NOT set to 0
    expect(failed!.correct).toBeUndefined();

    // Verify student-facing API explicitly returns status 'PENDING_GRADING' and null score
    const studentFacing = await practiceService.getSession(testSessionId, {
      id: studentId,
      role: 'student',
    });
    expect(studentFacing.session.status).toBe('PENDING_GRADING');
    expect(studentFacing.session.isGradingPending).toBe(true);
    expect(studentFacing.session.score).toBeNull(); // Never final 0%
  });

  it('requeue completes it', async () => {
    // Mock groqProvider so that Question 5 now succeeds
    jest.spyOn(groqProvider, 'gradeTheoryAnswer').mockResolvedValue({
      score: 0.95,
      feedback: 'Excellent answer on consensus recovery.',
    });

    // Mock examQueue.add to route to processExamJob in test environment
    jest.spyOn(examQueue, 'add').mockImplementation(async (...args: any[]) => {
      return processExamJob({ data: args[1] });
    });

    // Requeue failed grading
    const requeueRes = await practiceService.requeueFailedGrading(testSessionId, studentId);
    expect(requeueRes.requeued).toBe(true);
    expect(requeueRes.uncompletedCount).toBe(1); // Only the 1 failed question was picked up

    // Verify session is now completed
    const finalized = await PracticeSession.findById(testSessionId);
    expect(finalized).not.toBeNull();
    expect(finalized!.status).toBe('completed');
    expect(finalized!.questionsServed.every((q) => q.gradingStatus === 'GRADED')).toBe(true);
    expect(finalized!.score).toBe(100); // All 5 correct -> 100%
    expect(finalized!.correctAnswers).toBe(5);
  });

  it('double requeue does not double finalize', async () => {
    const finalizedBefore = await PracticeSession.findById(testSessionId);
    const completedAtBefore = finalizedBefore!.endedAt;
    const scoreBefore = finalizedBefore!.score;

    // Call requeue a second time on the already completed session
    const doubleRequeueRes = await practiceService.requeueFailedGrading(testSessionId, studentId);

    expect(doubleRequeueRes.requeued).toBe(false);
    expect(doubleRequeueRes.message).toBe('Session is already completed');

    const finalizedAfter = await PracticeSession.findById(testSessionId);
    expect(finalizedAfter!.status).toBe('completed');
    expect(finalizedAfter!.score).toBe(scoreBefore);
    expect(finalizedAfter!.endedAt?.getTime()).toBe(completedAtBefore?.getTime());
  });

  it('concurrent finalize attempts produce one finalization', async () => {
    // Create a new session in PENDING_GRADING with 5 already graded questions
    const gradedItems = questions.map((q, idx) => ({
      submissionId: `conc_${idx}_${Date.now()}`,
      questionId: (q as any)._id,
      topicId: q.topicId,
      difficulty: 1,
      writtenAnswer: `Answer ${idx + 1}`,
      gradingStatus: 'GRADED' as const,
      correct: true,
      score: 1.0,
    }));

    const session = await PracticeSession.create({
      studentId: new mongoose.Types.ObjectId(studentId),
      courseId: new mongoose.Types.ObjectId(courseId),
      questionsServed: gradedItems,
      totalQuestions: 5,
      questionsAnswered: 5,
      correctAnswers: 5,
      status: 'PENDING_GRADING',
      mode: 'quick',
    });
    const concSessionId = (session as any)._id.toString();

    // Fire 5 concurrent atomic guarded finalization queries
    const attempts = Array.from({ length: 5 }, (_, i) =>
      PracticeSession.findOneAndUpdate(
        { _id: concSessionId, status: 'PENDING_GRADING' },
        {
          $set: {
            status: 'completed',
            score: 100,
            endedAt: new Date(),
          },
        },
        { returnDocument: 'after' }
      )
    );

    const results = await Promise.all(attempts);

    // Exactly 1 attempt should successfully match and return the updated doc
    const successful = results.filter((doc) => doc !== null);
    const unsuccessful = results.filter((doc) => doc === null);

    expect(successful.length).toBe(1);
    expect(unsuccessful.length).toBe(4);
    expect(successful[0]!.status).toBe('completed');

    // Confirm DB has status 'completed'
    const finalDbState = await PracticeSession.findById(concSessionId);
    expect(finalDbState!.status).toBe('completed');
  });

  it('dedup key is released after failure', async () => {
    const dummySessionId = new mongoose.Types.ObjectId().toString();
    const jobDedupKey = `exam:job:finalize:${dummySessionId}`;

    // Test Case A: Job fails due to nonexistent session
    try {
      await processExamJob({
        data: {
          sessionId: dummySessionId,
          studentId,
          answers: [],
        },
      });
    } catch (err: any) {
      expect(err.message).toContain('not found');
    }

    // Dedup key must be released in failure path
    const keyAfterFailure = await examConnection.get(jobDedupKey);
    expect(keyAfterFailure).toBeNull();

    // Verify key can be acquired again immediately
    const acquireResult = await examConnection.setnx(jobDedupKey, '1');
    expect(acquireResult).toBe(1);
    await examConnection.del(jobDedupKey);

    // Test Case B: When session is not finalized (stays PENDING_GRADING), dedup key is released
    const partialSession = await PracticeSession.create({
      studentId: new mongoose.Types.ObjectId(studentId),
      courseId: new mongoose.Types.ObjectId(courseId),
      questionsServed: [
        {
          submissionId: `part_${Date.now()}`,
          questionId: (questions[0] as any)._id,
          topicId: questions[0].topicId,
          difficulty: 1,
          writtenAnswer: 'Failing answer',
          gradingStatus: 'PENDING' as const,
        },
      ],
      totalQuestions: 1,
      questionsAnswered: 1,
      status: 'PENDING_GRADING',
      mode: 'quick',
    });

    jest.spyOn(groqProvider, 'gradeTheoryAnswer').mockRejectedValue(new Error('AI grading error'));

    const partialKey = `exam:job:finalize:${partialSession._id.toString()}`;
    await processExamJob({
      data: {
        sessionId: partialSession._id.toString(),
        studentId,
        answers: [{ questionId: questions[0]._id.toString(), writtenAnswer: 'Failing answer' }],
      },
    });

    const keyAfterPartial = await examConnection.get(partialKey);
    // Key must be released so requeue can run!
    expect(keyAfterPartial).toBeNull();
  });
});
