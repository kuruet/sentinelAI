import { config } from 'dotenv';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

config({ path: '../.env' });

const connectionString = process.env.REDIS_URL;

if (!connectionString) {
  throw new Error('REDIS_URL is not configured.');
}

export const QUEUE_NAMES = {
  infrastructureTest: 'sentinelai.infrastructure-test',
} as const;

export const queueRedisConnection = new IORedis(connectionString, {
  maxRetriesPerRequest: null,
});

queueRedisConnection.on('error', (error) => {
  console.error('BullMQ queue Redis connection error:', error);
});

export const infrastructureTestQueue = new Queue(QUEUE_NAMES.infrastructureTest, {
  connection: queueRedisConnection,
});
