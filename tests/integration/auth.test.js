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
  findUserById: vi.fn().mockResolvedValue(null),
  createUser: vi.fn().mockResolvedValue({ lastInsertRowid: "user-1" }),
  createResetToken: vi.fn().mockResolvedValue(undefined),
  findResetToken: vi.fn().mockResolvedValue(null),
  markTokenUsed: vi.fn().mockResolvedValue(undefined),
  updateProfile: vi.fn().mockResolvedValue(undefined),
};

vi.mock("../../src/db/firestore-service.js", () => ({
  firestoreService: mockFirestore,
}));

const { createApp } = await import("../../src/create-app.js");
const app = createApp();

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFirestore.findUserByEmail.mockResolvedValue(null);
    mockFirestore.createUser.mockResolvedValue({ lastInsertRowid: "user-1" });
  });

  it("returns 400 when name is missing", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "a@b.com", password: "123456" });
    expect(res.status).toBe(400);
  });

  it("returns 400 when password is too short", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Test", email: "a@b.com", password: "12" });
    expect(res.status).toBe(400);
  });

  it("returns 201 on successful registration", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Test User", email: "test@example.com", password: "password123" });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("token");
    expect(res.body.user.name).toBe("Test User");
  });

  it("returns 409 when email already exists", async () => {
    mockFirestore.findUserByEmail.mockResolvedValue({
      id: "existing",
      email: "test@example.com",
    });
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Test", email: "test@example.com", password: "password123" });
    expect(res.status).toBe(409);
  });
});

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when email is missing", async () => {
    const res = await request(app).post("/api/auth/login").send({ password: "123456" });
    expect(res.status).toBe(400);
  });

  it("returns 401 when user not found", async () => {
    mockFirestore.findUserByEmail.mockResolvedValue(null);
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "no@user.com", password: "123456" });
    expect(res.status).toBe(401);
  });
});

describe("POST /api/auth/forgot-password", () => {
  it("returns 400 when email is missing", async () => {
    const res = await request(app).post("/api/auth/forgot-password").send({});
    expect(res.status).toBe(400);
  });

  it("returns success even when user does not exist", async () => {
    mockFirestore.findUserByEmail.mockResolvedValue(null);
    const res = await request(app).post("/api/auth/forgot-password").send({ email: "no@user.com" });
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/reset/i);
  });
});

describe("POST /api/auth/reset-password", () => {
  it("returns 400 when token or password missing", async () => {
    const res = await request(app).post("/api/auth/reset-password").send({});
    expect(res.status).toBe(400);
  });

  it("returns 400 when password too short", async () => {
    const res = await request(app)
      .post("/api/auth/reset-password")
      .send({ token: "abc", password: "12" });
    expect(res.status).toBe(400);
  });

  it("returns 400 when token is invalid", async () => {
    mockFirestore.findResetToken.mockResolvedValue(null);
    const res = await request(app)
      .post("/api/auth/reset-password")
      .send({ token: "bad-token", password: "newpass123" });
    expect(res.status).toBe(400);
  });
});

describe("GET /api/auth/me", () => {
  it("returns 401 when no auth header", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });
});
