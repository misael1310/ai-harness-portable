# AGENTS.md

This repository uses `.ai/` as the canonical AI workspace shared across Claude Code,
OpenCode, and Cursor. This file is the hub — keep it under 80 lines.

## Always loaded

Language: Spanish conversation / English on disk. Never commit.
Security: never read secrets, `.env`, keys; ask before installs, network, destructive ops.
Verification: After code edits run `npm run check:types` and `npm run lint:fix`; self-correct failures automatically.
Tool entry points: `CLAUDE.md` + `.claude/`, `opencode.json`, `.cursor/rules/*.mdc`.

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
| Self-test | Follow `.claude/commands/harness-check.md` |
| Onboarding | Follow `.claude/commands/harness-onboard.md` |
| Drift review | Follow `.claude/commands/harness-review.md` |
| Rotate handoff | `node .ai/scripts/rotate-handoff.mjs` |
| Auto-Evolve | Follow `.claude/commands/harness-evolve.md` |
| Add rule | `"Save this as a rule: <text>"` → wait for confirmation |
| Create plan | Copy `.ai/plans/_template.md`, set `status: draft` |

## Lazy loading rule

**Do NOT preemptively load all referenced files at session start.** Read the three
session-start files above, then load others only when the task requires them. When
a file is loaded via `@` reference, treat its content as mandatory instructions.

## Self-test evidence rule (anti-false-positive)

When running harness/self-test checks, never report a file as missing based on search output alone.

Required verification order for every required path:
1. Attempt direct `@`/Read by exact path first.
2. If direct read succeeds, treat the file as existing (source of truth), even if Glob/search said missing.
3. If direct read fails, run one secondary check (directory read of parent or equivalent exact-path check).
4. Only report "missing" when both checks fail.
5. If checks disagree and direct read is not possible, report "inconclusive" (not "missing") and include both results.

Rule: a readable file exists.

## Post-Edit Review Gate

Follow `.ai/HARNESS.md` "Post-Edit Review Gate" — single source of truth for the
trigger taxonomy, the skip allowlist, the subagents to invoke, and the per-tool
persona paths.

<!-- CODEGRAPH_START -->
## CodeGraph

> **Optional dependency.** Requires the [`codegraph` CLI](https://github.com/Voids-Within/codegraph)
> installed on PATH. If unavailable, delete this block and the
> `mcp.codegraph` entry in `opencode.json` — the rest of the harness works
> without it.

This project has a CodeGraph MCP server (`codegraph_*` tools) configured. CodeGraph is a tree-sitter-parsed knowledge graph of every symbol, edge, and file. Reads are sub-millisecond and return structural information grep cannot.

### When to prefer codegraph over native search

Use codegraph for **structural** questions — what calls what, what would break, where is X defined, what is X's signature. Use native grep/read only for **literal text** queries (string contents, comments, log messages) or after you already have a specific file open.

| Question | Tool |
|---|---|
| "Where is X defined?" / "Find symbol named X" | `codegraph_search` |
| "What calls function Y?" | `codegraph_callers` |
| "What does Y call?" | `codegraph_callees` |
| "What would break if I changed Z?" | `codegraph_impact` |
| "Show me Y's signature / source / docstring" | `codegraph_node` |
| "Give me focused context for a task/area" | `codegraph_context` |
| "Survey an unfamiliar module/topic" | `codegraph_explore` |
| "What files exist under path/" | `codegraph_files` |
| "Is the index healthy?" | `codegraph_status` |

### Rules of thumb

- **Trust codegraph results.** They come from a full AST parse. Do NOT re-verify them with grep — that's slower, less accurate, and wastes context.
- **Don't grep first** when looking up a symbol by name. `codegraph_search` is faster and returns kind + location + signature in one call.
- **Don't chain `codegraph_search` + `codegraph_node`** when you just want context — `codegraph_context` is one call.
- **`codegraph_explore` is the heavy hitter** for unfamiliar areas — it returns full source from all relevant files in one call, but is token-heavy. If your harness supports parallel subagents (e.g., Claude Code's Task tool), spawn one for explore-class questions to keep main session context clean.
- **Index lag**: the file watcher debounces ~500ms behind writes; don't re-query immediately after editing a file in the same turn.

### If `.codegraph/` doesn't exist

The MCP server returns "not initialized." Ask the user: *"I notice this project doesn't have CodeGraph initialized. Want me to run `codegraph init -i` to build the index?"*
<!-- CODEGRAPH_END -->
