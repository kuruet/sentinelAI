export const DETERMINISTIC_SIGNAL_TYPES = [
  'TEMPORAL_BURST',
  'REPEATED_EVENT_TYPE',
  'SOURCE_CONCENTRATION',
  'EVIDENCE_CLUSTER',
  'CORRELATION_DENSITY',
] as const;

export type DeterministicSignalType = (typeof DETERMINISTIC_SIGNAL_TYPES)[number];

export interface DeterministicSignal {
  type: DeterministicSignalType;
  title: string;
  description: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  references: Array<{
    type: 'INCIDENT' | 'EVENT' | 'EVIDENCE' | 'INVESTIGATION';
    id: string;
    reason: string;
  }>;
}
