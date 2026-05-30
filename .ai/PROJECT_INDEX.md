# Project Index

Use this as a lightweight map of the repo for AI retrieval.

## Important files

| Path | Purpose | Confidence |
|---|---|---|
| [TBD: README, manifest, build/typecheck config, entry points] | [TBD] | [TBD] |

## Entry points

- App entry: [TBD]
- Root component: [TBD]
- Router: [TBD]
- State/store: [TBD]
- API/client layer: [TBD]
- Tests: [TBD]

## Operational directories

| Path | Purpose | Notes |
|---|---|---|
| `.ai/plans/` | Active implementation plans for non-trivial tickets | Per-ticket plan file; lifecycle in `.ai/CONVENTIONS.md` "Plans Convention" |
| `.ai/plans/_template.md` | Canonical plan structure (copy when starting a plan) | Templates are never archived |
| `.ai/plans/archive/` | Completed plans (`status: done`) | Populated by `node .ai/scripts/archive-plan.mjs` |
| `.ai/scripts/archive-plan.mjs` | Plan archival script (single-responsibility companion to `rotate-handoff.mjs`) | Runs before `rotate-handoff.mjs` at task close |
| `.ai/scripts/rotate-handoff.mjs` | Handoff rotation engine | Tool-agnostic engine callable from OpenCode with `node .ai/scripts/rotate-handoff.mjs` |
| `.ai/archive/` | Rotated `TASK_LOG.md` entries past 500 lines | Created on first rotation |
| `.ai/extras/` | Opt-in features (multi-repo retrieval, stack-specific conventions, agent definitions) | See `.ai/extras/README.md` |

## Risky areas

- [TBD: project-specific surfaces — auth, tokens, payments, analytics, deploy, third-party
  integrations]
