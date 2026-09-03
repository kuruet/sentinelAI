import type {
  CreateIncidentRequest,
  IncidentSeverity,
  IncidentStatus,
  ListIncidentsQuery,
  UpdateIncidentLifecycleRequest,
  UpdateIncidentSeverityPriorityRequest,
  UpdateIncidentRequest,
} from '../contracts/incident';

export interface IncidentRecord {
  id: string;
  title: string;
  description: string | null;
  status: IncidentStatus;
  severity: IncidentSeverity;
  priority: number;
  startedAt: Date | null;
  resolvedAt: Date | null;
  closedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IncidentListResult {
  items: IncidentRecord[];
  total: number;
}

export interface IncidentDataAccess {
  findById(id: string): Promise<IncidentRecord | null>;
  create(input: CreateIncidentRequest): Promise<IncidentRecord>;
  update(id: string, input: UpdateIncidentRequest): Promise<IncidentRecord | null>;
  updateLifecycle(
    id: string,
    input: UpdateIncidentLifecycleRequest,
  ): Promise<IncidentRecord | null>;
  updateSeverityPriority(
    id: string,
    input: UpdateIncidentSeverityPriorityRequest,
  ): Promise<IncidentRecord | null>;
  list(query: ListIncidentsQuery): Promise<IncidentListResult>;
}
