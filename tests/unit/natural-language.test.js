import { describe, it, expect, vi, beforeEach } from "vitest";

describe("analyzeQueryEntities", () => {
  let analyzeQueryEntities; // eslint-disable-line no-unused-vars

  beforeEach(async () => {
    vi.resetModules();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    const mod = await import("../../src/services/natural-language.js");
    analyzeQueryEntities = mod.analyzeQueryEntities;
  });

  it("returns fallback when no API key is set", async () => {
    vi.stubEnv("NATURAL_LANGUAGE_API_KEY", "");
    vi.stubEnv("CLOUD_NL_API_KEY", "");
    const mod = await import("../../src/services/natural-language.js");
    const result = await mod.analyzeQueryEntities("Who is the PM?");
    expect(result).toMatchObject({ entities: [], fallback: true });
  });

  it("returns fallback when text is empty", async () => {
    vi.stubEnv("NATURAL_LANGUAGE_API_KEY", "test-key");
    const mod = await import("../../src/services/natural-language.js");
    const result = await mod.analyzeQueryEntities("");
    expect(result).toMatchObject({ entities: [], fallback: true });
  });

  it("calls fetch and returns entities on success", async () => {
    vi.stubEnv("NATURAL_LANGUAGE_API_KEY", "test-key");
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        entities: [
          { name: "India", type: "LOCATION", salience: 0.9 },
          { name: "PM", type: "PERSON", salience: 0.5 },
        ],
        language: "en",
      }),
    });
    const mod = await import("../../src/services/natural-language.js");
    const result = await mod.analyzeQueryEntities("Who is the PM of India?");
    expect(result.fallback).toBe(false);
    expect(result.language).toBe("en");
    expect(result.entities).toHaveLength(2);
    expect(result.entities[0]).toMatchObject({ name: "India", type: "LOCATION" });
  });

  it("returns fallback on HTTP error", async () => {
    vi.stubEnv("NATURAL_LANGUAGE_API_KEY", "test-key");
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 500,
    });
    const mod = await import("../../src/services/natural-language.js");
    const result = await mod.analyzeQueryEntities("test query");
    expect(result).toMatchObject({ entities: [], fallback: true });
  });

  it("returns fallback on network error", async () => {
    vi.stubEnv("NATURAL_LANGUAGE_API_KEY", "test-key");
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network down"));
    const mod = await import("../../src/services/natural-language.js");
    const result = await mod.analyzeQueryEntities("test query");
    expect(result).toMatchObject({ entities: [], fallback: true });
  });
});
