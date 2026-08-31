import type { FastifyInstance, FastifyRequest } from 'fastify';
import fastifyJwt from '@fastify/jwt';
import { env } from '../config/env';

export async function registerAuthentication(app: FastifyInstance) {
  if (!env.JWT_SECRET) {
    if (env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET must be configured in production.');
    }

    return;
  }

  await app.register(fastifyJwt, {
    secret: env.JWT_SECRET,
  });
}

export async function authenticate(request: FastifyRequest) {
  await request.jwtVerify();
}
