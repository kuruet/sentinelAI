export interface IncidentRecord {
  id: string;
  title: string;
  description: string | null;
  status: string;
  severity: string;
  priority: number;
  startedAt: Date | null;
  resolvedAt: Date | null;
  closedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IncidentDataAccess {
  findById(id: string): Promise<IncidentRecord | null>;
}
