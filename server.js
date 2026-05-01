import "dotenv/config";
import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import chatRouter from "./src/api/chat.js";
import votingPlanRouter from "./src/api/voting-plan.js";
import quizRouter from "./src/api/quiz.js";
import boothRouter from "./src/api/booth.js";
import manifestoRouter from "./src/api/manifesto.js";
import authRouter from "./src/api/auth.js";
import profileRouter from "./src/api/profile.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ──────────────────────────────────────────────
app.use(express.json({ limit: "1mb" }));
app.use(express.static(join(__dirname, "public")));

// Security headers
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  next();
});

// ── API Routes ─────────────────────────────────────────────
app.use("/api/auth", authRouter);
app.use("/api/profile", profileRouter);
app.use("/api/chat", chatRouter);
app.use("/api/voting-plan", votingPlanRouter);
app.use("/api/quiz", quizRouter);
app.use("/api/booth", boothRouter);
app.use("/api/manifesto", manifestoRouter);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "civitra", timestamp: new Date().toISOString() });
});

// Expose reCAPTCHA site key to frontend
app.get("/api/config", (req, res) => {
  res.json({ recaptchaSiteKey: process.env.RECAPTCHA_SITE_KEY || "" });
});

// SPA fallback
app.get("*", (req, res) => {
  res.sendFile(join(__dirname, "public", "index.html"));
});

// ── Start ──────────────────────────────────────────────────
app.listen(PORT, "0.0.0.0", () => {
  console.log(`\n  🗳️  Civitra is running at http://0.0.0.0:${PORT}\n`);
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "your_gemini_api_key_here") {
    console.log("  ⚠️  No GEMINI_API_KEY set. Copy .env.example to .env and add your key.\n");
  }
});
