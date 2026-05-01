import { Router } from "express";
import { translateText } from "../services/translation.js";

const router = Router();

router.post("/", async (req, res) => {
  const { texts, target } = req.body || {};

  if (!target || typeof target !== "string") {
    return res.status(400).json({ ok: false, error: "target language code required" });
  }

  const items = Array.isArray(texts) ? texts : typeof texts === "string" ? [texts] : [];
  if (!items.length) {
    return res.status(400).json({ ok: false, error: "texts required (string or string[])" });
  }

  const results = await Promise.all(items.map((t) => translateText(String(t), target)));
  const fallback = results.some((r) => r.fallback);

  res.json({ ok: true, translations: results, fallback });
});

export default router;
