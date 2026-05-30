#!/usr/bin/env node
/**
 * Stop hook: emit the post-edit review gate reminder only when working-tree
 * changes touch trigger-pattern files. No output on read-only turns, which
 * prevents the false-positive response loop caused by a prompt-type hook.
 *
 * Trigger patterns mirror the gate definition in .ai/HARNESS.md
 * "Post-Edit Review Gate".
 */

import { execSync } from "node:child_process";

const TRIGGER_PATTERNS = [
  /^src\//,
  /^webpack\//,
  /^static\//,
  /^\.ai\/CONVENTIONS\.md$/,
  /^\.ai\/SECURITY_RULES\.md$/,
  /^\.ai\/HARNESS\.md$/,
  /^\.ai\/PROJECT_CONTEXT\.md$/,
  /^\.ai\/PROJECT_INDEX\.md$/,
  /^\.ai\/RETRIEVAL_INDEX\.md$/,
  /^\.ai\/DECISIONS\.md$/,
  /^\.claude\/settings\.json$/,
  /^\.claude\/hooks\//,
  /^\.claude\/agents\//,
  /^opencode\.json$/,
  /^\.opencode\//,
  /^\.cursor\/rules\//,
  /^CLAUDE\.md$/,
  /^AGENTS\.md$/,
  /^\.gitignore$/,
  /^package\.json$/,
  /^package-lock\.json$/,
  /^tsconfig/,
];

const GATE_REMINDER = [
  'Post-edit review gate: follow .ai/HARNESS.md "Post-Edit Review Gate" —',
  "invoke the read-only review subagents in parallel before the final summary,",
  "then report blocking findings or unresolved risks. Skip only per the explicit",
  "skip allowlist in that section; when in doubt, run the gate.",
].join(" ");

try {
  const status = execSync("git status --short --porcelain", {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  });

  const changedFiles = status
    .split("\n")
    .filter(Boolean)
    .map((line) => line.slice(3).trim());

  const hasTriggeredFile = changedFiles.some((file) =>
    TRIGGER_PATTERNS.some((pattern) => pattern.test(file)),
  );

  if (hasTriggeredFile) {
    process.stdout.write(GATE_REMINDER + "\n");
  }
  // No output → no reminder → no loop for read-only turns.
} catch {
  // git unavailable or non-repo — emit the reminder to be safe.
  process.stdout.write(GATE_REMINDER + "\n");
}
