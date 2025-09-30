
import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Create a new visit
// Create a new visit with basic validation
router.post('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
	try {
		const { patientId, scheduledAt, location } = req.body;
		if (!patientId || !scheduledAt || !location) {
			return res.status(400).json({ error: 'Missing required fields: patientId, scheduledAt, location' });
		}
		const visit = await prisma.visit.create({
			data: req.body,
		});
		res.status(201).json({ success: true, visit });
	} catch (error) {
		next(error);
	}
});

// Get all visits
// Get all visits
router.get('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
	try {
		const visits = await prisma.visit.findMany();
		res.json({ success: true, visits });
	} catch (error) {
		next(error);
	}
});

// Get a single visit by ID
// Get a single visit by ID
router.get('/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
	try {
		const visit = await prisma.visit.findUnique({
			where: { id: req.params.id },
		});
		if (!visit) {
			res.status(404).json({ error: 'Visit not found' });
			return;
		}
		res.json({ success: true, visit });
	} catch (error) {
		next(error);
	}
});

// Update a visit
// Update a visit with validation and 404 handling
router.put('/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
	try {
		const { patientId, scheduledAt, location } = req.body;
		if (!patientId || !scheduledAt || !location) {
			return res.status(400).json({ error: 'Missing required fields: patientId, scheduledAt, location' });
		}
		const visit = await prisma.visit.update({
			where: { id: req.params.id },
			data: req.body,
		});
		res.json({ success: true, visit });
	} catch (error) {
		// If not found, Prisma throws an error with code 'P2025'
		if (error.code === 'P2025') {
			res.status(404).json({ error: 'Visit not found' });
		} else {
			next(error);
		}
	}
});

// Delete a visit
// Delete a visit with 404 handling
router.delete('/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
	try {
		await prisma.visit.delete({ where: { id: req.params.id } });
		res.json({ success: true });
	} catch (error) {
		if (error.code === 'P2025') {
			res.status(404).json({ error: 'Visit not found' });
		} else {
			next(error);
		}
	}
});

export default router;
