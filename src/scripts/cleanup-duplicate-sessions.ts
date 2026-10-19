/**
 * Cleanup Duplicate Active Sessions Script
 * 
 * Usage:
 *   Dry-Run (Default, non-destructive preview):
 *     npx ts-node src/scripts/cleanup-duplicate-sessions.ts
 * 
 *   Apply Fix (Cancels older duplicate active sessions):
 *     npx ts-node src/scripts/cleanup-duplicate-sessions.ts --apply
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import dns from 'dns';

dns.setServers(['8.8.8.8', '8.8.4.4']);
dotenv.config({ path: path.join(__dirname, '../../.env') });

import '../models/practice.model';
import { PracticeSession } from '../models/practice.model';

async function cleanupDuplicateActiveSessions() {
  const isApply = process.argv.includes('--apply');

  console.log('='.repeat(60));
  console.log(`[Duplicate Sessions Cleanup] Mode: ${isApply ? '*** APPLY (LIVE UPDATE) ***' : 'DRY-RUN (PREVIEW ONLY)'}`);
  console.log('='.repeat(60));

  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fyp');
    console.log('[Connected] MongoDB connected.');

    // 1. Read-only Aggregation to identify duplicate active sessions per student, course, and mode
    const duplicateGroups = await PracticeSession.aggregate([
      { $match: { status: 'active' } },
      {
        $group: {
          _id: { studentId: '$studentId', courseId: '$courseId', mode: '$mode' },
          count: { $sum: 1 },
          sessionIds: { $push: '$_id' },
          startedAts: { $push: '$startedAt' },
        },
      },
      { $match: { count: { $gt: 1 } } },
    ]);

    console.log(`[Scan] Found ${duplicateGroups.length} group(s) with duplicate active sessions.`);

    if (duplicateGroups.length === 0) {
      console.log('[OK] No duplicate active sessions detected in database. Clean state!');
      process.exit(0);
    }

    let totalCancelled = 0;

    for (const group of duplicateGroups) {
      console.log(`\nGroup: Student ${group._id.studentId}, Course ${group._id.courseId}, Mode: ${group._id.mode || 'quick'} (${group.count} active sessions)`);

      // Fetch all sessions in this group ordered by startedAt descending (newest first)
      const sessions = await PracticeSession.find({
        _id: { $in: group.sessionIds },
        status: 'active',
      }).sort({ startedAt: -1 });

      const [keepSession, ...duplicatesToCancel] = sessions;
      console.log(`  -> Keeping active: ID ${keepSession._id} (started at ${keepSession.startedAt})`);

      for (const dup of duplicatesToCancel) {
        console.log(`  -> Target to cancel: ID ${dup._id} (started at ${dup.startedAt})`);
        if (isApply) {
          await PracticeSession.findByIdAndUpdate(dup._id, {
            status: 'FAILED',
            endedAt: new Date(),
            clampedMessage: 'Cancelled by duplicate active session reconciliation script.',
          });
          totalCancelled++;
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    if (isApply) {
      console.log(`[Completed] Successfully cancelled ${totalCancelled} older duplicate sessions.`);
    } else {
      console.log(`[Dry-Run Complete] ${duplicateGroups.length} duplicate groups identified. No changes written. Run with --apply to execute.`);
    }
    console.log('='.repeat(60));

    process.exit(0);
  } catch (error) {
    console.error('[Error]:', error);
    process.exit(1);
  }
}

cleanupDuplicateActiveSessions();
