import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const ignoredDevelopmentRequest = (request) =>
  request.method() === "HEAD" &&
  request.url().includes("emoji-picker-element-data") &&
  request.failure()?.errorText === "net::ERR_ABORTED";

test.beforeEach(async ({ page }, testInfo) => {
  await page.route(
    "https://api.github.com/repos/simonkurtz-MSFT/simple-linkedin-composer",
    (route) =>
      route.fulfill({
        json: {
          stargazers_count: 128,
          forks_count: 16,
          subscribers_count: 4,
        },
      }),
  );
  const seedProfile = !testInfo.title.includes("prompts for LinkedIn settings");
  await page.addInitScript((shouldSeedProfile) => {
    localStorage.setItem("firstTimeUser", "false");
    if (shouldSeedProfile) {
      localStorage.setItem("linkedin_id", "existing-profile");
    }
  }, seedProfile);
});

test("prompts for LinkedIn settings on first load and persists them", async ({
  page,
}) => {
  await page.goto("/");

  const settingsDialog = page.getByRole("dialog", {
    name: "Settings",
  });
  await expect(settingsDialog).toBeVisible();
  await expect(
    settingsDialog.getByText("Preferences", { exact: true }),
  ).toHaveCount(0);
  await expect(page).toHaveScreenshot("settings.png", {
    animations: "disabled",
    fullPage: true,
  });
  const profileId = page.getByRole("textbox", {
    name: "LinkedIn profile ID",
  });
  await expect(profileId).toBeFocused();
  await profileId.fill("new-profile");
  await page.getByRole("button", { name: "Save settings" }).click();

  await expect(settingsDialog).toBeHidden();
  await expect(
    page.getByRole("button", { name: "Open settings" }),
  ).toBeFocused();
  await expect(page.locator("#linkedin-create-post")).toHaveAttribute(
    "href",
    "https://www.linkedin.com/in/new-profile/overlay/create-post",
  );
  expect(await page.evaluate(() => localStorage.getItem("linkedin_id"))).toBe(
    "new-profile",
  );

  await page.getByRole("button", { name: "Open settings" }).click();
  await expect(profileId).toHaveValue("new-profile");
  await expect(
    settingsDialog.getByRole("button", { name: "Import", exact: true }),
  ).toBeVisible();
  await expect(
    settingsDialog.getByRole("button", { name: "Export", exact: true }),
  ).toBeVisible();
  await expect(
    settingsDialog.getByRole("button", { name: "Clear data" }),
  ).toBeVisible();
  await expect(
    page
      .locator(".library")
      .getByRole("button", { name: "Import", exact: true }),
  ).toHaveCount(0);
});

test("follows the system theme and persists appearance overrides", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");

  const root = page.locator("html");
  await expect(root).not.toHaveAttribute("data-theme");
  await expect(root).toHaveCSS("color-scheme", "dark");
  await expect(page.locator("body")).toHaveCSS(
    "background-color",
    "rgb(16, 22, 28)",
  );

  await page.getByRole("button", { name: "Open settings" }).click();
  const themePreference = page.getByRole("combobox", { name: "Appearance" });
  await expect(themePreference).toHaveValue("system");
  await themePreference.selectOption("light");
  await page.getByRole("button", { name: "Save settings" }).click();
  await expect(root).toHaveAttribute("data-theme", "light");
  await expect(root).toHaveCSS("color-scheme", "light");
  expect(await page.evaluate(() => localStorage.getItem("theme"))).toBe(
    "light",
  );

  await page.getByRole("button", { name: "Open settings" }).click();
  await themePreference.selectOption("dark");
  await page.getByRole("button", { name: "Save settings" }).click();
  await page.reload();
  await expect(root).toHaveAttribute("data-theme", "dark");
  await expect(root).toHaveCSS("color-scheme", "dark");
  await expect(page).toHaveScreenshot("dark.png", {
    animations: "disabled",
    fullPage: true,
  });

  const accessibilityResults = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(accessibilityResults.violations).toEqual([]);

  await page.getByRole("button", { name: "Open settings" }).click();
  await themePreference.selectOption("system");
  await page.getByRole("button", { name: "Save settings" }).click();
  await expect(root).not.toHaveAttribute("data-theme");
  expect(await page.evaluate(() => localStorage.getItem("theme"))).toBeNull();
});

test("meets automated accessibility and responsive layout checks", async ({
  page,
}) => {
  const consoleErrors = [];
  const failedRequests = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("requestfailed", (request) => {
    if (!ignoredDevelopmentRequest(request)) {
      failedRequests.push(`${request.method()} ${request.url()}`);
    }
  });

  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Compose your post" }),
  ).toBeVisible();
  await expect(
    page.locator(".composer").getByRole("button", { name: "Load sample" }),
  ).toBeVisible();
  await expect(
    page.locator(".library").getByRole("button", { name: "Load sample" }),
  ).toHaveCount(0);
  await expect(page.getByText("1 · Start", { exact: true })).toBeVisible();
  await expect(page.getByText("2 · Edit", { exact: true })).toBeVisible();
  await expect(page.getByText("3 · Publish", { exact: true })).toBeVisible();
  await expect(page.getByText("4 · Save", { exact: true })).toBeVisible();
  await expect(page.locator(".privacy-note")).toHaveCount(0);
  await expect(page.locator("html")).toHaveCSS("scrollbar-gutter", "stable");
  await expect(page.locator(".library")).toHaveCSS(
    "scrollbar-gutter",
    "stable",
  );
  const libraryBox = await page.locator(".library").boundingBox();
  const composerBox = await page.locator(".composer").boundingBox();
  if (page.viewportSize().width > 820) {
    expect(
      Math.abs(libraryBox.height - composerBox.height),
    ).toBeLessThanOrEqual(1);
  } else {
    expect(libraryBox.height).toBeLessThan(composerBox.height);
  }
  await expect(
    page
      .getByRole("button", {
        name: "Remove Formatting from selected content",
      })
      .locator("svg"),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Insert Emoji" })).toHaveText(
    "☺",
  );
  await expect(page.getByRole("button", { name: "Clear Editor" })).toHaveText(
    "🗑",
  );
  await expect(page.locator("#linkedin-publish-link")).toBeVisible();
  await expect(page.locator("#settings-button")).toHaveCSS(
    "background-color",
    "rgb(237, 242, 244)",
  );
  await expect(page.locator(".settings-icon")).toHaveCSS("font-size", "26.4px");
  await expect(page.locator("#github-star-count")).toHaveText("128");
  await expect(page.locator("#github-fork-count")).toHaveText("16");
  await expect(page.locator("#github-watcher-count")).toHaveText("4");
  await expect(page.locator("#github-stars")).toHaveAccessibleName(
    "GitHub stars: 128",
  );

  const accessibilityResults = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();

  expect(accessibilityResults.violations).toEqual([]);
  expect(
    await page
      .locator("html")
      .evaluate((root) => root.scrollWidth <= root.clientWidth),
  ).toBe(true);
  expect(consoleErrors).toEqual([]);
  expect(failedRequests).toEqual([]);
  await expect(page).toHaveScreenshot("home.png", {
    animations: "disabled",
    fullPage: true,
  });
});

test("supports the primary composer, snippet, hashtag, and file workflows", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "snippet-Browser workflow",
      JSON.stringify({
        delta: { ops: [{ insert: "Saved workflow #linkedin\n" }] },
        timestamp: "2026-08-19T12:00:00.000Z",
        isTemplate: false,
      }),
    );
  });
  await page.goto("/");

  const hashtagsHeader = page.getByRole("button", { name: /Hashtags/ });
  await expect(hashtagsHeader).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator("#hashtags-content")).toBeHidden();
  await hashtagsHeader.focus();
  await hashtagsHeader.press("Enter");
  await expect(hashtagsHeader).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#hashtags-content")).toBeVisible();

  await page
    .getByRole("button", { name: "Browser workflow", exact: true })
    .click();
  await expect(page.locator(".ql-editor")).toContainText("Saved workflow");
  await page.locator(".ql-editor").press("End");
  await page.locator(".ql-editor").pressSequentially(" edited");
  await page
    .getByRole("textbox", { name: "Save this draft" })
    .fill("Browser workflow revised");
  await page.getByRole("button", { name: "Save snippet" }).click();

  const saveToast = page.locator(".toast-success");
  await expect(saveToast).toHaveAttribute("aria-live", "polite");
  await expect(
    page.getByRole("button", { name: "Browser workflow revised", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Add #linkedin to the editor" }),
  ).toBeVisible();

  const snippetsHeader = page.getByRole("button", { name: /Saved snippets/ });
  const accordionIcon = snippetsHeader.locator(".accordion-icon");
  const expandedIconBox = await accordionIcon.boundingBox();
  const expandedLibraryWidth = await page
    .locator(".library")
    .evaluate((library) => library.getBoundingClientRect().width);
  await snippetsHeader.focus();
  await snippetsHeader.press("Enter");
  await expect(snippetsHeader).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator("#snippets-content")).toBeHidden();
  const collapsedIconBox = await accordionIcon.boundingBox();
  expect(collapsedIconBox.width).toBe(expandedIconBox.width);
  expect(collapsedIconBox.height).toBe(expandedIconBox.height);
  expect(
    await page
      .locator(".library")
      .evaluate((library) => library.getBoundingClientRect().width),
  ).toBe(expandedLibraryWidth);
  await snippetsHeader.press("Enter");
  await expect(snippetsHeader).toHaveAttribute("aria-expanded", "true");

  await page.getByRole("button", { name: "Open settings" }).click();
  const settingsDialog = page.getByRole("dialog", { name: "Settings" });
  const downloadPromise = page.waitForEvent("download");
  await settingsDialog.getByRole("button", { name: "Export" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(
    /^LinkedIn-Composer-Data-.*\.json$/,
  );

  const importedSnippet = {
    "snippet-Imported workflow": JSON.stringify({
      delta: { ops: [{ insert: "Imported #accessibility\n" }] },
      timestamp: "2026-08-19T12:00:00.000Z",
      isTemplate: false,
    }),
  };
  const chooserPromise = page.waitForEvent("filechooser");
  await settingsDialog.getByRole("button", { name: "Import" }).click();
  const chooser = await chooserPromise;
  await chooser.setFiles({
    name: "snippets.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(importedSnippet)),
  });
  await page.getByRole("button", { name: "Close settings" }).click();
  await expect(
    page.getByRole("button", { name: "Imported workflow", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Add #accessibility to the editor" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Open settings" }).click();
  const invalidChooserPromise = page.waitForEvent("filechooser");
  await settingsDialog
    .getByRole("button", { name: "Import", exact: true })
    .click();
  const invalidChooser = await invalidChooserPromise;
  await invalidChooser.setFiles({
    name: "invalid.json",
    mimeType: "application/json",
    buffer: Buffer.from("[]"),
  });
  await expect(page.locator(".toast-error")).toHaveAttribute(
    "aria-live",
    "assertive",
  );
});

test("keeps editor copy native and converts only from the explicit action", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/");

  const editor = page.locator(".ql-editor");
  await editor.fill("Native copy");
  await editor.press("Control+A");
  await editor.press("Control+C");

  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toBe("Native copy");
  await expect(
    page
      .locator(".library")
      .getByRole("button", { name: "Export", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.locator(".library").getByRole("button", { name: "Clear data" }),
  ).toHaveCount(0);
  await expect(page.locator(".toast-success")).toHaveCount(0);

  await page.getByRole("button", { name: "Copy for LinkedIn" }).click();
  await expect(page.locator(".toast-success")).toContainText(
    "Post copied to clipboard",
  );
});

test("protects templates when reusing and deliberately overwriting them", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "snippet-Protected template",
      JSON.stringify({
        delta: { ops: [{ insert: "Reusable template body\n" }] },
        timestamp: "2026-08-19T12:00:00.000Z",
        isTemplate: true,
      }),
    );
  });
  await page.goto("/");

  await page
    .getByRole("button", { name: "Protected template", exact: true })
    .click();
  await expect(page.locator(".ql-editor")).toContainText(
    "Reusable template body",
  );
  await expect(
    page.getByRole("textbox", { name: "Save this draft" }),
  ).toHaveValue("");
  await expect(
    page.getByRole("checkbox", { name: "Template", exact: true }),
  ).not.toBeChecked();
  await expect(page.locator(".toast-info")).toContainText(
    "loaded as a new draft",
  );

  await page
    .getByRole("textbox", { name: "Save this draft" })
    .fill("Protected template");
  page.once("dialog", async (dialog) => {
    expect(dialog.message()).toContain("protected template");
    expect(dialog.message()).toContain("permanently replaces");
    await dialog.dismiss();
  });
  await page.getByRole("button", { name: "Save snippet" }).click();

  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem("snippet-Protected template")),
    ),
  ).toMatchObject({
    delta: { ops: [{ insert: "Reusable template body\n" }] },
    isTemplate: true,
  });
});

test("sorts, searches, and paginates the snippet library", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    for (let index = 1; index <= 11; index += 1) {
      const title = `Item ${String(index).padStart(2, "0")}`;
      localStorage.setItem(
        `snippet-${title}`,
        JSON.stringify({
          delta: { ops: [{ insert: `Body-only-${index}\n` }] },
          timestamp: new Date(Date.UTC(2026, 0, index)).toISOString(),
          isTemplate: index === 3,
        }),
      );
    }
  });
  await page.reload();

  if (page.viewportSize().width > 900) {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator("main")).toHaveCSS("width", "1680px");
    const libraryBox = await page.locator(".library").boundingBox();
    const composerBox = await page.locator(".composer").boundingBox();
    expect(libraryBox.x).toBeLessThan(composerBox.x);
    expect(libraryBox.width / composerBox.width).toBeGreaterThan(0.7);
  }

  const rows = page.locator("#snippets-table tbody tr");
  await expect(rows).toHaveCount(10);
  await expect(rows.first()).toContainText("Item 11");
  await expect(page.locator("th[data-sort='timestamp']")).toHaveAttribute(
    "aria-sort",
    "descending",
  );
  await expect(rows.first().locator("td").nth(1)).toHaveCSS(
    "white-space",
    "nowrap",
  );
  expect(
    await rows
      .first()
      .locator("td")
      .nth(1)
      .evaluate((cell) => cell.scrollWidth <= cell.clientWidth),
  ).toBe(true);
  await expect(page.locator("th[data-sort='template'] .sort-button")).toHaveCSS(
    "text-align",
    "right",
  );
  expect(
    await page
      .locator("th[data-sort='template'] .sort-button")
      .evaluate((button) => button.scrollWidth <= button.clientWidth),
  ).toBe(true);

  await page.getByRole("button", { name: "Snippet", exact: true }).click();
  await expect(rows.first()).toContainText("Item 01");
  await expect(page.locator("th[data-sort='title']")).toHaveAttribute(
    "aria-sort",
    "ascending",
  );

  const templateSortButton = page.locator(
    "th[data-sort='template'] .sort-button",
  );
  const getTemplateLabelPosition = () =>
    templateSortButton.evaluate((button) => {
      const labelRange = document.createRange();
      labelRange.selectNode(button.firstChild);
      return (
        labelRange.getBoundingClientRect().x -
        button.parentElement.getBoundingClientRect().x
      );
    });
  const templateLabelPosition = await getTemplateLabelPosition();
  await templateSortButton.click();
  expect(await getTemplateLabelPosition()).toBe(templateLabelPosition);
  await expect(rows.first()).toContainText("Item 03");
  const deleteButton = page.getByRole("button", { name: "Delete Item 03" });
  await expect(deleteButton).toHaveText("🗑️");
  await expect(deleteButton).toHaveCSS("width", "30px");
  await expect(deleteButton).toHaveCSS("height", "30px");
  await expect(deleteButton).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  expect((await rows.first().boundingBox()).height).toBeLessThanOrEqual(
    page.viewportSize().width <= 600 ? 52 : 43,
  );

  const templateFilter = page.getByRole("checkbox", {
    name: "Templates only",
  });
  const columnWidths = await page
    .locator("#snippets-table thead th")
    .evaluateAll((headers) =>
      headers.map((header) => header.getBoundingClientRect().width),
    );
  await templateFilter.check();
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toContainText("Item 03");
  await expect(page.getByText("Saved snippets (1/11)")).toBeVisible();
  expect(
    await page
      .locator("#snippets-table thead th")
      .evaluateAll((headers) =>
        headers.map((header) => header.getBoundingClientRect().width),
      ),
  ).toEqual(columnWidths);
  await templateFilter.uncheck();

  const search = page.getByRole("searchbox", { name: "Search snippets" });
  await search.fill("item 01");
  await expect(rows).toHaveCount(1);
  await expect(page.getByText("Saved snippets (1/11)")).toBeVisible();
  await expect(page.locator("#snippet-pager")).toBeHidden();

  await search.fill("Body-only-1");
  await expect(page.getByText("No snippets match this search.")).toBeVisible();

  await search.fill("");
  await page.getByRole("button", { name: "Page 2" }).click();
  await expect(rows).toHaveCount(1);
  await page.getByLabel("Snippets per page").selectOption("25");
  await expect(rows).toHaveCount(11);
  await expect(page.locator("#snippet-pager")).toBeHidden();
});

test("confirms destructive editor clearing and exposes popup state", async ({
  page,
}) => {
  await page.goto("/");
  const editor = page.locator(".ql-editor");
  const clearEditor = page.getByRole("button", { name: "Clear Editor" });

  await editor.fill("Keep this draft");
  page.once("dialog", (dialog) => dialog.dismiss());
  await clearEditor.click();
  await expect(editor).toContainText("Keep this draft");

  page.once("dialog", (dialog) => dialog.accept());
  await clearEditor.click();
  await expect(editor).toHaveText("");
  await expect(editor).toBeFocused();

  const emojiButton = page.getByRole("button", { name: "Insert Emoji" });
  await editor.fill("Emoji ");
  await editor.focus();
  await page.keyboard.press("End");
  await emojiButton.click();
  await expect(emojiButton).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#emoji-picker-panel")).toHaveAttribute(
    "aria-hidden",
    "false",
  );
  await page.locator("emoji-picker").evaluate((picker) => {
    picker.dispatchEvent(
      new CustomEvent("emoji-click", {
        bubbles: true,
        composed: true,
        detail: { unicode: "😀" },
      }),
    );
  });
  await expect(editor).toHaveText("Emoji 😀");
  await expect(emojiButton).toHaveAttribute("aria-expanded", "false");

  await emojiButton.click();
  await page.keyboard.press("Escape");
  await expect(emojiButton).toHaveAttribute("aria-expanded", "false");
  await expect(emojiButton).toBeFocused();
});

test("supports forced colors, reduced motion, and 200 percent text resizing", async ({
  page,
}) => {
  await page.emulateMedia({ forcedColors: "active", reducedMotion: "reduce" });
  await page.goto("/");
  await page.locator("html").evaluate((root) => {
    root.style.fontSize = "200%";
  });

  await expect(
    page.getByRole("heading", { name: "Compose your post" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Copy for LinkedIn" }),
  ).toBeVisible();
  expect(
    await page
      .locator("html")
      .evaluate((root) => root.scrollWidth <= root.clientWidth),
  ).toBe(true);

  const accordionTransitionSeconds = await page
    .locator(".accordion-icon")
    .first()
    .evaluate((icon) => {
      const duration =
        icon.ownerDocument.defaultView.getComputedStyle(
          icon,
        ).transitionDuration;
      return duration.endsWith("ms")
        ? Number.parseFloat(duration) / 1000
        : Number.parseFloat(duration);
    });
  expect(accordionTransitionSeconds).toBeLessThanOrEqual(0.001);

  const composerBorderStyle = await page
    .locator(".composer")
    .evaluate(
      (composer) =>
        composer.ownerDocument.defaultView.getComputedStyle(composer)
          .borderTopStyle,
    );
  expect(composerBorderStyle).toBe("solid");
});
