import { describe, it, expect, vi, beforeEach } from "vitest";
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
    createUser: vi.fn().mockResolvedValue({ id: "user-1" }),
    createResetToken: vi.fn().mockResolvedValue(undefined),
    findResetToken: vi.fn().mockResolvedValue(null),
    markTokenUsed: vi.fn().mockResolvedValue(undefined),
    updateProfile: vi.fn().mockResolvedValue(undefined),
    saveVotingPlan: vi.fn().mockResolvedValue(undefined),
    getVotingPlans: vi.fn().mockResolvedValue([]),
    getChatSessions: vi.fn().mockResolvedValue([]),
  },
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
        text: JSON.stringify({
          title: "Manifesto Comparison",
          disclaimer: "Educational purposes only.",
          comparisons: [
            {
              issue: "Economy",
              positions: [
                { party: "BJP", stance: "Pro-business", keyPromises: ["Lower taxes"] },
                { party: "INC", stance: "Welfare focus", keyPromises: ["NREGA expansion"] },
              ],
            },
          ],
          sources: ["BJP Manifesto 2024", "INC Manifesto 2024"],
        }),
      }),
    },
  })),
}));

const { createApp } = await import("../../src/create-app.js");
const app = createApp();

describe("GET /api/manifesto/parties", () => {
  it("returns 200 with national and regional arrays", async () => {
    const res = await request(app).get("/api/manifesto/parties");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.national)).toBe(true);
    expect(Array.isArray(res.body.regional)).toBe(true);
    expect(res.body.national.length).toBeGreaterThan(0);
    expect(res.body.disclaimer).toMatch(/non-partisan/i);
  });
});

describe("POST /api/manifesto/compare", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns 500 when GEMINI_API_KEY is not configured", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    const res = await request(app)
      .post("/api/manifesto/compare")
      .send({ parties: ["BJP", "INC"], issues: ["Economy"] });
    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/key/i);
  });

  it("returns 400 when fewer than 2 parties are provided", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    const res = await request(app)
      .post("/api/manifesto/compare")
      .send({ parties: ["BJP"], issues: ["Economy"] });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/2 parties/i);
  });

  it("returns 400 when parties array is empty", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    const res = await request(app).post("/api/manifesto/compare").send({ parties: [] });
    expect(res.status).toBe(400);
  });

  it("returns 200 with comparison data on success", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    const res = await request(app)
      .post("/api/manifesto/compare")
      .send({ parties: ["BJP", "INC"], issues: ["Economy"] });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("title");
    expect(res.body).toHaveProperty("comparisons");
  });
});
