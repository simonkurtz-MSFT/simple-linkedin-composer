import eslint from "@eslint/js";
import globals from "globals";

export default [
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "playwright-report/**",
      "test-results/**",
    ],
  },
  eslint.configs.recommended,
  {
    files: ["src/**/*.js"],
    languageOptions: {
      globals: {
        ...globals.browser,
        $: "readonly",
        Quill: "readonly",
        toastr: "readonly",
      },
    },
  },
  {
    files: ["*.config.js", "scripts/**/*.mjs", "tests/**/*.js"],
    languageOptions: {
      globals: globals.node,
    },
  },
];
