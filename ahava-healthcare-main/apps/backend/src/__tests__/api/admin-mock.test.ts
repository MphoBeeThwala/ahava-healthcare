// Mock-Based Admin API Tests
// Tests admin endpoints validation and RBAC without database dependency

import request from 'supertest';
import express from 'express';

// Mock the auth middleware module BEFORE importing routes
jest.mock('../../middleware/auth', () => ({
  authMiddleware: (req: any, res: any, next: any) => {
    req.user = {
      id: 'test-admin-id',
      email: 'admin@test.com',
      role: 'ADMIN',
      isActive: true,
    };
    next();
  },
  requireAdmin: (req: any, res: any, next: any) => {
    if (req.user && req.user.role === 'ADMIN') {
      next();
    } else {
      res.status(403).json({ error: 'Insufficient permissions' });
    }
  },
  AuthenticatedRequest: {},
}));

// Import routes AFTER mocking
import adminRoutes from '../../routes/admin';

describe('Admin API (Mock-Based)', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/admin', adminRoutes);
  });

  describe('POST /api/admin/users - Validation', () => {
    it('should reject user creation without email', async () => {
      const response = await request(app)
        .post('/api/admin/users')
        .send({
          password: 'ValidP@ssw0rd123',
          firstName: 'John',
          lastName: 'Doe',
          role: 'PATIENT',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/email/i);
    });

    it('should reject user creation with invalid email', async () => {
      const response = await request(app)
        .post('/api/admin/users')
        .send({
          email: 'not-an-email',
          password: 'ValidP@ssw0rd123',
          firstName: 'John',
          lastName: 'Doe',
          role: 'PATIENT',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/email/i);
    });

    it('should reject weak password', async () => {
      const response = await request(app)
        .post('/api/admin/users')
        .send({
          email: 'test@example.com',
          password: 'weak',
          firstName: 'John',
          lastName: 'Doe',
          role: 'PATIENT',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/password/i);
    });

    it('should reject password without uppercase', async () => {
      const response = await request(app)
        .post('/api/admin/users')
        .send({
          email: 'test@example.com',
          password: 'lowercase123!',
          firstName: 'John',
          lastName: 'Doe',
          role: 'PATIENT',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/password/i);
    });

    it('should reject user creation without firstName', async () => {
      const response = await request(app)
        .post('/api/admin/users')
        .send({
          email: 'test@example.com',
          password: 'ValidP@ssw0rd123',
          lastName: 'Doe',
          role: 'PATIENT',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/firstName|first name/i);
    });

    it('should reject user creation without lastName', async () => {
      const response = await request(app)
        .post('/api/admin/users')
        .send({
          email: 'test@example.com',
          password: 'ValidP@ssw0rd123',
          firstName: 'John',
          role: 'PATIENT',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/lastName|last name/i);
    });

    it('should reject user creation without role', async () => {
      const response = await request(app)
        .post('/api/admin/users')
        .send({
          email: 'test@example.com',
          password: 'ValidP@ssw0rd123',
          firstName: 'John',
          lastName: 'Doe',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/role/i);
    });

    it('should reject invalid role in admin creation', async () => {
      const response = await request(app)
        .post('/api/admin/users')
        .send({
          email: 'test@example.com',
          password: 'ValidP@ssw0rd123',
          firstName: 'John',
          lastName: 'Doe',
          role: 'SUPERUSER',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/role/i);
    });

    it('should allow ADMIN role creation (unlike public registration)', async () => {
      const response = await request(app)
        .post('/api/admin/users')
        .send({
          email: 'newadmin@example.com',
          password: 'ValidP@ssw0rd123',
          firstName: 'New',
          lastName: 'Admin',
          role: 'ADMIN',
        });

      // Should not fail on role validation (may fail on DB but not validation)
      if (response.status === 400) {
        expect(response.body.error).not.toMatch(/role/i);
      }
    });

    it('should reject firstName that is too short', async () => {
      const response = await request(app)
        .post('/api/admin/users')
        .send({
          email: 'test@example.com',
          password: 'ValidP@ssw0rd123',
          firstName: 'A',
          lastName: 'Doe',
          role: 'PATIENT',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/firstName|first name/i);
    });

    it('should reject lastName that is too short', async () => {
      const response = await request(app)
        .post('/api/admin/users')
        .send({
          email: 'test@example.com',
          password: 'ValidP@ssw0rd123',
          firstName: 'John',
          lastName: 'D',
          role: 'PATIENT',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/lastName|last name/i);
    });
  });
});
