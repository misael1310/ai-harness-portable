# AI-Assisted Software Development Trends and Security-First Starter Kit Plan

**Scope:** Personal/professional individual workflow for OTT/Smart TV, TypeScript, React, LightningJS, Create React App, and Vite projects on Windows 11.  
**Tools considered:** Cursor, Claude Code, OpenAI Codex, and OpenCode.  
**Date basis:** The public source check was performed in May 2026, so the recommendations are suitable for an April/May 2026 workflow.

## Executive summary

The strongest practical trend is not just “better prompts.” The stronger pattern is **repo-local, file-backed agent context plus executable verification**: keep stable project knowledge in files, expose only a thin tool-specific adapter to each AI tool, and require tests/lint/build/security review before accepting AI changes (OpenAI, 2026, https://developers.openai.com/codex/guides/agents-md; Anthropic, 2026, https://code.claude.com/docs/en/overview; OpenCode, 2026, https://opencode.ai/docs/rules/).

Your current habit of repeatedly pasting a large base prompt is a workflow smell because the same tools now support persistent project instructions, memory files, rules, and agent configuration files that are designed to load context automatically at session start (OpenAI, 2026, https://developers.openai.com/codex/guides/agents-md; Anthropic, 2026, https://code.claude.com/docs/en/overview; Cursor, 2026, https://cursor.com/docs/rules; OpenCode, 2026, https://opencode.ai/docs/rules/).

The recommended design is a **multi-tool neutral core plus thin adapters**: `.ai/` is your private, Git-ignored operational memory, while `AGENTS.md`, `CLAUDE.md`, Cursor rules, and OpenCode config are small entry points that tell each tool where to look and how to behave (OpenAI, 2026, https://developers.openai.com/codex/guides/agents-md; Anthropic, 2026, https://code.claude.com/docs/en/overview; OpenCode, 2026, https://opencode.ai/docs/rules/).

Security should be treated as a first-class architecture concern because agentic tools can read code, edit files, run commands, use tools, and potentially interact with external resources; Codex documentation explicitly warns that internet access increases risks such as prompt injection, code or secret exfiltration, malware, vulnerable dependencies, and license-restricted content (OpenAI, 2026, https://developers.openai.com/codex/cloud/internet-access).

## Key concepts

### RAG

Retrieval-Augmented Generation (RAG) combines a language model with explicit external retrieval, originally framed as combining parametric model memory with non-parametric memory retrieved from an index (Lewis et al., 2020, https://arxiv.org/abs/2005.11401).

For coding work, RAG usually means retrieving relevant repository files, documentation, decisions, tickets, or code snippets before asking the model to reason or edit; this is useful because large models have limited context windows and may not know your local architecture unless you provide the relevant evidence (Lewis et al., 2020, https://arxiv.org/abs/2005.11401; SWE-bench, 2026, https://www.swebench.com/verified.html).

### Agents

An agent is a model-driven workflow that can use tools, inspect files, run commands, or hand work to specialists rather than only returning text; OpenAI’s Agents SDK docs explicitly organize the path from a single agent to orchestration, handoffs, guardrails, human review, state, and observability (OpenAI, 2026, https://developers.openai.com/api/docs/guides/agents).

### Subagents

Subagents are specialized agents with narrower tasks, tools, and permissions; Claude Code includes built-in subagents such as Explore and Plan, and it lets users create custom subagents with descriptions, tool restrictions, permission modes, hooks, and skills (Anthropic, 2026, https://code.claude.com/docs/en/sub-agents).

### Harnessing

“Harnessing” is not yet one universally standardized term, but the current useful meaning is: a controlled working environment plus instructions, files, tool permissions, state, logs, and verification gates that let an agent work safely across files and tools (OpenAI, 2026, https://openai.com/index/the-next-evolution-of-the-agents-sdk/).

The attached sample project demonstrates harnessing as **state and process on disk**: `AGENTS.md` gives the navigation map, `feature_list.json` limits scope to one feature at a time, `progress/` stores persistent handoffs and reports, `.claude/agents/` separates leader/implementer/reviewer roles, and `init.sh` enforces executable verification.

## Trends that matter for you

### 1. Persistent repo instructions are becoming a default interface for coding agents

Codex reads `AGENTS.md` files before work and layers global guidance with project-specific overrides, which makes `AGENTS.md` a strong cross-tool instruction layer (OpenAI, 2026, https://developers.openai.com/codex/guides/agents-md).

OpenCode also uses `AGENTS.md` for project-specific custom instructions, supports global rules, and can load extra instruction files via `opencode.json`, which makes it compatible with a file-backed workflow (OpenCode, 2026, https://opencode.ai/docs/rules/).

Claude Code uses `CLAUDE.md` as a project instruction file read at the start of sessions, and the same docs state that Claude Code can use instructions, skills, hooks, subagents, MCP, and auto memory (Anthropic, 2026, https://code.claude.com/docs/en/overview).

Cursor supports persistent rules through Project, Team, User Rules, and `AGENTS.md`, which means project-specific instructions should be kept in files rather than repeatedly pasted into chat (Cursor, 2026, https://cursor.com/docs/rules).

### 2. Agent workflows are shifting from chat answers to file edits, commands, tests, and PR-like loops

Claude Code describes itself as an agentic coding tool that reads a codebase, edits files, runs commands, and integrates with development tools (Anthropic, 2026, https://code.claude.com/docs/en/overview).

Codex documentation and product pages describe code generation, codebase understanding, code review, AGENTS.md guidance, sandboxing, and approvals as part of the expected workflow (OpenAI, 2026, https://developers.openai.com/codex; OpenAI, 2026, https://developers.openai.com/codex/agent-approvals-security).

SWE-bench Verified exists because reliable evaluation of coding agents needs human-validated software engineering tasks, and its leaderboard includes systems ranging from simple agent loops to RAG systems and multi-rollout/review systems (SWE-bench, 2026, https://www.swebench.com/verified.html).

### 3. Subagents and reviewer loops are increasingly important

Claude Code documents built-in read-only Explore and Plan subagents and allows custom subagents with tool restrictions, which supports a workflow where exploration, implementation, and review are separate roles (Anthropic, 2026, https://code.claude.com/docs/en/sub-agents).

OpenAI’s Agents SDK documentation distinguishes handoffs, where a specialist takes over, from “agents as tools,” where an orchestrator remains in control and calls specialists, so the leader/worker/reviewer pattern in the sample project maps well to current agent design patterns (OpenAI, 2026, https://openai.github.io/openai-agents-python/quickstart/).

### 4. Security controls matter more as agents gain tool access

The OWASP LLM Top 10 explicitly lists Sensitive Information Disclosure, Insecure Plugin Design, Excessive Agency, Overreliance, and Model Theft as LLM application risks (OWASP, 2025, https://owasp.org/www-project-top-10-for-large-language-model-applications/).

OWASP’s Agentic AI guidance states that agentic AI expands scale, capabilities, and associated risks, and the OWASP Top 10 for Agentic Applications 2026 is intended as a practical framework for autonomous and agentic systems that plan, act, and make decisions across complex workflows (OWASP, 2025, https://genai.owasp.org/resource/agentic-ai-threats-and-mitigations/; OWASP, 2025, https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/).

Codex’s docs warn that enabling internet access increases risks including prompt injection from untrusted web content, exfiltration of code or secrets, malware or vulnerable dependency downloads, and license-restricted content; Codex recommends only allowing needed domains and HTTP methods and reviewing agent output and work logs (OpenAI, 2026, https://developers.openai.com/codex/cloud/internet-access).

Claude Code’s MCP docs warn users to trust MCP servers carefully, especially servers that fetch untrusted content, because those can expose users to prompt-injection risk (Anthropic, 2026, https://code.claude.com/docs/en/mcp).

NIST’s Generative AI Profile for the AI RMF is a cross-sector profile intended to help organizations identify generative AI risks and actions for risk management across the AI lifecycle (NIST, 2024, https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence).

### 5. Windows 11 is now a first-class environment for agentic coding, but PowerShell and WSL2 should be used intentionally

Codex recommends using the native Windows sandbox by default for best performance and speed while preserving security, and using WSL2 when a Linux-native environment is needed (OpenAI, 2026, https://developers.openai.com/codex/windows).

Codex documentation also states that WSL2 repositories should be kept under the Linux home directory such as `~/code/my-app` for faster I/O and fewer symlink and permission issues, while Windows-mounted paths are available under `/mnt/c/...` but may be slower (OpenAI, 2026, https://developers.openai.com/codex/windows).

## Review of the attached harness/subagents project

### What the project does well

The project demonstrates the right high-level shape for a coding-agent harness: a repository entry point, explicit task list, persistent progress files, agent roles, verification script, and review checklist.

The leader/implementer/reviewer split is sound because it avoids the implementer self-approving its own work and makes review a separate role.

The “anti telephone game” rule is strong because subagents write durable evidence to files instead of passing long, lossy summaries through chat.

The `init.sh` verification gate is valuable because it makes success executable instead of relying on the agent saying that the work is done.

The sample app itself is intentionally simple, which is good for teaching the pattern because the focus stays on agent process, not application complexity.

### Concrete issues and risks found

1. **Language/tool portability risk:** The harness is centered on Claude Code and Bash/Python, so it is not directly portable to your Windows-first, TypeScript/React/OTT workflow without adapters.

2. **Tracked progress risk:** The sample keeps `progress/` as versioned trace, but your preferred setup is private and Git-ignored `.ai/`; for private repos, progress files may contain proprietary reasoning, file paths, product names, ticket details, or security observations that should not be committed by default.

3. **Prompt injection risk through instruction files:** `AGENTS.md`, `CLAUDE.md`, and subagent files are powerful instruction surfaces; if they are generated or modified by an untrusted process, they can become an indirect prompt-injection channel.

4. **Hook risk:** `.claude/settings.json` runs tests after write/edit and runs `init.sh` on stop, which is useful, but hooks that execute shell commands should be treated as code and reviewed before trusting them.

5. **Reviewer contradiction:** The implementer instructions say the implementer should call a reviewer and wait, but the same implementer later marks the feature as done if the reviewer approves; this is acceptable in a toy repo but in real projects the final status change should be done by a human or by a controlled lead agent after reading the review artifact.

6. **No explicit secret policy:** The sample harness does not include a strong file-deny policy for `.env`, keys, tokens, credentials, local logs, or production dumps.

7. **No dependency policy beyond Python stdlib:** The sample forbids dependencies, but your real TypeScript/React projects need a more nuanced dependency approval process.

8. **Testing is too simple for OTT:** The toy project’s unit tests are useful, but your OTT/Smart TV workflow needs additional device/browser compatibility checks, focus/navigation behavior checks, and build-target awareness.

9. **No RAG boundary:** The project uses file-backed context, but it does not yet define what should be indexed, what must never be indexed, or how retrieved snippets should be treated.

10. **No multi-tool adapter strategy:** The project has `AGENTS.md` and `CLAUDE.md`, but it does not provide Cursor/OpenCode/Codex-specific adapter guidance while keeping one canonical private context source.

### What to adapt

Adapt the durable parts: file-backed context, task handoff, agent role separation, append-only logs, one task at a time, verification before completion, and a reviewer that cannot edit code.

Do not directly copy the tracked `progress/` model into private work; move that state to `.ai/`, add `.ai/` to `.gitignore`, and create safe adapters for tools that require visible instruction files.

## Recommended architecture for your workflow

```text
repo/
  .ai/                         # Git-ignored private AI workspace
    PROJECT_CONTEXT.md
    SECURITY_RULES.md
    AGENT_HANDOFF.md
    TASK_LOG.md
    DECISIONS.md
    CONVENTIONS.md
    PROJECT_INDEX.md
    RETRIEVAL_INDEX.md
    agents/
      refactor-agent.md
      security-review-agent.md
      owasp-top-10-agent.md
      architecture-review-agent.md
      coding-best-practices-review-agent.md
      project-conventions-agent.md
      test-creation-agent.md
      test-runner-agent.md
      docs-agent.md
  AGENTS.md                    # Thin adapter, optional
  CLAUDE.md                    # Thin Claude adapter, optional
  .cursor/rules/*.mdc          # Thin Cursor adapter, optional
  opencode.json                # Thin OpenCode adapter, optional
```

The `.ai/` directory should be private and ignored by Git because it may contain task notes, repo analysis, implementation strategy, file maps, and security observations.

Tool adapters should be small and should not duplicate the entire project context because duplicated instructions drift, waste context, and become hard to audit.

## Short, actionable roadmap

### Week 1: Replace prompt copy/paste with `.ai/`

Create `.ai/`, add it to `.gitignore`, and start using `PROJECT_CONTEXT.md`, `SECURITY_RULES.md`, `AGENT_HANDOFF.md`, and `TASK_LOG.md`.

Create thin adapters for the tools you use most: `AGENTS.md` for Codex/OpenCode-compatible agents, `CLAUDE.md` for Claude Code, Cursor project rules, and `opencode.json` for OpenCode.

Use this rule for every task: the first prompt should say, “Read the project AI workspace, then propose a plan before edits.”

### Week 2: Add role-specific reviews

Add agents for refactoring, security review, OWASP Top 10 review, architecture review, coding best practices review, project conventions review, test creation, test execution, and documentation.

Use a two-tool review loop: one tool implements, another tool reviews the diff.

### Week 3: Add verification gates

Standardize npm commands per repo: `npm run lint --if-present`, `npm run test --if-present`, and `npm run build --if-present`.

For Vite projects, prefer Vitest when it already exists because Vitest is designed to reuse Vite’s config and transform pipeline and is Jest-compatible for many workflows (Vitest, 2026, https://vitest.dev/).

For Create React App and older Jest-based projects, preserve Jest unless the repo already has a migration plan, because Jest remains a maintained test runner with standard npm installation and TypeScript support paths (Jest, 2025, https://jestjs.io/docs/getting-started).

For React UI tests, prefer Testing Library-style behavior tests because its guiding principle is that tests resembling real user behavior provide more confidence (Testing Library, 2024, https://testing-library.com/docs/react-testing-library/intro/).

### Week 4: Add lightweight RAG/indexing discipline

Do not start with a full vector database. Start with `PROJECT_INDEX.md` and `RETRIEVAL_INDEX.md` so each task retrieves exact files and symbols first.

Only after the manual index becomes painful should you add automated local indexing, and it must exclude secrets, credentials, logs, `.env` files, and private datasets.

## Free, high-quality learning resources

### Official docs to start immediately

- OpenAI Codex AGENTS.md guide: project and global instructions for Codex (OpenAI, 2026, https://developers.openai.com/codex/guides/agents-md).
- OpenAI Codex sandboxing and approvals docs: practical security model for file edits, network, and approvals (OpenAI, 2026, https://developers.openai.com/codex/concepts/sandboxing; OpenAI, 2026, https://developers.openai.com/codex/agent-approvals-security).
- OpenAI Agents SDK docs: agents, handoffs, guardrails, observability, and sandbox workflows (OpenAI, 2026, https://developers.openai.com/api/docs/guides/agents).
- Claude Code overview, memory, subagents, MCP, and settings docs (Anthropic, 2026, https://code.claude.com/docs/en/overview; Anthropic, 2026, https://code.claude.com/docs/en/sub-agents; Anthropic, 2026, https://code.claude.com/docs/en/mcp).
- Cursor rules docs for project and user rules (Cursor, 2026, https://cursor.com/docs/rules).
- OpenCode rules, agents, permissions, and config docs (OpenCode, 2026, https://opencode.ai/docs/rules/; OpenCode, 2026, https://opencode.ai/docs/permissions/; OpenCode, 2026, https://opencode.ai/docs/agents/).

### Security resources

- OWASP Top 10 for LLM Applications (OWASP, 2025, https://owasp.org/www-project-top-10-for-large-language-model-applications/).
- OWASP Agentic AI Threats and Mitigations (OWASP, 2025, https://genai.owasp.org/resource/agentic-ai-threats-and-mitigations/).
- OWASP Top 10 for Agentic Applications 2026 (OWASP, 2025, https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/).
- NIST AI RMF Generative AI Profile (NIST, 2024, https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence).

### RAG and agents resources

- Original RAG paper by Lewis et al. (Lewis et al., 2020, https://arxiv.org/abs/2005.11401).
- SWE-bench Verified for understanding agentic coding evaluation (SWE-bench, 2026, https://www.swebench.com/verified.html).
- OpenAI Agents SDK TypeScript quickstart, especially tracing and handoffs (OpenAI, 2026, https://openai.github.io/openai-agents-js/guides/quickstart/).

### Stack-specific resources

- TypeScript Handbook (Microsoft, 2026, https://www.typescriptlang.org/docs/handbook/intro.html).
- Vitest official docs (Vitest, 2026, https://vitest.dev/).
- Jest official docs (Jest, 2025, https://jestjs.io/docs/getting-started).
- React Testing Library docs (Testing Library, 2024, https://testing-library.com/docs/react-testing-library/intro/).
- LightningJS / Blits docs for TV app framework work (LightningJS, 2026, https://lightningjs.io/).
- Samsung Smart TV web engine specifications for target-device compatibility decisions (Samsung, 2026, https://developer.samsung.com/smarttv/develop/specifications/web-engine-specifications.html).

## Practical first prompts

### Cursor / Claude Code / Codex / OpenCode start prompt

```text
Read `.ai/PROJECT_CONTEXT.md`, `.ai/SECURITY_RULES.md`, `.ai/AGENT_HANDOFF.md`, and `.ai/CONVENTIONS.md` first.

Then inspect only the files needed for the current task.

Do not edit yet. Give me:
1. relevant files/symbols found,
2. risks,
3. a minimal plan,
4. tests to run,
5. questions only if truly blocking.
```

### Refactor prompt

```text
Use `.ai/agents/refactor-agent.md`.

Goal: refactor the target code with minimal behavior change.

Constraints:
- Keep public behavior unchanged.
- Preserve project conventions.
- Do not add dependencies.
- Run existing tests or explain why they cannot run.
- Update `.ai/AGENT_HANDOFF.md` with the exact files changed and verification result.
```

### Security review prompt

```text
Use `.ai/agents/security-review-agent.md` and `.ai/agents/owasp-top-10-agent.md`.

Review the current diff for:
- secrets or sensitive data exposure,
- unsafe input/output handling,
- excessive agent/tool permissions,
- token leakage in logs, URLs, errors, or analytics,
- dependency and supply-chain risk,
- OWASP LLM/agentic risks if AI or agent code is involved.

Do not edit code. Return findings by severity with exact file paths and suggested fixes.
```

## Final recommendation

Start with the starter kit in this deliverable. Use it in one active repo for one week, keep `.ai/` private, and force every tool to read the same `.ai/` context before acting.

After one week, evaluate friction using three questions: Did copy/paste decrease? Did review quality improve? Did the tool preserve project conventions better?

Do not build a custom vector RAG system first. Build a trustworthy file-backed harness first, then add local indexing only when the manual `.ai/PROJECT_INDEX.md` becomes insufficient.

## References

Anthropic. (2026). *Claude Code overview*. Claude Code Docs. https://code.claude.com/docs/en/overview

Anthropic. (2026). *Create custom subagents*. Claude Code Docs. https://code.claude.com/docs/en/sub-agents

Anthropic. (2026). *Connect Claude Code to tools via MCP*. Claude Code Docs. https://code.claude.com/docs/en/mcp

Cursor. (2026). *Rules*. Cursor Docs. https://cursor.com/docs/rules

Jest. (2025). *Getting started*. Jest Docs. https://jestjs.io/docs/getting-started

Lewis, P., Perez, E., Piktus, A., Petroni, F., Karpukhin, V., Goyal, N., Küttler, H., Lewis, M., Yih, W., Rocktäschel, T., Riedel, S., & Kiela, D. (2020). *Retrieval-augmented generation for knowledge-intensive NLP tasks*. arXiv. https://arxiv.org/abs/2005.11401

LightningJS. (2026). *TV App Framework*. https://lightningjs.io/

National Institute of Standards and Technology. (2024). *Artificial Intelligence Risk Management Framework: Generative Artificial Intelligence Profile*. https://doi.org/10.6028/NIST.AI.600-1

OpenAI. (2026). *Agents SDK*. OpenAI API Docs. https://developers.openai.com/api/docs/guides/agents

OpenAI. (2026). *Agent approvals & security*. Codex Docs. https://developers.openai.com/codex/agent-approvals-security

OpenAI. (2026). *Agent internet access*. Codex Docs. https://developers.openai.com/codex/cloud/internet-access

OpenAI. (2026). *Custom instructions with AGENTS.md*. Codex Docs. https://developers.openai.com/codex/guides/agents-md

OpenAI. (2026). *Sandbox*. Codex Docs. https://developers.openai.com/codex/concepts/sandboxing

OpenAI. (2026). *Windows*. Codex Docs. https://developers.openai.com/codex/windows

OpenAI. (2026). *The next evolution of the Agents SDK*. OpenAI. https://openai.com/index/the-next-evolution-of-the-agents-sdk/

OpenCode. (2026). *Rules*. OpenCode Docs. https://opencode.ai/docs/rules/

OpenCode. (2026). *Permissions*. OpenCode Docs. https://opencode.ai/docs/permissions/

OWASP. (2025). *Agentic AI – Threats and mitigations*. OWASP Gen AI Security Project. https://genai.owasp.org/resource/agentic-ai-threats-and-mitigations/

OWASP. (2025). *OWASP Top 10 for Agentic Applications for 2026*. OWASP Gen AI Security Project. https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/

OWASP. (2025). *OWASP Top 10 for Large Language Model Applications*. OWASP Foundation. https://owasp.org/www-project-top-10-for-large-language-model-applications/

Samsung. (2026). *Web Engine Specifications*. Samsung Developer. https://developer.samsung.com/smarttv/develop/specifications/web-engine-specifications.html

SWE-bench. (2026). *SWE-bench Verified*. https://www.swebench.com/verified.html

Testing Library. (2024). *React Testing Library*. https://testing-library.com/docs/react-testing-library/intro/

Vitest. (2026). *Vitest*. https://vitest.dev/
