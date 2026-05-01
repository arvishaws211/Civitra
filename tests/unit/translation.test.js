import { describe, it, expect, vi, beforeEach } from "vitest";

describe("translateText", () => {
  let translateText; // eslint-disable-line no-unused-vars

  beforeEach(async () => {
    vi.resetModules();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    const mod = await import("../../src/services/translation.js");
    translateText = mod.translateText;
  });

  it("returns fallback when no API key is set", async () => {
    vi.stubEnv("TRANSLATION_API_KEY", "");
    vi.stubEnv("GOOGLE_TRANSLATION_API_KEY", "");
    const mod = await import("../../src/services/translation.js");
    const result = await mod.translateText("hello", "hi");
    expect(result).toMatchObject({ translatedText: "hello", fallback: true });
  });

  it("returns fallback when text is empty", async () => {
    vi.stubEnv("TRANSLATION_API_KEY", "test-key");
    const mod = await import("../../src/services/translation.js");
    const result = await mod.translateText("", "hi");
    expect(result).toMatchObject({ translatedText: "", fallback: false });
    expect(result.cached).toBe(false);
  });

  it("calls fetch and returns translated text on success", async () => {
    vi.stubEnv("TRANSLATION_API_KEY", "test-key");
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          translations: [{ translatedText: "नमस्ते", detectedSourceLanguage: "en" }],
        },
      }),
    });
    const mod = await import("../../src/services/translation.js");
    const result = await mod.translateText("hello", "hi");
    expect(spy).toHaveBeenCalledOnce();
    expect(result).toMatchObject({
      translatedText: "नमस्ते",
      sourceLanguage: "en",
      cached: false,
      fallback: false,
    });
  });

  it("returns cached result on second call with same args", async () => {
    vi.stubEnv("TRANSLATION_API_KEY", "test-key");
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          translations: [{ translatedText: "नमस्ते", detectedSourceLanguage: "en" }],
        },
      }),
    });
    const mod = await import("../../src/services/translation.js");
    await mod.translateText("hello", "hi");
    const result = await mod.translateText("hello", "hi");
    expect(spy).toHaveBeenCalledOnce();
    expect(result.cached).toBe(true);
  });

  it("returns fallback on HTTP error status", async () => {
    vi.stubEnv("TRANSLATION_API_KEY", "test-key");
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 500,
    });
    const mod = await import("../../src/services/translation.js");
    const result = await mod.translateText("hello", "hi");
    expect(result).toMatchObject({ translatedText: "hello", fallback: true });
  });

  it("returns fallback on network error", async () => {
    vi.stubEnv("TRANSLATION_API_KEY", "test-key");
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network down"));
    const mod = await import("../../src/services/translation.js");
    const result = await mod.translateText("hello", "hi");
    expect(result).toMatchObject({ translatedText: "hello", fallback: true });
  });
});
