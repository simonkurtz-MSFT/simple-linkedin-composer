---
name: ui-change
description: "Implement and validate Simple LinkedIn Composer UI, responsive layout, interaction, accessibility, color, editor, snippets, hashtags, dialogs, or notification changes."
argument-hint: "Describe the user-interface change"
---

# UI Change

Use this workflow for user-visible HTML, CSS, and browser-interaction changes.

## Procedure

1. Read `docs/PLAN.md`, the frontend instructions, and the affected markup, styles, behavior, and focused tests.
2. Identify the target workflow, supported viewport range, keyboard behavior, state variants, and unchanged behavior.
3. Establish a focused baseline. For color changes, record affected foreground/background pairs and required WCAG AA ratios.
4. Implement one cohesive approved slice using semantic controls, stable responsive dimensions, and existing visual language unless the approved step defines a redesign.
5. Run the cheapest focused test, lint, or build check immediately after the first substantive edit.
6. Verify loading, empty, populated, error, hover, focus, active, selected, disabled, high-contrast, and reduced-motion states that the change affects.
7. When the approved UI batch is ready, run headless browser checks at representative desktop and mobile viewports, automated accessibility and contrast checks, and screenshots. Confirm no overlap, clipping, unexpected layout shift, console error, or failed asset request.
8. Report changed workflows, viewport and accessibility evidence, screenshots produced, skipped checks, and residual risk.

Do not accept visual inspection alone as evidence for contrast or accessibility. Do not start a visible browser unless explicitly requested.