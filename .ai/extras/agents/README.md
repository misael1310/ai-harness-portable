# Agents extras

Pre-built, highly-opinionated subagent personas to wire into your tool's native agent path. 

The scaffold default does not ship a cross-tool `.ai/agents/` directory automatically because each tool has its own agent path, and having 10 powerful agents loaded at all times consumes context. Instead, you opt-in to the specific personas your project needs.

## Available Powerful Personas

| File | Persona / Purpose |
|---|---|
| `architecture-review-agent.md` | Strict Software Architect: Checks SOLID, boundary leaks, coupling. |
| `coding-best-practices-review-agent.md` | Staff Engineer: Enforces Clean Code, DRY, cyclomatic complexity reduction. |
| `data-integrity-review-agent.md` | Database Reliability Engineer: Migration safety, unsafe-query integrity consequences, seed/import/export, tenant/RLS isolation. Executable mirrors ship for Claude Code and OpenCode; Cursor references this canonical persona through its rule. |
| `docs-agent.md` | Dev Advocate: Writes perfect JSDoc/Docstrings without hallucination. |
| `owasp-top-10-agent.md` | AppSec Pen-Tester: Strictly hunts for OWASP Top 10:2025 vulnerabilities. |
| `project-conventions-agent.md` | The Gatekeeper: Ruthlessly enforces rules listed in `.ai/CONVENTIONS.md`. |
| `refactor-agent.md` | Martin Fowler Disciple: Proposes safe, step-by-step refactoring patterns. |
| `security-review-agent.md` | DevSecOps: Hunts for leaked secrets, risky dependencies, and CI flaws. |
| `test-creation-agent.md` | QA Automation: Writes BDD/TDD tests, mocking network/DB boundaries. |
| `test-runner-agent.md` | CI Bot: Executes tests, parses stack traces, and iterates until Green. |

## How to install

### For Claude Code

1. Copy the desired `<name>-agent.md` files into `.claude/agents/` (renaming to drop the
   `-agent` suffix is conventional but not required).
2. Add Claude Code agent frontmatter at the top of each file:
   ```yaml
   ---
   name: <agent-name>
   description: <when to invoke this agent — Claude uses this to decide>
   tools: Read, Grep, Glob, Bash, Write, StrReplace
   ---
   ```
3. Verify via `/harness-check` step 3 (`.claude/agents/*` artifact list).

### For OpenCode

1. For each desired agent, add a block to `opencode.json` `agent:`:
   ```json
   "agent": {
     "<agent-name>": {
       "mode": "subagent",
       "description": "<when to invoke>",
       "prompt": "<prompt body — copy the relevant sections from the .md file>",
       "permission": { "edit": "ask", "bash": "ask", "webfetch": "ask" }
     }
   }
   ```

### For Cursor

Cursor handles agents natively via its new Composer/Agent sub-task features, but you can also use path-scoped rules (`.cursor/rules/*.mdc`) and prefix them with the persona to prompt the Cursor agent to adopt that specific strict workflow.

## Why opt-in

Pre-shipping all 10 agents in the default scaffold:
- Tempts adopters to keep agents they never invoke (drift).
- Consumes massive context window overhead if globally active.
- Couples the scaffold to a specific agent topology.

Adopters pick the relevant 1–3 agents and wire them per their tools to keep their context lean and powerful.
