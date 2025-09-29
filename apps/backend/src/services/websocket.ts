import { WebSocketServer, WebSocket } from 'ws';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  userRole?: string;
  isAlive?: boolean;
}

const clients = new Map<string, AuthenticatedWebSocket>();

export const initializeWebSocket = (wss: WebSocketServer) => {
  wss.on('connection', (ws: AuthenticatedWebSocket, req) => {
    console.log('🔌 New WebSocket connection');

    // Heartbeat mechanism
    ws.isAlive = true;
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    // Authenticate connection
    const token = req.url?.split('token=')[1];
    
    if (!token || !process.env.JWT_SECRET) {
      ws.close(1008, 'Authentication required');
      return;
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET) as any;
      ws.userId = decoded.userId;
      ws.userRole = decoded.role;
      
      // Store client connection
      clients.set(ws.userId, ws);
      
      console.log(`✅ WebSocket authenticated for user ${ws.userId}`);
    } catch (error) {
      console.error('❌ WebSocket authentication failed:', error);
      ws.close(1008, 'Invalid token');
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
