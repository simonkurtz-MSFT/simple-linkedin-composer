import { describe, expect, it } from "vitest";

import {
  createSnippetExport,
  importSnippets,
  loadStoredSnippets,
  parseSnippet,
} from "../src/snippet-data.js";

const createStorage = (initialEntries = {}) => {
  const entries = { ...initialEntries };

  return {
    get length() {
      return Object.keys(entries).length;
    },
    getItem: (key) => entries[key] ?? null,
    key: (index) => Object.keys(entries)[index] ?? null,
    removeItem: (key) => delete entries[key],
    setItem: (key, value) => {
      entries[key] = String(value);
    },
    toJSON: () => ({ ...entries }),
    ...entries,
  };
};

const snippet = (timestamp, insert = "Hello #linkedIn\n") => ({
  delta: { ops: [{ insert }] },
  timestamp,
  isTemplate: false,
});

describe("snippet validation and persistence", () => {
  it("accepts the existing exported snippet shape and constrained Quill formatting", () => {
    expect(
      parseSnippet({
        delta: {
          ops: [
            { insert: "Hello ", attributes: { bold: true } },
            { insert: "site", attributes: { link: "https://example.com" } },
            { insert: "\n", attributes: { list: "bullet" } },
          ],
        },
        timestamp: "2026-08-19T10:00:00.000Z",
        isTemplate: true,
      }),
    ).not.toBeNull();
  });

  it("loads valid snippets while preserving malformed and unrelated storage entries", () => {
    const validSnippet = snippet("2026-08-19T10:00:00.000Z");
    const storage = createStorage({
      "snippet-valid": JSON.stringify(validSnippet),
      "snippet-corrupt": "{not json",
      linkedin_id: "profile-id",
    });

    const result = loadStoredSnippets(storage);

    expect(result.snippets).toEqual({ valid: validSnippet });
    expect(result.invalidKeys).toEqual(["snippet-corrupt"]);
    expect(storage.getItem("snippet-corrupt")).toBe("{not json");
    expect(storage.getItem("linkedin_id")).toBe("profile-id");
  });

  it("loads legacy snippets without a template flag as non-templates", () => {
    const legacySnippet = {
      delta: { ops: [{ insert: "Legacy\n" }] },
      timestamp: "2024-01-01T00:00:00.000Z",
    };
    const storage = createStorage({
      "snippet-legacy": JSON.stringify(legacySnippet),
    });

    expect(loadStoredSnippets(storage).snippets.legacy).toEqual({
      ...legacySnippet,
      isTemplate: false,
    });
  });

  it("exports only valid snippets using the legacy nested JSON-string format", () => {
    const storedSnippet = JSON.stringify(snippet("2026-08-19T10:00:00.000Z"));
    const storage = createStorage({
      "snippet-valid": storedSnippet,
      "snippet-corrupt": "null",
      hashtags: '{"#test":1}',
    });

    expect(createSnippetExport(storage)).toEqual({
      "snippet-valid": storedSnippet,
    });
  });
});

describe("snippet import deduplication", () => {
  it("imports new and newer records while skipping duplicate, older, and invalid entries", () => {
    const storage = createStorage({
      "snippet-newer": JSON.stringify(
        snippet("2026-08-19T10:00:00.000Z", "old"),
      ),
      "snippet-duplicate": JSON.stringify(snippet("2026-08-19T10:00:00.000Z")),
      "snippet-older": JSON.stringify(
        snippet("2026-08-19T10:00:00.000Z", "keep"),
      ),
      "snippet-corrupt": "{not json",
    });
    const importedNewer = snippet("2026-08-20T10:00:00.000Z", "new");
    const importedData = {
      "snippet-new": JSON.stringify(snippet("2026-08-19T11:00:00.000Z")),
      "snippet-newer": JSON.stringify(importedNewer),
      "snippet-duplicate": JSON.stringify(snippet("2026-08-19T10:00:00.000Z")),
      "snippet-older": JSON.stringify(snippet("2026-08-18T10:00:00.000Z")),
      "snippet-corrupt": JSON.stringify(snippet("2026-08-19T12:00:00.000Z")),
      settings: { theme: "remote" },
    };

    expect(importSnippets(JSON.stringify(importedData), storage)).toEqual({
      imported: 3,
      duplicate: 1,
      older: 1,
      invalid: 1,
    });
    expect(JSON.parse(storage.getItem("snippet-newer"))).toEqual(importedNewer);
    expect(storage.getItem("snippet-older")).toContain("keep");
    expect(storage.getItem("settings")).toBeNull();
  });

  it("rejects malformed top-level JSON without changing storage", () => {
    const storage = createStorage({ "snippet-existing": "preserve" });

    expect(() => importSnippets("[]", storage)).toThrow(
      "The import file must contain a snippet object.",
    );
    expect(storage.getItem("snippet-existing")).toBe("preserve");
  });
});
