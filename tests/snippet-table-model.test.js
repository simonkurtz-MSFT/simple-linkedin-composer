import { describe, expect, it } from "vitest";

import {
  createSnippetTableModel,
  toSnippetRows,
} from "../src/snippet-table-model.js";

const snippets = {
  "Zebra launch": { timestamp: "2026-01-03T10:00:00.000Z", isTemplate: false },
  "alpha draft": { timestamp: "2026-01-05T10:00:00.000Z", isTemplate: true },
  "Mid note": { timestamp: "2026-01-04T10:00:00.000Z" },
};

const titles = (model) => model.getPageRows().map((row) => row.title);

const buildModel = (options) => {
  const model = createSnippetTableModel(options);
  model.setRows(toSnippetRows(snippets));
  return model;
};

describe("snippet table model", () => {
  it("normalizes stored snippets into rows with ISO timestamps", () => {
    expect(toSnippetRows(snippets)).toEqual([
      {
        title: "Zebra launch",
        timestamp: "2026-01-03T10:00:00.000Z",
        isTemplate: false,
      },
      {
        title: "alpha draft",
        timestamp: "2026-01-05T10:00:00.000Z",
        isTemplate: true,
      },
      {
        title: "Mid note",
        timestamp: "2026-01-04T10:00:00.000Z",
        isTemplate: false,
      },
    ]);
  });

  it("sorts by newest timestamp first by default", () => {
    const model = buildModel();
    expect(model.getSort()).toEqual({ column: "timestamp", direction: "desc" });
    expect(titles(model)).toEqual(["alpha draft", "Mid note", "Zebra launch"]);
  });

  it("toggles direction on the active column and starts ascending elsewhere", () => {
    const model = buildModel();
    model.toggleSort("timestamp");
    expect(titles(model)).toEqual(["Zebra launch", "Mid note", "alpha draft"]);
    model.toggleSort("title");
    expect(model.getSort()).toEqual({ column: "title", direction: "asc" });
    expect(titles(model)).toEqual(["alpha draft", "Mid note", "Zebra launch"]);
    model.toggleSort("title");
    expect(titles(model)).toEqual(["Zebra launch", "Mid note", "alpha draft"]);
    model.toggleSort("unknown");
    expect(model.getSort()).toEqual({ column: "title", direction: "desc" });
  });

  it("lists templates first on the initial template sort, then toggles", () => {
    const model = buildModel();
    model.toggleSort("template");
    expect(model.getSort()).toEqual({ column: "template", direction: "desc" });
    expect(titles(model)[0]).toBe("alpha draft");
    model.toggleSort("title");
    model.toggleSort("template");
    expect(model.getSort()).toEqual({ column: "template", direction: "asc" });
    expect(titles(model)[2]).toBe("alpha draft");
  });

  it("filters titles case-insensitively, trims input, and reports counts", () => {
    const model = buildModel();
    expect(model.getCountLabel()).toBe("3");
    model.setFilter("  AL ");
    expect(titles(model)).toEqual(["alpha draft"]);
    expect(model.getCountLabel()).toBe("1/3");
    expect(model.getEmptyMessage()).toBe("");
    model.setFilter("nothing");
    expect(model.getVisibleCount()).toBe(0);
    expect(model.getEmptyMessage()).toBe("No snippets match this search.");
    model.setFilter("");
    expect(model.getCountLabel()).toBe("3");
  });

  it("describes the empty library", () => {
    const model = createSnippetTableModel();
    expect(model.getTotalCount()).toBe(0);
    expect(model.getCountLabel()).toBe("0");
    expect(model.getEmptyMessage()).toBe(
      "No snippets yet. Save the current draft to build your library.",
    );
    expect(model.getPageCount()).toBe(1);
  });

  it("pages results, clamps out-of-range pages, and resets on data or filter changes", () => {
    const model = createSnippetTableModel({ pageSize: 10 });
    const many = Object.fromEntries(
      Array.from({ length: 23 }, (_, index) => [
        `Snippet ${String(index + 1).padStart(2, "0")}`,
        {
          timestamp: `2026-01-${String(index + 1).padStart(2, "0")}T00:00:00Z`,
        },
      ]),
    );
    model.setRows(toSnippetRows(many));

    expect(model.getPageCount()).toBe(3);
    expect(model.getPageRows()).toHaveLength(10);
    model.setPage(3);
    expect(model.getPageRows()).toHaveLength(3);
    model.setPage(99);
    expect(model.getPage()).toBe(3);
    model.setPage(0);
    expect(model.getPage()).toBe(1);

    model.setPage(2);
    model.setFilter("Snippet 2");
    expect(model.getPage()).toBe(1);
    expect(model.getVisibleCount()).toBe(4);

    model.setFilter("");
    model.setPage(3);
    model.setRows(toSnippetRows(snippets));
    expect(model.getPage()).toBe(1);
  });

  it("supports the supported page sizes only", () => {
    const model = buildModel();
    expect(model.getPageSizes()).toEqual([10, 25, 50, 100]);
    model.setPageSize(25);
    expect(model.getPageSize()).toBe(25);
    model.setPageSize(7);
    expect(model.getPageSize()).toBe(25);
    model.setPageSize("50");
    expect(model.getPageSize()).toBe(50);
  });
});
