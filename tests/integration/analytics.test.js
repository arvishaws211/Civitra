import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../../src/create-app.js";

describe("POST /api/analytics/event", () => {
  it("rejects missing event", async () => {
    const app = createApp();
    const res = await request(app).post("/api/analytics/event").send({});
    expect(res.status).toBe(400);
  });

  it("accepts anonymised event", async () => {
    const app = createApp();
    const res = await request(app)
      .post("/api/analytics/event")
      .send({ event: "journey_step", meta: { step: 1 } });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});
