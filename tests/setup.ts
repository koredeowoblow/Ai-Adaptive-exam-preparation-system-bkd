import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { env } from '../src/config/env';

jest.mock('ioredis', () => {
  const RedisMock = require('ioredis-mock');
  RedisMock.Redis = RedisMock;
  return RedisMock;
});

jest.mock('bullmq', () => ({
  Queue: jest.fn().mockImplementation(() => ({
    add: jest.fn().mockResolvedValue({ id: 'job-1' }),
    addBulk: jest.fn().mockResolvedValue([{ id: 'job-1' }]),
    close: jest.fn().mockResolvedValue(undefined),
  })),
  Worker: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    close: jest.fn().mockResolvedValue(undefined),
  })),
  Job: jest.fn(),
}));

// Allow up to 60s for MongoMemoryServer to download/start the binary
jest.setTimeout(60000);

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  console.log('Starting MongoMemoryServer...');
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  console.log(`MongoMemoryServer started at ${mongoUri}`);
  
  env.MONGODB_URI = mongoUri;
  process.env.MONGODB_URI = mongoUri;

  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(mongoUri);
  }

  const { redisClient } = require('../src/utils/cache');
  if (redisClient && redisClient.status !== 'ready') {
    await redisClient.connect().catch(() => {});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  const { redisClient } = require('../src/utils/cache');
  try {
    if (redisClient) redisClient.disconnect();
  } catch (e) {}
  if (mongoServer) {
    await mongoServer.stop();
  }
});
