import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);

import app from './app';
import { env } from './config/env';
import { logger } from './utils/logger';
import { connectDatabase } from './config/db';
import './config/redis'; // Initialize Redis connection
import './jobs/exam.job'; // Initialize Exam worker

const startServer = async () => {
  await connectDatabase();
  
  const port = parseInt(env.PORT, 10);
  
  const server = app.listen(port, () => {
    logger.info(`Server running in ${env.NODE_ENV} mode on port ${port}`);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err: any) => {
    logger.error('Unhandled Rejection:', err);
    server.close(() => process.exit(1));
  });
};

startServer();
