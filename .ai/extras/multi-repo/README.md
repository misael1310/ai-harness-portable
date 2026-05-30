# Multi-repo retrieval extra

Adds support for retrieving the smallest relevant context from sibling repositories that
participate in a multi-codebase runtime system. Adopt this when your project is one piece of
a larger runtime (e.g., TV app + mobile wrapper + controller + cloud services that
communicate at runtime), not for unrelated repositories.

## What this adds

- `.ai/RETRIEVAL_INDEX.md` — canonical map of triggers to first-retrieval targets.
- `multi-repo-context.md` — a Claude Code subagent definition for focused sibling-repo
  reads. Belongs at `.claude/agents/multi-repo-context.md` after install.
- `settings-snippet.json` — example `Read(...)` allow patches for `.claude/settings.json`
  to grant read-only access to specific sibling-repo paths.

## Install

1. Copy `RETRIEVAL_INDEX.md` to `.ai/RETRIEVAL_INDEX.md`. Fill in the sibling table for
   your runtime.
2. Copy `multi-repo-context.md` to `.claude/agents/multi-repo-context.md`. Edit the
   sibling-repo table and trigger map to match your `.ai/RETRIEVAL_INDEX.md`.
3. Merge the `Read(...)` allow paths from `settings-snippet.json` into
   `.claude/settings.json` `permissions.allow`. Use absolute paths for sibling repos.
4. Update boot lists to include the new file. Add `.ai/RETRIEVAL_INDEX.md` after
   `.ai/PROJECT_INDEX.md` (or wherever you prefer in the boot order):
   - `CLAUDE.md` — boot sequence.
   - `AGENTS.md` — boot sequence.
   - `.cursor/rules/harness-bootstrap.mdc` — boot sequence.
   - `opencode.json` — `instructions[]` array.
5. Update `.claude/hooks/session-start-status.mjs` `CANONICAL_FILES` to include
   `RETRIEVAL_INDEX.md` so the session-start hook reports presence.
6. Update `.claude/commands/harness-check.md` step 1 canonical files list to include the
   same.
7. Update `.ai/HARNESS.md` "Bootstrap Fallback Phrase" to include
   `.ai/RETRIEVAL_INDEX.md`.
8. Update the architecture map in `.ai/PROJECT_CONTEXT.md` to reference the multi-repo
   pattern.
9. Run `/harness-check` to confirm the new file is detected (count should bump from 10/10
   to 11/11).

## When NOT to adopt

- Single-repo project. The default scaffold already supports this; multi-repo adds dead
  weight.
- Unrelated repositories that don't share runtime contracts. Multi-repo retrieval is
  meant for cross-runtime contract preservation, not cross-project navigation.
- Monorepo projects. A monorepo is one repo; use directory-scoped rules (path-scoped
  Claude rules under `.claude/rules/`) instead of multi-repo retrieval.
