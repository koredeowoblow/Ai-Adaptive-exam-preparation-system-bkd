import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';

// Allow custom DNS for ISPs that block MongoDB Atlas SRV records, while preserving container DNS in production
if (process.env.CUSTOM_DNS) {
  dns.setServers(process.env.CUSTOM_DNS.split(',').map((s) => s.trim()));
} else if (process.env.NODE_ENV !== 'production' && !process.env.DOCKER_CONTAINER && !process.env.DISABLE_CUSTOM_DNS) {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
}

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
