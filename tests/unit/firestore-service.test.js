import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock firebase config
vi.mock("../../src/config/firebase.js", () => ({
  db: {
    collection: vi.fn(),
  },
}));

import { firestoreService } from "../../src/db/firestore-service.js";
import { db } from "../../src/config/firebase.js";

describe("Firestore Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should find a user by email", async () => {
    const mockGet = vi.fn().mockResolvedValue({
      empty: false,
      docs: [{ id: "user-1", data: () => ({ email: "test@example.com", name: "Test" }) }],
    });
    const mockLimit = vi.fn().mockReturnThis();
    const mockWhere = vi.fn().mockReturnThis();
    const mockCollection = vi
      .fn()
      .mockReturnValue({ where: mockWhere, limit: mockLimit, get: mockGet });
    db.collection = mockCollection;

    const user = await firestoreService.findUserByEmail("test@example.com");

    expect(db.collection).toHaveBeenCalledWith("users");
    expect(mockWhere).toHaveBeenCalledWith("email", "==", "test@example.com");
    expect(mockLimit).toHaveBeenCalledWith(1);
    expect(user.email).toBe("test@example.com");
  });

  it("should return null if user not found", async () => {
    const mockGet = vi.fn().mockResolvedValue({ empty: true });
    const mockLimit = vi.fn().mockReturnThis();
    const mockWhere = vi.fn().mockReturnThis();
    db.collection.mockReturnValue({ where: mockWhere, limit: mockLimit, get: mockGet });

    const user = await firestoreService.findUserByEmail("missing@example.com");
    expect(user).toBeNull();
  });

  it("should save a chat message", async () => {
    const mockAdd = vi.fn().mockResolvedValue({ id: "msg-1" });
    db.collection.mockReturnValue({ add: mockAdd });

    await firestoreService.saveChatMessage("user-1", "session-1", "user", "Hello");

    expect(db.collection).toHaveBeenCalledWith("chats");
    expect(mockAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        sessionId: "session-1",
        role: "user",
        message: "Hello",
      })
    );
  });

  it("should get chat history", async () => {
    const mockGet = vi.fn().mockResolvedValue({
      docs: [{ data: () => ({ message: "Hi" }) }],
    });
    const mockLimit = vi.fn().mockReturnThis();
    const mockOrder = vi.fn().mockReturnThis();
    const mockWhere = vi.fn().mockReturnThis();
    db.collection.mockReturnValue({
      where: mockWhere,
      orderBy: mockOrder,
      limit: mockLimit,
      get: mockGet,
    });

    const history = await firestoreService.getChatHistory("user-1", "session-1");
    expect(history).toHaveLength(1);
    expect(history[0].message).toBe("Hi");
  });

  it("should create a reset token", async () => {
    const mockSet = vi.fn().mockResolvedValue(undefined);
    const mockDoc = vi.fn().mockReturnValue({ set: mockSet });
    db.collection.mockReturnValue({ doc: mockDoc });

    await firestoreService.createResetToken("user-1", "token-123", "2024-12-31");
    expect(db.collection).toHaveBeenCalledWith("password_resets");
    expect(mockDoc).toHaveBeenCalledWith("token-123");
    expect(mockSet).toHaveBeenCalledWith(expect.objectContaining({ userId: "user-1" }));
  });

  it("should find a reset token", async () => {
    const mockGet = vi.fn().mockResolvedValue({
      exists: true,
      data: () => ({ userId: "user-1", used: false, expires_at: "2099-01-01" }),
    });
    const mockDoc = vi.fn().mockReturnValue({ get: mockGet });
    db.collection.mockReturnValue({ doc: mockDoc });

    const result = await firestoreService.findResetToken("token-123");
    expect(result.user_id).toBe("user-1");
  });

  it("should return null for invalid reset token", async () => {
    const mockGet = vi.fn().mockResolvedValue({ exists: false });
    db.collection.mockReturnValue({ doc: vi.fn().mockReturnValue({ get: mockGet }) });

    const result = await firestoreService.findResetToken("invalid");
    expect(result).toBeNull();
  });

  it("should mark a token as used", async () => {
    const mockUpdate = vi.fn().mockResolvedValue(undefined);
    db.collection.mockReturnValue({ doc: vi.fn().mockReturnValue({ update: mockUpdate }) });

    await firestoreService.markTokenUsed("token-123");
    expect(mockUpdate).toHaveBeenCalledWith({ used: true });
  });

  it("should save a voting plan", async () => {
    const mockAdd = vi.fn().mockResolvedValue({ id: "plan-1" });
    db.collection.mockReturnValue({ add: mockAdd });

    await firestoreService.saveVotingPlan("user-1", { task: "vote" }, { q1: "a1" });
    expect(db.collection).toHaveBeenCalledWith("voting_plans");
    expect(mockAdd).toHaveBeenCalledWith(expect.objectContaining({ userId: "user-1" }));
  });

  it("should get voting plans", async () => {
    const mockGet = vi.fn().mockResolvedValue({
      docs: [{ data: () => ({ plan_data: { task: "vote" } }) }],
    });
    const mockLimit = vi.fn().mockReturnThis();
    const mockOrder = vi.fn().mockReturnThis();
    const mockWhere = vi.fn().mockReturnThis();
    db.collection.mockReturnValue({
      where: mockWhere,
      orderBy: mockOrder,
      limit: mockLimit,
      get: mockGet,
    });

    const plans = await firestoreService.getVotingPlans("user-1");
    expect(plans).toHaveLength(1);
    expect(plans[0].plan_data.task).toBe("vote");
  });
});
