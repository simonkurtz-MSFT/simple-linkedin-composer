import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  isWorkingLockfileNormalized,
  normalizeLockfile,
  normalizeStagedLockfile,
  normalizeWorkingLockfile,
} from "../scripts/normalize-pnpm-lock.mjs";

const publicTarball = "https://registry.npmjs.org/example/-/example-1.0.0.tgz";
const visualStudioProxyHost = ["ms-feed-2", "pkgs", "visualstudio", "com"].join(
  ".",
);
const proxyRegistryPath = [
  "1es-public",
  "_packaging",
  "npm-public",
  "npm",
  "registry",
].join("/");
const proxyTarball = `https://${visualStudioProxyHost}/${proxyRegistryPath}/example/-/example-1.0.0.tgz`;
const temporaryRepositories = [];
const normalizerPath = fileURLToPath(
  new URL("../scripts/normalize-pnpm-lock.mjs", import.meta.url),
);

const git = (directory, ...arguments_) =>
  execFileSync("git", arguments_, { cwd: directory, encoding: "utf8" });

const createRepository = () => {
  const directory = mkdtempSync(join(tmpdir(), "composer-lockfile-test-"));
  temporaryRepositories.push(directory);
  git(directory, "init", "--quiet");
  git(directory, "config", "user.email", "test@example.com");
  git(directory, "config", "user.name", "Lockfile Test");
  git(directory, "config", "core.autocrlf", "false");
  git(directory, "config", "commit.gpgsign", "false");
  return directory;
};

const lockfile = (tarball, suffix = "") =>
  `lockfileVersion: '9.0'\npackages:\n  example@1.0.0:\n    resolution: {integrity: sha512-test, tarball: ${tarball}}\n${suffix}`;
const lockfileWithoutTarball = (suffix = "") =>
  `lockfileVersion: '9.0'\npackages:\n  example@1.0.0:\n    resolution: {integrity: sha512-test}\n${suffix}`;

afterEach(() => {
  for (const directory of temporaryRepositories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe("lockfile tarball removal", () => {
  it("leaves lockfiles without tarball metadata unchanged", () => {
    const content = lockfileWithoutTarball();
    expect(normalizeLockfile(content)).toBe(content);
  });

  it("removes public registry tarball metadata", () => {
    expect(normalizeLockfile(lockfile(publicTarball))).toBe(
      lockfileWithoutTarball(),
    );
  });

  it("removes Microsoft proxy tarball metadata", () => {
    expect(normalizeLockfile(lockfile(proxyTarball))).toBe(
      lockfileWithoutTarball(),
    );
  });

  it("removes block-style tarball metadata", () => {
    const content =
      "lockfileVersion: '9.0'\npackages:\n  example@1.0.0:\n    resolution:\n      integrity: sha512-test\n      tarball: https://packages.example.test/example.tgz\n";
    expect(normalizeLockfile(content)).toBe(
      "lockfileVersion: '9.0'\npackages:\n  example@1.0.0:\n    resolution:\n      integrity: sha512-test\n",
    );
  });

  it("removes a leading inline tarball property", () => {
    const content =
      "    resolution: {tarball: https://packages.example.test/example.tgz, integrity: sha512-test}\n";
    expect(normalizeLockfile(content)).toBe(
      "    resolution: {integrity: sha512-test}\n",
    );
  });
});

describe("working lockfile normalization", () => {
  it("removes registry tarballs from the working lockfile", () => {
    const directory = createRepository();
    const path = join(directory, "pnpm-lock.yaml");
    writeFileSync(path, lockfile(proxyTarball));

    expect(isWorkingLockfileNormalized({ cwd: directory })).toBe(false);
    expect(normalizeWorkingLockfile({ cwd: directory })).toBe(true);
    expect(readFileSync(path, "utf8")).toBe(lockfileWithoutTarball());
    expect(isWorkingLockfileNormalized({ cwd: directory })).toBe(true);
    expect(normalizeWorkingLockfile({ cwd: directory })).toBe(false);
  });

  it("rejects registry tarballs in check mode without changing the file", () => {
    const directory = createRepository();
    const path = join(directory, "pnpm-lock.yaml");
    const proxy = lockfile(proxyTarball);
    writeFileSync(path, proxy);

    const rejected = spawnSync(process.execPath, [normalizerPath, "--check"], {
      cwd: directory,
      encoding: "utf8",
    });
    expect(rejected.status).toBe(1);
    expect(rejected.stderr).toContain("pnpm lockfile:normalize");
    expect(readFileSync(path, "utf8")).toBe(proxy);

    const normalized = spawnSync(process.execPath, [normalizerPath], {
      cwd: directory,
      encoding: "utf8",
    });
    const accepted = spawnSync(process.execPath, [normalizerPath, "--check"], {
      cwd: directory,
      encoding: "utf8",
    });
    expect(normalized.status).toBe(0);
    expect(accepted.status).toBe(0);
    expect(readFileSync(path, "utf8")).toBe(lockfileWithoutTarball());
  });

  it("does not alter a separately staged lockfile version", () => {
    const directory = createRepository();
    const path = join(directory, "pnpm-lock.yaml");
    const staged = lockfile(proxyTarball);
    const workingTree = lockfile(
      publicTarball,
      "# unrelated unstaged change\n",
    );
    writeFileSync(path, staged);
    git(directory, "add", "pnpm-lock.yaml");
    writeFileSync(path, workingTree);

    expect(normalizeWorkingLockfile({ cwd: directory })).toBe(true);
    expect(readFileSync(path, "utf8")).toBe(
      lockfileWithoutTarball("# unrelated unstaged change\n"),
    );
    expect(git(directory, "show", ":pnpm-lock.yaml")).toBe(staged);
  });
});

describe("staged lockfile normalization", () => {
  it("updates only the index when the lockfile is staged", () => {
    const directory = createRepository();
    const path = join(directory, "pnpm-lock.yaml");
    const canonical = lockfileWithoutTarball();
    const proxy = lockfile(proxyTarball);
    writeFileSync(path, canonical);
    git(directory, "add", "pnpm-lock.yaml");
    git(directory, "commit", "--quiet", "-m", "baseline");
    writeFileSync(path, proxy);
    git(directory, "add", "pnpm-lock.yaml");

    expect(normalizeStagedLockfile({ cwd: directory })).toBe(true);
    expect(git(directory, "show", ":pnpm-lock.yaml")).toBe(canonical);
    expect(readFileSync(path, "utf8")).toBe(proxy);
  });

  it("preserves mixed staged and unstaged lockfile content", () => {
    const directory = createRepository();
    const path = join(directory, "pnpm-lock.yaml");
    const canonical = lockfileWithoutTarball();
    const staged = lockfile(proxyTarball);
    const workingTree = lockfile(proxyTarball, "# unrelated unstaged change\n");
    writeFileSync(path, canonical);
    git(directory, "add", "pnpm-lock.yaml");
    git(directory, "commit", "--quiet", "-m", "baseline");
    writeFileSync(path, staged);
    git(directory, "add", "pnpm-lock.yaml");
    writeFileSync(path, workingTree);

    expect(normalizeStagedLockfile({ cwd: directory })).toBe(true);
    expect(git(directory, "show", ":pnpm-lock.yaml")).toBe(canonical);
    expect(readFileSync(path, "utf8")).toBe(workingTree);
  });
});
