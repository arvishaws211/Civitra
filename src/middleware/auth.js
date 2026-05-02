import jwt from "jsonwebtoken";
import log from "../lib/logger.js";

const JWT_SECRET = process.env.JWT_SECRET || "civitra_default_secret_change_me";
// MUST be overridden in production via JWT_SECRET environment variable.
if (process.env.NODE_ENV === "production" && JWT_SECRET === "civitra_default_secret_change_me") {
  throw new Error("FATAL: JWT_SECRET must be set to a strong random value in production.");
}
const JWT_EXPIRY = "7d";

export function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

// Middleware: require auth
export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required" });
  }
  try {
    const decoded = verifyToken(authHeader.split(" ")[1]);
    const payload = /** @type {{ userId?: string }} */ (decoded);
    req.userId = payload.userId;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// Middleware: optional auth (sets req.userId if token present)
export function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    try {
      const decoded = verifyToken(authHeader.split(" ")[1]);
      const payload = /** @type {{ userId?: string }} */ (decoded);
      req.userId = payload.userId;
    } catch {
      /* ignore */
    }
  }
  next();
}

// reCAPTCHA verification
export async function verifyRecaptcha(token) {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) return true; // Skip if not configured

  try {
    const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `secret=${secret}&response=${token}`,
    });
    const data = await res.json();
    log.debug("recaptcha_response", { success: data.success, score: data.score });
    return data.success && data.score >= 0.5;
  } catch (err) {
    log.error("recaptcha_error", { error: err?.message || String(err) });
    return false;
  }
}
