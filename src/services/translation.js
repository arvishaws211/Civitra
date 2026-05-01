const TTL_MS = 5 * 60 * 1000;
const cache = new Map();

/**
 * Cloud Translation v2 (REST). Falls back to original text if key missing or error.
 * @param {string} text
 * @param {string} targetLanguage BCP-47 or ISO-639 like "hi"
 */
export async function translateText(text, targetLanguage) {
  const key = process.env.TRANSLATION_API_KEY || process.env.GOOGLE_TRANSLATION_API_KEY;
  if (!key || !text?.trim()) {
    return { translatedText: text, sourceLanguage: "und", cached: false, fallback: !key };
  }
  const cacheKey = `${targetLanguage}:${text.slice(0, 2000)}`;
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.t < TTL_MS) {
    return { ...hit.v, cached: true };
  }
  try {
    const url = `https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(key)}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q: text, target: targetLanguage, format: "text" }),
    });
    if (!res.ok) {
      return {
        translatedText: text,
        sourceLanguage: "und",
        error: `HTTP ${res.status}`,
        fallback: true,
      };
    }
    const data = await res.json();
    const tr = data?.data?.translations?.[0];
    const out = {
      translatedText: tr?.translatedText || text,
      sourceLanguage: tr?.detectedSourceLanguage || "und",
      cached: false,
      fallback: false,
    };
    cache.set(cacheKey, { t: Date.now(), v: out });
    return out;
  } catch {
    return { translatedText: text, sourceLanguage: "und", fallback: true };
  }
}
