# SentinelAI - System Constraints & Assumptions

## 1. Purpose

This document defines the architectural constraints, project boundaries, environmental assumptions, and design decisions that must be considered when designing and implementing SentinelAI. These constraints establish the boundaries within which the system architecture must operate.

## 2. Architectural Constraints

### CON-001 - Initial Backend Architecture

The initial backend architecture shall be implemented as a modular monolith with clearly separated domain and application boundaries.

### CON-002 - Modular Boundaries

Major SentinelAI capabilities shall remain logically separated even when deployed within the same backend application.

### CON-003 - Avoid Premature Microservices

The initial implementation shall not introduce distributed microservices unless a concrete functional, scalability, isolation, or operational requirement justifies the separation.

### CON-004 - API Boundary

Frontend-to-backend communication shall occur through defined API boundaries rather than direct access to backend persistence mechanisms.

### CON-005 - Shared Contracts

Shared types and contracts should be centralized where appropriate to reduce duplication and prevent frontend/backend contract drift.

### CON-006 - AI Provider Abstraction

AI-provider-specific implementation details shall remain isolated behind a defined application boundary.

### CON-007 - Integration Adapter Boundary

External observability and operational integrations shall be isolated behind integration or adapter boundaries.

### CON-008 - Simulation Isolation

Simulation capabilities shall remain logically separated from normal incident-management operations and shall enforce explicit execution boundaries.

## 3. Technology and Runtime Constraints

### CON-009 - TypeScript Application Stack

The primary application implementation shall use the existing TypeScript-based project structure.

### CON-010 - Existing Project Structure

The architecture shall respect the existing backend, frontend, shared, and simulation-engine project boundaries unless a later architectural decision explicitly changes them.

### CON-011 - Package Management

Project dependencies shall be managed through the existing pnpm-based package-management workflow.

### CON-012 - Existing Quality Tooling

The implementation shall continue to use the repository-configured formatting, typechecking, and linting workflows.

## 4. Data and Persistence Constraints

### CON-013 - Persistent Incident Data

Incident information, investigation findings, evidence metadata, simulation metadata, and audit information shall use persistent storage where historical continuity is required.

### CON-014 - Data Ownership

Each major domain capability should have clearly defined ownership of the data it creates or modifies.

### CON-015 - Evidence Provenance

Persisted evidence shall retain sufficient source and contextual metadata to support investigation traceability.

### CON-016 - Historical Integrity

Historical incident and investigation records shall not be silently overwritten in ways that destroy required audit or investigation context.

## 5. AI Constraints

### CON-017 - AI Is Advisory

AI-generated findings shall remain advisory and shall not automatically be treated as verified system facts.

### CON-018 - AI Output Validation

AI responses shall be validated before being consumed by application components that expect structured data.

### CON-019 - Human Decision Authority

Final consequential operational decisions shall remain under authorized human control.

### CON-020 - AI Failure Independence

Failure or unavailability of an AI provider shall not corrupt or invalidate the underlying incident record.

### CON-021 - Model Portability

The architecture should avoid unnecessary coupling to a single AI provider or model implementation.

### CON-022 - Evidence-Grounded Analysis

AI analysis should have access to relevant incident context and evidence required to produce evidence-backed investigation hypotheses.

## 6. Simulation Constraints

### CON-023 - Controlled Execution

Simulation scenarios shall execute only within explicitly defined and authorized boundaries.

### CON-024 - Production Protection

Simulation functionality shall not intentionally modify or disrupt protected production environments.

### CON-025 - Reproducibility

Simulation executions should preserve sufficient scenario and execution metadata to reproduce or evaluate results where practical.

### CON-026 - Simulation Cleanup

Temporary simulation resources and state shall have an explicit cleanup lifecycle.

## 7. Security Constraints

### CON-027 - Authentication Boundary

Protected platform operations shall require authenticated access.

### CON-028 - Authorization Boundary

Authorization shall be enforced at the application boundary rather than relying solely on frontend controls.

### CON-029 - Least Privilege

System components and users shall operate with the minimum privileges required for their responsibilities.

### CON-030 - Secret Protection

Secrets shall be supplied through appropriate environment or secret-management mechanisms and shall not be committed to source control.

### CON-031 - Secure Defaults

Security-sensitive configuration shall use secure defaults unless an explicit deployment configuration overrides them.

## 8. Deployment and Environment Constraints

### CON-032 - Environment Separation

Development, testing, and production configurations shall be separated when multiple environments are used.

### CON-033 - Configuration Externalization

Environment-specific configuration shall remain external to application business logic wherever practical.

### CON-034 - Reproducible Setup

A new development or deployment environment should be reproducible using version-controlled project configuration and documented setup procedures.

### CON-035 - Local Development

The architecture should support practical local development and demonstration without requiring an unnecessarily complex infrastructure footprint.

## 9. Integration Constraints

### CON-036 - Integration Independence

The core incident domain shall not become tightly coupled to a single external monitoring, logging, deployment, or infrastructure provider.

### CON-037 - Provider Failure

The platform shall remain operational for supported core workflows when optional external integrations are temporarily unavailable.

### CON-038 - External Data Normalization

External data shall be normalized into SentinelAI representations before being consumed by domain logic where appropriate.

### CON-039 - Integration Credentials

External integration credentials shall be managed independently from application source code.

## 10. Operational Constraints

### CON-040 - Observability

Major backend and simulation components shall expose sufficient operational information for troubleshooting and health monitoring.

### CON-041 - Auditability

Security-sensitive and consequential system actions shall remain traceable.

### CON-042 - Error Isolation

An error in one request, integration, or background operation should not unnecessarily terminate unrelated platform operations.

### CON-043 - Graceful Failure

External dependency failures shall be handled explicitly through appropriate timeout, retry, fallback, or error-reporting mechanisms.

## 11. Scope Constraints

### CON-044 - No Monitoring Replacement

SentinelAI shall not attempt to replace mature monitoring or centralized logging platforms in the initial scope.

### CON-045 - No Autonomous Production Remediation

The initial platform shall not automatically execute consequential production remediation actions without explicit authorization and a separately defined capability.

### CON-046 - No Foundation Model Training

The project shall consume supported AI models or providers rather than attempting to train a foundation model as part of the initial platform.

### CON-047 - No Generic Chatbot

The AI interface shall remain focused on incident investigation and reliability workflows rather than becoming a general-purpose conversational assistant.

### CON-048 - No Full ITSM Replacement

The initial platform shall not attempt to reproduce the complete feature set of an enterprise IT service-management platform.

### CON-049 - No Kubernetes Management Platform

Kubernetes or infrastructure management shall not become a primary product capability unless explicitly required by a later scope decision.

## 12. Project Assumptions

### ASM-001 - Engineering Users

The primary users are assumed to have sufficient technical knowledge to understand incidents, system evidence, service relationships, and operational terminology.

### ASM-002 - Authorized Access

Users interacting with protected SentinelAI functionality are assumed to have authenticated and authorized access.

### ASM-003 - External Signals

Where integrations are used, external systems are assumed to provide sufficiently structured or retrievable operational information for SentinelAI to process.

### ASM-004 - Timestamp Availability

Incident-related events are assumed to contain timestamps or sufficient temporal information for timeline reconstruction where applicable.

### ASM-005 - Service Identity

Relevant system events are assumed to contain sufficient service or component identity information to associate evidence with affected components where applicable.

### ASM-006 - AI Provider Availability

AI-assisted functionality assumes access to a supported AI provider or locally available model when that capability is enabled.

### ASM-007 - AI Is Non-Deterministic

AI-generated analysis is assumed to be probabilistic and may produce incorrect or incomplete conclusions.

### ASM-008 - Simulation Environment

Controlled simulation environments are assumed to provide sufficient isolation for supported failure scenarios.

### ASM-009 - Persistent Storage Availability

Core incident and investigation workflows assume availability of the configured persistent data store.

### ASM-010 - Network Availability

External integrations and remote AI providers assume network connectivity when those capabilities are enabled.

### ASM-011 - Configuration Availability

Required runtime configuration is assumed to be available through supported configuration mechanisms before dependent functionality is started.

### ASM-012 - Human Oversight

Authorized engineering users are assumed to review AI-generated hypotheses and recommendations before making consequential operational decisions.

## 13. Architectural Decision Boundaries

The following decisions are intentionally deferred to later Phase 1 architecture work:

- Exact database technology and schema design.
- Exact API framework and endpoint structure.
- Exact authentication and identity-provider implementation.
- Exact authorization model implementation.
- Exact AI provider and model selection.
- Exact queue or background-job technology.
- Exact observability stack.
- Exact deployment topology.
- Exact simulation runtime and isolation mechanism.
- Numeric capacity, latency, availability, and recovery targets.

These decisions will be made after the domain model, workflows, architecture, data requirements, and integration requirements have been established.

## 14. Constraint Governance

Architectural decisions that conflict with a constraint in this document must be explicitly documented and justified before the constraint is changed.

Constraints and assumptions may be revised if later requirements, validation, or implementation evidence demonstrates that a change is necessary.

## 15. Scope

This document establishes the system constraints and assumptions for SentinelAI. It provides boundaries for subsequent use-case, domain-model, architecture, data, API, security, and implementation decisions.
