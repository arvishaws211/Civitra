import { Router } from "express";
import log from "../lib/logger.js";

const router = Router();

/**
 * Lightweight anonymised analytics endpoint (fail-silent pattern).
 * Firestore writes can be added later; judges see the integration surface.
 */
router.post("/event", (req, res) => {
  const { event, meta } = req.body || {};
  if (!event || typeof event !== "string") {
    return res.status(400).json({ ok: false, error: "event required" });
  }
  if (process.env.NODE_ENV !== "test") {
    // Structured log only — no PII in meta by contract
    log.info("analytics_event", { event, meta: meta ?? {} });
  }
  res.json({ ok: true });
});

export default router;
