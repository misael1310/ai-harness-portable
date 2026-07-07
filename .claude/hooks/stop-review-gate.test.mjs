#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  CHEAP_MAX_FILES,
  CHEAP_MAX_LINES,
  ARCH_MIN_FILES,
  ARCH_MIN_LINES,
  ROUTES,
  classifyRoute,
  filterPathEntries,
  hookOutputForRoute,
  isSecurityPath,
  parsePorcelainZ,
} from "./stop-review-gate.mjs";

const HOOK_OUTPUT_MAX_CHARS = 10000;

function route(paths, stat = { lines: 0 }, options = {}) {
  return classifyRoute(
    paths.map((entry) => {
      const [status, filePath] = entry;
      return { status, path: filePath, untracked: status === "??" };
    }),
    stat,
    options,
  ).route;
}

assert.deepEqual(parsePorcelainZ("R  src/auth/session.ts\0docs/a.md\0"), [
  { status: "R ", path: "src/auth/session.ts", untracked: false },
  { status: "R ", path: "docs/a.md", untracked: false },
]);
assert.deepEqual(parsePorcelainZ("C  src/copy.ts\0src/original.ts\0"), [
  { status: "C ", path: "src/copy.ts", untracked: false },
  { status: "C ", path: "src/original.ts", untracked: false },
]);
assert.deepEqual(parsePorcelainZ(" M docs/spaced name.md\0"), [
  { status: " M", path: "docs/spaced name.md", untracked: false },
]);

for (const p of [
  "src/auth/session.ts",
  "src/authentication/login.ts",
  "src/authorization/policy.ts",
  "src/cors.ts",
  "src/csp-policy.ts",
  "src/payment/charge.ts",
  "src/billing/invoice.ts",
  "deploy/release.yml",
  "deployment/prod.yml",
  ".github/workflows/deploy.yml",
  "src/.env.example",
  "certs/site.pem",
  "certs/site.key",
  "src/token-store.ts",
  "src/secret-store.ts",
  "src/credential-store.ts",
  "config/secrets/app.yml",
  "config/credentials/app.yml",
  "Dockerfile",
  "ops/Containerfile",
  "docker-compose.yml",
  "apps/foo/package.json",
  "services/x/pyproject.toml",
  "crates/y/Cargo.toml",
  "services/api/go.mod",
  "requirements-dev.txt",
  "Gemfile",
  "apps/foo/pnpm-lock.yaml",
  ".ai/HARNESS.md",
  ".ai/CONVENTIONS.md",
  ".ai/canonical-files.json",
  ".claude/hooks/stop-review-gate.mjs",
  ".claude/commands/harness-check.md",
  ".opencode/agents/security-review.md",
  "AGENTS.md",
  "CLAUDE.md",
  "opencode.json",
]) {
  assert.equal(isSecurityPath(p), true, p);
}

assert.equal(route([[" M", "src/view.ts"]]), ROUTES.CHEAP);
assert.equal(route([["??", "src/auth/new.ts"]]), ROUTES.SECURITY);
assert.equal(route([[" M", "README.md"]]), ROUTES.NONE);
assert.equal(route([[" M", ".ai/AGENT_HANDOFF.md"]]), ROUTES.NONE);
assert.equal(route([[" M", ".ai/plans/work.md"]]), ROUTES.NONE);
assert.equal(route([[" M", ".ai/plans/_template.md"]]), ROUTES.CHEAP);
assert.equal(route([[" M", ".ai/DECISIONS.md"]]), ROUTES.CHEAP);
assert.equal(route([[" M", ".ai/HARNESS.md"]]), ROUTES.SECURITY);
assert.equal(
  route([["??", "src/feature/new.ts"]], { lines: 0 }, { trackedTopLevelDirs: new Set(["src"]) }),
  ROUTES.FULL,
);
assert.equal(
  route([["??", "notes.txt"]], { lines: 0 }, { trackedTopLevelDirs: new Set(["src"]) }),
  ROUTES.FULL,
);

const manyFiles = Array.from({ length: ARCH_MIN_FILES }, (_, i) => [" M", `src/f${i}.ts`]);
assert.equal(route(manyFiles), ROUTES.ARCHITECTURE);
assert.equal(route([[" M", "src/a.ts"]], { lines: ARCH_MIN_LINES }), ROUTES.ARCHITECTURE);
assert.equal(
  route([["??", "new-module/index.ts"]], { lines: 0 }, { trackedTopLevelDirs: new Set(["src"]) }),
  ROUTES.ARCHITECTURE,
);
assert.equal(route([[" M", ".github/workflows/deploy.yml"]]), ROUTES.SECURITY);
assert.equal(route([["R ", "README-gate.md"], ["R ", ".claude/hooks/old-gate.mjs"]]), ROUTES.SECURITY);
assert.equal(
  route([
    [" M", ".github/workflows/deploy.yml"],
    ["??", "new-module/index.ts"],
  ], { lines: 0 }, { trackedTopLevelDirs: new Set(["src"]) }),
  ROUTES.FULL,
);

const securityOutput = hookOutputForRoute(
  classifyRoute([{ status: " M", path: "src/auth/session.ts", untracked: false }]),
);
assert.match(securityOutput, /"decision":"block"/);
assert.doesNotMatch(securityOutput, /src\/auth\/session\.ts/);

const cheapOutput = hookOutputForRoute(
  classifyRoute([{ status: " M", path: "src/view.ts", untracked: false }]),
);
assert.match(cheapOutput, /"hookEventName":"Stop"/);
assert.doesNotMatch(cheapOutput, /src\/view\.ts/);
assert.ok(cheapOutput.length < HOOK_OUTPUT_MAX_CHARS);

assert.equal(CHEAP_MAX_FILES, 3);
assert.equal(CHEAP_MAX_LINES, 150);
assert.equal(ARCH_MIN_FILES, 11);
assert.equal(ARCH_MIN_LINES, 501);

// filterPathEntries: reject PATH entries equal to or inside repoRoot; keep outside.
{
  const delim = path.delimiter;
  const root = path.resolve("/tmp/repo-root");
  const insideChild = path.join(root, "node_modules", ".bin");
  const insideNested = path.join(root, "a", "b", "c");
  const sibling = path.resolve("/tmp/sibling-bin");
  const kept = filterPathEntries(
    root,
    [insideChild, insideNested, root, sibling, ""].join(delim),
    delim,
  )
    .split(delim)
    .filter(Boolean);

  assert.ok(!kept.includes(insideChild), "direct child of repoRoot must be filtered");
  assert.ok(!kept.includes(insideNested), "nested child of repoRoot must be filtered");
  assert.ok(!kept.includes(root), "repoRoot itself must be filtered");
  assert.equal(kept.length, 1, "only the outside entry survives");
  assert.equal(kept[0], sibling, "the surviving entry is the outside sibling");

  if (process.platform === "win32") {
    const crossDrive = path.resolve("D:/tools/bin");
    assert.equal(
      filterPathEntries(root, crossDrive, delim),
      crossDrive,
      "different-drive entry must be kept on Windows",
    );
  }
}

// Symlinked PATH entries that point inside repoRoot must be filtered too.
{
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "stop-review-gate-"));
  try {
    const repoRoot = path.join(tmpRoot, "repo");
    const insideBin = path.join(repoRoot, "node_modules", ".bin");
    const linkedBin = path.join(tmpRoot, "linked-bin");
    const repoOwnedLink = path.join(repoRoot, "linked-out-bin");
    const outsideBin = path.join(tmpRoot, "outside-bin");
    fs.mkdirSync(insideBin, { recursive: true });
    fs.mkdirSync(outsideBin, { recursive: true });

    fs.symlinkSync(insideBin, linkedBin, process.platform === "win32" ? "junction" : "dir");
    fs.symlinkSync(outsideBin, repoOwnedLink, process.platform === "win32" ? "junction" : "dir");

    const kept = filterPathEntries(
      repoRoot,
      [linkedBin, repoOwnedLink, outsideBin].join(path.delimiter),
    )
      .split(path.delimiter)
      .filter(Boolean);
    assert.ok(!kept.includes(linkedBin), "symlink into repoRoot must be filtered");
    assert.ok(!kept.includes(repoOwnedLink), "repo-owned symlink must be filtered");
    assert.ok(kept.includes(outsideBin), "outside PATH entry must be kept");
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
}

console.log("stop-review-gate self-test passed");
