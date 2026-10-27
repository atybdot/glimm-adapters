#!/usr/bin/env node
// Release helper for glimm-adapters.
// Verify -> bump -> changelog -> commit -> tag -> push.
// CI publishes to npm and creates the GitHub release from CHANGELOG.md, so
// there is one release writer and it runs only after the default-branch guard.
//
// Usage:
//   pnpm publish:release -- patch              # 0.1.0 -> 0.1.1
//   pnpm publish:release -- minor              # 0.1.0 -> 0.2.0
//   pnpm publish:release -- major              # 0.1.0 -> 1.0.0
//   pnpm publish:release -- --version=0.2.0
//   pnpm publish:release -- --dry-run patch    # print the plan, write nothing
//
// Changelog:
//   Write `release-notes/<version>.md` with a full `## …` section to curate a
//   release. Without it, conventional commits since the last release tag are
//   grouped into Added / Improved / Fixed / Performance / Internal.
//
// Environment:
//   GIT_AUTHOR_DATE, GIT_COMMITTER_DATE  forwarded to the release commit
//   SKIP_CHECKS=1                        skip lint/format/typecheck/test/build
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pkgName = "glimm-adapters";
const pkgDir = join(root, "packages", pkgName);
const pkgPath = join(pkgDir, "package.json");
const changelogPath = join(pkgDir, "CHANGELOG.md");
const releaseNotesDir = join(root, "release-notes");
const lockPath = join(root, "pnpm-lock.yaml");

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const skipChecks = process.env.SKIP_CHECKS === "1" || args.includes("--skip-checks");
const bumps = args.filter((a) => ["patch", "minor", "major"].includes(a));
const bump = bumps[0];
const versionFlag =
  args.find((a) => a.startsWith("--version="))?.slice("--version=".length) ??
  (args.includes("--version") ? args[args.indexOf("--version") + 1] : undefined);

const usage = "Usage: pnpm publish:release -- [patch|minor|major|--version x.y.z] [--dry-run]";

function fail(message) {
  console.error(`error: ${message}`);
  process.exit(1);
}

// Run a command from the repo root with an argv array. No shell, so nothing in
// a version string or commit message can be re-parsed as a command.
function run(cmd, cmdArgs) {
  console.log(`$ ${[cmd, ...cmdArgs].join(" ")}`);
  execFileSync(cmd, cmdArgs, { cwd: root, stdio: "inherit", env: process.env });
}

// Same, but return trimmed stdout. `allowFail` turns a non-zero exit into "".
function capture(cmd, cmdArgs, { allowFail = false } = {}) {
  try {
    return execFileSync(cmd, cmdArgs, {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      env: process.env,
    }).trim();
  } catch (err) {
    if (allowFail) return "";
    throw err;
  }
}

function bumpVersion(current, kind) {
  const m = /^(\d+)\.(\d+)\.(\d+)(?:-[0-9A-Za-z.-]+)?$/.exec(current);
  if (!m) throw new Error(`cannot bump non-semver version: ${current}`);
  const [major, minor, patch] = [Number(m[1]), Number(m[2]), Number(m[3])];
  if (kind === "major") return `${major + 1}.0.0`;
  if (kind === "minor") return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}

function semver(v) {
  const m = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/.exec(v);
  return m ? { core: [Number(m[1]), Number(m[2]), Number(m[3])], pre: m[4] ?? null } : null;
}

function comparePrerelease(a, b) {
  const x = a.split(".");
  const y = b.split(".");
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    if (x[i] === undefined) return -1;
    if (y[i] === undefined) return 1;
    const xNumeric = /^\d+$/.test(x[i]);
    const yNumeric = /^\d+$/.test(y[i]);
    if (xNumeric && yNumeric) {
      const delta = Number(x[i]) - Number(y[i]);
      if (delta !== 0) return delta;
    } else if (xNumeric) {
      return -1;
    } else if (yNumeric) {
      return 1;
    } else if (x[i] !== y[i]) {
      return x[i] > y[i] ? 1 : -1;
    }
  }
  return 0;
}

function isGreater(a, b) {
  const x = semver(a);
  const y = semver(b);
  if (!x || !y) return false;
  for (let i = 0; i < 3; i++) {
    if (x.core[i] !== y.core[i]) return x.core[i] > y.core[i];
  }
  // Same core: a stable release beats any prerelease; two prereleases compare
  // identifier by identifier (1.0.0-beta.2 > 1.0.0-beta.1).
  if (x.pre === null) return y.pre !== null;
  if (y.pre === null) return false;
  return comparePrerelease(x.pre, y.pre) > 0;
}

if (args.includes("--help") || args.includes("-h")) {
  console.log(usage);
  process.exit(0);
}
if (!versionFlag && !bump) fail(usage);
if (bumps.length > 1) fail(`pass one bump, not ${bumps.join(" + ")}`);
if (versionFlag && bump) fail("pass either a bump (patch|minor|major) or --version, not both");
if (versionFlag && !semver(versionFlag)) fail(`not a semver version: ${versionFlag}`);

// --- resolve the target version --------------------------------------------

const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
const current = pkg.version;
const next = versionFlag ?? bumpVersion(current, bump);
const tag = `release-v${next}`;

if (!isGreater(next, current)) fail(`${next} is not greater than the current version ${current}`);
if (capture("git", ["tag", "--list", tag])) fail(`tag ${tag} already exists`);

// --- preflight -------------------------------------------------------------

const branch = capture("git", ["branch", "--show-current"]);
if (!capture("git", ["remote"], { allowFail: true }).split("\n").includes("origin")) {
  fail("no git remote named origin");
}
if (!dryRun) {
  if (!branch) fail("detached HEAD: check out the default branch before releasing");
  const defaultRef = capture("git", ["symbolic-ref", "--short", "refs/remotes/origin/HEAD"], {
    allowFail: true,
  });
  const defaultBranch = defaultRef.replace(/^origin\//, "");
  if (defaultBranch && branch !== defaultBranch) {
    fail(
      `release from ${defaultBranch}, not ${branch}: merge first, then release from ${defaultBranch}`,
    );
  }
  const dirty = capture("git", ["status", "--porcelain", "--untracked-files=no"]);
  if (dirty) fail(`working tree has uncommitted changes, commit or stash them first:\n${dirty}`);
}

// --- checks ----------------------------------------------------------------

if (skipChecks) {
  console.log("skipping checks (SKIP_CHECKS set)");
} else {
  run("pnpm", ["lint"]);
  run("pnpm", ["format:check"]);
  run("pnpm", ["typecheck"]);
  run("pnpm", ["--filter", pkgName, "test"]);
  run("pnpm", ["--filter", pkgName, "build"]);
}

console.log(`version ${current} -> ${next} (${tag})`);

// --- changelog entry from commits since the last release tag ---------------

const lastTag = capture(
  "git",
  ["describe", "--tags", "--match", "release-*", "--abbrev=0", "HEAD"],
  { allowFail: true },
);
const range = lastTag ? `${lastTag}..HEAD` : "HEAD";
const log = capture(
  "git",
  ["log", range, "--no-merges", "--pretty=format:%s", "--", relative(root, pkgDir)],
  { allowFail: true },
)
  .split("\n")
  .map((line) => line.trim())
  // Release commits only bump the version and rewrite this file. They are not
  // changes to the package.
  .filter((line) => line && !line.startsWith("chore(release)"))
  .join("\n");
const date = new Date().toISOString().slice(0, 10);

const GROUP_ORDER = ["Added", "Improved", "Fixed", "Performance", "Changed", "Internal"];

const GROUP_BY_TYPE = {
  feat: "Added",
  refactor: "Improved",
  fix: "Fixed",
  perf: "Performance",
  revert: "Fixed",
  docs: "Internal",
  style: "Internal",
  test: "Internal",
  build: "Internal",
  ci: "Internal",
  chore: "Internal",
};

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Commit subjects are untrusted input. Escape HTML and inline Markdown so a
 * subject like `<img src=x>` or `[text](url)` cannot inject markup into the
 * changelog or the GitHub release body. Parentheses stay readable: escape the
 * brackets, which is what makes a link, not the URL in them.
 */
function escapeMarkdown(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/([\\`*_[\]~|])/g, "\\$1");
}

/** `feat(web): add a thing` -> { group: "Added", text: "Add a thing" }. */
function readSubject(subject) {
  const m = /^([a-z]+)(?:\(([^)]+)\))?(!)?:\s*(.+)$/.exec(subject);
  if (!m) return { group: "Changed", text: escapeMarkdown(capitalize(subject)) };
  return {
    group: GROUP_BY_TYPE[m[1]] ?? "Changed",
    text: `${escapeMarkdown(capitalize(m[4]))}${m[3] ? " (breaking)" : ""}`,
  };
}

function generatedEntry(version, day, commitLog) {
  const subjects = commitLog
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const groups = new Map();
  for (const subject of subjects) {
    const { group, text } = readSubject(subject);
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group).push(text);
  }

  // The first feature names the release; otherwise the first commit does.
  const lead = subjects.find((subject) => /^feat(?:\(|!|:)/.test(subject)) ?? subjects[0];
  const title = readSubject(lead).text.replace(/\.$/, "");

  const sections = GROUP_ORDER.filter((group) => groups.has(group)).map((group) => {
    const items = groups.get(group).map((text) => `- ${text}`);
    return `### ${group}\n\n${items.join("\n")}\n`;
  });

  return `## ${version} (${day}) · ${title}\n\n${sections.join("\n")}`;
}

const curatedPath = join(releaseNotesDir, `${next}.md`);
const hasCurated = existsSync(curatedPath);
if (!log && !hasCurated) {
  fail(
    `no commits since ${lastTag || "the first commit"}; write release-notes/${next}.md to release anyway`,
  );
}
const entry = hasCurated
  ? readFileSync(curatedPath, "utf8").trim()
  : generatedEntry(next, date, log).trim();

// A `## 0.2.0 (` heading pins the entry to this release. The old check
// accepted any "## ", which let a stale curated file ship under the new
// version.
if (!entry.startsWith(`## ${next} (`)) {
  const source = hasCurated ? relative(root, curatedPath) : "the generated changelog entry";
  fail(`${source} must start with a "## ${next} (YYYY-MM-DD)" heading`);
}

const header = "# Changelog\n\n";
const prev = existsSync(changelogPath) ? readFileSync(changelogPath, "utf8") : header;
if (prev.includes(`## ${next} (`)) fail(`CHANGELOG.md already has an entry for ${next}`);

// Keep the preamble and put the new entry above the rest, so the file reads
// newest first.
const firstEntry = prev.search(/^## /m);
const preamble = (firstEntry === -1 ? prev : prev.slice(0, firstEntry)).trimEnd();
const older = firstEntry === -1 ? "" : prev.slice(firstEntry).trimEnd();
const nextChangelog = [preamble || header.trimEnd(), entry, older].filter(Boolean).join("\n\n");

if (dryRun) {
  console.log(`\n--- CHANGELOG.md entry for ${next} ---\n`);
  console.log(entry);
  console.log("\n--- end entry ---\n");
  console.log(`dry-run complete. Would create commit and tag ${tag}.`);
  process.exit(0);
}

// --- write, format-check, then commit --------------------------------------

const previousPkg = readFileSync(pkgPath, "utf8");
const previousChangelog = existsSync(changelogPath) ? readFileSync(changelogPath, "utf8") : null;
const relPkg = relative(root, pkgPath);
const relChangelog = relative(root, changelogPath);

try {
  pkg.version = next;
  writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
  writeFileSync(changelogPath, `${nextChangelog}\n`);
  // Format the generated/curated entry before the tag exists. A failing
  // format check used to happen in CI after the tag was already pushed.
  run("pnpm", ["exec", "oxfmt", "--write", relPkg, relChangelog]);
  run("pnpm", ["exec", "oxfmt", "--check", relPkg, relChangelog]);
} catch (error) {
  writeFileSync(pkgPath, previousPkg);
  if (previousChangelog !== null) writeFileSync(changelogPath, previousChangelog);
  else rmSync(changelogPath, { force: true });
  fail(
    `format check failed after writing the release files; reverted. ${
      error instanceof Error ? error.message : String(error)
    }`,
  );
}

// --- commit, tag, push -----------------------------------------------------

const files = [pkgPath, changelogPath, lockPath].filter(existsSync).map((p) => relative(root, p));
run("git", ["add", "--", ...files]);
const staged = capture("git", ["diff", "--cached", "--name-only"]);
if (staged) run("git", ["commit", "-m", `chore(release): ${pkgName} v${next}`]);
else console.log("nothing staged to commit, tagging the current HEAD");

run("git", ["tag", "-a", tag, "-m", `${pkgName} v${next}`]);
run("git", ["push", "origin", branch]);
run("git", ["push", "origin", tag]);
console.log(`done: ${tag} pushed. CI publishes to npm and creates the GitHub release.`);
