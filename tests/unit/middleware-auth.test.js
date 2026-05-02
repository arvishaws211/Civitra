import { describe, it, expect, vi } from "vitest";
import {
  generateToken,
  verifyToken,
  requireAuth,
  optionalAuth,
  verifyRecaptcha,
} from "../../src/middleware/auth.js";

describe("Auth Middleware", () => {
  const userId = "user-123";

  it("should generate and verify a valid token", () => {
    const token = generateToken(userId);
    expect(token).toBeDefined();

    const decoded = verifyToken(token);
    expect(decoded.userId).toBe(userId);
  });

  describe("requireAuth", () => {
    it("should call next() with valid token", () => {
      const token = generateToken(userId);
      const req = { headers: { authorization: `Bearer ${token}` } };
      const res = {};
      const next = vi.fn();

      requireAuth(req, res, next);
      expect(req.userId).toBe(userId);
      expect(next).toHaveBeenCalled();
    });

    it("should return 401 if authorization header is missing", () => {
      const req = { headers: {} };
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();

      requireAuth(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "Authentication required" });
      expect(next).not.toHaveBeenCalled();
    });

    it("should return 401 if token is invalid", () => {
      const req = { headers: { authorization: "Bearer invalid-token" } };
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();

      requireAuth(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "Invalid or expired token" });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("optionalAuth", () => {
    it("should set req.userId if valid token present", () => {
      const token = generateToken(userId);
      const req = { headers: { authorization: `Bearer ${token}` } };
      const res = {};
      const next = vi.fn();

      optionalAuth(req, res, next);
      expect(req.userId).toBe(userId);
      expect(next).toHaveBeenCalled();
    });

    it("should NOT set req.userId if token missing but call next", () => {
      const req = { headers: {} };
      const res = {};
      const next = vi.fn();

      optionalAuth(req, res, next);
      expect(req.userId).toBeUndefined();
      expect(next).toHaveBeenCalled();
    });
  });

  describe("verifyRecaptcha", () => {
    it("should return true if secret is not configured", async () => {
      process.env.RECAPTCHA_SECRET_KEY = "";
      const result = await verifyRecaptcha("token");
      expect(result).toBe(true);
    });

    it("should return true if recaptcha is successful with high score", async () => {
      process.env.RECAPTCHA_SECRET_KEY = "test-secret";
      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ success: true, score: 0.9 }),
      });

      const result = await verifyRecaptcha("token");
      expect(result).toBe(true);
    });

    it("should return false if score is too low", async () => {
      process.env.RECAPTCHA_SECRET_KEY = "test-secret";
      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ success: true, score: 0.1 }),
      });

      const result = await verifyRecaptcha("token");
      expect(result).toBe(false);
    });

    it("should return false on fetch error", async () => {
      process.env.RECAPTCHA_SECRET_KEY = "test-secret";
      global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

      const result = await verifyRecaptcha("token");
      expect(result).toBe(false);
    });
  });
});
