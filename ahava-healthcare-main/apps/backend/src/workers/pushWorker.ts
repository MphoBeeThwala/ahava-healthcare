import { Worker, Job } from 'bullmq';
import { getRedis } from '../services/redis';
import { QUEUE_NAMES } from '../services/queue';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import logger from '../utils/logger';

const prisma = new PrismaClient();

interface PushNotificationJobData {
  userId: string;
  title: string;
  body: string;
  data?: any;
}

/**
 * Send push notification via Expo
 */
async function sendExpoPushNotification(
  pushTokens: string[],
  title: string,
  body: string,
  data?: any
): Promise<any> {
  try {
    const messages = pushTokens.map(token => ({
      to: token,
      sound: 'default',
      title,
      body,
      data,
    }));

    const response = await axios.post(
      'https://exp.host/--/api/v2/push/send',
      messages,
      {
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
      }
    );

    logger.info('Expo push notification sent', {
      tokens: pushTokens.length,
      response: response.data,
    });

    return response.data;
  } catch (error: any) {
    logger.error('Failed to send Expo push notification', {
      error: error.message,
      tokens: pushTokens.length,
    });
    throw error;
  }
}

/**
 * Push notification worker processor
 */
async function processPushNotificationJob(job: Job<PushNotificationJobData>): Promise<any> {
  const { userId, title, body, data } = job.data;

  logger.info('Processing push notification job', {
    jobId: job.id,
    userId,
    title,
  });

  try {
    // Get user's push tokens
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        pushTokens: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (!user.pushTokens || user.pushTokens.length === 0) {
      logger.warn('User has no push tokens', { userId });
      return {
        success: false,
        reason: 'No push tokens',
      };
    }

    // Send push notification
    const result = await sendExpoPushNotification(
      user.pushTokens,
      title,
      body,
      data
    );

    logger.info('Push notification sent', {
      jobId: job.id,
      userId,
      tokens: user.pushTokens.length,
    });

    return {
      success: true,
      result,
    };
  } catch (error: any) {
    logger.error('Failed to send push notification', {
      jobId: job.id,
      userId,
      error: error.message,
    });
    throw error;
  }
}

// Create push notification worker
export const pushWorker = new Worker(
  QUEUE_NAMES.PUSH_NOTIFICATION,
  processPushNotificationJob,
  {
    connection: getRedis(),
    concurrency: 10, // Process 10 notifications concurrently
    limiter: {
      max: 100, // Max 100 jobs
      duration: 60000, // Per minute
    },
  }
);

// Worker event handlers
pushWorker.on('completed', (job) => {
  logger.info('Push notification worker completed job', {
    jobId: job.id,
  });
});

pushWorker.on('failed', (job, err) => {
  logger.error('Push notification worker failed job', {
    jobId: job?.id,
    error: err.message,
  });
});

pushWorker.on('error', (err) => {
  logger.error('Push notification worker error', {
    error: err.message,
  });
});

logger.info('Push notification worker started');

export default pushWorker;


