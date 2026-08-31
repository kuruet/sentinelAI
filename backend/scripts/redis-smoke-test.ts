import { redis } from '../src/infrastructure/redis';

const smokeTestKey = 'sentinelai:smoke-test';

async function main() {
  console.log('Connecting to Redis...');
  await redis.connect();

  console.log('Redis connected.');

  console.log('Writing smoke-test value...');
  await redis.set(smokeTestKey, 'sentinelai-ok');

  const value = await redis.get(smokeTestKey);

  if (value !== 'sentinelai-ok') {
    throw new Error(
      `Redis read verification failed. Expected "sentinelai-ok", received "${value}".`,
    );
  }

  console.log('Redis read verification passed.');

  console.log('Deleting smoke-test value...');
  const deleted = await redis.del(smokeTestKey);

  if (deleted !== 1) {
    throw new Error(
      `Redis delete verification failed. Expected 1 deleted key, received ${deleted}.`,
    );
  }

  const afterDelete = await redis.get(smokeTestKey);

  if (afterDelete !== null) {
    throw new Error(`Redis deletion verification failed. Key still contains "${afterDelete}".`);
  }

  console.log('Redis deletion verification passed.');

  await redis.quit();

  console.log('Redis disconnected.');
}

main().catch(async (error) => {
  console.error(error);

  if (redis.isOpen) {
    await redis.quit();
  }

  process.exitCode = 1;
});
