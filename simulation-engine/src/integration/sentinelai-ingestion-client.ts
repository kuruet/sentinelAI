export interface SentinelAISignal {
  source: string;
  signalType:
    'ALERT' | 'LOG' | 'METRIC' | 'DEPLOYMENT' | 'CONFIGURATION_CHANGE' | 'MANUAL' | 'SYSTEM';
  occurredAt: string;
  title: string;
  description?: string | null;
  sourceRef?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface SentinelAIIngestionResponse {
  status: 'ok';
  data: {
    incidentId: string;
    accepted: number;
    events: Array<{
      id: string;
      sequence: number;
      eventType: string;
    }>;
  };
}

export interface SentinelAIIngestionClientConfig {
  baseUrl: string;
  token: string;
  incidentId: string;
}

export class SentinelAIIngestionClient {
  constructor(private readonly config: SentinelAIIngestionClientConfig) {}

  async ingest(signals: SentinelAISignal[]): Promise<SentinelAIIngestionResponse> {
    const response = await fetch(
      `${this.config.baseUrl.replace(/\/$/, '')}/api/v1/ingestion/signals`,
      {
        method: 'POST',
        headers: {
          authorization: `Bearer ${this.config.token}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          incidentId: this.config.incidentId,
          signals,
        }),
      },
    );

    const body = (await response.json()) as
      SentinelAIIngestionResponse | { status: 'error'; error?: { message?: string } };

    if (!response.ok) {
      const message =
        body.status === 'error' && body.error?.message
          ? body.error.message
          : `SentinelAI ingestion failed with HTTP ${response.status}.`;

      throw new Error(message);
    }

    return body as SentinelAIIngestionResponse;
  }
}
