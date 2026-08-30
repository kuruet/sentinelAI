# SentinelAI - Use Cases & Core Workflows

## 1. Purpose

This document defines the primary use cases and end-to-end workflows of SentinelAI. It translates the functional requirements into concrete interactions between users, SentinelAI components, and supported external systems.

## 2. Workflow Conventions

Each workflow identifies the primary actor, objective, trigger, prerequisites, main flow, alternative or failure paths, and expected outcome.

## 3. UC-001 - Create Incident

**Primary Actor:** Incident Responder

**Objective:** Create a structured incident record for an operational event requiring investigation.

**Trigger:** An engineer identifies or receives an incident requiring investigation.

**Preconditions:**

- The user is authenticated.
- The user has permission to create incidents.

**Main Flow:**

1. The responder initiates incident creation.
2. SentinelAI validates the supplied incident information.
3. SentinelAI creates the incident record.
4. SentinelAI assigns an initial incident state.
5. SentinelAI records the initiating user and creation timestamp.
6. The incident becomes available to authorized investigators.

**Alternative / Failure Paths:**

- Invalid input is rejected with an actionable validation error.
- Unauthorized users are denied access.
- A persistence failure prevents incident creation and the user is informed without creating a partial incident.

**Outcome:** A valid incident exists and is ready for investigation.

## 4. UC-002 - Collect Incident Context

**Primary Actor:** Incident Responder

**Supporting Actors:** Integration adapters, external operational systems

**Objective:** Gather relevant information required to understand the incident.

**Trigger:** An incident requires contextual investigation.

**Main Flow:**

1. SentinelAI identifies configured context sources.
2. Relevant information is requested or retrieved.
3. External information is normalized into supported internal representations.
4. Context is associated with the incident.
5. Source provenance is preserved.
6. Collection results are made available to the investigation workspace.

**Alternative / Failure Paths:**

- An unavailable integration is reported without invalidating existing incident data.
- Invalid external data is rejected or isolated.
- Partial collection results remain distinguishable from complete collection.

**Outcome:** The incident contains available contextual information with source traceability.

## 5. UC-003 - Reconstruct Incident Timeline

**Primary Actor:** Incident Responder

**Objective:** Establish a chronological representation of relevant incident events.

**Trigger:** Incident events and contextual information are available.

**Main Flow:**

1. SentinelAI retrieves relevant timestamped events.
2. Events are normalized where required.
3. Events are ordered chronologically.
4. Relevant events are associated with affected services or components where possible.
5. The resulting timeline is presented to authorized users.

**Alternative / Failure Paths:**

- Events with incomplete timestamps are flagged rather than silently assigned false precision.
- Duplicate events are detected or safely handled.
- Conflicting event information remains identifiable.

**Outcome:** Investigators receive a traceable incident timeline.

## 6. UC-004 - Correlate Incident Evidence

**Primary Actor:** Incident Responder

**Objective:** Connect relevant evidence across incident context, events, services, dependencies, and external sources.

**Main Flow:**

1. SentinelAI identifies evidence associated with the incident.
2. Evidence is grouped or related using supported contextual signals.
3. Relationships between evidence items and affected components are established where possible.
4. Evidence provenance is retained.
5. Correlated evidence is presented to investigators.

**Outcome:** Investigators can evaluate related evidence without manually reconstructing every relationship.

## 7. UC-005 - Investigate Affected Services and Dependencies

**Primary Actor:** SRE / Platform Engineer

**Supporting Actors:** Software Developer, Incident Responder

**Objective:** Determine which services, components, and dependencies are involved in the incident.

**Main Flow:**

1. Investigator opens the incident investigation workspace.
2. SentinelAI presents known affected services and relationships.
3. Investigator inspects service and dependency context.
4. Investigator compares affected components with incident timeline and evidence.
5. Investigator records relevant findings.

**Outcome:** The investigation contains an evidence-backed understanding of affected system components.

## 8. UC-006 - Request AI-Assisted Investigation

**Primary Actor:** Incident Responder

**Supporting Actor:** AI provider

**Objective:** Obtain AI-assisted analysis of an incident using available context and evidence.

**Trigger:** An authorized investigator requests AI analysis.

**Preconditions:**

- The user is authorized.
- Relevant incident information is available.
- A supported AI capability is configured.

**Main Flow:**

1. Investigator requests AI-assisted analysis.
2. SentinelAI gathers permitted incident context and evidence.
3. SentinelAI prepares an analysis request.
4. The AI provider processes the request.
5. SentinelAI validates the returned structure.
6. Candidate findings and hypotheses are stored as AI-generated information.
7. Supporting evidence and confidence information are associated where available.
8. The findings are presented for human review.

**Alternative / Failure Paths:**

- AI provider timeout is reported and the incident remains intact.
- Invalid AI output is rejected or marked unusable.
- AI provider unavailability does not prevent non-AI investigation workflows.
- Insufficient evidence results in a limited or explicitly uncertain analysis.

**Outcome:** Investigators receive AI-assisted hypotheses that remain clearly distinguishable from verified facts.

## 9. UC-007 - Review and Validate AI Hypothesis

**Primary Actor:** Incident Responder

**Supporting Actors:** SRE / Platform Engineer, Software Developer

**Objective:** Validate an AI-generated hypothesis against available evidence.

**Main Flow:**

1. Investigator reviews the AI-generated hypothesis.
2. Investigator examines supporting evidence.
3. Investigator compares the hypothesis against timeline and system context.
4. Investigator determines whether the hypothesis is supported, rejected, or requires additional investigation.
5. Investigator records the validation outcome.

**Outcome:** AI analysis becomes an explicit human-reviewed investigation finding rather than an unverified conclusion.

## 10. UC-008 - Record Investigation Finding

**Primary Actor:** Authorized Investigator

**Objective:** Preserve human-authored conclusions and investigative observations.

**Main Flow:**

1. Investigator enters a finding.
2. SentinelAI validates the input.
3. The finding is associated with the incident and relevant evidence where applicable.
4. The author and timestamp are recorded.
5. The finding becomes part of the investigation history.

**Outcome:** Human investigation knowledge is preserved as traceable incident information.

## 11. UC-009 - Generate Remediation Guidance

**Primary Actor:** Incident Responder

**Supporting Actor:** AI analysis or supported rule-based logic

**Objective:** Provide advisory guidance about potential remediation based on available investigation evidence.

**Main Flow:**

1. Investigator requests remediation guidance or reaches a workflow stage where guidance is appropriate.
2. SentinelAI evaluates available evidence and findings.
3. Advisory remediation options are generated.
4. Supporting rationale is presented where available.
5. Investigator evaluates the recommendations.

**Boundary:** SentinelAI does not automatically execute consequential production remediation through this workflow.

**Outcome:** Authorized engineers receive advisory remediation information that they can evaluate before acting.

## 12. UC-010 - Record Remediation Decision

**Primary Actor:** Incident Responder / Incident Commander

**Objective:** Record the operational decision made following investigation.

**Main Flow:**

1. Authorized user records the selected remediation decision.
2. SentinelAI records the decision context.
3. Relevant evidence or findings are associated.
4. The decision and responsible user are preserved in the incident history.

**Outcome:** Remediation decisions are traceable to the incident investigation.

## 13. UC-011 - Resolve Incident

**Primary Actor:** Incident Responder / Incident Commander

**Objective:** Mark an incident as resolved after appropriate investigation and remediation.

**Main Flow:**

1. Authorized user determines that the incident meets resolution criteria.
2. User records the resolution information.
3. SentinelAI validates required resolution information.
4. Incident state changes to resolved.
5. Resolution timestamp and responsible user are recorded.

**Outcome:** The incident is formally resolved with traceable resolution information.

## 14. UC-012 - Generate Incident Report

**Primary Actor:** Incident Commander / Engineering Manager

**Objective:** Produce a structured record of what happened, why it happened, and how it was addressed.

**Main Flow:**

1. User requests an incident report.
2. SentinelAI gathers incident metadata.
3. Timeline, evidence, findings, validated hypotheses, and remediation information are assembled.
4. SentinelAI generates a structured report.
5. The report is made available to authorized users.

**Outcome:** A consistent incident report is produced from the investigation record.

## 15. UC-013 - Search and Review Historical Incidents

**Primary Actor:** Incident Responder / Engineering Manager

**Objective:** Locate previous incidents and reuse historical operational knowledge.

**Main Flow:**

1. User submits supported search or filter criteria.
2. SentinelAI evaluates authorized incident records.
3. Matching incidents are returned.
4. User opens a historical incident.
5. Authorized investigation information is displayed.

**Outcome:** Users can discover relevant historical incident information.

## 16. UC-014 - Execute Controlled Simulation

**Primary Actor:** SRE / Platform Engineer

**Objective:** Execute a controlled failure scenario for demonstration, testing, experimentation, or evaluation of incident investigation workflows.

**Preconditions:**

- The user is authorized.
- A valid simulation scenario exists.
- The target environment satisfies configured safety requirements.

**Main Flow:**

1. Authorized user selects a simulation scenario.
2. SentinelAI validates scenario configuration and execution boundaries.
3. Simulation execution begins within the permitted environment.
4. Simulation events and metadata are recorded.
5. Resulting incident signals are made available to the investigation workflow.
6. Simulation execution completes.
7. Temporary resources are cleaned up according to policy.

**Alternative / Failure Paths:**

- Unsafe or unauthorized scenario configuration is rejected.
- Execution failure is recorded.
- Cleanup is attempted even when execution fails.
- Protected production environments remain outside the permitted simulation boundary.

**Outcome:** A controlled and traceable simulation execution produces reproducible investigation conditions.

## 17. UC-015 - Manage Users and Roles

**Primary Actor:** SentinelAI Administrator

**Objective:** Manage authorized platform users and their supported access roles.

**Main Flow:**

1. Administrator accesses user management.
2. Administrator creates, updates, disables, or manages a user according to supported capabilities.
3. Administrator assigns permitted roles.
4. SentinelAI validates authorization.
5. Changes are recorded for auditability.

**Outcome:** Platform access is managed according to defined roles and permissions.

## 18. UC-016 - Configure External Integration

**Primary Actor:** SentinelAI Administrator

**Objective:** Configure a supported operational integration.

**Main Flow:**

1. Administrator selects an integration type.
2. Administrator supplies supported configuration.
3. SentinelAI validates configuration.
4. Credentials are stored through the appropriate secret-management mechanism.
5. Integration status is recorded.
6. Integration becomes available to supported workflows.

**Alternative / Failure Paths:**

- Invalid configuration is rejected.
- Authentication failure is reported.
- Integration unavailability does not corrupt existing incidents.

**Outcome:** A supported external integration is configured and available within its defined boundary.

## 19. UC-017 - Handle External Dependency Failure

**Primary Actor:** SentinelAI System

**Objective:** Maintain safe and predictable behavior when an external dependency fails.

**Trigger:** A configured external integration or AI provider becomes unavailable or returns an error.

**Main Flow:**

1. SentinelAI detects the dependency failure.
2. The failing operation is subject to configured timeout and retry behavior.
3. The failure is recorded or logged appropriately.
4. The user receives an actionable status.
5. Existing incident data remains intact.
6. Supported unaffected workflows continue operating.

**Outcome:** Dependency failure is isolated without unnecessarily compromising the incident investigation platform.

## 20. UC-018 - Audit Important Actions

**Primary Actor:** SentinelAI System

**Supporting Actor:** Authorized Administrator

**Objective:** Preserve traceability for security-sensitive and operationally significant actions.

**Main Flow:**

1. A significant action occurs.
2. SentinelAI identifies the actor and action context.
3. An audit record is created.
4. The record is protected according to audit requirements.
5. Authorized administrators can review applicable audit information.

**Outcome:** Important actions remain traceable for operational and governance purposes.

## 21. End-to-End Incident Investigation Workflow

```text
Incident detected / reported
        |
        v
Create incident
        |
        v
Collect incident context
        |
        v
Reconstruct timeline
        |
        v
Correlate evidence
        |
        v
Analyze affected services and dependencies
        |
        v
AI-assisted investigation (optional)
        |
        v
Generate root-cause hypotheses
        |
        v
Human evidence review and validation
        |
        v
Record investigation findings
        |
        v
Generate remediation guidance
        |
        v
Human remediation decision
        |
        v
Apply remediation outside SentinelAI or through separately authorized capability
        |
        v
Verify recovery
        |
        v
Resolve incident
        |
        v
Generate incident report
        |
        v
Preserve historical investigation record
```

## 22. AI Investigation Workflow

```text
Incident context + evidence
          |
          v
Context preparation
          |
          v
AI analysis request
          |
          v
AI provider
          |
          v
Structured output validation
          |
          v
Candidate hypotheses + supporting evidence
          |
          v
Human review
       /        \\
   Supported    Rejected / Uncertain
      |              |
      v              v
Record finding     Continue investigation
```

## 23. Simulation Workflow

```text
Define scenario
      |
      v
Validate authorization + safety boundaries
      |
      v
Prepare controlled environment
      |
      v
Execute failure scenario
      |
      v
Capture generated events and signals
      |
      v
Associate with simulation incident
      |
      v
Run investigation workflow
      |
      v
Record results
      |
      v
Cleanup resources
```

## 24. Cross-Cutting Workflow Rules

1. Authentication and authorization apply to protected operations.
2. Important actions must remain auditable.
3. AI-generated information remains distinguishable from verified facts.
4. Human users retain authority over consequential operational decisions.
5. External dependency failures must not corrupt core incident records.
6. Evidence provenance should be preserved throughout the investigation.
7. Simulation operations must remain within explicitly authorized boundaries.
8. Long-running operations should expose observable execution state.
9. Partial or uncertain information must remain distinguishable from verified information.
10. Historical investigation information must remain traceable.

## 25. Workflow-to-Requirement Traceability

| Workflow                           | Primary Functional Requirements |
| ---------------------------------- | ------------------------------- |
| Incident creation and management   | FR-001 to FR-005                |
| Context collection and timeline    | FR-006 to FR-009                |
| Evidence investigation             | FR-010 to FR-014                |
| Service and dependency analysis    | FR-015 to FR-017                |
| AI-assisted investigation          | FR-018 to FR-024                |
| Human validation                   | FR-025 to FR-027                |
| Simulation                         | FR-028 to FR-032                |
| Remediation                        | FR-033 to FR-035                |
| Incident reporting                 | FR-036 to FR-038                |
| Search and investigation workspace | FR-039 to FR-041                |
| Notifications and collaboration    | FR-042 to FR-043                |
| Administration                     | FR-044 to FR-048                |
| External integrations              | FR-049 to FR-051                |
| Auditability                       | FR-052 to FR-053                |

## 26. Scope

These workflows establish the primary product-level interactions and system behavior required for SentinelAI. Detailed domain entities, state machines, API contracts, sequence diagrams, security policies, and implementation mechanisms will be defined in subsequent Phase 1 architecture work.
