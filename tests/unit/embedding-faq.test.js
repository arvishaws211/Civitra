import { describe, it, expect, vi, beforeEach } from "vitest";
import { cosineSimilarity } from "../../src/services/embedding-faq.js";

vi.mock("fs", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, existsSync: vi.fn(actual.existsSync) };
});

vi.mock("../../src/services/faq-search.js", () => ({
  lookupElectionFaq: vi.fn(() => ({ matches: [], method: "keyword" })),
}));

describe("cosineSimilarity", () => {
  it("returns 1 for identical vectors", () => {
    expect(cosineSimilarity([1, 2, 3], [1, 2, 3])).toBeCloseTo(1);
  });

  it("returns 0 for orthogonal vectors", () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0);
  });

  it("returns -1 for opposite vectors", () => {
    expect(cosineSimilarity([1, 0], [-1, 0])).toBeCloseTo(-1);
  });

  it("returns 0 for zero-length vectors", () => {
    expect(cosineSimilarity([0, 0], [0, 0])).toBe(0);
    expect(cosineSimilarity([], [])).toBe(0);
  });
});

describe("lookupSemanticFaq", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("falls back to keyword search when GEMINI_API_KEY is not set", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    const { lookupSemanticFaq } = await import("../../src/services/embedding-faq.js");
    const result = await lookupSemanticFaq("voting age");
    expect(result.method).toBe("keyword_fallback");
  });

  it("falls back when embeddings cache file does not exist", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    const fs = await import("fs");
    vi.mocked(fs.existsSync).mockReturnValue(false);
    const { lookupSemanticFaq } = await import("../../src/services/embedding-faq.js");
    const result = await lookupSemanticFaq("voting age");
    expect(result.method).toBe("keyword_fallback");
  });
});
