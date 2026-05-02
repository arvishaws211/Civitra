import { Router } from "express";
import { GoogleGenAI } from "@google/genai";
import SYSTEM_PROMPT from "../config/system-prompt.js";
import KNOWLEDGE_BASE from "../config/knowledge-base.js";
import { firestoreService } from "../db/firestore-service.js";
import log from "../lib/logger.js";
import { optionalAuth } from "../middleware/auth.js";
import { cleanJsonString } from "../lib/utils.js";

const router = Router();

// ── Generate personalized voting plan ──────────────────────
router.post("/", optionalAuth, async (req, res) => {
  const { age, state, isRegistered, hasVoterId, votingPreference, isFirstTime, isNRI, hasPwD } =
    req.body;

  if (age !== undefined && (typeof age !== "number" || age < 18 || age > 120)) {
    return res.status(400).json({ error: "Invalid age. Must be a number between 18 and 120." });
  }

  if (state && typeof state !== "string") {
    return res.status(400).json({ error: "State must be a string." });
  }

  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "your_gemini_api_key_here") {
    return res.status(500).json({ error: "Gemini API key not configured." });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const userProfile = `
## User Profile for Voting Plan
- **Age**: ${age || "Not specified"}
- **State**: ${state || "Not specified"}
- **Already Registered**: ${isRegistered ? "Yes" : "No"}
- **Has Voter ID (EPIC)**: ${hasVoterId ? "Yes" : "No"}
- **Voting Preference**: ${votingPreference || "In-person at polling booth"}
- **First-time Voter**: ${isFirstTime ? "Yes" : "No"}
- **NRI (Non-Resident Indian)**: ${isNRI ? "Yes" : "No"}
- **Person with Disability**: ${hasPwD ? "Yes" : "No"}
`;

    const planPrompt = `Generate a **personalized voting plan** based on this profile:

${userProfile}

### CRITICAL INSTRUCTIONS:
1. Return ONLY a valid JSON object. 
2. Do NOT include markdown code blocks (no \`\`\`json).
3. Do NOT include any text before or after the JSON.
4. Ensure all keys are quoted and the JSON is perfectly valid.

### REQUIRED JSON STRUCTURE:
{
  "title": "Your Personalized Voting Plan",
  "summary": "Brief situation summary",
  "steps": [
    {
      "step": 1,
      "title": "Action title",
      "description": "Details",
      "deadline": "Timeframe/Date or null",
      "documents": ["Doc list"],
      "link": "Official URL or null"
    }
  ],
  "importantDates": [{ "event": "...", "description": "..." }],
  "tips": ["Tip 1", "Tip 2"]
}

Focus on Indian election process (ECI).`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: SYSTEM_PROMPT + "\n\n## Reference Knowledge Base\n" + KNOWLEDGE_BASE,
        temperature: 0.5,
        maxOutputTokens: 2048,
      },
      contents: planPrompt,
    });

    let text = response.text || "";
    text = cleanJsonString(text);

    try {
      const plan = JSON.parse(text);

      // Persist for logged-in users
      if (req.userId) {
        const answersData = {
          age,
          state,
          isRegistered,
          hasVoterId,
          votingPreference,
          isFirstTime,
          isNRI,
          hasPwD,
        };
        await firestoreService.saveVotingPlan(req.userId, plan, answersData);
      }

      res.json(plan);
    } catch {
      // If JSON parsing fails, return raw text as fallback
      res.json({
        title: "Your Personalized Voting Plan",
        summary: "Here's your customized voting guide.",
        rawContent: text,
        emergencyContacts: {
          helpline: "1950",
          website: "https://voters.eci.gov.in/",
          app: "Voter Helpline App",
        },
      });
    }
  } catch (error) {
    log.error("voting_plan_error", { error: error.message });
    res.status(500).json({ error: "Failed to generate voting plan. Please try again." });
  }
});

export default router;
