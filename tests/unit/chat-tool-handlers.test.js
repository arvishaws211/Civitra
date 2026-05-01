import { describe, it, expect } from "vitest";
import { executeToolCall } from "../../src/services/chat-tool-handlers.js";

describe("executeToolCall", () => {
  it("check_voter_eligibility rejects under 18", async () => {
    const r = await executeToolCall("check_voter_eligibility", {
      age: 16,
      is_citizen_of_india: true,
    });
    expect(r.eligible).toBe(false);
  });

  it("check_voter_eligibility accepts 18+ citizen", async () => {
    const r = await executeToolCall("check_voter_eligibility", {
      age: 21,
      is_citizen_of_india: true,
    });
    expect(r.eligible).toBe(true);
  });

  it("get_election_timeline returns events", async () => {
    const r = await executeToolCall("get_election_timeline", { topic_filter: "" });
    expect(r.events.length).toBeGreaterThan(0);
  });
});
