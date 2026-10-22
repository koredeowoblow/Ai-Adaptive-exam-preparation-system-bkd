import mongoose from 'mongoose';
import request from 'supertest';
import app from '../src/app';
import { connectDatabase } from '../src/config/db';
import { Student } from '../src/models/student.model';
import { Department } from '../src/models/department.model';
import { Course } from '../src/models/course.model';
import { Topic } from '../src/models/topic.model';
import { Question } from '../src/models/question.model';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env';

describe('Multi-Part Theory Questions & Diagram Upload API', () => {
  let adminToken: string;
  let topicId: string;

  beforeAll(async () => {
    await connectDatabase();
    await mongoose.syncIndexes();

    const admin = await Student.create({
      name: 'Faculty Admin',
      email: 'faculty@university.edu',
      passwordHash: 'hashed',
    });
    adminToken = jwt.sign(
      { id: admin._id.toString(), type: 'admin', role: 'admin' },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const department = await Department.create({
      name: 'Electrical Engineering',
      createdBy: admin._id,
    });


    const course = await Course.create({
      code: 'ECE301',
      title: 'Digital Signal Processing',
      description: 'Signals & Systems',
      departmentId: department._id,
    });

    const topic = await Topic.create({
      name: 'Fourier Transforms & Filters',
      courseId: course._id,
    });
    topicId = topic._id.toString();
  });

  afterAll(async () => {
    await Student.deleteMany({});
    await Department.deleteMany({});
    await Course.deleteMany({});
    await Topic.deleteMany({});
    await Question.deleteMany({});
    await mongoose.connection.close();
  });

  describe('Diagram Upload API (POST /api/v1/uploads/diagram)', () => {
    it('should successfully upload an image buffer and return URL', async () => {
      // 1x1 transparent PNG buffer
      const pngBuffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
        'base64'
      );

      const res = await request(app)
        .post('/api/v1/uploads/diagram')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('image', pngBuffer, 'test-circuit.png');

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.url).toBeDefined();
      expect(typeof res.body.data.url).toBe('string');
    });

    it('should reject non-image file uploads', async () => {
      const textBuffer = Buffer.from('console.log("hello");', 'utf-8');

      const res = await request(app)
        .post('/api/v1/uploads/diagram')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('image', textBuffer, 'script.js');

      expect(res.status).toBe(400);
    });
  });

  describe('Multi-Part Question Creation (POST /api/v1/questions)', () => {
    it('should create a university-style multi-part theory question with diagram and sub-parts', async () => {
      const payload = {
        type: 'THEORY',
        topicId,
        questionText: 'Consider the digital filter schematic shown in Figure 1. The sampling frequency is 48 kHz.',
        diagramUrl: '/uploads/diagrams/test-filter.png',
        diagramCaption: 'Figure 1: Direct Form II Filter Architecture',
        hasSubParts: true,
        subParts: [
          {
            id: 'a',
            label: '1(a)',
            prompt: 'Determine the difference equation relating the input $x[n]$ and output $y[n]$.',
            maxMarks: 4,
            modelAnswer: 'y[n] = 0.5x[n] + 0.25x[n-1] - 0.1y[n-1]',
            rubric: [
              { point: 'Correct feedforward coefficients', weight: 0.5 },
              { point: 'Correct feedback sign and delay', weight: 0.5 },
            ],
            order: 0,
          },
          {
            id: 'b_i',
            label: '1(b)(i)',
            prompt: 'Derive the system transfer function $H(z)$.',
            maxMarks: 5,
            modelAnswer: 'H(z) = \\frac{0.5 + 0.25z^{-1}}{1 + 0.1z^{-1}}',
            rubric: [
              { point: 'Z-transform of both sides', weight: 0.4 },
              { point: 'Algebraic simplification of Y(z)/X(z)', weight: 0.6 },
            ],
            order: 1,
          },
          {
            id: 'b_ii',
            label: '1(b)(ii)',
            prompt: 'State whether the filter is stable and justify using the pole location.',
            maxMarks: 3,
            modelAnswer: 'The filter is stable because the single pole is at z = -0.1, which lies inside the unit circle |z| < 1.',
            rubric: [
              { point: 'Correct pole value at z = -0.1', weight: 0.5 },
              { point: 'Clear stability condition (|z| < 1)', weight: 0.5 },
            ],
            order: 2,
          },
        ],
        difficulty: 4,
        eloRating: 1200,
        explanation: 'Complete filter analysis using Z-transforms and stability criteria.',
      };

      const res = await request(app)
        .post('/api/v1/questions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.hasSubParts).toBe(true);
      expect(res.body.data.subParts).toHaveLength(3);
      expect(res.body.data.subParts[0].label).toBe('1(a)');
      expect(res.body.data.subParts[1].label).toBe('1(b)(i)');
      expect(res.body.data.subParts[2].label).toBe('1(b)(ii)');
      expect(res.body.data.diagramUrl).toBe('/uploads/diagrams/test-filter.png');

      const questionId = res.body.data._id;
      const getRes = await request(app)
        .get(`/api/v1/questions/${questionId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.data.subParts).toHaveLength(3);
    });

    it('should reject a multi-part question with empty sub-parts array', async () => {
      const payload = {
        type: 'THEORY',
        topicId,
        questionText: 'An invalid multi-part question without any sub-parts.',
        hasSubParts: true,
        subParts: [],
      };

      const res = await request(app)
        .post('/api/v1/questions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);

      expect(res.status).toBe(400);
    });
  });
});
