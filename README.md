# SentinelAI

AI-powered incident intelligence platform for detecting, analyzing, simulating, and responding to software incidents.

## Project Status

SentinelAI now includes a containerized application stack suitable for local development, deterministic demonstrations, and deployment-readiness validation.

The repository currently includes:

- React + Vite incident console
- Fastify + TypeScript backend API
- PostgreSQL 17 persistence
- Redis 8 cache and queue infrastructure
- BullMQ worker infrastructure
- Prisma 7 database integration
- AI provider abstraction
- Authentication and security controls
- Deterministic incident demo scenario
- Docker-based production packaging
- Docker Compose service orchestration
- Health and dependency-readiness endpoints
- Automated lint, formatting, typecheck, and CI quality gates

Core incident-management, investigation, evidence, simulation, AI, security, and deployment capabilities have been implemented incrementally and verified through the project phases.

## Vision

SentinelAI is designed to help engineering teams understand and respond to incidents faster by combining incident data, system context, AI-assisted analysis, and controlled failure simulation.

The platform supports:

- Incident ingestion and normalization
- Incident investigation
- AI-assisted root cause analysis
- System and service context
- Failure simulation
- Operational insights
- Incident reporting

The implementation is organized around the repository architecture and verified capabilities described in the project documentation.

## High-Level Architecture

```text
Users / Engineers
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
+---------+---------+
          |
     +----+----+
     |         |
     v         v
+---------+ +----------------+
|  Data   | | AI Intelligence|
| Storage | |   / Analysis   |
+---------+ +----------------+
          |
          v
+-------------------+
| Simulation Engine |
| Failure Scenarios |
+-------------------+
```

## Repository Structure

```text
sentinelAI/
├── backend/
├── frontend/
├── shared/
├── simulation-engine/
├── docs/
│   ├── architecture/
│   ├── development/
│   └── decisions/
├── .env.example
├── ENVIRONMENT.md
├── GIT_WORKFLOW.md
├── eslint.config.mjs
├── package.json
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

## Getting Started

### Prerequisites

Install the following before working on SentinelAI:

- Node.js
- pnpm

The repository pins its package manager version in `package.json`.

### Install Dependencies

From the repository root:

```powershell
pnpm install
```

### Environment Configuration

Create a local environment file from the committed template:

```powershell
Copy-Item .env.example .env
```

Then configure the required local values.

Never commit `.env` or real credentials.

See [ENVIRONMENT.md](ENVIRONMENT.md) for the complete environment policy.

### Quality Checks

Run the linter:

```powershell
pnpm lint
```

Check formatting:

```powershell
pnpm format:check
```

Format the repository:

```powershell
pnpm format
```

## Documentation

| Document                                                  | Purpose                                                                        |
| --------------------------------------------------------- | ------------------------------------------------------------------------------ |
| [Environment Strategy](ENVIRONMENT.md)                    | Environment variables and secret-management policy                             |
| [Git Workflow](GIT_WORKFLOW.md)                           | Branching, commits, pull requests, and Git conventions                         |
| [Architecture](docs/architecture/ARCHITECTURE.md)         | Planned system architecture                                                    |
| [Deployment & Demo Guide](docs/development/DEPLOYMENT.md) | Container deployment, health checks, recovery, and deterministic demo workflow |
| [Development Guide](docs/development/DEVELOPMENT.md)      | Local development workflow                                                     |
| [Development Standards](docs/development/STANDARDS.md)    | Coding, testing, security, and review conventions                              |
| [Architecture Decisions](docs/decisions/README.md)        | Architecture decision records                                                  |

## Development Philosophy

SentinelAI is being developed incrementally with an emphasis on:

- Clear architecture
- Strong type safety
- Automated code quality
- Secure configuration
- Reproducible development
- Small, reviewable changes
- Explicit architectural decisions

## License

License information will be added when the project's licensing decision is finalized.
