# Claude Code Instructions

This repository keeps the canonical AI workspace in `.ai/`. This file is intentionally thin —
the hub. Durable project knowledge lives in `.ai/`, not here.

## Session start — read these first, always

```
@.ai/AGENT_HANDOFF.md
@.ai/PROJECT_CONTEXT.md
@.ai/RETRIEVAL_INDEX.md
```

## Lazy-load on demand — read only when the task touches that area

| When... | Read |
|---|---|
| Writing or reviewing code | `@.ai/CONVENTIONS.md` |
| Auth, tokens, secrets, CORS, CSP, analytics | `@.ai/SECURITY_RULES.md` |
| Handoff, self-test, maintenance, adding rules | `@.ai/HARNESS.md` |
| Architectural decisions | `@.ai/DECISIONS.md` |
| Exploring the codebase | `@.ai/PROJECT_INDEX.md` |

## Harness operations — read only during those operations

| Operation | Read |
|---|---|
| Onboarding or drift review | `@.ai/TOOLS_AUDIT.md` |
| Handoff rotation | `@.ai/TASK_LOG.md` |

## Commands reference

| Action | How |
|---|---|
| Self-test | `/harness-check` |
| Onboarding | `/harness-onboard` |
| Drift review | `/harness-review` |
| Rotate handoff | `/handoff-complete` |
| Auto-Evolve | `/harness-evolve` |
| Add rule | `"Save this as a rule: <text>"` → wait for confirmation |
| Create plan | Copy `.ai/plans/_template.md`, set `status: draft` |

## Security

Follow `@.ai/SECURITY_RULES.md` and OWASP Top 10. Never read secrets. Never commit;
the human handles commits. Ask before installs, network, destructive ops, or edits to
auth, CORS, CSP, CI/CD, or deployment code.

## Language convention

- Conversation, questions, clarifications: Spanish.
- Everything written to disk (code, comments, commits, PRs, docs, handoffs, logs): English.

## Multi-repo

Read `@.ai/RETRIEVAL_INDEX.md` at session start. Retrieve the smallest relevant sibling-repo
context before tasks touching architecture, integration, URLs, analytics, or cross-repo
contracts.

## Verification & Self-Correction

Whenever code is added, updated, or removed, you MUST run the project's verification
commands as recorded in `@.ai/PROJECT_CONTEXT.md` (typically a typecheck + lint + tests
combination). For Node projects the common defaults are:

```
npm run check:types   # TypeScript strict type-check (no emit) — if TypeScript
npm run lint:fix      # ESLint auto-fix — if ESLint
npm test              # test runner — if one is configured
```

If any gate fails, read the error trace, analyze the failure, and iteratively fix until
all pass. Do not stop and wait for the human to tell you to fix the error.

Verify commands are detected from the project manifest during onboarding and filled into
`@.ai/PROJECT_CONTEXT.md`. If not yet onboarded, ask before running any verification.

## Harness verification protocol (no false positives)

For required harness files, use evidence-based existence checks:
- Do not classify files as missing from pattern search alone.
- Prefer direct exact-path Read as primary evidence.
- If Read succeeds, file exists (authoritative).
- If Read fails, perform one independent secondary check before declaring missing.
- If results conflict and Read cannot confirm, mark as "inconclusive" and ask for one exact path from the human.

During self-test reporting, separate:
- Missing (confirmed)
- Inconclusive (conflicting checks)
- Present (read-confirmed)

## Post-Edit Review Gate

Follow `@.ai/HARNESS.md` "Post-Edit Review Gate" — single source of truth for the
route taxonomy, the skip allowlist, the subagents to invoke, and the per-tool
persona paths. The Claude Code `Stop` hook in `.claude/settings.json` enforces
the security route floor at turn end.

## Lazy loading rule

**Do NOT preemptively load all referenced files at session start.** Read the three
session-start files above, then load others only when the task requires them. When
a file is loaded via `@` reference, treat its content as mandatory instructions.
