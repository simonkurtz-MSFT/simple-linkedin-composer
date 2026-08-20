// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";
import { openAccordion, setupAccordions } from "../src/accordion.js";
import { downloadFile, pickFile } from "../src/file-transfer.js";
import { renderHashtagList } from "../src/hashtag-list.js";

beforeEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

describe("renderHashtagList", () => {
  it("renders the empty state", () => {
    const container = document.createElement("div");

    renderHashtagList({ container, hashtags: {}, onInsert: vi.fn() });

    expect(container.querySelector(".empty-state").textContent).toContain(
      "saved snippets",
    );
  });

  it("renders safe labels, encoded links, and insert actions", () => {
    const container = document.createElement("div");
    const onInsert = vi.fn();

    renderHashtagList({
      container,
      hashtags: { "#A&B": 2 },
      onInsert,
    });

    expect(container.querySelector("span").textContent).toBe("#A&B (2)");
    expect(container.querySelector("a").href).toContain("keywords=A%26B");
    expect(container.querySelector("a").rel).toBe("noopener noreferrer");
    container.querySelector("button").click();
    expect(onInsert).toHaveBeenCalledWith("#A&B");
  });
});

describe("accordions", () => {
  const createAccordion = () => {
    document.body.innerHTML = `
      <section>
        <button class="accordion-header" aria-expanded="false">Header</button>
        <div class="accordion-content"></div>
      </section>`;
    return {
      header: document.querySelector(".accordion-header"),
      content: document.querySelector(".accordion-content"),
    };
  };

  it("toggles content and aria-expanded from the native button", () => {
    const { header, content } = createAccordion();
    setupAccordions(document);

    header.click();
    expect(content.classList.contains("open")).toBe(true);
    expect(header.getAttribute("aria-expanded")).toBe("true");
    header.click();
    expect(content.classList.contains("open")).toBe(false);
    expect(header.getAttribute("aria-expanded")).toBe("false");
  });

  it("opens an accordion programmatically", () => {
    const { header, content } = createAccordion();

    openAccordion(content);

    expect(content.classList.contains("open")).toBe(true);
    expect(header.getAttribute("aria-expanded")).toBe("true");
  });
});

describe("file transfer", () => {
  it("downloads through a temporary object URL and link", () => {
    const createObjectURL = vi.fn(() => "blob:test");
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", { createObjectURL, revokeObjectURL });
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});

    downloadFile("snippets.json", "{}", { document });

    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(click).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:test");
    expect(document.querySelector("a")).toBeNull();
    vi.unstubAllGlobals();
  });

  it("resolves with the selected file", async () => {
    const file = new File(["{}"], "snippets.json", {
      type: "application/json",
    });
    vi.spyOn(HTMLInputElement.prototype, "click").mockImplementation(
      function () {
        Object.defineProperty(this, "files", { value: [file] });
        this.dispatchEvent(new Event("change"));
      },
    );

    await expect(pickFile({ document })).resolves.toBe(file);
  });
});
