import { chmod } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const gitDirectory = spawnSync("git", ["rev-parse", "--git-dir"], {
  cwd: repositoryRoot,
  stdio: "ignore",
});

if (gitDirectory.status === 0) {
  const configuration = spawnSync(
    "git",
    ["config", "--local", "core.hooksPath", ".githooks"],
    {
      cwd: repositoryRoot,
      stdio: "inherit",
    },
  );

  if (configuration.status !== 0) {
    throw new Error("Unable to configure the repository Git hooks path.");
  }

  await chmod(resolve(repositoryRoot, ".githooks", "pre-commit"), 0o755);
}
