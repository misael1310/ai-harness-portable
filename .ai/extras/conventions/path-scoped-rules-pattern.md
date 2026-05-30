# Path-scoped Claude rules — pattern reference

This is a read-only doc. Not a snippet to copy. It explains how to author
`.claude/rules/*.md` files so a rule loads only when matching files are touched.

## Why path-scoping

Rules in `.ai/CONVENTIONS.md` are always-loaded canonical conventions. When a rule applies
to a narrow surface (e.g., one directory, one module type), promoting it to canonical
inflates the context for unrelated tasks. Path-scoped Claude rules under `.claude/rules/`
load conditionally based on `paths:` frontmatter — Claude Code only injects them when
reading or editing files that match.

## File layout

`.claude/rules/<short-descriptive-name>.md` with frontmatter:

```markdown
---
description: One-sentence summary of what this rule reminds the agent about.
paths:
  - <glob 1>
  - <glob 2>
---

# <Rule title>

Body of the rule. Treat as a supplemental reminder of canonical rules in `.ai/`.
List bullets, not paragraphs. Keep under ~30 lines per file.

- Bullet 1.
- Bullet 2.
- Cross-reference: see `.ai/<canonical file>.md` "<section>" for the authoritative rule.
```

## Glob examples

```yaml
paths:
  - src/components/**
  - src/App.tsx
```

```yaml
paths:
  - src/utils/analytics*
  - src/config/analytics*
  - src/utils/identity*
```

```yaml
paths:
  - "**/auth/**"
  - "**/authentication/**"
  - "**/cors*"
  - "**/csp*"
```

## What belongs in a path-scoped rule

- Reminders, not new rules. Canonical authoritative rules live in `.ai/`.
- Cross-cutting concerns scoped to a directory (TV UI constraints in components, analytics
  privacy reminders in identity modules, security gating reminders in auth dirs).
- Pointers to the canonical doc — `cross-check .ai/SECURITY_RULES.md` style.

## What does NOT belong

- New rules not present in `.ai/`. Add them via the conversational protocol in
  `.ai/HARNESS.md` "Adding New Rules and Conventions" first; only then mirror as a
  reminder.
- Long prose / multi-paragraph explanations. Keep bullets, ≤30 lines.
- Stack-wide rules (TypeScript, React conventions). Those belong in `.ai/CONVENTIONS.md`
  always-loaded, not path-scoped.

## Adoption cost

Each path-scoped rule adds context only for matching reads/edits. Cost is roughly
proportional to how often the matching paths are touched. Audit during `/harness-review`
for staleness, redundancy, or rules that should graduate to canonical.
