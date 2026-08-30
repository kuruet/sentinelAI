# SentinelAI - Technology Decisions & Architecture Decision Records

## 1. Purpose

This document records the major technology and architecture decisions for SentinelAI.

The purpose is to establish a consistent technical foundation for subsequent implementation phases and to document the reasoning behind important technology choices.

These decisions are derived from the previously established:

- Product vision.
- User and stakeholder requirements.
- Functional requirements.
- Domain model.
- Core workflows.
- API contract.
- Security and trust requirements.
- Observability and audit requirements.

This document records architectural decisions rather than implementation details.

The selected technologies are intended to support a maintainable, secure, observable, and extensible incident-intelligence platform suitable for the SentinelAI project scope.

---

## 2. Decision Summary

The current technology baseline is:

| Area                        | Decision                                             |
| --------------------------- | ---------------------------------------------------- |
| Architecture style          | Modular monolith                                     |
| Backend runtime             | Node.js                                              |
| Backend language            | TypeScript                                           |
| Backend framework           | Fastify                                              |
| Frontend framework          | React                                                |
| Frontend build tool         | Vite                                                 |
| Database                    | PostgreSQL                                           |
| ORM                         | Prisma                                               |
| Asynchronous jobs           | BullMQ                                               |
| Queue / transient state     | Redis                                                |
| AI integration              | OpenAI                                               |
| Real-time updates           | Server-Sent Events                                   |
| Containerization            | Docker                                               |
| API style                   | Versioned REST-style HTTP API                        |
| API version                 | `/api/v1`                                            |
| Validation                  | Schema-based request validation                      |
| Observability               | Logs, metrics, traces, audit records                 |
| Repository structure        | Monorepo                                             |
| Core architecture principle | Domain ownership inside backend application boundary |

These decisions establish the baseline and may be revisited if implementation evidence demonstrates a significant architectural problem.

---

# 3. ADR-001: Use a Modular Monolith

## Status

Accepted

## Context

SentinelAI contains several logically distinct capabilities:

- Incident management.
- Investigations.
- Evidence processing.
- Timeline reconstruction.
- AI analysis.
- Simulation execution.
- Integrations.
- Reporting.
- Auditability.
- Background processing.

A microservice architecture could separate these capabilities into independently deployable services.

However, the current project requires strong domain consistency, relatively straightforward deployment, manageable operational complexity, and rapid development.

Introducing distributed services too early would create additional complexity in:

- Service discovery.
- Network communication.
- Distributed transactions.
- Authentication propagation.
- Deployment.
- Observability.
- Local development.
- Failure handling.
- Data ownership.
- Version management.

## Decision

SentinelAI shall initially use a **modular monolith**.

The application shall be internally divided into clear domain and application modules while remaining deployable as a coherent backend application.

Conceptually:

    SentinelAI Backend
    |
    +-- Incidents
    +-- Investigations
    +-- Evidence
    +-- Timeline
    +-- Services
    +-- Hypotheses
    +-- Findings
    +-- AI Analysis
    +-- Recommendations
    +-- Simulation
    +-- Integrations
    +-- Reports
    +-- Audit
    +-- Shared Infrastructure

## Rationale

The modular monolith provides:

- Lower operational complexity.
- Clear domain boundaries.
- Simpler development.
- Simpler testing.
- Easier local execution.
- Strong transactional consistency.
- A path toward future service extraction if required.

The architecture shall avoid tightly coupling modules simply because they share one deployment unit.

## Consequences

Positive:

- Faster implementation.
- Lower infrastructure complexity.
- Easier debugging.
- Easier database transactions.
- Simpler deployment.

Negative:

- Modules share the same runtime.
- A future extraction into services may require additional boundary work.
- Poor module discipline could create a monolithic codebase.

## Alternatives Rejected

### Microservices

Rejected for the initial architecture because the operational complexity is disproportionate to the current project scope.

### Serverless-only architecture

Rejected because several workflows require persistent application state, background processing, integrations, and controlled long-running operations.

---

# 4. ADR-002: Use TypeScript for Application Development

## Status

Accepted

## Context

SentinelAI requires coordinated development across:

- Frontend.
- Backend.
- Shared contracts.
- Simulation engine.
- API models.
- Domain models.

The project benefits from strong typing across these boundaries.

## Decision

TypeScript shall be the primary application-development language.

It shall be used for:

- Backend.
- Frontend.
- Shared types.
- Simulation engine.
- Supporting application tooling where appropriate.

## Rationale

TypeScript provides:

- Static type checking.
- Strong IDE support.
- Shared type definitions.
- Improved refactoring safety.
- Better API contract representation.
- Consistency across the application stack.

## Consequences

Positive:

- Reduced class of runtime type errors.
- Better developer tooling.
- Shared models between frontend and backend.
- Easier large-scale refactoring.

Negative:

- Additional compilation and type-checking complexity.
- Developers must maintain accurate types.

## Alternatives Rejected

### JavaScript

Rejected as the primary language because the project benefits substantially from explicit types across domain and API boundaries.

### Multiple primary languages

Rejected because it would increase development and maintenance complexity without sufficient benefit for the initial system.

---

# 5. ADR-003: Use Node.js for the Backend Runtime

## Status

Accepted

## Context

The backend must support:

- HTTP APIs.
- Asynchronous processing.
- External integrations.
- AI provider calls.
- Database access.
- Background jobs.
- Real-time event delivery.

## Decision

Node.js shall be used as the primary backend runtime.

## Rationale

Node.js is well suited to SentinelAI's I/O-heavy workloads, including:

- API requests.
- Database communication.
- External integrations.
- AI provider calls.
- Queue operations.

It also provides a unified runtime with the TypeScript frontend and shared application tooling.

## Consequences

Positive:

- Strong ecosystem.
- Good asynchronous I/O support.
- TypeScript compatibility.
- Consistent development environment.

Negative:

- CPU-intensive work should not block the main application process.
- Heavy computation may require worker isolation.

---

# 6. ADR-004: Use Fastify for the Backend HTTP Framework

## Status

Accepted

## Context

SentinelAI requires a backend framework capable of providing:

- HTTP routing.
- Middleware/hooks.
- Request validation.
- Error handling.
- Plugin composition.
- Good performance.
- TypeScript support.

## Decision

Fastify shall be used as the backend HTTP framework.

## Rationale

Fastify provides a lightweight architecture with strong support for:

- Schema-driven APIs.
- TypeScript.
- Plugins.
- Structured request handling.
- High-throughput HTTP workloads.

Its plugin model also aligns well with modular backend architecture.

## Consequences

Positive:

- Lightweight framework.
- Strong schema support.
- Good TypeScript integration.
- Clear plugin boundaries.

Negative:

- Some ecosystem conventions differ from more opinionated frameworks.
- The project must establish its own application architecture conventions.

## Alternatives Rejected

### Express

Rejected as the primary framework because SentinelAI benefits from stronger schema-oriented API design and a more structured plugin architecture.

### NestJS

Rejected because its additional framework abstraction is not required for the initial modular-monolith architecture.

---

# 7. ADR-005: Use React for the Frontend

## Status

Accepted

## Context

SentinelAI requires an engineering-oriented user interface for:

- Incident dashboards.
- Investigation workflows.
- Timeline visualization.
- Evidence inspection.
- AI analysis results.
- Simulation status.
- Reports.
- Operational monitoring.

## Decision

React shall be used for the frontend application.

## Rationale

React provides:

- Component-based UI architecture.
- Mature ecosystem.
- Strong TypeScript support.
- Flexible composition.
- Good support for complex interactive interfaces.

## Consequences

The frontend shall be structured around reusable components and feature-oriented modules rather than a single monolithic UI layer.

---

# 8. ADR-006: Use Vite for Frontend Build Tooling

## Status

Accepted

## Context

The SentinelAI frontend requires fast local development and predictable production builds.

## Decision

Vite shall be used as the frontend build tool.

## Rationale

Vite provides:

- Fast development startup.
- Fast module transformation.
- Modern frontend tooling.
- Strong TypeScript support.
- Straightforward production builds.

## Alternatives Rejected

### Custom build configuration

Rejected because maintaining custom build infrastructure provides little value for the project.

### Heavier framework-specific build systems

Not selected because SentinelAI's frontend does not currently require server-side rendering as a core architectural requirement.

---

# 9. ADR-007: Use PostgreSQL as the Primary Database

## Status

Accepted

## Context

SentinelAI requires durable storage for:

- Incidents.
- Investigations.
- Evidence metadata.
- Events.
- Services.
- Dependencies.
- Hypotheses.
- Findings.
- Recommendations.
- Simulation records.
- Integration metadata.
- Audit records.
- Reports.
- Operations.

The domain contains relationships and transactional state that benefit from a relational data model.

## Decision

PostgreSQL shall be the primary persistent database.

## Rationale

PostgreSQL provides:

- Relational integrity.
- Transactions.
- Strong consistency.
- Rich indexing.
- Structured querying.
- JSON support where appropriate.
- Mature operational tooling.

## Consequences

Positive:

- Strong domain integrity.
- Good support for relational workflows.
- Mature ecosystem.
- Suitable for complex investigations and relationships.

Negative:

- Schema changes require migration discipline.
- Highly unstructured data must be modeled carefully.

## Alternatives Rejected

### MongoDB

Rejected as the primary database because SentinelAI has significant relational requirements around incidents, investigations, evidence, services, dependencies, hypotheses, findings, and audit relationships.

### SQLite

Rejected as the production primary database because SentinelAI requires concurrent application workloads and operational durability beyond the intended role of SQLite.

---

# 10. ADR-008: Use Prisma as the ORM/Data Access Layer

## Status

Accepted

## Context

The backend requires a controlled mechanism for interacting with PostgreSQL.

## Decision

Prisma shall be used as the primary ORM/data-access layer.

## Rationale

Prisma provides:

- Type-safe database access.
- Schema representation.
- Migration tooling.
- Strong TypeScript integration.
- Developer-friendly database workflows.

## Architectural Boundary

Prisma shall remain inside the backend persistence boundary.

API clients shall never interact with Prisma directly.

The conceptual dependency direction is:

    API
      |
      v
    Application
      |
      v
    Domain
      |
      v
    Persistence
      |
      v
    Prisma
      |
      v
    PostgreSQL

## Consequences

Positive:

- Type-safe persistence access.
- Consistent migrations.
- Reduced database boilerplate.

Negative:

- Application code must avoid allowing ORM models to become the public API contract.
- Complex queries may occasionally require lower-level database techniques.

---

# 11. ADR-009: Use Redis for Transient Distributed State and Queuing Support

## Status

Accepted

## Context

SentinelAI requires asynchronous processing for operations such as:

- AI analysis.
- Report generation.
- Simulation execution.
- External ingestion.
- Other potentially long-running tasks.

## Decision

Redis shall provide transient infrastructure support for queues and related short-lived distributed state.

Redis shall not become the system of record for core SentinelAI domain entities.

## Rationale

Redis provides low-latency operations suitable for:

- Queue coordination.
- Job state.
- Short-lived locks where required.
- Transient caching where justified.

## Consequences

PostgreSQL remains authoritative for durable domain state.

Redis data shall be considered replaceable unless explicitly documented otherwise.

---

# 12. ADR-010: Use BullMQ for Background Job Processing

## Status

Accepted

## Context

Several SentinelAI workflows are asynchronous and should not block HTTP requests.

## Decision

BullMQ shall be used for background job processing with Redis as its infrastructure layer.

## Initial Job Categories

Potential job categories include:

- AI analysis.
- Report generation.
- Simulation execution coordination.
- External event ingestion.
- Evidence processing.
- Other bounded asynchronous operations.

## Rationale

BullMQ provides queue-based processing appropriate for Node.js applications.

It supports:

- Job queues.
- Retries.
- Delayed jobs.
- Worker processing.
- Job state.
- Failure handling.

## Consequences

The application must define:

- Retry policies.
- Idempotency.
- Dead-letter or failed-job handling.
- Job timeouts.
- Observability.

---

# 13. ADR-011: Use OpenAI for AI-Assisted Analysis

## Status

Accepted

## Context

AI-assisted analysis is a core SentinelAI capability.

The system requires AI support for:

- Incident analysis.
- Root-cause hypothesis generation.
- Evidence interpretation.
- Investigation assistance.
- Remediation recommendations.

## Decision

OpenAI shall be the initial AI provider.

The integration shall remain behind an internal AI-provider abstraction.

Conceptually:

    Investigation
         |
         v
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

## Rationale

This architecture provides access to capable general-purpose AI models while preventing provider-specific concepts from becoming core domain dependencies.

## Security Requirements

AI requests shall:

- Use only authorized context.
- Minimize sensitive information.
- Avoid unnecessary data sharing.
- Preserve analysis provenance.
- Validate returned content.
- Prevent direct mutation of trusted domain state.

## Consequences

Positive:

- AI-assisted reasoning capability.
- Clear provider boundary.
- Future provider substitution remains possible.

Negative:

- External dependency.
- Cost considerations.
- Provider availability considerations.
- AI output requires validation and human oversight.

## Alternatives Rejected

### Direct model-provider coupling throughout the application

Rejected because it would make provider changes expensive and spread external concerns through the domain.

### Self-hosted model as the initial provider

Rejected for the initial project because it would introduce significant infrastructure, model-serving, and operational complexity.

---

# 14. ADR-012: Use Server-Sent Events for Server-to-Client Updates

## Status

Accepted

## Context

The SentinelAI UI may need to receive updates for:

- AI analysis progress.
- Simulation execution state.
- Background operation status.
- Incident activity.
- Investigation updates.

A polling-only approach would introduce unnecessary request traffic and delayed updates.

## Decision

Server-Sent Events (SSE) shall be used for appropriate one-way server-to-client real-time updates.

## Rationale

SSE provides:

- Simple HTTP-based streaming.
- Automatic browser reconnection support.
- One-way event delivery suitable for status updates.
- Lower complexity than full bidirectional WebSocket communication for the initial requirements.

## Consequences

The backend must:

- Manage event streams.
- Authenticate subscriptions.
- Authorize resource visibility.
- Handle reconnect behavior.
- Avoid leaking events between users or tenants.

## Alternatives Rejected

### WebSockets

Not selected initially because the primary requirement is server-to-client notification rather than arbitrary bidirectional communication.

### Polling

Rejected as the primary real-time mechanism because it introduces unnecessary repeated requests and less immediate updates.

---

# 15. ADR-013: Use REST-Style Versioned HTTP APIs

## Status

Accepted

## Context

SentinelAI requires a stable external application boundary.

## Decision

The application shall expose a versioned REST-style HTTP API under:

    /api/v1

The API shall use resource-oriented endpoints and explicit domain commands where appropriate.

## Rationale

REST-style HTTP APIs provide:

- Familiar client interaction.
- Clear resource semantics.
- Straightforward frontend integration.
- Easy testing.
- Explicit versioning.

## Consequences

The API shall not expose:

- Database tables.
- ORM models.
- Internal queue structures.
- Provider-specific APIs.

The API contract established in the API requirements document remains authoritative for endpoint design.

---

# 16. ADR-014: Use Schema-Based API Validation

## Status

Accepted

## Context

External input is untrusted and must be validated before entering application workflows.

## Decision

SentinelAI shall use explicit request and response schemas at API boundaries.

Validation shall cover:

- Request bodies.
- Query parameters.
- Path parameters.
- Headers where appropriate.
- External integration payloads.
- AI responses.
- Simulation parameters.

## Rationale

Schema validation provides:

- Predictable contracts.
- Early rejection of malformed input.
- Better API documentation potential.
- Reduced runtime ambiguity.

## Consequences

Validation schemas must remain aligned with API contracts and domain constraints.

---

# 17. ADR-015: Use Docker for Containerization

## Status

Accepted

## Context

SentinelAI contains multiple technical components:

- Frontend.
- Backend.
- Database.
- Redis.
- Background workers.
- Simulation engine.

Consistent environments are important for local development and deployment.

## Decision

Docker shall be used to containerize applicable SentinelAI components.

## Rationale

Docker provides:

- Environment consistency.
- Reproducible development environments.
- Component isolation.
- Straightforward local orchestration.
- Deployment portability.

## Consequences

Container configuration shall:

- Avoid embedding secrets.
- Use appropriate health checks.
- Follow least privilege where practical.
- Keep images minimal.
- Separate build and runtime concerns where appropriate.

---

# 18. ADR-016: Use a Monorepo

## Status

Accepted

## Context

SentinelAI contains closely related components:

- Backend.
- Frontend.
- Shared types.
- Simulation engine.
- Documentation.
- Configuration.

These components benefit from coordinated changes.

## Decision

SentinelAI shall use a monorepo structure.

The current repository organization shall preserve clear component boundaries.

Conceptually:

    sentinelAI/
    |
    +-- backend/
    +-- frontend/
    +-- shared/
    +-- simulation-engine/
    +-- docs/
    +-- infrastructure/

## Rationale

A monorepo provides:

- Shared versioning.
- Coordinated changes.
- Easier dependency management.
- Shared tooling.
- Consistent CI validation.

## Consequences

Repository conventions must prevent unrelated modules from becoming tightly coupled.

---

# 19. ADR-017: Keep Shared Contracts in a Dedicated Shared Boundary

## Status

Accepted

## Context

Frontend and backend need to agree on certain contracts.

Examples include:

- API data structures.
- Shared enums.
- Identifiers.
- Common validation concepts.

## Decision

Shared application contracts shall be placed in the dedicated shared package/boundary where appropriate.

The shared layer shall contain reusable contracts rather than backend implementation details.

## Rationale

This reduces duplication while maintaining a clear separation between:

- Client concerns.
- Server concerns.
- Shared contract concerns.

## Consequences

Shared types shall remain intentionally small and stable.

The shared layer shall not become a dumping ground for arbitrary business logic.

---

# 20. ADR-018: Keep Domain Ownership Inside the Backend

## Status

Accepted

## Context

SentinelAI has a rich domain model.

Allowing multiple layers to independently mutate domain state would make correctness and authorization difficult to reason about.

## Decision

The backend application shall own authoritative domain state.

The frontend shall request domain operations through the API.

External systems shall interact through controlled integration boundaries.

AI providers and simulation components shall not directly own core SentinelAI domain state.

## Rationale

This preserves:

- Business invariants.
- Authorization.
- Validation.
- Auditability.
- Transactional consistency.

## Consequences

All important state changes must pass through controlled application workflows.

---

# 21. ADR-019: Separate AI-Generated Information from Validated Findings

## Status

Accepted

## Context

AI output may be incorrect, incomplete, or misleading.

SentinelAI must not treat AI output as automatically authoritative.

## Decision

AI-generated hypotheses and recommendations shall remain distinguishable from human-confirmed findings and decisions.

The workflow shall conceptually be:

    Evidence
       |
       v
    AI Analysis
       |
       v
    Candidate Hypothesis
       |
       v
    Human / Application Validation
       |
       v
    Finding

## Rationale

This protects investigation integrity and supports explainability.

## Consequences

Domain models, APIs, UI, and audit records must preserve origin and validation state.

---

# 22. ADR-020: Keep Simulation Behind a Dedicated Safety Boundary

## Status

Accepted

## Context

Controlled failure simulation is potentially high impact.

Unrestricted execution capabilities would introduce unacceptable safety and security risks.

## Decision

Simulation shall operate through a dedicated simulation-engine boundary with:

- Explicit scenarios.
- Approved environments.
- Validated parameters.
- Authorization.
- Resource limits.
- Execution limits.
- Observable state.
- Auditability.

The simulation engine shall not expose arbitrary unrestricted command execution through the public API.

## Rationale

This allows SentinelAI to provide controlled reliability experimentation without making the platform an unrestricted execution system.

## Consequences

Simulation requests require additional validation and operational controls.

---

# 23. ADR-021: Use PostgreSQL as the Source of Truth for Domain State

## Status

Accepted

## Context

Multiple components may participate in SentinelAI workflows.

Transient systems such as Redis and background workers must not become competing sources of truth.

## Decision

PostgreSQL shall remain authoritative for durable SentinelAI domain state.

Redis shall provide transient infrastructure capabilities.

Queues shall represent work to be performed rather than authoritative business state.

AI providers shall not be authoritative sources of domain state.

Simulation runtime state shall be persisted into SentinelAI domain records where required.

## Rationale

This provides a clear ownership model.

---

# 24. ADR-022: Use Asynchronous Operations for Long-Running Work

## Status

Accepted

## Context

AI analysis, simulation execution, and report generation may exceed normal HTTP request durations.

Blocking HTTP requests for these operations would create poor reliability and scalability characteristics.

## Decision

Long-running operations shall use asynchronous job processing.

The API pattern shall be:

    POST /operation
          |
          v
    202 Accepted
          |
          v
    operationId
          |
          v
    background processing
          |
          v
    operation result

## Rationale

This improves:

- API responsiveness.
- Failure isolation.
- Retry handling.
- User experience.
- Operational visibility.

---

# 25. ADR-023: Preserve Provider Independence

## Status

Accepted

## Context

External providers may change over time.

This applies to:

- AI providers.
- Incident systems.
- Monitoring systems.
- Alerting systems.
- Other external integrations.

## Decision

Provider-specific implementations shall be isolated behind adapters.

Conceptually:

    Application
         |
         v
    Provider Interface
         |
       +---+---+
       |       |
       v       v
    Provider A Provider B

The initial AI provider is OpenAI, but the core domain shall not directly depend on OpenAI-specific concepts.

## Rationale

This reduces vendor lock-in and keeps external concerns outside the domain layer.

---

# 26. ADR-024: Use Explicit Audit Records for Important Actions

## Status

Accepted

## Context

Operational and security-sensitive actions must remain traceable.

Application logs alone are not sufficient because logs primarily support troubleshooting rather than accountability.

## Decision

SentinelAI shall maintain explicit audit records for important security and domain actions.

Examples include:

- Authentication events.
- Authorization failures.
- Incident lifecycle changes.
- Evidence modifications.
- AI analysis requests.
- Simulation execution.
- Remediation decisions.
- Integration configuration.
- Administrative actions.

## Rationale

Audit records provide durable accountability separate from ordinary diagnostic logs.

---

# 27. ADR-025: Use Logs, Metrics, Traces, and Audit Records Together

## Status

Accepted

## Context

No single telemetry mechanism provides complete operational visibility.

## Decision

SentinelAI shall use four complementary observability categories:

    Logs
       |
       +--> Detailed diagnostics

    Metrics
       |
       +--> Numerical health signals

    Traces
       |
       +--> Cross-component operation relationships

    Audit Records
       |
       +--> Accountability and important action history

## Rationale

This matches the observability requirements already established for SentinelAI.

---

# 28. ADR-026: Do Not Make AI Availability a Core Incident Dependency

## Status

Accepted

## Context

AI-assisted reasoning is valuable but is not the same as core incident-management functionality.

An external AI provider may become unavailable.

## Decision

Core SentinelAI functionality shall continue to operate when AI analysis is unavailable.

AI failures shall produce explicit failed or unavailable analysis states.

Existing:

- Incidents.
- Evidence.
- Investigations.
- Findings.
- Reports.
- Audit records.

shall remain accessible according to authorization rules.

## Rationale

This prevents an external provider outage from becoming a total SentinelAI outage.

---

# 29. ADR-027: Prefer Human-in-the-Loop Decisions for High-Impact Actions

## Status

Accepted

## Context

AI analysis and automated recommendations may influence operational decisions.

High-impact actions should not be silently executed based only on model output.

## Decision

SentinelAI shall preserve human review for important decisions, particularly:

- Root-cause confirmation.
- Remediation decisions.
- Simulation authorization.
- Other potentially high-impact operational actions.

## Rationale

This provides stronger safety, accountability, and trust.

## Consequences

The UI and domain model must distinguish recommendations from approved decisions.

---

# 30. ADR-028: API Versioning Starts at v1

## Status

Accepted

## Context

API contracts may evolve.

Unversioned breaking changes would create unnecessary client compatibility problems.

## Decision

The initial public application API shall use:

    /api/v1

Breaking changes shall require a new API version.

Backward-compatible additions may remain within the existing version.

---

# 31. ADR-029: Prefer Explicit Domain State Transitions

## Status

Accepted

## Context

Incidents, investigations, hypotheses, simulations, and asynchronous operations have lifecycle states.

Allowing arbitrary status updates would make domain behavior difficult to validate.

## Decision

Important lifecycle transitions shall be represented as explicit domain operations rather than unrestricted field updates.

Conceptually:

    Current State
          |
          v
    Requested Transition
          |
          v
    Domain Validation
          |
       +--+--+
       |     |
     Valid Invalid
       |     |
       v     v
    New State  Rejected

## Rationale

This protects domain invariants and makes workflows explicit.

---

# 32. ADR-030: Separate Persistence Models from Public API Contracts

## Status

Accepted

## Context

Database schemas evolve independently from external API contracts.

Exposing persistence models directly would tightly couple clients to internal implementation.

## Decision

API request and response contracts shall remain separate from database persistence models.

## Rationale

This permits:

- Database refactoring.
- ORM changes.
- Internal schema evolution.
- Data normalization changes.

without unnecessarily breaking API consumers.

---

# 33. Technology Dependency Direction

The intended dependency direction is:

    Frontend
       |
       v
    API Contract
       |
       v
    Application Layer
       |
       v
    Domain Layer
       |
       +------------------+
       |                  |
       v                  v
    Persistence       Integration
       |                  |
       v                  +----> AI Provider
    Prisma                    +-> External Systems
       |
       v
    PostgreSQL

Background processing:

    Application
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
       +--> Application Services
       +--> AI Provider
       +--> Simulation Engine
       +--> External Integrations

The domain layer shall not depend directly on infrastructure-specific implementations.

---

# 34. Architecture Decision Principles

Future technology decisions should follow these principles:

1. Prefer simplicity over unnecessary infrastructure.
2. Prefer explicit boundaries over implicit coupling.
3. Prefer managed complexity over accidental complexity.
4. Preserve domain ownership.
5. Protect API stability.
6. Keep external providers behind adapters.
7. Treat AI output as untrusted information.
8. Keep simulation capabilities constrained.
9. Preserve observability.
10. Preserve auditability.
11. Prefer technologies with strong TypeScript support where practical.
12. Avoid introducing infrastructure without a demonstrated requirement.
13. Avoid premature microservice decomposition.
14. Keep security requirements ahead of implementation convenience.

---

# 35. Technology Selection Matrix

| Technology       | Decision | Primary Responsibility     |
| ---------------- | -------- | -------------------------- |
| TypeScript       | Selected | Application language       |
| Node.js          | Selected | Backend runtime            |
| Fastify          | Selected | HTTP API                   |
| React            | Selected | Frontend                   |
| Vite             | Selected | Frontend build tooling     |
| PostgreSQL       | Selected | Durable relational storage |
| Prisma           | Selected | Database access            |
| Redis            | Selected | Transient infrastructure   |
| BullMQ           | Selected | Background jobs            |
| OpenAI           | Selected | AI analysis provider       |
| SSE              | Selected | Server-to-client updates   |
| Docker           | Selected | Containerization           |
| REST-style HTTP  | Selected | External API               |
| Modular monolith | Selected | Application architecture   |
| Monorepo         | Selected | Repository architecture    |

---

# 36. Rejected Architectural Directions

## 36.1 Immediate Microservices

Not selected because the current system can be developed and operated more efficiently as a modular monolith.

## 36.2 Database-per-Service Architecture

Not selected because the initial architecture does not require independently deployed services.

## 36.3 Direct Frontend-to-Database Access

Rejected because it violates application ownership, authorization, validation, and security boundaries.

## 36.4 Direct Frontend-to-AI Provider Access

Rejected because AI credentials, data minimization, authorization, validation, and provider abstraction must remain server-side.

## 36.5 Direct Frontend-to-Simulation Engine Access

Rejected because simulation requires authorization and safety controls.

## 36.6 Redis as Primary Database

Rejected because Redis is intended for transient infrastructure rather than authoritative domain persistence.

## 36.7 AI Provider as Source of Truth

Rejected because AI output is probabilistic and must remain subject to application validation and human review.

## 36.8 Arbitrary Command Execution

Rejected because it conflicts with SentinelAI's simulation safety requirements.

---

# 37. Technology Decision Review Policy

Technology decisions should be revisited when:

- A selected technology becomes unsuitable.
- Requirements materially change.
- A major security issue is discovered.
- Performance evidence demonstrates a significant limitation.
- Operational complexity becomes excessive.
- A critical dependency becomes unavailable.
- A new requirement cannot reasonably be supported.

A technology should not be replaced merely because another technology is newer or more popular.

Changes should be supported by concrete engineering evidence.

---

# 38. Consequences of the Current Technology Baseline

The selected architecture intentionally favors:

- Maintainability.
- Strong domain boundaries.
- Developer productivity.
- Type safety.
- Relational consistency.
- Controlled asynchronous processing.
- AI-provider abstraction.
- Simulation safety.
- Observability.
- Auditability.
- Incremental scalability.

The architecture does not attempt to optimize prematurely for massive distributed-system scale.

Scalability shall be introduced where justified by actual workload requirements.

---

# 39. Implementation Guidance

These ADRs establish architectural constraints for subsequent implementation.

Implementation should preserve:

1. Modular backend boundaries.
2. Domain ownership.
3. API abstraction.
4. Persistence abstraction.
5. Integration adapters.
6. AI provider isolation.
7. Simulation safety boundaries.
8. Background job isolation.
9. Explicit lifecycle transitions.
10. Security controls.
11. Auditability.
12. Observability.

Technology selection alone does not guarantee these properties.

They must be enforced through project structure, code review, tests, and architecture governance.

---

# 40. Phase 1 Technology Decision Acceptance Criteria

The technology decision stage shall be considered complete when:

1. The primary application architecture is selected.
2. Backend runtime and framework are selected.
3. Frontend framework and build tooling are selected.
4. Database technology is selected.
5. Persistence technology is selected.
6. Background processing technology is selected.
7. Transient infrastructure technology is selected.
8. AI-provider strategy is selected.
9. Real-time communication strategy is selected.
10. Containerization strategy is selected.
11. Repository architecture is selected.
12. API style and versioning are established.
13. AI trust boundaries are preserved.
14. Simulation boundaries are preserved.
15. Domain ownership is explicit.
16. Major alternatives have been considered.
17. Important decisions have documented rationale.
18. Future technology changes have a documented review policy.
19. The selected stack is consistent with previous requirements.
20. The decisions provide a stable foundation for implementation.

---

# 41. Deferred Technology Decisions

The following details remain intentionally deferred until later architecture or implementation stages:

- Exact authentication provider.
- Exact authorization implementation.
- Exact frontend component library.
- Exact state-management library.
- Exact database deployment topology.
- Exact Redis deployment topology.
- Exact queue worker scaling strategy.
- Exact OpenAI model selection.
- Exact AI token/cost policy.
- Exact observability platform.
- Exact metrics backend.
- Exact tracing backend.
- Exact deployment platform.
- Exact CI/CD platform.
- Exact cloud-provider configuration.
- Exact infrastructure-as-code technology.
- Exact backup implementation.
- Exact disaster-recovery configuration.

These decisions shall be made only when sufficient implementation and deployment context exists.

---

# 42. Final Architecture Decision

SentinelAI shall proceed with the following baseline architecture:

    React + Vite Frontend
              |
              v
        Versioned HTTP API
              |
              v
       Fastify / TypeScript
              |
       +------+------+----------------+
       |             |                |
       v             v                v
    Domain       Application      Background
    Modules       Services          Jobs
       |             |                |
       v             v                v
    Prisma        Integrations     BullMQ
       |             |                |
       v          +--+--+             v
    PostgreSQL   |     |           Redis
                 v     v
               OpenAI  External
                       Systems

                     +
                     |
                     v
              Simulation Engine

Observability and audit capabilities shall span the relevant components without violating security and data-minimization requirements.

---

# 43. Scope

This document establishes the major technology and architecture decisions for SentinelAI.

It defines the selected technology baseline, architectural style, major architecture decision records, rejected alternatives, dependency direction, technology governance principles, and deferred decisions.

It does not constitute an implementation specification.

Implementation details shall be defined during subsequent engineering phases while preserving the architectural decisions established here unless a documented architecture decision supersedes them.
