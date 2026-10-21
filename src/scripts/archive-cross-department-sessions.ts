/**
 * Script: archive-cross-department-sessions.ts
 *
 * Scans for practice sessions referencing courses outside the student's department
 * and not in the student's enrolledCourseIds.
 *
 * SAFETY GUARANTEES:
 * - Runs in DRY-RUN mode by default (read-only, no modifications).
 * - Only modifies records when explicitly invoked with the `--apply` flag.
 * - NEVER deletes records. Archives by setting `isArchived: true` and `archivedAt: new Date()`.
 * - Does not print secrets or credentials.
 *
 * Usage:
 *   Dry run:  npx ts-node src/scripts/archive-cross-department-sessions.ts
 *   Apply:    npx ts-node src/scripts/archive-cross-department-sessions.ts --apply
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';

// Ensure DNS resolution for SRV records if required
dns.setServers(['8.8.8.8', '8.8.4.4']);
dotenv.config();

import { PracticeSession } from '../models/practice.model';
import { Student } from '../models/student.model';
import { Course } from '../models/course.model';

export async function scanAndArchiveCrossDeptSessions(options: { isApply?: boolean; shouldDisconnect?: boolean } = {}) {
  const isApply = options.isApply ?? process.argv.includes('--apply');
  const shouldDisconnect = options.shouldDisconnect ?? false;

  try {
    console.log(`Scanning practice sessions for cross-department references...`);

    // Fetch all non-archived sessions with populated course and student
    const sessions = await PracticeSession.find({ isArchived: { $ne: true } })
      .populate<{ courseId: any }>('courseId', 'code title departmentId')
      .populate<{ studentId: any }>('studentId', 'name email departmentId enrolledCourseIds');

    const crossDeptSessions: any[] = [];

    for (const session of sessions) {
      const student = session.studentId;
      const course = session.courseId;

      if (!student || !course) continue;

      const studentDeptId = student.departmentId?.toString();
      const courseDeptId = course.departmentId?.toString();

      if (!studentDeptId || !courseDeptId) continue;

      // Check if course belongs to a different department
      const isCrossDept = studentDeptId !== courseDeptId;

      if (isCrossDept) {
        // Check if student was explicitly enrolled in the course
        const enrolledCourseIds = (student.enrolledCourseIds || []).map((id: any) => id.toString());
        const isEnrolled = enrolledCourseIds.includes(course._id.toString());

        if (!isEnrolled) {
          crossDeptSessions.push({
            sessionId: session._id.toString(),
            student: {
              id: student._id.toString(),
              name: student.name,
              email: student.email,
              departmentId: studentDeptId,
            },
            course: {
              id: course._id.toString(),
              code: course.code,
              title: course.title,
              departmentId: courseDeptId,
            },
            mode: session.mode,
            status: session.status,
            questionsAnswered: session.questionsAnswered,
            totalQuestions: session.totalQuestions,
            createdAt: (session as any).createdAt,
          });
        }
      }
    }

    console.log(`\n========================================================`);
    console.log(`IDENTIFIED CROSS-DEPARTMENT SESSIONS: ${crossDeptSessions.length}`);
    console.log(`========================================================\n`);

    if (crossDeptSessions.length === 0) {
      console.log('No cross-department, unenrolled sessions found.');
      return { crossDeptSessions: [], isApply };
    }

    crossDeptSessions.forEach((item, index) => {
      console.log(`[${index + 1}] Session ID: ${item.sessionId}`);
      console.log(`    Student:   ${item.student.name} (${item.student.email}) [Dept: ${item.student.departmentId}]`);
      console.log(`    Course:    ${item.course.code} - ${item.course.title} [Dept: ${item.course.departmentId}]`);
      console.log(`    Mode:      ${item.mode} | Status: ${item.status}`);
      console.log(`    Answered:  ${item.questionsAnswered} of ${item.totalQuestions}`);
      console.log(`    Created:   ${item.createdAt}`);
      console.log('--------------------------------------------------------');
    });

    if (!isApply) {
      console.log(`\n[DRY RUN MODE]`);
      console.log(`No records were modified or deleted.`);
      console.log(`To archive these ${crossDeptSessions.length} sessions, run with the --apply flag:`);
      console.log(`  npx ts-node src/scripts/archive-cross-department-sessions.ts --apply\n`);
    } else {
      console.log(`\n[APPLY MODE: ARCHIVING SESSIONS]`);
      const sessionIdsToArchive = crossDeptSessions.map((s) => s.sessionId);

      const updateResult = await PracticeSession.updateMany(
        { _id: { $in: sessionIdsToArchive } },
        {
          $set: {
            isArchived: true,
            archivedAt: new Date(),
          },
        }
      );

      console.log(`Successfully archived ${updateResult.modifiedCount} session(s).`);
      console.log(`All original session and answer records are preserved in place with isArchived: true.\n`);
    }

    return { crossDeptSessions, isApply };
  } catch (err) {
    console.error('Error during execution:', err);
    throw err;
  } finally {
    if (shouldDisconnect) {
      await mongoose.disconnect();
      console.log('Disconnected from database.');
    }
  }
}

async function main() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('Error: MONGODB_URI environment variable is not defined.');
    process.exit(1);
  }
  console.log('Connecting to database...');
  await mongoose.connect(mongoUri);
  await scanAndArchiveCrossDeptSessions({ shouldDisconnect: true });
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
