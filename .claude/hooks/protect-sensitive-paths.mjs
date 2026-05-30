#!/usr/bin/env node
/**
 * PreToolUse hook (matcher: Edit|Write).
 *
 * Defense-in-depth for security-sensitive files. The `permissions` block in
 * `.claude/settings.json` already covers most cases, but Claude Code permission patterns can
 * miss path normalization edge cases (e.g., Windows backslashes, mixed `./` prefixes,
 * relative paths). This hook does a robust normalized-path match and emits a deny decision
 * via `hookSpecificOutput`.
 *
 * Denied targets:
 *   - secrets / credentials / keys (`.env`, `*.pem`, `*.key`, `secrets/**`, `credentials/**`,
 *     and paths containing `token`, `secret`, or `credential` as standalone path segments)
 *   - `.git/` and `.github/` directories
 *   - lockfiles (`package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`)
 *
 * Ask-required targets (the hook emits a clarifying message and exits 0 — letting the
 * `permissions.ask` rules in `settings.json` prompt the human):
 *   - `.ai/SECURITY_RULES.md`
 *   - `.claude/settings.json`
 *   - `.claude/hooks/**`
 */

import { stdin } from "node:process";

const DENY_RE = [
  /(^|[\\/])\.env(\.|$)/i,
  /\.pem$/i,
  /\.key$/i,
  /\.p12$/i,
  /\.pfx$/i,
  /(^|[\\/])id_rsa([._]|$)/i,
  /(^|[\\/])id_ed25519([._]|$)/i,
  /(^|[\\/])(secrets|credentials)[\\/]/i,
  /(^|[\\/_-])(token|secret|credential)(s)?([\\/_.-]|$)/i,
  /(^|[\\/])\.git[\\/]/i,
  /(^|[\\/])\.github[\\/]/i,
  /(^|[\\/])package-lock\.json$/i,
  /(^|[\\/])yarn\.lock$/i,
  /(^|[\\/])pnpm-lock\.yaml$/i,
];

const SENSITIVE_RE = [
  /\.ai[\\/]SECURITY_RULES\.md$/i,
  /\.claude[\\/]settings\.json$/i,
  /\.claude[\\/]hooks[\\/]/i,
];

async function _readStdin() {
  const chunks = [];
  for await (const chunk of stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

function _normalize(p) {
  if (!p) return "";
  return p.replace(/\\/g, "/");
}

async function main() {
  const raw = await _readStdin();
  if (!raw.trim()) process.exit(0);

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    process.exit(0);
  }

  const toolName = payload.tool_name ?? payload.toolName ?? "";
  if (toolName !== "Edit" && toolName !== "Write") process.exit(0);

  const filePath =
    payload.tool_input?.file_path ??
    payload.toolInput?.file_path ??
    payload.tool_input?.path ??
    "";
  if (!filePath) process.exit(0);

  const normalized = _normalize(filePath);

  for (const re of DENY_RE) {
    if (re.test(normalized)) {
      const out = {
        hookSpecificOutput: {
          hookEventName: "PreToolUse",
          permissionDecision: "deny",
          permissionDecisionReason: `Edit/Write to ${filePath} blocked by .claude/hooks/protect-sensitive-paths.mjs (matched /${re.source}/). See .ai/SECURITY_RULES.md.`,
        },
      };
      process.stdout.write(JSON.stringify(out));
      process.exit(0);
    }
  }

  for (const re of SENSITIVE_RE) {
    if (re.test(normalized)) {
      process.stderr.write(
        `[protect-sensitive-paths] Notice: Edit/Write to ${filePath} is policy-sensitive (matched /${re.source}/). The permissions.ask rule in settings.json will prompt for explicit approval.\n`,
      );
      process.exit(0);
    }
  }

  process.exit(0);
}

main().catch((err) => {
  process.stderr.write(`protect-sensitive-paths hook error: ${err.message}\n`);
  process.exit(0);
});
