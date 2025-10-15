// Test setup file
import '@jest/globals';
import { PrismaClient } from '@prisma/client';

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-purposes';
process.env.DATABASE_URL = 'postgresql://ahava_user:ahava_dev_password@localhost:5432/ahava-healthcare-test?schema=public';
process.env.REDIS_URL = 'redis://:ahava_redis_pass@localhost:6379/1';
process.env.ENCRYPTION_KEY = '4KYLz9ePSX4fKHEuwuNI9yg31ThBTrlMNc22n/VVdGw=';
process.env.ENCRYPTION_IV_SALT = '74657374736f6d6573616c742021';
process.env.RATE_LIMIT_SKIP = 'true'; // Disable rate limiting for tests

// Increase timeout for all tests
jest.setTimeout(10000);

