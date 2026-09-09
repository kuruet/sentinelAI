import type { FastifyInstance } from 'fastify';
import {
  DEMO_INCIDENT_IDS,
  DEMO_SCENARIOS,
  DEMO_USER_ID,
  initializeDemoScenario,
} from '../demo/demo-scenario';
import { authenticate, getAuthenticatedIdentity } from '../security';
import type { ApiSuccessResponse } from '../contracts';

interface DemoResetData {
  reset: boolean;
  initialized: boolean;
  incidentIds: string[];
  scenarios: Array<{
    id: string;
    incidentId: string;
    title: string;
    serviceName: string;
  }>;
}

export async function demoRoutes(app: FastifyInstance) {
  app.post(
    '/api/v1/demo/reset',
    {
      onRequest: [authenticate],
    },
    async (request, reply): Promise<ApiSuccessResponse<DemoResetData>> => {
      const identity = getAuthenticatedIdentity(request);

      if (identity.userId !== DEMO_USER_ID) {
        return reply.code(403).send({
          status: 'error',
          error: {
            code: 'FORBIDDEN',
            message: 'Demo reset is restricted to the configured demo user.',
          },
        } as never);
      }

      await initializeDemoScenario();

      return {
        status: 'ok',
        data: {
          reset: true,
          initialized: true,
          incidentIds: DEMO_INCIDENT_IDS,
          scenarios: Object.values(DEMO_SCENARIOS).map((scenario) => ({
            id: scenario.id,
            incidentId: scenario.incidentId,
            title: scenario.title,
            serviceName: scenario.serviceName,
          })),
        },
      };
    },
  );
}

