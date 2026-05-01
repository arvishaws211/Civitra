/**
 * Cloud Natural Language — entity analysis (REST). Fail-silent.
 * @param {string} text
 */
export async function analyzeQueryEntities(text) {
  const key = process.env.NATURAL_LANGUAGE_API_KEY || process.env.CLOUD_NL_API_KEY;
  if (!key || !text?.trim()) {
    return { entities: [], language: "", fallback: true };
  }
  try {
    const url = `https://language.googleapis.com/v1/documents:analyzeEntities?key=${encodeURIComponent(key)}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        document: { type: "PLAIN_TEXT", content: text.slice(0, 5000) },
        encodingType: "UTF8",
      }),
    });
    if (!res.ok) {
      return { entities: [], language: "", error: `HTTP ${res.status}`, fallback: true };
    }
    const data = await res.json();
    const entities = (data.entities || []).slice(0, 12).map((e) => ({
      name: e.name,
      type: e.type,
      salience: e.salience,
    }));
    return { entities, language: data.language || "", fallback: false };
  } catch {
    return { entities: [], language: "", fallback: true };
  }
}
