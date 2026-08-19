export const SNIPPET_KEY_PREFIX = "snippet-";

const allowedSnippetKeys = new Set(["delta", "timestamp", "isTemplate"]);
const allowedOperationKeys = new Set(["insert", "attributes"]);
const allowedAttributeKeys = new Set(["bold", "italic", "list", "link"]);

const isPlainObject = (value) =>
  value !== null &&
  typeof value === "object" &&
  !Array.isArray(value) &&
  Object.getPrototypeOf(value) === Object.prototype;

const hasOnlyKeys = (value, allowedKeys) =>
  Object.keys(value).every((key) => allowedKeys.has(key));

const isValidAttributes = (attributes) => {
  if (
    !isPlainObject(attributes) ||
    !hasOnlyKeys(attributes, allowedAttributeKeys)
  ) {
    return false;
  }

  return Object.entries(attributes).every(([key, value]) => {
    if (key === "bold" || key === "italic") {
      return value === true;
    }
    if (key === "list") {
      return value === "ordered" || value === "bullet";
    }
    if (key === "link") {
      if (typeof value !== "string") {
        return false;
      }

      try {
        const protocol = new URL(value).protocol;
        return protocol === "https:" || protocol === "http:";
      } catch {
        return false;
      }
    }
    return false;
  });
};

const isValidDelta = (delta) =>
  isPlainObject(delta) &&
  hasOnlyKeys(delta, new Set(["ops"])) &&
  Array.isArray(delta.ops) &&
  delta.ops.every(
    (operation) =>
      isPlainObject(operation) &&
      hasOnlyKeys(operation, allowedOperationKeys) &&
      typeof operation.insert === "string" &&
      (operation.attributes === undefined ||
        isValidAttributes(operation.attributes)),
  );

export const isSnippetKey = (key) => {
  if (typeof key !== "string" || !key.startsWith(SNIPPET_KEY_PREFIX)) {
    return false;
  }

  const title = key.slice(SNIPPET_KEY_PREFIX.length);
  return title.length > 0 && title.length <= 50;
};

export const parseSnippet = (value) => {
  let candidate = value;

  if (typeof candidate === "string") {
    try {
      candidate = JSON.parse(candidate);
    } catch {
      return null;
    }
  }

  if (
    !isPlainObject(candidate) ||
    !hasOnlyKeys(candidate, allowedSnippetKeys) ||
    !isValidDelta(candidate.delta) ||
    typeof candidate.timestamp !== "string" ||
    Number.isNaN(Date.parse(candidate.timestamp)) ||
    (candidate.isTemplate !== undefined &&
      typeof candidate.isTemplate !== "boolean")
  ) {
    return null;
  }

  return {
    ...candidate,
    isTemplate: candidate.isTemplate === true,
  };
};

export const loadStoredSnippets = (storage) => {
  const snippets = {};
  const invalidKeys = [];

  Object.keys(storage)
    .filter((key) => key.startsWith(SNIPPET_KEY_PREFIX))
    .forEach((key) => {
      const snippet = isSnippetKey(key)
        ? parseSnippet(storage.getItem(key))
        : null;

      if (snippet) {
        snippets[key.slice(SNIPPET_KEY_PREFIX.length)] = snippet;
      } else {
        invalidKeys.push(key);
      }
    });

  return { snippets, invalidKeys };
};

export const createSnippetExport = (storage) => {
  const exportedData = {};

  Object.keys(storage)
    .filter(isSnippetKey)
    .forEach((key) => {
      const storedValue = storage.getItem(key);
      if (parseSnippet(storedValue)) {
        exportedData[key] = storedValue;
      }
    });

  return exportedData;
};

export const importSnippets = (content, storage) => {
  let importedData;

  try {
    importedData = typeof content === "string" ? JSON.parse(content) : content;
  } catch {
    throw new TypeError("The import file must contain valid JSON.");
  }

  if (!isPlainObject(importedData)) {
    throw new TypeError("The import file must contain a snippet object.");
  }

  const result = { imported: 0, duplicate: 0, older: 0, invalid: 0 };

  Object.entries(importedData).forEach(([key, value]) => {
    const importedSnippet = isSnippetKey(key) ? parseSnippet(value) : null;
    if (!importedSnippet) {
      result.invalid += 1;
      return;
    }

    const existingSnippet = parseSnippet(storage.getItem(key));
    if (existingSnippet) {
      const existingTimestamp = Date.parse(existingSnippet.timestamp);
      const importedTimestamp = Date.parse(importedSnippet.timestamp);

      if (existingTimestamp === importedTimestamp) {
        result.duplicate += 1;
        return;
      }
      if (existingTimestamp > importedTimestamp) {
        result.older += 1;
        return;
      }
    }

    storage.setItem(key, JSON.stringify(importedSnippet));
    result.imported += 1;
  });

  return result;
};
