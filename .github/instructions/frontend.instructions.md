---
name: "Frontend"
description: "Use when changing the composer HTML, CSS, JavaScript, manifest, responsive layout, accessibility, local storage, import/export, or browser behavior."
applyTo: "src/**/*.html, src/**/*.css, src/**/*.js, src/manifest.json"
---

# Frontend Guidelines

- Keep the composer workflow primary: compose, format, save, copy, and open LinkedIn should remain efficient at desktop and mobile widths.
- Use semantic HTML and native controls. Icon-only controls need accessible names and tooltips; expandable controls need keyboard operation and accurate expanded state.
- Meet WCAG 2.2 AA for text, controls, focus indicators, hover, active, selected, disabled, high-contrast, and reduced-motion states.
- Use stable responsive dimensions and prevent controls, labels, editor content, tables, and notifications from overlapping or resizing the layout unexpectedly.
- Render imported and persisted values with text APIs. Do not construct HTML from snippet titles, hashtags, preferences, or other untrusted values.
- Validate imported JSON and tolerate malformed or legacy local-storage entries without losing unrelated valid data.
- Keep post conversion, storage, and import/export behavior in testable modules separate from DOM orchestration.
- Prefer browser APIs and existing dependencies. Do not add jQuery-specific code solely because the legacy implementation uses jQuery.
- For UI changes, follow the `ui-change` skill and defer full headless browser, screenshot, and accessibility runs until the approved change set is ready unless needed for diagnosis.