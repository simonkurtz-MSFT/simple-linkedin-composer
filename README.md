# Simple LinkedIn Composer

An enhanced rich-text editor for crafting better-formatted LinkedIn posts with emoji support and local snippet storage.

Hosted at [https://linkedin-composer.simondoescloud.com](https://linkedin-composer.simondoescloud.com)

![Banner Image](composer-linkedin-side-by-side-1.7.0.png)

## Table of Contents

- [✨ Features](#-features)
- [🚀 Quick Start](#-quick-start)
- [📖 Detailed Usage Guide](#-detailed-usage-guide)
- [💾 Snippet Management](#-snippet-management)
- [🏷️ Hashtags](#%EF%B8%8F-hashtags)
- [🔒 Privacy & Data](#-privacy--data)
- [🌐 Browser Support](#-browser-support)
- [🤝 Contributing](#-contributing)
- [📜 License](#-license)

## ✨ Features

- _Rich text formatting_ (bold, italic, lists)
- _Emoji picker_ with search functionality
- _Local storage_ of post and template snippets
- _Hashtag tracking_ and quick insertion
- _Export/import_ snippets as JSON
- _Local-first composer data_ with no cloud sync
- _Anonymous, aggregate usage and performance analytics_
- _Edge split-screen_ optimized

## 🚀 Quick Start

1. Enter your LinkedIn username.
1. Compose or load a snippet. _Side-by-side is really nice in Edge!_
1. Click "Create a new LinkedIn Post".
1. Click "Copy to Clipboard." **Do not just copy content from the editor.**
1. Paste into the LinkedIn post.

## 📖 Detailed Usage Guide

### Setting Up

1. Get your LinkedIn username from your LinkedIn profile URL (e.g. [https://www.linkedin.com/in/simonkurtz/](https://www.linkedin.com/in/simonkurtz/))
1. Enter it in the "LinkedIn user id" field (saves automatically)

### Composing Posts

If you are starting with your first post, you can load a sample via the button under the editor.

Use the toolbar for formatting.

### Saving Posts

1. Click "Save snippet"
1. Add a descriptive title (max 50 chars)
1. Mark as template (optional) for frequent-use posts

### Posting on LinkedIn

1. Compose or load a snippet. _Side-by-side is really nice in Edge!_
1. Click "Create a new LinkedIn Post".
1. Click "Copy to Clipboard." **Do not just copy content from the editor.**
1. Paste into the LinkedIn post.

## 💾 Snippet Management

| Action | How To                                                |
| ------ | ----------------------------------------------------- |
| Save   | Click "Save snippet" after writing                    |
| Load   | Click snippet name in table                           |
| Delete | Click "Delete" button next to snippet                 |
| Export | Click "Export" to download all snippets               |
| Import | Click "Import" to upload snippets (handles de-duping) |

Imports accept the existing exported JSON object format. Each key must be `snippet-` followed by a title of up to 50 characters. Each value may be the exported JSON string or its parsed object and must contain a Quill `delta`, a valid timestamp, and an optional Boolean template flag. Supported formatting is bold, italic, ordered or bullet lists, and HTTP(S) links. Unknown or malformed entries are skipped without deleting other valid local snippets.

## 🏷️ Hashtags

_Simple LinkedIn Composer_ automatically detects hashtags in your post and tallies them in the hashtag organizer.
The number of occurrences in your post is counted to give you insight into your own usage. You can sort by name or frequency of use (count).
Clicking ➕ inserts the hashtag at the cursor in the editor. Clicking the LinkedIn icon opens its context on LinkedIn.

## 🔒 Privacy & Data

The application code does not send your composer content to an application server. Its scripts, styles, editor libraries, and emoji data ship with the static site.

The hosted site uses Cloudflare Web Analytics for anonymous, aggregate usage and performance measurements. Hosting infrastructure also processes standard request metadata needed to deliver the site. These operational services help maintain the application and do not receive post content, snippets, hashtags, or profile settings from the application.

**Post content, snippets, hashtags, and profile settings stay in your browser's local storage.** They are not included in analytics, and there is no cloud sync or advertising. External sites open only when you choose one of the displayed links.

This tool is **entirely free to use**. Please see the very permissive [MIT license](LICENSE) for details.

Enjoy it!

## 🌐 Browser Support

| Browser   | Support Level | Notes               |
| --------- | ------------- | ------------------- |
| _Chrome_  | ✅ Full       |                     |
| _Edge_    | ✅ Full       | Use split-screen    |
| _Firefox_ | ✅ Full       |                     |
| _Safari_  | ✅ Full       | MacOS/iOS 15+       |
| _Mobile_  | ⚠️ Limited    | Use Desktop Version |

## Development

The application remains plain HTML, CSS, and JavaScript. Vite provides the local development server and creates the static production output.

1. Install the Node.js version from `.nvmrc` and enable pnpm `11.21.0`.
1. Run `pnpm install --frozen-lockfile`.
1. Run `pnpm hooks:install` once per clone to configure the repository-managed Git hooks.
1. Run `pnpm dev` for local development.

Use `pnpm check` to run formatting, linting, tests, and the production build. The generated static site is written to `dist/`.

The repository configures pnpm not to include tarball URLs. The pre-commit hook removes any `tarball` metadata preserved in the staged `pnpm-lock.yaml` and leaves unstaged lockfile work unchanged.

Corporate or Microsoft proxy registry routing belongs in untracked user or machine pnpm configuration. Do not add proxy URLs, credentials, tokens, or private feed settings to repository files.

## 🤝 Contributing

Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

We welcome:

- Bug reports
- Feature requests
- Pull requests

### Thank You

A big _THANK YOU!_ to the following contributors:

- [Carolina-GomezM](https://github.com/Carolina-GomezM)

## 📜 License

MIT License - see [LICENSE](LICENSE) file for details.

---

_Try it now:_ [https://linkedin-composer.simondoescloud.com](https://linkedin-composer.simondoescloud.com)

_Have questions?_ Open an issue on [GitHub](https://github.com/simonkurtz-MSFT/simple-linkedin-composer/issues)
