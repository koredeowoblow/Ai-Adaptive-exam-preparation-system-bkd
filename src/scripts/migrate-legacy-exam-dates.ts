import mongoose from 'mongoose';
import { connectDatabase } from '../config/db';
import { Student } from '../models/student.model';
import { logger } from '../utils/logger';
import { validateExamDate } from '../utils/dateValidation';
import dotenv from 'dotenv';
dotenv.config();

export interface MigrationResult {
  scanned: number;
  matched: number;
  migrated: number;
  dryRun: boolean;
}

export async function migrateLegacyExamDates(options: { apply?: boolean } = {}): Promise<MigrationResult> {
  const isApply = options.apply ?? process.argv.includes('--apply');

  logger.info('========================================================');
  logger.info('LEGACY EXAM DATES TO courseExamDates MIGRATION TOOL');
  logger.info('========================================================');
  logger.info(`Mode: ${isApply ? 'APPLY (Writing changes to database)' : 'DRY RUN (Read-Only preview)'}`);

  const students = await Student.find({
    nextExamDate: { $ne: null, $exists: true },
    enrolledCourseIds: { $exists: true, $not: { $size: 0 } },
  }).select('_id email nextExamDate enrolledCourseIds courseExamDates');

  let matched = 0;
  let migrated = 0;

  for (const student of students) {
    const legacyDate = student.nextExamDate ? student.nextExamDate.trim() : null;
    if (!legacyDate) continue;

    const dateCheck = validateExamDate(legacyDate);
    if (!dateCheck.isValid || !dateCheck.cleanDate) {
      logger.warn(`Skipping student ${student.email}: invalid legacy date "${legacyDate}"`);
      continue;
    }

    const rawMap = (student as any).courseExamDates || {};
    const existingDates = rawMap instanceof Map ? Object.fromEntries(rawMap.entries()) : { ...rawMap };

    // Find enrolled courses missing a specific date
    const enrolledIds = (student.enrolledCourseIds || []).map((id) => id.toString());
    const newDates: Record<string, string> = { ...existingDates };
    let hasChanges = false;

    for (const cId of enrolledIds) {
      if (!newDates[cId]) {
        newDates[cId] = dateCheck.cleanDate;
        hasChanges = true;
      }
    }

    if (hasChanges) {
      matched++;
      logger.info(`Candidate: Student ${student.email} (${student._id}) -> populate ${enrolledIds.length} courses with date ${dateCheck.cleanDate}`);

      if (isApply) {
        await Student.findByIdAndUpdate(student._id, {
          $set: {
            courseExamDates: newDates,
          },
        });
        migrated++;
      }
    }
  }

  logger.info('========================================================');
  logger.info(`Migration Summary: ${students.length} scanned, ${matched} matched, ${migrated} updated`);
  logger.info('========================================================');

  return {
    scanned: students.length,
    matched,
    migrated,
    dryRun: !isApply,
  };
}

if (require.main === module) {
  (async () => {
    try {
      await connectDatabase();
      await migrateLegacyExamDates();
    } catch (err) {
      logger.error('Migration failed:', err);
      process.exit(1);
    } finally {
      await mongoose.disconnect();
      process.exit(0);
    }
  })();
}
