import { PrismaClient, PaymentStatus, PaymentMethod, Booking } from '@prisma/client';
import paystackService from './paystack';
import logger from '../utils/logger';

const prisma = new PrismaClient();

interface CreatePaymentParams {
  bookingId: string;
  amountInCents: number;
  paymentMethod: PaymentMethod;
  userId: string;
}

interface ProcessPaymentParams {
  bookingId: string;
  email: string;
  callbackUrl?: string;
}

class PaymentService {
  /**
   * Create a payment record for a booking
   */
  async createPayment(params: CreatePaymentParams) {
    try {
      // Verify booking exists and belongs to user
      const booking = await prisma.booking.findUnique({
        where: { id: params.bookingId },
        include: {
          patient: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          visit: {
            select: {
              id: true,
            },
          },
        },
      });

      if (!booking) {
        throw new Error('Booking not found');
      }

      if (booking.patientId !== params.userId) {
        throw new Error('Unauthorized: Booking does not belong to user');
      }

      // Check if payment already exists for this booking
      if (booking.visit) {
        const existingPayment = await prisma.payment.findFirst({
          where: { visitId: booking.visit.id },
        });

        if (existingPayment && existingPayment.status === PaymentStatus.COMPLETED) {
          throw new Error('Payment already completed for this booking');
        }
      }

      // Create visit if not exists
      let visitId = booking.visit?.id;
      if (!visitId) {
        const visit = await prisma.visit.create({
          data: {
            bookingId: params.bookingId,
            nurseId: booking.nurseId || '', // Will be assigned later
            scheduledStart: booking.scheduledDate,
            status: 'SCHEDULED',
          },
        });
        visitId = visit.id;
      }

      // Create payment record
      const payment = await prisma.payment.create({
        data: {
          visitId,
          amountInCents: params.amountInCents,
          currency: 'ZAR',
          status: PaymentStatus.PENDING,
        },
        include: {
          visit: {
            include: {
              booking: {
                include: {
                  patient: {
                    select: {
                      id: true,
                      email: true,
                      firstName: true,
                      lastName: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      logger.info('Payment record created', {
        paymentId: payment.id,
        bookingId: params.bookingId,
        amount: params.amountInCents,
      });

      return payment;
    } catch (error: any) {
      logger.error('Failed to create payment', {
        error: error.message,
        params,
      });
      throw error;
    }
  }

  /**
   * Initialize payment with Paystack
   */
  async initializePaystackPayment(params: ProcessPaymentParams) {
    try {
      // Get booking details
      const booking = await prisma.booking.findUnique({
        where: { id: params.bookingId },
        include: {
          patient: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          visit: {
            include: {
              payments: {
                orderBy: {
                  createdAt: 'desc',
                },
                take: 1,
              },
            },
          },
        },
      });

      if (!booking) {
        throw new Error('Booking not found');
      }

      if (!booking.visit) {
        throw new Error('Visit not created for booking');
      }

      const payment = booking.visit.payments[0];
      if (!payment) {
        throw new Error('Payment record not found');
      }

      if (payment.status === PaymentStatus.COMPLETED) {
        throw new Error('Payment already completed');
      }

      // Generate payment reference
      const reference = paystackService.generateReference();

      // Initialize payment with Paystack
      const paystackResponse = await paystackService.initializePayment({
        email: params.email || booking.patient.email,
        amount: payment.amountInCents, // Amount in kobo (cents)
        reference,
        currency: 'ZAR',
        metadata: {
          bookingId: params.bookingId,
          visitId: booking.visit.id,
          paymentId: payment.id,
          patientId: booking.patientId,
          patientName: `${booking.patient.firstName} ${booking.patient.lastName}`,
        },
        callback_url: params.callbackUrl,
        channels: ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer'],
      });

      // Update payment record with Paystack reference
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          paystackReference: reference,
          status: PaymentStatus.PROCESSING,
          paystackData: paystackResponse as any,
        },
      });

      // Update booking payment reference
      await prisma.booking.update({
        where: { id: params.bookingId },
        data: {
          paystackReference: reference,
          paymentStatus: 'PROCESSING',
        },
      });

      logger.info('Paystack payment initialized', {
        reference,
        bookingId: params.bookingId,
        paymentId: payment.id,
      });

      return {
        reference,
        authorizationUrl: paystackResponse.data.authorization_url,
        accessCode: paystackResponse.data.access_code,
        payment,
      };
    } catch (error: any) {
      logger.error('Failed to initialize Paystack payment', {
        error: error.message,
        params,
      });
      throw error;
    }
  }

  /**
   * Verify and complete payment
   */
  async verifyPayment(reference: string) {
    try {
      logger.info('Verifying payment', { reference });

      // Verify with Paystack
      const paystackResponse = await paystackService.verifyPayment(reference);

      if (!paystackResponse.status) {
        throw new Error('Payment verification failed');
      }

      const transactionData = paystackResponse.data;

      // Find payment by reference
      const payment = await prisma.payment.findFirst({
        where: { paystackReference: reference },
        include: {
          visit: {
            include: {
              booking: true,
            },
          },
        },
      });

      if (!payment) {
        logger.error('Payment not found for reference', { reference });
        throw new Error('Payment not found');
      }

      // Check if payment was successful
      const isSuccessful = transactionData.status === 'success';

      // Update payment status
      const updatedPayment = await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: isSuccessful ? PaymentStatus.COMPLETED : PaymentStatus.FAILED,
          paystackData: transactionData as any,
        },
      });

      // Update booking status
      await prisma.booking.update({
        where: { id: payment.visit.bookingId },
        data: {
          paymentStatus: isSuccessful ? 'COMPLETED' : 'FAILED',
        },
      });

      logger.info('Payment verified and updated', {
        reference,
        paymentId: payment.id,
        status: transactionData.status,
        amount: transactionData.amount,
      });

      return {
        success: isSuccessful,
        payment: updatedPayment,
        transactionData,
      };
    } catch (error: any) {
      logger.error('Failed to verify payment', {
        error: error.message,
        reference,
      });
      throw error;
    }
  }

  /**
   * Process refund for a payment
   */
  async processRefund(paymentId: string, reason?: string, partialAmount?: number) {
    try {
      // Get payment details
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
          visit: {
            include: {
              booking: {
                include: {
                  patient: true,
                },
              },
            },
          },
        },
      });

      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.status !== PaymentStatus.COMPLETED) {
        throw new Error('Only completed payments can be refunded');
      }

      if (!payment.paystackReference) {
        throw new Error('Payment reference not found');
      }

      // Process refund with Paystack
      const refundResponse = await paystackService.processRefund({
        reference: payment.paystackReference,
        amount: partialAmount, // Optional partial refund
        merchant_note: reason || 'Booking cancelled',
        customer_note: 'Your payment has been refunded',
      });

      // Update payment status
      const updatedPayment = await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.REFUNDED,
          paystackData: {
            ...(payment.paystackData as any),
            refund: refundResponse,
          } as any,
        },
      });

      // Update booking status
      await prisma.booking.update({
        where: { id: payment.visit.bookingId },
        data: {
          paymentStatus: 'REFUNDED',
        },
      });

      logger.info('Refund processed successfully', {
        paymentId,
        reference: payment.paystackReference,
        amount: partialAmount || payment.amountInCents,
      });

      return updatedPayment;
    } catch (error: any) {
      logger.error('Failed to process refund', {
        error: error.message,
        paymentId,
      });
      throw error;
    }
  }

  /**
   * Handle insurance payment (manual verification)
   */
  async processInsurancePayment(bookingId: string, adminId: string) {
    try {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          visit: {
            include: {
              payments: true,
            },
          },
        },
      });

      if (!booking) {
        throw new Error('Booking not found');
      }

      if (booking.paymentMethod !== PaymentMethod.INSURANCE) {
        throw new Error('Booking is not set for insurance payment');
      }

      if (!booking.visit) {
        throw new Error('Visit not created for booking');
      }

      const payment = booking.visit.payments[0];
      if (!payment) {
        throw new Error('Payment record not found');
      }

      // Update payment to completed (after insurance verification)
      const updatedPayment = await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.COMPLETED,
          paystackData: {
            type: 'insurance',
            verifiedBy: adminId,
            verifiedAt: new Date().toISOString(),
          } as any,
        },
      });

      // Update booking
      await prisma.booking.update({
        where: { id: bookingId },
        data: {
          paymentStatus: 'COMPLETED',
          insuranceStatus: 'VERIFIED',
        },
      });

      logger.info('Insurance payment verified', {
        bookingId,
        paymentId: payment.id,
        verifiedBy: adminId,
      });

      return updatedPayment;
    } catch (error: any) {
      logger.error('Failed to process insurance payment', {
        error: error.message,
        bookingId,
      });
      throw error;
    }
  }

  /**
   * Get payment history for a user
   */
  async getUserPayments(userId: string, limit: number = 50, offset: number = 0) {
    try {
      const payments = await prisma.payment.findMany({
        where: {
          visit: {
            booking: {
              patientId: userId,
            },
          },
        },
        include: {
          visit: {
            include: {
              booking: {
                select: {
                  id: true,
                  scheduledDate: true,
                  estimatedDuration: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: offset,
      });

      return payments;
    } catch (error: any) {
      logger.error('Failed to get user payments', {
        error: error.message,
        userId,
      });
      throw error;
    }
  }
}

// Singleton instance
const paymentService = new PaymentService();

export default paymentService;
export { PaymentService };


