---
name: "Automation And Dependencies"
description: "Use when changing pnpm, Vite, package manifests, lockfiles, dependency policy, git hooks, scripts, Dependabot, CI, or GitHub Pages workflows."
applyTo: "package.json, pnpm-workspace.yaml, pnpm-lock.yaml, .npmrc, .githooks/**, scripts/**, .github/workflows/**, .github/dependabot.yml"
---

# Automation And Dependency Guidelines

- Use the installed pnpm version and update every repository pnpm-version reference together when the declared version differs.
- Configure `minimumReleaseAge: 10080` and reject packages whose publication age cannot be established unless an explicit reviewed exception exists.
- Give npm and GitHub Actions Dependabot updates a seven-day cooldown and group compatible development updates.
- Configure pnpm not to include tarball URLs and remove any `tarball` metadata that package metadata or machine configuration preserves in the committed lockfile. Preserve unrelated staged and unstaged lockfile edits when the hook removes that metadata.
- Run the working-tree lockfile normalizer automatically after installs and enforce registry cleanliness through the repository check command; keep pre-commit normalization staged-only.
- Keep Microsoft proxy registry settings in untracked user or machine configuration. Never write credentials or private registry URLs to tracked files or logs.
- Install repository hooks through a pnpm script that configures `core.hooksPath`; keep hooks fast, deterministic, cross-platform where practical, and covered by focused tests.
- Pin every external GitHub Action to a full commit SHA with a trailing release-tag comment. Add explicit job timeouts and least-privilege permissions.
- Build and validate the Vite output before GitHub Pages deployment and publish only the generated static output directory.
- Run the narrowest policy check first, then the repository check command. Use `release-validation` before calling automation or dependency work complete.
