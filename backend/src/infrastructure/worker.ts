import { config } from 'dotenv';
import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { QUEUE_NAMES } from './queue';

config({ path: '../.env' });

const connectionString = process.env.REDIS_URL;

if (!connectionString) {
  throw new Error('REDIS_URL is not configured.');
}

export const workerRedisConnection = new IORedis(connectionString, {
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
