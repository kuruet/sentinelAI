# SentinelAI Deployment & Demo Guide

## Purpose

This guide documents the verified Docker-based deployment baseline and deterministic demonstration workflow.

The repository provides a reproducible local and demo deployment baseline. A specific cloud hosting provider is not prescribed.

## Prerequisites

Install:

- Node.js 22+
- pnpm
- Docker Desktop with Docker Compose

## Environment Setup

From the repository root:

    Copy-Item .env.example .env

Configure the required values in .env.

The Docker Compose deployment requires POSTGRES_PASSWORD and JWT_SECRET.

OPENAI_API_KEY is optional. When it is unavailable, the backend follows the controlled unavailable-provider behavior rather than fabricating AI output.

Never commit .env or real credentials.

Server-only secrets include DATABASE_URL, REDIS_URL, OPENAI_API_KEY, and JWT_SECRET. Never expose these through VITE_* variables.

See [Environment Strategy](../../ENVIRONMENT.md).

## Start the Stack

From the repository root:

    docker compose up -d
    docker compose ps

Expected services are sentinelai-postgres, sentinelai-redis, sentinelai-backend, and sentinelai-frontend.

Ports:

- PostgreSQL: 5433
- Redis: 6379
- Backend: 3000
- Frontend: 4173

## Health and Readiness

Backend health:

    Invoke-WebRequest -Uri http://127.0.0.1:3000/api/v1/health -UseBasicParsing

Backend dependency readiness:

    Invoke-WebRequest -Uri http://127.0.0.1:3000/api/v1/ready -UseBasicParsing

A ready deployment returns HTTP 200 with successful PostgreSQL, Redis, and BullMQ checks.

The frontend is available at http://127.0.0.1:4173/.

Verify its API proxy:

    Invoke-WebRequest -Uri http://127.0.0.1:4173/api/v1/health -UseBasicParsing

## Deterministic Demo

Run the existing demo verification:

    Push-Location .\backend
    pnpm exec tsx .\scripts\demo-scenario-test.ts
    Pop-Location

The verification checks the deterministic incident identifier, incident state and severity, commander, event sequence, chronology, evidence, investigation, and repeat initialization.

## Restart and Recovery

Restart all services:

    docker compose restart

Clean recreation:

    docker compose down
    docker compose up -d

Named PostgreSQL and Redis volumes are retained by docker compose down.

## Dependency Failure Testing

PostgreSQL recovery can be tested with:

    docker compose stop postgres
    docker compose start postgres

Redis recovery can be tested with:

    docker compose stop redis
    docker compose start redis
    docker exec sentinelai-redis redis-cli ping

Expected Redis response: PONG. Verify backend readiness after recovery.

## Stop the Deployment

    docker compose down

This removes containers and the network while retaining named data volumes.

## Production Images

Backend image:

    docker build -f backend/Dockerfile -t sentinelai-backend .

Frontend image:

    docker build -f frontend/Dockerfile -t sentinelai-frontend .

Secrets are supplied at runtime and are not copied into the images.

## Acceptance Checklist

Before a deployment/demo is considered ready:

- [ ] docker compose config --quiet succeeds
- [ ] PostgreSQL is healthy
- [ ] Redis is healthy
- [ ] Backend health returns HTTP 200
- [ ] Backend readiness returns HTTP 200
- [ ] Frontend returns HTTP 200
- [ ] Frontend API proxy returns HTTP 200
- [ ] Demo verification passes
- [ ] Fresh containers produce no unexpected application errors
- [ ] .env remains untracked
- [ ] Git working tree is clean after intended changes
