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

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * @param {{ staticRoot?: string }} [opts]
 */
export function createApp(opts = {}) {
  const staticRoot = opts.staticRoot ?? join(__dirname, "..", "public");

  const app = express();

  app.use(express.json({ limit: "1mb" }));
  app.use(express.static(staticRoot));

  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
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

  app.use("/api/auth", authRouter);
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

  return app;
}
