# SentinelAI - Core Workflows & State Transitions

## 1. Purpose

This document defines the core business workflows and lifecycle state transitions for SentinelAI.

It describes how incidents, investigations, hypotheses, AI analysis, simulations, remediation, reporting, and asynchronous operations move through their supported states.

The purpose is to establish predictable workflow behavior before implementation of application services, APIs, persistence, background processing, and frontend workflows.

This document defines conceptual workflows and state transitions rather than implementation-specific code.

---

## 2. Workflow Principles

SentinelAI workflows shall follow these principles:

1. Important lifecycle states shall be explicit.
2. State transitions shall be deterministic and validated.
3. Invalid transitions shall be rejected.
4. Long-running operations shall not unnecessarily block interactive requests.
5. AI-generated output shall remain distinguishable from human validation.
6. Evidence shall remain traceable throughout investigation.
7. Simulation activity shall remain distinguishable from real operational activity.
8. Remediation recommendations shall remain distinct from executed actions.
9. Important workflow changes shall be auditable.
10. Failures shall result in explicit and recoverable states where appropriate.
11. External integrations shall not directly control core domain state without application-level validation.
12. Workflow completion shall require the appropriate domain conditions rather than merely successful technical execution.

---

## 3. Core Workflow Areas

The primary SentinelAI workflows are:

1. Incident creation and lifecycle.
2. Incident investigation.
3. Evidence ingestion and correlation.
4. Timeline reconstruction.
5. AI-assisted analysis.
6. Hypothesis validation.
7. Remediation recommendation and decision.
8. Simulation execution.
9. Incident reporting.
10. External integration ingestion.
11. Asynchronous operation execution.
12. Audit and traceability.

---

## 4. Incident Creation Workflow

An incident may be created through:

- Authorized user action.
- Supported external integration.
- Controlled simulation workflow.

Conceptually:

    Incident Source
          |
          v
    Validate Input
          |
          v
    Create Incident
          |
          v
    Detected
          |
          v
    Investigation Available

The system shall validate required incident information before creation.

An incident shall receive a stable identifier.

Creation shall preserve source and provenance information where available.

---

## 5. Incident Lifecycle

The conceptual incident lifecycle is:

    Detected
       |
       v
    Investigating
       |
       v
    Mitigating
       |
       v
    Resolved
       |
       v
    Closed

### Detected

The incident has been identified but investigation may not yet be active.

### Investigating

Engineers are actively collecting evidence and determining the cause and impact.

### Mitigating

Actions are being taken to reduce or remove the operational impact.

### Resolved

The incident impact has been addressed and the system is considered operational again.

### Closed

The incident investigation and required documentation have been completed.

---

## 6. Incident State Transition Rules

Supported conceptual transitions include:

| Current State | Allowed Next State |
| ------------- | ------------------ |
| Detected      | Investigating      |
| Investigating | Mitigating         |
| Investigating | Resolved           |
| Mitigating    | Investigating      |
| Mitigating    | Resolved           |
| Resolved      | Closed             |

The architecture may later introduce additional transitions when justified.

Invalid transitions shall be rejected.

Closing an incident shall require the appropriate investigation and documentation conditions defined by the final implementation.

---

## 7. Incident Investigation Workflow

The primary investigation workflow is:

    Incident
       |
       v
    Initialize Investigation
       |
       v
    Collect Context
       |
       v
    Collect Evidence
       |
       v
    Build Timeline
       |
       v
    Correlate Evidence
       |
       v
    Generate Hypotheses
       |
       v
    Validate Hypotheses
       |
       v
    Establish Findings
       |
       v
    Determine Remediation
       |
       v
    Complete Investigation

The workflow may iterate between evidence collection, correlation, hypothesis generation, and validation.

Investigation shall not require a single linear pass.

---

## 8. Investigation Lifecycle

The conceptual investigation lifecycle is:

    Initialized
        |
        v
    Active
        |
        v
    Findings Available
        |
        v
    Validated
        |
        v
    Completed

### Initialized

The investigation exists but active investigation work has not yet started.

### Active

Evidence collection, analysis, and investigation activity are in progress.

### Findings Available

One or more candidate findings or conclusions are available for review.

### Validated

Relevant conclusions have been reviewed and validated.

### Completed

Required investigation work and documentation are complete.

---

## 9. Investigation State Transition Rules

Supported conceptual transitions include:

| Current State      | Allowed Next State |
| ------------------ | ------------------ |
| Initialized        | Active             |
| Active             | Findings Available |
| Findings Available | Validated          |
| Validated          | Completed          |

The workflow may return to Active when additional evidence invalidates or materially changes an earlier conclusion.

The exact reopening rules shall be finalized during implementation.

---

## 10. Context Collection Workflow

Investigation context may be assembled from:

- Incident metadata.
- Affected services.
- Dependencies.
- Recent deployments.
- Configuration changes.
- Alerts.
- Logs.
- Metrics.
- Events.
- Existing operational information.

Conceptually:

    Incident
       |
       +---- Services
       |
       +---- Dependencies
       |
       +---- Recent Changes
       |
       +---- Existing Evidence
       |
       v
    Investigation Context

Context collection shall preserve source information.

---

## 11. Evidence Ingestion Workflow

The evidence ingestion workflow is:

    External Source
          |
          v
    Receive Data
          |
          v
    Validate
          |
          v
    Normalize
          |
          v
    Deduplicate
          |
          v
    Preserve Provenance
          |
          v
    Store Evidence
          |
          v
    Associate With Context

Invalid or malformed external information shall not silently become trusted evidence.

---

## 12. Evidence Lifecycle

Evidence may conceptually move through:

    Received
       |
       v
    Validated
       |
       v
    Associated
       |
       v
    Available

Failures may result in:

    Received
       |
       v
    Rejected

The exact persistence model for evidence lifecycle state shall be finalized during implementation.

---

## 13. Evidence Correlation Workflow

Evidence correlation shall attempt to identify relationships between relevant observations.

Potential correlation signals include:

- Timestamp proximity.
- Shared service.
- Shared component.
- Shared dependency.
- Common source.
- Event relationships.
- Deployment relationships.
- Configuration relationships.

Conceptually:

    Evidence Set
         |
         v
    Normalize Context
         |
         v
    Identify Relationships
         |
         v
    Correlate Observations
         |
         v
    Investigation Evidence Graph

Correlation results shall remain distinguishable from raw observations.

---

## 14. Timeline Reconstruction Workflow

Timeline reconstruction shall organize relevant events chronologically.

Conceptually:

    Raw Events
       |
       v
    Validate Timestamps
       |
       v
    Normalize Events
       |
       v
    Order Events
       |
       v
    Associate Context
       |
       v
    Incident Timeline

The system shall preserve original event timestamps.

Observation time and ingestion time shall remain distinct where both are available.

---

## 15. Timeline Ordering

Timeline ordering shall primarily use event occurrence timestamps.

Where timestamps are equal, a deterministic secondary ordering mechanism shall be used.

Timeline ordering shall not modify the original event data.

The system shall preserve provenance and source identifiers.

---

## 16. AI-Assisted Analysis Workflow

The conceptual AI workflow is:

    Investigation Context
          |
          v
    Select Relevant Evidence
          |
          v
    Prepare Analysis Context
          |
          v
    Submit AI Analysis
          |
          v
    Receive AI Result
          |
          v
    Validate Result Structure
          |
          v
    Generate Candidate Hypotheses
          |
          v
    Present To Engineer

The AI provider shall not directly modify confirmed domain state.

---

## 17. AI Analysis Lifecycle

An AI analysis operation may use the following states:

    Queued
       |
       v
    Running
       |
       +----------------+
       |                |
       v                v
    Completed         Failed

A failed analysis may be retried according to controlled retry policies.

The system shall avoid treating provider availability as a requirement for basic incident retrieval.

---

## 18. AI Analysis Request Rules

An AI analysis request shall:

- Reference the relevant investigation.
- Use only authorized context.
- Identify the requested analysis type.
- Preserve request traceability.
- Record operation status.
- Preserve provider information where appropriate.

The request shall not expose unnecessary data to an external AI provider.

---

## 19. AI Result Validation

AI output shall pass application-level validation before becoming trusted application state.

Conceptually:

    AI Response
        |
        v
    Schema Validation
        |
        v
    Safety / Policy Validation
        |
        v
    Evidence Reference Validation
        |
        v
    Application Result
        |
        v
    Candidate Hypothesis

Malformed or invalid responses shall be rejected or marked failed.

---

## 20. Hypothesis Workflow

A hypothesis may progress through:

    Proposed
       |
       v
    Under Review
       |
       +------------+
       |            |
       v            v
    Supported    Rejected
       |
       v
    Confirmed

A hypothesis may be returned to review if new evidence contradicts an earlier conclusion.

---

## 21. Hypothesis Validation Workflow

Validation shall consider:

- Supporting evidence.
- Contradicting evidence.
- Timeline consistency.
- Service and dependency relationships.
- Recent changes.
- Human investigator assessment.

Conceptually:

    Candidate Hypothesis
           |
           v
    Review Evidence
           |
           v
    Assess Consistency
           |
           v
    Human Validation
           |
           +------------+
           |            |
           v            v
       Supported      Rejected

Confirmation shall not occur solely because an AI model assigned a high confidence score.

---

## 22. Finding Workflow

A finding represents a validated investigation conclusion.

Conceptually:

    Evidence
       |
       v
    Hypothesis
       |
       v
    Validation
       |
       v
    Finding
       |
       v
    Investigation Conclusion

A finding shall preserve supporting evidence references where practical.

---

## 23. Remediation Recommendation Workflow

Recommendations may be produced by:

- Human investigators.
- AI-assisted analysis.
- Operational rules.

Conceptually:

    Investigation Finding
          |
          v
    Generate Recommendation
          |
          v
    Review Recommendation
          |
          v
    Remediation Decision

A recommendation is not itself an executed remediation action.

---

## 24. Remediation Decision Workflow

A decision may be:

- Accepted.
- Rejected.
- Deferred.
- Modified.

Conceptually:

    Recommendation
          |
          v
    Authorized Review
          |
          +----------------------+
          |          |           |
          v          v           v
       Accepted   Rejected    Deferred
          |
          v
    Remediation Action

The decision shall preserve the decision maker and relevant rationale where appropriate.

---

## 25. Remediation Action Workflow

A remediation action represents an action that is actually taken.

Conceptually:

    Approved Decision
          |
          v
    Execute Action
          |
          v
    Observe Result
          |
          +----------------+
          |                |
          v                v
       Successful        Failed
          |
          v
    Incident Verification

SentinelAI shall not assume that an action succeeded merely because an execution request was accepted.

---

## 26. Simulation Workflow

The simulation workflow is:

    Select Scenario
          |
          v
    Validate Preconditions
          |
          v
    Validate Safety Constraints
          |
          v
    Create Execution
          |
          v
    Execute Scenario
          |
          v
    Collect Simulation Events
          |
          v
    Produce Results
          |
          v
    Optionally Create Investigation Context

Simulation execution shall remain controlled and bounded.

---

## 27. Simulation Execution Lifecycle

A simulation execution may use:

    Created
       |
       v
    Validating
       |
       v
    Running
       |
       +----------------+
       |                |
       v                v
    Completed         Failed

A cancelled state may be introduced where supported by the execution environment.

---

## 28. Simulation Safety Rules

Simulation execution shall:

- Require authorization.
- Validate scenario identity.
- Validate target environment.
- Validate preconditions.
- Enforce resource limits.
- Enforce execution time limits.
- Prevent unrestricted arbitrary execution.
- Preserve execution provenance.
- Record execution status.

Simulation shall not silently operate outside its approved target environment.

---

## 29. Simulation-to-Incident Workflow

A simulation may produce an investigation-ready incident.

Conceptually:

    Simulation Execution
          |
          v
    Simulation Events
          |
          v
    Normalize Evidence
          |
          v
    Create Simulated Incident
          |
          v
    Investigation Workflow

The resulting incident shall be explicitly identified as simulation-derived.

---

## 30. Incident Reporting Workflow

The reporting workflow is:

    Investigation
         |
         v
    Gather Findings
         |
         v
    Gather Timeline
         |
         v
    Gather Evidence
         |
         v
    Gather Remediation
         |
         v
    Generate Report
         |
         v
    Validate Report
         |
         v
    Store Report

Report generation may execute asynchronously.

---

## 31. Report Lifecycle

A report may progress through:

    Requested
       |
       v
    Generating
       |
       +----------------+
       |                |
       v                v
    Completed         Failed

A completed report shall remain traceable to the investigation from which it was generated.

---

## 32. External Integration Workflow

The external integration workflow is:

    External System
          |
          v
    Integration Adapter
          |
          v
    Authentication
          |
          v
    Retrieve Data
          |
          v
    Validate
          |
          v
    Normalize
          |
          v
    Deduplicate
          |
          v
    Store / Associate
          |
          v
    Investigation Context

External providers shall not directly manipulate internal domain entities without passing through application-level boundaries.

---

## 33. Integration Failure Workflow

An external integration failure shall be represented explicitly.

Conceptually:

    External Request
          |
          v
       Attempt
          |
          +----------------+
          |                |
          v                v
      Success            Failure
                           |
                           v
                     Classify Failure
                           |
                           v
                    Retry If Appropriate
                           |
                           v
                    Record Final State

Retries shall be bounded.

Permanent failures shall remain observable.

---

## 34. Asynchronous Operation Workflow

Long-running operations shall use an asynchronous workflow.

Conceptually:

    Request
      |
      v
    Validate
      |
      v
    Create Operation
      |
      v
    Queued
      |
      v
    Running
      |
      +----------------+
      |                |
      v                v
    Succeeded         Failed

Examples include:

- AI analysis.
- Simulation execution.
- Report generation.
- Large ingestion.
- External synchronization.

---

## 35. Async Operation State Rules

The conceptual states are:

| Current State | Allowed Next State |
| ------------- | ------------------ |
| Queued        | Running            |
| Running       | Succeeded          |
| Running       | Failed             |

A cancellation state may be introduced later if required.

Operations shall not remain indefinitely in an active state without observable progress or failure information.

---

## 36. Audit Workflow

Important workflow transitions shall produce audit information where required.

Conceptually:

    User / System Action
           |
           v
    Validate Authorization
           |
           v
    Perform Operation
           |
           v
    Record Audit Event

Audit records should capture:

- Actor.
- Action.
- Target.
- Timestamp.
- Correlation identifier.
- Outcome.

Sensitive payloads shall not be unnecessarily copied into audit records.

---

## 37. Error Handling Workflow

Errors shall be classified according to their source and recoverability.

Potential categories include:

- Validation error.
- Authorization error.
- Not-found error.
- Conflict error.
- External dependency error.
- AI-provider error.
- Simulation error.
- Persistence error.
- Internal application error.

The application shall return predictable error representations at API boundaries.

---

## 38. Retry Workflow

Retryable failures may follow:

    Operation
       |
       v
    Failure
       |
       v
    Determine Retryability
       |
       +------------+
       |            |
       v            v
    Retryable    Permanent
       |            |
       v            v
    Backoff       Failed
       |
       v
    Retry
       |
       v
    Success / Final Failure

Retries shall have bounded attempts and appropriate backoff.

---

## 39. Concurrency Rules

Concurrent operations shall preserve domain consistency.

The system shall specifically consider concurrent updates involving:

- Incident status.
- Investigation status.
- Evidence ingestion.
- Hypothesis validation.
- AI analysis.
- Simulation execution.
- Remediation decisions.

Conflicting state changes shall be detected and handled explicitly.

---

## 40. Idempotency Rules

Operations that may be retried or delivered more than once should support idempotency.

Important examples include:

- External webhooks.
- Event ingestion.
- Background jobs.
- AI analysis requests.
- Simulation requests.
- Report generation.

Repeated execution shall not unintentionally create duplicate domain state.

---

## 41. End-to-End Investigation Workflow

The primary end-to-end SentinelAI workflow is:

    Incident Detected
          |
          v
    Initialize Investigation
          |
          v
    Collect System Context
          |
          v
    Gather Evidence
          |
          v
    Reconstruct Timeline
          |
          v
    Correlate Evidence
          |
          v
    Generate AI-Assisted Hypotheses
          |
          v
    Review Evidence
          |
          v
    Validate Hypotheses
          |
          v
    Establish Findings
          |
          v
    Determine Remediation
          |
          v
    Apply / Record Decision
          |
          v
    Verify Outcome
          |
          v
    Complete Investigation
          |
          v
    Generate Incident Report
          |
          v
    Close Incident

The workflow may iterate whenever new evidence becomes available.

---

## 42. Human-in-the-Loop Boundary

Human decision-making remains part of the core workflow.

The conceptual boundary is:

    System Observation
          |
          v
    Evidence
          |
          v
    AI Analysis
          |
          v
    Candidate Hypothesis
          |
          v
    Human Review
          |
          v
    Validated Finding
          |
          v
    Human / Authorized Decision
          |
          v
    Remediation

AI assistance shall accelerate investigation rather than bypass required human control.

---

## 43. Workflow Recovery

If a workflow operation fails, the system should preserve enough state to resume or retry where appropriate.

Examples:

- AI analysis failure should preserve the investigation.
- Evidence ingestion failure should preserve previously accepted evidence.
- Simulation failure should preserve execution state and diagnostics.
- Report generation failure should preserve the underlying investigation.
- External integration failure should not erase previously stored information.

---

## 44. Workflow Observability

Important workflow operations should expose:

- Current state.
- Previous state where appropriate.
- Operation identifier.
- Correlation identifier.
- Start timestamp.
- Completion timestamp where applicable.
- Failure information.
- Retry information where applicable.

This information shall support operational troubleshooting.

---

## 45. Workflow Invariants

The following invariants shall be preserved:

1. Invalid lifecycle transitions are rejected.
2. Every investigation belongs to an incident.
3. AI-generated hypotheses remain identifiable as AI-generated.
4. AI output does not automatically become a confirmed finding.
5. Evidence provenance is preserved where available.
6. Simulation evidence remains identifiable as simulated.
7. Recommendations remain distinct from remediation actions.
8. Remediation decisions remain traceable to recommendations.
9. Long-running operations have explicit lifecycle states.
10. Retry behavior is bounded.
11. Important operations remain auditable.
12. External integration failures do not silently corrupt domain state.
13. Duplicate ingestion does not unintentionally create duplicate evidence.
14. Human validation remains distinguishable from automated analysis.
15. Incident closure does not occur solely because a technical operation succeeded.

---

## 46. State Transition Summary

The major lifecycle models are summarized below.

### Incident

    Detected
       |
       v
    Investigating
       |
       v
    Mitigating
       |
       v
    Resolved
       |
       v
    Closed

### Investigation

    Initialized
        |
        v
    Active
        |
        v
    Findings Available
        |
        v
    Validated
        |
        v
    Completed

### Hypothesis

    Proposed
       |
       v
    Under Review
       |
       +------------+
       |            |
       v            v
    Supported    Rejected
       |
       v
    Confirmed

### Async Operation

    Queued
       |
       v
    Running
       |
       +----------------+
       |                |
       v                v
    Succeeded         Failed

### Simulation Execution

    Created
       |
       v
    Validating
       |
       v
    Running
       |
       +----------------+
       |                |
       v                v
    Completed         Failed

### Report

    Requested
       |
       v
    Generating
       |
       +----------------+
       |                |
       v                v
    Completed         Failed

---

## 47. Deferred Workflow Decisions

The following details shall be finalized during architecture and implementation:

- Exact lifecycle enum values.
- Exact transition authorization rules.
- Cancellation semantics.
- Retry limits.
- Queue implementation.
- Transaction boundaries.
- Concurrency-control mechanism.
- Idempotency-key strategy.
- Workflow persistence strategy.
- Background-worker architecture.
- Exact audit-event taxonomy.

These decisions shall preserve the workflow principles defined in this document.

---

## 48. Workflow Acceptance Criteria

The workflow model shall be considered sufficiently defined when:

1. Core workflows are explicitly documented.
2. Important entity lifecycles are defined.
3. Valid state transitions are identified.
4. Invalid transitions are expected to be rejected.
5. Long-running operations have asynchronous behavior.
6. AI analysis remains within an explicit trust boundary.
7. Human validation remains visible in the workflow.
8. Simulation workflows remain isolated and controlled.
9. Evidence provenance is preserved.
10. Retry and failure behavior is defined conceptually.
11. Idempotency requirements are identified.
12. Audit and traceability requirements are represented.
13. End-to-end investigation behavior can be mapped to the functional requirements.
14. Subsequent architecture and API design can use these workflows as stable references.

---

## 49. Scope

This document defines the conceptual core workflows and lifecycle state transitions for SentinelAI.

It establishes how major domain concepts move through their operational lifecycles and how they interact during incident investigation.

It does not define implementation-specific workflow engines, database transactions, queue infrastructure, or frontend state-management code.
