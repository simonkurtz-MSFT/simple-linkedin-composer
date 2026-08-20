import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const lockfilePath = "pnpm-lock.yaml";
const inlineTarballPattern =
  /(?:,\s*tarball:\s*[^,}\r\n]+)|(?:tarball:\s*[^,}\r\n]+,\s*)/gu;
const blockTarballPattern = /^\s+tarball:\s*.*(?:\r?\n|$)/gmu;

const runGit = (arguments_, { cwd = process.cwd(), input } = {}) =>
  spawnSync("git", arguments_, {
    cwd,
    encoding: "utf8",
    input,
  });

export const normalizeLockfile = (content) =>
  content.replace(inlineTarballPattern, "").replace(blockTarballPattern, "");

export const normalizeWorkingLockfile = ({ cwd = process.cwd() } = {}) => {
  const path = resolve(cwd, lockfilePath);
  const content = readFileSync(path, "utf8");
  const normalized = normalizeLockfile(content);
  if (normalized === content) {
    return false;
  }

  writeFileSync(path, normalized);
  return true;
};

export const isWorkingLockfileNormalized = ({ cwd = process.cwd() } = {}) => {
  const content = readFileSync(resolve(cwd, lockfilePath), "utf8");
  return normalizeLockfile(content) === content;
};

export const normalizeStagedLockfile = ({ cwd = process.cwd() } = {}) => {
  const stagedDiff = runGit(
    ["diff", "--cached", "--quiet", "--diff-filter=ACMR", "--", lockfilePath],
    { cwd },
  );

  if (stagedDiff.status === 0) {
    return false;
  }

  if (stagedDiff.status !== 1) {
    throw new Error("Unable to inspect the staged pnpm lockfile.");
  }

  const stagedFile = runGit(["show", `:${lockfilePath}`], { cwd });
  if (stagedFile.status !== 0) {
    throw new Error("Unable to read the staged pnpm lockfile.");
  }

  const normalized = normalizeLockfile(stagedFile.stdout);
  if (normalized === stagedFile.stdout) {
    return false;
  }

  const indexEntry = runGit(["ls-files", "--stage", "--", lockfilePath], {
    cwd,
  });
  const mode = indexEntry.stdout.match(/^(\d+)\s/u)?.[1];
  if (indexEntry.status !== 0 || !mode) {
    throw new Error("Unable to determine the staged pnpm lockfile mode.");
  }

  const object = runGit(["hash-object", "-w", "--stdin"], {
    cwd,
    input: normalized,
  });
  const objectId = object.stdout.trim();
  if (object.status !== 0 || !objectId) {
    throw new Error("Unable to store the normalized pnpm lockfile.");
  }

  const update = runGit(
    ["update-index", "--cacheinfo", `${mode},${objectId},${lockfilePath}`],
    { cwd },
  );
  if (update.status !== 0) {
    throw new Error("Unable to update the staged pnpm lockfile.");
  }

  return true;
};

const isDirectRun =
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  try {
    const arguments_ = process.argv.slice(2);
    const supportedArguments = new Set(["--check", "--staged"]);
    if (
      arguments_.some((argument) => !supportedArguments.has(argument)) ||
      arguments_.length > 1
    ) {
      throw new Error("Usage: normalize-pnpm-lock.mjs [--check|--staged]");
    }

    if (arguments_.includes("--check")) {
      if (!isWorkingLockfileNormalized()) {
        throw new Error(
          "pnpm-lock.yaml contains registry tarball metadata. Run pnpm lockfile:normalize.",
        );
      }
      process.exit(0);
    }

    const stagedOnly = arguments_.includes("--staged");
    const changed = stagedOnly
      ? normalizeStagedLockfile()
      : normalizeWorkingLockfile();
    if (changed) {
      console.log(
        `Removed registry tarball metadata from the ${stagedOnly ? "staged" : "working"} pnpm lockfile.`,
      );
    }
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Lockfile normalization failed.",
    );
    process.exitCode = 1;
  }
}
