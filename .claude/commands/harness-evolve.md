---
description: Automatically evolves the AI Harness based on the latest project state. It researches newly added frameworks/libraries using Context7, fetches the absolute latest best practices, and updates CONVENTIONS.md and SECURITY_RULES.md dynamically.
allowed-tools: Read, Glob, Grep, Bash, Write, StrReplace, CallMcpTool
---

You have been invoked to **Evolve the AI Harness**. The local repository has added new frameworks, dependencies, or architectural patterns, and the `.ai/` rules need to be upgraded to match the absolute latest industry best practices.

## Workflow

1. **Dependency Analysis**: Read `package.json`, `pyproject.toml`, `Cargo.toml`, or relevant manifests to identify the core libraries currently used in this project.
2. **Current Conventions Check**: Read `.ai/CONVENTIONS.md` and `.ai/SECURITY_RULES.md` to see what is already covered.
3. **Deep Research via Context7**: For any major framework, library, or language identified in Step 1 that is NOT thoroughly covered in `CONVENTIONS.md`, you MUST invoke the **Context7 MCP** to fetch its official documentation, latest standard practices, and security warnings. 
   - *Example*: If Next.js 14+ is found, query Context7 for the latest Next.js 14 App Router patterns.
4. **Harness Upgrades**:
   - Update `.ai/CONVENTIONS.md` with a new, highly specific section detailing the exact coding patterns for the new tools (e.g., "Next.js Best Practices", "Prisma Patterns").
   - Update `.ai/SECURITY_RULES.md` if the new framework introduces new risk vectors (e.g., SSRF risks with new server-side fetching libraries).
5. **Subagent Adjustments**: If the new architecture warrants a new specialized subagent (e.g., a "GraphQL Optimization Agent"), generate one and save it to `.ai/extras/agents/`.

## Strict Guardrails

- Do NOT invent or hallucinate best practices. If you don't know the absolute latest patterns for a library, use Context7 or decline to write rules for it.
- Never overwrite the core "Clean Code & Engineering Standards". You are strictly adding new stack-specific guidance.

End your execution with a summary of the new rules and patterns you've permanently embedded into the project's memory.