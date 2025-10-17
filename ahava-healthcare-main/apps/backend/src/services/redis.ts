import Redis from 'ioredis';

let redis: Redis | null = null;

export const initializeRedis = async () => {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

  // Skip Redis if explicitly disabled
  if (process.env.SKIP_REDIS === 'true') {
    console.log('⚠️  Redis disabled - running without cache');
    return null;
  }

  try {
    redis = new Redis(redisUrl, {
      enableReadyCheck: false,
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 3) {
          console.log('⚠️  Redis unavailable - continuing without cache');
          return null; // Stop retrying
        }
        return Math.min(times * 100, 1000);
      },
    } as any);

    redis.on('connect', () => {
      console.log('🔗 Redis connected');
    });

    redis.on('error', (error) => {
      // Suppress repeated error logging
      if (!error.message.includes('ECONNREFUSED')) {
        console.error('❌ Redis error:', error.message);
      }
    });

    // Try to ping Redis with timeout
    await Promise.race([
      redis.ping(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Redis timeout')), 2000)
      )
    ]);
    
    return redis;
  } catch (error) {
    console.log('⚠️  Redis unavailable - continuing without cache');
    if (redis) {
      redis.disconnect();
      redis = null;
    }
    return null;
  }
};

export const getRedis = () => {
  return redis; // Can be null if Redis is unavailable
};

export const closeRedis = async () => {
  if (redis) {
    await redis.quit();
  }
};
