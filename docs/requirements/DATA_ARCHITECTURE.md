# SentinelAI - Data Architecture

## 1. Purpose

This document defines the logical data architecture for SentinelAI based on the approved domain model, functional requirements, non-functional requirements, workflows, and system architecture. It establishes persistence responsibilities, entity storage concepts, relationships, indexing principles, transaction boundaries, audit/history requirements, and data lifecycle considerations.

The document intentionally separates logical data design from implementation-specific database syntax and migration code.

## 2. Data Architecture Goals

The data architecture shall:

1. Persist the core SentinelAI domain entities reliably.
2. Preserve relationships between incidents, events, evidence, investigations, hypotheses, findings, and remediation decisions.
3. Preserve evidence provenance and traceability.
4. Distinguish generated AI information from verified domain information.
5. Support incident and investigation lifecycle history.
6. Support efficient retrieval of incident timelines and investigation evidence.
7. Provide reliable auditability for important user and system actions.
8. Support transactional consistency for critical domain operations.
9. Support asynchronous operation state and execution history.
10. Provide a foundation for future scale without unnecessary database complexity.
11. Protect sensitive operational and integration information.
12. Keep persistence concerns behind the application architecture boundary.

## 3. Persistence Strategy

SentinelAI shall initially use a centralized relational persistence model for transactional application data.

The relational model is appropriate because the core domain contains strongly related entities, lifecycle state, authorization relationships, audit requirements, and transactional workflows.

The initial architecture shall prefer one primary transactional database rather than introducing multiple databases without a demonstrated requirement.

Additional specialized storage may be introduced later only when justified by workload characteristics, such as large-scale event storage, search, object storage, or analytical workloads.

## 4. Logical Data Domains

| Data Domain         | Primary Responsibility                                           |
| ------------------- | ---------------------------------------------------------------- |
| Identity            | Users, roles, permissions, authorization relationships           |
| Incident Management | Incidents, participants, lifecycle state                         |
| System Context      | Services, components, dependencies                               |
| Event Management    | Events, event metadata, incident associations                    |
| Evidence Management | Evidence, provenance, evidence relationships                     |
| Investigation       | Investigations, findings, hypotheses, validation                 |
| AI Analysis         | AI execution records, model/provider metadata, generated outputs |
| Remediation         | Recommendations, decisions, outcomes                             |
| Reporting           | Incident reports and report metadata                             |
| Simulation          | Scenarios, executions, execution metadata                        |
| Integration         | External-system configurations and integration state             |
| Audit               | Important user and system actions                                |
| Operations          | Background operations, jobs, execution state where required      |

## 5. Core Persistence Entities

### 5.1 User

Stores the identity representation required by SentinelAI.

**Persistence concepts:**

- User identifier
- External identity reference where applicable
- Display information
- Account status
- Created timestamp
- Updated timestamp

Sensitive authentication credentials should not be stored in the application database unless explicitly required by the selected authentication architecture.

### 5.2 Role

Stores authorization roles.

**Persistence concepts:**

- Role identifier
- Role name
- Description
- Status
- Created timestamp
- Updated timestamp

### 5.3 User Role Assignment

Represents the many-to-many relationship between users and roles.

The assignment should be independently traceable where authorization or audit requirements require it.

### 5.4 Incident

Stores the primary incident record.

**Persistence concepts:**

- Incident identifier
- Title
- Description
- Severity
- Priority
- Lifecycle state
- Detection timestamp
- Start timestamp
- Resolution timestamp
- Closed timestamp where applicable
- Created timestamp
- Updated timestamp

The incident is a central aggregate for incident-management workflows.

### 5.5 Incident Participant

Stores user participation and responsibility assignments associated with incidents.

**Persistence concepts:**

- Incident reference
- User reference
- Participation role
- Assignment timestamp
- Removal timestamp where applicable

### 5.6 Service

Stores operational services and components relevant to system context.

**Persistence concepts:**

- Service identifier
- Name
- Type
- Environment
- Owner reference where applicable
- Status
- Metadata
- Created timestamp
- Updated timestamp

### 5.7 Service Dependency

Stores directed dependency relationships between services or components.

**Persistence concepts:**

- Source service reference
- Target service reference
- Dependency type
- Direction
- Metadata
- Created timestamp

Duplicate dependency relationships should be prevented according to the selected uniqueness rules.

### 5.8 Event

Stores timestamped occurrences relevant to system investigation.

**Persistence concepts:**

- Event identifier
- Event type
- Source
- Source identifier where available
- Service reference where applicable
- Event timestamp
- Severity
- Normalized payload
- Metadata
- Created timestamp

External event identifiers should be retained where they are useful for correlation and deduplication.

### 5.9 Incident Event Association

Represents the association between an incident and relevant events.

This association allows an event to remain independently identifiable while being linked to one or more investigation contexts when appropriate.

### 5.10 Evidence

Stores evidence used during incident investigation.

**Persistence concepts:**

- Evidence identifier
- Evidence type
- Source
- Source identifier
- Content reference
- Summary or normalized representation
- Event timestamp or time range
- Collection timestamp
- Relevance metadata
- Created timestamp

Evidence content should be stored according to its size, sensitivity, retention requirements, and access pattern.

Large binary or document content should not automatically be embedded in the transactional database when object storage is more appropriate.

### 5.11 Evidence Provenance

Stores origin and traceability information for evidence.

**Persistence concepts:**

- Evidence reference
- Source system
- Source identifier
- Collection method
- Original timestamp
- Collection timestamp
- Integrity metadata where applicable

Provenance is a first-class requirement rather than optional descriptive metadata.

### 5.12 Investigation

Stores an investigation associated with an incident.

**Persistence concepts:**

- Investigation identifier
- Incident reference
- Status
- Started timestamp
- Completed timestamp
- Created timestamp
- Updated timestamp

### 5.13 Investigation Finding

Stores findings produced during investigation.

**Persistence concepts:**

- Finding identifier
- Investigation reference
- Type
- Description
- Source type
- Author reference where applicable
- Confidence where applicable
- Validation status
- Created timestamp
- Updated timestamp

### 5.14 Root-Cause Hypothesis

Stores candidate explanations for an incident.

**Persistence concepts:**

- Hypothesis identifier
- Investigation reference
- Description
- Confidence
- Source
- Validation state
- Created timestamp
- Updated timestamp

Supporting and contradicting evidence shall be represented through explicit relationships rather than relying only on free-text descriptions.

### 5.15 Hypothesis Evidence Association

Represents the relationship between a hypothesis and supporting or contradicting evidence.

**Persistence concepts:**

- Hypothesis reference
- Evidence reference
- Relationship type
- Association metadata
- Created timestamp

### 5.16 AI Analysis

Stores an execution record for AI-assisted analysis.

**Persistence concepts:**

- Analysis identifier
- Investigation reference
- Provider reference
- Model reference
- Request/context reference
- Execution status
- Started timestamp
- Completed timestamp
- Error information where applicable
- Created timestamp

AI execution records should remain distinguishable from their generated conclusions.

### 5.17 AI Analysis Output

Stores validated or retained AI-generated output associated with an AI analysis execution.

The persistence representation should preserve enough information to establish which analysis generated the output and what validation state the output reached.

Raw provider responses should only be retained when justified by debugging, audit, evaluation, or reproducibility requirements and should be subject to appropriate security and retention controls.

### 5.18 Remediation Recommendation

Stores advisory remediation guidance.

**Persistence concepts:**

- Recommendation identifier
- Incident/investigation reference
- Description
- Rationale
- Risk information
- Source
- Status
- Created timestamp

### 5.19 Remediation Decision

Stores the human decision associated with remediation.

**Persistence concepts:**

- Decision identifier
- Incident reference
- Selected action
- Decision maker
- Decision timestamp
- Context
- Outcome

The decision record must preserve attribution to the responsible actor.

### 5.20 Incident Report

Stores generated or authored incident reports.

**Persistence concepts:**

- Report identifier
- Incident reference
- Report type
- Content or structured report reference
- Author/generator
- Generated timestamp
- Version information where applicable

Reports should be versionable when regenerated content must remain historically traceable.

### 5.21 Simulation Scenario

Stores controlled failure scenarios.

**Persistence concepts:**

- Scenario identifier
- Name
- Description
- Failure type
- Parameters
- Safety constraints
- Target environment
- Enabled state
- Created timestamp
- Updated timestamp

Simulation parameters must be subject to validation and authorization before execution.

### 5.22 Simulation Execution

Stores each execution of a simulation scenario.

**Persistence concepts:**

- Execution identifier
- Scenario reference
- Initiating actor
- Environment
- Status
- Start timestamp
- End timestamp
- Configuration snapshot
- Cleanup status
- Error information where applicable

Execution records should remain immutable with respect to important historical facts after completion except for explicitly permitted metadata corrections.

### 5.23 Integration

Stores configured external-system integrations.

**Persistence concepts:**

- Integration identifier
- Provider
- Integration type
- Status
- Configuration reference
- Last successful interaction
- Last error information
- Created timestamp
- Updated timestamp

Secrets and credentials must not be stored as ordinary plaintext application data.

### 5.24 Audit Record

Stores important user and system actions.

**Persistence concepts:**

- Audit identifier
- Actor type
- Actor reference where applicable
- Action
- Resource type
- Resource reference
- Timestamp
- Result
- Correlation identifier
- Metadata

Audit records should be append-oriented and protected from ordinary modification.

### 5.25 Background Operation

Stores state for asynchronous operations where durable operation tracking is required.

**Persistence concepts:**

- Operation identifier
- Operation type
- Requested by
- Status
- Created timestamp
- Started timestamp
- Completed timestamp
- Failure information
- Result reference where applicable

## 6. Logical Relationship Model

```text
User ----< UserRole >---- Role
 |
 +----< IncidentParticipant >---- Incident
                                  |
             +--------------------+----------------------+
             |                    |                      |
             v                    v                      v
          Events              Evidence               Services
             |                    |                      |
             |                    |                      v
             |                    |                 Dependencies
             |                    |
             +----------+---------+
                        |
                        v
                  Investigation
                   /    |     \\
                  /     |      \\
                 v      v       v
            Findings  AI Analysis  Hypotheses
                                  |
                                  v
                             Evidence Links
                                  |
                                  v
                         Remediation Guidance
                                  |
                                  v
                          Human Decision
                                  |
                                  v
                               Report

Simulation Scenario ----< Simulation Execution ----> Events
                                      |
                                      v
                                   Incident

Integration ----> Events / Evidence

All important domain actions ----> Audit Records
```

## 7. Aggregate and Ownership Strategy

The following entities are treated as major transactional aggregates:

| Aggregate            | Primary Owner       |
| -------------------- | ------------------- |
| Incident             | Incident Management |
| Investigation        | Investigation       |
| Service Context      | System Context      |
| Evidence             | Evidence Management |
| AI Analysis          | AI Analysis         |
| Simulation Execution | Simulation          |
| Remediation Decision | Remediation         |
| Incident Report      | Reporting           |

Aggregates define transactional ownership boundaries rather than requiring every related record to be stored in the same physical table.

Cross-aggregate workflows should use explicit application-level coordination rather than unrestricted direct mutation.

## 8. Transaction Boundaries

Transactions should be used where multiple persistence changes must succeed or fail together.

Examples include:

1. Creating an incident together with required initial metadata.
2. Assigning an incident participant together with the corresponding assignment record.
3. Creating an investigation and its initial state.
4. Recording a validated finding together with required evidence associations.
5. Recording a human remediation decision and its audit record.
6. Recording a simulation execution state transition and its audit information.

Long-running operations such as AI analysis and simulation execution should not hold database transactions open for their entire execution lifecycle.

## 9. Indexing Principles

Indexes should be designed around actual access patterns rather than added indiscriminately.

Initial indexing priorities include:

- Incident identifier.
- Incident lifecycle state.
- Incident severity and priority where list filtering requires them.
- Incident creation and detection timestamps.
- Incident participant relationships.
- Event timestamps.
- Event source and source identifiers where correlation requires them.
- Event-to-incident relationships.
- Evidence-to-incident relationships.
- Evidence timestamps/time ranges.
- Investigation-to-incident relationships.
- Hypothesis-to-investigation relationships.
- Hypothesis-to-evidence relationships.
- AI analysis-to-investigation relationships.
- Simulation execution-to-scenario relationships.
- Audit timestamps.
- Audit actor/resource references where operational queries require them.

Composite indexes should be introduced for common query combinations such as incident timeline retrieval and filtered event retrieval.

## 10. Uniqueness and Referential Integrity

The persistence layer shall enforce appropriate uniqueness and referential-integrity rules.

Examples include:

1. Primary identifiers must be unique.
2. User and role identifiers must be unique within their defined scope.
3. External event identifiers should be unique within an appropriate provider/source scope when supported.
4. Duplicate service dependency relationships should be prevented where semantically identical.
5. Association records must reference valid parent entities.
6. Simulation executions must reference valid simulation scenarios.
7. Hypothesis evidence links must reference valid hypotheses and evidence.

Database-level constraints should complement application-level validation rather than replace it.

## 11. Historical Data and Auditability

SentinelAI must preserve important historical investigation information.

Lifecycle transitions should record enough information to determine:

- Previous state.
- New state.
- Actor.
- Timestamp.
- Relevant reason or metadata where required.

Important changes to incidents, investigations, hypotheses, remediation decisions, simulation executions, and authorization-sensitive resources should be auditable.

Historical records should not be silently overwritten when doing so would destroy required investigation traceability.

## 12. Data Retention

Retention policies shall be defined according to data category and operational requirements.

Conceptually:

| Data Category           | Retention Consideration                                                    |
| ----------------------- | -------------------------------------------------------------------------- |
| Incident records        | Long-lived operational history                                             |
| Investigation findings  | Long-lived for reliability learning                                        |
| Evidence                | Based on source, sensitivity, storage cost, and investigation requirements |
| AI analysis records     | Based on evaluation, audit, privacy, and operational requirements          |
| Raw AI responses        | Minimize unless explicitly required                                        |
| Simulation executions   | Retain sufficient history for reproducibility and evaluation               |
| Audit records           | Long-lived according to security and compliance requirements               |
| Operational job records | Shorter retention where historical storage is unnecessary                  |

Exact retention periods are deferred until security, compliance, and operational requirements are finalized.

## 13. Data Lifecycle

```text
Created
  |
  v
Active / In Use
  |
  +--------------------+
  |                    |
  v                    v
Updated             Archived
                       |
                       v
                    Retained
                       |
                       v
                  Expired / Purged
```

Deletion or purging must respect legal, security, audit, and investigation-retention requirements.

## 14. Sensitive Data Handling

Potentially sensitive data includes:

- Integration credentials.
- Authentication-related information.
- Incident operational details.
- Internal infrastructure information.
- Logs and evidence containing sensitive payloads.
- AI prompts and generated responses.
- Simulation configuration.
- Audit metadata.

The data architecture shall follow these principles:

1. Store only necessary data.
2. Separate secrets from ordinary domain records.
3. Apply access control to sensitive records.
4. Avoid storing sensitive AI prompts/responses unnecessarily.
5. Support encryption at rest through the selected infrastructure.
6. Support encrypted transport between application and persistence infrastructure.
7. Provide auditable access to sensitive operational information.

## 15. Consistency Model

Core transactional domain state should use strong consistency within the primary relational persistence boundary.

Asynchronous processing may introduce temporary eventual consistency for:

- AI analysis results.
- External integration ingestion.
- Background processing status.
- Report generation.
- Simulation event ingestion.

The user interface shall expose operation state clearly where results are not immediately available.

## 16. Concurrency and Idempotency

The data architecture shall support safe handling of repeated or concurrent operations.

Important operations should define idempotency behavior where duplicate requests are possible.

Examples include:

- External event ingestion.
- Background job creation.
- AI analysis requests.
- Simulation execution requests.
- Report generation.

Concurrency-sensitive state transitions should use appropriate optimistic or pessimistic controls based on the operation.

## 17. Backup and Recovery Considerations

The primary transactional database shall be treated as critical application state.

The production data strategy should support:

- Automated backups.
- Point-in-time recovery where supported.
- Backup integrity verification.
- Recovery procedures.
- Appropriate recovery-point objectives.
- Appropriate recovery-time objectives.

Exact backup technology and RPO/RTO values are deferred to infrastructure and operational design.

## 18. Data Migration Strategy

Database schema changes shall be managed through version-controlled migrations.

Migrations should be:

- Reproducible.
- Reviewable.
- Ordered.
- Safe to apply consistently across environments.
- Tested before production use.

Destructive migrations should require explicit review and appropriate backup/recovery planning.

## 19. Data Access Rules

1. Frontend clients shall never access the database directly.
2. Domain modules shall access persistence through defined application/repository boundaries.
3. External integrations shall not directly manipulate core tables.
4. AI providers shall not receive unrestricted database access.
5. The simulation engine shall not receive unrestricted database access.
6. Cross-domain writes shall be coordinated through application services.
7. Sensitive records shall be accessible only to authorized operations.

## 20. Deferred Physical Decisions

The following implementation-specific decisions remain subject to subsequent design and implementation work:

- Exact relational database product and version.
- ORM or query-builder selection.
- Exact table/column naming conventions.
- Migration framework.
- Connection pooling configuration.
- Read-replica strategy.
- Object-storage provider.
- Search/indexing infrastructure.
- Event-streaming infrastructure.
- Backup provider and infrastructure topology.
- Exact encryption/key-management implementation.

These decisions shall be evaluated against the requirements and logical data architecture defined here.

## 21. Data Architecture Principles

1. Relational first for transactional domain state.
2. Strong referential integrity.
3. Evidence provenance by design.
4. Auditability by design.
5. Explicit aggregate ownership.
6. Transactional consistency for critical operations.
7. Idempotent processing where appropriate.
8. Secure handling of sensitive data.
9. Minimal unnecessary retention.
10. Access patterns drive indexes.
11. Migrations are version controlled.
12. Specialized storage is introduced only when justified.

## 22. Scope

This document establishes the logical data architecture for SentinelAI. It defines persistence responsibilities, logical entities, relationships, transaction boundaries, indexing principles, historical-data requirements, retention concepts, sensitive-data handling, and data-access boundaries. Physical database technology, exact schema syntax, migrations, and infrastructure implementation will be finalized during subsequent design and implementation work.
