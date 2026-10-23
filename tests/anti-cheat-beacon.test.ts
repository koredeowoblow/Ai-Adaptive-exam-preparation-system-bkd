import mongoose from 'mongoose';
import request from 'supertest';
import app from '../src/app';
import { connectDatabase } from '../src/config/db';
import { Student } from '../src/models/student.model';
import { Department } from '../src/models/department.model';
import { Course } from '../src/models/course.model';
import { Topic } from '../src/models/topic.model';
import { PracticeSession } from '../src/models/practice.model';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env';

describe('Anti-Cheat sendBeacon Ingestion & TrustScore Clamping', () => {
  let studentToken: string;
  let studentId: string;
  let sessionId: string;

  beforeAll(async () => {
    await connectDatabase();

    const adminId = new mongoose.Types.ObjectId();
    const dept = await Department.create({ name: 'Computer Engineering', createdBy: adminId });
    const course = await Course.create({
      code: 'CPE301',
      title: 'Operating Systems & Concurrency',
      departmentId: dept._id,
    });
    const topic = await Topic.create({
      name: 'Process Scheduling',
      courseId: course._id,
    });

    const student = await Student.create({
      name: 'AntiCheat Candidate',
      email: 'candidate@university.edu',
      passwordHash: 'hashed123',
    });
    studentId = student._id.toString();

    studentToken = jwt.sign(
      { id: studentId, type: 'student', role: 'student' },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const session = await (PracticeSession as any).create({
      studentId: new mongoose.Types.ObjectId(studentId),
      courseId: course._id,
      sessionType: 'standard',
      status: 'active',
      trustScore: 100,
      antiCheatEvents: [],
      questions: [],
    });
    sessionId = session._id.toString();
  });

  afterAll(async () => {
    await Student.deleteMany({});
    await Department.deleteMany({});
    await Course.deleteMany({});
    await Topic.deleteMany({});
    await PracticeSession.deleteMany({});
  });

  it('accepts a sendBeacon flush authenticated via Cookie on pagehide', async () => {
    const beaconPayload = JSON.stringify({
      events: [
        {
          type: 'TAB_SWITCH',
          timestamp: new Date().toISOString(),
          metadata: { reason: 'pagehide' },
        },
      ],
    });

    // navigator.sendBeacon sends credentials via cookies with application/json or text/plain
    const res = await request(app)
      .post(`/api/v1/practice-sessions/${sessionId}/anticheat-event`)
      .set('Cookie', `token=${studentToken}`)
      .set('Content-Type', 'text/plain')
      .send(beaconPayload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.trustScore).toBeDefined();

    const updated = await PracticeSession.findById(sessionId).lean();
    expect(updated?.antiCheatEvents?.length).toBe(1);
    expect(updated?.antiCheatEvents[0].type).toBe('TAB_SWITCH');
  });

  it('accepts a beacon flush authenticated via query token parameter', async () => {
    const beaconPayload = JSON.stringify({
      events: [
        {
          type: 'WINDOW_BLUR',
          timestamp: new Date().toISOString(),
          metadata: { reason: 'visibilitychange' },
        },
      ],
    });

    const res = await request(app)
      .post(`/api/v1/practice-sessions/${sessionId}/anticheat-event?token=${studentToken}`)
      .set('Content-Type', 'application/json')
      .send(beaconPayload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const updated = await PracticeSession.findById(sessionId).lean();
    expect(updated?.antiCheatEvents?.length).toBe(2);
  });

  it('clamps trustScore at 0 atomically when total penalties exceed 100', async () => {
    // Generate events totaling well over 100 penalty points:
    // 5 AI_HONEYPOT_TRIGGERED (25 pts each = 125) + DEVTOOLS_DETECTED (15 pts)
    const severeEvents = [
      { type: 'AI_HONEYPOT_TRIGGERED', timestamp: new Date().toISOString() },
      { type: 'AI_HONEYPOT_TRIGGERED', timestamp: new Date().toISOString() },
      { type: 'AI_HONEYPOT_TRIGGERED', timestamp: new Date().toISOString() },
      { type: 'AI_HONEYPOT_TRIGGERED', timestamp: new Date().toISOString() },
      { type: 'AI_HONEYPOT_TRIGGERED', timestamp: new Date().toISOString() },
      { type: 'DEVTOOLS_DETECTED', timestamp: new Date().toISOString() },
    ];

    const res = await request(app)
      .post(`/api/v1/practice-sessions/${sessionId}/anticheat-event`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ events: severeEvents });

    expect(res.status).toBe(200);
    expect(res.body.data.trustScore).toBe(0);

    // Verify in database that trustScore is strictly clamped at 0, not negative
    const sessionInDb = await PracticeSession.findById(sessionId).lean();
    expect(sessionInDb?.trustScore).toBe(0);
  });
});
