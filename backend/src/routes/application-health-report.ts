import type { FastifyInstance } from 'fastify';

import type { ApiSuccessResponse } from '../contracts';
import type { ApplicationHealthReport } from '../contracts/application-health-report';
import { AppError } from '../errors/app-error';
import { prisma } from '../infrastructure/database';
import { authenticate, getAuthenticatedIdentity } from '../security';
import { generateApplicationHealthReport } from '../services/application-health-report-service';

const MAX_REPORT_PERIOD_MS = 90 * 24 * 60 * 60 * 1000;


interface ReportQuery {
  startAt?: string;
  endAt?: string;
}

function isValidTimestamp(value: string): boolean {
  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,9}))?(Z|[+-]\d{2}:\d{2})$/,
  );

  if (!match) return false;

  const [, yearText, monthText, dayText, hourText, minuteText, secondText, , zone] = match;

  const year = Number(yearText);

  // PostgreSQL timestamps do not support ISO year 0000.
  if (year < 1) return false;
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const second = Number(secondText);

  const isLeapYear =
    year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);

  const daysInMonth = [
    31, isLeapYear ? 29 : 28, 31, 30, 31, 30,
    31, 31, 30, 31, 30, 31,
  ][month - 1];

  if (
    month < 1 || month > 12 ||
    day < 1 || day > daysInMonth ||
    hour > 23 ||
    minute > 59 ||
    second > 59
  ) {
    return false;
  }

  if (zone !== 'Z') {
    const offsetHours = Number(zone.slice(1, 3));
    const offsetMinutes = Number(zone.slice(4, 6));

    if (
      offsetHours > 14 ||
      offsetMinutes > 59 ||
      (offsetHours === 14 && offsetMinutes !== 0)
    ) {
      return false;
    }
  }

  return Number.isFinite(Date.parse(value));
}

function parseReportPeriod(query: ReportQuery): {
  start: Date;
  end: Date;
  previousStart: Date;
} {
 if (
  typeof query.startAt !== 'string' ||
  typeof query.endAt !== 'string' ||
  !isValidTimestamp(query.startAt) ||
  !isValidTimestamp(query.endAt)
) {
  throw new AppError(
    400,
    'BAD_REQUEST',
    'startAt and endAt must be valid ISO-8601 timestamps with an explicit timezone.',
  );
}

  const start = new Date(query.startAt);
  const end = new Date(query.endAt);
  const duration = end.getTime() - start.getTime();

  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || duration <= 0) {
    throw new AppError(400, 'BAD_REQUEST', 'endAt must be later than startAt.');
  }

  if (duration > MAX_REPORT_PERIOD_MS) {
    throw new AppError(400, 'BAD_REQUEST', 'The reporting period cannot exceed 90 days.');
  }

  return {
    start,
    end,
    previousStart: new Date(start.getTime() - duration),
  };
}

export async function applicationHealthReportRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authenticate);

  app.get(
    '/api/v1/reports/application-health',
    async (request): Promise<ApiSuccessResponse<ApplicationHealthReport>> => {
      const identity = getAuthenticatedIdentity(request);
      const query = request.query as ReportQuery;
      const { start, end, previousStart } = parseReportPeriod(query);

      const [incidents, events, evidence, evidenceWithoutValidOccurrenceTimeCount] =
        await Promise.all([
          prisma.incident.findMany({
            where: {
              createdAt: { gte: previousStart, lt: end },
              participants: { some: { userId: identity.userId } },
            },
            select: {
              id: true,
              createdAt: true,
              startedAt: true,
              resolvedAt: true,
              status: true,
              severity: true,
            },
            orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
          }),
          prisma.incidentEvent.findMany({
            where: {
              occurredAt: { gte: previousStart, lt: end },
              incident: { participants: { some: { userId: identity.userId } } },
            },
            select: {
              id: true,
              incidentId: true,
              occurredAt: true,
              eventType: true,
            },
            orderBy: [{ occurredAt: 'asc' }, { id: 'asc' }],
          }),
          prisma.evidence.findMany({
            where: {
              occurredAt: { gte: previousStart, lt: end },
              incident: { participants: { some: { userId: identity.userId } } },
            },
            select: {
              id: true,
              incidentId: true,
              occurredAt: true,
              evidenceType: true,
            },
            orderBy: [{ occurredAt: 'asc' }, { id: 'asc' }],
          }),
          prisma.evidence.count({
            where: {
              occurredAt: null,
              incident: { participants: { some: { userId: identity.userId } } },
            },
          }),
        ]);

      const report = generateApplicationHealthReport({
        period: { startAt: start.toISOString(), endAt: end.toISOString() },
        incidents: incidents.map((incident) => ({
          id: incident.id,
          createdAt: incident.createdAt.toISOString(),
          startedAt: incident.startedAt?.toISOString() ?? null,
          resolvedAt: incident.resolvedAt?.toISOString() ?? null,
          status: incident.status,
          severity: incident.severity,
        })),
        events: events.map((event) => ({
          id: event.id,
          incidentId: event.incidentId,
          occurredAt: event.occurredAt.toISOString(),
          eventType: event.eventType,
        })),
        evidence: evidence.map((item) => ({
          id: item.id,
          incidentId: item.incidentId,
          occurredAt: item.occurredAt?.toISOString() ?? null,
          evidenceType: item.evidenceType,
        })),
        evidenceWithoutValidOccurrenceTimeCount,
      });

      return { status: 'ok', data: report };
    },
  );
}
