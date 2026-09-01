import { prisma } from '../infrastructure/database';
import type { IncidentDataAccess, IncidentRecord } from './incident-data-access';

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
}
