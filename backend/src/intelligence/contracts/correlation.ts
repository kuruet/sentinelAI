import type { IntelligenceReference } from './evidence-reference';

export const INTELLIGENCE_CORRELATION_TYPES = [
  'TEMPORAL',
  'SHARED_SOURCE',
  'EVENT_EVIDENCE',
] as const;

export type IntelligenceCorrelationType =
  (typeof INTELLIGENCE_CORRELATION_TYPES)[number];

export interface IntelligenceCorrelation {
  id: string;
  type: IntelligenceCorrelationType;
  title: string;
  description: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  references: IntelligenceReference[];
  occurredAt: string | null;
}
