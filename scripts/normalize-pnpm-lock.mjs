import { spawnSync } from "node:child_process";
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
    if (normalizeStagedLockfile()) {
      console.log("Removed tarball metadata from the staged pnpm lockfile.");
    }
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Lockfile normalization failed.",
    );
    process.exitCode = 1;
  }
}
