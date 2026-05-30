#!/usr/bin/env node
/**
 * Handoff rotation engine — single source of truth for AGENT_HANDOFF.md lifecycle.
 *
 * Behavior:
 *   1. Read current `.ai/AGENT_HANDOFF.md`.
 *   2. Append it to `.ai/TASK_LOG.md` with a timestamped separator.
 *   3. If `TASK_LOG.md` exceeds the rotation threshold, move it to
 *      `.ai/archive/TASK_LOG-YYYY-MM.md` and start a fresh log.
 *   4. Overwrite `.ai/AGENT_HANDOFF.md` with a clean scaffold for the next task.
 *
 * Tool-agnostic: callable by Claude Code (slash command), OpenCode, Cursor, or any
 * future agent via `node .ai/scripts/rotate-handoff.mjs`.
 *
 * Optional flag: `--dry-run` prints the planned actions without writing.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROTATION_LINE_THRESHOLD = 500;
const REVIEW_REMINDER_EVERY_N_ROTATIONS = 10;
const REVIEW_REMINDER_EVERY_N_DAYS = 90;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const aiDir = path.resolve(__dirname, "..");
const handoffFile = path.join(aiDir, "AGENT_HANDOFF.md");
const taskLogFile = path.join(aiDir, "TASK_LOG.md");
const archiveDir = path.join(aiDir, "archive");
const stateFile = path.join(aiDir, ".harness-state.json");

const dryRun = process.argv.includes("--dry-run");

const HANDOFF_SCAFFOLD = `# Agent Handoff

Use this file to transfer state between Cursor, Claude Code, OpenCode, and future sessions.
Keep it thin (target under ~100 lines). Completed tasks are rotated into \`.ai/TASK_LOG.md\`
by \`.ai/scripts/rotate-handoff.mjs\`.

## Current task

- Task title:
- Ticket / issue:
- Goal:
- Non-goals:
- Current branch:
- Base branch:

## Current status

- [ ] Not started
- [ ] Exploring
- [ ] Plan ready
- [ ] Implementing
- [ ] Needs review
- [ ] Blocked
- [ ] Done

## Context gathered

| File | Why it matters |
|---|---|

## Decisions made

| Decision | Reason | Date |
|---|---|---|

## Commands run

| Command | Result | Notes |
|---|---|---|

## Risks / blockers

## Next best action

## Handoff summary
`;

async function _readIfExists(filePath) {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch (err) {
    if (err.code === "ENOENT") return null;
    throw err;
  }
}

function _timestampUtc() {
  return new Date().toISOString();
}

function _yearMonth(date = new Date()) {
  return date.toISOString().slice(0, 7);
}

async function rotateHandoff() {
  const currentHandoff = await _readIfExists(handoffFile);
  if (!currentHandoff) {
    console.error(`[rotate-handoff] No handoff at ${handoffFile}. Nothing to rotate.`);
    process.exit(1);
  }

  const existingLog = (await _readIfExists(taskLogFile)) ?? "# Task Log\n\nAppend-only chronological log.\n";

  const stamp = _timestampUtc();
  const appendedEntry = `\n---\n## ${stamp}\n\n${currentHandoff.trim()}\n`;
  const nextLog = existingLog + appendedEntry;

  const lineCount = nextLog.split("\n").length;
  const shouldRotate = lineCount > ROTATION_LINE_THRESHOLD;

  if (dryRun) {
    console.log(`[rotate-handoff] DRY RUN`);
    console.log(`  - Append entry to TASK_LOG.md (new line count: ${lineCount})`);
    if (shouldRotate) {
      console.log(`  - Rotate TASK_LOG.md to archive/TASK_LOG-${_yearMonth()}.md`);
    }
    console.log(`  - Reset AGENT_HANDOFF.md to scaffold`);
    return;
  }

  if (shouldRotate) {
    await fs.mkdir(archiveDir, { recursive: true });
    const archiveFile = path.join(archiveDir, `TASK_LOG-${_yearMonth()}.md`);
    const existingArchive = (await _readIfExists(archiveFile)) ?? "";
    const mergedArchive = existingArchive
      ? existingArchive.trimEnd() + "\n" + appendedEntry
      : nextLog;
    await fs.writeFile(archiveFile, mergedArchive, "utf8");
    await fs.writeFile(taskLogFile, "# Task Log\n\nAppend-only chronological log.\n", "utf8");
    console.log(`[rotate-handoff] Rotated TASK_LOG.md → ${archiveFile}`);
  } else {
    await fs.writeFile(taskLogFile, nextLog, "utf8");
    console.log(`[rotate-handoff] Appended current handoff to TASK_LOG.md (${lineCount} lines).`);
  }

  await fs.writeFile(handoffFile, HANDOFF_SCAFFOLD, "utf8");
  console.log(`[rotate-handoff] AGENT_HANDOFF.md reset to scaffold.`);

  await _bumpRotationCounter();
}

async function _bumpRotationCounter() {
  let state = {
    rotation_count_since_last_review: 0,
    total_rotations: 0,
    last_review_iso: null,
    last_rotation_iso: null,
  };
  const raw = await _readIfExists(stateFile);
  if (raw) {
    try {
      state = { ...state, ...JSON.parse(raw) };
    } catch {
      // Corrupt state file — fall back to defaults rather than crash the rotation.
    }
  }
  state.rotation_count_since_last_review = (state.rotation_count_since_last_review ?? 0) + 1;
  state.total_rotations = (state.total_rotations ?? 0) + 1;
  state.last_rotation_iso = _timestampUtc();
  await fs.writeFile(stateFile, JSON.stringify(state, null, 2) + "\n", "utf8");

  const reasons = [];
  if (state.rotation_count_since_last_review >= REVIEW_REMINDER_EVERY_N_ROTATIONS) {
    reasons.push(`${state.rotation_count_since_last_review} rotations since last review`);
  }
  if (state.last_review_iso) {
    const daysSinceReview = Math.floor(
      (Date.now() - new Date(state.last_review_iso).getTime()) / MS_PER_DAY,
    );
    if (daysSinceReview >= REVIEW_REMINDER_EVERY_N_DAYS) {
      reasons.push(`${daysSinceReview} days since last review`);
    }
  } else {
    reasons.push(`no review recorded yet — run /harness-onboard first`);
  }

  if (reasons.length > 0) {
    console.log(
      `[rotate-handoff] Reminder (${reasons.join("; ")}). Run \`/harness-review\` (Claude Code) ` +
        `or follow the protocol in .claude/commands/harness-review.md from any tool.`,
    );
  }
}

rotateHandoff().catch((err) => {
  console.error(`[rotate-handoff] Failed:`, err.message);
  process.exit(1);
});
