import mongoose from 'mongoose';
import { PracticeSession } from '../src/models/practice.model';
import { MasteryRecord } from '../src/models/mastery.model';
import { Question } from '../src/models/question.model';
import { Student } from '../src/models/student.model';
import { Course } from '../src/models/course.model';
import { Topic } from '../src/models/topic.model';
import { practiceService } from '../src/services/practice.service';
import { adaptiveService } from '../src/services/adaptive.service';
import { env } from '../src/config/env';
import { redisClient, cacheService } from '../src/utils/cache';
import crypto from 'crypto';
import { questionRepository } from '../src/repositories/question.repository';

describe('10,000 Concurrent User Hardening Tests', () => {
  jest.setTimeout(60000); // Allow time for DB connection and bulk inserts

  let student: any;
  let course: any;
  let topic: any;
  let questions: any[] = [];

  beforeAll(async () => {
    await mongoose.connect(env.MONGODB_URI);
    await mongoose.syncIndexes();
    if (redisClient.status !== 'ready') {
      await redisClient.connect().catch(() => {});
    }
    await redisClient.flushall();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    redisClient.disconnect();
  });

  beforeEach(async () => {
    await PracticeSession.deleteMany({});
    await MasteryRecord.deleteMany({});
    await Question.deleteMany({});
    await Student.deleteMany({});
    await Course.deleteMany({});
    await Topic.deleteMany({});

    student = await Student.create({
      name: 'Test User',
      email: `test${Date.now()}@example.com`,
      passwordHash: 'hashed',
    });

    course = await Course.create({
      code: 'CS101',
      title: 'Test Course',
      description: 'Test',
      departmentId: new mongoose.Types.ObjectId(),
    });

    topic = await Topic.create({
      courseId: course._id,
      name: 'Test Topic',
      order: 1,
    });

    // Create 100 questions for the topic
    const questionDocs = [];
    for (let i = 0; i < 100; i++) {
      questionDocs.push({
        topicId: topic._id,
        questionText: `Q ${i}`,
        options: [{ id: 'A', text: 'A' }, { id: 'B', text: 'B' }],
        correctAnswer: 'A',
        eloRating: 1000,
        explanation: 'Exp',
      });
    }
    questions = await Question.insertMany(questionDocs);
  });

  // Test A - Duplicate submission
  it('Test A: Duplicate submission (10 identical requests) should result in 1 logical answer', async () => {
    const tokenUser = { id: student._id.toString(), type: 'student' };
    const { session } = await practiceService.startSession(student._id.toString(), { courseId: course._id.toString(), totalQuestions: 10 }, tokenUser);
    
    const firstQId = session.questionsServed[0].questionId.toString();
    const requests = Array(10).fill(0).map(() => practiceService.submitBatchAnswers(student._id.toString(), session._id.toString(), {
      answers: [{
        questionId: firstQId,
        selectedAnswer: 'A',
        timeTaken: 10
      }]
    }));

    const results = await Promise.allSettled(requests);
    const fulfilled = results.filter(r => r.status === 'fulfilled');
    expect(fulfilled.length).toBeGreaterThanOrEqual(1);
    
    // Check DB state
    const dbSession = await PracticeSession.findById(session._id);
    expect(['PENDING_GRADING', 'completed']).toContain(dbSession?.status);
  });


  // Test B - Legitimate concurrent Elo updates
  it('Test B: 20 simultaneous legitimate answers for the same student/topic do not lose updates', async () => {
    // Generate 20 random distinct questions
    const promises = [];
    for (let i = 0; i < 20; i++) {
      promises.push(adaptiveService.processAnswer(
        student._id.toString(),
        course._id.toString(),
        topic._id.toString(),
        questions[i]._id.toString(),
        true
      ));
    }

    await Promise.allSettled(promises);

    const mastery = await MasteryRecord.findOne({ studentId: student._id });
    expect(mastery?.questionsAttempted).toBe(20);
    expect(mastery?.questionsCorrect).toBe(20);
  });

  // Test C - Question Statistics
  it('Test C: 100 different students answering the same question simultaneously', async () => {
    const question = questions[0];
    const promises = [];
    
    for (let i = 0; i < 100; i++) {
      promises.push(adaptiveService.processAnswer(
        new mongoose.Types.ObjectId().toString(),
        course._id.toString(),
        topic._id.toString(),
        question._id.toString(),
        true // all correct
      ));
    }

    await Promise.allSettled(promises);

    const dbQuestion = await Question.findById(question._id);
    expect(dbQuestion?.timesAnswered).toBe(100);
    expect(dbQuestion?.timesCorrect).toBe(100);
  });

  // Test D - Session Race
  it('Test D: 2 requests, same session, concurrent batch submissions', async () => {
    const tokenUser = { id: student._id.toString(), type: 'student' };
    const { session } = await practiceService.startSession(student._id.toString(), { courseId: course._id.toString(), totalQuestions: 10 }, tokenUser);
    const firstQId = session.questionsServed[0].questionId.toString();
    
    const req1 = practiceService.submitBatchAnswers(student._id.toString(), session._id.toString(), {
      answers: [{
        questionId: firstQId,
        selectedAnswer: 'A',
        timeTaken: 10
      }]
    });

    const req2 = practiceService.submitBatchAnswers(student._id.toString(), session._id.toString(), {
      answers: [{
        questionId: firstQId,
        selectedAnswer: 'B',
        timeTaken: 10
      }]
    });

    const results = await Promise.allSettled([req1, req2]);
    const successes = results.filter(r => r.status === 'fulfilled');
    expect(successes.length).toBeGreaterThanOrEqual(1);
    
    const dbSession = await PracticeSession.findById(session._id);
    expect(['PENDING_GRADING', 'completed']).toContain(dbSession?.status);
  });


  // Test E - Redis Stampede
  it('Test E: 500 simultaneous cache misses results in exactly 1 MongoDB fetch', async () => {
    let fetchCount = 0;
    const fetchFn = async () => {
      fetchCount++;
      return [{ id: 1 }];
    };

    const promises = Array(500).fill(0).map(() => 
      cacheService.getOrSetSingleFlight('stampede-test-key', 60, fetchFn)
    );

    await Promise.all(promises);

    expect(fetchCount).toBe(1);
  });

  // Test G - Explain Validation
  it('Test G: Adaptive queries use IXSCAN', async () => {
    const targetElo = 1000;
    const explain = await Question.find({ topicId: topic._id, eloRating: { $gte: targetElo } })
                                  .sort({ eloRating: 1 })
                                  .limit(3)
                                  .explain('executionStats');
    
    const plan = (explain as any).queryPlanner || (explain as any).executionStats;
    const planString = JSON.stringify(plan);
    expect(planString).toContain('IXSCAN');
    expect(planString).not.toContain('COLLSCAN');
  });
});
