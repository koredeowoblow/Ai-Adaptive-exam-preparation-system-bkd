import mongoose from 'mongoose';
import request from 'supertest';
import app from '../src/app';
import { connectDatabase } from '../src/config/db';
import { Student } from '../src/models/student.model';
import { Department } from '../src/models/department.model';
import { Course } from '../src/models/course.model';
import { Topic } from '../src/models/topic.model';
import { Question } from '../src/models/question.model';
import { PracticeSession } from '../src/models/practice.model';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env';

describe('Security Hardening & Breach Prevention Test Suite', () => {
  let adminToken: string;
  let studentToken: string;
  let studentId: string;
  let testCourseId: string;
  let testTopicId: string;
  let sampleQuestionId: string;

  beforeAll(async () => {
    await connectDatabase();
    await mongoose.syncIndexes();

    const admin = await Student.create({
      name: 'System Admin',
      email: 'sec-admin@university.edu',
      passwordHash: 'hashed',
    });
    adminToken = jwt.sign(
      { id: admin._id.toString(), type: 'admin', role: 'admin' },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const student = await Student.create({
      name: 'Undergrad Student',
      email: 'student@university.edu',
      passwordHash: 'hashed',
    });
    studentId = student._id.toString();
    studentToken = jwt.sign(
      { id: studentId, type: 'student', role: 'student' },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const department = await Department.create({
      name: 'Cybersecurity & Networks',
      createdBy: admin._id,
    });

    const course = await Course.create({
      code: 'SEC401',
      title: 'Network Security & Cryptography',
      description: 'Applied cryptography and attack vectors',
      departmentId: department._id,
    });
    testCourseId = course._id.toString();

    const topic = await Topic.create({
      name: 'Public Key Cryptography',
      courseId: course._id,
    });
    testTopicId = topic._id.toString();

    const question = await (Question as any).create({
      type: 'THEORY',
      topicId: topic._id,
      questionText: 'Analyze RSA padding oracle attacks.',
      difficulty: 6,
      eloRating: 1400,
      hasSubParts: true,
      subParts: [
        {
          id: 'sp_1',
          label: '1(a)',
          prompt: 'Define Bleichenbacher padding oracle attack.',
          maxMarks: 5,
          modelAnswer: 'TOP_SECRET_MODEL_ANSWER_BLEICHENBACHER',
          rubric: [{ point: 'Identifies chosen-ciphertext nature', weight: 5 }],
          order: 0,
        },
      ],
    });
    sampleQuestionId = (question as any)._id.toString();
  });

  afterAll(async () => {
    await Student.deleteMany({});
    await Department.deleteMany({});
    await Course.deleteMany({});
    await Topic.deleteMany({});
    await Question.deleteMany({});
    await PracticeSession.deleteMany({});
    await mongoose.connection.close();
  });

  describe('1. Question Bank Authorization (OWASP API1 / API5)', () => {
    it('should deny ordinary students from calling GET /api/v1/questions', async () => {
      const res = await request(app)
        .get('/api/v1/questions')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should deny ordinary students from querying questions by topic', async () => {
      const res = await request(app)
        .get(`/api/v1/questions/topic/${testTopicId}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
    });

    it('should deny ordinary students from accessing direct question detail by ID', async () => {
      const res = await request(app)
        .get(`/api/v1/questions/${sampleQuestionId}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
    });

    it('should allow authorized admin to query questions', async () => {
      const res = await request(app)
        .get(`/api/v1/questions/${sampleQuestionId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data._id).toBe(sampleQuestionId);
    });
  });

  describe('2. Anti-Cheat & Integrity Audit Logs Protection', () => {
    it('should forbid ordinary students from inspecting overall integrity logs', async () => {
      const res = await request(app)
        .get('/api/v1/integrity')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
    });

    it('should forbid ordinary students from inspecting other students integrity logs', async () => {
      const otherStudentId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .get(`/api/v1/integrity/student/${otherStudentId}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
    });

    it('should allow staff/admin with student.read to inspect integrity logs', async () => {
      const res = await request(app)
        .get('/api/v1/integrity')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });
  });

  describe('3. Active Exam / Practice Session Answer Leakage Prevention', () => {
    it('should strip sub-part modelAnswer and rubric when student fetches active session', async () => {
      const session = await PracticeSession.create({
        studentId,
        courseId: testCourseId,
        status: 'active',
        questionsServed: [
          {
            submissionId: 'sub_test_001',
            questionId: sampleQuestionId,
            topicId: testTopicId,
            difficulty: 6,
          },
        ],
      });

      const res = await request(app)
        .get(`/api/v1/practice-sessions/${session._id}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      const servedQ = res.body.data.session.questionsServed[0].questionId;
      expect(servedQ.hasSubParts).toBe(true);
      expect(servedQ.subParts[0].prompt).toBe('Define Bleichenbacher padding oracle attack.');

      // CRITICAL SECURITY ASSERTION: modelAnswer and rubric MUST NOT be leaked to active student
      expect(servedQ.subParts[0].modelAnswer).toBeUndefined();
      expect(servedQ.subParts[0].rubric).toBeUndefined();
      expect(servedQ.modelAnswer).toBeUndefined();
      expect(servedQ.rubric).toBeUndefined();
    });
  });

  describe('4. Strict Mass-Assignment Protection on Student Update', () => {
    it('should reject updates with unauthorized or injected properties (e.g. roleIds, passwordHash)', async () => {
      const res = await request(app)
        .put(`/api/v1/students/${studentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Student Name',
          roleIds: ['660000000000000000000001'], // Malicious attempt to self-assign role
        });

      // Zod .strict() schema rejects unknown keys with 400 Bad Request
      expect(res.status).toBe(400);
    });

    it('should successfully update valid whitelisted student attributes', async () => {
      const res = await request(app)
        .put(`/api/v1/students/${studentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Valid Updated Student',
          level: '200L',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Valid Updated Student');
      expect(res.body.data.level).toBe('200L');
    });
  });
});
