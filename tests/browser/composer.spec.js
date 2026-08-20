import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const ignoredDevelopmentRequest = (request) =>
  request.method() === "HEAD" &&
  request.url().includes("emoji-picker-element-data") &&
  request.failure()?.errorText === "net::ERR_ABORTED";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("firstTimeUser", "false");
  });
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
  await expect(page.locator("#linkedin-my-posts")).toBeHidden();
  await expect(page.locator("#linkedin-publish-link")).toBeHidden();

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
  await page.goto("/");

  await page.getByRole("button", { name: "Load sample" }).click();
  await expect(page.locator(".ql-editor")).toContainText("Hello!");
  await page
    .getByRole("textbox", { name: "Save this draft" })
    .fill("Browser workflow");
  await page.getByRole("button", { name: "Save snippet" }).click();

  const saveToast = page.locator(".toast-success");
  await expect(saveToast).toHaveAttribute("aria-live", "polite");
  await expect(
    page.getByRole("button", { name: "Browser workflow", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Add #linkedin to the editor" }),
  ).toBeVisible();

  const snippetsHeader = page.getByRole("button", { name: /Snippets/ });
  await snippetsHeader.focus();
  await snippetsHeader.press("Enter");
  await expect(snippetsHeader).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator("#snippets-content")).toBeHidden();
  await snippetsHeader.press("Enter");
  await expect(snippetsHeader).toHaveAttribute("aria-expanded", "true");

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export" }).click();
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
  await page.getByRole("button", { name: "Import" }).click();
  const chooser = await chooserPromise;
  await chooser.setFiles({
    name: "snippets.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(importedSnippet)),
  });
  await expect(
    page.getByRole("button", { name: "Imported workflow", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Add #accessibility to the editor" }),
  ).toBeVisible();

  const invalidChooserPromise = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Import", exact: true }).click();
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

  const rows = page.locator("#snippets-table tbody tr");
  await expect(rows).toHaveCount(10);
  await expect(rows.first()).toContainText("Item 11");
  await expect(page.locator("th[data-sort='timestamp']")).toHaveAttribute(
    "aria-sort",
    "descending",
  );

  await page.getByRole("button", { name: "Snippet", exact: true }).click();
  await expect(rows.first()).toContainText("Item 01");
  await expect(page.locator("th[data-sort='title']")).toHaveAttribute(
    "aria-sort",
    "ascending",
  );

  await page.getByRole("button", { name: "Type", exact: true }).click();
  await expect(rows.first()).toContainText("Item 03");

  const search = page.getByRole("searchbox", { name: "Search snippets" });
  await search.fill("item 01");
  await expect(rows).toHaveCount(1);
  await expect(page.getByText("Snippets (1/11)")).toBeVisible();
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
  await emojiButton.click();
  await expect(emojiButton).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#emoji-picker-panel")).toHaveAttribute(
    "aria-hidden",
    "false",
  );
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
  await expect(page.getByRole("button", { name: "Copy post" })).toBeVisible();
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
