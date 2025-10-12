/**
 * Worker Process Entry Point
 * 
 * This file initializes and starts all BullMQ workers.
 * Run separately from the main API server for better scalability.
 * 
 * Usage:
 *   npm run worker
 * or
 *   tsx src/workers/index.ts
 */

import dotenv from 'dotenv';
import { initializeRedis } from '../services/redis';
import logger from '../utils/logger';

// Load environment variables
dotenv.config();

// Import workers
import emailWorker from './emailWorker';
import pdfWorker from './pdfWorker';
import pushWorker from './pushWorker';

async function startWorkers() {
  try {
    // Initialize Redis connection
    await initializeRedis();
    logger.info('Redis connected for workers');

    // Workers are auto-started on import
    logger.info('All workers started successfully', {
      workers: ['email', 'pdf', 'push'],
    });

    logger.info('Worker process ready to handle jobs');
  } catch (error: any) {
    logger.error('Failed to start workers', error);
    process.exit(1);
  }
}

// Graceful shutdown
const gracefulShutdown = async () => {
  logger.info('Shutting down workers gracefully');

  try {
    await emailWorker.close();
    await pdfWorker.close();
    await pushWorker.close();

    logger.info('All workers closed successfully');
    process.exit(0);
  } catch (error: any) {
    logger.error('Error during worker shutdown', error);
    process.exit(1);
  }
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection', {
    reason,
    promise,
  });
});

// Uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', error);
  process.exit(1);
});

// Start workers
startWorkers();


