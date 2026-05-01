import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../../src/create-app.js";

describe("GET /api/health", () => {
  it("returns ok payload", async () => {
    const app = createApp();
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.service).toBe("civitra");
    expect(res.body.timestamp).toBeDefined();
  });
});
