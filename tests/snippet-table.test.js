// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSnippetTable } from "../src/snippet-table.js";

const makeSnippet = (timestamp, isTemplate = false) => ({
  timestamp,
  isTemplate,
});

const setup = ({ pageSize = 10 } = {}) => {
  document.body.innerHTML = `
    <input id="search" />
    <input id="templates" type="checkbox" />
    <table>
      <thead><tr>
        <th data-sort="title"><button type="button">Snippet</button></th>
        <th data-sort="timestamp"><button type="button">Updated</button></th>
        <th data-sort="template"><button type="button">Template</button></th>
        <th>Actions</th>
      </tr></thead>
      <tbody></tbody>
    </table>
    <select id="size"></select>
    <nav id="pager"></nav>`;

  const onLoad = vi.fn();
  const onDelete = vi.fn();
  const onCountChange = vi.fn();
  const table = createSnippetTable({
    table: document.querySelector("table"),
    searchInput: document.querySelector("#search"),
    templateFilter: document.querySelector("#templates"),
    pageSizeSelect: document.querySelector("#size"),
    pager: document.querySelector("#pager"),
    onLoad,
    onDelete,
    onCountChange,
    pageSize,
  });

  return { table, onLoad, onDelete, onCountChange };
};

beforeEach(() => {
  document.body.replaceChildren();
});

describe("createSnippetTable", () => {
  it("renders the empty state and initializes accessible controls", () => {
    const { table, onCountChange } = setup();

    table.setSnippets({});

    expect(document.querySelector(".empty-state").textContent).toContain(
      "No snippets yet",
    );
    expect(
      document
        .querySelector("th[data-sort='timestamp']")
        .getAttribute("aria-sort"),
    ).toBe("descending");
    expect(document.querySelectorAll("#size option")).toHaveLength(4);
    expect(document.querySelector("#pager").hidden).toBe(true);
    expect(onCountChange).toHaveBeenLastCalledWith("0", {
      visible: 0,
      total: 0,
    });
  });

  it("renders untrusted titles as text and invokes row actions", () => {
    const { table, onLoad, onDelete } = setup();
    const title = '<img src=x onerror="alert(1)">';

    table.setSnippets({
      [title]: makeSnippet("2025-01-01T12:00:00.000Z", true),
    });

    expect(document.querySelector("img")).toBeNull();
    expect(document.querySelector(".snippet-link").textContent).toBe(title);
    expect(document.querySelector("[aria-label='Template']")).not.toBeNull();
    expect(document.querySelector(".delete-snippet").textContent).toBe("🗑️");
    document.querySelector(".snippet-link").click();
    document.querySelector(".delete-snippet").click();
    expect(onLoad).toHaveBeenCalledWith(title);
    expect(onDelete).toHaveBeenCalledWith(title);
  });

  it("filters to templates and composes with title search", () => {
    const { table, onCountChange } = setup();
    table.setSnippets({
      "Alpha template": makeSnippet("2025-01-01T00:00:00.000Z", true),
      "Beta draft": makeSnippet("2025-02-01T00:00:00.000Z"),
    });

    const templateFilter = document.querySelector("#templates");
    templateFilter.checked = true;
    templateFilter.dispatchEvent(new Event("change"));
    expect(document.querySelectorAll(".snippet-link")).toHaveLength(1);
    expect(document.querySelector(".snippet-link").textContent).toBe(
      "Alpha template",
    );
    expect(onCountChange).toHaveBeenLastCalledWith("1/2", {
      visible: 1,
      total: 2,
    });

    const search = document.querySelector("#search");
    search.value = "beta";
    search.dispatchEvent(new Event("input"));
    expect(document.querySelector(".empty-state").textContent).toBe(
      "No templates match the current filters.",
    );
  });

  it("sorts, searches titles, and reports visible counts", () => {
    const { table, onCountChange } = setup();
    table.setSnippets({
      Alpha: makeSnippet("2025-01-01T00:00:00.000Z"),
      Beta: makeSnippet("2025-02-01T00:00:00.000Z"),
    });

    expect(document.querySelector(".snippet-link").textContent).toBe("Beta");
    document.querySelector("th[data-sort='title'] button").click();
    expect(document.querySelector(".snippet-link").textContent).toBe("Alpha");
    expect(
      document.querySelector("th[data-sort='title']").getAttribute("aria-sort"),
    ).toBe("ascending");

    const search = document.querySelector("#search");
    search.value = " beta ";
    search.dispatchEvent(new Event("input"));
    expect(document.querySelectorAll(".snippet-link")).toHaveLength(1);
    expect(document.querySelector(".snippet-link").textContent).toBe("Beta");
    expect(onCountChange).toHaveBeenLastCalledWith("1/2", {
      visible: 1,
      total: 2,
    });
  });

  it("paginates and resets to page one when page size changes", () => {
    const { table } = setup({ pageSize: 10 });
    const snippets = Object.fromEntries(
      Array.from({ length: 11 }, (_, index) => [
        `Snippet ${String(index + 1).padStart(2, "0")}`,
        makeSnippet(new Date(2025, 0, index + 1).toISOString()),
      ]),
    );

    table.setSnippets(snippets);
    expect(document.querySelector("#pager").hidden).toBe(false);
    document.querySelector("[aria-label='Page 2']").click();
    expect(table.model.getPage()).toBe(2);
    expect(document.querySelectorAll(".snippet-link")).toHaveLength(1);

    const size = document.querySelector("#size");
    size.value = "25";
    size.dispatchEvent(new Event("change"));
    expect(table.model.getPage()).toBe(1);
    expect(document.querySelectorAll(".snippet-link")).toHaveLength(11);
    expect(document.querySelector("#pager").hidden).toBe(true);
  });
});
