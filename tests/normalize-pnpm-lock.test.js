import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  normalizeLockfile,
  normalizeStagedLockfile,
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
