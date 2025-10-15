import Redis from 'ioredis';

let redis: Redis;

export const initializeRedis = async () => {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

  redis = new Redis(redisUrl, {
    enableReadyCheck: false,
    maxRetriesPerRequest: null,
  } as any);

  redis.on('connect', () => {
    console.log('🔗 Redis connected');
  });

  redis.on('error', (error) => {
    console.error('❌ Redis connection error:', error);
  });

  // Wait for connection to establish
  await redis.ping();
  
  return redis;
};

export const getRedis = () => {
  if (!redis) {
    throw new Error('Redis not initialized. Call initializeRedis() first.');
  }
  return redis;
};

export const closeRedis = async () => {
  if (redis) {
    await redis.quit();
  }
};
