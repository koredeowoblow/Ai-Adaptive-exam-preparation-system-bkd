import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);
import mongoose from 'mongoose';
import { connectDatabase } from '../config/db';
import { Question } from '../models/question.model';
import { redisClient } from '../config/redis';

async function run() {
  await connectDatabase();
  console.log('Connected to DB. Finding questions with Variant...');
  const questions = await Question.find({ questionText: /\[Variant\s+\d+\]/i });
  console.log(`Found ${questions.length} questions to clean.`);
  let updated = 0;
  for (const q of questions) {
    const cleaned = q.questionText.replace(/\s*\[Variant\s+\d+\]\s*$/i, '').trim();
    if (cleaned !== q.questionText) {
      q.questionText = cleaned;
      await q.save();
      updated++;
    }
  }
  console.log(`Updated ${updated} questions successfully.`);
  await redisClient.flushdb().catch(() => {});
  console.log('Flushed cache.');
  await mongoose.disconnect();
  console.log('Done.');
}

run().catch((err) => {
  console.error('Error cleaning questions:', err);
  process.exit(1);
});
