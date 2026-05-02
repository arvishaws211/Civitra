import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { firestoreService } from "../db/firestore-service.js";
import { generateToken, verifyRecaptcha, requireAuth } from "../middleware/auth.js";
import log from "../lib/logger.js";

const router = Router();

// ── Register ───────────────────────────────────────────────
router.post("/register", async (req, res) => {
  const { name, email, password, recaptchaToken } = req.body;

  if (!name?.trim() || !email?.trim() || !password) {
    return res.status(400).json({ error: "Name, email, and password are required." });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters." });
  }

  // Verify reCAPTCHA
  const captchaOk = await verifyRecaptcha(recaptchaToken);
  if (!captchaOk) {
    return res.status(400).json({ error: "reCAPTCHA verification failed. Please try again." });
  }

  try {
    // Check existing user
    const existing = await firestoreService.findUserByEmail(email.toLowerCase().trim());
    if (existing) {
      return res.status(409).json({ error: "An account with this email already exists." });
    }

    const hash = await bcrypt.hash(password, 12);
    const result = await firestoreService.createUser({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hash,
    });
    const userId = result.id ?? result.lastInsertRowid;
    const token = generateToken(userId);

    res.status(201).json({
      token,
      user: { id: userId, name: name.trim(), email: email.toLowerCase().trim() },
    });
  } catch (error) {
    log.error("register_error", { error: error.message });
    res.status(500).json({ error: "Registration failed. Please try again." });
  }
});

// ── Login ──────────────────────────────────────────────────
router.post("/login", async (req, res) => {
  const { email, password, recaptchaToken } = req.body;

  if (!email?.trim() || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  // Verify reCAPTCHA
  const captchaOk = await verifyRecaptcha(recaptchaToken);
  if (!captchaOk) {
    return res.status(400).json({ error: "reCAPTCHA verification failed. Please try again." });
  }

  try {
    const user = await firestoreService.findUserByEmail(email.toLowerCase().trim());
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const token = generateToken(user.id);
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (error) {
    log.error("login_error", { error: error.message });
    res.status(500).json({ error: "Login failed. Please try again." });
  }
});

// ── Forgot Password ────────────────────────────────────────
router.post("/forgot-password", async (req, res) => {
  const { email, recaptchaToken } = req.body;

  if (!email?.trim()) {
    return res.status(400).json({ error: "Email is required." });
  }

  const captchaOk = await verifyRecaptcha(recaptchaToken);
  if (!captchaOk) {
    return res.status(400).json({ error: "reCAPTCHA verification failed." });
  }

  try {
    const user = await firestoreService.findUserByEmail(email.toLowerCase().trim());

    // Always respond success (don't reveal if email exists)
    if (!user) {
      return res.json({
        message: "If an account exists with this email, a reset link has been generated.",
      });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour
    await firestoreService.createResetToken(user.id, token, expiresAt);

    // In production, send email with reset link.
    // For security: token is never returned in the response.
    log.info("password_reset_token_generated", { userId: user.id });
    res.json({
      message: "If an account exists with this email, a reset link has been generated.",
    });
  } catch (error) {
    log.error("forgot_password_error", { error: error.message });
    res.status(500).json({ error: "Failed to process request." });
  }
});

// ── Reset Password ─────────────────────────────────────────
router.post("/reset-password", async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ error: "Token and new password are required." });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters." });
  }

  try {
    const resetRecord = await firestoreService.findResetToken(token);
    if (!resetRecord) {
      return res.status(400).json({ error: "Invalid or expired reset token." });
    }

    const hash = await bcrypt.hash(password, 12);
    await firestoreService.updateProfile(resetRecord.user_id, { password: hash });
    await firestoreService.markTokenUsed(token);

    res.json({ message: "Password reset successfully. You can now log in." });
  } catch (error) {
    log.error("reset_password_error", { error: error.message });
    res.status(500).json({ error: "Failed to reset password." });
  }
});

// ── Get current user ───────────────────────────────────────
router.get("/me", requireAuth, async (req, res) => {
  const user = await firestoreService.findUserById(req.userId);
  if (!user) return res.status(404).json({ error: "User not found." });
  res.json({ user });
});

export default router;
