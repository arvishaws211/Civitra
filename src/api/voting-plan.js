import { Router } from "express";
import { GoogleGenAI } from "@google/genai";
import SYSTEM_PROMPT from "../config/system-prompt.js";
import KNOWLEDGE_BASE from "../config/knowledge-base.js";

const router = Router();

// ── Generate personalized voting plan ──────────────────────
router.post("/", async (req, res) => {
  const { age, state, isRegistered, hasVoterId, votingPreference, isFirstTime, isNRI, hasPwD } = req.body;

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

    const planPrompt = `Based on the following user profile, generate a **personalized voting plan** as a structured JSON response. 

${userProfile}

Return a JSON object with this exact structure (no markdown code fences, just raw JSON):
{
  "title": "Your Personalized Voting Plan",
  "summary": "A brief 1-2 sentence summary of their situation",
  "steps": [
    {
      "step": 1,
      "title": "Step title",
      "description": "Detailed description of what to do",
      "deadline": "Relevant deadline or timeframe if applicable, otherwise null",
      "documents": ["List of documents needed for this step, if any"],
      "link": "Relevant official link if applicable, otherwise null",
      "completed": false
    }
  ],
  "importantDates": [
    { "event": "Event name", "description": "Brief description" }
  ],
  "tips": ["Helpful tips specific to this voter's situation"],
  "emergencyContacts": {
    "helpline": "1950",
    "website": "https://voters.eci.gov.in/",
    "app": "Voter Helpline App"
  }
}

Make the plan specific to their situation. If they're a first-time voter, include extra guidance. If NRI, include Form 6A steps. If PwD, include accessibility information. Include 4-8 actionable steps.`;

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
    
    // Strip markdown code fences if present
    text = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();

    try {
      const plan = JSON.parse(text);
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
    console.error("Voting plan error:", error.message);
    res.status(500).json({ error: "Failed to generate voting plan. Please try again." });
  }
});

export default router;
