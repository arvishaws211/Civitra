import { Router } from "express";
import { GoogleGenAI } from "@google/genai";
import SYSTEM_PROMPT from "../config/system-prompt.js";
import KNOWLEDGE_BASE from "../config/knowledge-base.js";

const router = Router();

// ── Generate quiz questions ────────────────────────────────
router.post("/generate", async (req, res) => {
  const { topic, difficulty } = req.body;

  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "your_gemini_api_key_here") {
    return res.status(500).json({ error: "Gemini API key not configured." });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const quizPrompt = `Generate exactly 5 multiple-choice quiz questions about the Indian election process.

Topic focus: ${topic || "General election knowledge"}
Difficulty: ${difficulty || "Medium"}

Return a JSON array (no markdown code fences, just raw JSON) with this exact structure:
[
  {
    "id": 1,
    "question": "The question text",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 0,
    "explanation": "Brief explanation of why this is correct",
    "topic": "Topic category"
  }
]

Rules:
- Questions must be FACTUALLY ACCURATE based on Indian election law and ECI guidelines.
- Questions should be educational and interesting, not trivial.
- Cover diverse aspects: eligibility, registration, voting process, EVM, NOTA, special provisions, etc.
- Make wrong options plausible but clearly incorrect.
- Keep explanations concise (1-2 sentences).
- Do NOT include questions about specific candidates or political parties.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: SYSTEM_PROMPT + "\n\n## Reference Knowledge Base\n" + KNOWLEDGE_BASE,
        temperature: 0.8,
        maxOutputTokens: 2048,
      },
      contents: quizPrompt,
    });

    let text = response.text || "";
    text = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();

    try {
      const questions = JSON.parse(text);
      res.json({ questions });
    } catch {
      res.status(500).json({ error: "Failed to parse quiz. Please try again." });
    }
  } catch (error) {
    console.error("Quiz error:", error.message);
    res.status(500).json({ error: "Failed to generate quiz. Please try again." });
  }
});

export default router;
