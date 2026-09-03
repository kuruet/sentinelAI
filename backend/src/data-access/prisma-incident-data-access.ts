import { prisma } from '../infrastructure/database';
import type {
  CreateIncidentRequest,
  ListIncidentsQuery,
  UpdateIncidentLifecycleRequest,
  UpdateIncidentSeverityPriorityRequest,
  UpdateIncidentRequest,
} from '../contracts/incident';
import type {
  IncidentDataAccess,
  IncidentListResult,
  IncidentRecord,
} from './incident-data-access';

export class PrismaIncidentDataAccess implements IncidentDataAccess {
  async findById(id: string): Promise<IncidentRecord | null> {
    const incident = await prisma.incident.findUnique({
      where: { id },
    });

    return incident ? this.toRecord(incident) : null;
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

    return this.toRecord(incident);
  }

  async update(id: string, input: UpdateIncidentRequest): Promise<IncidentRecord | null> {
    const existing = await prisma.incident.findUnique({
      where: { id },
    });

    if (!existing) {
      return null;
    }

    const incident = await prisma.incident.update({
      where: { id },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.severity !== undefined ? { severity: input.severity } : {}),
        ...(input.priority !== undefined ? { priority: input.priority } : {}),
        ...(input.startedAt !== undefined
          ? {
              startedAt: input.startedAt === null ? null : new Date(input.startedAt),
            }
          : {}),
      },
    });

    return this.toRecord(incident);
  }

  async updateSeverityPriority(
    id: string,
    input: UpdateIncidentSeverityPriorityRequest,
  ): Promise<IncidentRecord | null> {
    const existing = await prisma.incident.findUnique({
      where: { id },
    });

    if (!existing) {
      return null;
    }

    const incident = await prisma.incident.update({
      where: { id },
      data: {
        ...(input.severity !== undefined ? { severity: input.severity } : {}),
        ...(input.priority !== undefined ? { priority: input.priority } : {}),
      },
    });

    return this.toRecord(incident);
  }
  async updateLifecycle(
    id: string,
    input: UpdateIncidentLifecycleRequest,
  ): Promise<IncidentRecord | null> {
    const existing = await prisma.incident.findUnique({
      where: { id },
    });

    if (!existing) {
      return null;
    }

    const incident = await prisma.incident.update({
      where: { id },
      data: {
        status: input.status,
        ...(input.status === 'RESOLVED' ? { resolvedAt: existing.resolvedAt ?? new Date() } : {}),
        ...(input.status === 'CLOSED'
          ? {
              resolvedAt: existing.resolvedAt ?? new Date(),
              closedAt: existing.closedAt ?? new Date(),
            }
          : {}),
      },
    });

    return this.toRecord(incident);
  }

  async list(query: ListIncidentsQuery): Promise<IncidentListResult> {
    const where = {
      ...(query.status !== undefined ? { status: query.status } : {}),
      ...(query.severity !== undefined ? { severity: query.severity } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.incident.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      }),
      prisma.incident.count({ where }),
    ]);

    return {
      items: items.map((incident) => this.toRecord(incident)),
      total,
    };
  }

  async listAccessibleToUser(
    query: ListIncidentsQuery,
    userId: string,
  ): Promise<IncidentListResult> {
    const where = {
      participants: {
        some: {
          userId,
        },
      },
      ...(query.status !== undefined ? { status: query.status } : {}),
      ...(query.severity !== undefined ? { severity: query.severity } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.incident.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      }),
      prisma.incident.count({ where }),
    ]);

    return {
      items: items.map((incident) => this.toRecord(incident)),
      total,
    };
  }

  private toRecord(incident: {
    id: string;
    title: string;
    description: string | null;
    status: 'IDENTIFIED' | 'INVESTIGATING' | 'RESOLVED' | 'CLOSED';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    priority: number;
    startedAt: Date | null;
    resolvedAt: Date | null;
    closedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): IncidentRecord {
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
