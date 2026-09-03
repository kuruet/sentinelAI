import { prisma } from '../infrastructure/database';
import type {
  CreateInvestigationRequest,
  InvestigationResponse,
  UpdateInvestigationRequest,
} from '../contracts/investigation';
import type { InvestigationDataAccess } from './investigation-data-access';

export class PrismaInvestigationDataAccess implements InvestigationDataAccess {
  async findByIncidentId(incidentId: string): Promise<InvestigationResponse | null> {
    const investigation = await prisma.investigation.findUnique({
      where: {
        incidentId,
      },
    });

    return investigation ? this.toResponse(investigation) : null;
  }

  async create(
    incidentId: string,
    input: CreateInvestigationRequest,
  ): Promise<InvestigationResponse> {
    const investigation = await prisma.investigation.create({
      data: {
        incidentId,
        summary: input.summary ?? null,
        startedAt: input.startedAt ? new Date(input.startedAt) : null,
        completedAt: input.completedAt ? new Date(input.completedAt) : null,
      },
    });

    return this.toResponse(investigation);
  }

  async update(
    incidentId: string,
    input: UpdateInvestigationRequest,
  ): Promise<InvestigationResponse | null> {
    const existing = await prisma.investigation.findUnique({
      where: {
        incidentId,
      },
    });

    if (!existing) {
      return null;
    }

    const investigation = await prisma.investigation.update({
      where: {
        id: existing.id,
      },
      data: {
        ...(input.summary !== undefined ? { summary: input.summary } : {}),
        ...(input.startedAt !== undefined
          ? {
              startedAt: input.startedAt ? new Date(input.startedAt) : null,
            }
          : {}),
        ...(input.completedAt !== undefined
          ? {
              completedAt: input.completedAt ? new Date(input.completedAt) : null,
            }
          : {}),
      },
    });

    return this.toResponse(investigation);
  }

  async deleteByIncidentId(incidentId: string): Promise<boolean> {
    const existing = await prisma.investigation.findUnique({
      where: {
        incidentId,
      },
      select: {
        id: true,
      },
    });

    if (!existing) {
      return false;
    }

    await prisma.investigation.delete({
      where: {
        id: existing.id,
      },
    });

    return true;
  }

  private toResponse(investigation: {
    id: string;
    incidentId: string;
    summary: string | null;
    startedAt: Date | null;
    completedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): InvestigationResponse {
    return {
      id: investigation.id,
      incidentId: investigation.incidentId,
      summary: investigation.summary,
      startedAt: investigation.startedAt?.toISOString() ?? null,
      completedAt: investigation.completedAt?.toISOString() ?? null,
      createdAt: investigation.createdAt.toISOString(),
      updatedAt: investigation.updatedAt.toISOString(),
    };
  }
}
