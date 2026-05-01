import { Router } from "express";
import multer from "multer";
import { extname } from "path";
import { firestoreService } from "../db/firestore-service.js";
import { requireAuth } from "../middleware/auth.js";
import log from "../lib/logger.js";
import { bucket } from "../config/firebase.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = [".jpg", ".jpeg", ".png", ".webp", ".pdf"];
    const ext = extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error("Only JPG, PNG, WebP, and PDF files are allowed."));
  },
});

const router = Router();
router.use(requireAuth);

// ── Get profile ────────────────────────────────────────────
router.get("/", async (req, res) => {
  const user = await firestoreService.findUserById(req.userId);
  if (!user) return res.status(404).json({ error: "User not found." });
  res.json({ user });
});

// ── Update profile ─────────────────────────────────────────
router.put("/", async (req, res) => {
  const { name, election_card_number, constituency, state } = req.body;

  const updateData = {
    election_card_number: election_card_number || null,
    constituency: constituency || null,
    state: state || null,
  };

  if (name?.trim()) updateData.name = name.trim();

  await firestoreService.updateProfile(req.userId, updateData);
  const user = await firestoreService.findUserById(req.userId);
  res.json({ user, message: "Profile updated." });
});

// ── Upload election card to Firebase Storage ──────────────
router.post("/election-card", upload.single("electionCard"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded." });

  try {
    const filename = `election-cards/${req.userId}_${Date.now()}${extname(req.file.originalname)}`;
    const file = bucket.file(filename);

    await file.save(req.file.buffer, {
      metadata: { contentType: req.file.mimetype },
    });

    // Make public and get URL
    await file.makePublic();
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;

    await firestoreService.updateProfile(req.userId, { election_card_image: publicUrl });
    res.json({ imagePath: publicUrl, message: "Election card uploaded to cloud successfully." });
  } catch (error) {
    log.error("upload_error", { error: error?.message || String(error) });
    res.status(500).json({ error: "Failed to upload to cloud storage." });
  }
});

// ── Get chat sessions ──────────────────────────────────────
router.get("/chat-sessions", async (req, res) => {
  const sessions = await firestoreService.getChatSessions(req.userId);
  res.json({ sessions });
});

// ── Get chat history for a session ─────────────────────────
router.get("/chat-history/:sessionId", async (req, res) => {
  const history = await firestoreService.getChatHistory(req.userId, req.params.sessionId);
  res.json({ history });
});

// ── Get voting plans ───────────────────────────────────────
router.get("/voting-plans", async (req, res) => {
  const plans = await firestoreService.getVotingPlans(req.userId);
  res.json({ plans });
});

export default router;
