# Simple LinkedIn Composer Guidelines

## Source Of Truth

- Read `docs/PLAN.md` before architectural, dependency, automation, security, privacy, or user-experience changes.
- Treat its approval gates and acceptance criteria as requirements. Implement only the approved step.
- Keep this file and the nearest scoped instruction, skill, or agent current when project invariants or validation practices change.

## Product Boundaries

- Keep the application a static, client-side LinkedIn post composer deployable to GitHub Pages.
- Use pnpm and Vite for reproducible development, testing, bundling, and static production output. Do not introduce a runtime UI framework without measured need and explicit approval.
- Preserve local-first snippet storage and export/import compatibility unless an approved migration includes backward-compatibility tests.
- Never transmit post, snippet, preference, or local-storage content. Document every intentional runtime network request accurately.
- Treat imported files, local storage, URL-derived values, and remote responses as untrusted data. Validate structured data and render user-controlled values as text.

## Engineering Practices

- Prefer browser standards and small cohesive modules over new runtime dependencies.
- Preserve supported behavior while adding characterization tests before risky refactoring.
- Keep changes focused. Do not combine dependency, security, behavioral, and visual work across unapproved plan steps.
- Use descriptive names and straightforward control flow. Add comments only for non-obvious compatibility, security, accessibility, or lifecycle constraints.
- Use the narrowest relevant executable check after each substantive edit, then run broader affected checks when the change set is ready.

## Supply Chain

- Pin packages, package managers, development tools, and GitHub Actions to exact reviewed versions that have completed the seven-day release cooldown.
- Enforce the cooldown through pnpm minimum-release-age settings and Dependabot cooldowns. Security updates may bypass the waiting period when explicitly reviewed.
- Keep committed pnpm lockfiles free of `tarball` registry metadata. Microsoft proxy registries are allowed only through untracked user or machine configuration; never commit proxy credentials, tokens, or private feed URLs.
- Pin external GitHub Actions to full 40-character commit SHAs and retain the release tag in a trailing comment.
- Treat generated lockfiles as pnpm-owned output. Regenerate them with the repository-pinned pnpm version rather than editing or formatting them manually.

## Documentation And Releases

- Keep README setup, privacy, screenshots, browser support, version metadata, and deployment behavior aligned with the shipped application.
- Do not create tags, releases, deployments, or published artifacts without explicit user approval.
- Use the `ui-change` skill for user-interface work and `release-validation` for dependency, automation, or release-readiness changes.
