# Modernization Plan

This plan contains only open work. Each step requires explicit approval before implementation. Approval of one step does not authorize later steps.

## Direction

- Keep the product a static, client-side application hosted on GitHub Pages.
- Adopt pnpm and Vite for reproducible dependencies, local development, testing, bundling, and optimized static output.
- Keep the runtime in plain HTML, CSS, and JavaScript. Add no runtime UI framework without measured need and separate approval.
- Preserve local-first storage and existing snippet export/import compatibility unless an approved migration includes backward-compatibility coverage.

## Priorities

| Priority | Work                                                        | Impact | Effort | Step       |
| -------- | ----------------------------------------------------------- | ------ | ------ | ---------- |
| Orange   | Complete documentation, metadata, and release validation    | High   | Medium | 7          |
| Green    | Complete offline behavior if justified by a separate review | Medium | Medium | 7 or later |

## Step 7: CI, Deployment, And Documentation

**Scope:** Make validated static output the only deployable artifact and refresh public documentation.

- Decide whether path filters can be added without skipping deploy-relevant changes.
- Refresh README setup, usage, architecture, browser support, screenshots, and contribution guidance.
- Align manifest, version display, release notes, and documented hosting behavior.
- Run the `release-validation` skill across dependency policy, workflow pins, static output, documentation, and browser checks; present residual risks before requesting deployment or release approval.

**Approval gate:** Review the complete release-ready diff and validation report. Deployment, tagging, and release remain separately approval-gated.
