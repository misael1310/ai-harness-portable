---
description: Read-only security scan using the OWASP Top 10 agent persona. Reviews recent changes for vulnerabilities. Does not edit files.
allowed-tools: Read, Glob, Grep
---

Run a read-only security scan of recent changes in this repository. Use the OWASP Top 10
mindset from `.ai/SECURITY_RULES.md` and the persona in `.ai/extras/agents/owasp-top-10-agent.md`.

1. Read `.ai/SECURITY_RULES.md` and `.ai/extras/agents/owasp-top-10-agent.md` to load the
   security framework.
2. Identify recently modified files (use `git diff --name-only HEAD` or `git log --oneline -5`
   if available).
3. For each modified file, check in order:
   - **A01 Broken Access Control** — are auth checks only client-side? Are there missing
     authorization guards?
   - **A02 Cryptographic Failures** — are tokens/keys/secrets exposed? Is sensitive data in
     logs, URLs, or error messages?
   - **A03 Injection** — is untrusted input used in shell commands, SQL queries, or DOM
     operations?
   - **A05 Security Misconfiguration** — are debug modes enabled? Are security headers
     missing?
   - **A07 Identification/Authentication Failures** — are there changes to session, token,
     or identity handling?
   - **A10 SSRF** — if URLs are accepted from external input, are they parsed with
     `new URL()` and validated?
4. Produce a findings table:

   | # | Severity | OWASP | File:line | Finding | Suggested fix |
   |---|---|---|---|---|---|

   Severity: `low` / `medium` / `high`.

5. End with verdict: `SECURE — no findings` or `Scan found N issues — see above`.

Do not edit any files. This is a read-only scan for the human to review.
