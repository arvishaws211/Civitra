import js from "@eslint/js";
import globals from "globals";
import eslintConfigPrettier from "eslint-config-prettier";

export default [
  {
    ignores: ["node_modules/**", "coverage/**", "playwright-report/**", "test-results/**"],
  },
  js.configs.recommended,
  eslintConfigPrettier,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: { ...globals.node },
    },
    rules: {
      "no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "no-console": "error",
    },
  },
  {
    files: ["public/js/**/*.js"],
    languageOptions: {
      globals: {
        ...globals.browser,
        google: "readonly",
        marked: "readonly",
        grecaptcha: "readonly",
      },
    },
  },
  {
    files: ["tests/**/*.js"],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
];
