import { config } from 'dotenv';
import { QueueEvents } from 'bullmq';
import IORedis from 'ioredis';
import { infrastructureTestQueue } from '../src/infrastructure/queue';
import { infrastructureTestWorker } from '../src/infrastructure/worker';

config({ path: '../.env' });

const connectionString = process.env.REDIS_URL;

if (!connectionString) {
  throw new Error('REDIS_URL is not configured.');
}

const smokeTestJobName = 'infrastructure-smoke-test';

const smokeTestPayload = {
  source: 'sentinelai',
  purpose: 'bullmq-infrastructure-validation',
};

async function main() {
  const queueEventsConnection = new IORedis(connectionString, {
    maxRetriesPerRequest: null,
  });

  const queueEvents = new QueueEvents(infrastructureTestQueue.name, {
    connection: queueEventsConnection,
  });

  try {
    console.log('Cleaning stale smoke-test jobs...');

    await infrastructureTestQueue.obliterate({
      force: true,
    });

    await queueEvents.waitUntilReady();

    console.log('Queue events connection ready.');

    console.log('Adding smoke-test job...');

    const job = await infrastructureTestQueue.add(smokeTestJobName, smokeTestPayload);

    if (!job.id) {
      throw new Error('BullMQ did not assign a job ID.');
    }

    console.log(`Job queued: ${job.id}`);

    console.log('Waiting for job completion...');

    const returnValue = await job.waitUntilFinished(queueEvents, 10000);

    console.log('Job completion received.');

    if (returnValue?.processed !== true) {
      throw new Error('BullMQ worker did not return the expected processed=true result.');
    }

    if (returnValue?.jobId !== job.id) {
      throw new Error(
        `BullMQ result job ID mismatch. Expected "${job.id}", received "${returnValue?.jobId}".`,
      );
    }

    const returnedPayload = returnValue?.payload;

    if (
      returnedPayload?.source !== smokeTestPayload.source ||
      returnedPayload?.purpose !== smokeTestPayload.purpose
    ) {
      throw new Error('BullMQ payload round-trip verification failed.');
    }

    console.log('Job result verified.');
    console.log('Payload round-trip verified.');

    console.log('Removing completed smoke-test job...');

    await job.remove();

    console.log('Smoke-test job removed.');

    console.log('BullMQ runtime smoke test completed successfully.');
  } finally {
    await queueEvents.close();
    await infrastructureTestWorker.close();
    await infrastructureTestQueue.close();
    await queueEventsConnection.quit();

    console.log('BullMQ worker, queue, and event connections closed.');
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
