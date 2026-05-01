import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {{ id: string; q: string; a: string; tags: string[] }[]} */
let corpus;

function loadCorpus() {
  if (!corpus) {
    const raw = readFileSync(join(__dirname, "..", "data", "faq-corpus.json"), "utf8");
    corpus = JSON.parse(raw);
  }
  return corpus;
}

/**
 * Keyword-based FAQ retrieval (graceful degradation when Vertex-style embeddings unavailable).
 * @param {string} query
 * @param {number} [limit]
 */
export function lookupElectionFaq(query, limit = 3) {
  const q = (query || "").toLowerCase().trim();
  const items = loadCorpus();
  if (!q) {
    return { matches: items.slice(0, limit), method: "keyword" };
  }
  const tokens = q.split(/\s+/).filter(Boolean);
  const scored = items.map((item) => {
    const hay = `${item.q} ${item.a} ${(item.tags || []).join(" ")}`.toLowerCase();
    let score = 0;
    for (const t of tokens) {
      if (hay.includes(t)) score += 2;
    }
    for (const tag of item.tags || []) {
      if (q.includes(tag.toLowerCase())) score += 3;
    }
    return { item, score };
  });
  scored.sort((a, b) => b.score - a.score);
  const top = scored.filter((s) => s.score > 0).slice(0, limit);
  const matches = top.length ? top.map((s) => s.item) : items.slice(0, limit);
  return { matches, method: "keyword" };
}
