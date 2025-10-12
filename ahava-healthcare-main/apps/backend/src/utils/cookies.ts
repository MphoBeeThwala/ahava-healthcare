import { Response } from 'express';

interface CookieOptions {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  maxAge?: number;
  path?: string;
}

/**
 * Set access token as httpOnly cookie
 * @param res Express response object
 * @param token JWT access token
 */
export function setAccessTokenCookie(res: Response, token: string): void {
  const isProduction = process.env.NODE_ENV === 'production';
  
  const options: CookieOptions = {
    httpOnly: true, // Prevents JavaScript access
    secure: isProduction, // HTTPS only in production
    sameSite: 'strict', // CSRF protection
    maxAge: 15 * 60 * 1000, // 15 minutes (matches JWT expiry)
    path: '/',
  };

  res.cookie('accessToken', token, options);
}

/**
 * Set refresh token as httpOnly cookie
 * @param res Express response object
 * @param token JWT refresh token
 */
export function setRefreshTokenCookie(res: Response, token: string): void {
  const isProduction = process.env.NODE_ENV === 'production';
  
  const options: CookieOptions = {
    httpOnly: true, // Prevents JavaScript access
    secure: isProduction, // HTTPS only in production
    sameSite: 'strict', // CSRF protection
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days (matches JWT expiry)
    path: '/',
  };

  res.cookie('refreshToken', token, options);
}

/**
 * Clear authentication cookies
 * @param res Express response object
 */
export function clearAuthCookies(res: Response): void {
  res.clearCookie('accessToken', { path: '/' });
  res.clearCookie('refreshToken', { path: '/' });
}

/**
 * Extract token from cookies or Authorization header
 * Prioritizes cookies for security, falls back to header for API clients
 * @param req Express request object
 * @returns Token string or null
 */
export function extractToken(req: any): string | null {
  // First, try to get token from httpOnly cookie (most secure)
  if (req.cookies && req.cookies.accessToken) {
    return req.cookies.accessToken;
  }

  // Fallback to Authorization header for API clients (mobile apps, etc.)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return null;
}

/**
 * Extract refresh token from cookies or body
 * @param req Express request object
 * @returns Refresh token string or null
 */
export function extractRefreshToken(req: any): string | null {
  // First, try to get from httpOnly cookie
  if (req.cookies && req.cookies.refreshToken) {
    return req.cookies.refreshToken;
  }

  // Fallback to request body for API clients
  if (req.body && req.body.refreshToken) {
    return req.body.refreshToken;
  }

  return null;
}


