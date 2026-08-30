# SentinelAI - Functional Requirements

## 1. Purpose

This document defines the functional capabilities SentinelAI must provide. These requirements establish observable system behavior and will serve as the basis for subsequent use-case, domain-model, API, and architecture decisions.

## 2. Requirement Identification

Requirements use the identifier format FR-XXX. Each requirement describes a capability the system must provide.

## 3. Incident Management

### FR-001 - Create Incident

The system shall allow an authorized user to create an incident with relevant identifying information.

### FR-002 - View Incident

The system shall allow authorized users to view incident details and current incident state.

### FR-003 - Update Incident

The system shall allow authorized users to update permitted incident information and state.

### FR-004 - Track Incident State

The system shall maintain a defined incident lifecycle and record state transitions.

### FR-005 - Assign Incident Participants

The system shall allow authorized users to associate responders and responsible roles with an incident.

## 4. Incident Context and Timeline

### FR-006 - Collect Incident Context

The system shall collect and associate relevant contextual information with an incident.

### FR-007 - Build Incident Timeline

The system shall construct a chronological timeline from relevant incident events.

### FR-008 - Record Timeline Events

The system shall allow relevant events to be associated with an incident timeline.

### FR-009 - Preserve Event Ordering

The system shall preserve event timestamps and ordering information required for incident reconstruction.

## 5. Evidence Management

### FR-010 - Ingest Evidence

The system shall accept supported incident-related evidence from configured sources.

### FR-011 - Associate Evidence

The system shall associate evidence with the relevant incident, service, event, or investigation context.

### FR-012 - Display Evidence

The system shall allow authorized users to inspect evidence associated with an investigation.

### FR-013 - Correlate Evidence

The system shall correlate relevant evidence based on available incident context, timestamps, relationships, and other supported signals.

### FR-014 - Preserve Evidence Provenance

The system shall retain sufficient provenance information to identify the source and context of incident evidence.

## 6. Service and Dependency Context

### FR-015 - Represent Services

The system shall maintain information about services relevant to an incident.

### FR-016 - Represent Dependencies

The system shall maintain supported relationships between services and dependencies.

### FR-017 - Identify Affected Components

The system shall allow affected services and components to be identified for an incident.

## 7. AI-Assisted Investigation

### FR-018 - Request AI Analysis

The system shall allow an authorized user to request AI-assisted analysis for an incident.

### FR-019 - Generate Investigation Hypotheses

The system shall generate candidate root-cause hypotheses from available incident context and evidence.

### FR-020 - Provide Supporting Evidence

The system shall associate available supporting evidence with generated hypotheses where applicable.

### FR-021 - Provide Confidence

The system shall provide a confidence representation for AI-generated hypotheses or conclusions where supported by the analysis process.

### FR-022 - Explain AI Findings

The system shall provide an understandable explanation of the evidence and reasoning relevant to an AI-generated finding.

### FR-023 - Distinguish AI Output

The system shall clearly distinguish AI-generated analysis from verified system facts and human-authored findings.

### FR-024 - Record AI Analysis

The system shall preserve relevant AI analysis results and associated investigation context according to configured retention policies.

## 8. Human Validation

### FR-025 - Review AI Findings

The system shall allow authorized users to review AI-generated hypotheses and supporting evidence.

### FR-026 - Record Human Validation

The system shall allow authorized users to record whether an AI-generated finding was accepted, rejected, or requires further investigation.

### FR-027 - Record Investigation Findings

The system shall allow authorized users to record human-authored investigation findings.

## 9. Incident Simulation

### FR-028 - Define Simulation Scenario

The system shall support the definition of controlled incident simulation scenarios.

### FR-029 - Execute Simulation

The system shall allow authorized users to execute supported simulation scenarios in an isolated or controlled environment.

### FR-030 - Record Simulation Execution

The system shall record simulation execution metadata, scenario information, and resulting events.

### FR-031 - Associate Simulation With Incident

The system shall allow simulation-generated incidents and evidence to be associated with the corresponding simulation execution.

### FR-032 - Control Simulation Scope

The system shall enforce configured boundaries for simulation execution to prevent unauthorized impact on protected environments.

## 10. Recommendations and Remediation

### FR-033 - Generate Remediation Guidance

The system shall provide AI-assisted or rule-based remediation guidance where sufficient evidence is available.

### FR-034 - Distinguish Recommendations

The system shall clearly identify recommendations as advisory information rather than automatically executed actions unless explicitly authorized by a separately defined capability.

### FR-035 - Record Remediation Decisions

The system shall allow authorized users to record remediation decisions and relevant outcomes.

## 11. Incident Reporting

### FR-036 - Generate Incident Summary

The system shall generate a structured summary of relevant incident information and investigation findings.

### FR-037 - Generate Incident Report

The system shall generate a structured incident report containing relevant timeline, evidence, findings, root-cause information, and remediation information.

### FR-038 - Preserve Incident History

The system shall preserve historical incident information according to configured retention requirements.

## 12. Search and Investigation Workspace

### FR-039 - Search Incidents

The system shall allow authorized users to search and filter incidents using supported attributes.

### FR-040 - Search Investigation Evidence

The system shall allow authorized users to locate relevant evidence associated with incidents and investigations.

### FR-041 - Present Investigation Context

The system shall provide a unified investigation view containing relevant incident context, timeline, evidence, affected components, and AI findings.

## 13. Notifications and Collaboration

### FR-042 - Notify Relevant Users

The system shall support notifications for configured incident events and workflow changes.

### FR-043 - Record Collaboration Information

The system shall allow authorized users to record relevant investigation comments, decisions, and collaboration information.

## 14. Administration

### FR-044 - Manage Users

The system shall allow authorized administrators to manage platform users.

### FR-045 - Manage Roles

The system shall allow authorized administrators to assign and manage supported roles and permissions.

### FR-046 - Manage Integrations

The system shall allow authorized administrators to configure supported external integrations.

### FR-047 - Manage Platform Configuration

The system shall allow authorized administrators to manage supported platform configuration.

### FR-048 - View Audit Information

The system shall provide authorized administrators with access to relevant audit information.

## 15. Integration Requirements

### FR-049 - Receive External Events

The system shall support ingestion of supported events from external operational systems.

### FR-050 - Normalize External Data

The system shall normalize supported external data into the internal representations required for incident investigation.

### FR-051 - Track Integration Provenance

The system shall preserve source information for data received through external integrations.

## 16. Auditability

### FR-052 - Record Important Actions

The system shall record important user and system actions required for operational traceability.

### FR-053 - Preserve Investigation History

The system shall preserve relevant investigation actions and decisions according to configured retention requirements.

## 17. Requirement Boundary

These functional requirements define what SentinelAI must be capable of doing at the product level. Detailed workflows, domain entities, API contracts, authorization rules, technology choices, and implementation details will be refined in subsequent Phase 1 steps.

Requirements in this document do not imply that the corresponding capabilities are already implemented.
