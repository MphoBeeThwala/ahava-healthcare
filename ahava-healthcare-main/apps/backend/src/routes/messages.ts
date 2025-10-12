import { Router, Response, NextFunction } from 'express';
import { PrismaClient, MessageType, UserRole } from '@prisma/client';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { encryptData, decryptData } from '../utils/encryption';
import { sendToUser, broadcastToUsers } from '../services/websocket';
import { uploadImage, uploadFile, handleUploadError, getFileUrl } from '../middleware/upload';
import logger from '../utils/logger';
import Joi from 'joi';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const sendMessageSchema = Joi.object({
  visitId: Joi.string().required(),
  recipientId: Joi.string().required(),
  content: Joi.string().min(1).max(5000).required(),
  type: Joi.string().valid('TEXT', 'IMAGE', 'FILE', 'SYSTEM').default('TEXT'),
  attachmentUrl: Joi.string().uri().optional(),
  attachmentType: Joi.string().optional(),
});

const markAsReadSchema = Joi.object({
  messageIds: Joi.array().items(Joi.string()).min(1).required(),
});

/**
 * Send a message in a visit conversation
 */
router.post('/', authMiddleware, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { error, value } = sendMessageSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { visitId, recipientId, content, type, attachmentUrl, attachmentType } = value;
    const senderId = req.user!.id;

    // Verify visit exists and user is authorized
    const visit = await prisma.visit.findUnique({
      where: { id: visitId },
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

    // Check if user is authorized to send messages in this visit
    const isAuthorized = 
      visit.booking.patientId === senderId ||
      visit.nurseId === senderId ||
      visit.doctorId === senderId ||
      req.user!.role === UserRole.ADMIN;

    if (!isAuthorized) {
      return res.status(403).json({ error: 'Not authorized to send messages in this visit' });
    }

    // Check if recipient is part of the visit
    const isRecipientAuthorized =
      visit.booking.patientId === recipientId ||
      visit.nurseId === recipientId ||
      visit.doctorId === recipientId;

    if (!isRecipientAuthorized && req.user!.role !== UserRole.ADMIN) {
      return res.status(400).json({ error: 'Recipient is not part of this visit' });
    }

    // Encrypt message content
    const encryptedContent = encryptData(content);

    // Create message
    const message = await prisma.message.create({
      data: {
        visitId,
        senderId,
        recipientId,
        type,
        content: encryptedContent,
        attachmentUrl,
        attachmentType,
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            profileImage: true,
          },
        },
        recipient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    logger.info('Message sent', {
      messageId: message.id,
      visitId,
      senderId,
      recipientId,
      type,
    });

    // Prepare response with decrypted content for sender
    const responseMessage = {
      ...message,
      content: content, // Return plaintext to sender
    };

    // Send real-time notification to recipient via WebSocket
    const success = sendToUser(recipientId, {
      type: 'NEW_MESSAGE',
      data: {
        ...message,
        content: content, // Decrypt for recipient
      },
    });

    if (!success) {
      logger.debug('Recipient not connected via WebSocket', { recipientId });
    }

    res.status(201).json({
      success: true,
      message: responseMessage,
    });
  } catch (error: any) {
    logger.error('Failed to send message', {
      error: error.message,
      userId: req.user?.id,
    });
    next(error);
  }
});

/**
 * Get messages for a visit
 */
router.get('/visit/:visitId', authMiddleware, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { visitId } = req.params;
    const { limit = '50', offset = '0', unreadOnly = 'false' } = req.query;

    // Verify visit exists and user is authorized
    const visit = await prisma.visit.findUnique({
      where: { id: visitId },
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
      visit.nurseId === req.user!.id ||
      visit.doctorId === req.user!.id ||
      req.user!.role === UserRole.ADMIN;

    if (!isAuthorized) {
      return res.status(403).json({ error: 'Not authorized to view messages for this visit' });
    }

    // Build where clause
    const whereClause: any = {
      visitId,
      OR: [
        { senderId: req.user!.id },
        { recipientId: req.user!.id },
      ],
    };

    if (unreadOnly === 'true') {
      whereClause.isRead = false;
      whereClause.recipientId = req.user!.id;
    }

    // Get total count
    const totalCount = await prisma.message.count({ where: whereClause });

    // Get messages
    const messages = await prisma.message.findMany({
      where: whereClause,
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            profileImage: true,
          },
        },
        recipient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: Math.min(parseInt(limit as string), 100),
      skip: parseInt(offset as string),
    });

    // Decrypt messages
    const decryptedMessages = messages.map(msg => ({
      ...msg,
      content: decryptData(msg.content),
    }));

    res.json({
      success: true,
      messages: decryptedMessages,
      pagination: {
        total: totalCount,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      },
    });
  } catch (error: any) {
    logger.error('Failed to get messages', {
      error: error.message,
      userId: req.user?.id,
    });
    next(error);
  }
});

/**
 * Get unread message count
 */
router.get('/unread/count', authMiddleware, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const count = await prisma.message.count({
      where: {
        recipientId: req.user!.id,
        isRead: false,
      },
    });

    res.json({
      success: true,
      unreadCount: count,
    });
  } catch (error: any) {
    logger.error('Failed to get unread count', {
      error: error.message,
      userId: req.user?.id,
    });
    next(error);
  }
});

/**
 * Mark messages as read
 */
router.post('/read', authMiddleware, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { error, value } = markAsReadSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { messageIds } = value;

    // Update only messages that belong to the user
    const result = await prisma.message.updateMany({
      where: {
        id: { in: messageIds },
        recipientId: req.user!.id,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    logger.info('Messages marked as read', {
      userId: req.user!.id,
      count: result.count,
    });

    res.json({
      success: true,
      markedCount: result.count,
    });
  } catch (error: any) {
    logger.error('Failed to mark messages as read', {
      error: error.message,
      userId: req.user?.id,
    });
    next(error);
  }
});

/**
 * Get conversation participants for a visit
 */
router.get('/visit/:visitId/participants', authMiddleware, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { visitId } = req.params;

    const visit = await prisma.visit.findUnique({
      where: { id: visitId },
      include: {
        booking: {
          include: {
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true,
                profileImage: true,
              },
            },
          },
        },
        nurse: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            profileImage: true,
          },
        },
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            profileImage: true,
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
      visit.nurseId === req.user!.id ||
      visit.doctorId === req.user!.id ||
      req.user!.role === UserRole.ADMIN;

    if (!isAuthorized) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const participants = [
      visit.booking.patient,
      visit.nurse,
      visit.doctor,
    ].filter(Boolean);

    res.json({
      success: true,
      participants,
    });
  } catch (error: any) {
    logger.error('Failed to get participants', {
      error: error.message,
      userId: req.user?.id,
    });
    next(error);
  }
});

/**
 * Upload image for message
 */
router.post('/upload/image', authMiddleware, uploadImage.single('image'), handleUploadError, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileUrl = getFileUrl(req.file.filename, 'image');

    logger.info('Image uploaded for message', {
      userId: req.user!.id,
      filename: req.file.filename,
      size: req.file.size,
    });

    res.json({
      success: true,
      data: {
        filename: req.file.filename,
        url: fileUrl,
        type: 'image',
        size: req.file.size,
        mimetype: req.file.mimetype,
      },
    });
  } catch (error: any) {
    logger.error('Failed to upload image', {
      error: error.message,
      userId: req.user?.id,
    });
    next(error);
  }
});

/**
 * Upload file for message (documents, PDFs, etc.)
 */
router.post('/upload/file', authMiddleware, uploadFile.single('file'), handleUploadError, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileType = req.file.mimetype.startsWith('image/') ? 'image' : 
                     req.file.mimetype === 'application/pdf' ? 'document' : 'file';
    
    const fileUrl = getFileUrl(req.file.filename, fileType);

    logger.info('File uploaded for message', {
      userId: req.user!.id,
      filename: req.file.filename,
      size: req.file.size,
      type: fileType,
    });

    res.json({
      success: true,
      data: {
        filename: req.file.filename,
        url: fileUrl,
        type: fileType,
        size: req.file.size,
        mimetype: req.file.mimetype,
      },
    });
  } catch (error: any) {
    logger.error('Failed to upload file', {
      error: error.message,
      userId: req.user?.id,
    });
    next(error);
  }
});

/**
 * Delete a message (sender only)
 */
router.delete('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const message = await prisma.message.findUnique({
      where: { id: req.params.id },
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Only sender or admin can delete
    if (message.senderId !== req.user!.id && req.user!.role !== UserRole.ADMIN) {
      return res.status(403).json({ error: 'Not authorized to delete this message' });
    }

    await prisma.message.delete({
      where: { id: req.params.id },
    });

    logger.info('Message deleted', {
      messageId: req.params.id,
      userId: req.user!.id,
    });

    // Notify recipient via WebSocket
    if (message.recipientId) {
      sendToUser(message.recipientId, {
        type: 'MESSAGE_DELETED',
        data: {
          messageId: message.id,
          visitId: message.visitId,
        },
      });
    }

    res.json({
      success: true,
      message: 'Message deleted successfully',
    });
  } catch (error: any) {
    logger.error('Failed to delete message', {
      error: error.message,
      userId: req.user?.id,
    });
    next(error);
  }
});

export default router;
