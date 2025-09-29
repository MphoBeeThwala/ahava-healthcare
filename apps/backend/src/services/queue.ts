import { Queue, Worker, QueueEvents } from 'bullmq';
import { getRedis } from './redis';

// Queue names
export const QUEUE_NAMES = {
  PDF_EXPORT: 'pdf-export',
  PUSH_NOTIFICATION: 'push-notification',
  EMAIL: 'email',
} as const;

// PDF Export Queue
export const pdfExportQueue = new Queue(QUEUE_NAMES.PDF_EXPORT, {
  connection: getRedis(),
  defaultJobOptions: {
    removeOnComplete: 10,
    removeOnFail: 5,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

// Push Notification Queue
export const pushNotificationQueue = new Queue(QUEUE_NAMES.PUSH_NOTIFICATION, {
  connection: getRedis(),
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 10,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  },
});

// Email Queue
export const emailQueue = new Queue(QUEUE_NAMES.EMAIL, {
  connection: getRedis(),
  defaultJobOptions: {
    removeOnComplete: 50,
    removeOnFail: 10,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

export const initializeQueue = async () => {
  // Initialize queue events for monitoring
  const pdfEvents = new QueueEvents(QUEUE_NAMES.PDF_EXPORT, { connection: getRedis() });
  const pushEvents = new QueueEvents(QUEUE_NAMES.PUSH_NOTIFICATION, { connection: getRedis() });
  const emailEvents = new QueueEvents(QUEUE_NAMES.EMAIL, { connection: getRedis() });

  // Log queue events
  pdfEvents.on('completed', ({ jobId, returnvalue }) => {
    console.log(`📄 PDF export job ${jobId} completed`);
  });

  pdfEvents.on('failed', ({ jobId, failedReason }) => {
    console.error(`❌ PDF export job ${jobId} failed:`, failedReason);
  });

  pushEvents.on('completed', ({ jobId }) => {
    console.log(`📱 Push notification job ${jobId} completed`);
  });

  pushEvents.on('failed', ({ jobId, failedReason }) => {
    console.error(`❌ Push notification job ${jobId} failed:`, failedReason);
  });

  emailEvents.on('completed', ({ jobId }) => {
    console.log(`📧 Email job ${jobId} completed`);
  });

  emailEvents.on('failed', ({ jobId, failedReason }) => {
    console.error(`❌ Email job ${jobId} failed:`, failedReason);
  });

  console.log('✅ BullMQ queues initialized');
};

// Helper functions to add jobs
export const addPdfExportJob = async (data: {
  exportJobId: string;
  userId: string;
  filters: any;
  type: string;
}) => {
  return pdfExportQueue.add('generate-pdf', data, {
    priority: 1,
  });
};

export const addPushNotificationJob = async (data: {
  userId: string;
  title: string;
  body: string;
  data?: any;
}) => {
  return pushNotificationQueue.add('send-push', data, {
    priority: 5,
  });
};

export const addEmailJob = async (data: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) => {
  return emailQueue.add('send-email', data, {
    priority: 3,
  });
};
