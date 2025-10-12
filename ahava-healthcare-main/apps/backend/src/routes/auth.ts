import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { authRateLimiter, registrationRateLimiter, accountLockoutMiddleware } from '../middleware/rateLimiter';
import { encryptData, decryptData } from '../utils/encryption';
import { getCSRFToken } from '../middleware/csrf';
import { setAccessTokenCookie, setRefreshTokenCookie, clearAuthCookies, extractToken, extractRefreshToken } from '../utils/cookies';
import logger from '../utils/logger';
import Joi from 'joi';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string()
    .min(12)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/)
    .required()
    .messages({
      'string.min': 'Password must be at least 12 characters long',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)',
    }),
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required(),
  role: Joi.string().valid('PATIENT', 'NURSE', 'DOCTOR').required(),
  phone: Joi.string().pattern(/^\+27[0-9]{9}$/).optional()
    .messages({
      'string.pattern.base': 'Phone number must be in South African format: +27XXXXXXXXX',
    }),
  dateOfBirth: Joi.date().max('now').optional(),
  gender: Joi.string().valid('male', 'female', 'other').optional(),
  preferredLanguage: Joi.string().default('en-ZA'),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

// Register new user
router.post('/register', registrationRateLimiter, async (req, res, next) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { email, password, firstName, lastName, role, phone, dateOfBirth, gender, preferredLanguage } = value;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
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
        preferredLanguage,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        isVerified: true,
      },
    });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id, user.role);

    // Set httpOnly cookies (secure by default in production)
    setAccessTokenCookie(res, accessToken);
    setRefreshTokenCookie(res, refreshToken);

    logger.info('User registered successfully', {
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    res.status(201).json({
      success: true,
      user,
      // Also send tokens in response for API clients (mobile apps)
      accessToken,
      refreshToken,
    });
  } catch (error) {
    next(error);
  }
});

// Login user
router.post('/login', authRateLimiter, accountLockoutMiddleware, async (req, res, next) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { email, password } = value;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.passwordHash) {
      // Call the lockout check for failed attempt
      if (res.locals.checkLoginAttempt) {
        await res.locals.checkLoginAttempt(false);
      }
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      // Call the lockout check for failed attempt
      if (res.locals.checkLoginAttempt) {
        await res.locals.checkLoginAttempt(false);
      }
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(401).json({ error: 'Account is deactivated. Please contact support.' });
    }

    // Call the lockout check for successful attempt
    if (res.locals.checkLoginAttempt) {
      await res.locals.checkLoginAttempt(true);
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id, user.role);

    // Set httpOnly cookies (secure by default in production)
    setAccessTokenCookie(res, accessToken);
    setRefreshTokenCookie(res, refreshToken);

    logger.info('User logged in successfully', {
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
        isVerified: user.isVerified,
        preferredLanguage: user.preferredLanguage,
      },
      // Also send tokens in response for API clients (mobile apps)
      accessToken,
      refreshToken,
    });
  } catch (error) {
    next(error);
  }
});

// Refresh token
router.post('/refresh', async (req, res, next) => {
  try {
    // Extract refresh token from cookies or body
    const refreshToken = extractRefreshToken(req);

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    // Verify refresh token
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET not configured');
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET) as any;

    // Check if refresh token exists in database
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      clearAuthCookies(res);
      return res.status(401).json({ error: 'Invalid or expired refresh token. Please log in again.' });
    }

    if (!tokenRecord.user.isActive) {
      clearAuthCookies(res);
      return res.status(401).json({ error: 'Account is deactivated. Please contact support.' });
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(
      tokenRecord.user.id,
      tokenRecord.user.role
    );

    // Set new cookies
    setAccessTokenCookie(res, accessToken);
    setRefreshTokenCookie(res, newRefreshToken);

    // Delete old refresh token
    await prisma.refreshToken.delete({
      where: { token: refreshToken },
    });

    logger.info('Token refreshed successfully', {
      userId: tokenRecord.user.id,
    });

    res.json({
      success: true,
      // Also send tokens for API clients
      accessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      clearAuthCookies(res);
      return res.status(401).json({ error: 'Invalid refresh token. Please log in again.' });
    }
    next(error);
  }
});

// Logout (invalidate refresh token and clear cookies)
router.post('/logout', async (req, res, next) => {
  try {
    // Extract refresh token from cookies or body
    const refreshToken = extractRefreshToken(req);

    if (refreshToken) {
      await prisma.refreshToken.deleteMany({
        where: { token: refreshToken },
      });
    }

    // Clear httpOnly cookies
    clearAuthCookies(res);

    logger.info('User logged out successfully');

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
});

// Get CSRF token
router.get('/csrf-token', getCSRFToken);

// Get current user profile
router.get('/me', async (req, res, next) => {
  try {
    // Extract token from cookies or Authorization header
    const token = extractToken(req);
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required. Please log in.' });
    }
    
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET not configured');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as any;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        isVerified: true,
        profileImage: true,
        dateOfBirth: true,
        gender: true,
        preferredLanguage: true,
        timezone: true,
        createdAt: true,
        updatedAt: true,
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

// Helper function to generate tokens
function generateTokens(userId: string, role: string) {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET not configured');
  }

  const accessToken = jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );

  const refreshToken = jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d' }
  );

  // Store refresh token in database
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId,
      expiresAt,
    },
  }).catch(error => {
    console.error('Failed to store refresh token:', error);
  });

  return { accessToken, refreshToken };
}

export default router;
