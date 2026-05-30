# Testing conventions snippet

Copy the section below into `.ai/CONVENTIONS.md` after "Architecture" if your project
ships tests. Replace the runner-specific lines with your actual runner (Vitest, Jest,
Pytest, JUnit, etc.).

---

## Testing

- Detect the test runner before creating tests.
- For Vite projects, prefer Vitest if already configured.
- For Create React App or legacy projects, preserve Jest unless the repo already migrated.
- For Python projects, default to Pytest unless another runner is configured.
- Tests should verify behavior, not implementation details.
- Avoid mocking the database or external systems for integration tests where the
  divergence between mock and real behavior could mask real bugs.
- Keep test files close to the code they verify, following the project's existing layout
  (sibling `*.test.*`, `__tests__/`, or `tests/` mirror).
