#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  ARCH_MIN_FILES,
  ARCH_MIN_LINES,
  CHEAP_MAX_FILES,
  CHEAP_MAX_LINES,
  ROUTES,
  _safeExecEnv,
  buildChangeRecords,
  classifyRoute,
  filterPathEntries,
  hookOutputForRoute,
  isCheapPath,
  isDataIntegrityPath,
  isHarnessPath,
  isSecurityPath,
  isSkipAllowlisted,
  isTestPath,
  parseNumstatZ,
  parsePorcelainZ,
} from "./stop-review-gate.mjs";

const HOOK_OUTPUT_MAX_CHARS = 10000;

// ---------------------------------------------------------------------------
// Test-only record builders
// ---------------------------------------------------------------------------

function _rec(paths, { added = 0, deleted = 0, binary = false, untracked = false } = {}) {
  return {
    paths: Array.isArray(paths) ? paths : [paths],
    added: untracked || binary ? null : added,
    deleted: untracked || binary ? null : deleted,
    binary,
    untracked,
  };
}

function _manyEligible(count, prefix = "src/f") {
  return Array.from({ length: count }, (_, i) => _rec(`${prefix}${i}.ts`, { added: 1, deleted: 0 }));
}

function _route(records, options = {}) {
  return classifyRoute(records, options).route;
}

// ---------------------------------------------------------------------------
// parsePorcelainZ (unchanged behavior)
// ---------------------------------------------------------------------------

assert.deepEqual(parsePorcelainZ("R  src/auth/session.ts\0docs/a.md\0"), [
  { status: "R ", path: "src/auth/session.ts", oldPath: "docs/a.md", untracked: false },
]);
assert.deepEqual(parsePorcelainZ(" R src/new.ts\0src/old.ts\0"), [
  { status: " R", path: "src/new.ts", oldPath: "src/old.ts", untracked: false },
]);
assert.deepEqual(parsePorcelainZ(" C src/copy.ts\0src/source.ts\0"), [
  { status: " C", path: "src/copy.ts", oldPath: "src/source.ts", untracked: false },
]);
assert.deepEqual(parsePorcelainZ(" M docs/spaced name.md\0"), [
  { status: " M", path: "docs/spaced name.md", untracked: false },
]);
assert.throws(() => parsePorcelainZ(" M docs/missing-nul.md"));
assert.throws(() => parsePorcelainZ(" M\0"));
assert.throws(() => parsePorcelainZ("XX bad.ts\0"));
assert.throws(() => parsePorcelainZ(" Mmissing-separator.ts\0"));
assert.throws(() => parsePorcelainZ("!! ignored.ts\0"));
assert.throws(() => parsePorcelainZ(" R renamed.ts\0"));
assert.throws(() => parsePorcelainZ(" C copied.ts\0"));

// ---------------------------------------------------------------------------
// parseNumstatZ
// ---------------------------------------------------------------------------

assert.deepEqual(parseNumstatZ("5\t2\tsrc/a.ts\0"), [
  { paths: ["src/a.ts"], added: 5, deleted: 2, binary: false, untracked: false },
]);
assert.deepEqual(parseNumstatZ("2\t1\tsrc/spaced name.ts\0"), [
  { paths: ["src/spaced name.ts"], added: 2, deleted: 1, binary: false, untracked: false },
]);
assert.deepEqual(parseNumstatZ("2\t1\tsrc/tabbed\tname.ts\0"), [
  { paths: ["src/tabbed\tname.ts"], added: 2, deleted: 1, binary: false, untracked: false },
]);
assert.deepEqual(parseNumstatZ("3\t1\t\0old/path.ts\0new/path.ts\0"), [
  {
    paths: ["old/path.ts", "new/path.ts"],
    added: 3,
    deleted: 1,
    binary: false,
    untracked: false,
  },
]);
assert.deepEqual(parseNumstatZ("-\t-\tassets/logo.png\0"), [
  { paths: ["assets/logo.png"], added: null, deleted: null, binary: true, untracked: false },
]);
assert.deepEqual(
  parseNumstatZ("5\t2\tsrc/a.ts\0-\t-\tassets/logo.png\0" + "3\t1\t\0old.ts\0new.ts\0"),
  [
    { paths: ["src/a.ts"], added: 5, deleted: 2, binary: false, untracked: false },
    { paths: ["assets/logo.png"], added: null, deleted: null, binary: true, untracked: false },
    { paths: ["old.ts", "new.ts"], added: 3, deleted: 1, binary: false, untracked: false },
  ],
);
assert.throws(() => parseNumstatZ("3\t1\t\0old.ts\0")); // truncated rename block, missing new path
assert.throws(() => parseNumstatZ("not-a-record\0"));
assert.throws(() => parseNumstatZ("5\t2\0")); // only 2 tab fields total, not a valid grammar
assert.throws(() => parseNumstatZ("5\t2\tsrc/missing-nul.ts"));
for (const invalidCount of ["", "-1", "1.5", "1e2", "9007199254740992"]) {
  assert.throws(() => parseNumstatZ(`${invalidCount}\t0\tsrc/a.ts\0`));
}

// ---------------------------------------------------------------------------
// buildChangeRecords
// ---------------------------------------------------------------------------

{
  const statusChanges = parsePorcelainZ("?? notes.txt\0 M src/a.ts\0");
  const numstatRecords = parseNumstatZ("4\t1\tsrc/a.ts\0");
  const merged = buildChangeRecords(statusChanges, numstatRecords);
  assert.deepEqual(merged, [
    { paths: ["src/a.ts"], added: 4, deleted: 1, binary: false, untracked: false },
    { paths: ["notes.txt"], added: null, deleted: null, binary: false, untracked: true },
  ]);
}

{
  // Exact staged/worktree cancellation: a tracked `MM` entry with no net
  // numstat record must survive with unknown magnitude — committing would
  // still ship the staged content — never collapse to route `none`.
  const merged = buildChangeRecords(parsePorcelainZ("MM src/auth/session.ts\0"), []);
  assert.deepEqual(merged, [
    { paths: ["src/auth/session.ts"], added: null, deleted: null, binary: false, untracked: false },
  ]);
  assert.equal(_route(merged), ROUTES.SECURITY);
}
assert.equal(
  _route(buildChangeRecords(parsePorcelainZ("MM src/view.ts\0"), [])),
  ROUTES.FULL,
  "a cancelled tracked path with no category match has unknown magnitude and fails closed",
);

{
  const merged = buildChangeRecords(parsePorcelainZ(" R src/new.ts\0src/old.ts\0"), []);
  assert.deepEqual(merged, [
    {
      paths: ["src/old.ts", "src/new.ts"],
      added: null,
      deleted: null,
      binary: false,
      untracked: false,
    },
  ]);
  assert.equal(classifyRoute(merged).counts.files, 1);
}

// ---------------------------------------------------------------------------
// Path category predicates
// ---------------------------------------------------------------------------

for (const p of [
  ".ai/HARNESS.md",
  ".ai/CONVENTIONS.md",
  ".ai/canonical-files.json",
  ".ai/plans/_template.md",
  ".claude/settings.json",
  ".claude/hooks/stop-review-gate.mjs",
  ".claude/hooks/stop-review-gate.test.mjs",
  ".claude/agents/security-review.md",
  ".claude/commands/harness-check.md",
  ".opencode/agents/security-review.md",
  ".cursor/rules/code-edit-review-gate.mdc",
  "AGENTS.md",
  "CLAUDE.md",
  "opencode.json",
  "install.ps1",
  "install.sh",
]) {
  assert.equal(isHarnessPath(p), true, `expected harness: ${p}`);
  assert.equal(isSecurityPath(p), false, `harness path must not double as generic security: ${p}`);
}

for (const p of [
  "src/auth/session.ts",
  "src/authentication/login.ts",
  "src/authorization/policy.ts",
  "src/cors.ts",
  "src/cors/middleware.ts",
  "src/csp-policy.ts",
  "src/csp/policy.ts",
  "src/payment/charge.ts",
  "src/billing/invoice.ts",
  "deploy/release.yml",
  "deployment/prod.yml",
  ".github/workflows/deploy.yml",
  "src/.env.example",
  "certs/site.pem",
  "certs/site.key",
  "src/token-store.ts",
  "src/token/store.ts",
  "src/secret-store.ts",
  "src/secret/store.ts",
  "src/credential-store.ts",
  "src/credential/store.ts",
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
]) {
  assert.equal(isSecurityPath(p), true, `expected security: ${p}`);
  assert.equal(isHarnessPath(p), false, `security path must not be harness: ${p}`);
}

for (const p of ["db/migrations/0001_init.sql", "scripts/seed.ts", "app/schema.prisma", "src/orders-sync.ts", "src/import-users.ts", "src/export-report.ts", "db/rls/policy.sql", "policies/tenant.sql"]) {
  assert.equal(isDataIntegrityPath(p), true, `expected data-integrity: ${p}`);
}

for (const p of ["src/foo.test.ts", "src/foo.spec.ts", "__tests__/foo.ts", "test/foo.ts", "tests/foo.ts", "jest.config.js", "vitest.config.ts", "playwright.config.ts"]) {
  assert.equal(isTestPath(p), true, `expected test: ${p}`);
}
assert.equal(isTestPath(".claude/hooks/stop-review-gate.test.mjs"), true);
assert.equal(isHarnessPath(".claude/hooks/stop-review-gate.test.mjs"), true);

for (const p of ["README.md", "docs/guide.md", "docs/assets/diagram.png", "LICENSE", "NOTICE", "CHANGELOG.md", "nested/dir/file.mdx"]) {
  assert.equal(isCheapPath(p), true, `expected cheap: ${p}`);
}
// docs/** is root-anchored: a nested "docs" directory that is not at repo root
// and not markdown is not cheap.
assert.equal(isCheapPath("packages/foo/docs/diagram.png"), false);

assert.equal(isSkipAllowlisted(".ai/AGENT_HANDOFF.md"), true);
assert.equal(isSkipAllowlisted(".ai/TASK_LOG.md"), true);
assert.equal(isSkipAllowlisted(".ai/archive/TASK_LOG-2026-01.md"), true);
assert.equal(isSkipAllowlisted(".ai/plans/work.md"), true);
assert.equal(isSkipAllowlisted(".ai/plans/_template.md"), false);
assert.equal(isSkipAllowlisted("README.md"), false); // moved out of the allowlist

// ---------------------------------------------------------------------------
// classifyRoute — none / cheap / standard
// ---------------------------------------------------------------------------

assert.equal(_route([_rec(".ai/AGENT_HANDOFF.md", { added: 5, deleted: 2 })]), ROUTES.NONE);
assert.equal(_route([_rec(".ai/TASK_LOG.md")]), ROUTES.NONE);
assert.equal(_route([_rec(".ai/archive/TASK_LOG-2026-01.md")]), ROUTES.NONE);
assert.equal(_route([_rec(".ai/plans/work.md")]), ROUTES.NONE);
assert.equal(_route([]), ROUTES.NONE);

assert.equal(_route([_rec("README.md", { added: 10, deleted: 3 })]), ROUTES.CHEAP);
assert.equal(
  _route([_rec("docs/a.md", { added: 10 }), _rec("docs/b.md", { added: 10 }), _rec("docs/c.md", { added: 10 })]),
  ROUTES.CHEAP,
);
assert.equal(_route([_rec("docs/a.md", { added: CHEAP_MAX_LINES })]), ROUTES.CHEAP);
assert.equal(_route([_rec("docs/a.md", { added: CHEAP_MAX_LINES + 1 })]), ROUTES.STANDARD);
assert.equal(
  _route([
    _rec("docs/a.md", { added: 1 }),
    _rec("docs/b.md", { added: 1 }),
    _rec("docs/c.md", { added: 1 }),
    _rec("docs/d.md", { added: 1 }),
  ]),
  ROUTES.STANDARD,
  "docs-only above CHEAP_MAX_FILES must be standard_review, not cheap_review or architecture",
);

assert.equal(_route([_rec("src/view.ts", { added: 3, deleted: 1 })]), ROUTES.STANDARD);
assert.equal(
  _route([_rec("docs/a.md", { added: 1 }), _rec("src/view.ts", { added: 1 })]),
  ROUTES.STANDARD,
  "mixed cheap + plain source is standard, not cheap",
);

// ---------------------------------------------------------------------------
// classifyRoute — targeted_tests
// ---------------------------------------------------------------------------

assert.equal(_route([_rec("src/foo.test.ts", { added: 20, deleted: 5 })]), ROUTES.TESTS);
assert.equal(
  _route([_rec("tests/a.ts", { added: 5 }), _rec("tests/b.ts", { added: 5 })]),
  ROUTES.TESTS,
);
assert.equal(
  _route([_rec(".claude/hooks/stop-review-gate.test.mjs", { added: 5, deleted: 1 })]),
  ROUTES.AGENT_HARNESS,
  "harness test files are harness first, never targeted_tests",
);
assert.equal(
  _route([_rec("tests/auth/session.test.ts", { added: 5 })]),
  ROUTES.SECURITY,
  "a test path that is also a security path is not test-only",
);

// ---------------------------------------------------------------------------
// classifyRoute — single high-risk dimension routes
// ---------------------------------------------------------------------------

assert.equal(_route([_rec("db/migrations/0002.sql", { added: 30, deleted: 2 })]), ROUTES.DATA_INTEGRITY);
assert.equal(_route([_rec("src/auth/session.ts", { added: 5 })]), ROUTES.SECURITY);
assert.equal(_route([_rec("package.json", { added: 2, deleted: 1 })]), ROUTES.SECURITY);
assert.equal(_route([_rec(".ai/HARNESS.md", { added: 20, deleted: 3 })]), ROUTES.AGENT_HARNESS);
assert.equal(_route([_rec(".claude/agents/foo.md", { added: 10 })]), ROUTES.AGENT_HARNESS);
assert.equal(_route([_rec("AGENTS.md", { added: 4 })]), ROUTES.AGENT_HARNESS);
assert.equal(_route([_rec("CLAUDE.md", { added: 4 })]), ROUTES.AGENT_HARNESS);
assert.equal(_route([_rec("opencode.json", { added: 4 })]), ROUTES.AGENT_HARNESS);
assert.equal(_route([_rec("install.ps1", { added: 4 })]), ROUTES.AGENT_HARNESS);
assert.equal(
  _route(
    Array.from({ length: ARCH_MIN_FILES }, (_, i) =>
      _rec(`.ai/extras/agents/reviewer-${i}.md`, { added: 1 }),
    ),
  ),
  ROUTES.FULL,
  "harness markdown is harness-classified and remains architecture-eligible",
);

// ---------------------------------------------------------------------------
// classifyRoute — architecture thresholds (boundary edges)
// ---------------------------------------------------------------------------

assert.equal(_route(_manyEligible(ARCH_MIN_FILES - 1)), ROUTES.STANDARD);
assert.equal(_route(_manyEligible(ARCH_MIN_FILES)), ROUTES.ARCHITECTURE);
assert.equal(_route([_rec("src/big.ts", { added: ARCH_MIN_LINES - 1, deleted: 0 })]), ROUTES.STANDARD);
assert.equal(_route([_rec("src/big.ts", { added: ARCH_MIN_LINES, deleted: 0 })]), ROUTES.ARCHITECTURE);
assert.equal(
  _route([_rec("new-module/index.ts", { untracked: true })], { trackedTopLevelDirs: new Set(["src"]) }),
  ROUTES.ARCHITECTURE,
  "a new top-level module dir triggers architecture even though its size is unknown",
);
assert.equal(
  _route([_rec("new-module/index.ts", { untracked: true })], { trackedTopLevelDirs: new Set() }),
  ROUTES.ARCHITECTURE,
  "an empty tracked-directory set still proves a new top-level module boundary",
);
assert.equal(
  _route([_rec("new-module/index.ts", { added: 5 })], { trackedTopLevelDirs: new Set(["src"]) }),
  ROUTES.ARCHITECTURE,
  "a staged (tracked) new top-level module triggers architecture like an untracked one",
);
assert.equal(
  _route([_rec(["src/x.ts", "new-module/x.ts"], { added: 1 })], {
    trackedTopLevelDirs: new Set(["src"]),
  }),
  ROUTES.ARCHITECTURE,
  "a rename into a new top-level dir crosses the new-module boundary",
);
assert.equal(
  _route([_rec("new-service/README.md", { untracked: true })], {
    trackedTopLevelDirs: new Set(["src"]),
  }),
  ROUTES.FULL,
  "a cheap-only new top-level dir stays architecture-ineligible, so its unknown size is unaccounted and fails closed",
);
assert.equal(
  _route([_rec("new-service/foo.test.ts", { untracked: true })], {
    trackedTopLevelDirs: new Set(["src"]),
  }),
  ROUTES.FULL,
  "a test-only new top-level dir stays architecture-ineligible, so its unknown size is unaccounted and fails closed",
);
assert.equal(
  _route(
    [_rec("new-service/README.md", { added: 10 })],
    { trackedTopLevelDirs: new Set(["src"]) },
  ),
  ROUTES.CHEAP,
  "the same cheap file with KNOWN magnitude routes cheap — only unknown size fails closed",
);
assert.equal(
  _route([_rec("src/feature/new.ts", { untracked: true })], { trackedTopLevelDirs: new Set(["src"]) }),
  ROUTES.FULL,
  "untracked file inside an already-tracked top-level dir has no category match, so unknown magnitude fails closed",
);
assert.equal(
  _route([_rec("notes.txt", { untracked: true })], { trackedTopLevelDirs: new Set(["src"]) }),
  ROUTES.FULL,
  "a lone untracked file with no path-segment boundary and no category match fails closed",
);

// ---------------------------------------------------------------------------
// classifyRoute — full_gate: two independent high-risk dimensions
// ---------------------------------------------------------------------------

assert.equal(
  _route([_rec(".ai/HARNESS.md", { added: 5 }), _rec("src/auth/session.ts", { added: 5 })]),
  ROUTES.FULL,
  "harness + security on different paths",
);
assert.equal(
  _route([_rec(".ai/HARNESS.md", { added: 5 }), _rec("db/migrations/0001.sql", { added: 5 })]),
  ROUTES.FULL,
  "harness + data-integrity on different paths",
);
assert.equal(
  _route([_rec("src/auth/migrations/schema.sql", { added: 5, deleted: 1 })]),
  ROUTES.FULL,
  "one path matching both security and data-integrity counts as two dimensions",
);
assert.equal(
  _route([_rec(".opencode/package-lock.json", { added: 2 })]),
  ROUTES.FULL,
  "a harness path that also matches a retained security glob (lockfile supply-chain signal) is two dimensions by design, never demoted to targeted_agent_harness",
);
assert.equal(
  _route([_rec(".ai/HARNESS.md", { added: 5 }), ..._manyEligible(ARCH_MIN_FILES)]),
  ROUTES.FULL,
  "harness + architecture magnitude together escalate past targeted_agent_harness",
);
assert.equal(_route([_rec("assets/logo.png", { binary: true })]), ROUTES.FULL);
assert.equal(
  _route([_rec("db/migrations/0001.sql", { binary: true })]),
  ROUTES.DATA_INTEGRITY,
  "a category match still wins even when that same path's magnitude is unknown (binary)",
);
assert.equal(
  _route([_rec("db/migrations/0001.sql", { added: 5 }), _rec("notes.dat", { untracked: true })]),
  ROUTES.FULL,
  "a known-size category match elsewhere does not excuse an unrelated unaccounted unknown-magnitude path",
);
assert.equal(
  _route(
    [_rec("src/auth/session.ts", { added: 5 }), _rec("src/feature/mystery.dat", { untracked: true })],
    { trackedTopLevelDirs: new Set(["src"]) },
  ),
  ROUTES.FULL,
  "a security match elsewhere does not excuse an unrelated unaccounted untracked path even inside an already-tracked top-level dir",
);

// ---------------------------------------------------------------------------
// classifyRoute — rename/copy: counts once, categorizes the union
// ---------------------------------------------------------------------------

assert.equal(
  _route([_rec(["src/auth/old.ts", "docs/new.md"], { added: 3, deleted: 1 })]),
  ROUTES.SECURITY,
  "rename union: old path security category still applies even though new path is cheap",
);
{
  // A rename pair is architecture-eligible when either side qualifies, and
  // counts once toward the file-count threshold (not twice).
  const renames = Array.from({ length: ARCH_MIN_FILES }, (_, i) =>
    _rec([`docs/old${i}.md`, `src/new${i}.ts`], { added: 1, deleted: 0 }),
  );
  assert.equal(_route(renames), ROUTES.ARCHITECTURE);
  assert.equal(classifyRoute(renames).counts.files, ARCH_MIN_FILES);
}

// The skip allowlist applies per path: an allowlisted rename side never
// contributes categories; only the non-allowlisted side classifies.
assert.equal(
  _route([_rec([".ai/plans/work.md", "docs/work.md"], { added: 3, deleted: 1 })]),
  ROUTES.CHEAP,
  "rename out of the allowlist classifies only the docs side — cheap, not harness",
);
assert.equal(
  _route([_rec(["docs/work.md", ".ai/plans/work.md"], { added: 3, deleted: 1 })]),
  ROUTES.CHEAP,
  "rename into the allowlist classifies only the non-allowlisted side",
);
assert.equal(
  _route([_rec([".ai/plans/a.md", ".ai/plans/b.md"], { added: 1 })]),
  ROUTES.NONE,
  "a rename fully inside the allowlist stays route none",
);
assert.equal(
  _route([_rec([".ai/plans/x.md", ".claude/agents/y.md"], { added: 1 })]),
  ROUTES.AGENT_HARNESS,
  "a non-allowlisted harness side still classifies as harness",
);

// ---------------------------------------------------------------------------
// hookOutputForRoute — blocking vs advisory, no path/diff leakage
// ---------------------------------------------------------------------------

const securityOutput = hookOutputForRoute(classifyRoute([_rec("src/auth/session.ts", { added: 5 })]));
assert.match(securityOutput, /"decision":"block"/);
assert.doesNotMatch(securityOutput, /src\/auth\/session\.ts/);

const harnessOutput = hookOutputForRoute(classifyRoute([_rec(".ai/HARNESS.md", { added: 5 })]));
assert.match(harnessOutput, /"decision":"block"/);
assert.match(harnessOutput, /targeted_agent_harness/);

const dataOutput = hookOutputForRoute(classifyRoute([_rec("db/migrations/0001.sql", { added: 5 })]));
assert.match(dataOutput, /"decision":"block"/);

const cheapOutput = hookOutputForRoute(classifyRoute([_rec("README.md", { added: 5 })]));
assert.match(cheapOutput, /"hookEventName":"Stop"/);
assert.doesNotMatch(cheapOutput, /README\.md/);
assert.ok(cheapOutput.length < HOOK_OUTPUT_MAX_CHARS);

const testsOutput = hookOutputForRoute(classifyRoute([_rec("src/foo.test.ts", { added: 5 })]));
assert.match(testsOutput, /"hookEventName":"Stop"/, "targeted_tests is advisory, not blocking");

const architectureOutput = hookOutputForRoute(classifyRoute(_manyEligible(ARCH_MIN_FILES)));
assert.match(architectureOutput, /"hookEventName":"Stop"/, "targeted_architecture alone is advisory");

assert.equal(hookOutputForRoute(classifyRoute([_rec(".ai/AGENT_HANDOFF.md")])), "");

assert.equal(CHEAP_MAX_FILES, 3);
assert.equal(CHEAP_MAX_LINES, 150);
assert.equal(ARCH_MIN_FILES, 11);
assert.equal(ARCH_MIN_LINES, 501);

// ---------------------------------------------------------------------------
// filterPathEntries: reject PATH entries equal to or inside repoRoot; keep outside.
// ---------------------------------------------------------------------------

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
  assert.equal(
    filterPathEntries(root, "relative-bin", delim),
    "",
    "relative PATH entries must be rejected because child lookup uses a different cwd",
  );

  if (process.platform === "win32") {
    const quotedInside = `"${insideChild}"`;
    assert.equal(
      filterPathEntries(root, quotedInside, delim),
      "",
      "quoted repo-owned PATH entry must be filtered on Windows",
    );
    const crossDrive = path.resolve("D:/tools/bin");
    assert.equal(
      filterPathEntries(root, crossDrive, delim),
      crossDrive,
      "different-drive entry must be kept on Windows",
    );
  }
}

// _safeExecEnv: every case variant of GIT_* is stripped and every case
// variant of PATH is sanitized before the hook executes git.
{
  const outside = path.resolve(os.tmpdir(), "outside-bin");
  const env = _safeExecEnv({
    GIT_DIR: "/x",
    git_trace: "1",
    Git_Config_Global: "/y",
    HOME: "keep",
    PATH: ["rel-bin", outside].join(path.delimiter),
    Path: "rel-only",
  });
  assert.ok(
    Object.keys(env).every((k) => !k.toUpperCase().startsWith("GIT_")),
    "every case variant of GIT_* must be stripped",
  );
  assert.equal(env.HOME, "keep", "unrelated variables survive");
  assert.ok(env.PATH.split(path.delimiter).includes(outside), "absolute outside entry kept");
  assert.ok(!env.PATH.split(path.delimiter).includes("rel-bin"), "relative entry dropped");
  assert.equal(env.Path, "", "every case variant of PATH is sanitized");
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

// ---------------------------------------------------------------------------
// Integration: real git repo — numstat net magnitude, binary, rename
// ---------------------------------------------------------------------------

{
  const tmpRepo = fs.mkdtempSync(path.join(os.tmpdir(), "stop-review-gate-git-"));
  try {
    const git = (...args) =>
      execFileSync("git", ["-C", tmpRepo, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });

    git("init", "-q");
    git("config", "user.email", "test@example.com");
    git("config", "user.name", "Test");

    const filePath = path.join(tmpRepo, "file.txt");
    fs.writeFileSync(filePath, Array.from({ length: 10 }, (_, i) => `line ${i}\n`).join(""));
    git("add", "file.txt");
    git("commit", "-q", "-m", "init");

    // Stage 5 new lines (staged shortstat vs HEAD: +5/-0), then in the
    // working tree revert those same 5 lines and add one unrelated line
    // (unstaged shortstat vs index: +1/-5). True net vs HEAD is a single
    // insertion (churn 1); the old sum-of-two-shortstats approach would have
    // reported 5 + 6 = 11 — proving the two must not be added together.
    const original = fs.readFileSync(filePath, "utf8");
    const withAdds = original + Array.from({ length: 5 }, (_, i) => `new ${i}\n`).join("");
    fs.writeFileSync(filePath, withAdds);
    git("add", "file.txt");
    fs.writeFileSync(filePath, `${original}extra\n`);

    const numstatRaw = git("diff", "--numstat", "-z", "HEAD", "--");
    const records = parseNumstatZ(numstatRaw);
    assert.equal(records.length, 1);
    assert.equal(
      records[0].added + records[0].deleted,
      1,
      "net tracked lines vs HEAD must reflect the true net churn, not the sum of two shortstats",
    );

    // Binary file, real git-detected.
    fs.writeFileSync(path.join(tmpRepo, "bin.dat"), Buffer.from([0, 1, 2, 0, 3, 4]));
    git("add", "bin.dat");
    const binaryNumstat = parseNumstatZ(git("diff", "--numstat", "-z", "--cached"));
    const binaryRecord = binaryNumstat.find((r) => r.paths.includes("bin.dat"));
    assert.ok(binaryRecord, "binary file must appear in numstat output");
    assert.equal(binaryRecord.binary, true);
    git("commit", "-q", "-m", "add binary");

    // Rename, real git-detected.
    git("mv", "file.txt", "renamed.txt");
    const renameNumstat = parseNumstatZ(git("diff", "--numstat", "-z", "-M", "--cached"));
    const renameRecord = renameNumstat.find((r) => r.paths.includes("renamed.txt"));
    assert.ok(renameRecord, "git-detected rename must appear in numstat output");
    assert.ok(renameRecord.paths.includes("file.txt"), "rename record must carry the old path too");

  } finally {
    fs.rmSync(tmpRepo, { recursive: true, force: true });
  }
}

// ---------------------------------------------------------------------------
// Integration: end-to-end hook run — exact cancellation must not bypass the
// gate, and a staged new top-level module must trigger architecture.
// ---------------------------------------------------------------------------

{
  const hookPath = fileURLToPath(new URL("./stop-review-gate.mjs", import.meta.url));
  const runHookIn = (repoDir) =>
    execFileSync(process.execPath, [hookPath], {
      encoding: "utf8",
      input: "{}",
      env: { ...process.env, CLAUDE_PROJECT_DIR: repoDir },
    }).trim();

  const tmpRepo = fs.mkdtempSync(path.join(os.tmpdir(), "stop-review-gate-e2e-"));
  try {
    const git = (...args) =>
      execFileSync("git", ["-C", tmpRepo, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    git("init", "-q");
    git("config", "user.email", "test@example.com");
    git("config", "user.name", "Test");
    fs.mkdirSync(path.join(tmpRepo, "src", "auth"), { recursive: true });
    const authFile = path.join(tmpRepo, "src", "auth", "session.ts");
    fs.writeFileSync(authFile, "export const a = 1;\n");
    git("add", ".");
    git("commit", "-q", "-m", "init");

    // Stage a security-path change, then restore the worktree to HEAD: the
    // net numstat is empty (`MM` status) but committing would still ship the
    // staged change, so the gate must block — never route `none`.
    fs.writeFileSync(authFile, "export const a = 1;\nexport const b = 2;\n");
    git("add", "src/auth/session.ts");
    fs.writeFileSync(authFile, "export const a = 1;\n");
    const cancelOut = runHookIn(tmpRepo);
    assert.match(cancelOut, /"decision":"block"/, "exact cancellation must not bypass the gate");
    assert.match(cancelOut, /targeted_security/);
    assert.doesNotMatch(cancelOut, /session\.ts/, "hook output never leaks paths");

    // Reset, then stage a small new top-level module: the new-module boundary
    // must come from the HEAD tree, not the index.
    git("reset", "-q", "--hard");
    fs.mkdirSync(path.join(tmpRepo, "new-module"));
    fs.writeFileSync(path.join(tmpRepo, "new-module", "index.ts"), "export const m = 1;\n");
    git("add", "new-module/index.ts");
    const stagedModuleOut = runHookIn(tmpRepo);
    assert.match(
      stagedModuleOut,
      /targeted_architecture/,
      "a staged new top-level module triggers architecture routing",
    );

    // Hostile repository config cannot disable the hook's fixed rename
    // detection or make status and numstat count one pair as two files.
    git("reset", "-q", "--hard");
    fs.rmSync(path.join(tmpRepo, "new-module"), { recursive: true, force: true });
    git("config", "status.renames", "false");
    git("config", "diff.renames", "false");
    git("config", "status.renameLimit", "1");
    git("config", "diff.renameLimit", "1");
    git("mv", "src/auth/session.ts", "session.ts");
    const pinnedRenameOut = runHookIn(tmpRepo);
    assert.match(pinnedRenameOut, /targeted_security/);
    assert.match(pinnedRenameOut, /files=1(?:\D|$)/, "one rename pair must count as one file");
  } finally {
    fs.rmSync(tmpRepo, { recursive: true, force: true });
  }
}

console.log("stop-review-gate self-test passed");
