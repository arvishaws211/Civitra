import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

vi.mock("../../src/config/firebase.js", () => ({
  db: {},
  bucket: { file: vi.fn().mockReturnValue({ save: vi.fn(), makePublic: vi.fn() }) },
  auth: {},
}));

const mockFirestore = {
  getChatHistory: vi.fn().mockResolvedValue([]),
  saveChatMessage: vi.fn().mockResolvedValue(undefined),
  findUserByEmail: vi.fn().mockResolvedValue(null),
  findUserById: vi.fn().mockResolvedValue({ id: "u1", name: "Test" }),
  createUser: vi.fn().mockResolvedValue({ id: "u1" }),
  createResetToken: vi.fn().mockResolvedValue(undefined),
  findResetToken: vi.fn().mockResolvedValue(null),
  markTokenUsed: vi.fn().mockResolvedValue(undefined),
  updateProfile: vi.fn().mockResolvedValue(undefined),
  saveVotingPlan: vi.fn().mockResolvedValue(undefined),
  getVotingPlans: vi.fn().mockResolvedValue([{ id: "plan-1", title: "My Plan" }]),
  getChatSessions: vi.fn().mockResolvedValue([]),
};

vi.mock("../../src/db/firestore-service.js", () => ({
  firestoreService: mockFirestore,
}));

// Bypass auth for profile routes
vi.mock("../../src/middleware/auth.js", () => ({
  requireAuth: (req, _res, next) => {
    req.userId = "test-user";
    next();
  },
  optionalAuth: (req, _res, next) => next(),
  generateToken: vi.fn().mockReturnValue("mock-token"),
  verifyRecaptcha: vi.fn().mockResolvedValue(true),
  verifyToken: vi.fn().mockReturnValue({ userId: "test-user" }),
}));

const { createApp } = await import("../../src/create-app.js");
const app = createApp();

describe("GET /api/profile", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 200 with user data", async () => {
    const res = await request(app).get("/api/profile");
    expect(res.status).toBe(200);
    expect(res.body.user).toHaveProperty("id", "u1");
  });

  it("returns 404 when user not found", async () => {
    mockFirestore.findUserById.mockResolvedValueOnce(null);
    const res = await request(app).get("/api/profile");
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
  });

  it("returns 500 on Firestore error", async () => {
    mockFirestore.findUserById.mockRejectedValueOnce(new Error("DB error"));
    const res = await request(app).get("/api/profile");
    expect(res.status).toBe(500);
  });
});

describe("PUT /api/profile", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 200 with updated user", async () => {
    const res = await request(app)
      .put("/api/profile")
      .send({ name: "Updated Name", state: "Maharashtra" });
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/updated/i);
  });

  it("returns 500 on Firestore update error", async () => {
    mockFirestore.updateProfile.mockRejectedValueOnce(new Error("Firestore error"));
    const res = await request(app).put("/api/profile").send({ name: "Test" });
    expect(res.status).toBe(500);
  });
});

describe("GET /api/profile/chat-sessions", () => {
  it("returns 200 with sessions array", async () => {
    const res = await request(app).get("/api/profile/chat-sessions");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.sessions)).toBe(true);
  });
});

describe("GET /api/profile/voting-plans", () => {
  it("returns 200 with plans array", async () => {
    const res = await request(app).get("/api/profile/voting-plans");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.plans)).toBe(true);
    expect(res.body.plans[0]).toHaveProperty("title");
  });
});
