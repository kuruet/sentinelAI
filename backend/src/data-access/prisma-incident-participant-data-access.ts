import { prisma } from '../infrastructure/database';
import type {
  AddIncidentParticipantRequest,
  IncidentParticipantResponse,
} from '../contracts/participant';
import type { IncidentParticipantDataAccess } from './incident-participant-data-access';

export class PrismaIncidentParticipantDataAccess implements IncidentParticipantDataAccess {
  async findByIncidentAndUser(
    incidentId: string,
    userId: string,
  ): Promise<IncidentParticipantResponse | null> {
    const participant = await prisma.incidentParticipant.findUnique({
      where: {
        incidentId_userId: {
          incidentId,
          userId,
        },
      },
    });

    return participant ? this.toResponse(participant) : null;
  }

  async create(
    incidentId: string,
    input: AddIncidentParticipantRequest,
  ): Promise<IncidentParticipantResponse> {
    const participant = await prisma.incidentParticipant.create({
      data: {
        incidentId,
        userId: input.userId,
        role: input.role,
      },
    });

    return this.toResponse(participant);
  }

  async listByIncident(incidentId: string): Promise<IncidentParticipantResponse[]> {
    const participants = await prisma.incidentParticipant.findMany({
      where: {
        incidentId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return participants.map((participant) => this.toResponse(participant));
  }

  async deleteByIdForIncident(incidentId: string, participantId: string): Promise<boolean> {
    const participant = await prisma.incidentParticipant.findFirst({
      where: {
        id: participantId,
        incidentId,
      },
    });

    if (!participant) {
      return false;
    }

    await prisma.incidentParticipant.delete({
      where: {
        id: participantId,
      },
    });

    return true;
  }

  private toResponse(participant: {
    id: string;
    incidentId: string;
    userId: string;
    role: 'RESPONDER' | 'INCIDENT_COMMANDER' | 'OBSERVER';
    createdAt: Date;
  }): IncidentParticipantResponse {
    return {
      id: participant.id,
      incidentId: participant.incidentId,
      userId: participant.userId,
      role: participant.role,
      createdAt: participant.createdAt.toISOString(),
    };
  }
}
