import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  normalizeLockfile,
  normalizeStagedLockfile,
  normalizeTarballUrl,
} from "../scripts/normalize-pnpm-lock.mjs";

const canonicalTarball =
  "https://registry.npmjs.org/example/-/example-1.0.0.tgz";
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

afterEach(() => {
  for (const directory of temporaryRepositories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe("lockfile URL normalization", () => {
  it("leaves canonical public URLs unchanged", () => {
    const content = lockfile(canonicalTarball);
    expect(normalizeLockfile(content)).toBe(content);
  });

  it("normalizes noncanonical public registry URLs", () => {
    expect(
      normalizeTarballUrl(
        "http://registry.yarnpkg.com/example/-/example-1.0.0.tgz",
      ),
    ).toBe(canonicalTarball);
  });

  it("normalizes Microsoft proxy URLs", () => {
    expect(normalizeTarballUrl(proxyTarball)).toBe(canonicalTarball);
  });

  it("normalizes scoped proxy package paths", () => {
    const azureProxyHost = ["pkgs", "dev", "azure", "com"].join(".");
    const proxy = `https://${azureProxyHost}/example/project/_packaging/npm/npm/registry/%40scope%2Fpackage/-/package-1.0.0.tgz`;
    expect(normalizeTarballUrl(proxy)).toBe(
      "https://registry.npmjs.org/@scope/package/-/package-1.0.0.tgz",
    );
  });

  it("rejects unknown private registries without printing their URL", () => {
    expect(() =>
      normalizeTarballUrl(
        "https://packages.example.test/npm/example-1.0.0.tgz",
      ),
    ).toThrow("outside the public npm registry policy");
  });
});

describe("staged lockfile normalization", () => {
  it("updates only the index when the lockfile is staged", () => {
    const directory = createRepository();
    const path = join(directory, "pnpm-lock.yaml");
    const canonical = lockfile(canonicalTarball);
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
    const canonical = lockfile(canonicalTarball);
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
