import { Router } from "express";
import multer from "multer";
import { join, dirname, extname } from "path";
import { fileURLToPath } from "url";
import { mkdirSync } from "fs";
import { stmts } from "../db/database.js";
import { requireAuth } from "../middleware/auth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ── Upload config ──────────────────────────────────────────
const UPLOAD_DIR = join(__dirname, "../../public/uploads");
mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const unique = `${req.userId}_${Date.now()}${extname(file.originalname)}`;
    cb(null, unique);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = [".jpg", ".jpeg", ".png", ".webp", ".pdf"];
    const ext = extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error("Only JPG, PNG, WebP, and PDF files are allowed."));
  },
});

const router = Router();

// All profile routes require auth
router.use(requireAuth);

// ── Get profile ────────────────────────────────────────────
router.get("/", (req, res) => {
  const user = stmts.findById.get(req.userId);
  if (!user) return res.status(404).json({ error: "User not found." });
  res.json({ user });
});

// ── Update profile ─────────────────────────────────────────
router.put("/", (req, res) => {
  const { name, election_card_number, constituency, state } = req.body;

  if (name?.trim()) {
    stmts.updateName.run(name.trim(), req.userId);
  }

  stmts.updateProfile.run(
    election_card_number || null,
    null, // Image updated separately
    constituency || null,
    state || null,
    req.userId
  );

  const user = stmts.findById.get(req.userId);
  res.json({ user, message: "Profile updated." });
});

// ── Upload election card ───────────────────────────────────
router.post("/election-card", upload.single("electionCard"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded." });
  }

  const imagePath = `/uploads/${req.file.filename}`;

  // Update user's election card image
  const user = stmts.findById.get(req.userId);
  stmts.updateProfile.run(
    user.election_card_number,
    imagePath,
    user.constituency,
    user.state,
    req.userId
  );

  res.json({ imagePath, message: "Election card uploaded successfully." });
});

// ── Get chat sessions ──────────────────────────────────────
router.get("/chat-sessions", (req, res) => {
  const sessions = stmts.getSessions.all(req.userId);
  res.json({ sessions });
});

// ── Get chat history for a session ─────────────────────────
router.get("/chat-history/:sessionId", (req, res) => {
  const history = stmts.getHistory.all(req.userId, req.params.sessionId);
  res.json({ history });
});

// ── Get voting plans ───────────────────────────────────────
router.get("/voting-plans", (req, res) => {
  const plans = stmts.getPlans.all(req.userId);
  res.json({ plans: plans.map(p => ({ ...p, plan_data: JSON.parse(p.plan_data), answers: p.answers ? JSON.parse(p.answers) : null })) });
});

export default router;
