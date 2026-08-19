const generateUnicodeMap = (baseCodePoint) => {
  const map = {};

  for (let index = 0; index < 26; index += 1) {
    map[String.fromCharCode(65 + index)] = String.fromCodePoint(
      baseCodePoint + index,
    );
    map[String.fromCharCode(97 + index)] = String.fromCodePoint(
      baseCodePoint + 26 + index,
    );
  }

  return map;
};

const generateDigitUnicodeMap = (baseCodePoint) => {
  const map = {};

  for (let index = 0; index < 10; index += 1) {
    map[String.fromCharCode(48 + index)] = String.fromCodePoint(
      baseCodePoint + index,
    );
  }

  return map;
};

const latinToMathSansSerif = generateUnicodeMap(0x1d5a0);
const latinToMathBold = generateUnicodeMap(0x1d400);
const latinToMathItalic = generateUnicodeMap(0x1d434);
const latinToMathBoldItalic = generateUnicodeMap(0x1d468);
const digitsToMathSansSerif = generateDigitUnicodeMap(0x1d7e2);
const digitsToMathBold = generateDigitUnicodeMap(0x1d7ce);

latinToMathItalic.h = "ℎ";

export const getStyledUnicode = (character, isBold, isItalic) => {
  if (/[A-Za-z]/.test(character)) {
    if (isBold && isItalic) {
      return latinToMathBoldItalic[character] || character;
    }
    if (isBold) {
      return latinToMathBold[character] || character;
    }
    if (isItalic) {
      return latinToMathItalic[character] || character;
    }
    return latinToMathSansSerif[character] || character;
  }

  if (/[0-9]/.test(character)) {
    return isBold
      ? digitsToMathBold[character] || character
      : digitsToMathSansSerif[character] || character;
  }

  return character;
};

export const styleText = (text, isBold = false, isItalic = false) =>
  Array.from(text)
    .map((character) => getStyledUnicode(character, isBold, isItalic))
    .join("");

const attribution =
  "✒️ Post written in Simple LinkedIn Composer. Always free, never tracked. ✒️\n" +
  "https://linkedin-composer.simondoescloud.com";

const renderTextNode = (node, formatting) => {
  const text = node.textContent ?? "";
  if (formatting.preserveText || /https?:\/\/[^\s]+/.test(text)) {
    return text;
  }

  return styleText(text, formatting.bold, formatting.italic);
};

const renderChildren = (node, formatting) =>
  Array.from(node.childNodes ?? [])
    .map((child) => renderNode(child, formatting))
    .join("");

const renderList = (node, formatting, ordered) =>
  Array.from(node.childNodes ?? [])
    .filter((child) => child.nodeType === 1 && child.tagName === "LI")
    .map((item, index) => {
      const marker = ordered ? `${index + 1}.` : "•";
      return `   ${marker} ${renderChildren(item, formatting).trim()}\n`;
    })
    .join("");

const renderNode = (node, formatting) => {
  if (node.nodeType === 3) {
    return renderTextNode(node, formatting);
  }
  if (node.nodeType !== 1) {
    return "";
  }

  const tagName = node.tagName;
  if (tagName === "UL" || tagName === "OL") {
    return renderList(node, formatting, tagName === "OL");
  }
  if (tagName === "BR") {
    return "\n";
  }

  const childFormatting = {
    bold: formatting.bold || tagName === "B" || tagName === "STRONG",
    italic: formatting.italic || tagName === "I" || tagName === "EM",
    preserveText: formatting.preserveText || tagName === "A",
  };
  const text = renderChildren(node, childFormatting);

  return tagName === "P" ? `${text}\n` : text;
};

export const convertDocumentToLinkedInText = (document) =>
  renderChildren(document.body, {
    bold: false,
    italic: false,
    preserveText: false,
  });

export const appendComposerAttribution = (text) =>
  text.includes("✒️") ? text : `${text}\n\n${attribution}`;

export const convertSemanticHtmlToLinkedInText = (
  semanticHtml,
  parseHtml = (html) => new DOMParser().parseFromString(html, "text/html"),
) => {
  const normalizedHtml = semanticHtml
    .trim()
    .replaceAll("<p>&nbsp;</p>", "<p></p>")
    .replaceAll("&nbsp;", " ")
    .replaceAll("&#39;", "'")
    .replaceAll("&quot;", '"');
  const document = parseHtml(normalizedHtml);

  return appendComposerAttribution(convertDocumentToLinkedInText(document));
};
