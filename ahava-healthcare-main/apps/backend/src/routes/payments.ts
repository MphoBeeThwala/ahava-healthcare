import { Router, Response, NextFunction } from 'express';
import { PrismaClient, PaymentStatus, UserRole, PaymentMethod } from '@prisma/client';
import { authMiddleware, requireAdmin, requireDoctor, AuthenticatedRequest } from '../middleware/auth';
import paymentService from '../services/payment';
import paystackService from '../services/paystack';
import logger from '../utils/logger';
import Joi from 'joi';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const initializePaymentSchema = Joi.object({
	bookingId: Joi.string().required(),
	callbackUrl: Joi.string().uri().optional(),
});

const verifyPaymentSchema = Joi.object({
	reference: Joi.string().required(),
});

const refundPaymentSchema = Joi.object({
	paymentId: Joi.string().required(),
	reason: Joi.string().max(500).optional(),
	partialAmount: Joi.number().min(0).optional(),
});

const updatePaymentSchema = Joi.object({
	status: Joi.string().valid('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED').optional(),
	paystackReference: Joi.string().optional(),
	paystackData: Joi.object().optional(),
}).min(1);

// Initialize payment for a booking
router.post('/initialize', authMiddleware, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
	try {
		const { error, value } = initializePaymentSchema.validate(req.body);
		if (error) {
			return res.status(400).json({ error: error.details[0].message });
		}

		const { bookingId, callbackUrl } = value;

		// Get user email
		const user = await prisma.user.findUnique({
			where: { id: req.user!.id },
			select: { email: true },
		});

		if (!user) {
			return res.status(404).json({ error: 'User not found' });
		}

		// Initialize payment
		const result = await paymentService.initializePaystackPayment({
			bookingId,
			email: user.email,
			callbackUrl,
		});

		logger.info('Payment initialized', {
			userId: req.user!.id,
			bookingId,
			reference: result.reference,
		});

		res.status(201).json({
			success: true,
			data: {
				reference: result.reference,
				authorizationUrl: result.authorizationUrl,
				accessCode: result.accessCode,
			},
		});
	} catch (error: any) {
		logger.error('Failed to initialize payment', {
			error: error.message,
			userId: req.user?.id,
		});
		next(error);
	}
});

// Verify payment
router.post('/verify', authMiddleware, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
	try {
		const { error, value } = verifyPaymentSchema.validate(req.body);
		if (error) {
			return res.status(400).json({ error: error.details[0].message });
		}

		const { reference } = value;

		// Verify payment
		const result = await paymentService.verifyPayment(reference);

		logger.info('Payment verified', {
			userId: req.user!.id,
			reference,
			success: result.success,
		});

		res.json({
			success: true,
			data: {
				paymentSuccess: result.success,
				payment: result.payment,
				transactionData: result.transactionData,
			},
		});
	} catch (error: any) {
		logger.error('Failed to verify payment', {
			error: error.message,
			userId: req.user?.id,
		});
		next(error);
	}
});

// Process refund (Admin only)
router.post('/refund', authMiddleware, requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
	try {
		const { error, value } = refundPaymentSchema.validate(req.body);
		if (error) {
			return res.status(400).json({ error: error.details[0].message });
		}

		const { paymentId, reason, partialAmount } = value;

		// Process refund
		const payment = await paymentService.processRefund(paymentId, reason, partialAmount);

		logger.info('Refund processed', {
			adminId: req.user!.id,
			paymentId,
			partialAmount,
		});

		res.json({
			success: true,
			payment,
			message: 'Refund processed successfully',
		});
	} catch (error: any) {
		logger.error('Failed to process refund', {
			error: error.message,
			adminId: req.user?.id,
		});
		next(error);
	}
});

// Get all payments (with role-based filtering)
router.get('/', authMiddleware, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
	try {
		const {
			status,
			visitId,
			limit = '50',
			offset = '0',
			sortBy = 'createdAt',
			sortOrder = 'desc',
		} = req.query;

		// Build where clause based on user role
		const whereClause: any = {};

		// Non-admin users can only see their own payments
		if (req.user!.role !== UserRole.ADMIN) {
			const userVisits = await prisma.visit.findMany({
				where: {
					OR: [
						{ booking: { patientId: req.user!.id } },
						{ nurseId: req.user!.id },
						{ doctorId: req.user!.id },
					],
				},
				select: { id: true },
			});

			whereClause.visitId = {
				in: userVisits.map(v => v.id),
			};
		}

		if (status && typeof status === 'string') {
			whereClause.status = status as PaymentStatus;
		}

		if (visitId && typeof visitId === 'string') {
			whereClause.visitId = visitId;
		}

		const totalCount = await prisma.payment.count({ where: whereClause });

		const payments = await prisma.payment.findMany({
			where: whereClause,
			include: {
				visit: {
					select: {
						id: true,
						status: true,
						booking: {
							select: {
								patient: {
									select: {
										id: true,
										firstName: true,
										lastName: true,
										email: true,
									},
								},
							},
						},
					},
				},
			},
			orderBy: { [sortBy as string]: sortOrder },
			take: Math.min(parseInt(limit as string), 100),
			skip: parseInt(offset as string),
		});

		res.json({
			success: true,
			payments,
			pagination: {
				total: totalCount,
				limit: parseInt(limit as string),
				offset: parseInt(offset as string),
			},
		});
	} catch (error) {
		next(error);
	}
});

// Get a single payment by ID
router.get('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
	try {
		const payment = await prisma.payment.findUnique({
			where: { id: req.params.id },
			include: {
				visit: {
					include: {
						booking: {
							include: {
								patient: {
									select: {
										id: true,
										firstName: true,
										lastName: true,
										email: true,
									},
								},
							},
						},
						nurse: {
							select: {
								id: true,
								firstName: true,
								lastName: true,
							},
						},
					},
				},
			},
		});

		if (!payment) {
			return res.status(404).json({ error: 'Payment not found' });
		}

		// Check permissions
		const isAuthorized =
			req.user!.role === UserRole.ADMIN ||
			payment.visit.booking.patientId === req.user!.id ||
			payment.visit.nurseId === req.user!.id ||
			payment.visit.doctorId === req.user!.id;

		if (!isAuthorized) {
			return res.status(403).json({ error: 'Access denied' });
		}

		res.json({ success: true, payment });
	} catch (error) {
		next(error);
	}
});

// Update a payment (Admin only)
router.put('/:id', authMiddleware, requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
	try {
		const { error, value } = updatePaymentSchema.validate(req.body);
		if (error) {
			return res.status(400).json({ error: error.details[0].message });
		}

		// Check if payment exists
		const existingPayment = await prisma.payment.findUnique({
			where: { id: req.params.id },
		});

		if (!existingPayment) {
			return res.status(404).json({ error: 'Payment not found' });
		}

		// Update payment
		const payment = await prisma.payment.update({
			where: { id: req.params.id },
			data: value,
		});

		res.json({ success: true, payment });
	} catch (error) {
		next(error);
	}
});

// Cancel/Refund a payment (Admin only)
router.delete('/:id', authMiddleware, requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
	try {
		const payment = await prisma.payment.findUnique({
			where: { id: req.params.id },
		});

		if (!payment) {
			return res.status(404).json({ error: 'Payment not found' });
		}

		// Don't actually delete, mark as refunded
		await prisma.payment.update({
			where: { id: req.params.id },
			data: { status: PaymentStatus.REFUNDED },
		});

		res.json({ success: true, message: 'Payment refunded successfully' });
	} catch (error) {
		next(error);
	}
});

export default router;
