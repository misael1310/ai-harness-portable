---
description: Periodic harness maintenance. Detects drift, redundant rules, superseded decisions, and gaps across .ai/ and tool entry points. Suggests consolidation edits but does not apply them without confirmation.
allowed-tools: Read, Glob, Grep
---

Run a maintenance review of the AI harness. The goal is to catch drift before it compounds.

Steps:

1. Read all canonical files:
   - `.ai/PROJECT_CONTEXT.md`
   - `.ai/SECURITY_RULES.md`
   - `.ai/CONVENTIONS.md`
   - `.ai/HARNESS.md`
   - `.ai/DECISIONS.md`
   - `.ai/PROJECT_INDEX.md`
   - `.ai/RETRIEVAL_INDEX.md`
   - `.ai/TOOLS_AUDIT.md`
   - `.ai/AGENT_HANDOFF.md`
   - `.ai/TASK_LOG.md`
   - All tool entry points: `CLAUDE.md`, `AGENTS.md`, `opencode.json`,
     `.cursor/rules/*.mdc`
   - `.claude/settings.json`, `.claude/agents/*`, `.claude/commands/*`,
     `.claude/hooks/*`

2. Detect drift in these dimensions:

   - **Rule duplication**: same rule restated in two files with subtly different wording.
   - **Rule contradiction**: two files state opposing rules.
   - **Superseded decisions**: entries in `DECISIONS.md` that newer entries replace but are
     not marked as superseded.
   - **Tool-coverage gaps**: a rule in `.ai/CONVENTIONS.md` that has security or behavior
     implications but is not reflected in the relevant tool's entry point or settings (e.g.,
     a deny rule missing from `.claude/settings.json`).
   - **Stale references**: file paths or symbols quoted in `.ai/` that no longer exist in the
     codebase (use Glob/Grep to verify).
   - **Bloat**: any single `.ai/` file approaching 200 lines (Claude Code adherence
     threshold) or 500 lines (TASK_LOG rotation threshold).
   - **Orphan rules**: rules added but never referenced or applied since.

3. For each finding, provide:
   - **Type** (duplication / contradiction / superseded / gap / stale / bloat / orphan).
   - **Files involved** with exact line ranges.
   - **Suggested fix** (concrete edit, not abstract).
   - **Severity** (low / medium / high).

4. End with:
   - A summary table of findings.
   - A one-line verdict: `Harness clean` or `Harness has N findings — see above`.

5. **Do not apply edits.** This is a review pass. After presenting findings, ask the human
   which findings to fix and apply only those.

Output target: under ~600 lines. Prioritize medium/high severity findings; group low-severity
findings into a short bullet list.

After review, the human may ask you to update `.ai/.harness-state.json` to reset the rotation
counter:

```json
{ "rotation_count_since_last_review": 0, "last_review_iso": "<now>" }
```

The same review can be requested in OpenCode or Cursor by pasting the steps above as a plain
prompt.
