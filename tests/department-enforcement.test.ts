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

describe('Department Course & Practice Security Enforcement', () => {
  let csStudentToken: string;
  let csStudentId: string;
  let eeStudentToken: string;
  let eeStudentId: string;
  let csDeptId: string;
  let eeDeptId: string;
  let csCourseId: string;

  beforeAll(async () => {
    await connectDatabase();
    await mongoose.syncIndexes();

    const dummyAdminId = new mongoose.Types.ObjectId();

    // 1. Create two separate departments
    const csDept = await Department.create({
      name: 'Computer Science Dept Security Test',
      createdBy: dummyAdminId,
    });
    csDeptId = csDept._id.toString();

    const eeDept = await Department.create({
      name: 'Electrical Engineering Dept Security Test',
      createdBy: dummyAdminId,
    });
    eeDeptId = eeDept._id.toString();

    // 2. Create a course under CS Department
    const csCourse = await Course.create({
      departmentId: csDept._id,
      code: 'CSC999',
      title: 'Advanced Computer Science Security',
      level: 400,
    });
    csCourseId = csCourse._id.toString();

    // Create topic and sample questions for the course so session creation succeeds
    const topic = await Topic.create({
      name: 'Operating System Security',
      courseId: csCourse._id,
      order: 1,
    });

    await Question.create({
      topicId: topic._id,
      questionText: 'What is a process isolation mechanism?',
      type: 'MULTIPLE_CHOICE',
      options: [
        { id: 'opt_a', text: 'Virtual Memory & Rings' },
        { id: 'opt_b', text: 'Uncapped Stack' },
      ],
      correctAnswer: 'opt_a',
      explanation: 'Virtual memory isolates process address spaces.',
      eloRating: 1200,
    });

    // 3. Create Student A belonging to CS Department (onboarded)
    const csStudent = await Student.create({
      name: 'CS Student',
      email: 'cs.student@security.test',
      passwordHash: 'hashed',
      departmentId: csDept._id,
      isOnboarded: true,
      level: '400L',
    });
    csStudentId = csStudent._id.toString();
    csStudentToken = jwt.sign({ id: csStudentId, type: 'student' }, env.JWT_SECRET, { expiresIn: '1h' });

    // 4. Create Student B belonging to EE Department (onboarded)
    const eeStudent = await Student.create({
      name: 'EE Student',
      email: 'ee.student@security.test',
      passwordHash: 'hashed',
      departmentId: eeDept._id,
      isOnboarded: true,
      level: '400L',
    });
    eeStudentId = eeStudent._id.toString();
    eeStudentToken = jwt.sign({ id: eeStudentId, type: 'student' }, env.JWT_SECRET, { expiresIn: '1h' });
  });

  afterAll(async () => {
    await Student.deleteMany({ email: { $in: ['cs.student@security.test', 'ee.student@security.test'] } });
    await Question.deleteMany({});
    await Topic.deleteMany({ courseId: csCourseId });
    await Course.deleteMany({ _id: csCourseId });
    await Department.deleteMany({ _id: { $in: [csDeptId, eeDeptId] } });
    await mongoose.connection.close();
  });

  it('allows same-department student to open the course (200)', async () => {
    const res = await request(app)
      .get(`/api/v1/courses/${csCourseId}`)
      .set('Authorization', `Bearer ${csStudentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.code).toBe('CSC999');
  });

  it('blocks other-department student from opening the course (403)', async () => {
    const res = await request(app)
      .get(`/api/v1/courses/${csCourseId}`)
      .set('Authorization', `Bearer ${eeStudentToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('allows same-department student to start a practice session (200 or 201)', async () => {
    const res = await request(app)
      .post('/api/v1/practice-sessions/start')
      .set('Authorization', `Bearer ${csStudentToken}`)
      .send({
        courseId: csCourseId,
        mode: 'quick',
        totalQuestions: 5,
      });

    expect([200, 201]).toContain(res.status);
    expect(res.body.success).toBe(true);
  });

  it('blocks other-department student from starting a practice session (403)', async () => {
    const res = await request(app)
      .post('/api/v1/practice-sessions/start')
      .set('Authorization', `Bearer ${eeStudentToken}`)
      .send({
        courseId: csCourseId,
        mode: 'quick',
        totalQuestions: 5,
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('(a) allows other-department student to start a session if enrolled in the course (200 or 201)', async () => {
    // Enroll EE student in the CS course
    await Student.updateOne({ _id: eeStudentId }, { $addToSet: { enrolledCourseIds: csCourseId } });

    const res = await request(app)
      .post('/api/v1/practice-sessions/start')
      .set('Authorization', `Bearer ${eeStudentToken}`)
      .send({
        courseId: csCourseId,
        mode: 'quick',
        totalQuestions: 5,
      });

    expect([200, 201]).toContain(res.status);
    expect(res.body.success).toBe(true);
  });

  it('(c) allows student to open an old session on a cross-department course (200)', async () => {
    // Student A (CS) starts a session for CS course
    const startRes = await request(app)
      .post('/api/v1/practice-sessions/start')
      .set('Authorization', `Bearer ${csStudentToken}`)
      .send({
        courseId: csCourseId,
        mode: 'quick',
        totalQuestions: 5,
      });

    const sessionId = startRes.body.data?.session?._id || startRes.body.data?._id;

    // Student A's department changes to EE (simulating cross-department old session)
    await Student.updateOne({ _id: csStudentId }, { departmentId: new mongoose.Types.ObjectId(eeDeptId), enrolledCourseIds: [] });

    // Student A accesses their old session
    const getRes = await request(app)
      .get(`/api/v1/practice-sessions/${sessionId}`)
      .set('Authorization', `Bearer ${csStudentToken}`);

    // Keeps ONLY ownership check: 200 OK, no department 403
    expect(getRes.status).toBe(200);
    expect(getRes.body.success).toBe(true);
  });
});
