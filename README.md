# Portable AI Harness

Project-agnostic version of the multi-tool AI harness used with **Claude Code**,
**OpenCode**, and **Cursor**. Copy the contents of this directory into any project
to bootstrap the same operational memory, security rules, handoff lifecycle,
post-edit review gate, and Context7-aware conventions.

## What's inside

```
.ai-harness-portable/
├── .ai/
│   ├── AGENT_HANDOFF.md            # Clean scaffold (filled per task)
│   ├── PROJECT_CONTEXT.md          # TBD scaffold (populated by /harness-onboard)
│   ├── PROJECT_INDEX.md            # TBD scaffold
│   ├── RETRIEVAL_INDEX.md          # TBD scaffold (multi-repo opt-in)
│   ├── SECURITY_RULES.md           # OWASP-aligned baseline + per-project TBD section
│   ├── CONVENTIONS.md              # Cross-stack core (stack-specific lives in extras/)
│   ├── HARNESS.md                  # Multi-tool stack, handoff, review gate, onboarding
│   ├── DECISIONS.md                # Empty header + template
│   ├── TOOLS_AUDIT.md              # Empty header + template
│   ├── TASK_LOG.md                 # Empty header + template
│   ├── canonical-files.json        # Single source of truth for self-test
│   ├── .harness-state.json         # Rotation counters (reset)
│   ├── docs/                       # Generic workflow + Windows/WSL2 guides
│   ├── extras/                     # Opt-in features (multi-repo, conventions, agents, stack-lightning)
│   ├── plans/                      # Implementation plans (with _template.md)
│   ├── artifacts/                  # Per-ticket artifacts directory
│   └── scripts/
│       ├── rotate-handoff.mjs      # Handoff rotation engine
│       └── archive-plan.mjs        # Plan archival
├── .claude/
│   ├── settings.json               # Permissions, hooks, SessionStart status
│   ├── hooks/                      # block-destructive, protect-sensitive-paths, session-start-status, stop-review-gate
│   ├── commands/                   # /harness-check, /harness-onboard, /harness-review, /harness-evolve, /harness-plan-create, /harness-plan-archive, /harness-security-scan, /handoff-complete
│   └── agents/                     # 6 post-edit review personas + refactor
├── .opencode/
│   └── agents/                     # 6 OpenCode mirrors of the review personas
├── .cursor/
│   └── rules/                      # Generic harness rules only (no stack-specific rules)
├── AGENTS.md                       # OpenCode entry point
├── CLAUDE.md                       # Claude Code entry point
├── opencode.json                   # OpenCode config + CodeGraph MCP
├── install.ps1                     # Windows PowerShell installer
├── install.sh                      # POSIX bash installer
├── .gitignore.harness-suggested    # Suggested .gitignore additions
└── README.md                       # This file
```

## Install

### Windows (PowerShell)

```powershell
# Dry-run first to see what would be copied
.\install.ps1 -Destination "C:\repos\my-project" -DryRun

# Real install (refuses if files already exist)
.\install.ps1 -Destination "C:\repos\my-project"

# Force-overwrite existing files (asks for typed 'overwrite' confirmation)
.\install.ps1 -Destination "C:\repos\my-project" -Force

# Force without confirmation prompt (CI / scripted use)
.\install.ps1 -Destination "C:\repos\my-project" -Force -Yes
```

### macOS / Linux (bash)

```bash
# Dry-run first
./install.sh --destination /path/to/my-project --dry-run

# Real install (refuses if files already exist)
./install.sh --destination /path/to/my-project

# Force-overwrite (asks for typed 'overwrite' confirmation)
./install.sh --destination /path/to/my-project --force

# Force without prompt
./install.sh --destination /path/to/my-project --force --yes
```

Both installers:

- Detect every file that would collide with the destination and refuse to copy
  unless `--force` / `-Force` is supplied.
- Print every colliding path before asking for confirmation.
- Refuse if source and destination resolve to the same path.
- Never modify the destination project's `.gitignore` (see "Suggested gitignore"
  below).

## Post-install

1. **Optional** — Append the suggested `.gitignore` snippet:

   ```bash
   cat .gitignore.harness-suggested >> /path/to/my-project/.gitignore
   ```

   Or copy only the lines you want ignored. Decide per project whether `.ai/`
   should be committed (shared team memory) or kept per-developer.

2. **Run onboarding** in your AI tool of choice:

   - Claude Code: `/harness-onboard`
   - OpenCode: paste `.claude/commands/harness-onboard.md` as a plain prompt
   - Cursor: paste `.claude/commands/harness-onboard.md` as a plain prompt

   Onboarding inspects the host project (manifest, framework, scripts) and
   populates the `[TBD]` placeholders in `.ai/PROJECT_CONTEXT.md`,
   `.ai/PROJECT_INDEX.md`, and other canonical files automatically.

3. **Verify** the harness loaded correctly:

   - Claude Code: `/harness-check` — runs the deep self-test
   - Other tools: paste `.claude/commands/harness-check.md` as a plain prompt

## What "tabula rasa" means here

This portable kit has been stripped of all GameLoop-specific content:

- No project-specific tasks in `AGENT_HANDOFF.md`, decisions in `DECISIONS.md`,
  task log, tool audits, or plans / artifacts.
- No GameLoop sibling-repo map in `RETRIEVAL_INDEX.md` (TBD placeholders ready
  for the new project's siblings).
- No GameLoop sensitive areas in `SECURITY_RULES.md` (generic OWASP baseline +
  TBD placeholders).
- No LightningJS / Smart TV section embedded in `CONVENTIONS.md` (lives in
  `.ai/extras/stack-lightning/` for opt-in copy — convention snippet + SDK
  reference + Registry deep-dive).
- No stack-specific Cursor rules (`lightning-components.mdc`,
  `lightning-screens-and-router.mdc`, `project-architecture.mdc`,
  `typescript-standards.mdc`) — generate per-project via `/harness-onboard`.

Personal defaults preserved:

- Spanish conversation / English on disk language convention.
- CodeGraph MCP integration block in `AGENTS.md` and the global `CLAUDE.md`.
- npm-based verification gate as the common default (configurable per project
  during onboarding).

## Tool entry points after install

Each tool has its own thin entry point that delegates to `.ai/`:

| Tool        | Entry point                          | Tool dir       |
|-------------|--------------------------------------|----------------|
| Claude Code | `CLAUDE.md`                          | `.claude/`     |
| OpenCode    | `AGENTS.md` + `opencode.json`        | `.opencode/`*  |
| Cursor      | `.cursor/rules/*.mdc`                | `.cursor/`     |

*`.opencode/agents/` ships with read-only mirrors of the review personas so
OpenCode can run the post-edit review gate locally.

## Optional dependencies

The portable harness pre-wires two optional integrations. Both are safe to leave
configured if the corresponding tool is missing — the wiring simply no-ops — but
you can remove them outright if you do not use them:

### CodeGraph CLI

`opencode.json` declares an `mcp.codegraph` server, `AGENTS.md` documents
`codegraph_*` tool usage, and `.claude/settings.json` allows `codegraph` CLI
commands. These rely on the [`codegraph` CLI](https://github.com/Voids-Within/codegraph)
being installed on `PATH`. To remove:

1. Delete the `mcp` block from `opencode.json`.
2. Delete the `<!-- CODEGRAPH_START -->` … `<!-- CODEGRAPH_END -->` block from
   `AGENTS.md`.
3. Remove `Bash(codegraph*)` entries from `.claude/settings.json` allow list.
4. Delete `.cursor/rules/codegraph.mdc`.

### Node.js 18+

The harness's rotation script (`.ai/scripts/rotate-handoff.mjs`), archive script
(`.ai/scripts/archive-plan.mjs`), and Claude Code hooks (`.claude/hooks/*.mjs`)
are ESM modules. They require Node 18+ on `PATH`. Without Node:

- The `SessionStart` status hook fails silently (does not block the session).
- Handoff rotation cannot run automatically; users must hand-rotate
  `AGENT_HANDOFF.md` → `TASK_LOG.md`.
- Block-destructive and protect-sensitive-paths PreToolUse hooks fail open
  (commands proceed). **For pure-Node-less projects, port the hooks to your
  shell environment before removing Node.**

If your project does not use Node, run `/harness-onboard` to adjust the
permission allow list (replace `npm run *` entries with your build/lint/test
commands).

## Security notes

- Installers never run network calls, never install dependencies, never modify
  anything outside the destination path you pass.
- The harness itself follows OWASP Top 10 hygiene (see `.ai/SECURITY_RULES.md`).
- Pre-shipped permission allow/deny lists in `.claude/settings.json` and
  `opencode.json` block: secret reads/edits, `.git/` writes, lockfile edits,
  destructive shell commands, installs, network commands, and force pushes.
- Review and adjust the allowlists for your project's actual command set
  during `/harness-onboard`.

## Updating the harness in an installed project

If you improve the portable kit and want to roll the change forward into an
existing project:

```bash
# Diff before applying
./install.sh --destination /path/to/project --dry-run

# Force-overwrite the canonical files (your project-specific edits to
# AGENT_HANDOFF.md, DECISIONS.md, PROJECT_CONTEXT.md etc. will be replaced)
./install.sh --destination /path/to/project --force
```

For surgical updates of individual files, copy them by hand. The installer
intentionally has no per-file selector — that would invite drift.
