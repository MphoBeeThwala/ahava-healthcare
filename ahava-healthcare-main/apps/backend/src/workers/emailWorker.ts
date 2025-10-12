import { Worker, Job } from 'bullmq';
import { getRedis } from '../services/redis';
import { QUEUE_NAMES } from '../services/queue';
import nodemailer from 'nodemailer';
import logger from '../utils/logger';

interface EmailJobData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT || '1025'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER ? {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    } : undefined,
  });
};

/**
 * Email worker processor
 */
async function processEmailJob(job: Job<EmailJobData>): Promise<any> {
  const { to, subject, html, text } = job.data;

  logger.info('Processing email job', {
    jobId: job.id,
    to,
    subject,
  });

  try {
    const transporter = createTransporter();

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@ahavahealthcare.co.za',
      to,
      subject,
      text: text || '',
      html,
    });

    logger.info('Email sent successfully', {
      jobId: job.id,
      to,
      messageId: info.messageId,
    });

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error: any) {
    logger.error('Failed to send email', {
      jobId: job.id,
      error: error.message,
      to,
    });
    throw error;
  }
}

// Create email worker
export const emailWorker = new Worker(
  QUEUE_NAMES.EMAIL,
  processEmailJob,
  {
    connection: getRedis(),
    concurrency: 5, // Process 5 emails concurrently
    limiter: {
      max: 100, // Max 100 jobs
      duration: 60000, // Per minute
    },
  }
);

// Worker event handlers
emailWorker.on('completed', (job) => {
  logger.info('Email worker completed job', {
    jobId: job.id,
  });
});

emailWorker.on('failed', (job, err) => {
  logger.error('Email worker failed job', {
    jobId: job?.id,
    error: err.message,
  });
});

emailWorker.on('error', (err) => {
  logger.error('Email worker error', {
    error: err.message,
  });
});

logger.info('Email worker started');

export default emailWorker;


