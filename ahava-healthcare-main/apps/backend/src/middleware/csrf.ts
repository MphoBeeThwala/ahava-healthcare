import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import logger from '../utils/logger';

interface CSRFToken {
  token: string;
  createdAt: Date;
}

// Store CSRF tokens temporarily (in production, use Redis)
const csrfTokens = new Map<string, CSRFToken>();

// Clean up expired tokens every hour
setInterval(() => {
  const now = new Date();
  for (const [key, value] of csrfTokens.entries()) {
    // Tokens expire after 1 hour
    if (now.getTime() - value.createdAt.getTime() > 3600000) {
      csrfTokens.delete(key);
    }
  }
}, 3600000);

/**
 * Generate a CSRF token
 */
export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Middleware to generate and attach CSRF token to requests
 * This should be used for routes that render forms or need CSRF protection
 */
export const csrfTokenMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Skip CSRF for safe HTTP methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Generate token if not exists
  const sessionId = req.sessionID || req.ip || 'default';
  let tokenData = csrfTokens.get(sessionId);

  if (!tokenData || new Date().getTime() - tokenData.createdAt.getTime() > 3600000) {
    const token = generateCSRFToken();
    tokenData = {
      token,
      createdAt: new Date(),
    };
    csrfTokens.set(sessionId, tokenData);
  }

  // Attach token to response for client to use
  res.locals.csrfToken = tokenData.token;
  
  next();
};

/**
 * Middleware to validate CSRF tokens
 * This should be applied to state-changing routes (POST, PUT, DELETE, PATCH)
 */
export const csrfProtection = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Skip CSRF for safe HTTP methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Skip CSRF for webhooks and specific API endpoints that use other auth
  const skipPaths = ['/webhooks', '/api/auth/login', '/api/auth/register'];
  if (skipPaths.some(path => req.path.startsWith(path))) {
    return next();
  }

  // Get CSRF token from headers or body
  const token = 
    req.headers['x-csrf-token'] as string ||
    req.headers['csrf-token'] as string ||
    req.body?._csrf ||
    req.query?._csrf;

  if (!token) {
    logger.security('CSRF token missing', {
      ip: req.ip,
      method: req.method,
      path: req.path,
      userId: (req as any).user?.id,
    });
    return res.status(403).json({
      error: 'CSRF token missing. Please include a valid CSRF token in your request.',
    });
  }

  // Validate token
  const sessionId = req.sessionID || req.ip || 'default';
  const storedTokenData = csrfTokens.get(sessionId);

  if (!storedTokenData || storedTokenData.token !== token) {
    logger.security('CSRF token validation failed', {
      ip: req.ip,
      method: req.method,
      path: req.path,
      userId: (req as any).user?.id,
      providedToken: token?.substring(0, 10) + '...',
    });
    return res.status(403).json({
      error: 'Invalid CSRF token. Your session may have expired.',
    });
  }

  // Token is valid
  next();
};

/**
 * Route handler to get a CSRF token
 * Frontend should call this before making state-changing requests
 */
export const getCSRFToken = (req: Request, res: Response) => {
  const sessionId = req.sessionID || req.ip || 'default';
  let tokenData = csrfTokens.get(sessionId);

  if (!tokenData) {
    const token = generateCSRFToken();
    tokenData = {
      token,
      createdAt: new Date(),
    };
    csrfTokens.set(sessionId, tokenData);
  }

  res.json({
    success: true,
    csrfToken: tokenData.token,
  });
};

/**
 * Middleware to add CSRF protection conditionally
 * Use this for routes that need CSRF only when not using API tokens
 */
export const conditionalCSRFProtection = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // If request has API token (Bearer), skip CSRF
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return next();
  }

  // Otherwise, apply CSRF protection
  return csrfProtection(req, res, next);
};


