import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';

// Force Google DNS to resolve MongoDB Atlas SRV records if local DNS is blocking them
dns.setServers(['8.8.8.8', '8.8.4.4']);

dotenv.config();

export const connectDatabase = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/e2e_chat';
  try {
    await mongoose.connect(uri);
    console.log('MongoDB connected successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
};

export default mongoose;
