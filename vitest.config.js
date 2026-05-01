import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.js", "tests/integration/**/*.test.js"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
      include: ["src/**/*.js"],
      thresholds: {
        statements: 35,
        branches: 25,
        functions: 20,
        lines: 35,
      },
    },
    pool: "forks",
  },
});
