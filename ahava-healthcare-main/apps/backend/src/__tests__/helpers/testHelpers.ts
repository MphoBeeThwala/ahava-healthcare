// Test Helper Utilities
import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// Test user factory
interface CreateUserOptions {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  isActive?: boolean;
  isVerified?: boolean;
  phone?: string;
}

export async function createTestUser(options: CreateUserOptions = {}) {
  const {
    email = `test-${Date.now()}@example.com`,
    password = 'Test@123456789',
    firstName = 'Test',
    lastName = 'User',
    role = 'PATIENT' as UserRole,
    isActive = true,
    isVerified = true,
    phone = null,
  } = options;

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName,
      lastName,
      role,
      isActive,
      isVerified,
      phone,
    },
  });

  return { ...user, plainPassword: password };
}

// Generate test JWT token
export function generateTestToken(userId: string, email: string, role: UserRole) {
  const secret = process.env.JWT_SECRET || 'test-secret';
  return jwt.sign(
    { userId, email, role },
    secret,
    { expiresIn: '15m' }
  );
}

// Database cleanup helpers
export async function cleanupDatabase() {
  // Delete in correct order due to foreign keys
  await prisma.message.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.visit.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
}

export async function cleanupUser(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { email } });
  }
}

// Wait helper for rate limiting tests
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Random data generators
export function randomEmail(): string {
  return `test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
}

export function randomPhone(): string {
  const number = Math.floor(Math.random() * 900000000) + 100000000;
  return `+27${number}`;
}

// Extract token from response
export function extractTokenFromResponse(response: any): string | null {
  // Check if token in body
  if (response.body && response.body.accessToken) {
    return response.body.accessToken;
  }
  
  // Check if token in cookies
  const cookies = response.headers['set-cookie'];
  if (cookies) {
    const tokenCookie = cookies.find((cookie: string) => cookie.startsWith('accessToken='));
    if (tokenCookie) {
      return tokenCookie.split(';')[0].split('=')[1];
    }
  }
  
  return null;
}

// Test data generators
export const testUsers = {
  validPatient: {
    email: 'patient@test.com',
    password: 'Patient@123456789',
    firstName: 'John',
    lastName: 'Doe',
    role: 'PATIENT' as UserRole,
  },
  validNurse: {
    email: 'nurse@test.com',
    password: 'Nurse@123456789',
    firstName: 'Mary',
    lastName: 'Smith',
    role: 'NURSE' as UserRole,
  },
  validDoctor: {
    email: 'doctor@test.com',
    password: 'Doctor@123456789',
    firstName: 'Dr. Sarah',
    lastName: 'Johnson',
    role: 'DOCTOR' as UserRole,
  },
  validAdmin: {
    email: 'admin@test.com',
    password: 'Admin@123456789',
    firstName: 'Admin',
    lastName: 'User',
    role: 'ADMIN' as UserRole,
  },
};

// Password validation test cases
export const passwordTestCases = {
  tooShort: 'Short1!',
  noUppercase: 'lowercase123!',
  noLowercase: 'UPPERCASE123!',
  noNumber: 'NoNumber!',
  noSpecial: 'NoSpecial123',
  valid: 'ValidP@ssw0rd123',
};

