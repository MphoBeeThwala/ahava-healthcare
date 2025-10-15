// Test Server Setup
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

// Import routes
import authRoutes from '../../routes/auth';

// Create test app without full middleware stack
export function createTestApp() {
  const app = express();

  // Disable rate limiting for tests
  process.env.RATE_LIMIT_SKIP = 'true';

  // Essential middleware only
  app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true,
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Mount routes (rate limiter should be disabled via env var)
  app.use('/api/auth', authRoutes);

  // Simple error handler for tests
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    res.status(err.status || 500).json({
      error: err.message || 'Internal server error',
    });
  });

  return app;
}

