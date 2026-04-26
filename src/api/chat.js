import { Router } from "express";
import { GoogleGenAI } from "@google/genai";
import SYSTEM_PROMPT from "../config/system-prompt.js";
import KNOWLEDGE_BASE from "../config/knowledge-base.js";

const router = Router();

// ── In-memory conversation store ───────────────────────────
const sessions = new Map();
const MAX_HISTORY = 20; // Keep last 20 exchanges per session
const SESSION_TTL = 30 * 60 * 1000; // 30 min TTL

// Cleanup stale sessions every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [id, session] of sessions) {
    if (now - session.lastActive > SESSION_TTL) sessions.delete(id);
  }
}, 10 * 60 * 1000);

// ── Chat endpoint (streaming via SSE) ──────────────────────
router.post("/", async (req, res) => {
  const { message, sessionId } = req.body;

  if (!message?.trim()) {
    return res.status(400).json({ error: "Message is required" });
  }

  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "your_gemini_api_key_here") {
    return res.status(500).json({
      error: "Gemini API key not configured. Please add your key to the .env file.",
    });
  }

  // SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // Get or create session history
    if (!sessions.has(sessionId)) {
      sessions.set(sessionId, { history: [], lastActive: Date.now() });
    }
    const session = sessions.get(sessionId);
    session.lastActive = Date.now();

    // Build conversation contents
    const contents = [
      ...session.history,
      { role: "user", parts: [{ text: message }] },
    ];

    // Generate streaming response
    const response = await ai.models.generateContentStream({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: SYSTEM_PROMPT + "\n\n## Reference Knowledge Base\n" + KNOWLEDGE_BASE,
        temperature: 0.7,
        topP: 0.9,
        maxOutputTokens: 2048,
      },
      contents,
    });

    let fullResponse = "";

    for await (const chunk of response) {
      const text = chunk.text || "";
      if (text) {
        fullResponse += text;
        res.write(`data: ${JSON.stringify({ text, done: false })}\n\n`);
      }
    }

    // Update session history
    session.history.push(
      { role: "user", parts: [{ text: message }] },
      { role: "model", parts: [{ text: fullResponse }] }
    );

    // Trim history if too long
    if (session.history.length > MAX_HISTORY * 2) {
      session.history = session.history.slice(-MAX_HISTORY * 2);
    }

    res.write(`data: ${JSON.stringify({ text: "", done: true })}\n\n`);
    res.end();
  } catch (error) {
    console.error("Chat error:", error.message);
    const errMsg = error.message?.includes("API_KEY")
      ? "Invalid API key. Please check your GEMINI_API_KEY in the .env file."
      : "Sorry, I encountered an error. Please try again.";
    res.write(`data: ${JSON.stringify({ error: errMsg, done: true })}\n\n`);
    res.end();
  }
});

// ── Get suggestions ────────────────────────────────────────
router.get("/suggestions", (req, res) => {
  res.json({
    suggestions: [
      "Am I eligible to vote?",
      "How do I register as a new voter?",
      "What documents do I need to vote?",
      "What is NOTA and should I use it?",
      "I'm an NRI — can I vote in Indian elections?",
      "How does the EVM machine work?",
      "Create my personalized voting plan",
      "What are the different types of elections in India?",
    ],
  });
});

export default router;
