import { describe, it, expect } from "vitest";
import { buildCalendarDeepLink } from "../../src/services/calendar-links.js";

describe("buildCalendarDeepLink", () => {
  it("returns a Google Calendar template URL", () => {
    const { url } = buildCalendarDeepLink({
      title: "Test reminder",
      start: "2026-05-15T09:00:00.000Z",
      details: "Verify on ECI",
    });
    expect(url).toContain("calendar.google.com");
    expect(url).toContain("action=TEMPLATE");
  });
});
