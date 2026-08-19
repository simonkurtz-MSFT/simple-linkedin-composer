import { describe, expect, it } from "vitest";

import {
  appendComposerAttribution,
  convertDocumentToLinkedInText,
  convertSemanticHtmlToLinkedInText,
  getStyledUnicode,
  styleText,
} from "../src/post-conversion.js";

const text = (textContent) => ({ nodeType: 3, textContent });
const element = (tagName, ...childNodes) => ({
  nodeType: 1,
  tagName,
  childNodes,
});

describe("post Unicode formatting", () => {
  it("preserves the established plain, bold, italic, and bold-italic mappings", () => {
    expect(styleText("Ab9")).toBe("𝖠𝖻𝟫");
    expect(styleText("Ab9", true)).toBe("𝐀𝐛𝟗");
    expect(styleText("Ah9", false, true)).toBe("𝐴ℎ𝟫");
    expect(styleText("Ab9", true, true)).toBe("𝑨𝒃𝟗");
  });

  it("leaves punctuation, emoji, and non-Latin characters unchanged", () => {
    expect(getStyledUnicode("#", true, true)).toBe("#");
    expect(getStyledUnicode("😀", true, true)).toBe("😀");
    expect(getStyledUnicode("é", true, true)).toBe("é");
  });
});

describe("semantic post conversion", () => {
  it("converts paragraphs and nested formatting to LinkedIn-safe Unicode", () => {
    const document = {
      body: element(
        "BODY",
        element(
          "P",
          text("Plain "),
          element("STRONG", text("Bold "), element("EM", text("Both"))),
        ),
      ),
    };

    expect(convertDocumentToLinkedInText(document)).toBe("𝖯𝗅𝖺𝗂𝗇 𝐁𝐨𝐥𝐝 𝑩𝒐𝒕𝒉\n");
  });

  it("converts ordered and bullet lists using the established indentation", () => {
    const document = {
      body: element(
        "BODY",
        element(
          "OL",
          element("LI", text("First")),
          element("LI", text("Second")),
        ),
        element("UL", element("LI", text("Third"))),
      ),
    };

    expect(convertDocumentToLinkedInText(document)).toBe(
      "   1. 𝖥𝗂𝗋𝗌𝗍\n   2. 𝖲𝖾𝖼𝗈𝗇𝖽\n   • 𝖳𝗁𝗂𝗋𝖽\n",
    );
  });

  it("preserves explicit link text and visible URLs", () => {
    const document = {
      body: element(
        "BODY",
        element(
          "P",
          element("A", text("LinkedIn")),
          text(" https://example.com/path"),
        ),
      ),
    };

    expect(convertDocumentToLinkedInText(document)).toBe(
      "LinkedIn https://example.com/path\n",
    );
  });

  it("produces the complete clipboard output and normalizes semantic HTML entities", () => {
    const document = { body: element("BODY", element("P", text("It's fine"))) };
    let parsedHtml;

    const result = convertSemanticHtmlToLinkedInText(
      " <p>It&#39;s&nbsp;fine</p> ",
      (html) => {
        parsedHtml = html;
        return document;
      },
    );

    expect(parsedHtml).toBe("<p>It's fine</p>");
    expect(result).toBe(
      "𝖨𝗍'𝗌 𝖿𝗂𝗇𝖾\n\n\n✒️ Post written in Simple LinkedIn Composer. ✒️\nhttps://linkedin-composer.simondoescloud.com",
    );
  });

  it("does not append the composer attribution twice", () => {
    const existing = "Draft\n✒️ existing attribution";
    expect(appendComposerAttribution(existing)).toBe(existing);
  });
});
