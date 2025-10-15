import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Store for tracking failed login attempts
interface LoginAttempt {
  count: number;
  lockoutUntil?: Date;
  lastAttempt: Date;
}

const loginAttempts = new Map<string, LoginAttempt>();

// Clean up old entries every hour
setInterval(() => {
  const now = new Date();
  for (const [key, attempt] of loginAttempts.entries()) {
    if (attempt.lockoutUntil && attempt.lockoutUntil < now) {
      loginAttempts.delete(key);
    } else if (now.getTime() - attempt.lastAttempt.getTime() > 3600000) {
      loginAttempts.delete(key);
    }
  }
}, 3600000);

// General API rate limiter
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting in test environment
    if (process.env.NODE_ENV === 'test') return true;
    // Skip rate limiting for health check
    return req.path === '/health';
  },
});

// Strict rate limiter for auth endpoints
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  skipSuccessfulRequests: true, // Only count failed attempts
  message: {
    error: 'Too many authentication attempts from this IP. Please try again after 15 minutes.',
  },
  skip: (req) => {
    // Skip rate limiting in test environment
    return process.env.NODE_ENV === 'test';
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// More restrictive rate limiter for registration
export const registrationRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 registrations per hour
  message: {
    error: 'Too many registration attempts from this IP. Please try again later.',
  },
  skip: (req) => {
    // Skip rate limiting in test environment
    return process.env.NODE_ENV === 'test';
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Webhook rate limiter (more lenient)
export const webhookRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 50, // Limit each IP to 50 requests per windowMs
  message: {
    error: 'Too many webhook requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Account lockout middleware for failed login attempts
 * Tracks failed attempts by email and locks account after threshold
 */
export const accountLockoutMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { email } = req.body;
  
  if (!email) {
    return next();
  }

  const key = email.toLowerCase();
  const attempt = loginAttempts.get(key);
  const now = new Date();

  // Check if account is locked
  if (attempt?.lockoutUntil && attempt.lockoutUntil > now) {
    const minutesRemaining = Math.ceil(
      (attempt.lockoutUntil.getTime() - now.getTime()) / 60000
    );
    return res.status(423).json({
      error: `Account is temporarily locked due to multiple failed login attempts. Please try again in ${minutesRemaining} minute(s).`,
      lockedUntil: attempt.lockoutUntil.toISOString(),
    });
  }

  // Store the next function to call after login attempt
  res.locals.checkLoginAttempt = async (success: boolean) => {
    if (success) {
      // Clear failed attempts on successful login
      loginAttempts.delete(key);
      
      // Also clear any database lockout record
      await prisma.user.updateMany({
        where: { email: key },
        data: { 
          // Note: You may want to add failedLoginAttempts and lockedUntil fields to schema
        },
      }).catch(err => console.error('Error clearing login attempts:', err));
    } else {
      // Increment failed attempts
      const currentAttempt = loginAttempts.get(key) || { count: 0, lastAttempt: now };
      currentAttempt.count += 1;
      currentAttempt.lastAttempt = now;

      // Lock account after 5 failed attempts
      if (currentAttempt.count >= 5) {
        currentAttempt.lockoutUntil = new Date(now.getTime() + 30 * 60000); // 30 minutes lockout
        
        // Optionally update database
        await prisma.user.updateMany({
          where: { email: key },
          data: {
            // Note: Add these fields to your schema if needed
            // failedLoginAttempts: currentAttempt.count,
            // lockedUntil: currentAttempt.lockoutUntil,
          },
        }).catch(err => console.error('Error updating login attempts:', err));
      }

      loginAttempts.set(key, currentAttempt);
    }
  };

  next();
};
