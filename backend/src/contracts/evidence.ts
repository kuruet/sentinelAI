export const EVIDENCE_TYPES = [
  'LOG',
  'METRIC',
  'TRACE',
  'ALERT',
  'DEPLOYMENT',
  'CONFIGURATION',
  'DOCUMENT',
  'MANUAL',
  'OTHER',
] as const;

export type EvidenceType = (typeof EVIDENCE_TYPES)[number];

export interface CreateEvidenceRequest {
  evidenceType: EvidenceType;
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

export interface EvidenceResponse {
  id: string;
  incidentId: string;
  evidenceType: EvidenceType;
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
}

export interface EvidenceListResponse {
  items: EvidenceResponse[];
}
