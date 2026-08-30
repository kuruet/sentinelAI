# SentinelAI - Users, Personas & Stakeholders

## 1. Purpose

This document defines the human users, system-facing roles, and organizational stakeholders that SentinelAI is designed to support. It establishes role responsibilities, goals, interaction boundaries, and high-level access expectations. Detailed authorization policies will be defined during the security requirements phase.

## 2. Primary Users

### 2.1 Incident Responder

**Role:** Engineer responsible for investigating and responding to an active incident.

**Goals:**

- Understand what happened.
- Identify affected services and dependencies.
- Reconstruct the incident timeline.
- Review correlated evidence.
- Evaluate AI-generated root-cause hypotheses.
- Determine appropriate remediation.

**SentinelAI interaction:**

- Create or access incidents.
- Review incident context and timelines.
- Inspect evidence and system relationships.
- Request AI-assisted analysis.
- Review hypotheses, evidence, and confidence.
- Record investigation findings.
- Participate in incident resolution.

**Authority boundary:** The Incident Responder can investigate and record findings but SentinelAI does not automatically grant unrestricted production-remediation authority.

### 2.2 Site Reliability / Platform Engineer

**Role:** Engineer responsible for system reliability, infrastructure, service health, and operational configuration.

**Goals:**

- Understand system-wide impact.
- Investigate infrastructure and dependency failures.
- Analyze reliability signals.
- Validate technical hypotheses.
- Improve system resilience.

**SentinelAI interaction:**

- Investigate incidents across services and infrastructure.
- Review dependency relationships.
- Analyze system evidence.
- Validate AI-assisted findings.
- Configure or participate in controlled simulations.
- Contribute technical remediation findings.

### 2.3 Software Developer

**Role:** Engineer responsible for application services and application-level behavior.

**Goals:**

- Determine whether application changes contributed to an incident.
- Understand affected services.
- Investigate application evidence.
- Validate application-level root-cause hypotheses.

**SentinelAI interaction:**

- Review incidents involving owned services.
- Inspect timelines and correlated evidence.
- Review AI-generated hypotheses.
- Provide application context and findings.
- Record remediation information.

## 3. Secondary Users

### 3.1 Incident Commander

**Role:** Person coordinating the overall incident response.

**Goals:**

- Maintain situational awareness.
- Track incident progress.
- Coordinate engineering responders.
- Ensure important decisions and findings are recorded.

**SentinelAI interaction:**

- Monitor incident state.
- Review investigation summaries.
- Review impact and timeline information.
- Track investigation progress.
- Review final findings and incident reports.

The Incident Commander focuses on coordination and decision visibility rather than performing every technical investigation task.

### 3.2 Engineering Manager / Technical Lead

**Role:** Technical stakeholder responsible for engineering outcomes, reliability, and post-incident improvement.

**Goals:**

- Understand incident impact and root causes.
- Review investigation quality.
- Identify recurring reliability problems.
- Ensure corrective actions are tracked.

**SentinelAI interaction:**

- Review incident summaries and reports.
- Review root-cause findings.
- Evaluate remediation and follow-up actions.
- Use historical incident information for reliability improvement.

## 4. Administrative User

### 4.1 SentinelAI Administrator

**Role:** User responsible for platform configuration and operational administration.

**Goals:**

- Manage platform configuration.
- Manage users and access policies.
- Maintain integrations and system settings.
- Monitor platform health.

**SentinelAI interaction:**

- Manage users and roles.
- Configure supported integrations.
- Manage platform-level settings.
- Review audit information.
- Manage simulation configuration where authorized.

Administrative privileges must remain separate from normal incident-investigation privileges wherever practical.

## 5. External / Integrated Systems

SentinelAI may interact with external systems that are not human users. These systems are treated as integration actors rather than SentinelAI users.

Potential integration actors include:

- Monitoring and metrics systems.
- Centralized logging systems.
- Alerting systems.
- Source-control and deployment systems.
- Cloud or infrastructure platforms.
- Identity providers.
- AI model providers.

These integrations will be formally defined during the API and integration requirements phase.

## 6. Stakeholder Groups

### Engineering Teams

Primary beneficiaries responsible for incident investigation, service ownership, remediation, and reliability improvement.

### Platform / Infrastructure Teams

Responsible for infrastructure reliability, operational integrations, and platform health.

### Engineering Leadership

Interested in incident impact, reliability trends, operational efficiency, and engineering outcomes.

### Security / Governance Stakeholders

Interested in access control, auditability, data handling, and safe operational boundaries.

### Project / Product Stakeholders

Interested in product scope, usability, measurable outcomes, and successful delivery of SentinelAI.

## 7. High-Level Access Model

Access will follow the principle of least privilege. Users should receive only the capabilities required for their responsibilities.

| Role                                 | Investigation | Incident Management | AI Analysis   | Simulation    | Administration |
| ------------------------------------ | ------------- | ------------------- | ------------- | ------------- | -------------- |
| Incident Responder                   | Yes           | Yes                 | Yes           | Limited       | No             |
| SRE / Platform Engineer              | Yes           | Yes                 | Yes           | Authorized    | No             |
| Software Developer                   | Yes           | Limited             | Yes           | Authorized    | No             |
| Incident Commander                   | Review        | Yes                 | Yes           | No            | No             |
| Engineering Manager / Technical Lead | Review        | Review              | Review        | No            | No             |
| SentinelAI Administrator             | As authorized | As authorized       | As authorized | As authorized | Yes            |

This table establishes product-level expectations only. Final permissions and authorization rules will be defined in the security architecture and authorization requirements.

## 8. Human-in-the-Loop Principle

SentinelAI must preserve meaningful human oversight for consequential operational decisions.

AI-generated analysis, root-cause hypotheses, confidence values, and recommendations are advisory outputs. Authorized engineers remain responsible for validating evidence and making final operational decisions.

## 9. Role Boundary Principle

Roles should be separated according to responsibility rather than convenience. Incident investigation, incident coordination, platform administration, and production-impacting actions should not automatically share unrestricted privileges.

## 10. Scope

This document establishes the users, personas, stakeholders, and high-level access expectations for SentinelAI. Detailed use cases, permissions, authorization policies, workflows, and API contracts will be defined in subsequent Phase 1 steps.
