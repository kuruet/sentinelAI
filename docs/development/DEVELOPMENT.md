# SentinelAI Development Guide

> **Status:** Foundation phase. This guide documents the current repository workflow and will evolve as application services are implemented.

## Prerequisites

Install the following tools before working on SentinelAI:

- Node.js
- pnpm 10.15.0 or the version declared by `package.json`
- Git

## Repository Setup

Clone the repository and move into the project directory.

Install dependencies from the repository root:

```powershell
pnpm install
```

## Environment Setup

Create a local environment file from the committed example:

```powershell
Copy-Item .env.example .env
```

Configure local values in `.env` as required by the services you are working on.

Never commit `.env`, API keys, passwords, tokens, private keys, or production credentials.

See [ENVIRONMENT.md](../../ENVIRONMENT.md) for the environment and secret-management policy.

## Monorepo Structure

SentinelAI uses a pnpm workspace to organize its application packages.

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
├── package.json
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

The exact responsibilities of each package will become more concrete as implementation progresses.

## Quality Checks

Run ESLint before committing changes:

```powershell
pnpm lint
```

Check repository formatting:

```powershell
pnpm format:check
```

Automatically format the repository when required:

```powershell
pnpm format
```

Changes should not be committed while required quality checks are failing.

## Documentation Workflow

When making an architectural or development change:

1. Update the relevant documentation.
2. Keep documentation consistent with the actual implementation.
3. Mark planned functionality clearly when it is not yet implemented.
4. Record significant architectural decisions in `docs/decisions/`.

## Git Workflow

Use a dedicated branch for new development once collaborative implementation begins.

Recommended branch prefixes:

- `feature/`
- `fix/`
- `refactor/`
- `docs/`
- `test/`
- `chore/`

Use Conventional Commits for commit messages.

Example:

```text
feat(backend): add incident ingestion endpoint
```

See [GIT_WORKFLOW.md](../../GIT_WORKFLOW.md) for the complete Git workflow.

## Development Principles

- Keep changes small and reviewable.
- Prefer explicit and maintainable code.
- Preserve strong type safety.
- Keep secrets server-side.
- Avoid unnecessary dependencies.
- Update documentation when behavior or architecture changes.
- Do not claim unfinished functionality as implemented.

## Troubleshooting

If dependency installation behaves unexpectedly, verify the Node.js and pnpm versions and run `pnpm install` from the repository root.

If formatting fails, run `pnpm format` and inspect the resulting changes.

If linting fails, read the reported rule violation and correct the source rather than disabling the rule without justification.

If Git reports unexpected changes, run `git status` and inspect `git diff` before continuing.

## Related Documentation

- [Project README](../../README.md)
- [Architecture](../architecture/ARCHITECTURE.md)
- [Environment Strategy](../../ENVIRONMENT.md)
- [Git Workflow](../../GIT_WORKFLOW.md)
- [Architecture Decisions](../decisions/README.md)
- [Development Standards](STANDARDS.md)
