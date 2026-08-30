# SentinelAI - Architecture Constraints & Quality Attributes

## 1. Purpose

This document defines the architectural constraints and quality attributes that shall guide the design and implementation of SentinelAI.

The purpose is to convert the previously established product, functional, security, observability, workflow, API, and technology requirements into explicit architectural qualities and constraints.

These requirements establish measurable or reviewable expectations for:

- Reliability.
- Availability.
- Performance.
- Scalability.
- Maintainability.
- Security.
- Observability.
- Testability.
- Extensibility.
- Usability.
- Resilience.
- Data integrity.
- Interoperability.

This document does not define implementation-specific infrastructure configuration or final production capacity targets unless explicitly stated.

---

## 2. Architectural Quality Model

SentinelAI shall prioritize the following qualities:

1. Correctness.
2. Security.
3. Reliability.
4. Observability.
5. Maintainability.
6. Testability.
7. Extensibility.
8. Performance.
9. Scalability.
10. Availability.
11. Data integrity.
12. Operational safety.
13. Usability.
14. Interoperability.

When qualities conflict, safety, security, correctness, and data integrity shall generally take precedence over convenience.

---

## 3. Architectural Constraints

The architecture shall preserve the following constraints:

1. SentinelAI shall initially use a modular monolith architecture.
2. PostgreSQL shall remain the authoritative persistent store for domain state.
3. Redis shall remain transient infrastructure rather than the primary source of truth.
4. Background jobs shall be isolated from synchronous HTTP request execution.
5. AI providers shall remain behind an application-level abstraction.
6. Simulation shall remain behind an explicit safety boundary.
7. External integrations shall remain behind adapter boundaries.
8. The frontend shall not access the database directly.
9. The frontend shall not directly access AI-provider credentials.
10. The frontend shall not directly control simulation execution.
11. Domain state shall be owned by the backend application.
12. Public APIs shall not expose persistence models directly.
13. Important lifecycle transitions shall be validated explicitly.
14. Authentication and authorization shall be enforced server-side.
15. Sensitive information shall be minimized in logs and telemetry.
16. Important actions shall remain auditable.
17. Long-running operations shall use asynchronous processing where appropriate.
18. AI output shall remain distinguishable from validated findings.
19. Production simulation shall not be treated as unrestricted command execution.
20. API contracts shall remain versioned and stable.

---

## 4. Correctness

### 4.1 Requirement

The system shall preserve domain correctness across all supported workflows.

Correctness includes:

- Valid lifecycle transitions.
- Valid resource relationships.
- Valid authorization decisions.
- Consistent persistence.
- Correct evidence associations.
- Correct operation states.
- Correct asynchronous job outcomes.

### 4.2 Architectural Implications

Business invariants shall be enforced inside controlled application or domain boundaries rather than relying solely on frontend behavior.

### 4.3 Acceptance Criteria

The architecture shall provide mechanisms to:

- Reject invalid state transitions.
- Reject invalid resource relationships.
- Prevent unauthorized modifications.
- Maintain transactional consistency where required.
- Detect invalid external input.

---

## 5. Security

### 5.1 Requirement

Security shall be a first-class architectural quality.

The system shall protect:

- User identity.
- Credentials.
- Incident information.
- Investigation data.
- Evidence.
- Integration configuration.
- Audit records.
- AI context.
- Simulation controls.

### 5.2 Architectural Implications

Security controls shall exist at system boundaries.

The architecture shall include:

- Authentication.
- Authorization.
- Least privilege.
- Input validation.
- Secret management.
- Secure transport.
- Data protection.
- Auditability.
- Rate limiting.
- Abuse controls.

### 5.3 Acceptance Criteria

Protected resources shall not be accessible solely because a user can reach the frontend.

Security-sensitive operations shall require explicit authorization.

---

## 6. Reliability

### 6.1 Requirement

SentinelAI shall remain reliable when individual operations or external dependencies fail.

### 6.2 Required Behavior

Failure of an optional dependency shall not unnecessarily make core incident-management functionality unavailable.

For example:

    AI Provider Failure
          |
          v
    AI Analysis Unavailable
          |
          +----> Incidents remain accessible
          +----> Evidence remains accessible
          +----> Investigations remain accessible

### 6.3 Acceptance Criteria

The architecture shall:

- Isolate external dependency failures.
- Provide explicit failure states.
- Support bounded retries.
- Preserve durable domain state.
- Avoid unnecessary cascading failures.

---

## 7. Availability

### 7.1 Requirement

Core SentinelAI functionality should remain available within the operational limits defined for the deployment.

### 7.2 Availability Priorities

Higher priority shall generally be given to:

1. Incident retrieval.
2. Incident creation and lifecycle management.
3. Investigation access.
4. Evidence access.
5. Core API availability.

Secondary capabilities include:

- AI analysis.
- Simulation.
- Report generation.
- External integrations.

### 7.3 Architectural Implication

Optional capabilities shall not become hidden hard dependencies for core incident-management workflows.

---

## 8. Performance

### 8.1 Requirement

The system shall provide responsive behavior for normal interactive operations.

Performance requirements shall distinguish between:

- Synchronous operations.
- Asynchronous operations.
- External-provider latency.
- Large evidence processing.
- Simulation execution.

### 8.2 Synchronous Operations

Interactive API operations should complete within a reasonable response window under normal operating conditions.

Long-running work shall not unnecessarily block HTTP requests.

### 8.3 Asynchronous Operations

Operations such as:

- AI analysis.
- Report generation.
- Simulation.
- Large-scale evidence processing.

shall use asynchronous processing where appropriate.

### 8.4 Performance Acceptance Criteria

The architecture shall provide mechanisms for measuring:

- Request latency.
- Database latency.
- Queue delay.
- Worker duration.
- External-provider latency.
- AI analysis duration.
- Simulation duration.

Exact production latency targets shall be defined after workload characterization.

---

## 9. Scalability

### 9.1 Requirement

SentinelAI shall support incremental scaling without requiring premature distributed-system complexity.

### 9.2 Scaling Dimensions

Potential scaling dimensions include:

- API requests.
- Concurrent users.
- Incident volume.
- Evidence volume.
- Background jobs.
- AI requests.
- Simulation executions.
- External integration events.

### 9.3 Architectural Strategy

The modular monolith shall initially scale vertically and horizontally where practical.

Background workers may scale independently from API processes when workload requires it.

### 9.4 Acceptance Criteria

The architecture shall avoid designs that require all workloads to scale together unnecessarily.

---

## 10. Maintainability

### 10.1 Requirement

The system shall be structured so that engineers can understand, modify, test, and extend it without unnecessary coupling.

### 10.2 Architectural Principles

Maintainability shall be supported through:

- Modular boundaries.
- Clear dependency direction.
- Explicit interfaces.
- Consistent naming.
- Shared contracts.
- Separation of domain and infrastructure concerns.
- Automated validation.

### 10.3 Acceptance Criteria

A change to one external provider should not require widespread changes to unrelated domain modules.

---

## 11. Modularity

SentinelAI modules shall have clear responsibilities.

Conceptually:

    Incident Module
          |
          +--> Incident lifecycle

    Investigation Module
          |
          +--> Investigation workflow

    Evidence Module
          |
          +--> Evidence processing

    AI Module
          |
          +--> AI analysis

    Simulation Module
          |
          +--> Controlled simulation

    Integration Module
          |
          +--> External systems

Modules shall communicate through defined application contracts rather than arbitrary internal access.

---

## 12. Extensibility

### 12.1 Requirement

The architecture shall allow future capabilities to be added without destabilizing existing functionality.

Potential extensions include:

- Additional AI providers.
- Additional monitoring integrations.
- Additional incident-management integrations.
- Additional simulation scenarios.
- Additional report formats.
- Additional notification channels.

### 12.2 Architectural Strategy

External capabilities shall use adapter or provider boundaries.

Conceptually:

    Core Application
          |
          v
    Stable Interface
       /       \
      v         v

Provider A Provider B

### 12.3 Acceptance Criteria

Adding a second provider should not require changing the core domain model solely because the provider is different.

---

## 13. Interoperability

### 13.1 Requirement

SentinelAI shall provide stable interfaces for external systems.

### 13.2 Requirements

The system shall support controlled integration through:

- Versioned APIs.
- External adapters.
- Webhooks where appropriate.
- Normalized internal representations.

### 13.3 Provider Isolation

External provider-specific formats shall be normalized at the integration boundary.

Core domain models shall not become dependent on provider-specific payload structures.

---

## 14. Data Integrity

### 14.1 Requirement

SentinelAI shall preserve the integrity of durable domain state.

### 14.2 Requirements

The architecture shall support:

- Transactional updates.
- Referential integrity.
- Explicit state transitions.
- Validation.
- Controlled mutation.
- Evidence provenance.

### 14.3 Source of Truth

PostgreSQL shall remain authoritative for durable domain state.

Transient systems shall not silently override authoritative domain state.

---

## 15. Evidence Integrity

Evidence shall preserve enough provenance to support trustworthy investigation.

Relevant metadata may include:

- Source.
- Source identifier.
- Observation timestamp.
- Ingestion timestamp.
- Evidence type.
- Processing status.
- Related incident.
- Related investigation.

AI interpretations shall remain distinguishable from original evidence.

---

## 16. Auditability

### 16.1 Requirement

Important security and domain actions shall remain traceable.

### 16.2 Audit Events

Potential events include:

- Authentication.
- Authorization failures.
- Incident lifecycle changes.
- Evidence modifications.
- Investigation changes.
- AI analysis requests.
- Simulation execution.
- Remediation decisions.
- Integration configuration.
- Administrative actions.

### 16.3 Acceptance Criteria

An authorized reviewer should be able to determine:

- Who performed an important action.
- What happened.
- When it happened.
- Which resource was affected.
- Whether it succeeded or failed.

---

## 17. Observability

SentinelAI shall provide:

- Logs.
- Metrics.
- Traces.
- Audit records.

Observability shall support:

- Troubleshooting.
- Incident investigation.
- Performance analysis.
- Reliability analysis.
- Security investigation.

Telemetry shall preserve correlation information where appropriate.

---

## 18. Traceability

Important operations shall remain traceable across boundaries.

Conceptually:

    API Request
         |
         v
    Application Operation
         |
         +----> Database
         |
         +----> Queue
         |       |
         |       v
         |     Worker
         |
         +----> AI Provider
         |
         +----> Simulation Engine

Correlation IDs, operation IDs, and trace context should be propagated where technically appropriate.

---

## 19. Testability

### 19.1 Requirement

Architectural boundaries shall support automated testing.

### 19.2 Testing Layers

The architecture should support:

1. Unit tests.
2. Domain tests.
3. Application-service tests.
4. API tests.
5. Integration tests.
6. Database tests.
7. Background-job tests.
8. AI-adapter tests.
9. Simulation tests.
10. Security tests.
11. End-to-end tests.

### 19.3 Acceptance Criteria

Core domain behavior shall be testable without requiring external production providers.

External dependencies should be replaceable with controlled test implementations.

---

## 20. Test Isolation

Tests shall not depend unnecessarily on:

- Production services.
- Real AI-provider calls.
- Real external integrations.
- Uncontrolled simulation environments.

External systems should be represented through mocks, fakes, stubs, or controlled test environments where appropriate.

---

## 21. Resilience

### 21.1 Requirement

The system shall tolerate expected transient failures without unnecessary data loss or cascading failure.

### 21.2 Resilience Mechanisms

Potential mechanisms include:

- Timeouts.
- Retries.
- Backoff.
- Idempotency.
- Circuit-breaking patterns where appropriate.
- Queue retry policies.
- Dead-letter handling.
- Graceful degradation.

### 21.3 Retry Safety

Retries shall not duplicate important side effects unintentionally.

Operations that can be retried shall have appropriate idempotency behavior.

---

## 22. Fault Isolation

The architecture shall isolate failures between:

- API and background workers.
- AI providers and core application.
- External integrations and domain services.
- Simulation engine and application.
- Optional reporting capabilities and core incident management.

A failure in one subsystem should not automatically corrupt unrelated state.

---

## 23. Graceful Degradation

The system should degrade gracefully when optional capabilities fail.

Examples:

| Failure                          | Expected Behavior                                                                      |
| -------------------------------- | -------------------------------------------------------------------------------------- |
| AI provider unavailable          | AI operation fails explicitly; core incident data remains accessible                   |
| External integration unavailable | Integration operation fails; existing internal data remains available                  |
| Report generation fails          | Incident and investigation data remain accessible                                      |
| Simulation unavailable           | Simulation capability unavailable; core application remains operational                |
| Telemetry backend unavailable    | Core operation should continue where safe; critical audit durability remains protected |

---

## 24. Asynchronous Processing

Long-running operations shall use controlled asynchronous execution.

The architecture shall provide:

- Operation identifiers.
- Job identifiers.
- Explicit operation states.
- Retry behavior.
- Timeout behavior.
- Cancellation behavior where supported.
- Result retrieval.
- Failure reporting.
- Observability.

---

## 25. Idempotency

Important externally triggered operations should support idempotency where repeated delivery is possible.

This is especially relevant to:

- Webhooks.
- Background jobs.
- External ingestion.
- Retryable commands.
- Report generation.
- AI analysis requests where duplicate execution is undesirable.

The final implementation shall define operation-specific idempotency strategies.

---

## 26. API Stability

The public API shall remain stable within its version.

The initial API shall use:

    /api/v1

Breaking changes shall require an explicit versioning decision.

API consumers shall not depend on:

- Database schemas.
- ORM types.
- Internal queue structures.
- Internal module paths.
- Provider-specific implementation details.

---

## 27. Backward Compatibility

Backward-compatible changes should be preferred where practical.

Examples include:

- Adding optional response fields.
- Adding new endpoints.
- Adding optional request fields.

Breaking changes require explicit review.

---

## 28. Configuration Management

Configuration shall be separated from application source code.

Configuration may include:

- Environment.
- Database connection.
- Redis connection.
- AI provider settings.
- Integration configuration.
- Feature controls.
- Operational thresholds.

Secrets shall not be stored directly in source-controlled configuration.

---

## 29. Deployment Portability

The architecture should remain deployable across suitable environments without unnecessary provider-specific coupling.

Docker shall provide a baseline packaging mechanism.

Deployment-specific infrastructure decisions shall remain outside the core domain architecture.

---

## 30. Resource Management

The system shall place reasonable bounds on resource-intensive operations.

This includes:

- Request payload size.
- AI request size.
- Queue workload.
- Simulation execution.
- Report generation.
- External ingestion.

Resource limits shall protect availability and reduce abuse risk.

---

## 31. Security and Quality Trade-Offs

When architectural qualities conflict, the following general priority should apply:

1. Safety.
2. Security.
3. Data integrity.
4. Correctness.
5. Reliability.
6. Auditability.
7. Observability.
8. Maintainability.
9. Performance.
10. Convenience.

This ordering is a guiding principle rather than an absolute rule for every engineering decision.

---

## 32. Architecture Review Requirements

Major architectural changes should be reviewed against:

- Product requirements.
- Functional requirements.
- Security requirements.
- Observability requirements.
- API contracts.
- Technology decisions.
- Quality attributes.
- Operational safety.

A change that violates an established architectural constraint should require an explicit architecture decision.

---

## 33. Quality Attribute Scenario Model

Quality attributes should eventually be expressed through measurable scenarios.

Example:

### Availability Scenario

**Stimulus:** AI provider becomes unavailable.

**Response:** AI analysis operations enter an explicit failure state while core incident and investigation functionality remains available.

**Measure:** Core incident APIs continue operating within their defined availability target.

### Performance Scenario

**Stimulus:** Normal incident retrieval request.

**Response:** API returns within the defined latency target.

**Measure:** Measured request latency remains within the agreed threshold under expected load.

### Security Scenario

**Stimulus:** User attempts to access an unauthorized incident.

**Response:** Request is denied.

**Measure:** No protected incident information is returned.

### Resilience Scenario

**Stimulus:** Background worker temporarily loses access to an external dependency.

**Response:** Job enters controlled retry or failure state.

**Measure:** No duplicate or corrupted domain state is created.

---

## 34. Capacity Planning

Capacity requirements shall be established before production deployment.

Planning should consider:

- Expected users.
- Concurrent users.
- Incidents per day.
- Evidence volume.
- Event ingestion rate.
- AI analysis frequency.
- Simulation frequency.
- Report generation volume.
- Database growth.
- Queue depth.
- Storage requirements.

The initial project shall not claim production-scale capacity without measurement.

---

## 35. Performance Measurement

Performance shall be measured rather than assumed.

Relevant measurements include:

- API response latency.
- Database query latency.
- Queue wait time.
- Worker processing time.
- AI provider latency.
- External integration latency.
- Simulation execution duration.
- Report generation duration.

Performance optimization should be evidence-driven.

---

## 36. Scalability Review

Scalability decisions shall be based on observed bottlenecks.

Before introducing distributed services, the team should evaluate:

- Application CPU utilization.
- Memory usage.
- Database bottlenecks.
- Queue pressure.
- External dependency limits.
- Worker utilization.
- Request concurrency.

Premature service decomposition shall be avoided unless justified by evidence.

---

## 37. Maintainability Review

Maintainability shall be reviewed through:

- Module boundaries.
- Dependency direction.
- Code duplication.
- Test coverage.
- API coupling.
- Infrastructure coupling.
- Provider coupling.
- Documentation quality.

The architecture should make common changes local rather than cross-cutting.

---

## 38. Quality Attribute Acceptance Criteria

The architecture shall be considered sufficiently defined when:

1. Correctness requirements are explicit.
2. Security requirements are explicit.
3. Reliability requirements are explicit.
4. Availability expectations are established.
5. Performance considerations are defined.
6. Scalability strategy is defined.
7. Maintainability expectations are defined.
8. Modularity requirements are defined.
9. Extensibility requirements are defined.
10. Interoperability requirements are defined.
11. Data-integrity requirements are defined.
12. Auditability is preserved.
13. Observability is preserved.
14. Testability requirements are defined.
15. Resilience requirements are defined.
16. Fault isolation is addressed.
17. Graceful degradation is addressed.
18. Asynchronous processing requirements are defined.
19. Idempotency is addressed.
20. API stability is addressed.
21. Configuration and secret separation is addressed.
22. Resource management is addressed.
23. Quality trade-offs are documented.
24. Capacity planning is explicitly deferred until justified.
25. Performance measurement is evidence-driven.
26. Scalability decisions are evidence-driven.
27. The requirements can guide detailed architecture and implementation.

---

## 39. Deferred Quality Decisions

The following details shall be finalized during later architecture, implementation, testing, and deployment stages:

- Exact latency targets.
- Exact throughput targets.
- Exact availability targets.
- Exact SLOs.
- Exact RPO.
- Exact RTO.
- Production concurrency limits.
- Production storage capacity.
- Worker scaling limits.
- AI-provider rate limits.
- Simulation capacity.
- Exact performance benchmarks.
- Exact load-testing thresholds.
- Exact disaster-recovery implementation.

These values shall be based on actual workload and deployment requirements rather than unsupported assumptions.

---

## 40. Scope

This document establishes the architecture-level constraints and quality attributes for SentinelAI.

It translates the previously established requirements into explicit expectations for correctness, security, reliability, availability, performance, scalability, maintainability, modularity, extensibility, interoperability, data integrity, auditability, observability, testability, resilience, fault isolation, graceful degradation, asynchronous processing, API stability, and operational safety.

It does not define detailed implementation code, production infrastructure configuration, exact capacity targets, or deployment-specific operational parameters.

Those decisions shall be established during subsequent architecture and implementation phases.
