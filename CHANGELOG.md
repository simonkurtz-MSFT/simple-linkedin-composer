# Changelog

Notable changes to Simple LinkedIn Composer are documented here.

## Unreleased

## 2.1.0 - 2026-08-21

### Appearance

- Added system, light, and dark appearance settings with local persistence.
- Updated the responsive composer palette and controls for accessible light, dark, high-contrast, and reduced-motion states.
- Collapsed the hashtag panel by default to keep the composer workspace balanced across desktop and mobile layouts.

### Theme coverage

- Added unit and desktop/mobile browser coverage for theme normalization, system preferences, appearance overrides, and accessibility.

## 2.0.0 - 2026-08-20

### Runtime modernization

- Replaced jQuery, DataTables, and Toastr with standards-based modules for snippet tables, notifications, editor behavior, hashtags, accordions, and file transfer.
- Reduced the production dependency set to Quill and the emoji picker packages.
- Added working-tree normalization and CI enforcement to keep machine registry URLs out of `pnpm-lock.yaml`.

### Validation

- Added unit and desktop/mobile browser coverage for notification semantics and snippet sorting, title search, paging, counts, and empty states.

### Security remediation

- Pinned Quill to `2.0.2` to avoid CVE-2025-15056 in the `2.0.3` HTML export path.

## 1.7.0 - 2026-08-19

### Added

- Responsive desktop and mobile composer workspace.
- Local snippet search, hashtag reuse, import/export validation, and destructive-action confirmations.
- Unit coverage for post conversion, snippets, hashtags, and lockfile normalization.
- Desktop/mobile Playwright workflows with accessibility, keyboard, responsive, forced-color, reduced-motion, resize, console, request, and visual checks.

### Changed

- Adopted pinned Node.js, pnpm, Vite, and reviewed browser dependencies.
- Bundled runtime dependencies into the static production artifact.
- Updated privacy language to distinguish local composer content from anonymous aggregate site analytics.
- Hardened GitHub Pages deployment to validate and publish only generated `dist/` output.

### Security

- Validate imported snippet data and render persisted user-controlled values as text.
- Enforce seven-day dependency cooldowns, immutable GitHub Action pins, frozen installs, and registry-clean lockfiles.