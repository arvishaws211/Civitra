import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { stmts } from "../db/database.js";
import { generateToken, verifyRecaptcha, requireAuth } from "../middleware/auth.js";

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
    const existing = stmts.findByEmail.get(email.toLowerCase().trim());
    if (existing) {
      return res.status(409).json({ error: "An account with this email already exists." });
    }

    const hash = await bcrypt.hash(password, 12);
    const result = stmts.createUser.run(name.trim(), email.toLowerCase().trim(), hash);
    const token = generateToken(result.lastInsertRowid);

    res.status(201).json({
      token,
      user: { id: result.lastInsertRowid, name: name.trim(), email: email.toLowerCase().trim() },
    });
  } catch (error) {
    console.error("Register error:", error.message);
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
    const user = stmts.findByEmail.get(email.toLowerCase().trim());
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
    console.error("Login error:", error.message);
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
    const user = stmts.findByEmail.get(email.toLowerCase().trim());

    // Always respond success (don't reveal if email exists)
    if (!user) {
      return res.json({ message: "If an account exists with this email, a reset link has been generated." });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour
    stmts.createResetToken.run(user.id, token, expiresAt);

    // In production, send email with token. For demo, return it.
    res.json({
      message: "If an account exists with this email, a reset link has been generated.",
      // Demo only — remove in production:
      resetToken: token,
    });
  } catch (error) {
    console.error("Forgot password error:", error.message);
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
    const resetRecord = stmts.findResetToken.get(token);
    if (!resetRecord) {
      return res.status(400).json({ error: "Invalid or expired reset token." });
    }

    const hash = await bcrypt.hash(password, 12);
    stmts.updatePassword.run(hash, resetRecord.user_id);
    stmts.markTokenUsed.run(token);

    res.json({ message: "Password reset successfully. You can now log in." });
  } catch (error) {
    console.error("Reset password error:", error.message);
    res.status(500).json({ error: "Failed to reset password." });
  }
});

// ── Get current user ───────────────────────────────────────
router.get("/me", requireAuth, (req, res) => {
  const user = stmts.findById.get(req.userId);
  if (!user) return res.status(404).json({ error: "User not found." });
  res.json({ user });
});

export default router;
