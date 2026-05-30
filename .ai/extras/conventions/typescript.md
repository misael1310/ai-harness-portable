# TypeScript conventions snippet

Copy the section below into `.ai/CONVENTIONS.md` after "Architecture" if your project uses
TypeScript.

---

## TypeScript

- Prefer explicit types at module boundaries.
- Avoid `any` unless justified with a comment.
- Prefer small, focused functions.
- Keep code close to existing patterns.
- Do not introduce global state unless the project already uses that pattern.
- Preserve strict TypeScript settings, including `noUncheckedIndexedAccess`,
  `noUnusedLocals`, and `noUnusedParameters` when enabled.
- Use `import type` for type-only imports when touching TypeScript files.
