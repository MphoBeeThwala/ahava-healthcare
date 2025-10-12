import { WebSocketServer, WebSocket } from 'ws';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { IncomingMessage } from 'http';
import logger from '../utils/logger';

const prisma = new PrismaClient();

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  userRole?: string;
  isAlive?: boolean;
  lastActivity?: Date;
}

const clients = new Map<string, AuthenticatedWebSocket>();

// Connection rate limiting
const connectionAttempts = new Map<string, { count: number; lastAttempt: Date }>();

// Clean up old connection attempts every hour
setInterval(() => {
  const now = new Date();
  for (const [ip, attempt] of connectionAttempts.entries()) {
    if (now.getTime() - attempt.lastAttempt.getTime() > 3600000) { // 1 hour
      connectionAttempts.delete(ip);
    }
  }
}, 3600000);

/**
 * Extract token from WebSocket connection request
 * Checks headers first (preferred), falls back to URL parameter
 */
function extractWebSocketToken(req: IncomingMessage): string | null {
  // Prefer Authorization header (more secure)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Fallback to query parameter (less secure, for compatibility)
  const url = req.url;
  if (url) {
    const match = url.match(/token=([^&]+)/);
    if (match) {
      return match[1];
    }
  }

  return null;
}

/**
 * Rate limit WebSocket connections per IP
 */
function checkConnectionRateLimit(ip: string): boolean {
  const attempt = connectionAttempts.get(ip);
  const now = new Date();

  if (!attempt) {
    connectionAttempts.set(ip, { count: 1, lastAttempt: now });
    return true;
  }

  // Reset if more than 1 hour has passed
  if (now.getTime() - attempt.lastAttempt.getTime() > 3600000) {
    connectionAttempts.set(ip, { count: 1, lastAttempt: now });
    return true;
  }

  // Allow max 10 connections per hour per IP
  if (attempt.count >= 10) {
    logger.security('WebSocket connection rate limit exceeded', {
      ip,
      attempts: attempt.count,
    });
    return false;
  }

  attempt.count++;
  attempt.lastAttempt = now;
  return true;
}

export const initializeWebSocket = (wss: WebSocketServer) => {
  wss.on('connection', async (ws: AuthenticatedWebSocket, req: IncomingMessage) => {
    const ip = req.socket.remoteAddress || 'unknown';

    logger.info('New WebSocket connection attempt', { ip });

    // Check rate limit
    if (!checkConnectionRateLimit(ip)) {
      ws.close(1008, 'Too many connection attempts');
      return;
    }

    // Heartbeat mechanism
    ws.isAlive = true;
    ws.lastActivity = new Date();
    
    ws.on('pong', () => {
      ws.isAlive = true;
      ws.lastActivity = new Date();
    });

    // Extract and authenticate token
    const token = extractWebSocketToken(req);
    
    if (!token) {
      logger.security('WebSocket connection without token', { ip });
      ws.close(1008, 'Authentication required');
      return;
    }

    if (!process.env.JWT_SECRET) {
      logger.error('JWT_SECRET not configured');
      ws.close(1011, 'Server configuration error');
      return;
    }

    try {
      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET) as any;
      
      // Verify user still exists and is active
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          role: true,
          isActive: true,
        },
      });

      if (!user || !user.isActive) {
        logger.security('WebSocket authentication failed - user inactive or not found', {
          userId: decoded.userId,
          ip,
        });
        ws.close(1008, 'Invalid or inactive user');
        return;
      }

      ws.userId = user.id;
      ws.userRole = user.role;
      
      // Close existing connection for this user (prevent multiple connections)
      const existingConnection = clients.get(user.id);
      if (existingConnection && existingConnection.readyState === WebSocket.OPEN) {
        logger.info('Closing existing WebSocket connection for user', { userId: user.id });
        existingConnection.close(1000, 'New connection established');
      }

      // Store client connection
      clients.set(user.id, ws);
      
      logger.info('WebSocket authenticated successfully', {
        userId: user.id,
        role: user.role,
        ip,
      });

      // Send authentication success message
      ws.send(JSON.stringify({
        type: 'AUTH_SUCCESS',
        data: { userId: user.id },
      }));
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        logger.security('WebSocket authentication failed - invalid token', { ip });
        ws.close(1008, 'Invalid token');
      } else if (error instanceof jwt.TokenExpiredError) {
        logger.security('WebSocket authentication failed - expired token', { ip });
        ws.close(1008, 'Token expired');
      } else {
        logger.error('WebSocket authentication error', error);
        ws.close(1011, 'Authentication error');
      }
      return;
    }

    // Handle messages
    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        await handleWebSocketMessage(ws, message);
      } catch (error) {
        console.error('❌ WebSocket message error:', error);
        ws.send(JSON.stringify({ error: 'Invalid message format' }));
      }
    });

    // Handle disconnection
    ws.on('close', () => {
      if (ws.userId) {
        clients.delete(ws.userId);
        console.log(`🔌 WebSocket disconnected for user ${ws.userId}`);
      }
    });

    // Handle errors
    ws.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
      if (ws.userId) {
        clients.delete(ws.userId);
      }
    });
  });

  // Heartbeat interval
  const heartbeat = setInterval(() => {
    wss.clients.forEach((ws: AuthenticatedWebSocket) => {
      if (!ws.isAlive) {
        console.log('💔 Terminating dead WebSocket connection');
        if (ws.userId) {
          clients.delete(ws.userId);
        }
        return ws.terminate();
      }
      
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000); // 30 seconds

  // Cleanup on server shutdown
  wss.on('close', () => {
    clearInterval(heartbeat);
  });

  console.log('✅ WebSocket server initialized');
};

const handleWebSocketMessage = async (ws: AuthenticatedWebSocket, message: any) => {
  switch (message.type) {
    case 'LOCATION_UPDATE':
      await handleLocationUpdate(ws, message.data);
      break;
    case 'VISIT_STATUS_UPDATE':
      await handleVisitStatusUpdate(ws, message.data);
      break;
    case 'MESSAGE_TYPING':
      await handleTypingIndicator(ws, message.data);
      break;
    default:
      ws.send(JSON.stringify({ error: 'Unknown message type' }));
  }
};

const handleLocationUpdate = async (ws: AuthenticatedWebSocket, data: any) => {
  if (!ws.userId || ws.userRole !== 'NURSE') {
    ws.send(JSON.stringify({ error: 'Unauthorized' }));
    return;
  }

  try {
    // Update nurse location in database
    await prisma.user.update({
      where: { id: ws.userId },
      data: {
        lastKnownLat: data.lat,
        lastKnownLng: data.lng,
        lastLocationUpdate: new Date(),
      },
    });

    // Broadcast location to relevant users (patients, doctors)
    const visit = await prisma.visit.findFirst({
      where: {
        nurseId: ws.userId,
        status: { in: ['EN_ROUTE', 'ARRIVED', 'IN_PROGRESS'] },
      },
      include: {
        booking: {
          include: { patient: true },
        },
      },
    });

    if (visit) {
      // Send location update to patient
      const patientWs = clients.get(visit.booking.patientId);
      if (patientWs && patientWs.readyState === WebSocket.OPEN) {
        patientWs.send(JSON.stringify({
          type: 'NURSE_LOCATION_UPDATE',
          data: {
            visitId: visit.id,
            lat: data.lat,
            lng: data.lng,
            timestamp: new Date().toISOString(),
          },
        }));
      }

      // Send location update to doctor if assigned
      if (visit.doctorId) {
        const doctorWs = clients.get(visit.doctorId);
        if (doctorWs && doctorWs.readyState === WebSocket.OPEN) {
          doctorWs.send(JSON.stringify({
            type: 'NURSE_LOCATION_UPDATE',
            data: {
              visitId: visit.id,
              nurseId: ws.userId,
              lat: data.lat,
              lng: data.lng,
              timestamp: new Date().toISOString(),
            },
          }));
        }
      }
    }

    ws.send(JSON.stringify({ type: 'LOCATION_UPDATE_SUCCESS' }));
  } catch (error) {
    console.error('❌ Location update error:', error);
    ws.send(JSON.stringify({ error: 'Failed to update location' }));
  }
};

const handleVisitStatusUpdate = async (ws: AuthenticatedWebSocket, data: any) => {
  if (!ws.userId || !['NURSE', 'DOCTOR', 'ADMIN'].includes(ws.userRole || '')) {
    ws.send(JSON.stringify({ error: 'Unauthorized' }));
    return;
  }

  try {
    const visit = await prisma.visit.update({
      where: { id: data.visitId },
      data: { status: data.status },
      include: {
        booking: {
          include: { patient: true },
        },
      },
    });

    // Broadcast status update to all relevant parties
    const relevantUsers = [visit.booking.patientId];
    if (visit.doctorId) relevantUsers.push(visit.doctorId);

    relevantUsers.forEach(userId => {
      const userWs = clients.get(userId);
      if (userWs && userWs.readyState === WebSocket.OPEN) {
        userWs.send(JSON.stringify({
          type: 'VISIT_STATUS_CHANGED',
          data: {
            visitId: visit.id,
            status: data.status,
            timestamp: new Date().toISOString(),
          },
        }));
      }
    });

    ws.send(JSON.stringify({ type: 'VISIT_STATUS_UPDATE_SUCCESS' }));
  } catch (error) {
    console.error('❌ Visit status update error:', error);
    ws.send(JSON.stringify({ error: 'Failed to update visit status' }));
  }
};

const handleTypingIndicator = async (ws: AuthenticatedWebSocket, data: any) => {
  // Send typing indicator to recipient
  const recipientWs = clients.get(data.recipientId);
  if (recipientWs && recipientWs.readyState === WebSocket.OPEN) {
    recipientWs.send(JSON.stringify({
      type: 'TYPING_INDICATOR',
      data: {
        senderId: ws.userId,
        visitId: data.visitId,
        isTyping: data.isTyping,
      },
    }));
  }
};

// Helper function to send message to specific user
export const sendToUser = (userId: string, message: any) => {
  const ws = clients.get(userId);
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
    return true;
  }
  return false;
};

// Helper function to broadcast to multiple users
export const broadcastToUsers = (userIds: string[], message: any) => {
  const results = userIds.map(userId => sendToUser(userId, message));
  return results.filter(Boolean).length;
};
