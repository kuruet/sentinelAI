# SentinelAI - API Contract & Endpoint Specification

## 1. Purpose

This document defines the conceptual API contract for SentinelAI.

It establishes the external HTTP API boundary, resource-oriented endpoint structure, request and response expectations, validation behavior, error conventions, asynchronous operation handling, authentication expectations, and traceability requirements.

The API contract is derived from the product vision, functional requirements, domain model, and core workflows.

This document defines the intended API behavior and contract. It does not define framework-specific controller implementations, database queries, or infrastructure configuration.

---

## 2. API Design Principles

The SentinelAI API shall follow these principles:

1. APIs shall expose business capabilities rather than database tables.
2. Resources shall have stable identifiers.
3. API contracts shall use predictable resource-oriented semantics.
4. Request and response schemas shall be explicit.
5. Authentication and authorization shall be enforced at the API boundary.
6. Validation shall occur before domain operations are executed.
7. Errors shall use predictable machine-readable representations.
8. Long-running operations shall use asynchronous operation resources.
9. API responses shall not expose internal persistence structures.
10. External provider-specific representations shall remain behind integration boundaries.
11. Important requests shall support correlation and traceability.
12. API versioning shall be explicit.
13. Sensitive information shall not be returned unnecessarily.
14. API behavior shall remain consistent across frontend and external clients.

---

## 3. API Base Path

The conceptual API shall use a versioned base path:

    /api/v1

All externally exposed application endpoints shall belong to the versioned API namespace.

Future incompatible API changes shall use a new API version rather than silently changing existing contracts.

---

## 4. Core Resources

The primary API resources are:

| Resource              | Purpose                                         |
| --------------------- | ----------------------------------------------- |
| Incidents             | Manage incident lifecycle and incident context  |
| Investigations        | Manage incident investigations                  |
| Evidence              | Manage and retrieve investigation evidence      |
| Events                | Manage incident timeline events                 |
| Services              | Represent system services                       |
| Dependencies          | Represent service relationships                 |
| Hypotheses            | Manage candidate root-cause hypotheses          |
| Findings              | Represent validated investigation conclusions   |
| AI Analyses           | Request and retrieve AI-assisted analysis       |
| Recommendations       | Manage remediation recommendations              |
| Remediation Decisions | Record decisions on recommendations             |
| Simulation Scenarios  | Manage controlled simulation scenarios          |
| Simulation Executions | Execute and inspect simulations                 |
| Reports               | Generate and retrieve incident reports          |
| Integrations          | Manage external system integrations             |
| Operations            | Track asynchronous operations                   |
| Audit Records         | Expose authorized operational audit information |

---

## 5. Common Resource Conventions

Resources shall generally expose:

- `id`
- `createdAt`
- `updatedAt` where applicable

Resources with lifecycle state shall expose a controlled `status` or equivalent state field.

Resources associated with other resources shall use stable identifiers.

Display names shall not be treated as resource identity.

---

## 6. Request Identification

Clients should provide a request correlation identifier where supported.

Conceptually:

    X-Correlation-Id: <identifier>

If a correlation identifier is not provided, the server may generate one.

The correlation identifier shall be propagated through relevant application operations and logs.

---

## 7. Idempotency

Operations that may be retried shall support idempotency where appropriate.

Conceptually:

    Idempotency-Key: <unique-key>

Idempotency is particularly important for:

- External webhook ingestion.
- Event ingestion.
- AI analysis requests.
- Simulation execution requests.
- Report generation.
- Other retryable commands.

Repeated requests using the same valid idempotency key shall not unintentionally create duplicate domain state.

---

## 8. Incident Endpoints

### Create Incident

    POST /api/v1/incidents

Purpose:

Create a new incident.

Request conceptually contains:

- Title.
- Description.
- Severity.
- Detection time where available.
- Source information where available.

Response:

- Created incident resource.
- Stable incident identifier.
- Initial lifecycle state.
- Creation metadata.

Expected success:

    201 Created

---

### List Incidents

    GET /api/v1/incidents

Purpose:

Retrieve incidents available to the authorized user.

Supported query concepts may include:

- Status.
- Severity.
- Service.
- Environment.
- Time range.
- Pagination.
- Sorting.

Expected success:

    200 OK

---

### Get Incident

    GET /api/v1/incidents/{incidentId}

Purpose:

Retrieve a single incident.

Expected success:

    200 OK

Possible failures:

- `404 Not Found`
- `403 Forbidden`

---

### Update Incident

    PATCH /api/v1/incidents/{incidentId}

Purpose:

Update permitted incident attributes.

Lifecycle transitions shall use explicit domain validation.

Expected success:

    200 OK

---

### Transition Incident

    POST /api/v1/incidents/{incidentId}/transitions

Purpose:

Request an explicit incident lifecycle transition.

Request conceptually contains:

- Target state.
- Optional reason.

The server shall validate whether the transition is permitted.

Expected success:

    200 OK

Possible failure:

    409 Conflict

when the requested lifecycle transition is invalid.

---

## 9. Investigation Endpoints

### Create Investigation

    POST /api/v1/incidents/{incidentId}/investigations

Purpose:

Initialize an investigation for an incident.

Expected success:

    201 Created

---

### List Investigations

    GET /api/v1/incidents/{incidentId}/investigations

Purpose:

Retrieve investigations associated with an incident.

Expected success:

    200 OK

---

### Get Investigation

    GET /api/v1/investigations/{investigationId}

Purpose:

Retrieve investigation state and relevant investigation metadata.

Expected success:

    200 OK

---

### Update Investigation

    PATCH /api/v1/investigations/{investigationId}

Purpose:

Update permitted investigation information.

Expected success:

    200 OK

---

### Transition Investigation

    POST /api/v1/investigations/{investigationId}/transitions

Purpose:

Request an investigation lifecycle transition.

The server shall validate transition rules defined by the domain workflow.

---

## 10. Evidence Endpoints

### Add Evidence

    POST /api/v1/incidents/{incidentId}/evidence

Purpose:

Associate evidence with an incident.

Request conceptually contains:

- Evidence type.
- Source.
- Observation time.
- Content or content reference.
- Provenance metadata.

Expected success:

    201 Created

---

### List Incident Evidence

    GET /api/v1/incidents/{incidentId}/evidence

Purpose:

Retrieve evidence associated with an incident.

Supported filtering may include:

- Evidence type.
- Source.
- Service.
- Time range.
- Provenance.
- Investigation association.

---

### Get Evidence

    GET /api/v1/evidence/{evidenceId}

Purpose:

Retrieve a specific evidence record.

---

### Associate Evidence

    POST /api/v1/evidence/{evidenceId}/associations

Purpose:

Associate existing evidence with an investigation, hypothesis, finding, event, or other supported domain concept.

The server shall validate the target relationship.

---

## 11. Event and Timeline Endpoints

### Add Event

    POST /api/v1/incidents/{incidentId}/events

Purpose:

Add an event relevant to an incident timeline.

Request conceptually contains:

- Event type.
- Occurrence timestamp.
- Source.
- Description or payload reference.
- Related service or component.
- Provenance.

---

### List Events

    GET /api/v1/incidents/{incidentId}/events

Purpose:

Retrieve incident events.

Events shall support deterministic ordering.

---

### Get Timeline

    GET /api/v1/incidents/{incidentId}/timeline

Purpose:

Retrieve the reconstructed incident timeline.

The timeline response shall preserve event provenance and occurrence timestamps.

---

## 12. Service Endpoints

### List Services

    GET /api/v1/services

Purpose:

Retrieve services known to SentinelAI.

Supported filtering may include:

- Environment.
- Owner.
- Name.

---

### Get Service

    GET /api/v1/services/{serviceId}

Purpose:

Retrieve service information.

---

### List Service Dependencies

    GET /api/v1/services/{serviceId}/dependencies

Purpose:

Retrieve dependency relationships for a service.

---

## 13. Dependency Endpoints

### Create Dependency

    POST /api/v1/dependencies

Purpose:

Create or register a supported dependency relationship.

Request conceptually contains:

- Source service or component.
- Target service or component.
- Dependency type.
- Optional criticality.

---

### Get Dependency

    GET /api/v1/dependencies/{dependencyId}

Purpose:

Retrieve a dependency relationship.

---

## 14. Hypothesis Endpoints

### Create Hypothesis

    POST /api/v1/investigations/{investigationId}/hypotheses

Purpose:

Create a candidate root-cause hypothesis.

A hypothesis may originate from a human investigator or system-generated analysis.

---

### List Hypotheses

    GET /api/v1/investigations/{investigationId}/hypotheses

Purpose:

Retrieve hypotheses associated with an investigation.

---

### Get Hypothesis

    GET /api/v1/hypotheses/{hypothesisId}

Purpose:

Retrieve a hypothesis and its validation state.

---

### Transition Hypothesis

    POST /api/v1/hypotheses/{hypothesisId}/transitions

Purpose:

Request a hypothesis lifecycle transition.

The server shall validate:

- Current state.
- Requested target state.
- Authorization.
- Required evidence or validation conditions.

---

## 15. Finding Endpoints

### Create Finding

    POST /api/v1/investigations/{investigationId}/findings

Purpose:

Record an investigation finding.

Findings shall remain distinguishable from unvalidated hypotheses.

---

### List Findings

    GET /api/v1/investigations/{investigationId}/findings

Purpose:

Retrieve findings associated with an investigation.

---

### Get Finding

    GET /api/v1/findings/{findingId}

Purpose:

Retrieve a specific finding and relevant evidence references.

---

## 16. AI Analysis Endpoints

### Request AI Analysis

    POST /api/v1/investigations/{investigationId}/ai-analyses

Purpose:

Request AI-assisted analysis for an investigation.

Request conceptually contains:

- Analysis type.
- Relevant context selection.
- Optional analysis parameters.

Expected success:

    202 Accepted

Response shall identify the asynchronous operation and analysis resource where appropriate.

---

### Get AI Analysis

    GET /api/v1/ai-analyses/{analysisId}

Purpose:

Retrieve the current state and result of an AI analysis.

Possible states include:

- Queued.
- Running.
- Completed.
- Failed.

---

### Get AI Analysis Operation

    GET /api/v1/operations/{operationId}

Purpose:

Retrieve asynchronous operation status associated with AI analysis.

---

## 17. AI Boundary Rules

The API shall enforce the following principles:

1. Clients cannot directly mark AI output as a confirmed root cause.
2. AI-generated hypotheses shall identify their origin.
3. AI results shall pass application-level validation.
4. AI providers shall not directly mutate core domain resources.
5. Sensitive or unnecessary information shall not be sent to AI providers.
6. AI analysis failures shall not make the incident unavailable.
7. Provider-specific response formats shall not become public API contracts.

---

## 18. Recommendation Endpoints

### Create Recommendation

    POST /api/v1/investigations/{investigationId}/recommendations

Purpose:

Create a remediation recommendation.

---

### List Recommendations

    GET /api/v1/investigations/{investigationId}/recommendations

Purpose:

Retrieve investigation recommendations.

---

### Get Recommendation

    GET /api/v1/recommendations/{recommendationId}

Purpose:

Retrieve a recommendation.

---

## 19. Remediation Decision Endpoints

### Record Decision

    POST /api/v1/recommendations/{recommendationId}/decisions

Purpose:

Record an authorized decision regarding a recommendation.

Supported decisions conceptually include:

- Accepted.
- Rejected.
- Deferred.
- Modified.

The response shall preserve the decision identity and timestamp.

---

### List Decisions

    GET /api/v1/recommendations/{recommendationId}/decisions

Purpose:

Retrieve decision history.

---

## 20. Simulation Scenario Endpoints

### List Scenarios

    GET /api/v1/simulation/scenarios

Purpose:

Retrieve authorized simulation scenarios.

---

### Get Scenario

    GET /api/v1/simulation/scenarios/{scenarioId}

Purpose:

Retrieve scenario metadata and supported parameters.

---

## 21. Simulation Execution Endpoints

### Start Simulation

    POST /api/v1/simulation/executions

Purpose:

Start a controlled simulation execution.

Request conceptually contains:

- Scenario identifier.
- Target environment.
- Approved parameters.

Expected success:

    202 Accepted

The response shall identify the simulation execution and asynchronous operation.

---

### Get Simulation Execution

    GET /api/v1/simulation/executions/{executionId}

Purpose:

Retrieve simulation execution status and results.

Possible states include:

- Created.
- Validating.
- Running.
- Completed.
- Failed.

---

### Cancel Simulation

    POST /api/v1/simulation/executions/{executionId}/cancel

Purpose:

Request cancellation where supported by the execution environment.

Cancellation shall be subject to authorization and execution-state validation.

---

## 22. Simulation Safety API Rules

The API shall enforce:

1. Authorization before simulation execution.
2. Valid scenario identity.
3. Valid target environment.
4. Scenario preconditions.
5. Resource constraints.
6. Execution time constraints.
7. Approved parameter boundaries.
8. Explicit simulation provenance.
9. Observable execution status.

The API shall not expose an unrestricted arbitrary command-execution interface.

---

## 23. Report Endpoints

### Request Report

    POST /api/v1/investigations/{investigationId}/reports

Purpose:

Request generation of an incident report.

Expected success:

    202 Accepted

---

### List Reports

    GET /api/v1/investigations/{investigationId}/reports

Purpose:

Retrieve reports generated for an investigation.

---

### Get Report

    GET /api/v1/reports/{reportId}

Purpose:

Retrieve report metadata and report content where authorized.

---

## 24. Integration Endpoints

### List Integrations

    GET /api/v1/integrations

Purpose:

Retrieve configured integrations visible to the authorized user.

Secrets shall never be returned in API responses.

---

### Create Integration

    POST /api/v1/integrations

Purpose:

Create an authorized external integration configuration.

Sensitive credentials shall be accepted and handled through secure application mechanisms.

---

### Get Integration

    GET /api/v1/integrations/{integrationId}

Purpose:

Retrieve integration metadata without exposing secrets.

---

### Update Integration

    PATCH /api/v1/integrations/{integrationId}

Purpose:

Update permitted integration configuration.

---

### Delete Integration

    DELETE /api/v1/integrations/{integrationId}

Purpose:

Remove an integration configuration.

---

## 25. External Ingestion Endpoints

### Receive External Event

    POST /api/v1/ingestion/events

Purpose:

Receive supported external events or webhook data.

The ingestion boundary shall:

1. Authenticate or verify the source.
2. Validate payload structure.
3. Normalize provider-specific data.
4. Deduplicate when required.
5. Preserve provenance.
6. Associate the resulting internal event or evidence.

---

### Receive External Evidence

    POST /api/v1/ingestion/evidence

Purpose:

Receive supported external evidence.

The endpoint shall preserve source and provenance information.

---

## 26. Operation Endpoints

### Get Operation

    GET /api/v1/operations/{operationId}

Purpose:

Retrieve the status of an asynchronous operation.

Possible states include:

- Queued.
- Running.
- Succeeded.
- Failed.

The response may contain:

- Operation identifier.
- Operation type.
- Status.
- Created timestamp.
- Started timestamp.
- Completed timestamp.
- Failure information where appropriate.
- Related resource identifier.

---

## 27. Health Endpoint

### Health Check

    GET /api/v1/health

Purpose:

Provide application-level health information.

The health endpoint shall not expose sensitive internal information.

Expected success:

    200 OK

A separate readiness mechanism may be implemented at infrastructure level.

---

## 28. Authentication

Protected endpoints shall require authentication.

The exact authentication mechanism shall be finalized during security architecture.

Conceptually, authenticated requests shall establish:

- User identity.
- Authentication context.
- Relevant authorization context.

Unauthenticated access to protected resources shall return:

    401 Unauthorized

---

## 29. Authorization

Authorization shall be enforced at the API boundary and application layer.

Authorization decisions may depend on:

- User identity.
- User role.
- Resource ownership.
- Service ownership.
- Environment.
- Requested operation.
- Incident participation.

Insufficient permissions shall return:

    403 Forbidden

Authorization shall not rely solely on frontend controls.

---

## 30. Validation

API requests shall be validated before business operations execute.

Validation may include:

- Required fields.
- Field types.
- Length constraints.
- Enum values.
- Identifier format.
- State transition validity.
- Resource existence.
- Relationship validity.
- Authorization constraints.

Invalid requests shall return:

    400 Bad Request

or an appropriate more specific error status.

---

## 31. Error Contract

API errors shall use a predictable machine-readable structure.

Conceptually:

    {
      "error": {
        "code": "ERROR_CODE",
        "message": "Human-readable message",
        "details": {},
        "correlationId": "identifier"
      }
    }

The exact serialized schema shall be finalized during implementation.

Errors shall not expose:

- Stack traces.
- Database internals.
- Secrets.
- Provider credentials.
- Sensitive infrastructure details.

---

## 32. Standard HTTP Status Semantics

The API shall use standard HTTP status semantics where practical.

| Status | Meaning                                        |
| ------ | ---------------------------------------------- |
| 200    | Successful request                             |
| 201    | Resource created                               |
| 202    | Asynchronous operation accepted                |
| 204    | Successful request with no response body       |
| 400    | Invalid request                                |
| 401    | Authentication required or invalid             |
| 403    | Insufficient authorization                     |
| 404    | Resource not found                             |
| 409    | Domain or state conflict                       |
| 422    | Semantically invalid request where appropriate |
| 429    | Rate limit exceeded                            |
| 500    | Unexpected server error                        |
| 502    | External dependency failure where appropriate  |
| 503    | Service temporarily unavailable                |

---

## 33. Pagination

Collection endpoints shall support pagination where result sets may become large.

Conceptually:

    GET /api/v1/incidents?page=1&pageSize=25

Responses may contain:

- Items.
- Current page.
- Page size.
- Total count where available.
- Next-page indicator or cursor.

The final pagination strategy shall be finalized during implementation.

---

## 34. Filtering and Sorting

Collection endpoints should support controlled filtering and sorting.

Examples:

    GET /api/v1/incidents?status=Investigating

    GET /api/v1/incidents?severity=High

    GET /api/v1/incidents?sort=createdAt

Only documented filter and sort fields shall be supported.

Arbitrary database query expressions shall not be exposed through the API.

---

## 35. API Versioning

The API shall use explicit versioning.

Initial version:

    /api/v1

Backward-compatible additions may be introduced within the same version.

Breaking contract changes shall require a new API version.

---

## 36. Security Requirements

The API shall:

1. Require authentication for protected resources.
2. Enforce authorization server-side.
3. Validate all external input.
4. Apply rate limiting where appropriate.
5. Protect sensitive data.
6. Avoid exposing internal implementation details.
7. Validate webhook authenticity where supported.
8. Prevent unauthorized simulation execution.
9. Avoid logging secrets.
10. Preserve audit information for important actions.

---

## 37. Rate Limiting

Rate limiting shall be applied where appropriate to protect the platform.

Higher-risk or resource-intensive operations may receive stricter limits, including:

- AI analysis.
- Simulation execution.
- Report generation.
- External ingestion.
- Authentication-related endpoints.

Rate-limit violations shall return:

    429 Too Many Requests

The final quota model shall be defined during deployment architecture.

---

## 38. Asynchronous API Contract

Operations expected to exceed normal interactive request duration shall use asynchronous APIs.

The conceptual pattern is:

    POST command
        |
        v
    202 Accepted
        |
        v
    Operation Resource
        |
        v
    GET /operations/{operationId}
        |
        v
    Succeeded / Failed

Examples include:

- AI analysis.
- Simulation execution.
- Report generation.
- Large ingestion operations.

The API shall not require clients to maintain an open HTTP connection for long-running operations.

---

## 39. External Integration Boundary

External integrations shall use adapters behind the application API.

Conceptually:

    API
      |
      v
    Application Service
      |
      v
    Integration Adapter
      |
      v
    External Provider

Provider-specific APIs shall not be exposed directly to frontend clients.

---

## 40. API Traceability

Important requests shall be traceable across:

    Client Request
          |
          v
    Correlation ID
          |
          v
    Application Operation
          |
          v
    Domain Change
          |
          v
    Audit Record

Traceability information should be available for operational troubleshooting without exposing sensitive payloads.

---

## 41. API Contract Stability

The API shall provide stable contracts to clients.

Internal changes to:

- Database schema.
- ORM.
- Service implementation.
- Queue implementation.
- AI provider.
- Simulation runtime.

shall not require API consumers to understand internal implementation details.

---

## 42. API Acceptance Criteria

The API contract shall be considered sufficiently defined when:

1. Core resources have explicit endpoint structures.
2. CRUD behavior is defined where appropriate.
3. Domain commands and lifecycle transitions are explicit.
4. Long-running operations use asynchronous contracts.
5. AI analysis has a clear API boundary.
6. Simulation execution has explicit safety constraints.
7. Authentication and authorization expectations are defined.
8. Error behavior is predictable.
9. Pagination and filtering expectations are defined.
10. API versioning is explicit.
11. Idempotency requirements are identified.
12. Correlation and traceability are supported.
13. External integrations remain behind application boundaries.
14. API responses do not expose persistence implementation details.
15. The API contract can be mapped back to the functional requirements and domain workflows.

---

## 43. Scope

This document defines the conceptual API contract and endpoint specification for SentinelAI.

It establishes the resource model, endpoint structure, lifecycle operations, asynchronous behavior, error semantics, security expectations, integration boundaries, and API stability principles required for subsequent implementation.

It does not define framework-specific route handlers, DTO classes, OpenAPI generator configuration, database queries, authentication-provider implementation, or infrastructure deployment configuration.
