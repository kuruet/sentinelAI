import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { env } from '../config/env';

export const QUEUE_NAMES = {
  infrastructureTest: 'sentinelai.infrastructure-test',
} as const;

export const queueRedisConnection = new IORedis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

queueRedisConnection.on('error', (error) => {
  console.error('BullMQ queue Redis connection error:', error);
});

export const infrastructureTestQueue = new Queue(QUEUE_NAMES.infrastructureTest, {
  connection: queueRedisConnection,
});
