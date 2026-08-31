import { config } from 'dotenv';
import { createClient, type RedisClientType } from 'redis';

config({ path: '../.env' });

const globalForRedis = globalThis as unknown as {
  redis?: RedisClientType;
};

const connectionString = process.env.REDIS_URL;

if (!connectionString) {
  throw new Error('REDIS_URL is not configured.');
}

export const redis =
  globalForRedis.redis ??
  createClient({
    url: connectionString,
  });

redis.on('error', (error) => {
  console.error('Redis client error:', error);
});

if (process.env.NODE_ENV !== 'production') {
  globalForRedis.redis = redis;
}
