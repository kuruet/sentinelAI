# SentinelAI - System Architecture

## 1. Purpose

This document defines the logical system architecture for SentinelAI based on the approved product vision, functional requirements, non-functional requirements, constraints, workflows, and domain model. It establishes component boundaries, responsibilities, communication paths, trust boundaries, and architectural principles for subsequent data, API, security, and implementation work.

## 2. Architectural Goals

The architecture shall:

1. Provide a unified incident investigation platform.
2. Maintain clear boundaries between major domain capabilities.
3. Support the initial backend as a modular monolith.
4. Isolate the simulation engine from the core application while allowing controlled communication.
5. Isolate AI-provider-specific implementation behind an AI orchestration boundary.
6. Support external operational integrations through adapter boundaries.
7. Preserve evidence provenance and investigation traceability.
8. Keep humans in control of consequential operational decisions.
9. Support asynchronous processing for long-running operations.
10. Provide appropriate security, observability, reliability, and auditability.
11. Avoid premature distributed-system complexity.
12. Provide a foundation that can evolve if future scale or isolation requirements justify architectural decomposition.

## 3. Architecture Style

SentinelAI shall initially use a **modular monolith with supporting specialized components**.

The core application shall contain logically separated modules while remaining deployable as a primary backend application. Specialized workloads that have materially different execution or isolation requirements may remain separate components.

Conceptually:

```text
+-----------------------------------------------------------------------+
|                         SentinelAI Platform                           |
|                                                                       |
|  +-------------------+        +-----------------------------------+  |
|  |     Frontend      |------->|       Backend Application         |  |
|  |                   |  API   |                                   |  |
|  | Investigation UI  |        |  +-----------------------------+  |  |
|  | Incident UI       |        |  |     API / Application      |  |  |
|  | Simulation UI     |        |  |        Boundary            |  |  |
|  | Admin UI           |        |  +-------------+---------------+  |  |
|  +-------------------+        |                |                  |  |
|                               |     Modular Monolith             |  |
|                               |                |                  |  |
|                               |  +-------------v---------------+  |  |
|                               |  |     Domain Modules         |  |  |
|                               |  |                            |  |  |
|                               |  | Incident Management       |  |  |
|                               |  | Investigation              |  |  |
|                               |  | Evidence                   |  |  |
|                               |  | System Context             |  |  |
|                               |  | AI Orchestration           |  |  |
|                               |  | Reporting                  |  |  |
|                               |  | Remediation                |  |  |
|                               |  | Integration                |  |  |
|                               |  | Identity & Access          |  |  |
|                               |  | Audit                      |  |  |
|                               |  +-------------+--------------+  |  |
|                               +----------------+------------------+  |
|                                                |                     |
|                                  +-------------v-------------+       |
|                                  | Persistence / Data Layer |       |
|                                  +---------------------------+       |
|                                                                       |
|  +----------------------+       +--------------------------------+  |
|  | Simulation Engine    |       | External Systems               |  |
|  |                      |       |                                |  |
|  | Scenario Execution   |       | Monitoring / Logging           |  |
|  | Failure Simulation   |       | Alerting                       |  |
|  | Event Generation     |       | Source Control / Deployment    |  |
|  | Cleanup              |       | AI Provider                    |  |
|  +----------+-----------+       | Infrastructure / Other Systems |  |
|             |                   +--------------------------------+  |
+-------------|-------------------------------------------------------+
              |
              | Controlled execution boundary
              v
       +------------------+
       | Simulation Target|
       | Environment      |
       +------------------+
```

## 4. Major Architectural Components

### 4.1 Frontend

**Responsibility:** Provide the engineering user interface for incident management, investigation, evidence review, AI-assisted analysis, simulation management, reporting, and administration.

The frontend shall:

- Communicate with the backend through defined APIs.
- Never directly access the database.
- Never contain authorization logic as the sole security boundary.
- Present AI-generated information distinctly from verified system information.
- Display operation status for long-running tasks.
- Provide clear error and degraded-state information.

### 4.2 Backend Application

**Responsibility:** Provide the primary application boundary and coordinate SentinelAI business operations.

The backend is the initial modular monolith. It contains logically separated modules for core platform capabilities.

The backend shall own:

- API request handling.
- Authentication context integration.
- Authorization enforcement.
- Domain orchestration.
- Transaction coordination.
- Persistence coordination.
- Investigation workflows.
- AI orchestration.
- Integration orchestration.
- Reporting orchestration.
- Audit generation.

### 4.3 Incident Management Module

**Responsibility:** Manage incidents, participants, severity, priority, lifecycle, coordination, and resolution state.

This module owns incident lifecycle transitions and incident-level business rules.

### 4.4 Investigation Module

**Responsibility:** Coordinate structured investigation activities, findings, hypotheses, validation, and investigation state.

The investigation module consumes evidence and context but should not own external integration-specific behavior.

### 4.5 Evidence Module

**Responsibility:** Manage evidence records, provenance, relationships, relevance metadata, and evidence retrieval.

The evidence module provides the traceability foundation for investigation and AI-assisted reasoning.

### 4.6 System Context Module

**Responsibility:** Manage services, components, dependencies, and relevant system relationships.

This module provides system context used by incident investigation.

### 4.7 Event Processing Module

**Responsibility:** Normalize, associate, and process incident-relevant events from internal and external sources.

Events may originate from alerts, logs, metrics, deployments, configuration changes, service-state changes, and simulation executions.

### 4.8 AI Orchestration Module

**Responsibility:** Coordinate AI-assisted investigation without making AI a trusted source of system truth.

The module shall:

- Prepare permitted investigation context.
- Select the configured AI provider/model.
- Execute AI requests.
- Validate structured AI output.
- Record AI analysis execution state.
- Associate generated hypotheses with supporting context.
- Handle provider failures and timeouts.
- Preserve provider abstraction.

### 4.9 Remediation Module

**Responsibility:** Manage remediation recommendations, human remediation decisions, and remediation-related investigation records.

The module shall distinguish advisory recommendations from authorized execution.

### 4.10 Reporting Module

**Responsibility:** Assemble incident information into structured incident reports.

Reports may include incident metadata, timeline, evidence, findings, validated hypotheses, remediation information, and resolution information.

### 4.11 Simulation Module / Simulation Engine Boundary

**Responsibility:** Execute controlled failure scenarios and produce reproducible simulation events.

The simulation engine is treated as a specialized execution component rather than simply another business-domain module because simulation may require stronger isolation and different operational controls.

Communication with the backend shall occur through an explicit interface.

The simulation engine shall not receive unrestricted access to core persistence or protected production resources.

### 4.12 Integration Module

**Responsibility:** Provide adapters and orchestration for supported external systems.

Integration-specific implementation shall remain isolated from core domain logic.

The module shall normalize supported external information before exposing it to domain workflows.

### 4.13 Identity and Access Module

**Responsibility:** Provide authentication context, authorization information, roles, permissions, and access-control decisions required by the application.

Authorization must be enforced at the backend boundary.

### 4.14 Audit Module

**Responsibility:** Record security-sensitive and operationally significant actions for traceability.

Audit information shall identify the responsible user, service, integration, or automated process where applicable.

### 4.15 Persistence Layer

**Responsibility:** Provide controlled access to persistent application data.

Domain modules shall not bypass application boundaries to manipulate persistence owned by another module.

The exact database technology and physical schema are intentionally deferred to Phase 1.9.

### 4.16 Background Processing Boundary

**Responsibility:** Execute work that should not block normal interactive API requests.

Potential workloads include:

- AI analysis.
- Evidence processing.
- External data ingestion.
- Report generation.
- Simulation coordination.
- Cleanup operations.

The exact queue or job-processing technology is deferred to later architecture decisions.

## 5. Module Dependency Rules

The modular-monolith design shall follow explicit dependency rules.

```text
API / Application Boundary
          |
          v
Application Services
          |
          v
Domain Modules
          |
          v
Persistence / External Adapters
```

Recommended dependency direction:

- API layer may call application services.
- Application services may coordinate domain modules.
- Domain modules may use defined abstractions.
- External integrations remain behind adapter interfaces.
- AI providers remain behind the AI abstraction.
- Simulation remains behind the simulation boundary.
- Domain modules should not directly depend on frontend implementation.
- Domain logic should not directly depend on provider-specific infrastructure.

Circular module dependencies shall be avoided.

## 6. Core Request Flow

```text
User
  |
  v
Frontend
  |
  | HTTPS / API
  v
Backend API Boundary
  |
  v
Authentication + Authorization
  |
  v
Application Service
  |
  +-------------------+--------------------+
  |                   |                    |
  v                   v                    v
Domain Module     AI Orchestration    Integration Adapter
  |                   |                    |
  |                   v                    v
  |              AI Provider         External System
  |
  v
Persistence
  |
  v
Response / Operation Status
  |
  v
Frontend
```

## 7. Incident Investigation Flow

```text
Incident
   |
   v
Incident Management
   |
   +--------------------+
   |                    |
   v                    v
Event Processing     System Context
   |                    |
   +---------+----------+
             |
             v
       Evidence Module
             |
             v
       Investigation
             |
             v
      AI Orchestration
             |
             v
       AI Provider
             |
             v
    Output Validation
             |
             v
     Hypothesis Review
             |
             v
     Human Validation
             |
             v
      Findings / Decision
             |
             v
         Reporting
```

## 8. Simulation Flow

```text
Authorized User
      |
      v
Backend API
      |
      v
Authorization + Safety Validation
      |
      v
Simulation Orchestrator
      |
      v
Simulation Engine
      |
      v
Controlled Target Environment
      |
      +--------------------+
      |                    |
      v                    v
Generated Events      Execution Metadata
      |                    |
      +---------+----------+
                |
                v
          Backend Application
                |
                v
             Incident
                |
                v
          Investigation
                |
                v
              Report
```

## 9. External Integration Flow

```text
External System
      |
      v
Integration Adapter
      |
      v
Normalization
      |
      v
Event / Evidence Representation
      |
      v
Core Domain Modules
```

The core domain must not depend directly on external provider-specific data structures.

## 10. AI Trust Boundary

AI is explicitly treated as an untrusted external processing dependency.

```text
Incident Context + Evidence
            |
            v
     AI Orchestration
            |
            v
       AI Provider
            |
            v
     Generated Output
            |
            v
   Schema / Structure Validation
            |
            v
 Evidence / Context Validation
            |
            v
 Candidate Hypothesis
            |
            v
      Human Review
            |
            v
 Validated Investigation Finding
```

AI output shall never bypass application validation and authorization boundaries.

## 11. Simulation Trust Boundary

Simulation has a separate execution trust boundary because failure scenarios can potentially affect runtime resources.

```text
Core Application
      |
      | Explicit simulation API
      v
Simulation Boundary
      |
      | Authorized scenario
      v
Simulation Engine
      |
      | Controlled execution
      v
Simulation Target Environment
```

The simulation engine must operate only against explicitly permitted environments and resources.

## 12. Persistence Boundary

The persistence boundary separates domain behavior from storage implementation.

```text
Domain / Application Modules
            |
            v
Repository / Persistence Abstractions
            |
            v
Persistence Implementation
            |
            v
Database / Persistent Store
```

The physical database architecture is intentionally deferred to Phase 1.9.

## 13. Background Processing

Long-running work shall not unnecessarily block interactive request handling.

```text
API Request
    |
    v
Validate + Create Operation
    |
    v
Enqueue / Schedule Work
    |
    v
Background Worker
    |
    +-------------------+
    |                   |
    v                   v
AI / Processing      Simulation / Report
    |                   |
    +---------+---------+
              |
              v
        Persist Result
              |
              v
        Operation Status
              |
              v
            Client
```

The exact asynchronous infrastructure is deferred to later design work.

## 14. Security Architecture Boundary

Security controls shall exist at multiple layers:

1. Frontend session/user context.
2. Backend authentication boundary.
3. Backend authorization boundary.
4. Module-level authorization checks where required.
5. Persistence access controls.
6. Integration credential protection.
7. Simulation authorization and isolation.
8. Audit logging.

Frontend controls shall improve user experience but shall never be the only authorization mechanism.

## 15. Observability Architecture

Observability shall be cross-cutting across the platform.

Major components should provide:

- Structured logs.
- Metrics.
- Health/readiness information.
- Correlation identifiers.
- Error information.
- Operation status.

The observability implementation shall avoid unnecessarily recording sensitive prompts, responses, credentials, or protected incident data.

## 16. Failure Isolation

The architecture shall isolate failures between major boundaries.

Examples:

- AI provider failure must not corrupt incident state.
- External integration failure must not corrupt existing evidence.
- Simulation failure must not terminate the core application.
- Background-job failure must remain observable and retryable where appropriate.
- One failed request must not terminate unrelated requests.
- Optional integrations may degrade without disabling core investigation workflows.

## 17. Deployment-Level Concept

The initial deployment may be represented conceptually as:

```text
                    +-------------------+
                    |     Web Client    |
                    +---------+---------+
                              |
                              v
                    +-------------------+
                    |   Backend App     |
                    |  Modular Monolith |
                    +----+---------+----+
                         |         |
             +-----------+         +-----------+
             |                                   |
             v                                   v
      +-------------+                    +---------------+
      | Persistent  |                    | AI Provider   |
      | Data Store  |                    |   External    |
      +-------------+                    +---------------+
             |
             |
             v
      +---------------+
      | Simulation   |
      | Engine       |
      +-------+-------+
              |
              v
      +---------------+
      | Controlled    |
      | Target Env    |
      +---------------+

External integrations connect through the backend integration boundary.
```

This is a logical deployment concept rather than a final infrastructure topology.

## 18. Architectural Evolution Strategy

The initial architecture shall optimize for simplicity, maintainability, and clear boundaries rather than premature distribution.

If future evidence demonstrates a need for decomposition, individual modules may be extracted into services based on concrete drivers such as:

- Independent scaling requirements.
- Strong security or isolation requirements.
- Independent deployment requirements.
- Resource-intensive processing.
- Organizational ownership boundaries.
- Availability or fault-isolation requirements.

Such extraction shall preserve existing domain and API boundaries where practical.

## 19. Architecture Decisions Deferred

The following decisions remain intentionally open for subsequent Phase 1 steps:

- Physical database technology and schema.
- Exact API framework and endpoint contracts.
- Authentication provider and implementation.
- Authorization implementation details.
- Background job technology.
- AI provider and model selection.
- Exact observability stack.
- External integration technologies.
- Simulation runtime and isolation technology.
- Container/orchestration strategy.
- Exact production deployment topology.
- Capacity and infrastructure sizing.

These decisions shall be resolved using the requirements and architectural boundaries established in this document.

## 20. Architecture Principles

1. Modular before distributed.
2. Evidence before speculation.
3. Human authority over consequential decisions.
4. Explicit trust boundaries.
5. Provider abstraction.
6. Failure isolation.
7. Observable operations.
8. Secure defaults.
9. Reproducible execution.
10. Clear ownership.
11. Minimal necessary complexity.
12. Evolution based on evidence rather than assumptions.

## 21. Architecture Scope

This document establishes the logical system architecture for SentinelAI. It defines component responsibilities, boundaries, major data and control flows, and architectural principles. Detailed persistence design, API contracts, security mechanisms, and implementation-specific infrastructure decisions will be defined in subsequent Phase 1 steps.
