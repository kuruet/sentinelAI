# SentinelAI - System Architecture & Component Boundaries

## 1. Purpose

This document defines the system-level architecture and component boundaries for SentinelAI.

It translates the Phase 1 requirements baseline into an implementable architectural structure.

The architecture shall provide clear boundaries between:

- Frontend presentation.
- API transport.
- Application services.
- Domain modules.
- Persistence.
- Background processing.
- AI integration.
- External integrations.
- Simulation execution.
- Observability.
- Audit.

The architecture shall preserve the requirements, security constraints, technology decisions, and quality attributes already established during Phase 1.

This document defines architecture rather than implementation code.

---

## 2. Architectural Goals

The SentinelAI architecture shall:

1. Preserve clear ownership of domain state.
2. Separate presentation from business logic.
3. Separate business logic from infrastructure.
4. Isolate external providers.
5. Isolate AI-provider dependencies.
6. Isolate simulation execution.
7. Support asynchronous long-running operations.
8. Preserve observability.
9. Preserve auditability.
10. Support automated testing.
11. Permit incremental scaling.
12. Avoid premature microservice decomposition.
13. Keep security controls at appropriate boundaries.
14. Maintain stable API contracts.
15. Support future integration expansion.

---

## 3. Selected Architecture Style

SentinelAI shall initially use a **modular monolith**.

The backend shall be deployed as a coherent application while maintaining explicit internal module boundaries.

The architecture shall therefore distinguish:

- Domain boundaries.
- Application-service boundaries.
- Infrastructure boundaries.
- External integration boundaries.

The fact that modules share one deployment unit shall not imply unrestricted dependency access.

---

## 4. High-Level System Architecture

The target architecture is:

    +-------------------------------------------------------+
    |                    SentinelAI Client                  |
    |                                                       |
    |                 React + Vite Frontend                 |
    +---------------------------+---------------------------+
                                |
                                | HTTPS
                                v
    +-------------------------------------------------------+
    |                    API Boundary                       |
    |                                                       |
    |                 Fastify / TypeScript                  |
    |                     /api/v1                            |
    +---------------------------+---------------------------+
                                |
                                v
    +-------------------------------------------------------+
    |                 Application Layer                     |
    |                                                       |
    | Incident Services                                     |
    | Investigation Services                                |
    | Evidence Services                                     |
    | Timeline Services                                     |
    | AI Analysis Services                                  |
    | Simulation Services                                   |
    | Reporting Services                                    |
    | Integration Services                                  |
    | Operation Services                                    |
    +---------------------------+---------------------------+
                                |
                                v
    +-------------------------------------------------------+
    |                    Domain Layer                       |
    |                                                       |
    | Incidents | Investigations | Evidence | Timeline      |
    | Services | Hypotheses | Findings | Simulation         |
    | Recommendations | Operations | Audit                 |
    +---------------------------+---------------------------+
                                |
               +----------------+----------------+
               |                                 |
               v                                 v
    +----------------------+          +----------------------+
    | Persistence Layer    |          | Integration Boundary |
    |                      |          |                      |
    | Prisma               |          | AI Adapter           |
    | PostgreSQL           |          | External Adapters    |
    +----------------------+          | Simulation Adapter   |
                                      +----------+-----------+
                                                 |
                                  +--------------+--------------+
                                  |              |              |
                                  v              v              v
                               OpenAI      External Systems   Simulation
                                                               Engine

    Background processing:

    Application Services
           |
           v
        BullMQ
           |
           v
         Redis
           |
           v
        Workers
           |
           +----> AI Analysis
           +----> Reports
           +----> Simulation
           +----> Evidence Processing
           +----> External Ingestion

---

# 5. Architectural Layers

SentinelAI shall use the following conceptual layers:

1. Presentation Layer.
2. API / Transport Layer.
3. Application Layer.
4. Domain Layer.
5. Persistence Layer.
6. Infrastructure Layer.
7. Integration Layer.
8. Background Processing Layer.

These layers exist to control dependency direction and responsibility.

---

# 6. Presentation Layer

## Responsibility

The presentation layer is responsible for user interaction.

It includes:

- Incident views.
- Investigation views.
- Evidence views.
- Timeline views.
- AI analysis views.
- Simulation views.
- Reports.
- Operational dashboards.

## Technology

React and Vite.

## Responsibilities

The frontend shall:

- Render application state.
- Collect user input.
- Display API responses.
- Display operation progress.
- Subscribe to authorized real-time updates.
- Handle user navigation.
- Provide client-side validation where useful.

## Restrictions

The frontend shall not:

- Access PostgreSQL directly.
- Access Redis directly.
- Access Prisma directly.
- Contain authoritative business rules.
- Store provider secrets.
- Directly call privileged simulation infrastructure.
- Directly call AI providers using server credentials.

---

# 7. API / Transport Layer

## Responsibility

The API layer exposes the stable application boundary.

Technology:

- Fastify.
- TypeScript.
- Versioned HTTP API.

Base path:

    /api/v1

## Responsibilities

The API layer shall:

- Receive HTTP requests.
- Authenticate requests.
- Authorize access.
- Validate inputs.
- Invoke application services.
- Map application results to API responses.
- Map errors to stable API errors.
- Expose asynchronous operation status.
- Provide real-time event streams where appropriate.

## Restrictions

The API layer shall not:

- Contain large business workflows.
- Access the database arbitrarily.
- Implement provider-specific logic.
- Execute unrestricted simulation commands.
- Treat ORM models as public contracts.

---

# 8. Application Layer

## Responsibility

The application layer coordinates use cases.

It shall translate API requests into controlled application operations.

Examples:

- Create incident.
- Assign incident responder.
- Start investigation.
- Associate evidence.
- Request AI analysis.
- Generate report.
- Start simulation.
- Process external event.
- Retrieve operation status.

## Application Services

Potential services include:

    IncidentApplicationService
    InvestigationApplicationService
    EvidenceApplicationService
    TimelineApplicationService
    AIAnalysisApplicationService
    SimulationApplicationService
    ReportingApplicationService
    IntegrationApplicationService
    OperationApplicationService

The final class/module names may evolve during implementation.

---

# 9. Domain Layer

## Responsibility

The domain layer owns SentinelAI business concepts and invariants.

Potential domain modules include:

    incidents/
    investigations/
    evidence/
    timeline/
    services/
    hypotheses/
    findings/
    recommendations/
    simulations/
    integrations/
    operations/
    audit/

## Domain Responsibilities

The domain layer shall define:

- Domain entities.
- Value concepts.
- Lifecycle states.
- Domain rules.
- Valid transitions.
- Important invariants.
- Domain-level decisions.

## Restrictions

The domain layer should not depend directly on:

- Fastify.
- HTTP request objects.
- React.
- Redis.
- BullMQ.
- OpenAI SDK.
- External provider SDKs.

---

# 10. Incident Module

## Responsibility

The incident module owns incident lifecycle behavior.

It shall manage concepts such as:

- Incident.
- Incident participant.
- Incident status.
- Severity.
- Priority.
- Incident metadata.

## Responsibilities

Examples:

- Create incident.
- Update incident.
- Assign participants.
- Change lifecycle state.
- Resolve incident.
- Reopen incident.
- Close incident.

## Dependencies

The incident module may reference related domain concepts through explicit interfaces or application workflows.

It shall not directly manipulate unrelated infrastructure.

---

# 11. Investigation Module

## Responsibility

The investigation module owns investigation lifecycle and investigative state.

It shall manage:

- Investigation.
- Investigation status.
- Investigation context.
- Investigation notes.
- Investigation decisions.

It shall coordinate with:

- Evidence.
- Timeline.
- Hypotheses.
- Findings.
- AI analysis.

---

# 12. Evidence Module

## Responsibility

The evidence module manages evidence metadata, provenance, association, and processing state.

It shall support:

- Evidence ingestion.
- Evidence association.
- Evidence retrieval.
- Provenance.
- Normalization status.
- Processing status.

The module shall distinguish original evidence from derived interpretations.

---

# 13. Timeline Module

## Responsibility

The timeline module provides chronological incident and investigation context.

It shall manage:

- Events.
- Event timestamps.
- Ordering.
- Event relationships.
- Timeline reconstruction.

The timeline shall preserve source timestamps where available.

---

# 14. Service and Dependency Module

## Responsibility

This module manages operational service context.

It shall represent:

- Services.
- Components.
- Dependencies.
- Affected relationships.

This context supports investigation and impact analysis.

---

# 15. AI Analysis Module

## Responsibility

The AI analysis module coordinates AI-assisted reasoning.

It shall:

- Prepare authorized analysis context.
- Request AI analysis.
- Track analysis operations.
- Validate AI output.
- Store analysis provenance.
- Produce candidate hypotheses or recommendations.
- Preserve distinction between AI output and validated findings.

## Provider Boundary

The domain shall not directly depend on OpenAI.

The architecture shall use:

    AI Application Service
             |
             v
    AI Provider Interface
             |
             v
       OpenAI Adapter
             |
             v
         OpenAI API

This allows future provider substitution.

---

# 16. Simulation Module

## Responsibility

The simulation module coordinates controlled failure simulation.

It shall manage:

- Simulation scenarios.
- Target validation.
- Authorization.
- Execution state.
- Cancellation.
- Results.
- Generated signals.

## Safety Boundary

The simulation module shall not expose unrestricted execution.

The execution flow shall be:

    API Request
        |
        v
    Authentication
        |
        v
    Authorization
        |
        v
    Scenario Validation
        |
        v
    Target Validation
        |
        v
    Parameter Validation
        |
        v
    Simulation Adapter
        |
        v
    Controlled Simulation Engine

---

# 17. Integration Module

## Responsibility

The integration module isolates external systems.

Potential integration categories include:

- Monitoring systems.
- Incident-management systems.
- Alerting systems.
- Event sources.
- Logging systems.
- Other operational tools.

## Adapter Model

    Internal Integration Interface
                |
        +-------+-------+
        |       |       |
        v       v       v
      Adapter Adapter Adapter
        A       B       C
        |       |       |
        v       v       v
    External External External
     System    System    System

External payloads shall be normalized before entering the core domain.

---

# 18. Operation Module

## Responsibility

The operation module tracks long-running asynchronous work.

An operation may represent:

- AI analysis.
- Report generation.
- Simulation.
- Evidence processing.
- External ingestion.

An operation should expose state such as:

- Pending.
- Running.
- Completed.
- Failed.
- Cancelled.

The exact state vocabulary shall follow the previously defined lifecycle requirements.

---

# 19. Background Processing Architecture

Long-running operations shall use background processing.

Conceptually:

    API
     |
     v
    Application Service
     |
     v
    Create Operation
     |
     v
    Queue Job
     |
     v
    BullMQ
     |
     v
    Redis
     |
     v
    Worker
     |
     +----> AI Provider
     |
     +----> Simulation Engine
     |
     +----> Report Generator
     |
     +----> Integration Processing
     |
     v
    Persist Result
     |
     v
    Update Operation

The HTTP request shall not remain open while long-running work executes.

---

# 20. Worker Architecture

Workers shall process bounded job categories.

Potential workers include:

    AIAnalysisWorker
    ReportWorker
    SimulationWorker
    EvidenceProcessingWorker
    IntegrationWorker

Workers shall:

- Validate job inputs.
- Execute controlled application services.
- Handle retries.
- Record failures.
- Update operation state.
- Emit observability telemetry.

Workers shall not bypass domain rules.

---

# 21. Persistence Architecture

PostgreSQL shall be the authoritative source of durable domain state.

Prisma shall provide the primary database access mechanism.

Conceptually:

    Domain / Application
            |
            v
       Repository / Data
       Access Boundary
            |
            v
          Prisma
            |
            v
       PostgreSQL

Database access shall remain inside the persistence boundary.

---

# 22. Repository Boundary

Where repository abstractions are useful, application or domain-facing interfaces shall remain independent of Prisma-specific implementation details.

Conceptually:

    Application
        |
        v
    Repository Interface
        |
        v
    Prisma Repository
        |
        v
    PostgreSQL

The exact use of repository interfaces shall be determined by implementation complexity.

The architecture shall avoid abstraction for abstraction's sake.

---

# 23. Database Ownership

The database shall contain authoritative representations for durable domain state.

Likely persistence areas include:

- Users.
- Roles.
- Permissions.
- Incidents.
- Incident participants.
- Services.
- Components.
- Dependencies.
- Events.
- Evidence.
- Investigations.
- Hypotheses.
- Findings.
- AI analyses.
- Recommendations.
- Remediation decisions.
- Simulation scenarios.
- Simulation executions.
- Integrations.
- Operations.
- Audit records.
- Reports.

The exact schema shall be defined in the database-design phase.

---

# 24. Redis Boundary

Redis shall be used for transient infrastructure needs.

Potential uses:

- BullMQ queue storage.
- Short-lived job coordination.
- Transient locks where justified.
- Optional short-lived caching.

Redis shall not become authoritative for:

- Incidents.
- Investigations.
- Evidence.
- Findings.
- Audit records.
- Other durable domain state.

---

# 25. API-to-Domain Request Flow

A normal synchronous request shall follow:

    Client
      |
      v
    HTTP Request
      |
      v
    Fastify Route
      |
      v
    Authentication
      |
      v
    Authorization
      |
      v
    Validation
      |
      v
    Application Service
      |
      v
    Domain Logic
      |
      v
    Persistence
      |
      v
    Response Mapping
      |
      v
    HTTP Response

Each layer shall have a clearly defined responsibility.

---

# 26. Asynchronous Request Flow

A long-running operation shall follow:

    Client
      |
      v
    POST /operation
      |
      v
    API
      |
      v
    Application Service
      |
      v
    Create Operation
      |
      v
    Queue Job
      |
      v
    202 Accepted
      |
      v
    Client receives operationId

Later:

    Worker
      |
      v
    Process Job
      |
      v
    Update Domain State
      |
      v
    Update Operation
      |
      v
    Publish Event

The client may retrieve operation state or receive authorized real-time updates.

---

# 27. Real-Time Update Architecture

Server-Sent Events shall be used where server-to-client updates materially improve the user experience.

Conceptually:

    Worker / Application
            |
            v
       Domain Event
            |
            v
       Event Publisher
            |
            v
         SSE Layer
            |
            v
          Client

The SSE layer shall:

- Authenticate subscriptions.
- Authorize resource visibility.
- Avoid cross-user event leakage.
- Support reconnection.
- Use stable event identifiers where appropriate.

---

# 28. AI Analysis Flow

The AI workflow shall be:

    User
      |
      v
    API
      |
      v
    Authorization
      |
      v
    Investigation Context
      |
      v
    AI Application Service
      |
      v
    Context Minimization
      |
      v
    AI Provider Interface
      |
      v
    OpenAI Adapter
      |
      v
    OpenAI
      |
      v
    Response Validation
      |
      v
    AI Analysis Record
      |
      v
    Candidate Hypothesis / Recommendation
      |
      v
    Human / Application Validation
      |
      v
    Finding / Decision

AI output shall not automatically become authoritative domain truth.

---

# 29. Simulation Flow

The simulation workflow shall be:

    User
      |
      v
    API
      |
      v
    Authorization
      |
      v
    Scenario Validation
      |
      v
    Target Validation
      |
      v
    Create Simulation Operation
      |
      v
    Queue
      |
      v
    Simulation Worker
      |
      v
    Simulation Adapter
      |
      v
    Controlled Simulation Engine
      |
      v
    Results / Signals
      |
      v
    Persist Execution State
      |
      v
    Associate Generated Evidence / Incident
      |
      v
    Investigation

Every execution shall remain observable and auditable.

---

# 30. External Integration Flow

External data shall follow:

    External System
          |
          v
    Adapter / Webhook
          |
          v
    Authentication / Verification
          |
          v
    Payload Validation
          |
          v
    Normalization
          |
          v
    Internal Event / Evidence
          |
          v
    Application Service
          |
          v
    Domain
          |
          v
    PostgreSQL

External payload formats shall not become core domain contracts.

---

# 31. Security Boundaries

Security controls shall exist at:

1. Client-to-API boundary.
2. API-to-application boundary.
3. Application-to-domain boundary.
4. Application-to-persistence boundary.
5. Application-to-external-provider boundary.
6. Application-to-AI-provider boundary.
7. Application-to-simulation boundary.
8. Observability boundary.
9. Audit-data boundary.

Security shall use:

- Authentication.
- Authorization.
- Validation.
- Least privilege.
- Secret management.
- Rate limiting.
- Auditability.
- Data minimization.

---

# 32. Domain Dependency Rules

The following dependency direction shall be enforced:

    Presentation
        |
        v
    API
        |
        v
    Application
        |
        v
    Domain
        |
        v
    Infrastructure Interfaces
        |
        v
    Infrastructure Implementations

Infrastructure may depend on domain/application contracts where necessary.

The domain shall not depend on concrete infrastructure implementations.

---

# 33. Integration Dependency Rules

External integrations shall follow:

    Domain
       ^
       |
    Application
       |
       v
    Integration Interface
       |
       v
    Adapter
       |
       v
    External Provider

Provider-specific code shall remain isolated.

---

# 34. AI Dependency Rules

AI integration shall follow:

    Domain
       ^
       |
    Application
       |
       v
    AI Provider Interface
       |
       v
    Provider Adapter
       |
       v
    External AI Provider

The domain shall not import provider SDKs.

---

# 35. Simulation Dependency Rules

Simulation shall follow:

    Domain
       ^
       |
    Application
       |
       v
    Simulation Interface
       |
       v
    Safety-Controlled Adapter
       |
       v
    Simulation Engine

The public API shall never bypass the simulation safety boundary.

---

# 36. Observability Architecture

Observability shall cross the major application boundaries.

The architecture shall support:

- Structured logs.
- Metrics.
- Distributed traces.
- Audit records.

Correlation information should include, where appropriate:

- Correlation ID.
- Trace ID.
- Operation ID.
- Incident ID.
- Investigation ID.
- Simulation execution ID.
- Analysis ID.

Sensitive payloads shall not be copied unnecessarily into telemetry.

---

# 37. Audit Architecture

Audit records shall be generated for important actions.

Conceptually:

    Important Action
          |
          +----> Domain Change
          |
          +----> Application Log
          |
          +----> Audit Record
          |
          +----> Trace / Metrics

Audit records shall remain separate from ordinary diagnostic logs.

Audit storage shall be protected against unauthorized modification.

---

# 38. Error Handling Architecture

Errors shall be handled at appropriate boundaries.

Conceptually:

    Infrastructure Error
           |
           v
    Infrastructure Boundary
           |
           v
    Application Error
           |
           v
    API Error Mapping
           |
           v
    Stable HTTP Error Response

The API shall not expose:

- Stack traces.
- Database internals.
- Provider secrets.
- Internal infrastructure details.

---

# 39. Transaction Boundaries

Transactions shall be used where multiple persistent changes must remain consistent.

Examples include:

- Incident state changes.
- Evidence association.
- Investigation state changes.
- Finding creation.
- Important audit-linked mutations.

Transaction scope shall remain controlled.

Long-running external operations shall not hold database transactions open unnecessarily.

---

# 40. External Side-Effect Boundaries

External side effects shall be separated from database transactions where practical.

A conceptual pattern is:

    Validate
       |
       v
    Persist Intent
       |
       v
    Commit
       |
       v
    Perform External Operation
       |
       v
    Persist Result

The exact implementation may use job queues or other coordination mechanisms.

---

# 41. Failure Isolation

The architecture shall isolate failures between:

- API and workers.
- AI provider and application.
- External integrations and application.
- Simulation engine and application.
- Reporting and core investigation.
- Telemetry and core business operations where safe.

A failure in an optional capability shall not unnecessarily corrupt core domain state.

---

# 42. Scalability Boundaries

The initial modular monolith shall provide natural scaling boundaries.

Potential independent scaling units include:

    API Processes
          |
          +----> Scale horizontally

    Background Workers
          |
          +----> Scale independently

    PostgreSQL
          |
          +----> Scale according to database workload

    Redis
          |
          +----> Scale according to queue workload

The architecture shall not require all components to scale identically.

---

# 43. Deployment Components

The initial deployment may consist conceptually of:

    +-------------------+
    | Frontend Container |
    +-------------------+

    +-------------------+
    | Backend Container  |
    +-------------------+

    +-------------------+
    | Worker Container   |
    +-------------------+

    +-------------------+
    | PostgreSQL         |
    +-------------------+

    +-------------------+
    | Redis              |
    +-------------------+

    +-------------------+
    | Simulation Engine  |
    +-------------------+

The exact deployment topology remains a later infrastructure decision.

---

# 44. Configuration Boundary

Configuration shall enter the system through controlled configuration mechanisms.

Examples include:

- Database connection.
- Redis connection.
- AI provider configuration.
- External integration configuration.
- Feature flags.
- Operational limits.

Secrets shall remain outside source-controlled code.

---

# 45. Testing Architecture

The architecture shall support testing at multiple levels.

### Unit

Domain logic and pure application behavior.

### Integration

Database and infrastructure interactions.

### API

HTTP contracts and authorization behavior.

### Adapter

External provider behavior through controlled implementations.

### Worker

Background job behavior.

### End-to-End

Representative user workflows.

The architecture shall allow external providers to be replaced by controlled test implementations.

---

# 46. Architectural Constraints

The following constraints are mandatory:

1. No frontend-to-database direct access.
2. No frontend-to-Redis direct access.
3. No direct frontend-to-AI provider using privileged credentials.
4. No unrestricted public simulation execution.
5. No direct domain dependency on infrastructure implementations.
6. No direct domain dependency on OpenAI SDKs.
7. No provider-specific payloads as core domain contracts.
8. No Redis-based authoritative domain state.
9. No API exposure of raw ORM models as the architectural contract.
10. No long-running operations blocking normal HTTP requests unnecessarily.
11. No security-sensitive actions without authorization.
12. No important domain mutation without appropriate auditability.
13. No unnecessary sensitive data in logs.
14. No silent conversion of AI output into authoritative findings.

---

# 47. Architecture Quality Requirements

The architecture shall provide:

- Clear module ownership.
- Explicit dependency direction.
- Stable external boundaries.
- Testable business logic.
- Controlled asynchronous processing.
- Provider isolation.
- Simulation safety.
- Durable domain state.
- Observability.
- Auditability.
- Security boundaries.
- Incremental scalability.

---

# 48. Architecture Acceptance Criteria

The system architecture shall be considered sufficiently defined when:

1. Major components are identified.
2. Responsibilities are assigned.
3. Domain boundaries are identified.
4. Application boundaries are identified.
5. Infrastructure boundaries are identified.
6. API boundaries are identified.
7. AI integration is isolated.
8. Simulation integration is isolated.
9. External integrations are isolated.
10. Persistence ownership is explicit.
11. Redis responsibility is explicit.
12. Background processing is defined.
13. Asynchronous operation flow is defined.
14. Real-time update architecture is defined.
15. Security boundaries are defined.
16. Observability architecture is defined.
17. Audit architecture is defined.
18. Error-handling boundaries are defined.
19. Transaction boundaries are considered.
20. Failure isolation is defined.
21. Testing boundaries are defined.
22. Dependency direction is explicit.
23. Deployment components are identified.
24. Mandatory architectural constraints are documented.
25. The architecture remains consistent with the Phase 1 requirements baseline.

---

# 49. Deferred Architecture Decisions

The following details remain intentionally deferred:

- Exact folder structure.
- Exact class names.
- Exact database schema.
- Exact repository implementations.
- Exact authentication provider.
- Exact authorization mechanism.
- Exact API middleware configuration.
- Exact queue worker concurrency.
- Exact AI model.
- Exact AI prompt architecture.
- Exact simulation implementation.
- Exact integration providers.
- Exact observability stack.
- Exact deployment platform.
- Exact infrastructure topology.
- Exact CI/CD implementation.
- Exact production scaling configuration.

These shall be defined in subsequent architecture and implementation steps.

---

# 50. Architecture Governance

Any future implementation decision that violates a mandatory architectural constraint shall require explicit review.

Architecture changes shall be documented when they materially affect:

- Domain ownership.
- Security boundaries.
- API contracts.
- Persistence authority.
- AI provider isolation.
- Simulation safety.
- Integration boundaries.
- Observability.
- Auditability.
- Deployment architecture.

The architecture shall evolve through explicit decisions rather than accidental coupling.

---

# 51. Final Architecture Statement

SentinelAI shall initially be implemented as a modular monolith consisting of:

    React/Vite Frontend
             |
             v
       Fastify API
             |
             v
    Application Services
             |
             v
       Domain Modules
          /      \
         /        \
        v          v
    PostgreSQL   Integration
        |          |
      Prisma    +--+-------+
                |          |
                v          v
              OpenAI   External Systems

Background operations:

    Application
        |
        v
      BullMQ
        |
        v
      Redis
        |
        v
      Workers
       / |  \
      /  |   \
     v   v    v
    AI  Report Simulation

The architecture shall preserve:

- Domain ownership.
- Security.
- Reliability.
- Observability.
- Auditability.
- Testability.
- Provider isolation.
- Simulation safety.
- API stability.

This architecture provides the foundation for detailed component, database, API implementation, deployment, and testing design.

---

# 52. Scope

This document defines the system-level architecture and component boundaries for SentinelAI.

It establishes the modular-monolith structure, application layers, domain modules, persistence boundary, background processing, AI integration, simulation boundary, external integrations, API flow, real-time updates, security boundaries, observability, audit architecture, failure isolation, testing architecture, and mandatory architectural constraints.

It does not define detailed implementation code or deployment-specific infrastructure configuration.

Those details shall be defined in subsequent architecture and implementation stages.
