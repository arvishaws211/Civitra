import { describe, it, expect, beforeEach, afterEach } from "vitest";
import request from "supertest";
import { createApp } from "../../src/create-app.js";

describe("booth API", () => {
  let prevMaps;

  beforeEach(() => {
    prevMaps = process.env.MAPS_API_KEY;
  });

  afterEach(() => {
    if (prevMaps === undefined) delete process.env.MAPS_API_KEY;
    else process.env.MAPS_API_KEY = prevMaps;
  });

  it("returns 500 when maps key missing", async () => {
    delete process.env.MAPS_API_KEY;
    const app = createApp();
    const res = await request(app).get("/api/booth/maps-key");
    expect(res.status).toBe(500);
    expect(res.body.error).toBeDefined();
  });

  it("returns ECI links", async () => {
    const app = createApp();
    const res = await request(app).get("/api/booth/eci-links");
    expect(res.status).toBe(200);
    expect(res.body.voterSearch).toContain("eci");
  });
});
