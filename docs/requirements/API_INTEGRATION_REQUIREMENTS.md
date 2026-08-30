# SentinelAI - API & Integration Requirements

## 1. Purpose

This document defines the API and integration requirements for SentinelAI. It establishes the external application boundary, API conventions, resource interactions, error handling, authentication and authorization boundaries, asynchronous operations, AI-provider integration, simulation-engine integration, external-system integration, versioning, rate limiting, and request traceability.

The API architecture shall expose stable application capabilities without exposing internal persistence or implementation details directly to clients.

---

## 2. API Architecture Principles

SentinelAI APIs shall follow these principles:

1. APIs expose application capabilities rather than database tables.
2. Clients shall not access persistence infrastructure directly.
3. Domain ownership shall remain inside the backend application boundary.
4. API contracts shall be explicit and versionable.
5. Authentication and authorization shall be enforced at the API boundary and within sensitive application operations.
6. Errors shall be predictable and machine-readable.
7. Long-running operations shall use asynchronous operation tracking where appropriate.
8. External integrations shall be isolated behind integration boundaries.
9. AI-provider APIs shall never receive unrestricted access to the application database.
10. Simulation operations shall require explicit authorization and safety validation.
11. Important requests shall be traceable through correlation identifiers.
12. API behavior shall be observable through structured logging and metrics.

---

## 3. API Style

The initial SentinelAI application API shall use HTTP-based APIs with JSON representations for synchronous application operations.

The API design should follow resource-oriented conventions where appropriate while allowing action-oriented endpoints for operations that represent commands rather than CRUD resources.

Examples of command-style operations include:

- Starting an AI analysis.
- Starting a simulation execution.
- Generating an incident report.
- Transitioning an incident lifecycle state.
- Triggering supported data ingestion.

The API shall not expose internal ORM models or database-specific structures as public contracts.

---

## 4. API Versioning

Publicly consumed API contracts shall support explicit versioning.

The initial API shall use a major-version boundary such as /api/v1.

Breaking changes shall require a new major API version.

Backward-compatible additions should not unnecessarily require a new major version.

Deprecated API versions shall have a defined migration and retirement process before removal.

---

## 5. Core API Resource Areas

The API shall conceptually expose the following resource areas:

| Resource Area  | Responsibility                                              |
| -------------- | ----------------------------------------------------------- |
| Incidents      | Incident creation, retrieval, updates, lifecycle management |
| Participants   | Incident responder and responsibility assignments           |
| Services       | System context and service information                      |
| Dependencies   | Service dependency relationships                            |
| Events         | Incident-related events and timeline information            |
| Evidence       | Evidence retrieval, association, and provenance             |
| Investigations | Investigation lifecycle and findings                        |
| Hypotheses     | Root-cause hypotheses and validation state                  |
| AI Analysis    | AI-assisted investigation execution and results             |
| Remediation    | Recommendations and human decisions                         |
| Reports        | Incident-report generation and retrieval                    |
| Simulations    | Scenarios and controlled executions                         |
| Integrations   | External-system configuration and status                    |
| Operations     | Asynchronous operation status                               |

---

## 6. Incident API Requirements

The API shall support authorized users to:

1. Create an incident.
2. Retrieve an incident.
3. Update permitted incident metadata.
4. List incidents using supported filters.
5. Transition an incident through valid lifecycle states.
6. Retrieve incident participants.
7. Add or remove authorized incident participants.
8. Retrieve incident timeline information.
9. Retrieve related evidence and investigation information.
10. Retrieve incident reports.

Lifecycle transitions shall be validated against the domain state machine rather than accepting arbitrary state values.

---

## 7. Investigation API Requirements

The API shall support authorized users to:

1. Create or initialize an investigation for an incident.
2. Retrieve investigation state.
3. Retrieve investigation findings.
4. Create or record supported investigation findings.
5. Retrieve root-cause hypotheses.
6. Retrieve evidence associated with hypotheses.
7. Record authorized validation decisions.
8. Record investigation comments or collaboration information where supported.

Investigation APIs shall preserve attribution for human-generated decisions and findings.

---

## 8. Evidence and Timeline API Requirements

The API shall support retrieval and association of incident evidence and events.

Supported operations shall include:

- Event retrieval.
- Timeline retrieval.
- Evidence retrieval.
- Evidence provenance retrieval.
- Incident-to-event association.
- Incident-to-evidence association.
- Hypothesis-to-evidence association.

Timeline responses should provide deterministic ordering based on event timestamps and defined secondary ordering rules.

Large evidence payloads should use appropriate content references rather than unnecessarily returning large objects in standard list responses.

---

## 9. AI Analysis API Requirements

AI analysis shall be exposed as an application capability rather than direct provider access.

The API shall support:

1. Requesting AI-assisted analysis for an authorized investigation.
2. Creating a durable AI-analysis operation record.
3. Returning operation status for asynchronous analysis.
4. Retrieving validated AI-generated findings or hypotheses.
5. Retrieving supporting evidence references.
6. Retrieving confidence and validation state where available.
7. Reporting provider or execution failures safely.

The API shall not present an AI-generated hypothesis as a verified root cause unless the appropriate validation state has been established.

Provider-specific request and response formats shall remain behind the AI integration boundary.

---

## 10. AI Provider Integration Boundary

The backend shall communicate with AI providers through a dedicated application and integration boundary.

The AI provider shall receive only the minimum context required for the requested analysis.

The AI provider shall not receive:

- Direct database credentials.
- Unrestricted database access.
- Unrestricted infrastructure access.
- Authorization to modify application state directly.

AI responses shall be treated as untrusted external input.

AI-generated output shall be validated against the expected application structure before being persisted or presented as structured application data.

Provider failures, timeouts, malformed responses, and rate limits shall be handled explicitly.

---

## 11. Simulation API Requirements

The API shall support controlled simulation capabilities.

Authorized users shall be able to:

1. Retrieve available simulation scenarios.
2. Retrieve scenario details.
3. Request a simulation execution.
4. Retrieve execution status.
5. Retrieve execution results and associated events.
6. Associate simulation output with an incident where appropriate.

Simulation execution shall normally be asynchronous.

Simulation APIs shall enforce authorization, parameter validation, environment restrictions, safety constraints, and execution-state validation before a scenario is started.

The API shall not expose unrestricted arbitrary infrastructure commands through simulation endpoints.

---

## 12. Simulation Engine Integration Boundary

The simulation engine shall communicate with the backend through a defined integration contract.

The backend shall remain responsible for:

- Authorization.
- Scenario validation.
- Execution request creation.
- Operation tracking.
- Association with incidents.
- Auditability.
- User-visible execution state.

The simulation engine shall remain responsible for executing approved simulation behavior within its defined boundary.

Simulation results and events shall return through controlled application interfaces rather than directly modifying unrelated domain state.

---

## 13. External Integration Requirements

SentinelAI shall be designed to integrate with external operational systems without coupling the core domain to a specific provider.

Potential integration categories include:

- Monitoring systems.
- Logging platforms.
- Alerting systems.
- Deployment systems.
- Source-control systems.
- Incident-management systems.
- Metrics platforms.

External data shall be normalized into internal representations before being used by core investigation workflows.

Provider-specific schemas shall remain inside integration adapters.

---

## 14. Integration Adapter Pattern

External integrations should follow a common adapter boundary.

Conceptual flow:

    External Provider
           |
           v
    Integration Adapter
           |
           v
    Normalization / Validation
           |
           v
    Internal Application Model
           |
           v
    Incident / Evidence / Event Domain

An integration adapter shall not directly modify arbitrary persistence records outside its defined application interface.

---

## 15. Inbound Webhooks and Events

Where external providers support webhooks or event delivery, SentinelAI may expose dedicated integration endpoints.

Inbound events shall support:

- Authentication or signature verification where supported.
- Source identification.
- Payload validation.
- Idempotency or deduplication.
- Correlation information.
- Timestamp handling.
- Error reporting.
- Auditability for important processing actions.

Malformed or unauthorized external events shall not be allowed to modify core domain state.

---

## 16. Asynchronous Operations

Long-running operations shall use durable operation tracking.

Examples include:

- AI analysis.
- Simulation execution.
- Large evidence ingestion.
- External data synchronization.
- Report generation.

The API should return an operation identifier when an operation cannot complete within a normal synchronous request lifecycle.

Clients shall be able to retrieve operation status.

Conceptual operation states include:

    Queued
       |
       v
    Running
       |
       +----------------+
       |                |
       v                v
    Succeeded         Failed
       |
       v
    Completed

Cancellation support may be introduced where the underlying operation can be safely cancelled.

---

## 17. Error Handling

API errors shall use a consistent machine-readable structure.

The error representation should include:

- Stable error code.
- Human-readable message.
- HTTP status.
- Request or correlation identifier.
- Optional structured details.

The API shall avoid exposing:

- Stack traces.
- Database credentials.
- Internal secrets.
- Provider credentials.
- Sensitive infrastructure information.
- Raw internal exception details.

Expected categories include:

| Category            | Example                                         |
| ------------------- | ----------------------------------------------- |
| Validation          | Invalid request parameters                      |
| Authentication      | Missing or invalid credentials                  |
| Authorization       | Insufficient permissions                        |
| Not Found           | Resource does not exist                         |
| Conflict            | Invalid state transition or duplicate operation |
| Rate Limited        | Request threshold exceeded                      |
| External Dependency | Provider failure                                |
| Internal            | Unexpected server failure                       |

---

## 18. Authentication and Authorization Boundary

API requests shall be authenticated according to the selected identity architecture.

Authorization shall be enforced according to the user's roles and permissions.

Authentication identifies the caller; authorization determines what that caller may perform.

Sensitive operations such as simulation execution, remediation decisions, integration configuration, and privileged investigation actions shall require appropriate authorization.

Authorization decisions shall not rely solely on frontend controls.

---

## 19. Idempotency

Operations where duplicate requests could create duplicate state shall support idempotency where appropriate.

Important candidates include:

- Webhook processing.
- External event ingestion.
- AI-analysis requests.
- Simulation execution requests.
- Report generation.

An idempotency mechanism shall define the request scope and behavior when the same operation is submitted repeatedly.

---

## 20. Pagination, Filtering, and Sorting

Collection APIs shall support pagination when result sets can become large.

Supported query capabilities should include relevant:

- Status filtering.
- Severity filtering.
- Service filtering.
- Time-range filtering.
- Source filtering.
- Sorting.

Pagination contracts shall be deterministic and should avoid silently returning unbounded datasets.

Exact pagination strategy may be finalized during API implementation.

---

## 21. Rate Limiting and Abuse Protection

API access shall support rate limiting appropriate to endpoint sensitivity and workload.

Stricter controls should apply to resource-intensive operations such as:

- AI analysis.
- Simulation execution.
- Large data ingestion.
- Report generation.

Rate-limit responses shall use a predictable error representation.

Rate limiting shall not replace authorization or input validation.

---

## 22. Request Traceability

API requests should carry or receive a correlation or request identifier.

The identifier should be propagated through relevant backend operations and integration calls.

Correlation identifiers should connect:

    Client Request
         |
         v
        API
         |
         v
    Application Service
         |
         v
    Background Operation / Integration
         |
         v
    Database / External Provider
         |
         v
    Logs / Audit Records

This enables incident investigation and operational troubleshooting.

---

## 23. Timeouts and Retries

External calls shall use bounded timeouts.

Retries shall be applied selectively and only where the operation is safe to retry.

Retry behavior should use:

- Bounded retry counts.
- Appropriate backoff.
- Idempotency where necessary.
- Clear failure classification.

The system shall avoid retry storms and unbounded retry loops.

---

## 24. Integration Failure Isolation

Failure of an external integration should not unnecessarily make unrelated SentinelAI capabilities unavailable.

Examples:

- AI provider outage should not prevent incident browsing.
- Monitoring-provider outage should not prevent access to previously stored incidents.
- Simulation-engine failure should not corrupt incident state.
- Report-generation failure should not prevent investigation retrieval.

Integration failures shall be observable and represented through appropriate operation or integration status.

---

## 25. API Security Requirements

API communication shall use secure transport in production environments.

The API shall validate incoming input before processing.

The API shall enforce authorization on every protected operation.

Sensitive information shall not be written into ordinary application logs unnecessarily.

Secrets shall be managed outside normal API payloads and source-controlled configuration.

External integration credentials shall be protected according to the security architecture defined in the subsequent security requirements phase.

---

## 26. Contract Validation

API request and response contracts shall be validated at the application boundary.

Validation shall cover:

- Required fields.
- Data types.
- Enumerated values.
- Length limits.
- Range constraints.
- Resource identifiers.
- Supported state transitions.
- Security-sensitive parameters.

Invalid input shall fail before unsafe or invalid domain operations occur.

---

## 27. API Documentation

The API shall have machine-readable and human-readable documentation sufficient for frontend and integration development.

The implementation should use a standard API description format where appropriate.

API documentation should describe:

- Endpoints.
- Authentication requirements.
- Request schemas.
- Response schemas.
- Error responses.
- Authorization requirements.
- Async operation behavior.
- Pagination and filtering.
- Versioning.

---

## 28. API Observability

API operations should expose:

- Request counts.
- Error counts.
- Latency.
- Status-code distribution.
- Rate-limit events.
- External dependency latency.
- Background operation state.

Logs should include correlation identifiers and sufficient structured context to support troubleshooting without exposing sensitive information.

---

## 29. Deferred Implementation Decisions

The following implementation-specific decisions remain subject to later design and implementation work:

- Exact HTTP framework configuration.
- Exact authentication mechanism.
- Exact authorization library.
- API schema and validation library.
- API documentation tooling.
- Exact pagination implementation.
- Exact rate-limiting technology.
- API gateway or reverse-proxy topology.
- Webhook infrastructure.
- Background job infrastructure.
- Exact external providers.

These decisions shall be selected based on the requirements and architecture already established.

---

## 30. API Design Principles

1. Stable explicit contracts.
2. Application boundary over database exposure.
3. Secure-by-default operations.
4. Predictable errors.
5. Explicit asynchronous operation handling.
6. Idempotency for duplicate-prone operations.
7. Provider isolation through adapters.
8. AI output treated as untrusted input.
9. Simulation execution treated as privileged behavior.
10. Correlation and observability by design.
11. Versioned external contracts.
12. Failure isolation across integrations.

---

## 31. Scope

This document establishes the API and integration requirements for SentinelAI. It defines API boundaries, resource areas, integration contracts, asynchronous operations, error handling, security boundaries, idempotency, pagination, rate limiting, traceability, external-provider isolation, and deferred implementation decisions.

Exact endpoint schemas, framework configuration, provider implementations, and infrastructure details will be finalized during implementation.
