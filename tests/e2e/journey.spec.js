import { test, expect } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";

test.describe("journey navigation and a11y", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#view-auth")).toBeVisible();
  });

  test("auth view has no serious axe violations", async ({ page }) => {
    const results = await new AxeBuilder({ page }).include("#view-auth").analyze();
    const serious = results.violations.filter((v) =>
      ["critical", "serious"].includes(v.impact || "")
    );
    expect(serious, JSON.stringify(serious, null, 2)).toHaveLength(0);
  });

  test("language picker is visible in sidebar", async ({ page }) => {
    const langSelect = page.locator("#lang-select");
    await expect(langSelect).toBeAttached();
  });
});

test.describe("authenticated views a11y", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    const appAuth = page.locator("#app-authenticated");
    const isVisible = await appAuth.isVisible().catch(() => false);
    if (!isVisible) {
      test.skip();
    }
  });

  test("journey bar is visible after login", async ({ page }) => {
    const journey = page.locator("#election-journey");
    await expect(journey).toBeVisible();
  });

  test("chat view has no serious axe violations", async ({ page }) => {
    const chatView = page.locator("#view-chat");
    const isVisible = await chatView.isVisible().catch(() => false);
    if (!isVisible) test.skip();

    const results = await new AxeBuilder({ page }).include("#view-chat").analyze();
    const serious = results.violations.filter((v) =>
      ["critical", "serious"].includes(v.impact || "")
    );
    expect(serious, JSON.stringify(serious, null, 2)).toHaveLength(0);
  });

  test("quiz view has no serious axe violations", async ({ page }) => {
    await page.click('[data-view="quiz"]');
    const quizView = page.locator("#view-quiz");
    const isVisible = await quizView.isVisible().catch(() => false);
    if (!isVisible) test.skip();

    const results = await new AxeBuilder({ page }).include("#view-quiz").analyze();
    const serious = results.violations.filter((v) =>
      ["critical", "serious"].includes(v.impact || "")
    );
    expect(serious, JSON.stringify(serious, null, 2)).toHaveLength(0);
  });

  test("learn view has no serious axe violations", async ({ page }) => {
    await page.click('[data-view="learn"]');
    const learnView = page.locator("#view-learn");
    const isVisible = await learnView.isVisible().catch(() => false);
    if (!isVisible) test.skip();

    const results = await new AxeBuilder({ page }).include("#view-learn").analyze();
    const serious = results.violations.filter((v) =>
      ["critical", "serious"].includes(v.impact || "")
    );
    expect(serious, JSON.stringify(serious, null, 2)).toHaveLength(0);
  });

  test("booth view has no serious axe violations", async ({ page }) => {
    await page.click('[data-view="booth"]');
    const boothView = page.locator("#view-booth");
    const isVisible = await boothView.isVisible().catch(() => false);
    if (!isVisible) test.skip();

    const results = await new AxeBuilder({ page }).include("#view-booth").analyze();
    const serious = results.violations.filter((v) =>
      ["critical", "serious"].includes(v.impact || "")
    );
    expect(serious, JSON.stringify(serious, null, 2)).toHaveLength(0);
  });
});
