# Extras

Opt-in features for the harness scaffold. Default scaffold is lean (single-repo,
tech-agnostic, no pre-built agents). Add only what your project needs.

## Available extras

| Directory | What it adds | When to adopt |
|---|---|---|
| `multi-repo/` | Sibling-repo retrieval pattern: `.ai/RETRIEVAL_INDEX.md`, `multi-repo-context` Claude agent, settings.json `Read(...)` allow patches | Your project participates in a multi-codebase runtime system (TV + mobile + launcher + service repos that interact at runtime) |
| `conventions/` | Stack-specific engineering rule snippets to copy into `.ai/CONVENTIONS.md` (TypeScript, React, testing) and the path-scoped-rules pattern doc | You want stack-aware AI guidance beyond the cross-stack core in the default `CONVENTIONS.md` |
| `stack-lightning/` | LightningJS / Smart TV bundle: `smart-tv.md` convention snippet, `lightning-sdk-patterns.md` SDK reference, `lightningJs/registry.md` deep-dive | Your project targets LightningJS / Tizen / WebOS / Vizio / older Chromium TV engines |
| `agents/` | Pre-built agent prompts (architecture review, OWASP, refactor, security review, test creation/runner, etc.) | You want a starting library of agent definitions to wire into Claude `.claude/agents/`, OpenCode `agent:`, or Cursor rules |

## How to adopt an extra

Each subdirectory has its own `README.md` with exact install steps. The general pattern:

1. Copy or symlink the relevant files from `.ai/extras/<name>/` into the main scaffold tree
   (e.g. `.ai/extras/multi-repo/RETRIEVAL_INDEX.md` → `.ai/RETRIEVAL_INDEX.md`).
2. Update boot lists if the extra adds always-loaded files: `CLAUDE.md`, `AGENTS.md`,
   `.cursor/rules/harness-bootstrap.mdc`, `opencode.json` `instructions[]`.
3. Update the `CANONICAL_FILES` array in `.claude/hooks/session-start-status.mjs` if the
   extra adds files that the SessionStart hook should verify.
4. Update the canonical files list in `.claude/commands/harness-check.md` to match.
5. Run `/harness-check` to confirm the new file is detected.

## Why opt-in

The default scaffold targets the common case: single-repo, tech-agnostic, lean
context. Pre-shipping every capability would:

- Bloat the default boot context with rules adopters don't need.
- Tempt adopters to leave example content stale (drift hazard).
- Violate the lean-default + opt-in principle that scaffolds in the broader ecosystem
  (Cookiecutter, create-next-app, Yeoman) follow.

If you are unsure whether an extra applies, skip it — adopting later is a cheap copy
operation, but removing dead rules from a populated harness is harder.
