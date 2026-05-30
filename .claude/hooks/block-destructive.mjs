#!/usr/bin/env node
/**
 * PreToolUse hook: hard-block destructive and security-sensitive shell commands.
 *
 * Reads the JSON tool-call payload from stdin (Claude Code hook contract). Inspects the Bash
 * `command` field. Exits with code 2 (blocking) and a clear message on stderr when a denied
 * pattern matches; otherwise exits 0 (allow).
 *
 * Permission rules in `settings.json` already cover most cases declaratively. This hook is the
 * defense-in-depth layer for compound commands (e.g. `a && rm -rf b`) and Windows variants the
 * permission matcher might miss.
 */

import { stdin } from "node:process";

const DENY_PATTERNS = [
  /\bgit\s+commit\b/i,
  /\bgit\s+push\s+(--force|-f|--force-with-lease|--mirror)\b/i,
  /\bgit\s+reset\s+--hard\b/i,
  /\bgit\s+clean\s+-fd\b/i,
  /\brm\s+-rf\b/i,
  /\bRemove-Item\b.*-Recurse\b.*-Force\b/i,
  /\bnpm\s+(install|i|ci|exec|uninstall|update|publish)\b/i,
  /\bnpx\b/i,
  /\byarn\s+(add|install|dlx|remove)\b/i,
  /\bpnpm\s+(add|install|dlx|remove)\b/i,
  /\bbun\s+(add|install)\b/i,
  /\bpip(3)?\s+install\b/i,
  /\bcargo\s+install\b/i,
  /\bcurl\b/i,
  /\bwget\b/i,
  /\bInvoke-WebRequest\b/i,
  /\bInvoke-RestMethod\b/i,
  /\biwr\b/i,
  /\birm\b/i,
  /\bStart-BitsTransfer\b/i,
  /\bdocker\s+system\s+prune\b/i,
];

async function _readStdin() {
  const chunks = [];
  for await (const chunk of stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

function _matchedPattern(command) {
  for (const re of DENY_PATTERNS) {
    if (re.test(command)) return re.source;
  }
  return null;
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
  const command = payload.tool_input?.command ?? payload.toolInput?.command ?? "";
  if (toolName !== "Bash" || !command) process.exit(0);

  const hit = _matchedPattern(command);
  if (hit) {
    process.stderr.write(
      `Blocked by .claude/hooks/block-destructive.mjs: command matches deny pattern /${hit}/.\n` +
        `Command: ${command}\n` +
        `Reason: destructive, network, install, or commit-related shell ops require explicit human action per .ai/SECURITY_RULES.md.\n`,
    );
    process.exit(2);
  }
  process.exit(0);
}

main().catch((err) => {
  process.stderr.write(`block-destructive hook error: ${err.message}\n`);
  process.exit(0);
});
