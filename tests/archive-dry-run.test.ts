import mongoose from 'mongoose';
import { Department } from '../src/models/department.model';
import { Course } from '../src/models/course.model';
import { Student } from '../src/models/student.model';
import { PracticeSession } from '../src/models/practice.model';
import { scanAndArchiveCrossDeptSessions } from '../src/scripts/archive-cross-department-sessions';
import { practiceRepository } from '../src/repositories/practice.repository';

describe('Cross-Department Archive Script (In-Memory Verification)', () => {
  let csStudentId: string;
  let csCourseId: string;
  let foodCourseId: string;
  let crossDeptSessionIds: string[] = [];
  let validSessionId: string;

  beforeAll(async () => {
    const dummyAdminId = new mongoose.Types.ObjectId();

    // 1. Create two departments
    const csDept = await Department.create({
      name: 'Computer Science Department',
      createdBy: dummyAdminId,
    });

    const foodDept = await Department.create({
      name: 'Food Science & Technology Department',
      createdBy: dummyAdminId,
    });

    // 2. Create courses
    const csCourse = await Course.create({
      departmentId: csDept._id,
      code: 'CSC401',
      title: 'Distributed Systems',
      level: 400,
    });
    csCourseId = csCourse._id.toString();

    const foodCourse = await Course.create({
      departmentId: foodDept._id,
      code: 'FST201',
      title: 'Fundamentals of Food Science & Technology',
      level: 200,
    });
    foodCourseId = foodCourse._id.toString();

    // 3. Create CS Student (enrolled only in CSC401)
    const student = await Student.create({
      name: 'Test CS Student',
      email: `cs_student_${Date.now()}@test.edu`,
      passwordHash: 'HashedSecretPass123!',
      departmentId: csDept._id,
      enrolledCourseIds: [csCourse._id],
      level: '400L',
    });
    csStudentId = (student as any)._id.toString();

    // 4. Create 3 Cross-Department sessions on FST201
    for (let i = 1; i <= 3; i++) {
      const session = await PracticeSession.create({
        studentId: student._id,
        courseId: foodCourse._id,
        mode: i === 1 ? 'quick' : 'mock',
        status: i === 1 ? 'completed' : 'PENDING_GRADING',
        totalQuestions: 10,
        questionsAnswered: 8,
        score: i === 1 ? 80 : null,
      });
      crossDeptSessionIds.push((session as any)._id.toString());
    }

    // 5. Create 1 Legitimate session on CSC401 (same department)
    const validSession = await PracticeSession.create({
      studentId: student._id,
      courseId: csCourse._id,
      mode: 'quick',
      status: 'completed',
      totalQuestions: 10,
      questionsAnswered: 10,
      score: 90,
    });
    validSessionId = (validSession as any)._id.toString();
  });

  it('runs dry-run scan against in-memory data: identifies 3 sessions and modifies nothing', async () => {
    const result = await scanAndArchiveCrossDeptSessions({ isApply: false, shouldDisconnect: false });

    // Must find exactly the 3 cross-department sessions
    expect(result!.crossDeptSessions.length).toBe(3);
    const identifiedIds = result!.crossDeptSessions.map((s) => s.sessionId);
    for (const id of crossDeptSessionIds) {
      expect(identifiedIds).toContain(id);
    }
    expect(identifiedIds).not.toContain(validSessionId);

    // Verify DRY-RUN guarantee: no session in DB was modified
    for (const id of crossDeptSessionIds) {
      const doc = await PracticeSession.findById(id);
      expect(doc!.isArchived).toBe(false);
      expect(doc!.archivedAt).toBeUndefined();
    }

    // History still sees all sessions prior to archiving
    const historyBefore = await practiceRepository.findSessionsByStudentPaginated(csStudentId);
    expect(historyBefore.length).toBe(4);
  });

  it('applies archive flag with --apply: sets isArchived true without deleting and excludes from history', async () => {
    const applyResult = await scanAndArchiveCrossDeptSessions({ isApply: true, shouldDisconnect: false });
    expect(applyResult!.crossDeptSessions.length).toBe(3);

    // Verify records were archived in place, NOT deleted
    for (const id of crossDeptSessionIds) {
      const doc = await PracticeSession.findById(id);
      expect(doc).not.toBeNull();
      expect(doc!.isArchived).toBe(true);
      expect(doc!.archivedAt).toBeInstanceOf(Date);
    }

    // Verify legitimate session remains unarchived
    const validDoc = await PracticeSession.findById(validSessionId);
    expect(validDoc!.isArchived).toBe(false);

    // Verify student history now excludes the archived sessions
    const historyAfter = await practiceRepository.findSessionsByStudentPaginated(csStudentId);
    expect(historyAfter.length).toBe(1);
    expect(historyAfter[0]._id.toString()).toBe(validSessionId);

    // Verify dry-run after apply finds 0 remaining cross-department sessions
    const scanAfter = await scanAndArchiveCrossDeptSessions({ isApply: false, shouldDisconnect: false });
    expect(scanAfter!.crossDeptSessions.length).toBe(0);
  });
});
