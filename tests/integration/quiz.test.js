import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

vi.mock("../../src/config/firebase.js", () => ({
  db: {},
  bucket: { file: vi.fn().mockReturnValue({ save: vi.fn(), makePublic: vi.fn() }) },
  auth: {},
}));

vi.mock("@google/genai", () => ({
  HarmCategory: {
    HARM_CATEGORY_HATE_SPEECH: "HATE",
    HARM_CATEGORY_HARASSMENT: "HARASSMENT",
    HARM_CATEGORY_DANGEROUS_CONTENT: "DANGEROUS",
    HARM_CATEGORY_SEXUALLY_EXPLICIT: "SEXUAL",
  },
  HarmBlockThreshold: { BLOCK_MEDIUM_AND_ABOVE: "MEDIUM" },
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    models: {
      generateContent: vi.fn().mockResolvedValue({
        text: JSON.stringify([
          {
            id: 1,
            question: "Sample Q?",
            options: ["A", "B", "C", "D"],
            correctIndex: 0,
            explanation: "Because A.",
            topic: "General",
          },
        ]),
      }),
    },
  })),
}));

const { createApp } = await import("../../src/create-app.js");
const app = createApp();

describe("GET /api/quiz/topics", () => {
  it("returns 200 with topics array", async () => {
    const res = await request(app).get("/api/quiz/topics");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.topics)).toBe(true);
    expect(res.body.topics.length).toBeGreaterThan(0);
  });
});

describe("POST /api/quiz/generate", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns 500 when GEMINI_API_KEY is not configured", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    const res = await request(app)
      .post("/api/quiz/generate")
      .send({ topic: "General", difficulty: "Easy" });
    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/key/i);
  });

  it("returns 400 when topic is invalid", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    const res = await request(app).post("/api/quiz/generate").send({ topic: 123 });
    expect(res.status).toBe(400);
  });

  it("returns 400 when difficulty is invalid", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    const res = await request(app)
      .post("/api/quiz/generate")
      .send({ topic: "General", difficulty: true });
    expect(res.status).toBe(400);
  });

  it("returns 200 with questions array on success", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    const res = await request(app)
      .post("/api/quiz/generate")
      .send({ topic: "General", difficulty: "Medium" });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.questions)).toBe(true);
    expect(res.body.questions[0]).toHaveProperty("question");
  });
});
