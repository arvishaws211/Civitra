import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import { createApp } from "../../src/create-app.js";

vi.mock("../../src/services/translation.js", () => ({
  translateText: vi.fn(),
}));

vi.mock("../../src/db/firestore-service.js", () => ({
  firestoreService: {},
}));

vi.mock("../../src/middleware/auth.js", () => ({
  optionalAuth: (req, _res, next) => next(),
}));

import { translateText } from "../../src/services/translation.js";

const app = createApp({ staticRoot: undefined });

describe("POST /api/translate", () => {
  it("returns 400 when target is missing", async () => {
    const res = await request(app)
      .post("/api/translate")
      .send({ texts: ["hello"] });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/target/i);
  });

  it("returns 400 when texts is missing", async () => {
    const res = await request(app).post("/api/translate").send({ target: "hi" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/texts/i);
  });

  it("returns translated results when service succeeds", async () => {
    translateText.mockResolvedValue({
      translatedText: "नमस्ते",
      sourceLanguage: "en",
      cached: false,
      fallback: false,
    });

    const res = await request(app)
      .post("/api/translate")
      .send({ texts: ["hello"], target: "hi" });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.translations).toHaveLength(1);
    expect(res.body.translations[0].translatedText).toBe("नमस्ते");
    expect(res.body.fallback).toBe(false);
  });

  it("returns fallback flag when translation service is unavailable", async () => {
    translateText.mockResolvedValue({
      translatedText: "hello",
      sourceLanguage: "und",
      fallback: true,
    });

    const res = await request(app)
      .post("/api/translate")
      .send({ texts: ["hello"], target: "hi" });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.fallback).toBe(true);
  });
});
