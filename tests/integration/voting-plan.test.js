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
    createUser: vi.fn().mockResolvedValue({ id: "u1" }),
    createResetToken: vi.fn().mockResolvedValue(undefined),
    findResetToken: vi.fn().mockResolvedValue(null),
    markTokenUsed: vi.fn().mockResolvedValue(undefined),
    updateProfile: vi.fn().mockResolvedValue(undefined),
    saveVotingPlan: vi.fn().mockResolvedValue(undefined),
  },
}));

const validPlanJson = JSON.stringify({
  title: "Your Personalized Voting Plan",
  summary: "You are eligible to vote.",
  steps: [
    {
      step: 1,
      title: "Check Registration",
      description: "Visit ECI portal",
      deadline: null,
      documents: [],
      link: "https://voters.eci.gov.in/",
    },
  ],
  importantDates: [{ event: "Election Day", description: "Cast your vote" }],
  tips: ["Bring your EPIC card"],
});

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
      generateContent: vi.fn().mockResolvedValue({ text: validPlanJson }),
    },
  })),
}));

const { createApp } = await import("../../src/create-app.js");
const app = createApp();

describe("POST /api/voting-plan", () => {
  beforeEach(() => vi.unstubAllEnvs());

  it("returns 500 when GEMINI_API_KEY is not configured", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    const res = await request(app)
      .post("/api/voting-plan")
      .send({ age: 25, state: "Maharashtra", isRegistered: true, hasVoterId: true });
    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/key/i);
  });

  it("returns 400 when age is invalid", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    const res = await request(app).post("/api/voting-plan").send({ age: 10, state: "Maharashtra" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Invalid age/i);
  });

  it("returns 400 when state is not a string", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    const res = await request(app).post("/api/voting-plan").send({ age: 25, state: 1234 });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/State must be a string/i);
  });

  it("returns 200 with parsed voting plan on success", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    const res = await request(app).post("/api/voting-plan").send({
      age: 25,
      state: "Maharashtra",
      isRegistered: true,
      hasVoterId: true,
      isFirstTime: false,
      isNRI: false,
      hasPwD: false,
    });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("title");
    expect(res.body).toHaveProperty("steps");
    expect(Array.isArray(res.body.steps)).toBe(true);
  });

  it("returns 200 with raw fallback when AI returns invalid JSON", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    const { GoogleGenAI } = await import("@google/genai");
    GoogleGenAI.mockImplementationOnce(() => ({
      models: {
        generateContent: vi.fn().mockResolvedValue({ text: "Not valid JSON at all!" }),
      },
    }));

    const res = await request(app).post("/api/voting-plan").send({
      age: 30,
      state: "Delhi",
    });
    expect(res.status).toBe(200);
    // Fallback response
    expect(res.body).toHaveProperty("title");
  });

  it("returns 200 for first-time voter profile", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    const res = await request(app).post("/api/voting-plan").send({
      age: 18,
      state: "Karnataka",
      isRegistered: false,
      hasVoterId: false,
      isFirstTime: true,
    });
    expect(res.status).toBe(200);
  });

  it("returns 200 for NRI voter profile", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    const res = await request(app).post("/api/voting-plan").send({
      age: 35,
      state: "Tamil Nadu",
      isNRI: true,
    });
    expect(res.status).toBe(200);
  });
});
