# SentinelAI - Domain Model & Core Entities

## 1. Purpose

This document defines the conceptual domain model for SentinelAI.

It identifies the core business entities, their responsibilities, important relationships, lifecycle concepts, ownership boundaries, and domain invariants that will guide subsequent database, API, application-service, and implementation decisions.

This document defines the conceptual model rather than a final database schema.

---

## 2. Domain Modeling Principles

The SentinelAI domain model shall follow these principles:

1. Domain concepts shall represent business capabilities rather than database tables.
2. Each core entity shall have a clear responsibility.
3. Relationships between entities shall be explicit.
4. Domain invariants shall be enforced by the application.
5. External-provider concepts shall not leak directly into the core domain.
6. AI-generated information shall remain distinguishable from human-validated findings.
7. Simulation concepts shall remain distinct from production incident concepts while supporting controlled association.
8. Incident history and investigation evidence shall remain traceable.
9. Entity lifecycle transitions shall be explicit.
10. The model shall support future integration without unnecessary coupling.

---

## 3. Core Domain Areas

The SentinelAI domain can be organized into the following conceptual areas:

| Domain Area         | Primary Concepts                                          |
| ------------------- | --------------------------------------------------------- |
| Incident Management | Incident, Incident Participant, Incident Status, Severity |
| System Context      | Service, Component, Dependency                            |
| Timeline            | Event, Timeline Entry                                     |
| Evidence            | Evidence, Evidence Source, Evidence Association           |
| Investigation       | Investigation, Finding, Hypothesis                        |
| AI Assistance       | Analysis Request, Analysis Result, AI Finding             |
| Remediation         | Recommendation, Decision, Action                          |
| Simulation          | Scenario, Execution, Simulation Event                     |
| Reporting           | Incident Report                                           |
| Integration         | Integration, External Source, Ingestion                   |
| Audit               | Audit Record                                              |
| Operations          | Async Operation                                           |

---

## 4. Incident

An Incident represents a software-system event or condition that requires investigation and potentially coordinated response.

An incident is the central aggregation point for incident-related information.

An incident may contain or reference:

- Incident metadata.
- Severity.
- Lifecycle status.
- Affected services.
- Participants.
- Events.
- Evidence.
- Investigations.
- Hypotheses.
- Recommendations.
- Remediation decisions.
- Simulation associations.
- Reports.

An incident shall have a stable identity.

---

## 5. Incident Attributes

Conceptually, an Incident should contain information such as:

- Unique identifier.
- Title.
- Description.
- Severity.
- Lifecycle status.
- Detection time.
- Start time where known.
- Resolution time where known.
- Creation timestamp.
- Last-update timestamp.
- Source information.
- Created-by information.
- Current owner or responsible role where applicable.

Exact field names and persistence types shall be finalized during implementation.

---

## 6. Incident Lifecycle

The incident lifecycle shall use explicit states.

A conceptual lifecycle is:

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

Additional states may be introduced if justified by later requirements.

Invalid lifecycle transitions shall be rejected.

An incident shall not be considered resolved merely because an AI analysis has completed.

---

## 7. Severity

Severity represents the operational impact or urgency associated with an incident.

Severity shall be represented using a controlled set of values rather than unrestricted strings.

The exact severity scale shall be finalized during domain and UI implementation.

Severity shall remain distinct from lifecycle status.

---

## 8. Incident Participant

An Incident Participant represents a person, team, or operational role associated with an incident.

A participant may represent:

- Incident commander.
- Investigator.
- Responder.
- Service owner.
- Reviewer.
- Other authorized operational roles.

Participant association shall preserve the participant's role and relationship to the incident.

---

## 9. Service

A Service represents a logical software service that participates in the system being investigated.

A service may have:

- Stable identifier.
- Name.
- Description.
- Environment.
- Ownership information.
- Operational metadata.
- Dependencies.
- Associated incidents.

A service shall remain a domain concept independent of a specific infrastructure provider.

---

## 10. Component

A Component represents a logical subsystem or deployable unit within a service or system context.

Components may include:

- API layer.
- Worker.
- Database subsystem.
- Queue consumer.
- Cache layer.
- External dependency.

The exact distinction between Service and Component shall be finalized when the system architecture and implementation structure are defined.

---

## 11. Dependency

A Dependency represents a relationship in which one service or component relies on another service, component, or external system.

A dependency may capture:

- Source entity.
- Target entity.
- Dependency type.
- Optional criticality.
- Relationship metadata.

Dependencies are important for determining potential blast radius and investigation context.

---

## 12. Event

An Event represents a time-associated occurrence relevant to an incident or investigation.

Examples include:

- Alert.
- Error occurrence.
- Deployment.
- Configuration change.
- Service state change.
- Metric anomaly.
- External provider event.
- Simulation event.

An event should preserve:

- Unique identifier.
- Timestamp.
- Event type.
- Source.
- Description or payload reference.
- Associated service or component where known.
- Provenance information.

---

## 13. Timeline Entry

A Timeline Entry represents the presentation or ordering of relevant events within an incident investigation.

The timeline shall support deterministic ordering.

Ordering should primarily consider event timestamps with defined secondary ordering where timestamps are equal.

Timeline presentation shall not alter the underlying event provenance.

---

## 14. Evidence

Evidence represents information that can support or contradict an investigation hypothesis.

Evidence may originate from:

- Logs.
- Metrics.
- Alerts.
- Deployments.
- Events.
- Traces.
- Configuration changes.
- External systems.
- Simulation execution.
- Human investigation notes.

Evidence shall preserve provenance where possible.

---

## 15. Evidence Source

An Evidence Source identifies where evidence originated.

Examples include:

- Application log.
- Monitoring platform.
- Deployment platform.
- Source-control system.
- Metrics platform.
- Simulation engine.
- Human investigator.

Provider-specific source information shall remain behind integration boundaries where possible.

---

## 16. Evidence Association

Evidence may be associated with:

- Incident.
- Investigation.
- Hypothesis.
- Finding.
- Timeline event.

Associations shall preserve enough information to understand why evidence is relevant.

The same evidence may support multiple investigation concepts where appropriate.

---

## 17. Evidence Provenance

Evidence provenance should provide information such as:

- Source.
- Source identifier.
- Observation timestamp.
- Ingestion timestamp.
- Collection method.
- External reference where available.

Provenance shall help investigators distinguish observed information from generated interpretation.

---

## 18. Investigation

An Investigation represents the structured process of examining an incident.

An investigation belongs to an incident and may contain:

- Investigation status.
- Investigators.
- Findings.
- Hypotheses.
- Evidence associations.
- Investigation comments.
- AI-analysis results.
- Recommendations.
- Validation decisions.

An investigation shall maintain traceability to its parent incident.

---

## 19. Investigation Lifecycle

A conceptual investigation lifecycle is:

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

The exact lifecycle may be refined during implementation.

---

## 20. Hypothesis

A Hypothesis represents a candidate explanation for an incident.

A hypothesis may be:

- Human-generated.
- AI-generated.
- Derived from correlated evidence.

A hypothesis shall not automatically be treated as the confirmed root cause.

A hypothesis should contain or reference:

- Explanation.
- Supporting evidence.
- Contradicting evidence where available.
- Confidence.
- Origin.
- Validation state.
- Related services or components.

---

## 21. Hypothesis Origin

Hypothesis origin shall distinguish at least:

- Human.
- AI.
- System-generated correlation.

This distinction is important for transparency and auditability.

---

## 22. Hypothesis Validation

A hypothesis may progress through states such as:

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

Confirmation shall require an appropriate human or system validation process.

AI-generated hypotheses shall not automatically become confirmed findings.

---

## 23. Finding

A Finding represents an investigation conclusion supported by available evidence.

A finding should distinguish between:

- Observed fact.
- Interpretation.
- Hypothesis.
- Validated conclusion.

Findings shall preserve relevant evidence references where practical.

---

## 24. AI Analysis Request

An AI Analysis Request represents an application request for AI-assisted investigation.

It should capture:

- Investigation reference.
- Requested analysis type.
- Requesting user.
- Relevant context reference.
- Operation status.
- Provider reference where appropriate.
- Creation timestamp.
- Completion timestamp where applicable.

Provider-specific request details shall remain outside the core domain where possible.

---

## 25. AI Analysis Result

An AI Analysis Result represents the output returned by an AI-assisted analysis operation after application-level validation.

It may contain:

- Candidate hypotheses.
- Evidence references.
- Reasoning summary.
- Confidence information.
- Analysis metadata.
- Provider metadata where appropriate.
- Validation state.

Raw provider responses should not automatically become trusted domain state.

---

## 26. AI Trust Boundary

AI-generated information shall remain distinguishable from system-observed evidence.

Conceptually:

    Observed Evidence
           |
           v
    Investigation Context
           |
           v
      AI Analysis
           |
           v
    Generated Hypothesis
           |
           v
    Evidence Validation
           |
           v
    Human Review
           |
           v
    Validated Finding

The AI system shall not own the final operational decision.

---

## 27. Recommendation

A Recommendation represents a proposed remediation or investigation action.

Recommendations may originate from:

- Human investigators.
- AI-assisted analysis.
- Operational rules.

A recommendation shall remain distinct from an executed action.

---

## 28. Remediation Decision

A Remediation Decision represents the authorized human or system decision regarding a recommendation.

A decision may include:

- Accepted.
- Rejected.
- Deferred.
- Modified.

The decision should preserve:

- Decision maker.
- Timestamp.
- Original recommendation.
- Decision rationale where appropriate.

---

## 29. Remediation Action

A Remediation Action represents an action taken to mitigate or resolve an incident.

Actions may include:

- Configuration change.
- Deployment rollback.
- Service restart.
- Dependency recovery.
- Traffic adjustment.
- Other approved operational action.

SentinelAI shall not assume that every recommendation is automatically executed.

---

## 30. Simulation Scenario

A Simulation Scenario represents a predefined or controlled failure scenario.

A scenario should define:

- Scenario identity.
- Name.
- Description.
- Target environment.
- Preconditions.
- Expected behavior.
- Safety constraints.
- Supported parameters.

Scenarios shall not provide unrestricted arbitrary execution.

---

## 31. Simulation Execution

A Simulation Execution represents one execution of a simulation scenario.

It should contain:

- Execution identity.
- Scenario reference.
- Requested-by information.
- Start time.
- Completion time.
- Execution status.
- Environment.
- Result information.

Simulation execution shall be independently traceable.

---

## 32. Simulation Event

A Simulation Event represents an event produced during a simulation execution.

Simulation events may later be associated with an incident for investigation and demonstration purposes.

Simulation provenance shall remain distinguishable from real production evidence.

---

## 33. Incident-Simulation Association

A simulation execution may generate an associated incident for controlled investigation.

The association shall preserve the distinction between:

- Simulated evidence.
- Real operational evidence.

A simulated incident shall not be represented as a real production incident without explicit contextual information.

---

## 34. Incident Report

An Incident Report represents a structured record of incident findings and outcomes.

A report may contain:

- Incident summary.
- Timeline.
- Impact.
- Affected services.
- Evidence summary.
- Root-cause conclusion.
- Contributing factors.
- Remediation.
- Lessons learned.
- Investigation metadata.

Report generation may be asynchronous.

---

## 35. Integration

An Integration represents a configured connection between SentinelAI and an external operational system.

An integration may represent:

- Monitoring provider.
- Logging provider.
- Deployment provider.
- Source-control provider.
- Incident-management provider.
- Metrics provider.

Integration configuration shall remain isolated from core domain logic.

---

## 36. External Source

An External Source represents a provider or system from which incident-related information originates.

The external source may provide:

- Events.
- Alerts.
- Logs.
- Metrics.
- Deployments.
- Other operational evidence.

External source identifiers should be preserved for traceability.

---

## 37. Ingestion

Ingestion represents the controlled process of receiving and normalizing external information.

Conceptually:

    External Source
          |
          v
    Integration Adapter
          |
          v
    Validation
          |
          v
    Normalization
          |
          v
    Internal Event / Evidence
          |
          v
    Incident Context

Ingestion should support deduplication and provenance tracking where appropriate.

---

## 38. Async Operation

An Async Operation represents a long-running application process.

Examples include:

- AI analysis.
- Simulation execution.
- Report generation.
- Large ingestion jobs.
- External synchronization.

Conceptual states include:

    Queued
       |
       v
    Running
       |
       +-------------+
       |             |
       v             v
    Succeeded      Failed

The operation shall have a stable identifier and traceable lifecycle.

---

## 39. Audit Record

An Audit Record represents an important user or system action that should be traceable.

Audit records may capture:

- Actor.
- Action.
- Target.
- Timestamp.
- Correlation identifier.
- Relevant outcome.

Audit records shall not unnecessarily contain sensitive payloads.

---

## 40. Core Relationships

The primary conceptual relationships are:

    Incident
       |
       +---- Participants
       |
       +---- Services
       |        |
       |        +---- Dependencies
       |
       +---- Events
       |
       +---- Evidence
       |
       +---- Investigation
       |        |
       |        +---- Hypotheses
       |        |
       |        +---- Findings
       |        |
       |        +---- AI Analysis
       |        |
       |        +---- Recommendations
       |                 |
       |                 +---- Remediation Decisions
       |
       +---- Simulation Association
       |
       +---- Incident Report

These relationships represent the conceptual domain and are not a final relational schema.

---

## 41. Ownership Boundaries

The domain shall maintain clear ownership boundaries.

Conceptually:

| Entity               | Primary Owner                  |
| -------------------- | ------------------------------ |
| Incident             | Incident Management            |
| Investigation        | Investigation Domain           |
| Evidence             | Evidence Domain                |
| Hypothesis           | Investigation Domain           |
| Finding              | Investigation Domain           |
| Service              | System Context                 |
| Dependency           | System Context                 |
| Simulation Scenario  | Simulation Domain              |
| Simulation Execution | Simulation Domain              |
| AI Analysis          | AI Integration / Investigation |
| Integration          | Integration Domain             |
| Audit Record         | Audit / Operational Domain     |

The exact module boundaries shall be finalized during system architecture.

---

## 42. Domain Invariants

The following invariants shall be preserved:

1. Every investigation belongs to an incident.
2. Every hypothesis belongs to an investigation.
3. Evidence associations must reference valid evidence.
4. Incident lifecycle transitions must follow valid state transitions.
5. An AI-generated hypothesis shall remain identifiable as AI-generated.
6. AI-generated output shall not automatically become a confirmed root cause.
7. Simulation executions shall reference valid scenarios.
8. Simulation evidence shall remain identifiable as simulated.
9. External evidence shall preserve provenance where available.
10. Remediation recommendations shall be distinct from remediation decisions.
11. Audit records shall preserve important actor and action information.
12. Async operations shall have explicit lifecycle states.

---

## 43. Identity and Traceability

Core domain entities shall have stable identifiers.

Relationships should use identifiers rather than relying exclusively on display names.

Important operations shall preserve correlation information where appropriate.

Traceability should allow investigators to connect:

    Incident
       |
       v
    Investigation
       |
       +---- Evidence
       |
       +---- Hypothesis
       |
       +---- AI Analysis
       |
       +---- Human Validation
       |
       v
    Finding
       |
       v
    Remediation Decision

---

## 44. Temporal Information

Incident investigation is inherently time-sensitive.

The domain should preserve relevant timestamps for:

- Incident creation.
- Incident detection.
- Incident start.
- Events.
- Evidence observation.
- Evidence ingestion.
- Investigation activity.
- AI analysis.
- Simulation execution.
- Remediation.
- Resolution.
- Report generation.

The system should distinguish observation time from ingestion time where both are available.

---

## 45. Provenance

Important information shall preserve provenance wherever practical.

Provenance should distinguish between:

- Human-entered information.
- System-observed information.
- External-provider information.
- AI-generated information.
- Simulation-generated information.

This distinction supports evidence-based investigation and explainability.

---

## 46. Domain Separation from Infrastructure

The conceptual domain model shall remain independent of:

- Database technology.
- ORM implementation.
- HTTP framework.
- AI-provider SDK.
- Simulation runtime.
- Cloud provider.

Infrastructure-specific representations shall be translated into domain concepts through appropriate application boundaries.

---

## 47. Domain Evolution

The domain model shall be expected to evolve as implementation and evaluation reveal additional requirements.

New entities should only be introduced when they represent a meaningful domain concept.

Existing entities should not be split merely to mirror database normalization.

Domain complexity shall be justified by actual business or operational requirements.

---

## 48. Deferred Decisions

The following details remain subject to later architecture and implementation decisions:

- Exact entity field names.
- Exact identifier format.
- Exact enum values.
- Database schema.
- ORM mappings.
- Aggregate boundaries.
- Transaction boundaries.
- Event-sourcing decisions.
- Persistence strategy.
- Exact module/package boundaries.

These decisions shall be derived from the conceptual model rather than defining the conceptual model prematurely.

---

## 49. Domain Model Acceptance Criteria

The domain model shall be considered sufficiently defined when:

1. Core business concepts are explicitly identified.
2. Each core concept has a clear responsibility.
3. Important relationships are documented.
4. Lifecycle states are explicit where required.
5. Domain invariants are identified.
6. Evidence provenance is preserved.
7. AI-generated information is distinguishable from observed evidence.
8. Simulation information is distinguishable from real operational information.
9. Human decisions remain distinguishable from AI recommendations.
10. Infrastructure concerns remain outside the conceptual domain model.
11. The model can support the functional and non-functional requirements.
12. Subsequent API and architecture design can reference stable domain concepts.

---

## 50. Scope

This document defines the conceptual domain model and core entities for SentinelAI.

It establishes the vocabulary, responsibilities, relationships, lifecycle concepts, provenance rules, ownership boundaries, and domain invariants required to guide subsequent architecture and implementation.

It does not define a final database schema, ORM mapping, API schema, or implementation-specific class structure.
