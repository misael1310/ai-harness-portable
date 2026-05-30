# Recommended AI-Assisted Development Workflow

## Daily flow

1. Start from a clean Git state.
2. Write the task in `.ai/AGENT_HANDOFF.md`.
3. Ask the AI tool to read `.ai/PROJECT_CONTEXT.md`, `.ai/SECURITY_RULES.md`, and `.ai/AGENT_HANDOFF.md`.
4. Ask for a plan before edits.
5. Approve only narrow, testable changes.
6. Run tests/lint/build.
7. Ask a different agent/tool to review the diff.
8. Update `.ai/TASK_LOG.md` and `.ai/AGENT_HANDOFF.md`.

## Suggested multi-tool loop

- Cursor: fast local coding and navigation.
- Claude Code: deep repo exploration, refactor planning, subagent-style review.
- Codex: sandboxed implementation, tests, or parallel tasks.
- OpenCode: configurable local terminal workflows and explicit permissions.

## Review gates

Before merging or opening a PR:

- Security review.
- OWASP-style review if AI, agentic, plugin, input, auth, or output handling changed.
- Architecture review.
- Coding best practices review.
- Project conventions review.
- Test creation or test execution review.
