import { describe, expect, it } from "vitest";

import {
  countSnippetHashtags,
  extractHashtags,
  sortHashtagsByCount,
  sortHashtagsByName,
} from "../src/hashtag-data.js";

describe("hashtag behavior", () => {
  it("preserves matching, case, order, and repeated occurrences", () => {
    expect(extractHashtags("#Azure, #azure #AI #AI hyphen-#tag")).toEqual([
      "#Azure",
      "#azure",
      "#AI",
      "#AI",
      "#tag",
    ]);
  });

  it("counts hashtags across saved snippet operations", () => {
    const snippets = {
      first: { delta: { ops: [{ insert: "#AI text #AI" }] } },
      second: {
        delta: {
          ops: [
            { insert: "#Azure" },
            { insert: "\n", attributes: { list: "bullet" } },
          ],
        },
      },
    };

    expect(countSnippetHashtags(snippets)).toEqual({ "#AI": 2, "#Azure": 1 });
  });

  it("sorts by count with name tie-breaking and by name in either direction", () => {
    const hashtags = { "#Beta": 2, "#Alpha": 2, "#Gamma": 1 };

    expect(sortHashtagsByCount(hashtags)).toEqual([
      ["#Gamma", 1],
      ["#Alpha", 2],
      ["#Beta", 2],
    ]);
    expect(sortHashtagsByName(hashtags, false).map(([tag]) => tag)).toEqual([
      "#Gamma",
      "#Beta",
      "#Alpha",
    ]);
  });
});
