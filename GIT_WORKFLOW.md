# SentinelAI Git Workflow

## Branch Strategy

`main` is the stable integration branch.

New development should be performed on a dedicated branch and merged into `main` through a pull request when working in a team workflow.

## Branch Naming

Use lowercase, descriptive, kebab-case branch names.

Supported prefixes:

- `feature/` — new functionality
- `fix/` — bug fixes
- `refactor/` — code restructuring
- `docs/` — documentation
- `test/` — tests
- `chore/` — maintenance and tooling

Examples:

- `feature/incident-ingestion`
- `feature/ai-root-cause-analysis`
- `fix/auth-token-expiry`
- `docs/architecture`
- `chore/ci-pipeline`

## Commit Convention

SentinelAI uses Conventional Commits.

Format:

`<type>(optional-scope): <description>`

Supported primary types:

- `feat`
- `fix`
- `docs`
- `refactor`
- `test`
- `chore`

Examples:

- `feat: add incident ingestion endpoint`
- `fix(auth): handle expired token`
- `docs: document architecture`
- `test(simulation): add failure scenarios`
- `chore: establish CI pipeline`

Commit messages should be concise, descriptive, and focused on one logical change.

Avoid vague messages such as:

- `update stuff`
- `changes`
- `final`
- `working`

## Atomic Commits

Each commit should represent one logical change.

Avoid combining unrelated features, fixes, refactors, and documentation changes into one commit.

## Pull Requests

The preferred team workflow is:

1. Create a feature, fix, refactor, documentation, test, or chore branch.
2. Make focused commits.
3. Push the branch to GitHub.
4. Open a pull request into `main`.
5. Run automated quality checks.
6. Review the changes.
7. Merge into `main`.

## Main Branch

`main` should remain stable and deployable.

Direct commits to `main` should be avoided once collaborative development begins.

## Pull Behavior

This repository uses Git rebase when pulling:

`pull.rebase=true`

This keeps local history linear and avoids unnecessary merge commits during normal pulls.

## Push Behavior

This repository uses automatic upstream configuration for new branches:

`push.autoSetupRemote=true`

This allows a new branch to establish its upstream automatically on the first push.

## Line Endings

The repository uses `.gitattributes` to normalize text files.

Developers should not manually convert line endings as part of normal development.

## Secrets

Never commit:

- `.env`
- `.env.*`
- API keys
- passwords
- access tokens
- private keys
- production credentials

Use `.env.example` as the safe configuration template.

## Recommended Development Workflow

Typical feature workflow:

```text
git switch main
git pull
git switch -c feature/<name>
        ↓
Develop
        ↓
git status
git diff
        ↓
Run quality checks
        ↓
git add
git commit
git push
        ↓
Open Pull Request
        ↓
Review + CI
        ↓
Merge into main


```
