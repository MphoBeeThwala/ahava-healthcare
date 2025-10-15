console.log('🚀 Starting Ahava Healthcare Backend...');

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
// @ts-ignore
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';

// Load environment variables
dotenv.config();
console.log('✓ Environment variables loaded');

// Import routes
console.log('Loading routes...');
import authRoutes from './routes/auth';
import bookingRoutes from './routes/bookings';
import visitRoutes from './routes/visits';
import messageRoutes from './routes/messages';
import paymentRoutes from './routes/payments';
import adminRoutes from './routes/admin';
import webhookRoutes from './routes/webhooks';
console.log('✓ Routes loaded');

// Import middleware
console.log('Loading middleware...');
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
import { authMiddleware } from './middleware/auth';
console.log('✓ Middleware loaded');

// Import services
console.log('Loading services...');
import { initializeRedis } from './services/redis';
import { initializeQueue } from './services/queue';
import { initializeWebSocket } from './services/websocket';
console.log('✓ Services loaded');

// Import logger
console.log('Loading logger...');
import logger from './utils/logger';
console.log('✓ Logger loaded');

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://ahava-healthcare-admin.railway.app', 'https://ahava-healthcare-doctor.railway.app']
    : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:19006'],
  credentials: true,
}));

// Compression and logging
app.use(compression());
app.use(morgan('combined'));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parsing (for httpOnly cookies)
import cookieParser from 'cookie-parser';
app.use(cookieParser());

// Serve uploaded files (with authentication)
import path from 'path';
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
app.use('/uploads', authMiddleware, express.static(UPLOAD_DIR));

// Rate limiting
app.use(rateLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    timezone: process.env.TIMEZONE || 'Africa/Johannesburg'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/bookings', authMiddleware, bookingRoutes);
app.use('/api/visits', authMiddleware, visitRoutes);
app.use('/api/messages', authMiddleware, messageRoutes);
app.use('/api/payments', authMiddleware, paymentRoutes);
app.use('/api/admin', authMiddleware, adminRoutes);
app.use('/webhooks', webhookRoutes);

// WebSocket initialization
initializeWebSocket(wss);

// 404 handler - must come before error handler
app.use('*', notFoundHandler);

// Error handling - must be last
app.use(errorHandler);

const PORT = process.env.PORT || 4000;

console.log('✓ Express app configured');

async function startServer() {
  console.log('Initializing server...');
  try {
    // Initialize Redis
    console.log('Connecting to Redis...');
    await initializeRedis();
    logger.info('Redis connected successfully');

    // Initialize BullMQ queues
    await initializeQueue();
    logger.info('BullMQ queues initialized successfully');

    // Start server
    server.listen(PORT, () => {
      logger.info(`Ahava Healthcare API server running on port ${PORT}`, {
        port: PORT,
        timezone: process.env.TIMEZONE,
        environment: process.env.NODE_ENV,
      });
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed, process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed, process terminated');
    process.exit(0);
  });
});

startServer();
