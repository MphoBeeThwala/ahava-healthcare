import { Router, Response, NextFunction } from 'express';
import { PrismaClient, VisitStatus, UserRole } from '@prisma/client';
import { authMiddleware, requireNurse, requireDoctor, requireAdmin, AuthenticatedRequest } from '../middleware/auth';
import { encryptData, decryptData } from '../utils/encryption';
import { broadcastToUsers } from '../services/websocket';
import logger from '../utils/logger';
import Joi from 'joi';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const updateVisitStatusSchema = Joi.object({
  status: Joi.string().valid('SCHEDULED', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED').required(),
});

const addNurseReportSchema = Joi.object({
  nurseReport: Joi.string().min(10).max(10000).required(),
});

const addDoctorReviewSchema = Joi.object({
  doctorReview: Joi.string().min(10).max(10000).required(),
  doctorRating: Joi.number().min(1).max(5).optional(),
});

const updateLocationSchema = Joi.object({
  lat: Joi.number().min(-90).max(90).required(),
  lng: Joi.number().min(-180).max(180).required(),
});

/**
 * Get all visits (role-based filtering)
 */
router.get('/', authMiddleware, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const {
      status,
      limit = '50',
      offset = '0',
      sortBy = 'scheduledStart',
      sortOrder = 'desc',
    } = req.query;

    // Build where clause based on user role
    const whereClause: any = {};

    if (req.user!.role === UserRole.PATIENT) {
      whereClause.booking = { patientId: req.user!.id };
    } else if (req.user!.role === UserRole.NURSE) {
      whereClause.nurseId = req.user!.id;
    } else if (req.user!.role === UserRole.DOCTOR) {
      whereClause.doctorId = req.user!.id;
    }
    // Admin can see all visits

    if (status && typeof status === 'string') {
      whereClause.status = status as VisitStatus;
    }

    const totalCount = await prisma.visit.count({ where: whereClause });

    const visits = await prisma.visit.findMany({
      where: whereClause,
      include: {
        booking: {
          include: {
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        nurse: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            lastKnownLat: true,
            lastKnownLng: true,
            lastLocationUpdate: true,
          },
        },
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            messages: true,
            payments: true,
          },
        },
      },
      orderBy: { [sortBy as string]: sortOrder },
      take: Math.min(parseInt(limit as string), 100),
      skip: parseInt(offset as string),
    });

    res.json({
      success: true,
      visits,
      pagination: {
        total: totalCount,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      },
    });
  } catch (error: any) {
    logger.error('Failed to get visits', {
      error: error.message,
      userId: req.user?.id,
    });
    next(error);
  }
});

/**
 * Get a single visit by ID
 */
router.get('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const visit = await prisma.visit.findUnique({
      where: { id: req.params.id },
      include: {
        booking: {
          include: {
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                encryptedAddress: true,
              },
            },
          },
        },
        nurse: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            lastKnownLat: true,
            lastKnownLng: true,
            lastLocationUpdate: true,
          },
        },
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 50,
          include: {
            sender: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true,
              },
            },
          },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!visit) {
      return res.status(404).json({ error: 'Visit not found' });
    }

    // Check authorization
    const isAuthorized =
      visit.booking.patientId === req.user!.id ||
      visit.nurseId === req.user!.id ||
      visit.doctorId === req.user!.id ||
      req.user!.role === UserRole.ADMIN;

    if (!isAuthorized) {
      return res.status(403).json({ error: 'Not authorized to view this visit' });
    }

    // Decrypt messages
    const decryptedMessages = visit.messages.map(msg => ({
      ...msg,
      content: decryptData(msg.content),
    }));

    // Decrypt nurse report if exists
    let decryptedNurseReport = null;
    if (visit.nurseReport) {
      decryptedNurseReport = decryptData(visit.nurseReport);
    }

    res.json({
      success: true,
      visit: {
        ...visit,
        messages: decryptedMessages,
        nurseReport: decryptedNurseReport,
      },
    });
  } catch (error: any) {
    logger.error('Failed to get visit', {
      error: error.message,
      userId: req.user?.id,
      visitId: req.params.id,
    });
    next(error);
  }
});

/**
 * Update visit status (Nurse only)
 */
router.patch('/:id/status', authMiddleware, requireNurse, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { error, value } = updateVisitStatusSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { status } = value;

    // Get visit
    const visit = await prisma.visit.findUnique({
      where: { id: req.params.id },
      include: {
        booking: {
          include: {
            patient: true,
          },
        },
      },
    });

    if (!visit) {
      return res.status(404).json({ error: 'Visit not found' });
    }

    // Check if nurse is assigned to this visit
    if (visit.nurseId !== req.user!.id && req.user!.role !== UserRole.ADMIN) {
      return res.status(403).json({ error: 'Not authorized to update this visit' });
    }

    // Update timestamps based on status
    const updateData: any = { status };

    if (status === 'IN_PROGRESS' && !visit.actualStart) {
      updateData.actualStart = new Date();
    }

    if (status === 'COMPLETED' && !visit.actualEnd) {
      updateData.actualEnd = new Date();
    }

    const updatedVisit = await prisma.visit.update({
      where: { id: req.params.id },
      data: updateData,
    });

    logger.info('Visit status updated', {
      visitId: req.params.id,
      nurseId: req.user!.id,
      oldStatus: visit.status,
      newStatus: status,
    });

    // Notify patient and doctor via WebSocket
    const notifyUserIds = [visit.booking.patientId];
    if (visit.doctorId) {
      notifyUserIds.push(visit.doctorId);
    }

    broadcastToUsers(notifyUserIds, {
      type: 'VISIT_STATUS_UPDATED',
      data: {
        visitId: updatedVisit.id,
        status: updatedVisit.status,
        actualStart: updatedVisit.actualStart,
        actualEnd: updatedVisit.actualEnd,
      },
    });

    res.json({
      success: true,
      visit: updatedVisit,
    });
  } catch (error: any) {
    logger.error('Failed to update visit status', {
      error: error.message,
      userId: req.user?.id,
      visitId: req.params.id,
    });
    next(error);
  }
});

/**
 * Update nurse location during visit (Nurse only)
 */
router.post('/:id/location', authMiddleware, requireNurse, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { error, value } = updateLocationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { lat, lng } = value;

    // Get visit
    const visit = await prisma.visit.findUnique({
      where: { id: req.params.id },
      include: {
        booking: {
          select: {
            patientId: true,
          },
        },
      },
    });

    if (!visit) {
      return res.status(404).json({ error: 'Visit not found' });
    }

    // Check if nurse is assigned to this visit
    if (visit.nurseId !== req.user!.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Update visit GPS coordinates
    const currentGpsCoordinates = (visit.gpsCoordinates as any) || [];
    const updatedGpsCoordinates = [
      ...currentGpsCoordinates,
      {
        lat,
        lng,
        timestamp: new Date().toISOString(),
      },
    ];

    await prisma.visit.update({
      where: { id: req.params.id },
      data: {
        gpsCoordinates: updatedGpsCoordinates as any,
      },
    });

    // Also update nurse's last known location
    await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        lastKnownLat: lat,
        lastKnownLng: lng,
        lastLocationUpdate: new Date(),
      },
    });

    logger.debug('Nurse location updated', {
      visitId: req.params.id,
      nurseId: req.user!.id,
      lat,
      lng,
    });

    // Notify patient via WebSocket (handled in WebSocket service)

    res.json({
      success: true,
      message: 'Location updated successfully',
    });
  } catch (error: any) {
    logger.error('Failed to update location', {
      error: error.message,
      userId: req.user?.id,
      visitId: req.params.id,
    });
    next(error);
  }
});

/**
 * Add nurse report (Nurse only)
 */
router.post('/:id/nurse-report', authMiddleware, requireNurse, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { error, value } = addNurseReportSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { nurseReport } = value;

    // Get visit
    const visit = await prisma.visit.findUnique({
      where: { id: req.params.id },
      include: {
        booking: {
          select: {
            patientId: true,
          },
        },
      },
    });

    if (!visit) {
      return res.status(404).json({ error: 'Visit not found' });
    }

    // Check if nurse is assigned to this visit
    if (visit.nurseId !== req.user!.id && req.user!.role !== UserRole.ADMIN) {
      return res.status(403).json({ error: 'Not authorized to add report to this visit' });
    }

    // Encrypt nurse report
    const encryptedReport = encryptData(nurseReport);

    // Update visit
    const updatedVisit = await prisma.visit.update({
      where: { id: req.params.id },
      data: {
        nurseReport: encryptedReport,
      },
    });

    logger.info('Nurse report added', {
      visitId: req.params.id,
      nurseId: req.user!.id,
    });

    // Notify doctor if assigned
    if (visit.doctorId) {
      broadcastToUsers([visit.doctorId], {
        type: 'NURSE_REPORT_ADDED',
        data: {
          visitId: updatedVisit.id,
        },
      });
    }

    res.json({
      success: true,
      visit: {
        ...updatedVisit,
        nurseReport: nurseReport, // Return decrypted to sender
      },
    });
  } catch (error: any) {
    logger.error('Failed to add nurse report', {
      error: error.message,
      userId: req.user?.id,
      visitId: req.params.id,
    });
    next(error);
  }
});

/**
 * Add doctor review (Doctor only)
 */
router.post('/:id/doctor-review', authMiddleware, requireDoctor, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { error, value } = addDoctorReviewSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { doctorReview, doctorRating } = value;

    // Get visit
    const visit = await prisma.visit.findUnique({
      where: { id: req.params.id },
      include: {
        booking: {
          select: {
            patientId: true,
          },
        },
      },
    });

    if (!visit) {
      return res.status(404).json({ error: 'Visit not found' });
    }

    // Doctor must be assigned to this visit or be admin
    if (visit.doctorId !== req.user!.id && req.user!.role !== UserRole.ADMIN) {
      return res.status(403).json({ error: 'Not authorized to review this visit' });
    }

    // Update visit
    const updatedVisit = await prisma.visit.update({
      where: { id: req.params.id },
      data: {
        doctorReview,
        doctorRating,
      },
    });

    logger.info('Doctor review added', {
      visitId: req.params.id,
      doctorId: req.user!.id,
      rating: doctorRating,
    });

    // Notify nurse and patient
    const notifyUserIds = [visit.nurseId, visit.booking.patientId].filter(Boolean);
    broadcastToUsers(notifyUserIds as string[], {
      type: 'DOCTOR_REVIEW_ADDED',
      data: {
        visitId: updatedVisit.id,
        rating: doctorRating,
      },
    });

    res.json({
      success: true,
      visit: updatedVisit,
    });
  } catch (error: any) {
    logger.error('Failed to add doctor review', {
      error: error.message,
      userId: req.user?.id,
      visitId: req.params.id,
    });
    next(error);
  }
});

/**
 * Cancel a visit (Patient or Admin only)
 */
router.post('/:id/cancel', authMiddleware, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // Get visit
    const visit = await prisma.visit.findUnique({
      where: { id: req.params.id },
      include: {
        booking: {
          select: {
            patientId: true,
          },
        },
      },
    });

    if (!visit) {
      return res.status(404).json({ error: 'Visit not found' });
    }

    // Check authorization
    const isAuthorized =
      visit.booking.patientId === req.user!.id ||
      req.user!.role === UserRole.ADMIN;

    if (!isAuthorized) {
      return res.status(403).json({ error: 'Not authorized to cancel this visit' });
    }

    // Check if visit can be cancelled
    if (visit.status === 'COMPLETED') {
      return res.status(400).json({ error: 'Cannot cancel a completed visit' });
    }

    if (visit.status === 'CANCELLED') {
      return res.status(400).json({ error: 'Visit is already cancelled' });
    }

    // Update visit status
    const updatedVisit = await prisma.visit.update({
      where: { id: req.params.id },
      data: {
        status: 'CANCELLED',
      },
    });

    logger.info('Visit cancelled', {
      visitId: req.params.id,
      userId: req.user!.id,
      previousStatus: visit.status,
    });

    // Notify nurse and doctor
    const notifyUserIds = [visit.nurseId, visit.doctorId].filter(Boolean);
    broadcastToUsers(notifyUserIds as string[], {
      type: 'VISIT_CANCELLED',
      data: {
        visitId: updatedVisit.id,
      },
    });

    res.json({
      success: true,
      visit: updatedVisit,
      message: 'Visit cancelled successfully',
    });
  } catch (error: any) {
    logger.error('Failed to cancel visit', {
      error: error.message,
      userId: req.user?.id,
      visitId: req.params.id,
    });
    next(error);
  }
});

/**
 * Assign nurse to visit (Admin only)
 */
router.post('/:id/assign-nurse', authMiddleware, requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { nurseId } = req.body;

    if (!nurseId) {
      return res.status(400).json({ error: 'nurseId is required' });
    }

    // Verify nurse exists and is active
    const nurse = await prisma.user.findUnique({
      where: { id: nurseId },
    });

    if (!nurse || nurse.role !== UserRole.NURSE || !nurse.isActive) {
      return res.status(400).json({ error: 'Invalid or inactive nurse' });
    }

    // Update visit
    const updatedVisit = await prisma.visit.update({
      where: { id: req.params.id },
      data: {
        nurseId,
      },
      include: {
        nurse: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
    });

    logger.info('Nurse assigned to visit', {
      visitId: req.params.id,
      nurseId,
      adminId: req.user!.id,
    });

    res.json({
      success: true,
      visit: updatedVisit,
    });
  } catch (error: any) {
    logger.error('Failed to assign nurse', {
      error: error.message,
      userId: req.user?.id,
      visitId: req.params.id,
    });
    next(error);
  }
});

/**
 * Assign doctor to visit (Admin only)
 */
router.post('/:id/assign-doctor', authMiddleware, requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { doctorId } = req.body;

    if (!doctorId) {
      return res.status(400).json({ error: 'doctorId is required' });
    }

    // Verify doctor exists and is active
    const doctor = await prisma.user.findUnique({
      where: { id: doctorId },
    });

    if (!doctor || doctor.role !== UserRole.DOCTOR || !doctor.isActive) {
      return res.status(400).json({ error: 'Invalid or inactive doctor' });
    }

    // Update visit
    const updatedVisit = await prisma.visit.update({
      where: { id: req.params.id },
      data: {
        doctorId,
      },
      include: {
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    logger.info('Doctor assigned to visit', {
      visitId: req.params.id,
      doctorId,
      adminId: req.user!.id,
    });

    res.json({
      success: true,
      visit: updatedVisit,
    });
  } catch (error: any) {
    logger.error('Failed to assign doctor', {
      error: error.message,
      userId: req.user?.id,
      visitId: req.params.id,
    });
    next(error);
  }
});

export default router;
