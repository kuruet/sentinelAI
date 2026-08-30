# SentinelAI Development Standards

> **Status:** Foundation standard. These conventions apply to SentinelAI development and may be refined as the implementation evolves.

## Purpose

This document defines the engineering conventions used to keep SentinelAI consistent, maintainable, secure, and easy to review.

Standards should support clear engineering decisions without adding unnecessary process or tooling.

## Naming Conventions

Use descriptive names that communicate intent.

- Variables and functions: `camelCase`
- Classes, interfaces, and types: `PascalCase`
- Constants: `UPPER_SNAKE_CASE` when the value is a true application constant
- Files: use lowercase kebab-case for general modules unless the surrounding framework requires another convention
- Directories: use lowercase kebab-case
- Environment variables: `SCREAMING_SNAKE_CASE`

Avoid abbreviations unless they are widely understood in the project domain.

## TypeScript Standards

SentinelAI uses TypeScript with strict compiler settings.

- Preserve `strict: true` in TypeScript configurations.
- Prefer explicit domain types over `any`.
- Avoid `any` unless there is a documented and justified reason.
- Prefer `unknown` when the type of external data is not known.
- Validate external input before using it internally.
- Use union types or discriminated unions when they model domain states clearly.
- Keep functions focused and avoid unnecessary complexity.
- Prefer immutable data patterns when they improve clarity and safety.
- Do not use TypeScript compiler suppression directives without justification.

## Module and Import Standards

- Keep modules focused on a clear responsibility.
- Prefer imports from stable project boundaries rather than reaching into unrelated internal implementation details.
- Avoid circular dependencies.
- Remove unused imports and exports.
- Keep shared types and utilities in the appropriate shared package when they are genuinely reused.

## Function and Class Design

- Functions should have a clear responsibility.
- Prefer small, composable functions over large procedures.
- Keep side effects explicit.
- Avoid hidden global state.
- Use classes when object-oriented state or lifecycle behavior provides a clear benefit; do not introduce classes by default.
- Prefer composition over unnecessary inheritance.

## Error Handling

Errors should provide enough context to diagnose the failure without exposing secrets.

- Validate inputs at system boundaries.
- Fail explicitly when required assumptions are violated.
- Preserve useful error context when propagating failures.
- Do not silently swallow errors.
- Do not expose stack traces, credentials, tokens, or sensitive internal details to users.
- Use structured application errors when the backend error model is established.

## Logging

Logging should support diagnosis and operational visibility.

- Log meaningful events and failures, not every internal operation.
- Include useful context such as operation or request identifiers when available.
- Never log passwords, API keys, access tokens, private keys, or other secrets.
- Avoid logging sensitive user or system data unless required and appropriately protected.
- Prefer structured logging when the application logging framework is introduced.

## Configuration

Configuration must come from the appropriate environment or configuration layer.

- Never hard-code credentials or secrets.
- Keep server-only secrets on the backend.
- Treat `VITE_` variables as browser-visible configuration.
- Keep `.env` files out of Git.
- Add new environment variables to `.env.example` and document their purpose.

See [ENVIRONMENT.md](../../ENVIRONMENT.md) for the complete environment policy.

## Testing Standards

Tests should verify behavior and important failure conditions.

- Add tests for meaningful application behavior as services are implemented.
- Include important error and edge cases.
- Keep tests deterministic and isolated.
- Avoid tests that depend on external systems unless the test explicitly targets an integration boundary.
- Prefer focused unit tests for domain logic and integration tests for service boundaries.
- Keep test data representative but free of real credentials or sensitive information.

The exact testing framework will be established when application implementation begins.

## Dependency Standards

Dependencies should be introduced deliberately.

- Prefer existing project capabilities before adding a new dependency.
- Add dependencies only when they provide clear value.
- Keep dependency versions controlled by the repository package manager.
- Avoid duplicate libraries that solve the same problem without a strong reason.
- Review security, maintenance, licensing, and bundle/runtime impact before introducing significant dependencies.
- Keep development-only tooling in development dependencies.

## Security Standards

Security is a baseline requirement rather than a later feature.

- Never commit secrets.
- Validate untrusted input.
- Apply least-privilege principles to service access.
- Keep authentication and authorization decisions on trusted server-side boundaries.
- Do not trust client-provided authorization claims without server-side verification.
- Treat AI-generated output as untrusted data until validated for the intended use.
- Keep simulation capabilities isolated and controlled.

## Documentation Standards

- Keep documentation consistent with the actual implementation.
- Clearly label planned or proposed architecture.
- Update documentation when behavior, interfaces, or architecture materially changes.
- Record significant architectural decisions as ADRs in `docs/decisions/`.
- Prefer concise documentation that explains intent and trade-offs.

## Code Review Standards

Changes should be easy for another engineer to understand and verify.

Reviewers should consider:

- Correctness
- Type safety
- Security
- Error handling
- Test coverage
- Maintainability
- Performance where relevant
- Documentation impact

Pull requests should focus on one logical change whenever practical.

## Quality Gates

Before submitting a change, run:

```powershell
pnpm lint
pnpm format:check
pnpm typecheck
```

All required quality checks should pass before merging.

## Development Principle

When in doubt, prefer the simplest design that preserves correctness, security, observability, and future maintainability.
