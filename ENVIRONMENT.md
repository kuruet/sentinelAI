# SentinelAI Environment Strategy

## Overview

SentinelAI uses environment variables for runtime configuration and secrets.

Environment-specific values must not be hard-coded into application source code.

## Environment Files

The repository uses the following convention:

- `.env.example` — committed template containing variable names and safe example values.
- `.env` — local developer configuration; never commit.
- `.env.*` — environment-specific local configuration; never commit.

The `.env.example` file must never contain real credentials.

## Variable Naming

Environment variables use `SCREAMING_SNAKE_CASE`.

Examples:

- `DATABASE_URL`
- `REDIS_URL`
- `OPENAI_API_KEY`
- `JWT_SECRET`
- `PORT`

## Frontend Policy

Frontend variables are exposed to browser-side code when using Vite.

Variables prefixed with `VITE_` must therefore be treated as public.

Allowed examples:

- `VITE_API_BASE_URL`

Never place secrets in frontend-exposed variables.

Forbidden examples:

- `VITE_OPENAI_API_KEY`
- `VITE_DATABASE_URL`
- `VITE_JWT_SECRET`
- `VITE_REDIS_URL`

## Backend Policy

Backend-only configuration and secrets are provided through server-side environment variables.

Examples:

- `DATABASE_URL`
- `REDIS_URL`
- `OPENAI_API_KEY`
- `JWT_SECRET`

These values must never be exposed to frontend code.

## Simulation Engine Policy

The simulation engine uses environment variables for runtime configuration.

Examples:

- `SIMULATION_TARGET`
- `SIMULATION_INTERVAL`
- `BACKEND_URL`

## Secret Management

Real credentials must never be committed to Git.

For local development:

1. Copy `.env.example` to `.env`.
2. Fill in the required local values.
3. Keep `.env` untracked.

For CI/CD and production, secrets should be provided through the deployment platform's secret-management mechanism rather than committed files.

## Adding a New Variable

When introducing a new environment variable:

1. Use `SCREAMING_SNAKE_CASE`.
2. Add the variable to `.env.example`.
3. Document its purpose.
4. Keep real credentials out of Git.
5. Determine whether the variable is public or server-only.
6. Never expose server-only secrets through frontend configuration.

## Security Rule

If a value would be harmful if exposed publicly, it is a secret and must remain server-side.
