import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../src/services/faq-search.js", () => ({
  lookupElectionFaq: vi.fn().mockResolvedValue([{ question: "Q?", answer: "A." }]),
}));
vi.mock("../../src/services/embedding-faq.js", () => ({
  lookupSemanticFaq: vi
    .fn()
    .mockResolvedValue([{ question: "Semantic Q?", answer: "Semantic A." }]),
}));
vi.mock("../../src/services/translation.js", () => ({
  translateText: vi.fn().mockResolvedValue({ translatedText: "नमस्ते", sourceLanguage: "en" }),
}));
vi.mock("../../src/services/election-timeline.js", () => ({
  getElectionTimeline: vi.fn().mockReturnValue([{ event: "Polling Day", description: "Vote!" }]),
}));
vi.mock("../../src/services/calendar-links.js", () => ({
  buildCalendarDeepLink: vi.fn().mockReturnValue({ url: "https://calendar.google.com/..." }),
}));
vi.mock("../../src/services/natural-language.js", () => ({
  analyzeQueryEntities: vi.fn().mockResolvedValue({ entities: [] }),
}));

import { executeToolCall, civitraToolDeclarations } from "../../src/services/chat-tool-handlers.js";

describe("executeToolCall", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns error for unknown tool", async () => {
    const result = await executeToolCall("unknown_tool_xyz", {});
    expect(result).toHaveProperty("error");
    expect(result.error).toMatch(/Unknown tool/i);
  });

  it("calls lookup_election_faq with query arg", async () => {
    const result = await executeToolCall("lookup_election_faq", { query: "voter registration" });
    expect(Array.isArray(result)).toBe(true);
    expect(result[0]).toHaveProperty("question");
  });

  it("calls lookup_semantic_faq with query arg", async () => {
    const result = await executeToolCall("lookup_semantic_faq", { query: "how to vote" });
    expect(Array.isArray(result)).toBe(true);
    expect(result[0]).toHaveProperty("answer");
  });

  it("calls translate_text with text and target_language args", async () => {
    const result = await executeToolCall("translate_text", {
      text: "hello",
      target_language: "hi",
    });
    expect(result).toHaveProperty("translatedText", "नमस्ते");
  });

  it("calls get_election_timeline with topic_filter", async () => {
    const result = await executeToolCall("get_election_timeline", { topic_filter: "polling" });
    expect(Array.isArray(result)).toBe(true);
    expect(result[0]).toHaveProperty("event");
  });

  it("calls create_calendar_reminder_link with required args", async () => {
    const result = await executeToolCall("create_calendar_reminder_link", {
      title: "Vote Day",
      start_datetime_iso: "2024-11-05T08:00:00Z",
    });
    expect(result).toHaveProperty("url");
  });

  it("calls analyze_voter_query", async () => {
    const result = await executeToolCall("analyze_voter_query", { text: "voter id card" });
    expect(result).toHaveProperty("entities");
  });

  describe("check_voter_eligibility", () => {
    it("returns eligible=true for Indian citizen aged 18+", async () => {
      const result = await executeToolCall("check_voter_eligibility", {
        age: 25,
        is_citizen_of_india: true,
      });
      expect(result.eligible).toBe(true);
    });

    it("returns eligible=false for age < 18", async () => {
      const result = await executeToolCall("check_voter_eligibility", {
        age: 16,
        is_citizen_of_india: true,
      });
      expect(result.eligible).toBe(false);
      expect(result.reason).toMatch(/18/);
    });

    it("returns eligible=false for non-citizen", async () => {
      const result = await executeToolCall("check_voter_eligibility", {
        age: 25,
        is_citizen_of_india: false,
      });
      expect(result.eligible).toBe(false);
    });

    it("returns eligible=false when age is invalid/missing", async () => {
      const result = await executeToolCall("check_voter_eligibility", {
        age: "not-a-number",
        is_citizen_of_india: true,
      });
      expect(result.eligible).toBe(false);
      expect(result.reason).toMatch(/invalid/i);
    });
  });
});

describe("civitraToolDeclarations", () => {
  it("is a non-empty array", () => {
    expect(Array.isArray(civitraToolDeclarations)).toBe(true);
    expect(civitraToolDeclarations.length).toBeGreaterThan(0);
  });

  it("every declaration has a name and description", () => {
    for (const decl of civitraToolDeclarations) {
      expect(typeof decl.name).toBe("string");
      expect(typeof decl.description).toBe("string");
    }
  });
});
