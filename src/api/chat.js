import { Router } from "express";
import { firestoreService } from "../db/firestore-service.js";
import { optionalAuth } from "../middleware/auth.js";
import { createGenaiClient, runChatWithToolsAndStream } from "../services/chat-gemini.js";

const router = Router();

const sessions = new Map();
const MAX_HISTORY = 20;
const SESSION_TTL = 30 * 60 * 1000;

setInterval(
  () => {
    const now = Date.now();
    for (const [id, session] of sessions) {
      if (now - session.lastActive > SESSION_TTL) sessions.delete(id);
    }
  },
  10 * 60 * 1000
);

router.post("/", optionalAuth, async (req, res) => {
  const { message, sessionId } = req.body;

  if (!message?.trim()) {
    return res.status(400).json({ error: "Message is required" });
  }

  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "your_gemini_api_key_here") {
    return res.status(500).json({
      error: "Gemini API key not configured. Please add your key to the .env file.",
    });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  try {
    const ai = createGenaiClient(process.env.GEMINI_API_KEY);

    let history = [];
    if (req.userId) {
      const dbHistory = await firestoreService.getChatHistory(req.userId, sessionId);
      history = dbHistory.map((h) => ({ role: h.role, parts: [{ text: h.message }] }));
    } else {
      if (!sessions.has(sessionId)) {
        sessions.set(sessionId, { history: [], lastActive: Date.now() });
      }
      const session = sessions.get(sessionId);
      session.lastActive = Date.now();
      history = session.history;
    }

    const contents = [...history, { role: "user", parts: [{ text: message }] }];

    const fullResponse = await runChatWithToolsAndStream(ai, contents, res);

    if (req.userId) {
      await firestoreService.saveChatMessage(req.userId, sessionId, "user", message);
      await firestoreService.saveChatMessage(req.userId, sessionId, "model", fullResponse);
    } else {
      const session = sessions.get(sessionId);
      if (session) {
        session.history.push(
          { role: "user", parts: [{ text: message }] },
          { role: "model", parts: [{ text: fullResponse }] }
        );
        if (session.history.length > MAX_HISTORY * 2) {
          session.history = session.history.slice(-MAX_HISTORY * 2);
        }
      }
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
