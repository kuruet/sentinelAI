export type SentinelAIEvidenceType =
  | 'LOG'
  | 'METRIC'
  | 'TRACE'
  | 'ALERT'
  | 'DEPLOYMENT'
  | 'CONFIGURATION'
  | 'DOCUMENT'
  | 'MANUAL'
  | 'OTHER';

export interface SentinelAIEvidence {
  evidenceType: SentinelAIEvidenceType;
  title: string;
  description?: string | null;
  source: string;
  sourceRef?: string | null;
  collectedAt?: string | null;
  occurredAt?: string | null;
  contentHash?: string | null;
  trustLevel?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface SentinelAIEvidenceResponse {
  status: 'ok';
  data: {
    id: string;
    incidentId: string;
    evidenceType: SentinelAIEvidenceType;
    title: string;
    description: string | null;
    source: string;
    sourceRef: string | null;
    collectedAt: string | null;
    occurredAt: string | null;
    contentHash: string | null;
    trustLevel: string | null;
    metadata: Record<string, unknown> | null;
    createdAt: string;
    updatedAt: string;
  };
}

export interface SentinelAIEvidenceClientConfig {
  baseUrl: string;
  token: string;
  incidentId: string;
}

export class SentinelAIEvidenceClient {
  constructor(private readonly config: SentinelAIEvidenceClientConfig) {}

  async createEvidence(evidence: SentinelAIEvidence): Promise<SentinelAIEvidenceResponse> {
    const response = await fetch(
      `${this.config.baseUrl.replace(/\/$/, '')}/api/v1/incidents/${this.config.incidentId}/evidence`,
      {
        method: 'POST',
        headers: {
          authorization: `Bearer ${this.config.token}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify(evidence),
      },
    );

    const body = (await response.json()) as
      SentinelAIEvidenceResponse | { status: 'error'; error?: { message?: string } };

    if (!response.ok) {
      const message =
        body.status === 'error' && body.error?.message
          ? body.error.message
          : `SentinelAI evidence creation failed with HTTP ${response.status}.`;

      throw new Error(message);
    }

    return body as SentinelAIEvidenceResponse;
  }
}
