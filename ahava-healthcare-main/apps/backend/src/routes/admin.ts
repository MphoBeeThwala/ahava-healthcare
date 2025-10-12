import { Router } from 'express';
import { PrismaClient, UserRole } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';
import { authMiddleware, requireAdmin, AuthenticatedRequest } from '../middleware/auth';
import bcrypt from 'bcryptjs';
import Joi from 'joi';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const createUserSchema = Joi.object({
	email: Joi.string().email().required(),
	password: Joi.string().min(12).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).required()
		.messages({
			'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'
		}),
	firstName: Joi.string().min(2).max(50).required(),
	lastName: Joi.string().min(2).max(50).required(),
	role: Joi.string().valid('PATIENT', 'NURSE', 'DOCTOR', 'ADMIN').required(),
	phone: Joi.string().pattern(/^\+27[0-9]{9}$/).optional()
		.messages({
			'string.pattern.base': 'Phone number must be in format +27XXXXXXXXX'
		}),
	dateOfBirth: Joi.date().max('now').optional(),
	gender: Joi.string().valid('male', 'female', 'other').optional(),
	isActive: Joi.boolean().optional(),
});

const updateUserSchema = Joi.object({
	firstName: Joi.string().min(2).max(50).optional(),
	lastName: Joi.string().min(2).max(50).optional(),
	phone: Joi.string().pattern(/^\+27[0-9]{9}$/).optional(),
	dateOfBirth: Joi.date().max('now').optional(),
	gender: Joi.string().valid('male', 'female', 'other').optional(),
	isActive: Joi.boolean().optional(),
	isVerified: Joi.boolean().optional(),
	role: Joi.string().valid('PATIENT', 'NURSE', 'DOCTOR', 'ADMIN').optional(),
}).min(1);

// Create a new user (Admin only)
router.post('/users', authMiddleware, requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
	try {
		const { error, value } = createUserSchema.validate(req.body);
		if (error) {
			return res.status(400).json({ error: error.details[0].message });
		}

		const { email, password, firstName, lastName, role, phone, dateOfBirth, gender, isActive } = value;

		// Check if user already exists
		const existingUser = await prisma.user.findUnique({
			where: { email },
		});

		if (existingUser) {
			return res.status(400).json({ error: 'User with this email already exists' });
		}

		// Hash password
		const saltRounds = 12;
		const passwordHash = await bcrypt.hash(password, saltRounds);

		// Create user
		const user = await prisma.user.create({
			data: {
				email,
				passwordHash,
				firstName,
				lastName,
				role,
				phone,
				dateOfBirth,
				gender,
				isActive: isActive !== undefined ? isActive : true,
			},
			select: {
				id: true,
				email: true,
				firstName: true,
				lastName: true,
				role: true,
				isActive: true,
				isVerified: true,
				phone: true,
				createdAt: true,
			},
		});

		res.status(201).json({ success: true, user });
	} catch (error) {
		next(error);
	}
});

// Get all users (Admin only) with filtering and pagination
router.get('/users', authMiddleware, requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
	try {
		const { 
			role, 
			isActive, 
			isVerified,
			search,
			limit = '50', 
			offset = '0',
			sortBy = 'createdAt',
			sortOrder = 'desc',
		} = req.query;

		// Build where clause
		const whereClause: any = {};
		
		if (role && typeof role === 'string') {
			whereClause.role = role as UserRole;
		}
		
		if (isActive !== undefined) {
			whereClause.isActive = isActive === 'true';
		}
		
		if (isVerified !== undefined) {
			whereClause.isVerified = isVerified === 'true';
		}

		// Add search functionality
		if (search && typeof search === 'string') {
			whereClause.OR = [
				{ email: { contains: search, mode: 'insensitive' } },
				{ firstName: { contains: search, mode: 'insensitive' } },
				{ lastName: { contains: search, mode: 'insensitive' } },
			];
		}

		// Get total count
		const totalCount = await prisma.user.count({ where: whereClause });

		// Get users
		const users = await prisma.user.findMany({
			where: whereClause,
			select: {
				id: true,
				email: true,
				firstName: true,
				lastName: true,
				role: true,
				isActive: true,
				isVerified: true,
				phone: true,
				profileImage: true,
				dateOfBirth: true,
				gender: true,
				createdAt: true,
				updatedAt: true,
				lastLocationUpdate: true,
			},
			orderBy: { [sortBy as string]: sortOrder },
			take: Math.min(parseInt(limit as string), 100),
			skip: parseInt(offset as string),
		});

		res.json({ 
			success: true, 
			users,
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

// Get a single user by ID (Admin only)
router.get('/users/:id', authMiddleware, requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
	try {
		const user = await prisma.user.findUnique({
			where: { id: req.params.id },
			select: {
				id: true,
				email: true,
				firstName: true,
				lastName: true,
				role: true,
				isActive: true,
				isVerified: true,
				phone: true,
				profileImage: true,
				dateOfBirth: true,
				gender: true,
				preferredLanguage: true,
				timezone: true,
				lastKnownLat: true,
				lastKnownLng: true,
				lastLocationUpdate: true,
				createdAt: true,
				updatedAt: true,
				_count: {
					select: {
						patientBookings: true,
						nurseVisits: true,
						doctorOversight: true,
					},
				},
			},
		});

		if (!user) {
			return res.status(404).json({ error: 'User not found' });
		}

		res.json({ success: true, user });
	} catch (error) {
		next(error);
	}
});

// Update a user (Admin only)
router.put('/users/:id', authMiddleware, requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
	try {
		const { error, value } = updateUserSchema.validate(req.body);
		if (error) {
			return res.status(400).json({ error: error.details[0].message });
		}

		// Check if user exists
		const existingUser = await prisma.user.findUnique({
			where: { id: req.params.id },
		});

		if (!existingUser) {
			return res.status(404).json({ error: 'User not found' });
		}

		// Update user
		const user = await prisma.user.update({
			where: { id: req.params.id },
			data: value,
			select: {
				id: true,
				email: true,
				firstName: true,
				lastName: true,
				role: true,
				isActive: true,
				isVerified: true,
				phone: true,
				dateOfBirth: true,
				gender: true,
				updatedAt: true,
			},
		});

		res.json({ success: true, user });
	} catch (error) {
		next(error);
	}
});

// Deactivate a user (Admin only) - Soft delete
router.delete('/users/:id', authMiddleware, requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
	try {
		// Check if user exists
		const existingUser = await prisma.user.findUnique({
			where: { id: req.params.id },
		});

		if (!existingUser) {
			return res.status(404).json({ error: 'User not found' });
		}

		// Prevent deleting yourself
		if (req.params.id === req.user?.id) {
			return res.status(400).json({ error: 'Cannot deactivate your own account' });
		}

		// Soft delete by deactivating
		await prisma.user.update({
			where: { id: req.params.id },
			data: { isActive: false },
		});

		res.json({ success: true, message: 'User deactivated successfully' });
	} catch (error) {
		next(error);
	}
});

// Get system statistics (Admin only)
router.get('/stats/overview', authMiddleware, requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
	try {
		const [
			totalUsers,
			totalPatients,
			totalNurses,
			totalDoctors,
			totalBookings,
			totalVisits,
			activeVisits,
		] = await Promise.all([
			prisma.user.count(),
			prisma.user.count({ where: { role: UserRole.PATIENT } }),
			prisma.user.count({ where: { role: UserRole.NURSE } }),
			prisma.user.count({ where: { role: UserRole.DOCTOR } }),
			prisma.booking.count(),
			prisma.visit.count(),
			prisma.visit.count({ where: { status: { in: ['SCHEDULED', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS'] } } }),
		]);

		res.json({
			success: true,
			stats: {
				users: {
					total: totalUsers,
					patients: totalPatients,
					nurses: totalNurses,
					doctors: totalDoctors,
				},
				bookings: {
					total: totalBookings,
				},
				visits: {
					total: totalVisits,
					active: activeVisits,
				},
			},
		});
	} catch (error) {
		next(error);
	}
});

export default router;
