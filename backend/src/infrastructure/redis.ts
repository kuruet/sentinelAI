import { createClient, type RedisClientType } from 'redis';
import { env } from '../config/env';

const globalForRedis = globalThis as unknown as {
  redis?: RedisClientType;
};

export const redis =
  globalForRedis.redis ??
  createClient({
    url: env.REDIS_URL,
  });

redis.on('error', (error) => {
  console.error('Redis client error:', error);
});

if (env.NODE_ENV !== 'production') {
  globalForRedis.redis = redis;
}

export async function connectRedis() {
  if (!redis.isOpen) {
    await redis.connect();
  }
}
