---
name: release-validation
description: "Validate Simple LinkedIn Composer dependencies, seven-day cooldown, registry cleanliness, git hooks, workflow pins, static build output, GitHub Pages deployment, documentation, and release readiness."
argument-hint: "Describe the dependency, automation, or release change"
---

# Release Validation

Use this workflow after dependency, package-policy, hook, CI, deployment, documentation, or version changes.

## Procedure

1. Read `docs/PLAN.md`, the automation instructions, and the changed manifests, lockfiles, hooks, scripts, workflows, and documentation.
2. Confirm exact dependency and package-manager pins and verify each selected release has completed the seven-day cooldown, or document an explicit security exception.
3. Verify pnpm minimum-release-age enforcement and seven-day Dependabot cooldowns for npm and GitHub Actions.
4. Verify the committed lockfile contains no `tarball` metadata; scan tracked files for proxy URLs, credentials, tokens, and local registry configuration.
5. Test the pre-commit scrubber against absent, public, Microsoft-proxy-style, inline, block-style, staged-only, and mixed staged/unstaged tarball cases.
6. Verify external Actions use full 40-character SHAs with release comments, jobs have explicit timeouts, permissions are least privilege, and deployment publishes only built static output.
7. Run formatting, linting, unit tests, production build, dependency audit, and affected headless browser checks through repository scripts.
8. Inspect production output for expected assets and absence of source maps, local configuration, secrets, private URLs, and unrelated repository files.
9. Confirm README setup, privacy, screenshots, browser support, version metadata, and deployment behavior match the build.
10. Report commands, results, unavailable checks, exceptions, and residual risks. Do not publish, deploy, tag, or release without explicit approval.
