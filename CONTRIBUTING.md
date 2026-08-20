# Contributing to Simple LinkedIn Composer

Contributions are welcome. Keep changes focused on the static, local-first composer and search existing [issues](https://github.com/simonkurtz-MSFT/simple-linkedin-composer/issues) before opening a new one.

## Development setup

Use Node.js `26.7.0` and pnpm `11.21.0`, as pinned by the repository.

```powershell
pnpm install --frozen-lockfile
pnpm hooks:install
pnpm dev
```

The application source is in `src/`. Vite serves it locally and writes production output to `dist/`.

Do not commit registry credentials, private feed URLs, machine-specific pnpm settings, generated `dist/` output, Playwright reports, or test results. Keep corporate registry routing in untracked user or machine configuration.

When an install changes `pnpm-lock.yaml`, run `pnpm lockfile:normalize` before validation. `pnpm check` rejects registry tarball metadata that remains in the lockfile.

## Validation

Run the narrowest relevant check while developing, then run the affected broader checks before requesting review.

```powershell
pnpm check
pnpm test:browser
```

`pnpm check` runs formatting checks, linters, unit tests, and the Vite production build. `pnpm test:browser` runs the desktop and mobile Chromium workflows, automated accessibility checks, and Windows visual comparisons.

When an intentional UI change affects a baseline, review the generated actual and diff images before running:

```powershell
pnpm test:browser:update
pnpm test:browser
```

Do not update snapshots solely to make a failing test pass.

## Pull requests

- Explain the user-visible or engineering problem and the chosen approach.
- Keep unrelated dependency, behavior, security, and visual changes separate.
- Add or update focused tests for changed behavior.
- Preserve export/import compatibility unless the change includes an approved migration and backward-compatibility coverage.
- Report the commands run and any skipped or unavailable validation.
- Do not include generated reports, credentials, private URLs, or local configuration.

## Bug reports

Include:

- Expected and actual behavior.
- Reproduction steps and a minimal example when practical.
- Browser, operating system, application version, and viewport information.
- Relevant console output with secrets and personal content removed.

Do not post security-sensitive details or personal composer content in a public issue. Report sensitive vulnerabilities privately to [simon.kurtz@microsoft.com](mailto:simon.kurtz@microsoft.com).

## Feature requests

Describe the workflow problem, who benefits, and why the request belongs in a small static client-side composer. New runtime frameworks, network services, cloud synchronization, or changes to the local-first privacy model require explicit design approval.

## Legal

By contributing, you confirm that you authored the contribution or have the rights needed to provide it under the repository's [MIT License](LICENSE).
