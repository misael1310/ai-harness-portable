# Project Context

## Purpose

[TBD: 1-2 sentences describing what this project does and who it serves. Replaced by
`/harness-onboard` based on README / manifest detection.]

## Stack

- Language: [TBD]
- Runtime: [TBD]
- Frameworks: [TBD]
- UI framework: [TBD]
- State management: [TBD]
- Testing: [TBD]
- Package manager: [TBD]
- Build tool: [TBD]
- Target devices / browsers: [TBD]

## Common Project Types

- [ ] Web frontend (React / Vue / Svelte / SolidJS)
- [ ] Next.js / Nuxt / Remix / SvelteKit
- [ ] LightningJS / Smart TV app
- [ ] React Native / Expo mobile app
- [ ] Electron / Tauri desktop app
- [ ] Node.js backend / API service
- [ ] Python service (FastAPI / Django / Flask)
- [ ] CLI tool / library
- [ ] Monorepo (Nx / Turborepo / Lerna / pnpm workspace)
- [ ] Other: [TBD]

## Multi-Tool Agent Stack

This repository can be worked on with multiple AI coding tools simultaneously: **Claude
Code**, **OpenCode**, and **Cursor**. All three share `.ai/` as canonical operational
memory. Each tool has a thin entry point (`CLAUDE.md`, `AGENTS.md` + `opencode.json`,
`.cursor/rules/*.mdc`) that delegates to `.ai/`. Add durable rules to `.ai/`, never to
a single tool's entry point. See `.ai/HARNESS.md` "Multi-Tool Agent Stack".

## Runtime Repository Context

[Optional: if this project participates in a multi-codebase runtime system, adopt
`.ai/extras/multi-repo/` and populate `.ai/RETRIEVAL_INDEX.md` with the sibling map.]

## Architecture Map

| Path | Responsibility | Notes |
|---|---|---|
| [TBD] | [TBD] | [TBD] |

## Build, Test, And Verification Commands

Always verify commands from the project manifest (`package.json`, `pyproject.toml`,
`Cargo.toml`, etc.) before running. Do not run installs, network, deploy, or destructive
commands without explicit approval.

```bash
# Type-check / lint / test (run after code changes)
# [TBD: project-specific commands populated by /harness-onboard]
```

## Current Constraints

- Keep changes minimal and easy to review.
- Never commit changes; the human handles commits.
- Do not introduce new dependencies without explicit approval.
- Preserve existing project conventions.
- Use Context7 MCP for current library/framework/API/SDK/CLI/cloud docs before relying on
  memory.
- Follow OWASP Top 10 secure-coding practices.
- Use `new URL()` (or language equivalent) for URL parsing/construction and validate
  external URL inputs.
- [TBD: project-specific constraints added during onboarding]

## Known Risks

- [TBD: project-specific risk surfaces — auth, payment, analytics, deploy, etc.]
