import {
  GoogleGenAI,
  FunctionCallingConfigMode,
  createPartFromFunctionResponse,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/genai";
import SYSTEM_PROMPT from "../config/system-prompt.js";
import KNOWLEDGE_BASE from "../config/knowledge-base.js";
import { civitraToolDeclarations, executeToolCall } from "./chat-tool-handlers.js";
import log from "../lib/logger.js";

const MODEL = "gemini-2.5-flash";
const MAX_TOOL_ROUNDS = 6;

const SAFETY_SETTINGS = [
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

function buildSystemText() {
  return `${SYSTEM_PROMPT}

## Tool use
You have tools for FAQ lookup, translation, timeline, calendar deep links, NL entity extraction, and a simplified eligibility check.
Call tools when they improve factual grounding. After tool results, answer in clear Markdown for the voter.
Never store or request sensitive PII.

## Reference Knowledge Base
${KNOWLEDGE_BASE}`;
}

/**
 * Run tool rounds (non-streaming), then stream final tokens to the response.
 * @param {import('@google/genai').GoogleGenAI} ai
 * @param {Array<{ role: string; parts: unknown[] }>} contents
 * @param {import('express').Response} res
 */
export async function runChatWithToolsAndStream(ai, contents, res) {
  const systemInstruction = buildSystemText();
  const tools = [{ functionDeclarations: civitraToolDeclarations }];
  const toolConfig = {
    functionCallingConfig: {
      mode: FunctionCallingConfigMode.AUTO,
    },
  };

  let working = /** @type {any[]} */ ([...contents]);
  let rounds = 0;

  while (rounds < MAX_TOOL_ROUNDS) {
    rounds += 1;
    const resp = await ai.models.generateContent({
      model: MODEL,
      contents: working,
      config: {
        systemInstruction,
        temperature: 0.65,
        topP: 0.9,
        maxOutputTokens: 2048,
        tools,
        toolConfig,
        safetySettings: SAFETY_SETTINGS,
      },
    });

    const usage = resp.usageMetadata;
    if (usage) {
      log.info("token_usage", {
        round: rounds,
        prompt: usage.promptTokenCount,
        completion: usage.candidatesTokenCount,
        total: usage.totalTokenCount,
      });
    }

    const calls = resp.functionCalls;
    if (!calls?.length) {
      const text = resp.text || "";
      streamTextInChunks(res, text);
      return text;
    }

    const modelContent = resp.candidates?.[0]?.content;
    if (!modelContent) {
      streamTextInChunks(res, "Sorry, I could not complete that request. Please try again.");
      return "";
    }

    working.push(modelContent);

    const responseParts = [];
    for (const fc of calls) {
      const name = fc.name || "";
      const args = fc.args && typeof fc.args === "object" ? fc.args : {};
      const id = fc.id ?? `${name}-${rounds}`;
      const result = await executeToolCall(name, args);
      responseParts.push(createPartFromFunctionResponse(id, name, result));
    }
    working.push({ role: "user", parts: responseParts });
  }

  const final = await ai.models.generateContentStream({
    model: MODEL,
    contents: working,
    config: {
      systemInstruction,
      temperature: 0.65,
      topP: 0.9,
      maxOutputTokens: 2048,
      safetySettings: SAFETY_SETTINGS,
    },
  });

  let full = "";
  for await (const chunk of final) {
    const text = chunk.text || "";
    if (text) {
      full += text;
      res.write(`data: ${JSON.stringify({ text, done: false })}\n\n`);
    }
  }
  return full;
}

/**
 * @param {import('express').Response} res
 * @param {string} text
 */
function streamTextInChunks(res, text) {
  const chunkSize = 48;
  for (let i = 0; i < text.length; i += chunkSize) {
    const piece = text.slice(i, i + chunkSize);
    res.write(`data: ${JSON.stringify({ text: piece, done: false })}\n\n`);
  }
}

/**
 * @param {string} apiKey
 */
export function createGenaiClient(apiKey) {
  return new GoogleGenAI({ apiKey });
}
