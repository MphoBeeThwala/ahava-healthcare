import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import logger from '../utils/logger';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = { ...err };
  error.message = err.message;

  // Log error with full details (for internal monitoring)
  logger.error('Request error occurred', err, {
    url: req.url,
    method: req.method,
    ip: req.ip,
    userId: (req as any).user?.id,
    body: process.env.NODE_ENV === 'development' ? req.body : undefined,
  });

  // Prisma errors - sanitize messages
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002':
        // Extract field name from meta if available
        const field = (err.meta?.target as string[])?.join(', ') || 'field';
        error.message = `A record with this ${field} already exists`;
        error.statusCode = 409;
        break;
      case 'P2014':
        error.message = 'The provided ID is invalid';
        error.statusCode = 400;
        break;
      case 'P2003':
        error.message = 'Referenced record does not exist';
        error.statusCode = 400;
        break;
      case 'P2025':
        error.message = 'Record not found';
        error.statusCode = 404;
        break;
      case 'P2000':
        error.message = 'Value provided is too long for the field';
        error.statusCode = 400;
        break;
      case 'P2001':
        error.message = 'Record not found in database';
        error.statusCode = 404;
        break;
      default:
        error.message = 'A database error occurred';
        error.statusCode = 500;
        
        // Log unknown Prisma errors for investigation
        logger.error('Unknown Prisma error', err, {
          code: err.code,
          meta: err.meta,
        });
    }
  }

  // Prisma validation errors
  if (err instanceof Prisma.PrismaClientValidationError) {
    error.message = 'Invalid data provided';
    error.statusCode = 400;
  }

  // JWT errors - don't leak implementation details
  if (err.name === 'JsonWebTokenError') {
    error.message = 'Authentication failed. Please log in again.';
    error.statusCode = 401;
    
    logger.security('JWT validation failed', {
      ip: req.ip,
      path: req.path,
    });
  }

  if (err.name === 'TokenExpiredError') {
    error.message = 'Your session has expired. Please log in again.';
    error.statusCode = 401;
  }

  // Validation errors (from Joi, etc.)
  if (err.name === 'ValidationError') {
    error.message = 'Validation failed. Please check your input.';
    error.statusCode = 400;
  }

  // Handle specific operational errors safely
  const operationalErrors = [
    'Too many requests',
    'Invalid credentials',
    'Access denied',
    'Account is temporarily locked',
    'CSRF token',
  ];

  const isOperational = error.isOperational || 
    operationalErrors.some(msg => error.message?.includes(msg));

  // Default to 500 server error
  const statusCode = error.statusCode || 500;
  
  // Determine safe message to send to client
  let clientMessage: string;
  
  if (statusCode === 500 && !isOperational) {
    // Don't leak internal error details in production
    clientMessage = process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred. Please try again later.'
      : error.message || 'Internal server error';
      
    // Log severe errors for monitoring
    logger.error('Internal server error', err, {
      statusCode,
      url: req.url,
      userId: (req as any).user?.id,
    });
  } else {
    clientMessage = error.message || 'An error occurred';
  }

  // Construct response
  const errorResponse: any = {
    success: false,
    error: clientMessage,
    statusCode,
  };

  // Only include stack traces in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
    errorResponse.details = {
      name: err.name,
      code: (err as any).code,
    };
  }

  // Send response
  res.status(statusCode).json(errorResponse);
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.warn('Route not found', {
    method: req.method,
    url: req.url,
    ip: req.ip,
  });

  res.status(404).json({
    success: false,
    error: 'The requested resource was not found',
    statusCode: 404,
  });
};

/**
 * Async error wrapper to catch async errors in route handlers
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

