# SentinelAI Architecture

> **Status:** Planned architecture. This document describes the intended system direction and will evolve as implementation decisions are finalized.

## System Overview

SentinelAI is designed as an AI-powered incident intelligence platform that helps engineering teams detect, investigate, understand, simulate, and respond to software incidents.

The planned system separates the user interface, backend services, AI intelligence, data storage, and controlled failure simulation into distinct responsibilities.

## Architecture

```text
                    +-------------------+
                    |      Engineers    |
                    +---------+---------+
                              |
                              v
                    +-------------------+
                    |     Frontend      |
                    |  Incident Console |
                    +---------+---------+
                              |
                              v
                    +-------------------+
                    |      Backend      |
                    |   API / Services  |
                    +----+---------+----+
                         |         |
              +----------+         +----------+
              v                               v
     +-------------------+          +-------------------+
     |    Data Layer     |          | AI Intelligence  |
     | Storage / Context |          | Analysis / RCA    |
     +-------------------+          +-------------------+
                         |
                         v
               +-------------------+
               | Simulation Engine |
               | Failure Scenarios |
               +-------------------+
```

## Architecture Layers

### Frontend

The frontend will provide the primary interface for engineers to view incidents, investigate system behavior, review AI-generated analysis, and interact with operational workflows.

The frontend is responsible for presentation and user interaction. It must not contain backend secrets or direct access to protected infrastructure resources.

### Backend

The backend will provide APIs and application services that coordinate incident ingestion, investigation workflows, authentication, persistence, and communication with intelligence services.

The backend acts as the primary server-side boundary for protected operations.

### AI Intelligence

The AI intelligence layer will analyze incident information and relevant system context to assist engineers with tasks such as root cause analysis, summarization, correlation, and recommended investigative actions.

AI-generated results should be treated as decision support rather than unquestioned truth.

### Data Layer

The data layer will persist incidents, system context, investigation information, and other operational records required by the platform.

The final database and storage technologies will be documented after those implementation decisions are made.

### Simulation Engine

The simulation engine will generate controlled failure scenarios against designated targets. Its purpose is to provide reproducible incident conditions for testing SentinelAI detection and analysis capabilities.

Simulation activities must remain isolated and controlled to avoid unintended impact on real systems.

## Communication Flow

The intended request and analysis flow is:

1. An engineer interacts with the frontend.
2. The frontend communicates with backend APIs.
3. The backend validates and processes the request.
4. Relevant incident and system context is retrieved from the data layer.
5. AI intelligence analyzes the available context when appropriate.
6. The backend returns structured results to the frontend.
7. The simulation engine can generate controlled incidents for validation and testing.

## Architectural Principles

- Clear separation of responsibilities
- Strong type safety
- Secure server-side handling of secrets
- Explicit service boundaries
- Reproducible development and testing
- Observable and explainable operational behavior
- Incremental architectural evolution

## Future Evolution

As SentinelAI is implemented, this document will be updated with concrete decisions covering:

- API boundaries and contracts
- Authentication and authorization
- Database technology and schema
- Event and messaging architecture
- AI provider and model strategy
- Observability architecture
- Deployment topology
- Security controls
- Failure simulation boundaries

Architectural decisions should be recorded in `docs/decisions/` when they materially affect the system design.
