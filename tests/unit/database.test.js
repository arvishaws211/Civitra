import { describe, it, expect } from "vitest";
import { db, stmts } from "../../src/db/database.js";

describe("Database Service (SQLite)", () => {
  it("should have initialized the schema correctly", () => {
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    const tableNames = tables.map((t) => t.name);
    expect(tableNames).toContain("users");
    expect(tableNames).toContain("chat_history");
    expect(tableNames).toContain("voting_plans");
    expect(tableNames).toContain("password_reset_tokens");
  });

  describe("Prepared Statements", () => {
    it("should find an existing user by email", () => {
      // Create a test user
      const email = `test-${Date.now()}@example.com`;
      stmts.createUser.run("Test User", email, "password123");

      const user = stmts.findByEmail.get(email);
      expect(user).toBeDefined();
      expect(user.name).toBe("Test User");
      expect(user.email).toBe(email);
    });

    it("should return undefined for non-existent email", () => {
      const user = stmts.findByEmail.get("nonexistent@example.com");
      expect(user).toBeUndefined();
    });

    it("should save and retrieve chat history", () => {
      const email = `test-chat-${Date.now()}@example.com`;
      const result = stmts.createUser.run("Chat User", email, "password123");
      const userId = result.lastInsertRowid;
      const sessionId = "session-123";

      stmts.saveMessage.run(userId, sessionId, "user", "Hello AI");
      stmts.saveMessage.run(userId, sessionId, "model", "Hello Human");

      const history = stmts.getHistory.all(userId, sessionId);
      expect(history).toHaveLength(2);
      expect(history[0].role).toBe("user");
      expect(history[1].role).toBe("model");
    });
  });
});
