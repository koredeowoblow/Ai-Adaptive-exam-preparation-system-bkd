import mongoose from 'mongoose';
import request from 'supertest';
import app from '../src/app';
import { connectDatabase } from '../src/config/db';
import { Student } from '../src/models/student.model';
import { Course } from '../src/models/course.model';
import { Topic } from '../src/models/topic.model';
import { Question } from '../src/models/question.model';
import { PracticeSession } from '../src/models/practice.model';
import { Department } from '../src/models/department.model';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env';
import { groqProvider } from '../src/providers/groq.provider';

describe('New Features Suite (Features 1, 2, 3, 5)', () => {
  let adminToken: string;
  let studentToken: string;
  let studentId: string;
  let activeSessionId: string;
  let testCourseId: string;
  let testTopicId: string;

  beforeAll(async () => {
    await connectDatabase();

    const admin = await Student.create({
      name: 'Dr. Invigilator',
      email: 'proctor-admin@university.edu',
      passwordHash: 'hashed',
    });
    adminToken = jwt.sign(
      { id: admin._id.toString(), type: 'admin', role: 'admin' },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const student = await Student.create({
      name: 'John Student',
      email: 'john.student@university.edu',
      passwordHash: 'hashed',
    });
    studentId = student._id.toString();
    studentToken = jwt.sign(
      { id: studentId, type: 'student', role: 'student' },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const dept = await Department.create({
      name: 'Computer Engineering',
      createdBy: admin._id,
    });

    const course = await Course.create({
      code: 'CEN301',
      title: 'Digital Signal Processing',
      departmentId: dept._id,
    });
    testCourseId = course._id.toString();

    const topic = await Topic.create({
      name: 'Fourier Transforms & Spectral Analysis',
      courseId: course._id,
      order: 1,
    });
    testTopicId = topic._id.toString();

    // Create an active practice session to monitor
    const session = await PracticeSession.create({
      studentId: student._id,
      courseId: course._id,
      status: 'active',
      startedAt: new Date(),
      totalQuestions: 5,
      questionsAnswered: 2,
      trustScore: 82,
      mode: 'quick',
    });
    activeSessionId = session._id.toString();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('Feature 1: Interactive Socratic AI Tutor', () => {
    it('should reject unauthenticated calls to /api/v1/ai/tutor-question', async () => {
      const res = await request(app)
        .post('/api/v1/ai/tutor-question')
        .send({
          questionContext: { questionText: 'Explain Fourier Transforms' },
          messages: [{ role: 'user', content: 'Why is it wrong?' }],
        });

      expect(res.status).toBe(401);
    });

    it('should validate that questionContext with questionText is provided', async () => {
      const res = await request(app)
        .post('/api/v1/ai/tutor-question')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          messages: [{ role: 'user', content: 'Why?' }],
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/questionContext with questionText is required/i);
    });

    it('should return Socratic tutor response when valid question context and messages are supplied', async () => {
      // Mock Groq provider so tests don't hit live rate limits
      const spy = jest
        .spyOn(groqProvider, 'generateSocraticTutorResponse')
        .mockResolvedValueOnce('Great attempt! Your deduction in step 2 assumed linearity, but the system is non-linear.');

      const res = await request(app)
        .post('/api/v1/ai/tutor-question')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          questionContext: {
            questionText: 'Determine if the system y(t) = x(t)^2 is linear.',
            type: 'THEORY',
            studentAnswer: 'Yes, it is linear because scaling input scales output.',
            correctAnswer: 'Non-linear',
            marksAwarded: 0,
            maxMarks: 5,
          },
          messages: [
            { role: 'user', content: 'Why was my scaling proof not accepted by the rubric?' },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.reply).toContain('non-linear');
      spy.mockRestore();
    });
  });

  describe('Feature 2: Real-Time Live Proctoring Grid & Invigilator Actions', () => {
    it('should forbid ordinary students from accessing the live proctoring feed', async () => {
      const res = await request(app)
        .get('/api/v1/integrity/live-sessions')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
    });

    it('should allow authorized admin to query live proctoring feed with active examinees', async () => {
      const res = await request(app)
        .get('/api/v1/integrity/live-sessions')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);

      const found = res.body.data.find((s: any) => s.sessionId === activeSessionId);
      expect(found).toBeDefined();
      expect(found.questionsAnswered).toBe(2);
      expect(found.riskLevel).toBe('CAUTION'); // 82 trustScore falls into CAUTION
    });

    it('should allow invigilator to transmit a direct proctor warning to student screen', async () => {
      const res = await request(app)
        .post(`/api/v1/integrity/session/${activeSessionId}/warn`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          message: 'Warning: Window blur detected. Please stay in full screen.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify the warning was saved to the session document
      const updated = await PracticeSession.findById(activeSessionId);
      expect(updated?.proctorWarning).toBe('Warning: Window blur detected. Please stay in full screen.');
      expect(updated?.proctorWarningAt).toBeDefined();
    });

    it('should allow invigilator to forcibly terminate a compromised exam session', async () => {
      const res = await request(app)
        .post(`/api/v1/integrity/session/${activeSessionId}/terminate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reason: 'Severe proctoring violation: Multiple device connection detected.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const terminated = await PracticeSession.findById(activeSessionId);
      expect(terminated?.status).toBe('TERMINATED_BY_PROCTOR');
      expect(terminated?.terminatedReason).toBe('Severe proctoring violation: Multiple device connection detected.');
      expect(terminated?.endedAt).toBeDefined();
    });
  });

  describe('Feature 3: Automated AI Question Generator from Syllabus Notes', () => {
    it('should deny ordinary students from calling /api/v1/questions/ai-generate', async () => {
      const res = await request(app)
        .post('/api/v1/questions/ai-generate')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          notesText: 'Sampling theorem states fs >= 2fm.',
          topicId: testTopicId,
        });

      expect(res.status).toBe(403);
    });

    it('should validate that notesText is provided', async () => {
      const res = await request(app)
        .post('/api/v1/questions/ai-generate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          topicId: testTopicId,
          notesText: '   ',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/notesText is required/i);
    });

    it('should generate structured questions from notes using Groq Provider', async () => {
      const mockGenerated = [
        {
          type: 'MULTIPLE_CHOICE',
          questionText: 'What is the minimum Nyquist rate for a 4kHz bandwidth signal?',
          options: [
            { id: 'A', text: '4 kHz' },
            { id: 'B', text: '8 kHz' },
            { id: 'C', text: '16 kHz' },
            { id: 'D', text: '2 kHz' },
          ],
          correctAnswer: 'B',
          explanation: 'Nyquist rate is 2 * fm = 2 * 4kHz = 8kHz.',
          difficulty: 4,
          eloRating: 1200,
        },
      ];

      const spy = jest
        .spyOn(groqProvider, 'generateQuestionsFromNotes')
        .mockResolvedValueOnce(mockGenerated);

      const res = await request(app)
        .post('/api/v1/questions/ai-generate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          notesText: 'Nyquist rate states that sampling frequency fs must be at least twice the highest frequency component fm in the continuous signal.',
          topicId: testTopicId,
          topicName: 'Fourier Transforms & Spectral Analysis',
          courseCode: 'CEN301',
          questionType: 'MULTIPLE_CHOICE',
          count: 1,
          difficulty: 'Intermediate',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].questionText).toContain('Nyquist rate');
      expect(res.body.data[0].topicId).toBe(testTopicId);

      spy.mockRestore();
    });
  });
});
