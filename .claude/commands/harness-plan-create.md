---
description: Create an implementation plan. Copies .ai/plans/_template.md, fills frontmatter and sections, updates AGENT_HANDOFF.md with plan pointer. Does not implement.
allowed-tools: Read, Glob, Write, Edit
argument-hint: [ticket-id] [short-description]
---

Create a plan for the task described by the human. Follow `.ai/CONVENTIONS.md` "Plans Convention":

1. Read `.ai/plans/_template.md` to get the canonical structure.
2. Create the plan file at `.ai/plans/<ticket-id>-<kebab-summary>.md` (all lowercase).
3. Set frontmatter: `status: draft`, `ticket: <ticket-id>`, `branch: feature/<branch-name>`,
   `created: YYYY-MM-DD`, `last_updated: YYYY-MM-DD`.
4. Fill every section: Branch, Decisions, Scope (files to edit / out of scope), Steps
   (numbered with detail), Verification (command/smoke check), Handoff, Risks, Out of scope
   (deferred).
5. After creating the plan, update `.ai/AGENT_HANDOFF.md`:
   - "Current task" → task title from the plan.
   - "Plan" → `Plan file: .ai/plans/<plan-filename>.md · status: draft`.
   - "Current status" → check `[x] Plan ready`.
6. Do not implement. Report the plan path and wait for the human to approve.
