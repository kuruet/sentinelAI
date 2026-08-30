# SentinelAI Architecture Decisions

> Architecture Decision Records (ADRs) capture significant technical decisions and the reasoning behind them.

## Purpose

ADRs provide a durable record of why important architectural choices were made.

They should capture the context, alternatives, decision, consequences, and status of decisions that materially affect SentinelAI.

## When to Create an ADR

Create an ADR when a decision:

- materially affects system architecture
- introduces a significant technology or dependency choice
- changes an important service boundary
- affects security, reliability, scalability, or operations
- is difficult or expensive to reverse
- resolves an important architectural trade-off

Do not create an ADR for routine implementation details or minor code-level decisions.

## Naming Convention

Use sequential numbering with a descriptive kebab-case title:

```text
ADR-001-<short-description>.md
ADR-002-<short-description>.md
```

Example:

```text
ADR-001-pnpm-monorepo.md
```

## ADR Status

Use one of the following statuses:

- `proposed` — decision is under discussion
- `accepted` — decision has been approved and is current
- `superseded` — decision has been replaced by a later decision
- `deprecated` — decision is no longer recommended but remains historically relevant
- `rejected` — proposed decision was considered and explicitly rejected

## Required ADR Structure

Every ADR should contain:

```text
# ADR-NNN: Decision Title

Status: proposed
Date: YYYY-MM-DD

## Context

What problem or decision requires attention?

## Decision

What was decided?

## Alternatives Considered

What reasonable alternatives were evaluated?

## Consequences

What are the expected benefits, trade-offs, and risks?

## References

Relevant documentation, issues, specifications, or external references.
```

## Decision Principles

ADRs should:

- document the reasoning, not just the final choice
- describe meaningful alternatives
- make trade-offs explicit
- remain concise and focused
- reflect the actual project state
- be updated when a decision is superseded

## Current Decisions

No architecture decision records have been accepted yet.

As implementation decisions are made, ADRs will be added to this directory and linked from this index.
