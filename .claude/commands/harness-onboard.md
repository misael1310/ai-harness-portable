---
description: One-time onboarding for the AI harness. Deep project detection, automatic population of canonical templates, and tool-native gap audit.
allowed-tools: Read, Glob, Grep, Bash, Write, StrReplace
---

You are being onboarded into a multi-tool AI harness scaffolded in this repository. Three
tools share `.ai/` as canonical operational memory: Claude Code, OpenCode, and Cursor.

This onboarding runs **once per tool** the first time each tool loads the harness. It has
two phases:

1. **Deep Project Detection & Automatic Population** — inspect the host project, research deeply, and automatically fill out canonical templates.
2. **Tool-native gap audit** — check that your tool's config uses its native security and
   boot features correctly, and report findings.

---

## Phase 1 — Deep Project Detection & Automatic Population

1. **Identify which tool you are.** State it clearly at the top of your report.

2. **Inspect the host project.** Look for manifests and structure across a variety of stacks (Python, JavaScript, TypeScript, React, Next.js, LightningJS, SolidJS, C#, etc.):
   - `package.json` → language (TypeScript/JavaScript), frameworks (React, Next.js, Vue, Express, Vite, SolidJS, LightningJS), scripts (`build`, `lint`, `test`, `dev`), package manager.
   - `tsconfig.json` → TypeScript presence and strictness settings.
   - `pyproject.toml` / `setup.cfg` / `requirements.txt` → Python project.
   - `*.csproj` / `*.sln` → C# / .NET project.
   - `Cargo.toml` → Rust project.
   - `go.mod` → Go project.
   - `.nvmrc` / `.node-version` → Node version.
   - `README.md` → project description.

   Research deeply into the project structure to understand the architecture, state management, testing frameworks, and entry points. Use best practices to infer:
   - **Project Identity**: Name and description from README, manifest files, or the root directory name.
   - **Runtime Targets**: Infer if the project targets TVs (e.g., LightningJS), Mobile (e.g., React Native), Desktop (e.g., Electron/Tauri), or standard Web/Backend environments.
   - **Multi-Repo Architecture**: Scan for microservices, submodules, or monorepo tools (Nx, Lerna, Turborepo, workspace configs). If detected, document the sibling directories; otherwise, delete multi-repo placeholders.
   - **Sensitive Areas**: Infer sensitive areas based on the stack (e.g., NextAuth endpoints, Supabase configs, Stripe webhooks, specific analytics events).
   - **Scripts**: Identify the exact working commands for build, dev, lint, and test from the manifests.

3. **Automatically fill `.ai/PROJECT_CONTEXT.md`**. You MUST write to the file directly and remove ALL `[TBD]` placeholders. Make your best-effort inferences based on your deep research. Delete sections that do not apply to this stack. Fill at minimum:
   - **Purpose**: from README or manifest description.
   - **Stack** table: language, runtime, frameworks, UI framework, state management, testing, package manager, build tool, target devices/browsers.
   - **Common Project Types**: check the boxes that apply, delete the rest.
   - **Architecture Map** table: populate with actual detected entry points, src directory, components, utils, config, types.
   - **Build, Test, And Verification Commands**: from detected scripts/build tools.
   - **Current Constraints** & **Known Risks**: keep generic ones, add detected project-specific ones, remove `[TBD]` markers.

4. **Automatically fill `.ai/PROJECT_INDEX.md`**. You MUST write to the file directly and remove ALL `[TBD]` placeholders:
   - **Important files**: actual manifest, build config, README, entry file(s), source tree.
   - **Entry points**: app entry, router, state/store, API layer, tests.
   - **Risky areas**: auth, tokens, analytics, CI/CD — confirm with Glob whether these directories exist.

5. **Clean up tool entry points**. Remove any `[TBD]` placeholders in `CLAUDE.md`, `AGENTS.md`, and `.cursor/rules/harness-bootstrap.mdc`, replacing them with inferred values or deleting them if irrelevant.

Report a summary of the automated changes you made. Do NOT ask for permission to write these canonical files; apply them automatically.

---

## Phase 2 — Tool-Native Gap Audit

**This phase does NOT write files automatically.** Produce findings and wait for per-finding approval.

1. **Read the canonical workspace** in this order and confirm each file is present:
   - `.ai/PROJECT_CONTEXT.md`
   - `.ai/SECURITY_RULES.md`
   - `.ai/AGENT_HANDOFF.md`
   - `.ai/CONVENTIONS.md`
   - `.ai/HARNESS.md`
   - `.ai/DECISIONS.md`
   - `.ai/PROJECT_INDEX.md`
   - `.ai/TOOLS_AUDIT.md`
   - `.ai/TASK_LOG.md`
   - `.ai/scripts/rotate-handoff.mjs`

2. **Read your tool's entry point and config:**
   - Claude Code: `CLAUDE.md`, `.claude/settings.json`, `.claude/hooks/*`,
     `.claude/commands/*`, `.claude/agents/*`.
   - OpenCode: `AGENTS.md`, `opencode.json`.
   - Cursor: `.cursor/rules/*.mdc`.

3. **Run a tool-native gap audit.** For each gap, classify severity and reasoning.

   ### Claude Code (if you are Claude Code)
   - Does `CLAUDE.md` stay under ~200 lines for adherence?
   - Are skills (`.claude/skills/`) used where appropriate, vs duplicating logic in commands?
   - Are `.claude/agents/*` proactively invocable?
   - Are hooks (`PreToolUse`, `Stop`, `SessionStart`, `UserPromptSubmit`) used to enforce
     security/policy that cannot drift via prompt?
   - Are `.claude/settings.json` permissions consistent with `.ai/SECURITY_RULES.md` deny
     list?
   - Could path-scoped rules (`.claude/rules/`) reduce context per task?
   - Is auto-memory (`MEMORY.md`) considered for facts that benefit from on-demand loading?

   ### OpenCode (if you are OpenCode)
   - Are `permission.bash` patterns scoped tightly enough (allow build/lint/test, deny
     installs/network/destructive, ask for ambiguous)?
   - Does `instructions[]` cover all canonical `.ai/` files?
   - Are agent roles (build, plan, fix) differentiated where supported?
   - Is `permission.edit` set to `ask` for security-sensitive paths?

   ### Cursor (if you are Cursor)
   - Do `.cursor/rules/*.mdc` use `globs:` for path-scoping where the rule is
     path-specific, instead of `alwaysApply: true`?
   - Are global rules kept short (Cursor adherence threshold mirrors Claude Code)?
   - Are MDC frontmatter fields (`description`, `globs`, `alwaysApply`) used correctly?

   ### Cross-tool (any tool)
   - Is the handoff lifecycle (`rotate-handoff.mjs`) callable from your tool?
   - Are secrets and sensitive paths denied at the tool level (not only documented)?
   - **Subagent Assessment**: Review the powerful personas available in `.ai/extras/agents/`. Ask the user if they would like to automatically install any of these specialized agents (e.g., OWASP Security, Test Runner, Clean Code Reviewer) into their tool's native configuration.

4. **Produce a findings table.**

   | # | Severity | Type | File(s) | Finding | Proposed remediation |
   |---|---|---|---|---|---|

   Severity: `low` / `medium` / `high`. Type: `gap` / `drift` / `bloat` / `security`.

5. **Append your findings to `.ai/TOOLS_AUDIT.md`** under the section for your tool, but
   **only after the human approves the audit content.** Each remediation is applied only
   after explicit approval, one at a time.

6. After applying all approved remediations, update `.ai/.harness-state.json`:

   ```json
   {
     "last_review_iso": "<ISO timestamp now>",
     "last_review_tool": "<tool name>",
     "rotation_count_since_last_review": 0
   }
   ```

7. End your report with: `Onboarding complete for <tool>. Phase 1 applied: automatic population. Gap audit findings: <count high>/<count medium>/<count low>. Approved remediations applied: <count>/<count>.`

---

## Security guardrails

- Never read secrets, `.env`, keys, or paths matching the deny list in
  `.ai/SECURITY_RULES.md`.
- Never apply Tool-Native Gap Audit edits without explicit per-finding approval.
- Never modify `.ai/SECURITY_RULES.md` to relax a rule. To tighten or clarify, use the
  conversational protocol in `.ai/HARNESS.md` "Adding New Rules and Conventions (Conversational Protocol)".
- Never run network commands, install dependencies, or run destructive commands as part of
  this audit.

## Output target

Under ~600 lines. Group low-severity findings into a brief bullet list when count is high.
