---
description: Archive a completed plan. Moves the plan to .ai/plans/archive/ after confirming status: done. Run BEFORE rotate-handoff.
allowed-tools: Bash(node .ai/scripts/archive-plan.mjs:*)
argument-hint: [plan-file.md]
---

Archive the plan at `.ai/plans/<plan-file>.md`:

1. Confirm the plan exists and its frontmatter `status` is `done`.
   If not `done`, warn and stop.
2. Run the archival script:
   ```
   node .ai/scripts/archive-plan.mjs .ai/plans/<plan-file>.md
   ```
3. Confirm the file was moved to `.ai/plans/archive/<plan-file>.md`.
4. Remind the human: after archive-plan, run `/handoff-complete` to rotate the handoff
   (archive-plan runs BEFORE rotate-handoff per `.ai/CONVENTIONS.md` "Plans Convention"
   closure ordering).

If the script reports an error (missing frontmatter, wrong status, file not found),
report the exact error to the human and stop.
