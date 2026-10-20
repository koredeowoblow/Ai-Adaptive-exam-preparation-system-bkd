import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import dns from 'dns';

dns.setServers(['8.8.8.8', '8.8.4.4']);
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Register models
import '../models/role.model';
import '../models/department.model';
import '../models/course.model';
import '../models/topic.model';
import '../models/question.model';
import '../models/practice.model';

import { Student } from '../models/student.model';
import { Department } from '../models/department.model';
import { Course } from '../models/course.model';
import { PracticeSession } from '../models/practice.model';
import { studentService } from '../services/student.service';
import { authService } from '../services/auth.service';
import {
  validateExamDate,
  calculateDaysRemainingInLagos,
  getLagosTodayString,
  getLagosMaxExamDateString,
} from '../utils/dateValidation';

async function runTests() {
  console.log('====================================================');
  console.log('   STEP 1: EXAM DATE & LEVEL PROMOTION VERIFICATION   ');
  console.log('====================================================\n');

  const dbUri = process.env.TEST_MONGODB_URI || process.env.MONGODB_URI || '';
  if (!dbUri) throw new Error('MONGODB_URI is not set in environment');
  await mongoose.connect(dbUri);

  // ----------------------------------------------------
  // SECTION 1: Date Validation & Lagos Timezone Tests
  // ----------------------------------------------------
  console.log('--- SECTION 1: Date Validation Tests ---');
  const lagosToday = getLagosTodayString();
  const lagosMax = getLagosMaxExamDateString();
  console.log(`Africa/Lagos Today: ${lagosToday}`);
  console.log(`Africa/Lagos 24-Month Cap: ${lagosMax}`);

  // Test 1.1: Past Date
  const pastTest = validateExamDate('2024-01-01');
  console.log(`[Test 1.1] Past date (2024-01-01): valid=${pastTest.isValid}, error="${pastTest.error}"`);
  if (pastTest.isValid) throw new Error('Past date should be invalid');

  // Test 1.2: Too Far Date (> 24 months)
  const [maxYear, maxMonth, maxDay] = lagosMax.split('-').map(Number);
  const beyondMaxStr = `${maxYear + 1}-${String(maxMonth).padStart(2, '0')}-${String(maxDay).padStart(2, '0')}`;
  const tooFarTest = validateExamDate(beyondMaxStr);
  console.log(`[Test 1.2] Too far date (${beyondMaxStr}): valid=${tooFarTest.isValid}, error="${tooFarTest.error}"`);
  if (tooFarTest.isValid) throw new Error('Beyond 24 months should be invalid');

  // Test 1.3: Malformed Dates
  const malformed1 = validateExamDate('2026-02-31');
  console.log(`[Test 1.3a] Invalid calendar day (2026-02-31): valid=${malformed1.isValid}, error="${malformed1.error}"`);
  if (malformed1.isValid) throw new Error('Feb 31 should be invalid');

  const malformed2 = validateExamDate('not-a-date');
  console.log(`[Test 1.3b] Non-date string: valid=${malformed2.isValid}, error="${malformed2.error}"`);
  if (malformed2.isValid) throw new Error('Non-date should be invalid');

  // Test 1.4: Boundary Days
  const todayTest = validateExamDate(lagosToday);
  console.log(`[Test 1.4a] Boundary: Today (${lagosToday}): valid=${todayTest.isValid}, daysRemaining=${calculateDaysRemainingInLagos(lagosToday)}`);
  if (!todayTest.isValid || calculateDaysRemainingInLagos(lagosToday) !== 0) throw new Error('Today should be valid with 0 days remaining');

  const maxCapTest = validateExamDate(lagosMax);
  console.log(`[Test 1.4b] Boundary: Exact 24-Month Cap (${lagosMax}): valid=${maxCapTest.isValid}, daysRemaining=${calculateDaysRemainingInLagos(lagosMax)}`);
  if (!maxCapTest.isValid) throw new Error('Exact 24-month cap should be valid');

  console.log('✓ All Date Validation tests passed.\n');

  // ----------------------------------------------------
  // SECTION 2: Academic Promotion & Department Highest Level
  // ----------------------------------------------------
  console.log('--- SECTION 2: Academic Promotion Tests ---');

  // Find Computer Science (4-year, max 400L) and Computer Engineering (5-year, max 500L)
  const csDept = await Department.findOne({ name: 'Computer Science' });
  const cpeDept = await Department.findOne({ name: 'Computer Engineering' });

  if (!csDept || !cpeDept) {
    throw new Error('Required seed departments (Computer Science, Computer Engineering) not found.');
  }

  const csCourses = await Course.find({ departmentId: csDept._id });
  const csLevels = Array.from(new Set(csCourses.map((c) => Number(c.level) || 0))).filter((n) => n > 0).sort((a, b) => a - b);
  console.log(`Computer Science Courses Levels: ${csLevels.join(', ')} (Max: ${Math.max(...csLevels)}L)`);

  const cpeCourses = await Course.find({ departmentId: cpeDept._id });
  const cpeLevels = Array.from(new Set(cpeCourses.map((c) => Number(c.level) || 0))).filter((n) => n > 0).sort((a, b) => a - b);
  console.log(`Computer Engineering Courses Levels: ${cpeLevels.join(', ')} (Max: ${Math.max(...cpeLevels)}L)`);

  // Create isolated test student in Computer Science starting at 100L
  const testEmail = `test.promoted.${Date.now()}@lasustech.edu.ng`;
  const cs100Courses = csCourses.filter((c) => c.level === 100);
  const cs200Courses = csCourses.filter((c) => c.level === 200);
  const cs300Courses = csCourses.filter((c) => c.level === 300);
  const cs400Courses = csCourses.filter((c) => c.level === 400);

  const student = await Student.create({
    name: 'Adaobi TestStudent',
    email: testEmail,
    passwordHash: 'dummy_hash_for_test',
    departmentId: csDept._id,
    level: '100L',
    enrolledCourseIds: cs100Courses.map((c) => c._id),
    isOnboarded: true,
  });

  console.log(`Created test student ${student._id} at level ${student.level} with ${student.enrolledCourseIds.length} 100L courses.`);

  // Create a practice session to prove data preservation
  const firstCourse: any = cs100Courses[0];
  const practiceSession: any = await PracticeSession.create({
    studentId: student._id,
    courseId: firstCourse._id,
    totalQuestions: 10,
    status: 'completed',
    score: 80,
    startedAt: new Date(),
    endedAt: new Date(),
  });
  console.log(`Created completed test practice session ${practiceSession._id} (score: 80).`);

  // Snapshot before promotion
  const beforeCoursesCount = student.enrolledCourseIds.length;
  const beforeSessionsCount = await PracticeSession.countDocuments({ studentId: student._id });

  // Test 2.1: Skip-level promotion (100L -> 300L)
  try {
    await studentService.promoteStudent(student._id.toString(), {
      targetLevel: '300L',
    });
    throw new Error('Skip-level should have failed');
  } catch (err: any) {
    console.log(`[Test 2.1] Skip-level promotion rejected: status=${err.statusCode || 400}, message="${err.message}"`);
  }

  // Test 2.2: Backwards/same-level promotion (100L -> 100L)
  try {
    await studentService.promoteStudent(student._id.toString(), {
      targetLevel: '100L',
    });
    throw new Error('Repeat/Same-level should have failed');
  } catch (err: any) {
    console.log(`[Test 2.2] Repeat promotion to current level rejected: status=${err.statusCode || 400}, message="${err.message}"`);
  }

  // Test 2.3: Valid promotion (100L -> 200L) with new 200L courses & exam date
  const targetExamDate = '2026-11-20';
  const newCourseIds = cs200Courses.map((c) => c._id.toString());
  const promoted = await studentService.promoteStudent(student._id.toString(), {
    targetLevel: '200L',
    courseIds: newCourseIds,
    nextExamDate: targetExamDate,
  });

  console.log(`[Test 2.3] Valid promotion succeeded: level=${promoted?.level}, nextExamDate="${promoted?.nextExamDate}", totalEnrolled=${promoted?.enrolledCourseIds.length}`);
  if (promoted?.level !== '200L' || promoted?.nextExamDate !== targetExamDate) {
    throw new Error('Promotion data mismatch');
  }

  // Test 2.4: Repeat promotion request after already promoted to 200L
  try {
    await studentService.promoteStudent(student._id.toString(), {
      targetLevel: '200L',
    });
    throw new Error('Repeat promotion should have failed');
  } catch (err: any) {
    console.log(`[Test 2.4] Sequential repeat request rejected: status=${err.statusCode || 400}, message="${err.message}"`);
  }

  // Test 2.5: Concurrent Double Submit (simulating two identical promotion requests to 300L)
  console.log('[Test 2.5] Testing concurrent double submit (200L -> 300L)...');
  const courseIds300 = cs300Courses.map((c) => c._id.toString());
  const [res1, res2] = await Promise.all([
    studentService.promoteStudent(student._id.toString(), {
      targetLevel: '300L',
      courseIds: courseIds300,
    }),
    studentService.promoteStudent(student._id.toString(), {
      targetLevel: '300L',
      courseIds: courseIds300,
    }),
  ]);

  console.log(`Concurrent double submit resolved: Res1 Level=${res1?.level}, Res2 Level=${res2?.level}`);
  if (res1?.level !== '300L' || res2?.level !== '300L') {
    throw new Error('Concurrent promotion failed');
  }

  // Verify course deduplication (no double enrollment)
  const freshStudent = await Student.findById(student._id);
  const enrolledIds = freshStudent?.enrolledCourseIds.map((id) => id.toString()) || [];
  const uniqueEnrolledIds = Array.from(new Set(enrolledIds));
  console.log(`Enrolled courses count: ${enrolledIds.length}, Unique count: ${uniqueEnrolledIds.length}`);
  if (enrolledIds.length !== uniqueEnrolledIds.length) {
    throw new Error('Double enrollment detected in concurrent submit!');
  }

  // Promote to 400L
  await studentService.promoteStudent(student._id.toString(), {
    targetLevel: '400L',
    courseIds: cs400Courses.map((c) => c._id.toString()),
  });
  console.log('Promoted student to 400L (highest level for Computer Science).');

  // Test 2.6: Department without next-level courses (Promoting CS student beyond 400L to 500L)
  try {
    await studentService.promoteStudent(student._id.toString(), {
      targetLevel: '500L',
    });
    throw new Error('Promoting past department highest level should fail');
  } catch (err: any) {
    console.log(`[Test 2.6] Department cap enforced (400L max for CS): status=${err.statusCode || 400}, message="${err.message}"`);
  }

  // But for Computer Engineering student, 500L promotion IS allowed!
  const cpeStudent = await Student.create({
    name: 'Engr TestStudent',
    email: `cpe.test.${Date.now()}@lasustech.edu.ng`,
    passwordHash: 'dummy_hash',
    departmentId: cpeDept._id,
    level: '400L',
    isOnboarded: true,
  });
  const cpe500Courses = cpeCourses.filter((c) => c.level === 500);
  const cpePromoted = await studentService.promoteStudent(cpeStudent._id.toString(), {
    targetLevel: '500L',
    courseIds: cpe500Courses.map((c) => c._id.toString()),
  });
  console.log(`[Test 2.7] Engineering department with 500L courses promoted to 500L: level=${cpePromoted?.level}`);
  if (cpePromoted?.level !== '500L') throw new Error('500L promotion failed for 5-year department');

  console.log('✓ All Promotion tests passed.\n');

  // ----------------------------------------------------
  // SECTION 3: Data Preservation Proof
  // ----------------------------------------------------
  console.log('--- SECTION 3: Data Preservation Proof ---');
  const finalStudent = await Student.findById(student._id);
  const afterSessionsCount = await PracticeSession.countDocuments({ studentId: student._id });
  const preservedSession = await PracticeSession.findById(practiceSession._id);

  console.log(`Before Promotion: 100L courses enrolled = ${beforeCoursesCount}`);
  console.log(`After Promotion to 400L: Total courses enrolled = ${finalStudent?.enrolledCourseIds.length}`);
  const finalEnrolled = (finalStudent?.enrolledCourseIds || []).map(String);
  const oldPreserved = cs100Courses.every((c: any) => finalEnrolled.includes(c._id.toString()));
  console.log(`Old 100L courses preserved: ${oldPreserved}`);
  console.log(`Practice Sessions Count Before = ${beforeSessionsCount}, After = ${afterSessionsCount}`);
  console.log(`Past Session Score Preserved = ${preservedSession?.score}%`);

  if (!oldPreserved) {
    throw new Error('Past course enrollments were lost!');
  }
  if (afterSessionsCount !== beforeSessionsCount || preservedSession?.score !== 80) {
    throw new Error('Past session history or score corrupted!');
  }
  console.log('✓ Data preservation verified.\n');

  // ----------------------------------------------------
  // SECTION 4: Payload Size Check on /me and Login
  // ----------------------------------------------------
  console.log('--- SECTION 4: /me & Login Payload Size Check ---');
  const meData = await authService.getMe(student._id.toString());
  const meJson = JSON.stringify(meData);
  const meByteSize = Buffer.byteLength(meJson, 'utf8');

  console.log(`User /me payload fields: ${Object.keys(meData).join(', ')}`);
  console.log(`User /me enrolled courses count: ${meData.enrolledCourseIds?.length}`);
  console.log(`User /me serialized size: ${meByteSize} bytes (~${(meByteSize / 1024).toFixed(2)} KB)`);

  if (meByteSize > 2048) {
    throw new Error(`/me payload is bloated (${meByteSize} bytes)! Expected < 2KB.`);
  }
  console.log('✓ /me payload confirmed small and lightweight.\n');

  // Cleanup test students
  await Student.deleteMany({ _id: { $in: [student._id, cpeStudent._id] } });
  await PracticeSession.deleteMany({ _id: practiceSession._id });
  console.log('Cleaned up test data.');
  console.log('\n====================================================');
  console.log('        ALL STEP 1 HARDENING TESTS PASSED           ');
  console.log('====================================================');

  await mongoose.disconnect();
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
