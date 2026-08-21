// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from "vitest";
import {
  applyTheme,
  loadTheme,
  normalizeTheme,
  saveTheme,
  THEME_KEY,
} from "../src/theme.js";

let storage;

beforeEach(() => {
  const values = new Map();
  storage = {
    getItem: (key) => values.get(key) ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, value),
  };
  document.documentElement.removeAttribute("data-theme");
});

describe("theme preferences", () => {
  it("defaults missing and invalid preferences to system", () => {
    expect(loadTheme(storage)).toBe("system");
    expect(normalizeTheme("unexpected")).toBe("system");
  });

  it("applies explicit themes and removes the override for system", () => {
    applyTheme("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");

    applyTheme("system");
    expect(document.documentElement.hasAttribute("data-theme")).toBe(false);
  });

  it("persists explicit themes and clears storage for system", () => {
    saveTheme("light", storage);
    expect(storage.getItem(THEME_KEY)).toBe("light");

    saveTheme("system", storage);
    expect(storage.getItem(THEME_KEY)).toBeNull();
  });
});
