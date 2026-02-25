import request from 'supertest';
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

jest.mock('express-rate-limit', () => {
  return () => (_req: any, _res: any, next: any) => next();
});

const JWT_SECRET = 'test-secret-key';

const mockUsers: any[] = [];
const mockRefreshTokens: any[] = [];

jest.mock('@prisma/client', () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      user: {
        findUnique: jest.fn().mockImplementation(({ where }: any) => {
          return Promise.resolve(
            mockUsers.find((u) => u.id === where.id || u.email === where.email) || null
          );
        }),
        create: jest.fn().mockImplementation(({ data, select }: any) => {
          const user = {
            id: `test-user-${mockUsers.length + 1}`,
            ...data,
            isActive: true,
            isVerified: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          mockUsers.push(user);
          if (select) {
            const result: any = {};
            for (const key of Object.keys(select)) {
              if (select[key] && key in user) result[key] = user[key];
            }
            return Promise.resolve(result);
          }
          return Promise.resolve(user);
        }),
      },
      refreshToken: {
        create: jest.fn().mockImplementation(({ data }: any) => {
          mockRefreshTokens.push(data);
          return Promise.resolve(data);
        }),
        findUnique: jest.fn().mockImplementation(({ where }: any) => {
          const token = mockRefreshTokens.find((t) => t.token === where.token);
          if (!token) return Promise.resolve(null);
          const user = mockUsers.find((u) => u.id === token.userId);
          return Promise.resolve({ ...token, user });
        }),
        delete: jest.fn().mockResolvedValue({}),
        deleteMany: jest.fn().mockResolvedValue({}),
      },
    })),
    UserRole: {
      PATIENT: 'PATIENT',
      NURSE: 'NURSE',
      DOCTOR: 'DOCTOR',
      ADMIN: 'ADMIN',
    },
  };
});

process.env.JWT_SECRET = JWT_SECRET;

let authRouter: any;

beforeAll(async () => {
  const mod = await import('../routes/auth');
  authRouter = mod.default;
});

beforeEach(() => {
  mockUsers.length = 0;
  mockRefreshTokens.length = 0;
});

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRouter);
  return app;
}

describe('POST /api/auth/register', () => {
  it('should register a new user with valid data', async () => {
    const app = createApp();
    const res = await request(app).post('/api/auth/register').send({
      email: 'test@example.com',
      password: 'SecurePass123!',
      firstName: 'Test',
      lastName: 'User',
      role: 'PATIENT',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe('test@example.com');
    expect(res.body.user.role).toBe('PATIENT');
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
  });

  it('should reject registration with missing required fields', async () => {
    const app = createApp();
    const res = await request(app).post('/api/auth/register').send({
      email: 'test@example.com',
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('should reject registration with invalid email', async () => {
    const app = createApp();
    const res = await request(app).post('/api/auth/register').send({
      email: 'not-an-email',
      password: 'SecurePass123!',
      firstName: 'Test',
      lastName: 'User',
      role: 'PATIENT',
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('email');
  });

  it('should reject registration with short password', async () => {
    const app = createApp();
    const res = await request(app).post('/api/auth/register').send({
      email: 'test@example.com',
      password: 'short',
      firstName: 'Test',
      lastName: 'User',
      role: 'PATIENT',
    });

    expect(res.status).toBe(400);
  });

  it('should reject invalid role', async () => {
    const app = createApp();
    const res = await request(app).post('/api/auth/register').send({
      email: 'test@example.com',
      password: 'SecurePass123!',
      firstName: 'Test',
      lastName: 'User',
      role: 'SUPERADMIN',
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('role');
  });

  it('should reject duplicate email registration', async () => {
    mockUsers.push({
      id: 'existing-user',
      email: 'existing@example.com',
      passwordHash: await bcrypt.hash('password', 10),
      firstName: 'Existing',
      lastName: 'User',
      role: 'PATIENT',
      isActive: true,
    });

    const app = createApp();
    const res = await request(app).post('/api/auth/register').send({
      email: 'existing@example.com',
      password: 'SecurePass123!',
      firstName: 'New',
      lastName: 'User',
      role: 'PATIENT',
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('User already exists');
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    const hash = await bcrypt.hash('SecurePass123!', 12);
    mockUsers.push({
      id: 'login-user-1',
      email: 'login@example.com',
      passwordHash: hash,
      firstName: 'Login',
      lastName: 'User',
      role: 'PATIENT',
      isActive: true,
      isVerified: false,
      preferredLanguage: 'en-ZA',
    });
  });

  it('should login with valid credentials', async () => {
    const app = createApp();
    const res = await request(app).post('/api/auth/login').send({
      email: 'login@example.com',
      password: 'SecurePass123!',
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe('login@example.com');
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
  });

  it('should reject login with wrong password', async () => {
    const app = createApp();
    const res = await request(app).post('/api/auth/login').send({
      email: 'login@example.com',
      password: 'WrongPassword!',
    });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid credentials');
  });

  it('should reject login with non-existent email', async () => {
    const app = createApp();
    const res = await request(app).post('/api/auth/login').send({
      email: 'nonexistent@example.com',
      password: 'SecurePass123!',
    });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid credentials');
  });

  it('should reject login with missing fields', async () => {
    const app = createApp();
    const res = await request(app).post('/api/auth/login').send({});

    expect(res.status).toBe(400);
  });

  it('should reject login for deactivated user', async () => {
    mockUsers[0].isActive = false;

    const app = createApp();
    const res = await request(app).post('/api/auth/login').send({
      email: 'login@example.com',
      password: 'SecurePass123!',
    });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Account is deactivated');
  });
});

describe('POST /api/auth/logout', () => {
  it('should logout successfully', async () => {
    const app = createApp();
    const res = await request(app).post('/api/auth/logout').send({
      refreshToken: 'some-refresh-token',
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Logged out successfully');
  });

  it('should handle logout without refresh token', async () => {
    const app = createApp();
    const res = await request(app).post('/api/auth/logout').send({});

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('GET /api/auth/me', () => {
  it('should return user profile with valid token', async () => {
    mockUsers.push({
      id: 'me-user-1',
      email: 'me@example.com',
      firstName: 'Me',
      lastName: 'User',
      role: 'PATIENT',
      isActive: true,
      isVerified: true,
      profileImage: null,
      dateOfBirth: null,
      gender: null,
      preferredLanguage: 'en-ZA',
      timezone: 'Africa/Johannesburg',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const token = jwt.sign({ userId: 'me-user-1', role: 'PATIENT' }, JWT_SECRET, { expiresIn: 900 });

    const app = createApp();
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe('me@example.com');
  });

  it('should reject request without token', async () => {
    const app = createApp();
    const res = await request(app).get('/api/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('No token provided');
  });

  it('should reject request with invalid token', async () => {
    const app = createApp();
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid-token');

    expect(res.status).toBe(500);
  });
});
