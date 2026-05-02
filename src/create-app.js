import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import chatRouter from "./api/chat.js";
import votingPlanRouter from "./api/voting-plan.js";
import quizRouter from "./api/quiz.js";
import boothRouter from "./api/booth.js";
import manifestoRouter from "./api/manifesto.js";
import authRouter from "./api/auth.js";
import profileRouter from "./api/profile.js";
import analyticsRouter from "./api/analytics.js";
import translateRouter from "./api/translate.js";
import log from "./lib/logger.js";

import { rateLimit } from "express-rate-limit";

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window`
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Limit each IP to 20 requests per `window`
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many authentication attempts, please try again later." },
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * @param {{ staticRoot?: string }} [opts]
 */
export function createApp(opts = {}) {
  const staticRoot = opts.staticRoot ?? join(__dirname, "..", "public");

  const app = express();
  app.set("trust proxy", 1);

  app.use(express.json({ limit: "1mb" }));
  app.use(express.static(staticRoot));

  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "geolocation=(), camera=(), microphone=()");
    if (process.env.NODE_ENV === "production") {
      res.setHeader("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
    }
    res.setHeader(
      "Content-Security-Policy",
      [
        "default-src 'self'",
        "base-uri 'self'",
        "connect-src 'self' https://*.googleapis.com https://generativelanguage.googleapis.com https://translation.googleapis.com https://language.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "form-action 'self'",
        "frame-ancestors 'none'",
        "img-src 'self' data: https: blob:",
        "script-src 'self' https://cdn.jsdelivr.net https://maps.googleapis.com https://www.google.com https://www.gstatic.com 'unsafe-inline'",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      ].join("; ")
    );
    next();
  });

  app.use("/api/auth", authLimiter, authRouter);

  // Apply general API limit to remaining /api routes
  app.use("/api/", apiLimiter);
  app.use("/api/profile", profileRouter);
  app.use("/api/chat", chatRouter);
  app.use("/api/voting-plan", votingPlanRouter);
  app.use("/api/quiz", quizRouter);
  app.use("/api/booth", boothRouter);
  app.use("/api/manifesto", manifestoRouter);
  app.use("/api/analytics", analyticsRouter);
  app.use("/api/translate", translateRouter);

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", service: "civitra", timestamp: new Date().toISOString() });
  });

  app.get("/api/config", (req, res) => {
    res.json({ recaptchaSiteKey: process.env.RECAPTCHA_SITE_KEY || "" });
  });

  app.get("*", (req, res) => {
    res.sendFile(join(staticRoot, "index.html"));
  });

  // ── Multer error handler ──────────────────────────────────
  app.use((err, req, res, _next) => {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ error: "File too large. Maximum size is 5MB." });
    }
    if (err.message?.includes("Only")) {
      return res.status(400).json({ error: err.message });
    }
    log.error("unhandled_error", { error: err?.message || String(err) });
    res.status(500).json({ error: "An unexpected error occurred." });
  });

  return app;
}
