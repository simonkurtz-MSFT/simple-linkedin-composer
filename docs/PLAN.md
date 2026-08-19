# Modernization Plan

This plan contains only open work. Each step requires explicit approval before implementation. Approval of one step does not authorize later steps.

## Direction

- Keep the product a static, client-side application hosted on GitHub Pages.
- Adopt pnpm and Vite for reproducible dependencies, local development, testing, bundling, and optimized static output.
- Keep the runtime in plain HTML, CSS, and JavaScript. Add no runtime UI framework without measured need and separate approval.
- Preserve local-first storage and existing snippet export/import compatibility unless an approved migration includes backward-compatibility coverage.

## Priorities

| Priority | Work                                                                                             | Impact | Effort | Step       |
| -------- | ------------------------------------------------------------------------------------------------ | ------ | ------ | ---------- |
| Red      | Remove unsafe rendering of imported or persisted values                                          | High   | Medium | 4          |
| Red      | Reconcile privacy claims with runtime GitHub API and CDN requests                                | High   | Medium | 4          |
| Red      | Add reproducible dependencies, seven-day cooldowns, immutable workflow pins, and registry policy | High   | Medium | 2-3, 7     |
| Orange   | Add focused tests around post conversion, storage, and import/export behavior                    | High   | Medium | 4          |
| Orange   | Replace the fixed-width interface with an accessible responsive composer workspace               | High   | High   | 5-6        |
| Orange   | Build and validate production output before GitHub Pages deployment                              | High   | Medium | 7          |
| Green    | Complete installable application metadata and offline behavior if justified                      | Medium | Medium | 7 or later |

## Step 2: Toolchain And Supply Chain

**Scope:** Introduce development dependencies and policy without changing application behavior or design.

- Add a pinned Node.js and pnpm baseline, `package.json`, `pnpm-workspace.yaml`, and pnpm lockfile.
- Add Vite for local development and production builds while retaining plain HTML, CSS, and JavaScript.
- Move browser libraries from runtime CDN references to reviewed pnpm dependencies bundled into production output.
- Add formatting, JavaScript/CSS/HTML/Markdown linting, unit-test, build, and aggregate check commands.
- Configure pnpm minimum release age to seven days and fail when publication age is unavailable.
- Add npm and GitHub Actions Dependabot entries with seven-day cooldowns.
- Pin all selected versions to cooled-down releases and run a clean frozen install and audit.

**Approval gate:** Review dependency choices, exact versions, scripts, generated lockfile, and build-output boundary.

## Step 3: Registry And Git Hooks

**Scope:** Keep corporate install routing separate from public repository artifacts.

- Configure pnpm to omit tarball URLs and add an installed repository pre-commit hook that removes any preserved `tarball` metadata from the staged pnpm lockfile.
- Preserve unrelated staged and unstaged lockfile changes during normalization.
- Add focused tests for absent, public, proxy-style, inline, block-style, staged-only, and mixed-index tarball cases.
- Document that Microsoft proxy registries belong only in untracked user or machine configuration.
- Verify tracked files contain no proxy credentials, tokens, or private feed URLs.

**Approval gate:** Review hook installation, staged-file mutation behavior, test evidence, and registry documentation.

## Step 4: Behavioral Hardening

**Scope:** Secure and make core behavior testable before visual redesign.

- Add characterization tests for Unicode formatting, list conversion, link preservation, clipboard output, snippets, hashtags, and import/export deduplication.
- Extract post conversion, storage, validation, and import/export logic into cohesive testable modules.
- Validate imported JSON, constrain accepted keys and values, and render every user-controlled value as text.
- Tolerate malformed or legacy local-storage entries without discarding unrelated valid data.
- Remove post-content and snippet-content logging.
- Decide whether to remove runtime GitHub statistics and external CDNs or revise the privacy contract to disclose those requests accurately.

**Approval gate:** Review compatibility tests, accepted import schema, migration behavior, and privacy decision.

## Step 5: UI Modernization

**Scope:** Redesign the actual composition workspace without adding a runtime framework.

- Make the editor and primary post actions the first-screen focus.
- Create a responsive layout for desktop, split-screen, tablet, and mobile use.
- Organize snippets and hashtags as efficient work surfaces with clear search, sorting, empty states, and destructive-action confirmation.
- Use the existing logo as the visual anchor and establish a purposeful multi-color token system with WCAG AA states.
- Replace text-heavy controls with familiar icons where appropriate, while retaining accessible names and tooltips.
- Modernize dialogs, notifications, editor tools, spacing, typography, and visual hierarchy.
- Preserve all characterized composer, storage, import/export, and LinkedIn-navigation behavior.

**Approval gate:** Review the implemented visual direction in headless desktop and mobile screenshots before accessibility finalization.

## Step 6: Accessibility And Browser Validation

**Scope:** Validate the complete user experience rather than relying on appearance.

- Ensure semantic structure, keyboard operation, focus management, expanded state, labels, status announcements, and destructive confirmations.
- Verify WCAG 2.2 AA contrast for light, dark if introduced, high-contrast, hover, focus, active, selected, and disabled states.
- Support reduced motion and robust zoom/text resizing.
- Add headless Playwright workflows covering primary composer, snippet, hashtag, import/export, and responsive paths.
- Run automated accessibility checks, contrast checks, screenshots, console checks, and failed-request checks at representative viewports.

**Approval gate:** Review accessibility results, browser evidence, screenshots, and remaining exceptions.

## Step 7: CI, Deployment, And Documentation

**Scope:** Make validated static output the only deployable artifact and refresh public documentation.

- Pin every external Action to a full commit SHA with a release-tag comment and seven-day age verification.
- Add explicit timeouts, least-privilege permissions, concurrency, and appropriate path filters.
- Run frozen install, policy checks, lint, tests, production build, and focused browser checks before deployment.
- Upload only Vite's generated static output to GitHub Pages.
- Refresh README setup, usage, privacy, architecture, browser support, screenshots, and contribution guidance.
- Align manifest, version display, release notes, and documented hosting behavior.
- Run the `release-validation` skill and present residual risks before requesting deployment or release approval.

**Approval gate:** Review the complete release-ready diff and validation report. Deployment, tagging, and release remain separately approval-gated.
