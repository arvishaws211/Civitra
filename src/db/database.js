import Database from "better-sqlite3";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { mkdirSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DB_DIR = join(__dirname, "../../data");
mkdirSync(DB_DIR, { recursive: true });

const db = new Database(join(DB_DIR, "civitra.db"));

// ── Enable WAL mode for performance ────────────────────────
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// ── Schema ─────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    election_card_number TEXT,
    election_card_image TEXT,
    constituency TEXT,
    state TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS chat_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    session_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('user','model')),
    message TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS voting_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    plan_data TEXT NOT NULL,
    answers TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    used INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_chat_user ON chat_history(user_id);
  CREATE INDEX IF NOT EXISTS idx_chat_session ON chat_history(session_id);
  CREATE INDEX IF NOT EXISTS idx_plans_user ON voting_plans(user_id);
  CREATE INDEX IF NOT EXISTS idx_reset_token ON password_reset_tokens(token);
`);

// ── Prepared Statements ────────────────────────────────────
const stmts = {
  // Users
  createUser: db.prepare("INSERT INTO users (name, email, password) VALUES (?, ?, ?)"),
  findByEmail: db.prepare("SELECT * FROM users WHERE email = ?"),
  findById: db.prepare(
    "SELECT id, name, email, election_card_number, election_card_image, constituency, state, created_at FROM users WHERE id = ?"
  ),
  updateProfile: db.prepare(
    "UPDATE users SET election_card_number = ?, election_card_image = ?, constituency = ?, state = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
  ),
  updatePassword: db.prepare(
    "UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
  ),
  updateName: db.prepare("UPDATE users SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"),

  // Chat
  saveMessage: db.prepare(
    "INSERT INTO chat_history (user_id, session_id, role, message) VALUES (?, ?, ?, ?)"
  ),
  getHistory: db.prepare(
    "SELECT role, message, created_at FROM chat_history WHERE user_id = ? AND session_id = ? ORDER BY created_at ASC LIMIT 40"
  ),
  getSessions: db.prepare(
    "SELECT DISTINCT session_id, MIN(created_at) as started, MAX(created_at) as last_active FROM chat_history WHERE user_id = ? GROUP BY session_id ORDER BY last_active DESC LIMIT 20"
  ),

  // Voting Plans
  savePlan: db.prepare("INSERT INTO voting_plans (user_id, plan_data, answers) VALUES (?, ?, ?)"),
  getPlans: db.prepare(
    "SELECT * FROM voting_plans WHERE user_id = ? ORDER BY updated_at DESC LIMIT 10"
  ),
  getLatestPlan: db.prepare(
    "SELECT * FROM voting_plans WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1"
  ),

  // Password Reset
  createResetToken: db.prepare(
    "INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)"
  ),
  findResetToken: db.prepare(
    "SELECT * FROM password_reset_tokens WHERE token = ? AND used = 0 AND expires_at > datetime('now')"
  ),
  markTokenUsed: db.prepare("UPDATE password_reset_tokens SET used = 1 WHERE token = ?"),
};

export { db, stmts };
