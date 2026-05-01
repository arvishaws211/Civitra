import { describe, it, expect } from "vitest";
import { getElectionTimeline } from "../../src/services/election-timeline.js";

describe("getElectionTimeline", () => {
  it("filters by topic", () => {
    const r = getElectionTimeline("polling");
    expect(r.events.length).toBeGreaterThan(0);
  });
});
