import { describe, it, expect } from "vitest";
import { lookupElectionFaq } from "../../src/services/faq-search.js";

describe("lookupElectionFaq", () => {
  it("returns NOTA-related matches", () => {
    const { matches, method } = lookupElectionFaq("what is NOTA");
    expect(method).toBe("keyword");
    expect(matches.some((m) => m.id === "nota")).toBe(true);
  });

  it("returns defaults for empty query", () => {
    const { matches } = lookupElectionFaq("");
    expect(matches.length).toBeGreaterThan(0);
  });
});
