import { test, expect } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";

test.describe("smoke and a11y", () => {
  test("landing auth view is visible", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#view-auth")).toBeVisible();
  });

  test("no serious axe violations on auth view", async ({ page }) => {
    await page.goto("/");
    const results = await new AxeBuilder({ page }).include("#view-auth").analyze();
    const serious = results.violations.filter((v) =>
      ["critical", "serious"].includes(v.impact || "")
    );
    expect(serious, JSON.stringify(serious, null, 2)).toHaveLength(0);
  });
});
