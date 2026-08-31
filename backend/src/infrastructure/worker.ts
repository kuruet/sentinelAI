import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { env } from '../config/env';
import { QUEUE_NAMES } from './queue';

export const workerRedisConnection = new IORedis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

workerRedisConnection.on('error', (error) => {
  console.error('BullMQ worker Redis connection error:', error);
});

export const infrastructureTestWorker = new Worker(
  QUEUE_NAMES.infrastructureTest,
  async (job) => {
    console.log(`Processing job ${job.id}...`);

    return {
      processed: true,
      jobId: job.id,
      payload: job.data,
    };
  },
  {
    connection: workerRedisConnection,
  },
);

infrastructureTestWorker.on('completed', (job) => {
  console.log(`Job ${job.id} completed.`);
});

infrastructureTestWorker.on('failed', (job, error) => {
  console.error(`Job ${job?.id ?? 'unknown'} failed:`, error);
});

infrastructureTestWorker.on('error', (error) => {
  console.error('BullMQ worker error:', error);
});
