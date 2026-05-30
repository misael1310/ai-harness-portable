# Conventions extras

Stack-specific engineering rule snippets to copy into `.ai/CONVENTIONS.md`. The default
`CONVENTIONS.md` ships only cross-stack core (General, Architecture, Logging, Plans
Convention, delegating Harness Operations). Adopt the snippets that match your project's
stack.

## Available snippets

| File | When to adopt |
|---|---|
| `typescript.md` | TypeScript-based projects (Node, browser, React, Vue, Svelte, etc.) |
| `react.md` | React or React Native projects |
| `testing.md` | Any project shipping tests (Vitest, Jest, Pytest, etc.) — generalize the runner block to your runner |
| `path-scoped-rules-pattern.md` | Reference for authoring `.claude/rules/*.md` files with `paths:` frontmatter (read-only doc, not a snippet to copy) |

For LightningJS / Smart TV projects, see the dedicated `.ai/extras/stack-lightning/`
bundle, which includes the `smart-tv.md` convention snippet plus deep-dive SDK
references.

## How to install a snippet

1. Open the snippet you want.
2. Copy the section content (the heading and bullets) into `.ai/CONVENTIONS.md` after the
   "Architecture" section and before "Plans Convention".
3. Adjust language / framework / platform names to match your stack.
4. Delete sections of the snippet that don't apply.
5. Run `/harness-check` to confirm conventions are still under the ~200-line adherence
   threshold. If approaching the threshold, split into a sibling file and add a delegating
   pointer (mirror the existing `CONVENTIONS.md` ↔ `HARNESS.md` split pattern).

## Path-scoped Claude rules pattern

`path-scoped-rules-pattern.md` is read-only documentation — not a copy-target. It explains
how to author `.claude/rules/*.md` files with `paths:` frontmatter so a rule loads only
when matching files are touched. Use this when a rule applies to a narrow surface (e.g.,
a UI directory, an analytics module) and global always-load would inflate context.
