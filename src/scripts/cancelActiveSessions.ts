import mongoose from 'mongoose';
import { PracticeSession } from '../models/practice.model';
import dotenv from 'dotenv';
import path from 'path';
import dns from 'dns';

// Force Google DNS to resolve MongoDB Atlas SRV records if local DNS is blocking them
dns.setServers(['8.8.8.8', '8.8.4.4']);

dotenv.config();

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fyp');
    console.log('Connected to MongoDB');

    const result = await PracticeSession.updateMany(
      { status: 'active' },
      {
        $set: {
          status: 'FAILED',
        }
      }
    );

    console.log(`Updated ${result.modifiedCount} active sessions to FAILED.`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

run();
