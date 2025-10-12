import { Worker, Job } from 'bullmq';
import { getRedis } from '../services/redis';
import { QUEUE_NAMES } from '../services/queue';
import { PrismaClient } from '@prisma/client';
import PDFDocument from 'pdfkit';
import { createWriteStream, existsSync, mkdirSync } from 'fs';
import path from 'path';
import logger from '../utils/logger';
import { generateChecksum } from '../utils/encryption';

const prisma = new PrismaClient();

interface PdfExportJobData {
  exportJobId: string;
  userId: string;
  type: string;
  filters: any;
}

const EXPORT_DIR = process.env.EXPORT_STORAGE_DIR || path.join(process.cwd(), 'exports');

// Create export directory if it doesn't exist
if (!existsSync(EXPORT_DIR)) {
  mkdirSync(EXPORT_DIR, { recursive: true });
}

/**
 * Generate PDF for visit report
 */
async function generateVisitReportPDF(visitId: string, outputPath: string): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      // Get visit data
      const visit = await prisma.visit.findUnique({
        where: { id: visitId },
        include: {
          booking: {
            include: {
              patient: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                  phone: true,
                  dateOfBirth: true,
                  gender: true,
                },
              },
            },
          },
          nurse: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          doctor: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          payments: true,
        },
      });

      if (!visit) {
        throw new Error('Visit not found');
      }

      // Create PDF document
      const doc = new PDFDocument({ margin: 50 });
      const stream = createWriteStream(outputPath);

      doc.pipe(stream);

      // Header
      doc.fontSize(20).text('Ahava Healthcare', { align: 'center' });
      doc.fontSize(16).text('Visit Report', { align: 'center' });
      doc.moveDown();

      // Visit Information
      doc.fontSize(14).text('Visit Information', { underline: true });
      doc.fontSize(10);
      doc.text(`Visit ID: ${visit.id}`);
      doc.text(`Status: ${visit.status}`);
      doc.text(`Scheduled: ${visit.scheduledStart.toISOString()}`);
      if (visit.actualStart) {
        doc.text(`Started: ${visit.actualStart.toISOString()}`);
      }
      if (visit.actualEnd) {
        doc.text(`Ended: ${visit.actualEnd.toISOString()}`);
      }
      doc.moveDown();

      // Patient Information
      doc.fontSize(14).text('Patient Information', { underline: true });
      doc.fontSize(10);
      doc.text(`Name: ${visit.booking.patient.firstName} ${visit.booking.patient.lastName}`);
      doc.text(`Email: ${visit.booking.patient.email}`);
      if (visit.booking.patient.phone) {
        doc.text(`Phone: ${visit.booking.patient.phone}`);
      }
      doc.moveDown();

      // Nurse Information
      if (visit.nurse) {
        doc.fontSize(14).text('Nurse Information', { underline: true });
        doc.fontSize(10);
        doc.text(`Name: ${visit.nurse.firstName} ${visit.nurse.lastName}`);
        doc.text(`Email: ${visit.nurse.email}`);
        doc.moveDown();
      }

      // Doctor Information
      if (visit.doctor) {
        doc.fontSize(14).text('Doctor Information', { underline: true });
        doc.fontSize(10);
        doc.text(`Name: ${visit.doctor.firstName} ${visit.doctor.lastName}`);
        doc.text(`Email: ${visit.doctor.email}`);
        doc.moveDown();
      }

      // Payment Information
      if (visit.payments.length > 0) {
        doc.fontSize(14).text('Payment Information', { underline: true });
        doc.fontSize(10);
        visit.payments.forEach((payment) => {
          doc.text(`Amount: R${(payment.amountInCents / 100).toFixed(2)}`);
          doc.text(`Status: ${payment.status}`);
          doc.text(`Date: ${payment.createdAt.toISOString()}`);
        });
        doc.moveDown();
      }

      // Footer
      doc.fontSize(8).text(
        `Generated on ${new Date().toISOString()}`,
        50,
        doc.page.height - 50,
        { align: 'center' }
      );

      doc.end();

      stream.on('finish', resolve);
      stream.on('error', reject);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * PDF export worker processor
 */
async function processPdfExportJob(job: Job<PdfExportJobData>): Promise<any> {
  const { exportJobId, userId, type, filters } = job.data;

  logger.info('Processing PDF export job', {
    jobId: job.id,
    exportJobId,
    userId,
    type,
  });

  try {
    // Update job status to processing
    await prisma.exportJob.update({
      where: { id: exportJobId },
      data: {
        status: 'PROCESSING',
      },
    });

    // Generate filename
    const filename = `export-${exportJobId}-${Date.now()}.pdf`;
    const outputPath = path.join(EXPORT_DIR, filename);

    // Generate PDF based on type
    switch (type) {
      case 'visit_report':
        if (!filters.visitId) {
          throw new Error('visitId required for visit report');
        }
        await generateVisitReportPDF(filters.visitId, outputPath);
        break;

      default:
        throw new Error(`Unsupported export type: ${type}`);
    }

    // Get file size
    const fs = require('fs');
    const stats = fs.statSync(outputPath);
    const fileSize = stats.size;

    // Generate checksum
    const fileContent = fs.readFileSync(outputPath);
    const checksum = generateChecksum(fileContent);

    // Update export job
    await prisma.exportJob.update({
      where: { id: exportJobId },
      data: {
        status: 'COMPLETED',
        fileUrl: `/exports/${filename}`,
        fileSize,
        checksum,
        completedAt: new Date(),
      },
    });

    logger.info('PDF export completed', {
      jobId: job.id,
      exportJobId,
      filename,
      fileSize,
    });

    return {
      success: true,
      filename,
      fileSize,
      checksum,
    };
  } catch (error: any) {
    logger.error('Failed to generate PDF', {
      jobId: job.id,
      exportJobId,
      error: error.message,
    });

    // Update job status to failed
    await prisma.exportJob.update({
      where: { id: exportJobId },
      data: {
        status: 'FAILED',
      },
    }).catch(err => {
      logger.error('Failed to update export job status', err);
    });

    throw error;
  }
}

// Create PDF export worker
export const pdfWorker = new Worker(
  QUEUE_NAMES.PDF_EXPORT,
  processPdfExportJob,
  {
    connection: getRedis(),
    concurrency: 2, // Process 2 PDFs concurrently
    limiter: {
      max: 10, // Max 10 jobs
      duration: 60000, // Per minute
    },
  }
);

// Worker event handlers
pdfWorker.on('completed', (job) => {
  logger.info('PDF worker completed job', {
    jobId: job.id,
  });
});

pdfWorker.on('failed', (job, err) => {
  logger.error('PDF worker failed job', {
    jobId: job?.id,
    error: err.message,
  });
});

pdfWorker.on('error', (err) => {
  logger.error('PDF worker error', {
    error: err.message,
  });
});

logger.info('PDF worker started');

export default pdfWorker;


