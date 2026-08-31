import { config as loadEnv } from 'dotenv';

loadEnv({ path: '../.env' });

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is not configured.`);
  }

  return value;
}

function parsePort(value: string, name: string): number {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    throw new Error(`${name} must be an integer between 1 and 65535.`);
  }

  return parsed;
}

function parsePositiveInteger(value: string, name: string): number {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer.`);
  }

  return parsed;
}

const nodeEnv = process.env.NODE_ENV?.trim() || 'development';

if (!['development', 'test', 'production'].includes(nodeEnv)) {
  throw new Error('NODE_ENV must be one of "development", "test", or "production".');
}

export const env = {
  NODE_ENV: nodeEnv,

  PORT: parsePort(process.env.PORT?.trim() || '3000', 'PORT'),

  BACKEND_HOST: process.env.BACKEND_HOST?.trim() || '127.0.0.1',

  BACKEND_URL: process.env.BACKEND_URL?.trim() || 'http://localhost:3000',

  DATABASE_URL: requireEnv('DATABASE_URL'),

  REDIS_URL: requireEnv('REDIS_URL'),

  OPENAI_API_KEY: process.env.OPENAI_API_KEY?.trim() || undefined,

  JWT_SECRET: process.env.JWT_SECRET?.trim() || undefined,

  SIMULATION_TARGET: process.env.SIMULATION_TARGET?.trim() || 'http://localhost:3000',

  SIMULATION_INTERVAL: parsePositiveInteger(
    process.env.SIMULATION_INTERVAL?.trim() || '5000',
    'SIMULATION_INTERVAL',
  ),
} as const;
