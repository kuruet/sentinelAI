import { prisma } from '../infrastructure/database';
import type { InputJsonValue } from '../generated/prisma/internal/prismaNamespace';
import type { CreateEvidenceRequest, EvidenceResponse } from '../contracts/evidence';
import type { EvidenceDataAccess } from './evidence-data-access';

export class PrismaEvidenceDataAccess implements EvidenceDataAccess {
  async findByIdForIncident(
    incidentId: string,
    evidenceId: string,
  ): Promise<EvidenceResponse | null> {
    const evidence = await prisma.evidence.findFirst({
      where: {
        id: evidenceId,
        incidentId,
      },
    });

    return evidence ? this.toResponse(evidence) : null;
  }

  async create(incidentId: string, input: CreateEvidenceRequest): Promise<EvidenceResponse> {
    const evidence = await prisma.evidence.create({
      data: {
        incidentId,
        evidenceType: input.evidenceType,
        title: input.title,
        description: input.description ?? null,
        source: input.source,
        sourceRef: input.sourceRef ?? null,
        collectedAt: input.collectedAt ? new Date(input.collectedAt) : null,
        occurredAt: input.occurredAt ? new Date(input.occurredAt) : null,
        contentHash: input.contentHash ?? null,
        trustLevel: input.trustLevel ?? null,
        ...(input.metadata == null
          ? {}
          : {
              metadata: input.metadata as InputJsonValue,
            }),
      },
    });

    return this.toResponse(evidence);
  }

  async listByIncident(incidentId: string): Promise<EvidenceResponse[]> {
    const evidence = await prisma.evidence.findMany({
      where: {
        incidentId,
      },
      orderBy: [
        {
          occurredAt: 'asc',
        },
        {
          createdAt: 'asc',
        },
      ],
    });

    return evidence.map((item) => this.toResponse(item));
  }

  async deleteByIdForIncident(incidentId: string, evidenceId: string): Promise<boolean> {
    const existing = await prisma.evidence.findFirst({
      where: {
        id: evidenceId,
        incidentId,
      },
      select: {
        id: true,
      },
    });

    if (!existing) {
      return false;
    }

    await prisma.evidence.delete({
      where: {
        id: existing.id,
      },
    });

    return true;
  }

  private toResponse(evidence: {
    id: string;
    incidentId: string;
    evidenceType:
      | 'LOG'
      | 'METRIC'
      | 'TRACE'
      | 'ALERT'
      | 'DEPLOYMENT'
      | 'CONFIGURATION'
      | 'DOCUMENT'
      | 'MANUAL'
      | 'OTHER';
    title: string;
    description: string | null;
    source: string;
    sourceRef: string | null;
    collectedAt: Date | null;
    occurredAt: Date | null;
    contentHash: string | null;
    trustLevel: string | null;
    metadata: unknown;
    createdAt: Date;
    updatedAt: Date;
  }): EvidenceResponse {
    return {
      id: evidence.id,
      incidentId: evidence.incidentId,
      evidenceType: evidence.evidenceType,
      title: evidence.title,
      description: evidence.description,
      source: evidence.source,
      sourceRef: evidence.sourceRef,
      collectedAt: evidence.collectedAt?.toISOString() ?? null,
      occurredAt: evidence.occurredAt?.toISOString() ?? null,
      contentHash: evidence.contentHash,
      trustLevel: evidence.trustLevel,
      metadata:
        evidence.metadata &&
        typeof evidence.metadata === 'object' &&
        !Array.isArray(evidence.metadata)
          ? (evidence.metadata as Record<string, unknown>)
          : null,
      createdAt: evidence.createdAt.toISOString(),
      updatedAt: evidence.updatedAt.toISOString(),
    };
  }
}
