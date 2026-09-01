import { prisma } from '../infrastructure/database';
import type { CreateIncidentRequest, ListIncidentsQuery } from '../contracts/incident';
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

    if (!incident) {
      return null;
    }

    return this.toRecord(incident);
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

  async list(query: ListIncidentsQuery): Promise<IncidentListResult> {
    const where = {
      ...(query.status ? { status: query.status as never } : {}),
      ...(query.severity ? { severity: query.severity } : {}),
    };

    const skip = (query.page - 1) * query.limit;

    const [incidents, total] = await Promise.all([
      prisma.incident.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip,
        take: query.limit,
      }),
      prisma.incident.count({ where }),
    ]);

    return {
      items: incidents.map((incident) => this.toRecord(incident)),
      total,
    };
  }

  private toRecord(incident: {
    id: string;
    title: string;
    description: string | null;
    status: string;
    severity: IncidentRecord['severity'];
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
