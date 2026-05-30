# Project Conventions

Document conventions that an AI agent must preserve. The default scaffold ships only
cross-stack core sections (General, Clean Code, Architecture, Logging, Plans Convention,
Codebase Exploration, Harness Operations). Stack-specific sections (TypeScript, React,
Smart TV, testing) live as opt-in snippets in `.ai/extras/conventions/` — copy them into
this file if they apply to your project.

## General

- Private methods and properties should be prefixed with an underscore (or your
  language's privacy convention).
- When working with URLs, use `new URL()` (or your language equivalent); consult Context7
  for current URL API behavior and validate protocol, host, base URL, and relative URL
  handling when input may be external.
- Never commit changes; the human handles commits.
- Use Context7 MCP for current library, framework, SDK, API, CLI, cloud-service, URL,
  and security documentation.
- Keep changes minimal, local, and easy to review.
- Never guess. Prefer evidence from files and current documentation over model memory.
  When unsure about library, framework, SDK, API, CLI, cloud-service, URL, security, or
  platform behavior, consult Context7 first. If Context7 is insufficient and internet
  access is approved and required, search the internet. After that, ask the human
  clearly about anything still unknown or needing further verification before answering
  or editing.
- For multi-repository runtime behavior, read `.ai/RETRIEVAL_INDEX.md` and retrieve the
  smallest relevant context from sibling repositories before editing.

## Clean Code & Engineering Standards

- **Self-Documenting Code**: Prioritize intention-revealing names for variables, functions, and classes over comments. Code should explain *what* it does; comments should only explain *why* (business rules, workarounds, or constraints).
- **Clean Code**: Keep functions small and focused on a single responsibility (SRP). Reduce cyclomatic complexity with early returns and guard clauses. Avoid magic numbers and strings.
- **Wise DRY (Don't Repeat Yourself)**: Extract duplicated logic into shared utilities, but beware of premature abstraction. A little duplication is cheaper than the wrong abstraction (AHA - Avoid Hasty Abstractions). Abstract only when a clear, shared concept emerges.
- **Design Patterns**: Leverage well-known software design patterns (e.g., Factory, Strategy, Observer, Repository, MVC) for recurring architectural problems. Do not reinvent the wheel for solved problems.
- **Self-Testing**: Write code that is inherently self-testable. After code changes run the project's verification gates (typecheck, lint, unit/integration tests if available). If a test runner is configured, accompany logic changes with deterministic automated tests.
- **Continuous Verification & Self-Correction**: Whenever you add, update, or remove code, you MUST run the project's verification commands recorded in `.ai/PROJECT_CONTEXT.md`. If any gate fails, read the error trace, analyze the failure, and iteratively fix until all pass. Do not stop and wait for the human to tell you to fix the error.

## Architecture

- Preserve existing boundaries between components, hooks, utilities, config, and types
  (or your project's equivalent layer separation).
- Prefer OOP structure where the codebase already uses classes or platform abstractions.
- Do not introduce classes solely for organization when a focused function, hook, or
  component is simpler and consistent with local code.
- Avoid broad compatibility layers unless there is a concrete persisted-data,
  shipped-behavior, or external-consumer need.
- When this project is part of a larger runtime system (multi-repo extra adopted),
  consider the full runtime before changing contracts shared with sibling codebases.

## Logging

- Remove development log calls (`console.log`, `print`, etc.) before completion.
- Keep intentional logs only when the project has a logging convention.
- Never log tokens, user identifiers, session identifiers, or request headers.

## Plans Convention

Implementation plans for non-trivial tickets live in `.ai/plans/`. Pattern:

- `.ai/plans/_template.md` is the canonical structure. Copy it when starting a plan.
- Filename: `<ticket-id>-<kebab-summary>.md`, all lowercase
  (e.g. `proj-123-add-feature-x.md`). Matches the lowercase branch convention.
- Frontmatter is required and must include `status`, `ticket`, `branch`, `created`,
  `last_updated`.
- `status` lifecycle: `draft` → `approved` → `in-progress` → `done`.
- The active plan path is referenced from `.ai/AGENT_HANDOFF.md` "Current task". Tools
  discover the plan via the handoff pointer; do not auto-load plans via `opencode.json`
  `instructions[]` or any other always-on entry point.
- When a plan reaches `status: done`, archive it via
  `node .ai/scripts/archive-plan.mjs <plan-path>`. The script moves the file to
  `.ai/plans/archive/<same-name>`. Templates (filenames starting with `_`) are never
  archived.
- Closure ordering: `archive-plan.mjs` runs **before** `rotate-handoff.mjs` so the
  rotated handoff entry preserves the pre-archive plan path as historical reference.
  Both scripts are single-responsibility; chain them manually rather than wrapping.

## Codebase Exploration

- Prefer CodeGraph (`codegraph query`, `codegraph context`, `codegraph affected`) over
  manual Grep/Glob for symbol search, call-site tracing, and impact analysis when
  CodeGraph is initialized for the project (`.codegraph/` directory present). CodeGraph
  answers structural questions faster and with fewer false positives than regex.
- Before using CodeGraph commands, run `codegraph index` (full re-index) followed by
  `codegraph sync` (incremental update) to ensure the index reflects the current
  working tree, including any unstaged edits.

## Harness Operations

Operational rules for the multi-tool harness — multi-tool stack, handoff lifecycle,
harness self-test, onboarding, maintenance, conversational rule-adding protocol,
multi-tool orchestration, bootstrap fallback phrase, and language convention — live in
`.ai/HARNESS.md`. Read both files together; they are split only to keep each one under
the Claude Code adherence threshold (~200 lines).
