export const THEME_KEY = "theme";

const THEMES = new Set(["system", "light", "dark"]);

export const normalizeTheme = (theme) => (THEMES.has(theme) ? theme : "system");

export const loadTheme = (storage) =>
  normalizeTheme(storage.getItem(THEME_KEY));

export const applyTheme = (theme, root = document.documentElement) => {
  const normalizedTheme = normalizeTheme(theme);
  if (normalizedTheme === "system") {
    root.removeAttribute("data-theme");
  } else {
    root.dataset.theme = normalizedTheme;
  }
  return normalizedTheme;
};

export const saveTheme = (theme, storage) => {
  const normalizedTheme = normalizeTheme(theme);
  if (normalizedTheme === "system") {
    storage.removeItem(THEME_KEY);
  } else {
    storage.setItem(THEME_KEY, normalizedTheme);
  }
  return normalizedTheme;
};
