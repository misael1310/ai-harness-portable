#!/usr/bin/env node
/**
 * Plan archival script — single-responsibility companion to rotate-handoff.mjs.
 *
 * Behavior:
 *   1. Validate the target plan lives under `.ai/plans/` and is not already
 *      archived.
 *   2. Refuse templates (filenames starting with `_`).
 *   3. Require frontmatter `status: done` before moving.
 *   4. Move the plan file to `.ai/plans/archive/<same-basename>`.
 *
 * Usage:
 *   node .ai/scripts/archive-plan.mjs <plan-path> [--dry-run]
 *
 * Closure ordering (see `.ai/CONVENTIONS.md` "Plans Convention"):
 *   archive-plan.mjs runs BEFORE rotate-handoff.mjs so the rotated handoff
 *   entry preserves the pre-archive plan path as historical reference.
 *
 * Tool-agnostic: callable from Claude Code, OpenCode, Cursor, or any future
 * agent. Exits non-zero on any validation or filesystem failure.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");
const plansDir = path.join(repoRoot, ".ai", "plans");
const archiveDir = path.join(plansDir, "archive");

function parseArgs(argv) {
  const args = argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const positional = args.filter((a) => !a.startsWith("--"));
  if (positional.length !== 1) {
    throw new Error(
      "Usage: node .ai/scripts/archive-plan.mjs <plan-path> [--dry-run]",
    );
  }
  return { planPath: positional[0], dryRun };
}

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;
  const result = {};
  for (const line of match[1].split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_-]*)\s*:\s*(.*)$/);
    if (m) result[m[1]] = m[2].trim();
  }
  return result;
}

async function main() {
  const { planPath, dryRun } = parseArgs(process.argv);
  const abs = path.resolve(planPath);

  if (!abs.startsWith(plansDir + path.sep)) {
    throw new Error(`Plan must live under .ai/plans/. Got: ${abs}`);
  }
  if (abs.startsWith(archiveDir + path.sep)) {
    throw new Error(`Plan already archived: ${abs}`);
  }
  const basename = path.basename(abs);
  if (basename.startsWith("_")) {
    throw new Error(
      `Templates (underscore-prefixed) are not archivable: ${basename}`,
    );
  }

  const stat = await fs.stat(abs).catch(() => null);
  if (!stat || !stat.isFile()) {
    throw new Error(`Plan file not found: ${abs}`);
  }

  const content = await fs.readFile(abs, "utf8");
  const fm = parseFrontmatter(content);
  if (!fm) {
    throw new Error(`Plan missing frontmatter: ${abs}`);
  }
  if (fm.status !== "done") {
    throw new Error(
      `Plan status must be 'done' to archive. Current: '${fm.status ?? "(unset)"}'`,
    );
  }

  const dest = path.join(archiveDir, basename);
  if (dryRun) {
    console.log(`[dry-run] would move: ${abs} -> ${dest}`);
    return;
  }

  await fs.mkdir(archiveDir, { recursive: true });
  await fs.rename(abs, dest);
  console.log(`Archived: ${abs} -> ${dest}`);
}

main().catch((err) => {
  console.error(`archive-plan: ${err.message}`);
  process.exit(1);
});
