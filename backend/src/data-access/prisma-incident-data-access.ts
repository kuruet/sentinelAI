import { prisma } from '../infrastructure/database';
import type { IncidentDataAccess, IncidentRecord } from './incident-data-access';
import type { CreateIncidentRequest } from '../contracts/incident';

export class PrismaIncidentDataAccess implements IncidentDataAccess {
  async findById(id: string): Promise<IncidentRecord | null> {
    const incident = await prisma.incident.findUnique({
      where: { id },
    });

    if (!incident) {
      return null;
    }

    return {
      id: incident.id,
      title: incident.title,
      description: incident.description,
      status: incident.status,
      severity: incident.severity,
      priority: incident.priority,
      startedAt: incident.startedAt,
      resolvedAt: incident.resolvedAt,
      closedAt: incident.closedAt,
      createdAt: incident.createdAt,
      updatedAt: incident.updatedAt,
    };
  }

  async create(input: CreateIncidentRequest): Promise<IncidentRecord> {
    const incident = await prisma.incident.create({
      data: {
        title: input.title,
        description: input.description ?? null,
        severity: input.severity,
        priority: input.priority ?? 0,
        startedAt: input.startedAt ? new Date(input.startedAt) : null,
      },
    });

    return {
      id: incident.id,
      title: incident.title,
      description: incident.description,
      status: incident.status,
      severity: incident.severity,
      priority: incident.priority,
      startedAt: incident.startedAt,
      resolvedAt: incident.resolvedAt,
      closedAt: incident.closedAt,
      createdAt: incident.createdAt,
      updatedAt: incident.updatedAt,
    };
  }
}
