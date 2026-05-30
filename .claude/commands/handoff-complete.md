---
description: Rotate the current AGENT_HANDOFF.md into TASK_LOG.md and reset to a clean scaffold for the next task.
allowed-tools: Bash(node .ai/scripts/rotate-handoff.mjs)
---

Run the tool-agnostic handoff rotation engine:

```bash
node .ai/scripts/rotate-handoff.mjs
```

After the script reports success:

1. Read the freshly scaffolded `.ai/AGENT_HANDOFF.md`.
2. Fill in the next task's title, goal, non-goals, branch, and base branch.
3. Confirm with the human before starting implementation.

If the script reports rotation into `.ai/archive/TASK_LOG-YYYY-MM.md`, mention that to the
human so they know the monthly rollover happened.

Do not edit `.ai/TASK_LOG.md` or any archive file by hand. The script is the single source of
truth for the handoff lifecycle, shared across Claude Code, OpenCode, and Cursor.
