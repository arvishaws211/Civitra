import { readFileSync, writeFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { GoogleGenAI } from "@google/genai";
import { lookupElectionFaq } from "./faq-search.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CORPUS_PATH = join(__dirname, "..", "data", "faq-corpus.json");
const EMBEDDINGS_PATH = join(__dirname, "..", "data", "faq-embeddings.json");
const EMBED_MODEL = "text-embedding-004";

/** @type {{ id: string; q: string; a: string; tags: string[] }[]} */
let corpus;

function loadCorpus() {
  if (!corpus) {
    corpus = JSON.parse(readFileSync(CORPUS_PATH, "utf8"));
  }
  return corpus;
}

/**
 * Cosine similarity between two numeric vectors.
 * Returns 0 for degenerate inputs (zero-length vectors).
 * @param {number[]} a
 * @param {number[]} b
 * @returns {number} similarity in [-1, 1]
 */
export function cosineSimilarity(a, b) {
  if (!a?.length || !b?.length || a.length !== b.length) return 0;
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

/**
 * Build a keyword-fallback result, decorating the output of `lookupElectionFaq`.
 * @param {string} query
 * @param {number} limit
 */
function keywordFallback(query, limit) {
  const result = lookupElectionFaq(query, limit);
  return { ...result, method: /** @type {const} */ ("keyword_fallback") };
}

/**
 * Semantic FAQ search using Gemini text-embedding-004 with cosine similarity.
 *
 * Falls back to keyword search when:
 * - GEMINI_API_KEY is not set
 * - Pre-computed embeddings cache (`faq-embeddings.json`) is missing
 * - The embedding API call fails for any reason
 *
 * @param {string} query - natural-language user question
 * @param {number} [limit=4] - max results to return
 * @returns {Promise<{
 *   matches: { id: string; q: string; a: string; tags: string[] }[],
 *   method: "semantic" | "keyword_fallback",
 *   scores?: number[]
 * }>}
 */
export async function lookupSemanticFaq(query, limit = 4) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return keywordFallback(query, limit);

    if (!existsSync(EMBEDDINGS_PATH)) return keywordFallback(query, limit);

    /** @type {{ id: string; vector: number[] }[]} */
    const cached = JSON.parse(readFileSync(EMBEDDINGS_PATH, "utf8"));
    if (!Array.isArray(cached) || cached.length === 0) {
      return keywordFallback(query, limit);
    }

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.embedContent({
      model: EMBED_MODEL,
      contents: query,
    });
    const queryVector = response.embeddings[0].values;

    const items = loadCorpus();
    const idToItem = new Map(items.map((item) => [item.id, item]));

    const scored = cached
      .map((entry) => ({
        id: entry.id,
        score: cosineSimilarity(queryVector, entry.vector),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    const matches = scored.map((s) => idToItem.get(s.id)).filter(Boolean);
    const scores = scored.map((s) => s.score);

    return { matches, method: "semantic", scores };
  } catch {
    return keywordFallback(query, limit);
  }
}

/**
 * Pre-compute embeddings for every FAQ item and write them to
 * `../data/faq-embeddings.json` as `[{ id, vector }]`.
 *
 * Calls the Gemini API sequentially to respect rate limits.
 *
 * @returns {Promise<number>} count of items successfully embedded
 */
export async function precomputeCorpusEmbeddings() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is required to precompute embeddings");

  const items = loadCorpus();
  const ai = new GoogleGenAI({ apiKey });
  const results = [];

  for (const item of items) {
    const text = `${item.q} ${item.a}`;
    const response = await ai.models.embedContent({
      model: EMBED_MODEL,
      contents: text,
    });
    results.push({ id: item.id, vector: response.embeddings[0].values });
  }

  writeFileSync(EMBEDDINGS_PATH, JSON.stringify(results, null, 2), "utf8");
  return results.length;
}
