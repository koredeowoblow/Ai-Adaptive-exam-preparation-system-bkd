import mongoose from 'mongoose';
import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);
import dotenv from 'dotenv';
dotenv.config();

import { Student } from '../models/student.model';
import { Course } from '../models/course.model';
import { Topic } from '../models/topic.model';
import { Question } from '../models/question.model';
import { PracticeSession } from '../models/practice.model';
import { Department } from '../models/department.model';

async function runIndexAuditAndCleanup() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not defined');
    process.exit(1);
  }

  console.log('Connecting to database...');
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  if (!db) {
    console.error('Failed to obtain database handle');
    process.exit(1);
  }

  console.log('\n========================================');
  console.log('1. CURRENT DATABASE INDEX PROOF');
  console.log('========================================');

  const models = [
    { name: 'Student', model: Student, collection: 'students' },
    { name: 'Course', model: Course, collection: 'courses' },
    { name: 'Topic', model: Topic, collection: 'topics' },
    { name: 'Question', model: Question, collection: 'questions' },
    { name: 'PracticeSession', model: PracticeSession, collection: 'practicesessions' },
    { name: 'Department', model: Department, collection: 'departments' },
  ];

  for (const item of models) {
    try {
      const indexes = await db.collection(item.collection).indexes();
      console.log(`\nCollection [${item.collection}] (${indexes.length} indexes):`);
      for (const idx of indexes) {
        const uniqueTag = idx.unique ? ' [UNIQUE]' : '';
        console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}${uniqueTag}`);
      }
    } catch (err: any) {
      console.log(`Collection [${item.collection}]: error fetching indexes - ${err.message}`);
    }
  }

  console.log('\n========================================');
  console.log('2. SYNCHRONIZING & CLEANING INDEXES');
  console.log('========================================');

  for (const item of models) {
    try {
      console.log(`Synchronizing indexes for ${item.name}...`);
      const syncResult = await item.model.syncIndexes();
      console.log(`  Result for ${item.name}:`, syncResult || 'Clean (in sync)');
    } catch (err: any) {
      console.error(`  Error syncing ${item.name}:`, err.message);
    }
  }

  console.log('\n========================================');
  console.log('3. POST-CLEANUP VERIFICATION');
  console.log('========================================');

  for (const item of models) {
    const indexes = await db.collection(item.collection).indexes();
    console.log(`Verified [${item.collection}]: ${indexes.map((i) => i.name).join(', ')}`);
  }

  console.log('\nIndex audit and cleanup complete.');
  await mongoose.disconnect();
  process.exit(0);
}

runIndexAuditAndCleanup().catch((err) => {
  console.error('Fatal error during index audit:', err);
  process.exit(1);
});
