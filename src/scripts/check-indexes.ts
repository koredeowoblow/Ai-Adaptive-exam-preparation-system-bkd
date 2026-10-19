import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import dns from 'dns';

dns.setServers(['8.8.8.8', '8.8.4.4']);
dotenv.config({ path: path.join(__dirname, '../../.env') });

import '../models/practice.model';
import { PracticeSession } from '../models/practice.model';

async function checkIndexes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fyp');
    console.log('[CheckIndexes] Connected to MongoDB');

    // Wait for Mongoose indexes to sync or error
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const indexes = await PracticeSession.collection.indexes();
    console.log('[CheckIndexes] Current MongoDB indexes on practicesessions:');
    console.dir(indexes, { depth: null });

    const uniqueIndex = indexes.find((idx) => {
      return (
        idx.unique === true &&
        idx.key &&
        idx.key.studentId === 1 &&
        idx.key.courseId === 1 &&
        (idx.key.mode === 1 || idx.key.totalQuestions === 1)
      );
    });

    if (uniqueIndex) {
      console.log('[CheckIndexes] UNIQUE PARTIAL INDEX EXISTS:', uniqueIndex);
    } else {
      console.warn('[CheckIndexes] UNIQUE PARTIAL INDEX NOT FOUND YET.');
    }

    process.exit(0);
  } catch (error) {
    console.error('[CheckIndexes] Error:', error);
    process.exit(1);
  }
}

checkIndexes();
