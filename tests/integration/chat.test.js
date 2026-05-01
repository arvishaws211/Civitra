import { describe, it, expect, vi, beforeAll } from "vitest";
import request from "supertest";

vi.mock("../../src/config/firebase.js", () => ({
  db: {},
  bucket: { file: vi.fn().mockReturnValue({ save: vi.fn(), makePublic: vi.fn() }) },
  auth: {},
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

const { createApp } = await import("../../src/create-app.js");

let app;
beforeAll(() => {
  app = createApp();
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
