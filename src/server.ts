import dns from 'dns';

if (process.env.CUSTOM_DNS) {
  dns.setServers(process.env.CUSTOM_DNS.split(',').map((s) => s.trim()));
} else if (process.env.NODE_ENV !== 'production' && !process.env.DOCKER_CONTAINER && !process.env.DISABLE_CUSTOM_DNS) {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
}

import app from './app';
import { env } from './config/env';
import { logger } from './utils/logger';
import mongoose, { connectDatabase } from './config/db';
import { redisClient, isMockRedis } from './config/redis';
import { examWorker } from './jobs/exam.job';

const startServer = async () => {
  await connectDatabase();
  
  const port = parseInt(env.PORT, 10);
  
  const server = app.listen(port, () => {
    logger.info(`Server running in ${env.NODE_ENV} mode on port ${port}`);
  });

  const gracefulShutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);
    server.close(async () => {
      logger.info('HTTP server closed.');
      try {
        if (examWorker) {
          await examWorker.close();
          logger.info('BullMQ worker closed.');
        }
        await mongoose.connection.close();
        logger.info('MongoDB connection closed.');
        if (!isMockRedis && redisClient) {
          await redisClient.quit();
          logger.info('Redis connection closed.');
        }
        process.exit(0);
      } catch (err) {
        logger.error('Error during graceful shutdown:', err);
        process.exit(1);
      }
    });

    // Force close after 10s if tasks remain hung
    setTimeout(() => {
      logger.error('Forced shutdown due to timeout');
      process.exit(1);
    }, 10000).unref();
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err: any) => {
    logger.error('Unhandled Rejection:', err);
    server.close(() => process.exit(1));
  });
};

startServer();

