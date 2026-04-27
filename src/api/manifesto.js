import { Router } from "express";
import { GoogleGenAI } from "@google/genai";
import SYSTEM_PROMPT from "../config/system-prompt.js";
import KNOWLEDGE_BASE from "../config/knowledge-base.js";

const router = Router();

// ── AI Manifesto Comparison ───────────────────────────────
router.post("/compare", async (req, res) => {
  const { parties, issues } = req.body;

  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "your_gemini_api_key_here") {
    return res.status(500).json({ error: "Gemini API key not configured." });
  }

  if (!parties?.length || parties.length < 2) {
    return res.status(400).json({ error: "Select at least 2 parties to compare." });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const comparePrompt = `You are a non-partisan election education assistant. Compare the publicly available manifesto positions of the following Indian political parties on key policy issues.

## Parties to Compare:
${parties.map(p => `- ${p}`).join("\n")}

## Issues to Compare:
${(issues?.length ? issues : ["Economy & Jobs", "Education", "Healthcare", "Agriculture", "Infrastructure", "Women's Empowerment", "Environment", "Digital India"]).map(i => `- ${i}`).join("\n")}

### CRITICAL INSTRUCTIONS:
1. Return ONLY a valid JSON object.
2. Do NOT include markdown code blocks.
3. Be STRICTLY NON-PARTISAN. Present facts only.
4. Use publicly available manifesto data. If data is unavailable, state "Data not publicly available".
5. Do NOT express any opinion or bias toward any party.

### REQUIRED JSON STRUCTURE:
{
  "title": "Manifesto Comparison",
  "disclaimer": "Based on publicly available manifesto documents. Positions may evolve. Verify with official party sources.",
  "comparisons": [
    {
      "issue": "Issue name",
      "positions": [
        {
          "party": "Party name",
          "stance": "Brief 1-2 sentence summary of their stance",
          "keyPromises": ["Promise 1", "Promise 2"]
        }
      ]
    }
  ],
  "sources": ["List of manifesto document references"]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: SYSTEM_PROMPT + "\n\n## Reference Knowledge Base\n" + KNOWLEDGE_BASE,
        temperature: 0.4,
        maxOutputTokens: 4096,
      },
      contents: comparePrompt,
    });

    let text = response.text || "";
    text = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();

    try {
      const result = JSON.parse(text);
      res.json(result);
    } catch {
      res.json({
        title: "Manifesto Comparison",
        disclaimer: "AI-generated comparison for educational purposes only.",
        rawContent: text,
      });
    }
  } catch (error) {
    console.error("Manifesto compare error:", error.message);
    res.status(500).json({ error: "Failed to generate comparison. Please try again." });
  }
});

// ── Get available parties list ────────────────────────────
router.get("/parties", (req, res) => {
  res.json({
    national: [
      { name: "Bharatiya Janata Party (BJP)", abbr: "BJP" },
      { name: "Indian National Congress (INC)", abbr: "INC" },
      { name: "Aam Aadmi Party (AAP)", abbr: "AAP" },
      { name: "Bahujan Samaj Party (BSP)", abbr: "BSP" },
      { name: "Communist Party of India (Marxist)", abbr: "CPI(M)" },
      { name: "National People's Party (NPP)", abbr: "NPP" },
    ],
    regional: [
      { name: "Trinamool Congress (TMC)", abbr: "TMC", state: "West Bengal" },
      { name: "Dravida Munnetra Kazhagam (DMK)", abbr: "DMK", state: "Tamil Nadu" },
      { name: "Shiv Sena (UBT)", abbr: "SS-UBT", state: "Maharashtra" },
      { name: "Telugu Desam Party (TDP)", abbr: "TDP", state: "Andhra Pradesh" },
      { name: "Janata Dal (United)", abbr: "JD(U)", state: "Bihar" },
      { name: "Samajwadi Party (SP)", abbr: "SP", state: "Uttar Pradesh" },
      { name: "Rashtriya Janata Dal (RJD)", abbr: "RJD", state: "Bihar" },
      { name: "Biju Janata Dal (BJD)", abbr: "BJD", state: "Odisha" },
      { name: "YSR Congress Party (YSRCP)", abbr: "YSRCP", state: "Andhra Pradesh" },
    ],
    disclaimer: "Party list is for educational comparison only. Civitra is strictly non-partisan."
  });
});

export default router;
