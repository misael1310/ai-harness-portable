# Tools Audit Log

Versioned record of one-time onboarding audits and periodic harness reviews per tool.
Populated by the protocol in `.claude/commands/harness-onboard.md` (Claude Code slash
command, also pasted as a plain prompt in OpenCode and Cursor).

## How to use

- One-time onboarding per tool, the first time it loads the harness.
- Periodic review when `rotate-handoff.mjs` prints a reminder (every 10 rotations or 90
  days since last review, whichever fires first).
- Each entry records: date, tool, findings table, remediations applied, remediations
  deferred, and reviewer notes.
- Append, never delete. Older entries are historical context.

## Template

```markdown
## YYYY-MM-DD — <tool name>

**Operator:** <name> · **Trigger:** onboarding | scheduled | drift detected

### Findings

| # | Severity | Type | File(s) | Finding | Proposed remediation | Status |
|---|---|---|---|---|---|---|

### Remediations applied

- <bullet list of edits the human approved and the agent applied, with file paths>

### Remediations deferred

- <bullet list of suggestions the human declined or postponed, with reason>

### Notes

<free-form observations: tool-native features adopted, drift root cause, follow-up items>
```

## Audit history

(Append new audits below this line. Most recent first.)
