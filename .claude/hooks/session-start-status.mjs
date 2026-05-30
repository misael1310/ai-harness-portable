#!/usr/bin/env node
/**
 * SessionStart hook (matcher: startup|resume).
 *
 * Read-only status report printed at the beginning of every Claude Code session. Confirms the
 * canonical AI workspace files are present, prints the current task title from
 * `AGENT_HANDOFF.md`, and surfaces harness-state telemetry (rotation count and days since
 * last harness review).
 *
 * Output goes to stdout. The hook never blocks the session; it only informs.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const AI_DIR = path.join(REPO_ROOT, ".ai");
const CANONICAL_MANIFEST = path.join(AI_DIR, "canonical-files.json");

// If `.ai/extras/multi-repo/` is adopted, add "RETRIEVAL_INDEX.md" to the manifest.
let CANONICAL_FILES = null;

async function _loadCanonicalFiles() {
  try {
    const raw = await fs.readFile(CANONICAL_MANIFEST, "utf8");
    const manifest = JSON.parse(raw);
    return manifest.canonical_files ?? [];
  } catch {
    // Fallback if manifest is missing — keep the hook resilient.
    return [
      "PROJECT_CONTEXT.md",
      "SECURITY_RULES.md",
      "AGENT_HANDOFF.md",
      "CONVENTIONS.md",
      "HARNESS.md",
      "DECISIONS.md",
      "PROJECT_INDEX.md",
      "TOOLS_AUDIT.md",
      "TASK_LOG.md",
      "scripts/rotate-handoff.mjs",
      "scripts/archive-plan.mjs",
    ];
  }
}

const REVIEW_REMINDER_EVERY_N_DAYS = 90;
const REVIEW_REMINDER_EVERY_N_ROTATIONS = 10;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

async function _exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function _readJsonIfExists(filePath) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function _currentTaskTitle() {
  const handoff = path.join(AI_DIR, "AGENT_HANDOFF.md");
  try {
    const raw = await fs.readFile(handoff, "utf8");
    const match = raw.match(/Task title:\s*(.+)/);
    return match?.[1]?.trim() || "(no current task)";
  } catch {
    return "(AGENT_HANDOFF.md missing)";
  }
}

async function main() {
  const lines = ["[harness] SessionStart status:"];

  const canonicalFiles = await _loadCanonicalFiles();
  const missing = [];
  for (const rel of canonicalFiles) {
    const ok = await _exists(path.join(AI_DIR, rel));
    if (!ok) missing.push(`.ai/${rel}`);
  }
  lines.push(`  Canonical files: ${canonicalFiles.length - missing.length}/${canonicalFiles.length} present`);
  if (missing.length) lines.push(`  Missing: ${missing.join(", ")}`);

  const task = await _currentTaskTitle();
  lines.push(`  Current task: ${task}`);

  const state = await _readJsonIfExists(path.join(AI_DIR, ".harness-state.json"));
  if (!state) {
    lines.push(`  Harness state: no .harness-state.json yet — run /harness-onboard.`);
  } else {
    const rotations = state.rotation_count_since_last_review ?? 0;
    let daysLine = "no review recorded";
    if (state.last_review_iso) {
      const days = Math.floor((Date.now() - new Date(state.last_review_iso).getTime()) / MS_PER_DAY);
      daysLine = `${days} days since last review`;
    }
    lines.push(`  Harness state: ${rotations} rotations since last review · ${daysLine}`);

    const reasons = [];
    if (rotations >= REVIEW_REMINDER_EVERY_N_ROTATIONS) reasons.push("rotation threshold");
    if (state.last_review_iso) {
      const days = Math.floor((Date.now() - new Date(state.last_review_iso).getTime()) / MS_PER_DAY);
      if (days >= REVIEW_REMINDER_EVERY_N_DAYS) reasons.push("calendar threshold");
    } else {
      reasons.push("no review recorded");
    }
    if (reasons.length) {
      lines.push(`  Reminder: harness review due (${reasons.join(", ")}). Run /harness-review.`);
    }
  }

  lines.push(`  Tip: run /harness-check for a deeper read-only verification.`);
  process.stdout.write(lines.join("\n") + "\n");
  process.exit(0);
}

main().catch((err) => {
  process.stderr.write(`session-start-status hook error: ${err.message}\n`);
  process.exit(0);
});
