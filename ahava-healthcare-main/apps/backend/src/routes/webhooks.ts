import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';
import { webhookRateLimiter } from '../middleware/rateLimiter';
import paystackService from '../services/paystack';
import paymentService from '../services/payment';
import logger from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();

// Paystack webhook endpoint
router.post('/paystack', webhookRateLimiter, async (req: Request, res: Response, next: NextFunction) => {
	try {
		// Get the signature from headers
		const signature = req.headers['x-paystack-signature'] as string;
		
		if (!signature) {
			logger.security('Paystack webhook received without signature');
			return res.status(400).json({ error: 'Missing signature' });
		}

		// Verify webhook signature
		const payload = JSON.stringify(req.body);
		const isValid = paystackService.verifyWebhookSignature(payload, signature);

		if (!isValid) {
			logger.security('Invalid Paystack webhook signature', {
				event: req.body.event,
			});
			return res.status(401).json({ error: 'Invalid signature' });
		}

		const event = req.body;

		logger.info('Paystack webhook received', {
			event: event.event,
			reference: event.data?.reference,
		});

		// Handle different event types
		switch (event.event) {
			case 'charge.success':
				await handleChargeSuccess(event.data);
				break;

			case 'charge.failed':
				await handleChargeFailed(event.data);
				break;

			case 'transfer.success':
				await handleTransferSuccess(event.data);
				break;

			case 'transfer.failed':
				await handleTransferFailed(event.data);
				break;

			case 'refund.processed':
				await handleRefundProcessed(event.data);
				break;

			default:
				logger.info('Unhandled webhook event type', {
					event: event.event,
				});
		}

		// Always return 200 to acknowledge receipt
		res.status(200).json({ success: true });
	} catch (error: any) {
		logger.error('Webhook processing error', {
			error: error.message,
			event: req.body?.event,
		});
		// Still return 200 to prevent retries
		res.status(200).json({ success: false, error: error.message });
	}
});

/**
 * Handle successful charge
 */
async function handleChargeSuccess(data: any) {
	try {
		const reference = data.reference;

		logger.info('Processing charge success webhook', { reference });

		// Verify and update payment
		await paymentService.verifyPayment(reference);

		logger.info('Charge success processed', { reference });
	} catch (error: any) {
		logger.error('Error handling charge success', {
			error: error.message,
			reference: data.reference,
		});
	}
}

/**
 * Handle failed charge
 */
async function handleChargeFailed(data: any) {
	try {
		const reference = data.reference;

		logger.info('Processing charge failed webhook', { reference });

		// Find and update payment
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
			logger.error('Payment not found for failed charge', { reference });
			return;
		}

		// Update payment status
		await prisma.payment.update({
			where: { id: payment.id },
			data: {
				status: 'FAILED',
				paystackData: {
					...(payment.paystackData as any),
					failureReason: data.message || 'Payment failed',
				} as any,
			},
		});

		// Update booking
		await prisma.booking.update({
			where: { id: payment.visit.bookingId },
			data: {
				paymentStatus: 'FAILED',
			},
		});

		logger.info('Charge failed processed', { reference });
	} catch (error: any) {
		logger.error('Error handling charge failed', {
			error: error.message,
			reference: data.reference,
		});
	}
}

/**
 * Handle successful transfer (payouts to nurses/doctors)
 */
async function handleTransferSuccess(data: any) {
	try {
		logger.info('Transfer successful', {
			reference: data.reference,
			amount: data.amount,
		});

		// TODO: Update payout records when implemented
	} catch (error: any) {
		logger.error('Error handling transfer success', {
			error: error.message,
		});
	}
}

/**
 * Handle failed transfer
 */
async function handleTransferFailed(data: any) {
	try {
		logger.info('Transfer failed', {
			reference: data.reference,
			reason: data.message,
		});

		// TODO: Update payout records when implemented
	} catch (error: any) {
		logger.error('Error handling transfer failed', {
			error: error.message,
		});
	}
}

/**
 * Handle processed refund
 */
async function handleRefundProcessed(data: any) {
	try {
		logger.info('Refund processed', {
			reference: data.transaction_reference,
			amount: data.amount,
		});

		// Payment should already be updated from refund initiation
		// This is just confirmation
	} catch (error: any) {
		logger.error('Error handling refund processed', {
			error: error.message,
		});
	}
}

// Webhook event log endpoint (for debugging - admin only)
router.get('/events', async (req: Request, res: Response, next: NextFunction) => {
	try {
		// TODO: Store webhook events in database for auditing
		res.json({ 
			success: true, 
			message: 'Webhook event logging not yet implemented',
			events: [] 
		});
	} catch (error) {
		next(error);
	}
});

export default router;
