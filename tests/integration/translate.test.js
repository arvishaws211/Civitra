import { describe, it, expect, vi } from "vitest";
import request from "supertest";

vi.mock("../../src/config/firebase.js", () => ({
  db: {},
  bucket: { file: vi.fn().mockReturnValue({ save: vi.fn(), makePublic: vi.fn() }) },
  auth: {},
}));

vi.mock("../../src/services/translation.js", () => ({
  translateText: vi.fn(),
}));

vi.mock("../../src/db/firestore-service.js", () => ({
  firestoreService: {
    getChatHistory: vi.fn().mockResolvedValue([]),
    saveChatMessage: vi.fn().mockResolvedValue(undefined),
    findUserByEmail: vi.fn().mockResolvedValue(null),
    findUserById: vi.fn().mockResolvedValue(null),
    createUser: vi.fn().mockResolvedValue({ lastInsertRowid: "1" }),
    createResetToken: vi.fn().mockResolvedValue(undefined),
    findResetToken: vi.fn().mockResolvedValue(null),
    markTokenUsed: vi.fn().mockResolvedValue(undefined),
    updateProfile: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock("../../src/middleware/auth.js", () => ({
  optionalAuth: (req, _res, next) => next(),
  requireAuth: (req, _res, next) => next(),
  generateToken: vi.fn().mockReturnValue("mock-token"),
  verifyRecaptcha: vi.fn().mockResolvedValue(true),
  verifyToken: vi.fn().mockReturnValue({ userId: "test-user" }),
}));

import { translateText } from "../../src/services/translation.js";

const { createApp } = await import("../../src/create-app.js");
const app = createApp();

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
