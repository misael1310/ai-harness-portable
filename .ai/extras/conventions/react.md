# React conventions snippet

Copy the section below into `.ai/CONVENTIONS.md` after "Architecture" if your project uses
React or React Native.

---

## React

- Keep components focused on rendering and UI interaction.
- Move reusable business logic to hooks or pure functions when the existing architecture
  supports it.
- Avoid unnecessary re-renders.
- Do not add new state libraries without approval.
- Keep components pure: render from props/state and avoid mutating external values during
  render.
- Prefer derived values during render over effect-driven duplicated state when possible.
- Use effects for synchronization with external systems, not for ordinary data derivation.
- Read and write refs in effects or event handlers, not during render, except for safe
  initialization patterns.
- Do not add `useMemo` or `useCallback` by default; follow existing performance patterns
  and add memoization only when there is a measured or clear need.
