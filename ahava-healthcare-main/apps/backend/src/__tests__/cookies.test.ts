import { Request } from 'express';
import { extractToken } from '../utils/cookies';

describe('Cookie Utilities', () => {
  it('should extract token from Authorization header', () => {
    const mockReq = {
      headers: {
        authorization: 'Bearer test-token-123',
      },
      cookies: {},
    } as unknown as Request;

    const token = extractToken(mockReq);
    expect(token).toBe('test-token-123');
  });

  it('should extract token from cookies', () => {
    const mockReq = {
      headers: {},
      cookies: {
        accessToken: 'cookie-token-456',
      },
    } as unknown as Request;

    const token = extractToken(mockReq);
    expect(token).toBe('cookie-token-456');
  });

  it('should prefer cookie token over Authorization header', () => {
    const mockReq = {
      headers: {
        authorization: 'Bearer header-token',
      },
      cookies: {
        accessToken: 'cookie-token',
      },
    } as unknown as Request;

    const token = extractToken(mockReq);
    expect(token).toBe('cookie-token');
  });

  it('should return null when no token present', () => {
    const mockReq = {
      headers: {},
      cookies: {},
    } as unknown as Request;

    const token = extractToken(mockReq);
    expect(token).toBeNull();
  });

  it('should handle malformed Authorization header', () => {
    const mockReq = {
      headers: {
        authorization: 'InvalidFormat',
      },
      cookies: {},
    } as unknown as Request;

    const token = extractToken(mockReq);
    expect(token).toBeNull();
  });

  it('should handle empty Authorization header', () => {
    const mockReq = {
      headers: {
        authorization: 'Bearer ',
      },
      cookies: {},
    } as unknown as Request;

    const token = extractToken(mockReq);
    // Empty bearer token returns empty string, not null
    expect(token).toBe('');
  });
});

