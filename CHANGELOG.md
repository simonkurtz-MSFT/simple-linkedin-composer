# Changelog

<!-- markdownlint-disable MD024 -->

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.1.0] - 2026-08-21

### Added

- Added system, light, and dark appearance settings with local persistence.
- Added unit and desktop/mobile browser coverage for theme normalization,
  system preferences, appearance overrides, and accessibility.

### Changed

- Updated the responsive composer palette and controls for accessible light,
  dark, high-contrast, and reduced-motion states.
- Collapsed the hashtag panel by default to keep the composer workspace balanced
  across desktop and mobile layouts.

## [2.0.0] - 2026-08-20

### Added

- Added unit and desktop/mobile browser coverage for notification semantics and
  snippet sorting, title search, paging, counts, and empty states.

### Changed

- Replaced jQuery, DataTables, and Toastr with standards-based modules for
  snippet tables, notifications, editor behavior, hashtags, accordions, and
  file transfer.
- Reduced the production dependency set to Quill and the emoji picker packages.
- Added working-tree normalization and CI enforcement to keep machine registry
  URLs out of `pnpm-lock.yaml`.

### Security

- Pinned Quill to `2.0.2` to avoid CVE-2025-15056 in the `2.0.3` HTML export
  path.

## [1.7.0] - 2025-04-15

### Added

- Added toast messages for better visual appeal.

## [1.6.3] - 2025-04-10

### Changed

- Kept snippet titles on one line in the table.
- Reduced the maximum snippet key length from 50 to 45 characters.
- Improved ARIA labels, contrast, and other accessibility details.
- Adopted CSS variables for improved maintainability.

### Fixed

- Addressed the issue tracked in
  [#18](https://github.com/simonkurtz-MSFT/simple-linkedin-composer/issues/18).
- Prevented LinkedIn buttons from flashing during page load when no LinkedIn
  user ID is configured.

## [1.6.2] - 2025-04-07

### Changed

- Opened the Instructions section and displayed a welcome message on the first
  visit.
- Formatted the editor toolbar and added tooltips.
- Renamed Clear to Clear all Data and made it fully reset local storage.
- Refactored snippet and hashtag scripts to use classes.

## [1.6.1] - 2025-04-07

### Changed

- Adopted the jQuery DataTables plugin for snippet sorting and filtering.
- Introduced an in-memory object for snippet data loaded from local storage.
- Wrapped the script in an immediately invoked function expression to avoid
  polluting the global namespace.
- Enabled JavaScript strict mode.

### Fixed

- Fixed snippet filtering after adopting DataTables.

## [1.6.0] - 2025-04-05

### Added

- Added paging controls to the snippets table.

### Changed

- Simplified the call-to-action button styles.
- Moved the Instructions section to the top and aligned it visually with the
  related controls.
- Refined spacing and layout.
- Added GitHub and LinkedIn links to the footer.

## [1.5.2] - 2025-04-04

### Changed

- Refactored scripts and styles for readability.
- Standardized scripts on jQuery.
- Added leading zeroes to timestamps.

### Removed

- Removed unused Google Fonts, DOMPurify, and quill-emoji assets.

## [1.5.1] - 2025-04-03

### Fixed

- Fixed ampersand encoding in generated post text.
- Preserved the active snippet filter after saving a snippet.

## [1.5.0] - 2025-04-01

### Added

- Added snippet title filtering.

### Changed

- Displayed visible and total snippet counts in the Snippets heading.
- Changed template sorting to show templates first.

## [1.4.0] - 2025-04-01

### Added

- Added a My LinkedIn Posts button for opening the configured user's recent
  posts.

### Changed

- Opened the Snippets section by default.
- Refined application styles.

### Fixed

- Preserved the snippet sort order after saving a snippet.

## [1.3.2] - 2025-04-01

### Fixed

- Fixed two medium-severity security issues.
- Correctly read the LinkedIn user ID from its input.

## [1.3.1] - 2025-03-31

### Changed

- Replaced the favicon with a pen icon.
- Updated GitHub statistics styling and added links and a subscriber count.
- Linked the header title and footer to the production custom domain.

### Fixed

- Added confirmation before loading different content over editor changes.

## [1.3.0] - 2025-03-27

### Added

- Added hashtag discovery, usage counts, one-click insertion, and LinkedIn
  links.

### Changed

- Organized major sections into accordions as the layout grew taller.

## [1.2.0] - 2025-03-25

### Added

- Added the ability to save posts as reusable templates.
- Added snippet import and export for moving local snippets between devices.

## [1.1.1] - 2025-03-24

### Added

- Added GitHub star and fork statistics to the header.

### Fixed

- Fixed numeric formatting for supported sans-serif and bold Unicode styles.

## [1.1.0] - 2025-03-21

### Added

- Added snippet sorting by title and timestamp, with newest snippets first by
  default.
- Added an attribution note and project link when copying a post.

### Changed

- Generated Unicode mappings with functions instead of static tables.
- Added confirmation before overwriting a snippet with the same title.
- Refined the layout styles.

### Fixed

- Fixed leading paragraph spaces being converted into indentation.

## [1.0.0] - 2025-03-20

### Added

- Released Simple LinkedIn Composer.

[Unreleased]: https://github.com/simonkurtz-MSFT/simple-linkedin-composer/compare/2.1.0...HEAD
[2.1.0]: https://github.com/simonkurtz-MSFT/simple-linkedin-composer/compare/2.0.0...2.1.0
[2.0.0]: https://github.com/simonkurtz-MSFT/simple-linkedin-composer/compare/1.7.0...2.0.0
[1.7.0]: https://github.com/simonkurtz-MSFT/simple-linkedin-composer/compare/1.6.3...1.7.0
[1.6.3]: https://github.com/simonkurtz-MSFT/simple-linkedin-composer/compare/1.6.2...1.6.3
[1.6.2]: https://github.com/simonkurtz-MSFT/simple-linkedin-composer/compare/1.6.1...1.6.2
[1.6.1]: https://github.com/simonkurtz-MSFT/simple-linkedin-composer/compare/1.6.0...1.6.1
[1.6.0]: https://github.com/simonkurtz-MSFT/simple-linkedin-composer/compare/1.5.2...1.6.0
[1.5.2]: https://github.com/simonkurtz-MSFT/simple-linkedin-composer/compare/1.5.1...1.5.2
[1.5.1]: https://github.com/simonkurtz-MSFT/simple-linkedin-composer/compare/1.5.0...1.5.1
[1.5.0]: https://github.com/simonkurtz-MSFT/simple-linkedin-composer/compare/1.4.0...1.5.0
[1.4.0]: https://github.com/simonkurtz-MSFT/simple-linkedin-composer/compare/1.3.2...1.4.0
[1.3.2]: https://github.com/simonkurtz-MSFT/simple-linkedin-composer/compare/1.3.1...1.3.2
[1.3.1]: https://github.com/simonkurtz-MSFT/simple-linkedin-composer/compare/1.3.0...1.3.1
[1.3.0]: https://github.com/simonkurtz-MSFT/simple-linkedin-composer/compare/1.2.0...1.3.0
[1.2.0]: https://github.com/simonkurtz-MSFT/simple-linkedin-composer/compare/1.1.1...1.2.0
[1.1.1]: https://github.com/simonkurtz-MSFT/simple-linkedin-composer/compare/1.1.0...1.1.1
[1.1.0]: https://github.com/simonkurtz-MSFT/simple-linkedin-composer/compare/1.0.0...1.1.0
[1.0.0]: https://github.com/simonkurtz-MSFT/simple-linkedin-composer/releases/tag/1.0.0