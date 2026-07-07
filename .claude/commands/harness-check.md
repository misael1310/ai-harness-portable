---
description: Self-test for the AI harness. Confirms which canonical files were loaded, summarizes active rules, lists tool-specific tooling status, and reports any drift detected.
allowed-tools: Read, Glob, Bash(node .claude/hooks/stop-review-gate.test.mjs)
---

Run a harness self-test for this repository. The goal is to confirm that this session has
loaded the canonical AI workspace correctly and to surface any inconsistency before work
begins.

Steps:

1. Read these files in order and confirm they exist (default scaffold; if
   `.ai/extras/multi-repo/` is adopted, also include `.ai/RETRIEVAL_INDEX.md`):
   - `.ai/PROJECT_CONTEXT.md`
   - `.ai/SECURITY_RULES.md`
   - `.ai/AGENT_HANDOFF.md`
   - `.ai/CONVENTIONS.md`
   - `.ai/HARNESS.md`
   - `.ai/DECISIONS.md`
   - `.ai/PROJECT_INDEX.md`
   - `.ai/RETRIEVAL_INDEX.md`
   - `.ai/TOOLS_AUDIT.md`
   - `.ai/TASK_LOG.md`
   - `.ai/scripts/rotate-handoff.mjs`
   - `.ai/scripts/archive-plan.mjs`

2. Confirm tool entry points:
   - `CLAUDE.md` (this tool's entry point)
   - `AGENTS.md` (OpenCode entry point — should exist for cross-tool consistency)
   - `opencode.json` (OpenCode config)
   - `.cursor/rules/harness-bootstrap.mdc` and `.cursor/rules/handoff-protocol.mdc`

3. Check `.claude/` artifacts:
   - `.claude/settings.json`
   - `.claude/hooks/block-destructive.mjs`
   - `.claude/hooks/protect-sensitive-paths.mjs`
   - `.claude/hooks/session-start-status.mjs`
   - `.claude/hooks/stop-review-gate.mjs`
   - `.claude/hooks/stop-review-gate.test.mjs`
   - `.claude/commands/handoff-complete.md`
   - `.claude/commands/harness-check.md` (this file)
   - `.claude/commands/harness-review.md`
   - `.claude/commands/harness-onboard.md`
   - `.claude/commands/harness-plan-create.md`
   - `.claude/commands/harness-plan-archive.md`
   - `.claude/commands/harness-security-scan.md`
   - `.claude/agents/` and `.claude/rules/` may be empty in the default scaffold;
     populated when adopting `.ai/extras/agents/` or authoring path-scoped rules
     (`.ai/extras/conventions/path-scoped-rules-pattern.md`).

4. Summarize for the human:
   - **Loaded files**: count of canonical `.ai/` files found vs expected.
   - **Active rules digest**: 5–10 bullet-point summary of the most load-bearing rules from
     `CONVENTIONS.md` and `SECURITY_RULES.md` (TV constraints, language convention, handoff
     protocol, multi-repo retrieval, OWASP, hard blocks).
   - **Current task**: title and status from `.ai/AGENT_HANDOFF.md`.
   - **Drift / missing artifacts**: list anything missing or inconsistent (e.g., a rule in
     `.ai/CONVENTIONS.md` not reflected in `CLAUDE.md`, a deny pattern in `SECURITY_RULES.md`
     not in `.claude/settings.json`, or risk-router `SECURITY_PATHS` drift between
     `.ai/HARNESS.md`, `.claude/hooks/stop-review-gate.mjs`, and `opencode.json`).
   - **Hook self-test**: if Node.js is available, run
     `node .claude/hooks/stop-review-gate.test.mjs`; otherwise report it as skipped.
   - **Pending review reminder**: read `.ai/.harness-state.json` if present and report rotation
     count vs review-due threshold (default 10 rotations).

5. End with a one-line confirmation: `Harness OK` or `Harness check found N issues — see
   above`.

Keep the entire output under ~250 lines. Do not edit any files; this is a read-only check.

The same check is described in `.ai/HARNESS.md` "Harness Self-Test" so OpenCode and Cursor
can run an equivalent check by following the protocol in plain prompt form.
