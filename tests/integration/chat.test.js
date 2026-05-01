import { describe, it, expect, vi, beforeAll } from "vitest";
import request from "supertest";
import { createApp } from "../../src/create-app.js";

vi.mock("../../src/db/firestore-service.js", () => ({
  firestoreService: {
    getChatHistory: vi.fn().mockResolvedValue([]),
    saveChatMessage: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock("../../src/middleware/auth.js", () => ({
  optionalAuth: (req, _res, next) => next(),
}));

let app;
beforeAll(() => {
  app = createApp({ staticRoot: undefined });
});

describe("POST /api/chat", () => {
  it("returns 400 when message is empty", async () => {
    const res = await request(app).post("/api/chat").send({ message: "", sessionId: "test" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/message/i);
  });

  it("returns 500 when GEMINI_API_KEY is not set", async () => {
    const saved = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    try {
      const res = await request(app)
        .post("/api/chat")
        .send({ message: "hello", sessionId: "test" });
      expect(res.status).toBe(500);
      expect(res.body.error).toMatch(/api key/i);
    } finally {
      if (saved !== undefined) process.env.GEMINI_API_KEY = saved;
    }
  });
});
