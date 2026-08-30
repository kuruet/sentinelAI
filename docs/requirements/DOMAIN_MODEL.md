# SentinelAI - Domain Model

## 1. Purpose

This document defines the core domain entities, relationships, lifecycle states, ownership boundaries, and domain concepts required by SentinelAI. It provides the conceptual foundation for subsequent data architecture, API design, and system architecture decisions.

## 2. Domain Modeling Principles

1. Domain entities represent meaningful SentinelAI concepts rather than infrastructure implementation details.
2. Relationships between entities must remain explicit and traceable.
3. Historical investigation information must remain auditable.
4. AI-generated information must remain distinguishable from verified facts and human findings.
5. Simulation entities must remain distinguishable from normal production incident entities.
6. Domain ownership should remain clear even within the modular-monolith architecture.

## 3. Core Domain Entities

### 3.1 User

Represents a human identity that can interact with SentinelAI.

**Key concepts:**

- User identity
- Display information
- Account status
- Assigned roles
- Created and updated timestamps

**Ownership:** Identity and access management.

### 3.2 Role

Represents a defined authorization role assigned to one or more users.

**Key concepts:**

- Role identifier
- Role name
- Permissions
- Role status

**Ownership:** Identity and access management.

### 3.3 Incident

Represents an operational event or condition requiring investigation, coordination, or resolution.

**Key concepts:**

- Incident identifier
- Title
- Description
- Severity
- Priority
- Status
- Detection time
- Start time
- Resolution time
- Assigned participants
- Affected components
- Created and updated timestamps

**Ownership:** Incident management.

### 3.4 Incident State

Represents the lifecycle state of an incident.

**Conceptual states:**

- Detected
- Investigating
- Mitigating
- Monitoring
- Resolved
- Closed

State transitions must be controlled and auditable.

### 3.5 Incident Participant

Represents a user associated with an incident in a defined responsibility or participation role.

**Examples:**

- Incident Commander
- Incident Responder
- Subject Matter Expert
- Service Owner

**Ownership:** Incident management.

### 3.6 Service

Represents an application, backend component, infrastructure service, or other operational component relevant to incident investigation.

**Key concepts:**

- Service identifier
- Name
- Type
- Ownership information
- Environment
- Status
- Metadata

**Ownership:** System context / service catalog.

### 3.7 Dependency

Represents a relationship in which one service or component depends on another system component or external resource.

**Key concepts:**

- Source component
- Target component
- Dependency type
- Direction
- Metadata

**Ownership:** System context.

### 3.8 Event

Represents a timestamped occurrence relevant to an incident or system investigation.

**Examples:**

- Alert
- Log event
- Metric anomaly
- Deployment
- Configuration change
- Service state change
- Simulation event

**Key concepts:**

- Event identifier
- Event type
- Timestamp
- Source
- Service/component
- Severity
- Payload or metadata

**Ownership:** Event and context processing.

### 3.9 Evidence

Represents information used to support or challenge an investigation hypothesis or finding.

**Examples:**

- Log evidence
- Metric evidence
- Alert evidence
- Deployment evidence
- Configuration evidence
- Dependency evidence
- Human-provided evidence

**Key concepts:**

- Evidence identifier
- Type
- Source
- Timestamp or time range
- Content reference
- Provenance
- Relevance metadata

**Ownership:** Evidence management.

### 3.10 Evidence Provenance

Represents the origin and traceability information associated with evidence.

**Key concepts:**

- Source system
- Source identifier
- Collection time
- Original timestamp
- Collection method
- Integrity metadata where applicable

Provenance must allow investigators to understand where evidence originated.

### 3.11 Investigation

Represents the structured investigation process associated with an incident.

**Key concepts:**

- Investigation identifier
- Incident reference
- Investigator(s)
- Investigation status
- Started time
- Completed time
- Investigation findings
- Investigation history

**Ownership:** Investigation domain.

### 3.12 Investigation Finding

Represents a conclusion, observation, or analytical result recorded during an investigation.

Findings may be human-authored or derived from validated AI-assisted analysis.

**Key concepts:**

- Finding identifier
- Type
- Description
- Author/source
- Confidence where applicable
- Supporting evidence
- Validation status
- Created timestamp

### 3.13 AI Analysis

Represents an AI-assisted analysis execution performed against permitted incident context and evidence.

**Key concepts:**

- Analysis identifier
- Incident/investigation reference
- Model/provider reference
- Input context reference
- Execution status
- Started/completed timestamps
- Result reference
- Failure information where applicable

AI analysis is an execution record, not itself a verified fact.

### 3.14 Root-Cause Hypothesis

Represents a candidate explanation for the underlying cause of an incident.

**Key concepts:**

- Hypothesis identifier
- Description
- Confidence
- Supporting evidence
- Contradicting evidence
- Source
- Validation status
- Created timestamp

**Conceptual validation states:**

- Unreviewed
- Supported
- Rejected
- Uncertain
- Superseded

### 3.15 Remediation Recommendation

Represents advisory guidance about a possible action or mitigation derived from investigation findings or supported rules.

**Key concepts:**

- Recommendation identifier
- Description
- Rationale
- Supporting evidence
- Risk information
- Source
- Status

A recommendation is advisory unless a separately authorized execution capability exists.

### 3.16 Remediation Decision

Represents the human operational decision made in response to an incident.

**Key concepts:**

- Decision identifier
- Selected action
- Decision maker
- Decision time
- Context
- Outcome

### 3.17 Incident Report

Represents a structured summary of an incident and its investigation.

**Key concepts:**

- Report identifier
- Incident reference
- Summary
- Timeline
- Findings
- Root cause
- Remediation
- Generated timestamp
- Author or generator

### 3.18 Simulation Scenario

Represents a defined and controlled failure scenario that can be executed by the simulation system.

**Key concepts:**

- Scenario identifier
- Name
- Description
- Failure type
- Parameters
- Safety constraints
- Target environment
- Enabled status

### 3.19 Simulation Execution

Represents one execution of a simulation scenario.

**Key concepts:**

- Execution identifier
- Scenario reference
- Initiating user/process
- Environment
- Execution status
- Start/end time
- Configuration snapshot
- Generated event references
- Cleanup status

### 3.20 Integration

Represents a configured connection to an external operational system.

**Examples:**

- Monitoring platform
- Logging platform
- Alerting platform
- Source-control system
- Deployment system
- Infrastructure platform
- AI provider

**Key concepts:**

- Integration identifier
- Type
- Provider
- Configuration reference
- Status
- Last successful interaction
- Last error information

### 3.21 Audit Record

Represents a traceable record of an important user or system action.

**Key concepts:**

- Audit identifier
- Actor
- Action
- Resource
- Timestamp
- Result
- Metadata

## 4. Core Relationships

| Relationship                                | Description                                                                          |
| ------------------------------------------- | ------------------------------------------------------------------------------------ |
| User -> Role                                | A user may be assigned one or more roles.                                            |
| User -> Incident                            | A user may create, investigate, coordinate, or participate in incidents.             |
| Incident -> Participant                     | An incident contains assigned participants and responsibilities.                     |
| Incident -> Event                           | An incident may contain or reference relevant events.                                |
| Incident -> Evidence                        | An incident may contain or reference investigation evidence.                         |
| Incident -> Service                         | An incident may affect one or more services.                                         |
| Service -> Dependency                       | A service may depend on other services or resources.                                 |
| Incident -> Investigation                   | An incident may have one or more investigation records as required by the lifecycle. |
| Investigation -> Evidence                   | An investigation evaluates relevant evidence.                                        |
| Investigation -> Finding                    | An investigation produces findings.                                                  |
| AI Analysis -> Investigation                | AI analysis operates within an investigation context.                                |
| AI Analysis -> Evidence                     | AI analysis consumes permitted evidence.                                             |
| AI Analysis -> Hypothesis                   | AI analysis may generate candidate hypotheses.                                       |
| Hypothesis -> Evidence                      | A hypothesis may reference supporting or contradicting evidence.                     |
| Hypothesis -> Finding                       | A validated hypothesis may contribute to an investigation finding.                   |
| Finding -> Incident                         | Findings belong to an incident investigation.                                        |
| Recommendation -> Finding                   | Recommendations may be derived from findings.                                        |
| Remediation Decision -> Incident            | A remediation decision is recorded against an incident.                              |
| Incident -> Report                          | An incident may have one or more generated reports.                                  |
| Simulation Scenario -> Simulation Execution | A scenario may be executed multiple times.                                           |
| Simulation Execution -> Event               | An execution may generate system or simulation events.                               |
| Simulation Execution -> Incident            | An execution may produce or associate with an investigation incident.                |
| Integration -> Event                        | Integrations may provide external events.                                            |
| Integration -> Evidence                     | Integrations may provide evidence.                                                   |
| Audit Record -> User/System                 | Audit records identify the actor responsible for an important action.                |

## 5. Incident Lifecycle

```text
Detected
   |
   v
Investigating
   |
   v
Mitigating
   |
   v
Monitoring
   |
   v
Resolved
   |
   v
Closed
```

The lifecycle may support controlled transitions appropriate to the incident-management workflow. Invalid transitions shall be rejected.

## 6. Investigation Lifecycle

```text
Created
   |
   v
Context Collection
   |
   v
Evidence Analysis
   |
   v
AI Analysis (optional)
   |
   v
Hypothesis Review
   |
   v
Human Validation
   |
   v
Findings Recorded
   |
   v
Completed
```

Investigation state is distinct from incident state. An incident may remain active while investigation activities continue.

## 7. AI Analysis Lifecycle

```text
Requested
   |
   v
Preparing
   |
   v
Running
   |
   +-------> Failed
   |
   v
Validating Output
   |
   v
Completed
```

AI analysis failures must not corrupt the associated incident or investigation.

## 8. Simulation Execution Lifecycle

```text
Requested
   |
   v
Validated
   |
   v
Preparing
   |
   v
Running
   |
   +-------> Failed
   |
   v
Cleaning Up
   |
   v
Completed
```

Cleanup should be attempted after execution failure where applicable.

## 9. Domain Ownership Boundaries

| Domain              | Primary Responsibility                                         |
| ------------------- | -------------------------------------------------------------- |
| Identity & Access   | Users, roles, authentication context, authorization context    |
| Incident Management | Incidents, participants, lifecycle, incident coordination      |
| System Context      | Services, dependencies, component relationships                |
| Event Processing    | Events, normalization, temporal context                        |
| Evidence Management | Evidence, provenance, correlation metadata                     |
| Investigation       | Investigations, findings, hypotheses, validation               |
| AI Analysis         | AI analysis execution, provider abstraction, generated outputs |
| Remediation         | Recommendations, decisions, remediation records                |
| Reporting           | Incident reports and structured summaries                      |
| Simulation          | Scenarios, executions, simulation lifecycle                    |
| Integration         | External-system connections and adapters                       |
| Audit               | Traceability of important actions                              |

## 10. Domain Invariants

1. An incident must have a unique identifier.
2. An incident must have a valid lifecycle state.
3. Incident state transitions must be controlled.
4. Evidence must retain provenance information where applicable.
5. AI-generated information must be distinguishable from verified facts.
6. AI-generated hypotheses must have an explicit validation state.
7. Human validation must remain attributable to an authorized user.
8. Remediation recommendations must remain advisory unless explicitly authorized for execution.
9. Simulation executions must reference a valid scenario.
10. Simulation execution must remain within configured safety boundaries.
11. Important audit records must identify an actor or system process where applicable.
12. Historical investigation information must remain traceable.
13. Relationships between domain entities must not create invalid references.

## 11. Domain Model Summary

```text
                         +----------------+
                         |      User      |
                         +-------+--------+
                                 |
                              has Role
                                 |
                         +-------v--------+
                         |     Incident   |
                         +---+---+---+----+
                             |   |   |
                 +-----------+   |   +-------------+
                 |               |                 |
                 v               v                 v
             Services          Events           Evidence
                 |                                 |
                 v                                 |
            Dependencies                           |
                                                   v
                                           +-------+--------+
                                           |  Investigation |
                                           +---+---+---+----+
                                               |   |   |
                                    +----------+   |   +-----------+
                                    |              |               |
                                    v              v               v
                                  Finding     AI Analysis     Hypothesis
                                                   |               |
                                                   +-------+-------+
                                                           |
                                                           v
                                                  Evidence-backed
                                                    Validation
                                                           |
                                                           v
                                               Remediation Guidance
                                                           |
                                                           v
                                                Human Decision
                                                           |
                                                           v
                                                    Resolution

Simulation Scenario -> Simulation Execution -> Events -> Incident -> Investigation

External Integrations -> Events / Evidence
```

## 12. Scope

This document establishes the conceptual domain model for SentinelAI. It intentionally avoids database-specific schema decisions. Physical data structures, persistence technology, API representations, and implementation details will be defined in subsequent Phase 1 steps.
