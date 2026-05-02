import { test, expect, request as apiRequest } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";

test.describe("smoke and a11y", () => {
  test("landing auth view is visible", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#view-auth")).toBeVisible();
  });

  test("page title contains Civitra", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Civitra/i);
  });

  test("no serious axe violations on auth view", async ({ page }) => {
    await page.goto("/");
    const results = await new AxeBuilder({ page }).include("#view-auth").analyze();
    const serious = results.violations.filter((v) =>
      ["critical", "serious"].includes(v.impact || "")
    );
    expect(serious, JSON.stringify(serious, null, 2)).toHaveLength(0);
  });

  test("skip-to-content link is present in DOM", async ({ page }) => {
    await page.goto("/");
    const skip = page.locator("a.skip-link");
    await expect(skip).toBeAttached();
  });
});

test.describe("API health checks", () => {
  test("GET /api/health returns ok", async ({ baseURL }) => {
    const ctx = await apiRequest.newContext({ baseURL });
    const res = await ctx.get("/api/health");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.service).toBe("civitra");
    expect(body.timestamp).toBeDefined();
    await ctx.dispose();
  });

  test("GET /api/config returns recaptchaSiteKey", async ({ baseURL }) => {
    const ctx = await apiRequest.newContext({ baseURL });
    const res = await ctx.get("/api/config");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("recaptchaSiteKey");
    await ctx.dispose();
  });

  test("GET /api/manifesto/parties returns party lists", async ({ baseURL }) => {
    const ctx = await apiRequest.newContext({ baseURL });
    const res = await ctx.get("/api/manifesto/parties");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.national)).toBe(true);
    expect(Array.isArray(body.regional)).toBe(true);
    await ctx.dispose();
  });

  test("security headers are present", async ({ baseURL }) => {
    const ctx = await apiRequest.newContext({ baseURL });
    const res = await ctx.get("/api/health");
    expect(res.headers()["x-content-type-options"]).toBe("nosniff");
    expect(res.headers()["x-frame-options"]).toBe("DENY");
    expect(res.headers()["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    await ctx.dispose();
  });
});
