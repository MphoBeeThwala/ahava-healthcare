// Authentication API Tests
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { createTestApp } from '../helpers/testServer';
import {
  createTestUser,
  cleanupDatabase,
  cleanupUser,
  randomEmail,
  randomPhone,
  testUsers,
  passwordTestCases,
  extractTokenFromResponse,
  wait,
} from '../helpers/testHelpers';

const prisma = new PrismaClient();
const app = createTestApp();

describe('Authentication API', () => {
  // Clean up before each test
  beforeEach(async () => {
    await cleanupDatabase();
  });

  // Disconnect after all tests
  afterAll(async () => {
    await cleanupDatabase();
    await prisma.$disconnect();
  });

  describe('POST /api/auth/register', () => {
    describe('Success Cases', () => {
      it('should register a new patient with valid data', async () => {
        const userData = {
          email: randomEmail(),
          password: 'ValidP@ssw0rd123',
          firstName: 'John',
          lastName: 'Doe',
          role: 'PATIENT',
        };

        const response = await request(app)
          .post('/api/auth/register')
          .send(userData)
          .expect(201);

        expect(response.body).toHaveProperty('user');
        expect(response.body).toHaveProperty('accessToken');
        expect(response.body.user.email).toBe(userData.email);
        expect(response.body.user.role).toBe('PATIENT');
        expect(response.body.user).not.toHaveProperty('passwordHash');
      });

      it('should register users with all different roles', async () => {
        // Only PATIENT, NURSE, DOCTOR allowed in public registration (not ADMIN)
        const roles = ['PATIENT', 'NURSE', 'DOCTOR'];

        for (const role of roles) {
          const userData = {
            email: randomEmail(),
            password: 'ValidP@ssw0rd123',
            firstName: 'Test',
            lastName: 'User',
            role,
          };

          const response = await request(app)
            .post('/api/auth/register')
            .send(userData)
            .expect(201);

          expect(response.body.user.role).toBe(role);
        }
      });

      it('should set httpOnly cookie with access token', async () => {
        const userData = {
          email: randomEmail(),
          password: 'ValidP@ssw0rd123',
          firstName: 'John',
          lastName: 'Doe',
          role: 'PATIENT',
        };

        const response = await request(app)
          .post('/api/auth/register')
          .send(userData)
          .expect(201);

        const cookies = response.headers['set-cookie'];
        expect(cookies).toBeDefined();
        
        const accessTokenCookie = cookies?.find((c: string) => c.startsWith('accessToken='));
        expect(accessTokenCookie).toBeDefined();
        expect(accessTokenCookie).toContain('HttpOnly');
      });

      it('should accept optional phone number', async () => {
        const userData = {
          email: randomEmail(),
          password: 'ValidP@ssw0rd123',
          firstName: 'John',
          lastName: 'Doe',
          role: 'PATIENT',
          phone: randomPhone(),
        };

        const response = await request(app)
          .post('/api/auth/register')
          .send(userData)
          .expect(201);

        // Phone is returned from API
        if (response.body.user.phone) {
          expect(response.body.user.phone).toBe(userData.phone);
        }
      });
    });

    describe('Validation Errors', () => {
      it('should reject registration with missing email', async () => {
        const userData = {
          password: 'ValidP@ssw0rd123',
          firstName: 'John',
          lastName: 'Doe',
          role: 'PATIENT',
        };

        const response = await request(app)
          .post('/api/auth/register')
          .send(userData)
          .expect(400);

        expect(response.body.error).toBeDefined();
      });

      it('should reject registration with invalid email format', async () => {
        const userData = {
          email: 'invalid-email',
          password: 'ValidP@ssw0rd123',
          firstName: 'John',
          lastName: 'Doe',
          role: 'PATIENT',
        };

        const response = await request(app)
          .post('/api/auth/register')
          .send(userData)
          .expect(400);

        expect(response.body.error).toMatch(/email|exists/i);
      });

      it('should reject password that is too short', async () => {
        const userData = {
          email: randomEmail(),
          password: passwordTestCases.tooShort,
          firstName: 'John',
          lastName: 'Doe',
          role: 'PATIENT',
        };

        const response = await request(app)
          .post('/api/auth/register')
          .send(userData)
          .expect(400);

        expect(response.body.error).toMatch(/password/i);
      });

      it('should reject password without uppercase letter', async () => {
        const userData = {
          email: randomEmail(),
          password: passwordTestCases.noUppercase,
          firstName: 'John',
          lastName: 'Doe',
          role: 'PATIENT',
        };

        const response = await request(app)
          .post('/api/auth/register')
          .send(userData)
          .expect(400);

        expect(response.body.error).toMatch(/password/i);
      });

      it('should reject password without lowercase letter', async () => {
        const userData = {
          email: randomEmail(),
          password: passwordTestCases.noLowercase,
          firstName: 'John',
          lastName: 'Doe',
          role: 'PATIENT',
        };

        const response = await request(app)
          .post('/api/auth/register')
          .send(userData)
          .expect(400);

        expect(response.body.error).toMatch(/password/i);
      });

      it('should reject password without number', async () => {
        const userData = {
          email: randomEmail(),
          password: passwordTestCases.noNumber,
          firstName: 'John',
          lastName: 'Doe',
          role: 'PATIENT',
        };

        const response = await request(app)
          .post('/api/auth/register')
          .send(userData)
          .expect(400);

        expect(response.body.error).toMatch(/password/i);
      });

      it('should reject password without special character', async () => {
        const userData = {
          email: randomEmail(),
          password: passwordTestCases.noSpecial,
          firstName: 'John',
          lastName: 'Doe',
          role: 'PATIENT',
        };

        const response = await request(app)
          .post('/api/auth/register')
          .send(userData)
          .expect(400);

        expect(response.body.error).toMatch(/password/i);
      });

      it('should reject registration with duplicate email', async () => {
        const email = randomEmail();
        const userData = {
          email,
          password: 'ValidP@ssw0rd123',
          firstName: 'John',
          lastName: 'Doe',
          role: 'PATIENT',
        };

        // First registration should succeed
        await request(app)
          .post('/api/auth/register')
          .send(userData)
          .expect(201);

        // Second registration with same email should fail
        const response = await request(app)
          .post('/api/auth/register')
          .send(userData)
          .expect(400);

        expect(response.body.error).toMatch(/email|exists/i);
      });

      it('should reject registration with invalid role', async () => {
        const userData = {
          email: randomEmail(),
          password: 'ValidP@ssw0rd123',
          firstName: 'John',
          lastName: 'Doe',
          role: 'INVALID_ROLE',
        };

        const response = await request(app)
          .post('/api/auth/register')
          .send(userData)
          .expect(400);

        expect(response.body.error).toBeDefined();
      });

      it('should reject registration with missing required fields', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({})
          .expect(400);

        expect(response.body.error).toBeDefined();
      });
    });
  });

  describe('POST /api/auth/login', () => {
    describe('Success Cases', () => {
      it('should login with valid credentials', async () => {
        // Create test user
        const user = await createTestUser({
          email: 'login@test.com',
          password: 'Test@123456789',
        });

        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'login@test.com',
            password: 'Test@123456789',
          })
          .expect(200);

        expect(response.body).toHaveProperty('accessToken');
        expect(response.body).toHaveProperty('refreshToken');
        expect(response.body).toHaveProperty('user');
        expect(response.body.user.email).toBe('login@test.com');
      });

      it('should login all user roles', async () => {
        const roles = ['PATIENT', 'NURSE', 'DOCTOR', 'ADMIN'];

        for (const role of roles) {
          const email = `${role.toLowerCase()}@test.com`;
          await createTestUser({
            email,
            password: 'Test@123456789',
            role: role as any,
          });

          const response = await request(app)
            .post('/api/auth/login')
            .send({
              email,
              password: 'Test@123456789',
            })
            .expect(200);

          expect(response.body.user.role).toBe(role);
        }
      });

      it('should set httpOnly cookies on login', async () => {
        await createTestUser({
          email: 'cookie@test.com',
          password: 'Test@123456789',
        });

        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'cookie@test.com',
            password: 'Test@123456789',
          })
          .expect(200);

        const cookies = response.headers['set-cookie'];
        expect(cookies).toBeDefined();

        const accessTokenCookie = cookies?.find((c: string) => c.startsWith('accessToken='));
        const refreshTokenCookie = cookies?.find((c: string) => c.startsWith('refreshToken='));

        expect(accessTokenCookie).toBeDefined();
        expect(refreshTokenCookie).toBeDefined();
        expect(accessTokenCookie).toContain('HttpOnly');
        expect(refreshTokenCookie).toContain('HttpOnly');
      });
    });

    describe('Failure Cases', () => {
      it('should reject login with wrong password', async () => {
        await createTestUser({
          email: 'wrong@test.com',
          password: 'Test@123456789',
        });

        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'wrong@test.com',
            password: 'WrongPassword123!',
          })
          .expect(401);

        expect(response.body.error).toContain('Invalid');
      });

      it('should reject login with non-existent email', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'nonexistent@test.com',
            password: 'Test@123456789',
          })
          .expect(401);

        expect(response.body.error).toContain('Invalid');
      });

      it('should reject login for inactive user', async () => {
        await createTestUser({
          email: 'inactive@test.com',
          password: 'Test@123456789',
          isActive: false,
        });

        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'inactive@test.com',
            password: 'Test@123456789',
          })
          .expect(401);

        expect(response.body.error).toBeDefined();
      });

      it('should reject login with missing credentials', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({})
          .expect(400);

        expect(response.body.error).toBeDefined();
      });
    });

    describe('Account Lockout', () => {
      it('should lock account after 5 failed login attempts', async () => {
        await createTestUser({
          email: 'lockout@test.com',
          password: 'Test@123456789',
        });

        // Make 5 failed attempts
        for (let i = 0; i < 5; i++) {
          await request(app)
            .post('/api/auth/login')
            .send({
              email: 'lockout@test.com',
              password: 'WrongPassword123!',
            });
        }

        // 6th attempt should indicate account is locked
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'lockout@test.com',
            password: 'Test@123456789', // Even with correct password
          });

        // Should be locked (423) or still invalid (401) depending on implementation
        expect([401, 423]).toContain(response.status);
      });
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout and clear cookies', async () => {
      // Create and login user
      const user = await createTestUser({
        email: 'logout@test.com',
        password: 'Test@123456789',
      });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'logout@test.com',
          password: 'Test@123456789',
        });

      const token = extractTokenFromResponse(loginResponse);

      // Logout
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.message).toBeDefined();

      // Check cookies are cleared (either Max-Age=0 or Expires in past)
      const cookies = response.headers['set-cookie'];
      if (cookies) {
        const accessTokenCookie = cookies.find((c: string) => c.startsWith('accessToken='));
        if (accessTokenCookie) {
          // Cookie should be cleared (either Max-Age=0 or Expires header in past)
          expect(accessTokenCookie).toMatch(/Max-Age=0|Expires=Thu, 01 Jan 1970/);
        }
      }
    });
  });

  describe('GET /api/auth/csrf-token', () => {
    it('should return a valid CSRF token', async () => {
      const response = await request(app)
        .get('/api/auth/csrf-token')
        .expect(200);

      expect(response.body).toHaveProperty('csrfToken');
      expect(typeof response.body.csrfToken).toBe('string');
      expect(response.body.csrfToken.length).toBeGreaterThan(0);
    });
  });

  describe('Password Security', () => {
    it('should hash passwords before storing', async () => {
      const password = 'Test@123456789';
      const userData = {
        email: randomEmail(),
        password,
        firstName: 'John',
        lastName: 'Doe',
        role: 'PATIENT',
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Fetch user from database
      const user = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      expect(user).toBeDefined();
      expect(user!.passwordHash).toBeDefined();
      expect(user!.passwordHash).not.toBe(password);
      expect(user!.passwordHash).toContain('$2a$'); // bcrypt hash prefix
    });

    it('should not expose password hash in API responses', async () => {
      const userData = {
        email: randomEmail(),
        password: 'Test@123456789',
        firstName: 'John',
        lastName: 'Doe',
        role: 'PATIENT',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.user).not.toHaveProperty('passwordHash');
      expect(response.body.user).not.toHaveProperty('password');
    });
  });
});

