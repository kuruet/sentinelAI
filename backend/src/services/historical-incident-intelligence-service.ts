import { AppError } from '../errors/app-error';
import type { IncidentDataAccess } from '../data-access/incident-data-access';
import type { IntelligenceContextSnapshot } from '../intelligence';
import type { IncidentAuthorizationService } from './incident-authorization-service';
import type { IntelligenceContextService } from './intelligence-context-service';
import {
  HistoricalIncidentSimilarityService,
  type HistoricalIncidentSimilarityMatch,
} from './historical-incident-similarity-service';

const CANDIDATE_PAGE_SIZE = 100;
const CONTEXT_BATCH_SIZE = 10;

export interface HistoricalIncidentIntelligenceResult {
  currentIncidentId: string;
  matches: HistoricalIncidentSimilarityMatch[];
  candidatesExamined: number;
}

export class HistoricalIncidentIntelligenceService {
  constructor(
    private readonly incidentDataAccess: Pick<
      IncidentDataAccess,
      'listAccessibleToUser'
    >,
    private readonly authorizationService: Pick<
      IncidentAuthorizationService,
      'requireReadAccess'
    >,
    private readonly contextService: Pick<
      IntelligenceContextService,
      'buildContext'
    >,
    private readonly similarityService: HistoricalIncidentSimilarityService,
  ) {}

  async findSimilarIncidents(
    incidentId: string,
    userId: string,
    limit = 5,
  ): Promise<HistoricalIncidentIntelligenceResult> {
    // Authorization must succeed before any incident context is loaded.
    await this.authorizationService.requireReadAccess(incidentId, userId);

    const current = await this.contextService.buildContext(incidentId);

    if (!current) {
      throw new AppError(404, 'NOT_FOUND', 'Incident not found.');
    }

    const candidateIds = await this.getAccessibleCandidateIds(
      incidentId,
      userId,
    );

    const candidateContexts: IntelligenceContextSnapshot[] = [];

    // Load only authorized candidate IDs, in bounded batches.
    for (
      let offset = 0;
      offset < candidateIds.length;
      offset += CONTEXT_BATCH_SIZE
    ) {
      const batch = candidateIds.slice(
        offset,
        offset + CONTEXT_BATCH_SIZE,
      );

      const snapshots = await Promise.all(
        batch.map(async (candidateId) => {
          try {
            await this.authorizationService.requireReadAccess(
              candidateId,
              userId,
            );
          } catch (error) {
            if (
              error instanceof AppError &&
              error.statusCode === 403 &&
              error.code === 'FORBIDDEN'
            ) {
              return null;
            }

            throw error;
          }

          return this.contextService.buildContext(candidateId);
        }),
      );

      for (const snapshot of snapshots) {
        if (snapshot) {
          candidateContexts.push(snapshot);
        }
      }
    }

    return {
      currentIncidentId: incidentId,
      matches: this.similarityService.findSimilar(
        current,
        candidateContexts,
        limit,
      ),
      candidatesExamined: candidateIds.length,
    };
  }

  private async getAccessibleCandidateIds(
    currentIncidentId: string,
    userId: string,
  ): Promise<string[]> {
    const candidateIds: string[] = [];
    let page = 1;
    let total = Number.POSITIVE_INFINITY;

    while ((page - 1) * CANDIDATE_PAGE_SIZE < total) {
      const result = await this.incidentDataAccess.listAccessibleToUser(
        {
          page,
          limit: CANDIDATE_PAGE_SIZE,
        },
        userId,
      );

      total = result.total;

      candidateIds.push(
        ...result.items
          .map((incident) => incident.id)
          .filter((id) => id !== currentIncidentId),
      );

      if (result.items.length < CANDIDATE_PAGE_SIZE) {
        break;
      }

      page++;
    }

    return [...new Set(candidateIds)];
  }
}
