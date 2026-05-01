import { Router } from "express";

const router = Router();

// ── Get Maps API Key (for frontend use, NOT the Gemini key) ──
router.get("/maps-key", (req, res) => {
  const key = process.env.MAPS_API_KEY;
  if (!key) {
    return res.status(500).json({ error: "Maps API key not configured." });
  }
  res.json({ key });
});

// ── ECI Verification Links ────────────────────────────────
router.get("/eci-links", (req, res) => {
  res.json({
    voterSearch: "https://voters.eci.gov.in/",
    boothSearch: "https://electoralsearch.eci.gov.in/",
    helplineApp: "https://play.google.com/store/apps/details?id=com.eci.citizen",
    helpline: "1950",
    ceoLinks: {
      "Andhra Pradesh": "https://ceoandhra.nic.in/",
      Bihar: "https://ceobihar.nic.in/",
      Delhi: "https://ceodelhi.nic.in/",
      Gujarat: "https://ceo.gujarat.gov.in/",
      Karnataka: "https://ceo.karnataka.gov.in/",
      Kerala: "https://ceo.kerala.gov.in/",
      "Madhya Pradesh": "https://ceomadhyapradesh.nic.in/",
      Maharashtra: "https://ceo.maharashtra.gov.in/",
      Rajasthan: "https://ceorajasthan.nic.in/",
      "Tamil Nadu": "https://elections.tn.gov.in/",
      Telangana: "https://ceotelangana.nic.in/",
      "Uttar Pradesh": "https://ceo.up.nic.in/",
      "West Bengal": "https://ceowestbengal.nic.in/",
    },
    note: "Civitra does NOT store any voter roll data. All verification is handled directly via official ECI portals.",
  });
});

export default router;
