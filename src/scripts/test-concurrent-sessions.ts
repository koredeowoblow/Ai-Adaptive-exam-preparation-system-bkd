import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import dns from 'dns';

dns.setServers(['8.8.8.8', '8.8.4.4']);
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Register all Mongoose models
import '../models/role.model';
import '../models/department.model';
import '../models/course.model';
import '../models/topic.model';
import '../models/question.model';
import '../models/practice.model';
import { Student } from '../models/student.model';
import { Course } from '../models/course.model';
import { PracticeSession } from '../models/practice.model';
import { PracticeService } from '../services/practice.service';

const practiceService = new PracticeService();

async function runConcurrencyTests() {
  const dbUri = process.env.TEST_MONGODB_URI || process.env.MONGODB_URI || '';

  // Non-test database guard: Refuse to run against production databases
  const isTestDb =
    dbUri.includes('test') ||
    process.env.NODE_ENV === 'test' ||
    process.env.ALLOW_CONCURRENCY_TEST === 'true';

  if (!isTestDb) {
    console.error(
      '[Security Guard] REFUSED: Concurrency test refuses to run against a non-test database! Set NODE_ENV=test or ALLOW_CONCURRENCY_TEST=true.'
    );
    process.exit(1);
  }

  const createdSessionIds: string[] = [];

  try {
    await mongoose.connect(dbUri);
    console.log('[Test Setup] Connected to MongoDB database:', mongoose.connection.name);

    const student = await Student.findOne({ email: 'student@eduadapt.com' });
    if (!student) {
      console.error('[Test Setup] Student not found');
      process.exit(1);
    }

    const course = await Course.findOne({ level: 100 });
    if (!course) {
      console.error('[Test Setup] Course not found');
      process.exit(1);
    }

    const studentId = student._id.toString();
    const courseId = course._id.toString();
    const tokenUser = { type: 'student', id: studentId };

    console.log(`[Test Target] Student: ${student.email}, Course: ${course.code}`);

    // ─────────────────────────────────────────────────────────
    // Phase 1: Test Database-Level Unique Partial Index ALONE
    // (In-memory lock completely bypassed)
    // ─────────────────────────────────────────────────────────
    console.log('\n--- PHASE 1: Direct DB Unique Index Test (Bypassing In-Memory Lock) ---');
    process.env.BYPASS_IN_MEMORY_DEDUPE = 'true';

    // Clear any active sessions first
    await PracticeSession.deleteMany({ studentId: student._id, courseId: course._id, status: 'active' });

    const payloadQuick = {
      courseId,
      totalQuestions: 10,
      questionType: 'MIXED' as const,
      mode: 'quick' as const,
    };

    console.log('[Phase 1] Firing 5 concurrent startSession requests straight at the database...');
    const dbTestResults = await Promise.all([
      practiceService.startSession(studentId, payloadQuick, tokenUser),
      practiceService.startSession(studentId, payloadQuick, tokenUser),
      practiceService.startSession(studentId, payloadQuick, tokenUser),
      practiceService.startSession(studentId, payloadQuick, tokenUser),
      practiceService.startSession(studentId, payloadQuick, tokenUser),
    ]);

    const phase1SessionIds = dbTestResults.map((r: any) => r.session._id.toString());
    phase1SessionIds.forEach((id) => createdSessionIds.push(id));
    const uniquePhase1Ids = Array.from(new Set(phase1SessionIds));

    console.log('[Phase 1] Returned Session IDs:', phase1SessionIds);
    if (uniquePhase1Ids.length !== 1) {
      throw new Error(`[Phase 1 FAILED] DB index alone did not dedupe: ${uniquePhase1Ids.length} sessions returned.`);
    }

    const activeInDbPhase1 = await PracticeSession.find({
      studentId: student._id,
      courseId: course._id,
      mode: 'quick',
      status: 'active',
    });

    console.log(`[Phase 1] Active quick sessions in DB: ${activeInDbPhase1.length}`);
    if (activeInDbPhase1.length !== 1) {
      throw new Error(`[Phase 1 FAILED] Expected exactly 1 active session in DB, found ${activeInDbPhase1.length}`);
    }
    console.log('✓ [Phase 1 PASSED] Database unique partial index alone successfully handled 5 concurrent requests!');

    // ─────────────────────────────────────────────────────────
    // Phase 2: Test With In-Memory Lock Enabled
    // ─────────────────────────────────────────────────────────
    console.log('\n--- PHASE 2: In-Memory Lock + DB Guard Test ---');
    delete process.env.BYPASS_IN_MEMORY_DEDUPE;

    // Reset active sessions
    await PracticeSession.deleteMany({ studentId: student._id, courseId: course._id, status: 'active' });

    console.log('[Phase 2] Firing 5 concurrent requests with in-flight lock enabled...');
    const lockTestResults = await Promise.all([
      practiceService.startSession(studentId, payloadQuick, tokenUser),
      practiceService.startSession(studentId, payloadQuick, tokenUser),
      practiceService.startSession(studentId, payloadQuick, tokenUser),
      practiceService.startSession(studentId, payloadQuick, tokenUser),
      practiceService.startSession(studentId, payloadQuick, tokenUser),
    ]);

    const phase2SessionIds = lockTestResults.map((r: any) => r.session._id.toString());
    phase2SessionIds.forEach((id) => createdSessionIds.push(id));
    const uniquePhase2Ids = Array.from(new Set(phase2SessionIds));

    console.log('[Phase 2] Returned Session IDs:', phase2SessionIds);
    if (uniquePhase2Ids.length !== 1) {
      throw new Error(`[Phase 2 FAILED] Expected 1 session ID, got ${uniquePhase2Ids.length}`);
    }

    const activeInDbPhase2 = await PracticeSession.find({
      studentId: student._id,
      courseId: course._id,
      mode: 'quick',
      status: 'active',
    });

    console.log(`[Phase 2] Active quick sessions in DB: ${activeInDbPhase2.length}`);
    if (activeInDbPhase2.length !== 1) {
      throw new Error(`[Phase 2 FAILED] Expected exactly 1 active session in DB, found ${activeInDbPhase2.length}`);
    }
    console.log('✓ [Phase 2 PASSED] In-memory lock + DB guard passed with flying colors!');

    console.log('\n======================================================');
    console.log('ALL CONCURRENCY TESTS PASSED ACCORDING TO SPECIFICATION');
    console.log('======================================================');
  } catch (err) {
    console.error('[Test Run ERROR]:', err);
    process.exit(1);
  } finally {
    // Clean up created test data so DB is left clean
    if (createdSessionIds.length > 0) {
      console.log(`[Teardown] Cleaning up ${createdSessionIds.length} test session records...`);
      await PracticeSession.deleteMany({ _id: { $in: createdSessionIds } });
      console.log('[Teardown] Clean up completed.');
    }
    await mongoose.disconnect();
    process.exit(0);
  }
}

runConcurrencyTests();
