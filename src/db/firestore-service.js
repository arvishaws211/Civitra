import { db } from "../config/firebase.js";

export const firestoreService = {
  // ── Users ────────────────────────────────────────────────
  async createUser(userData) {
    const userRef = db.collection("users").doc();
    await userRef.set({
      ...userData,
      id: userRef.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    return { lastInsertRowid: userRef.id };
  },

  async findUserByEmail(email) {
    const snapshot = await db
      .collection("users")
      .where("email", "==", email.toLowerCase())
      .limit(1)
      .get();
    if (snapshot.empty) return null;
    return snapshot.docs[0].data();
  },

  async findUserById(id) {
    const doc = await db.collection("users").doc(id).get();
    return doc.exists ? doc.data() : null;
  },

  async updateProfile(id, data) {
    await db
      .collection("users")
      .doc(id)
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      });
  },

  // ── Chat History ─────────────────────────────────────────
  async saveChatMessage(userId, sessionId, role, message) {
    await db.collection("chats").add({
      userId,
      sessionId,
      role,
      message,
      created_at: new Date().toISOString(),
    });
  },

  async getChatHistory(userId, sessionId) {
    const snapshot = await db
      .collection("chats")
      .where("userId", "==", userId)
      .where("sessionId", "==", sessionId)
      .orderBy("created_at", "asc")
      .limit(40)
      .get();
    return snapshot.docs.map((doc) => doc.data());
  },

  async getChatSessions(userId) {
    const snapshot = await db.collection("chats").where("userId", "==", userId).get();

    const sessions = {};
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      if (!sessions[data.sessionId]) {
        sessions[data.sessionId] = { started: data.created_at, last_active: data.created_at };
      } else {
        if (data.created_at > sessions[data.sessionId].last_active) {
          sessions[data.sessionId].last_active = data.created_at;
        }
      }
    });

    return Object.entries(sessions)
      .map(([id, stats]) => ({
        session_id: id,
        ...stats,
      }))
      .sort((a, b) => b.last_active.localeCompare(a.last_active));
  },

  // ── Voting Plans ─────────────────────────────────────────
  async saveVotingPlan(userId, planData, answers) {
    await db.collection("voting_plans").add({
      userId,
      plan_data: planData,
      answers,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  },

  async getVotingPlans(userId) {
    const snapshot = await db
      .collection("voting_plans")
      .where("userId", "==", userId)
      .orderBy("updated_at", "desc")
      .limit(10)
      .get();
    return snapshot.docs.map((doc) => doc.data());
  },

  // ── Password Reset ───────────────────────────────────────
  async createResetToken(userId, token, expiresAt) {
    await db.collection("password_resets").doc(token).set({
      userId,
      expires_at: expiresAt,
      used: false,
      created_at: new Date().toISOString(),
    });
  },

  async findResetToken(token) {
    const doc = await db.collection("password_resets").doc(token).get();
    if (!doc.exists) return null;
    const data = doc.data();
    if (data.used || new Date(data.expires_at) < new Date()) return null;
    return { user_id: data.userId };
  },

  async markTokenUsed(token) {
    await db.collection("password_resets").doc(token).update({ used: true });
  },
};
