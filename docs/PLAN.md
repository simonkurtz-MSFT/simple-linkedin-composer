# Modernization Plan

This plan contains only open work. Each step requires explicit approval before implementation. Approval of one step does not authorize later steps.

## Direction

- Keep the product a static, client-side application hosted on GitHub Pages.
- Adopt pnpm and Vite for reproducible dependencies, local development, testing, bundling, and optimized static output.
- Keep the runtime in plain HTML, CSS, and JavaScript. Add no runtime UI framework without measured need and separate approval.
- Preserve local-first storage and existing snippet export/import compatibility unless an approved migration includes backward-compatibility coverage.

## Priorities

| Priority | Work                                                          | Impact | Effort | Step       |
| -------- | ------------------------------------------------------------- | ------ | ------ | ---------- |
| Green    | Complete offline behavior if justified by a separate review   | Medium | Medium | 9 or later |
