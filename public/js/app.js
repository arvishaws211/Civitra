import { initChat } from "./chat.js";
import { initLearn } from "./learn.js";
import { initVotingPlan } from "./voting-plan.js";
import { initQuiz } from "./quiz.js";
import { initBooth } from "./booth.js";
import { initManifesto } from "./manifesto.js";
import { initAuth, isLoggedIn, getUser } from "./auth.js";
import { initProfile } from "./profile.js";
import { initJourney } from "./journey.js";

// ── Session ────────────────────────────────────────────────
function getSessionId() {
  let id = localStorage.getItem("civitra_session");
  if (!id) {
    id = crypto.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2);
    localStorage.setItem("civitra_session", id);
  }
  return id;
}

// ── Navigation ─────────────────────────────────────────────
function initNav() {
  const navItems = document.querySelectorAll(".nav-item");
  const views = document.querySelectorAll(".view");

  window.__switchView = function switchView(viewId) {
    views.forEach((v) => v.classList.remove("view--active"));
    navItems.forEach((n) => n.classList.remove("active"));
    document.getElementById(`view-${viewId}`)?.classList.add("view--active");
    document.querySelector(`[data-view="${viewId}"]`)?.classList.add("active");
    // Close mobile sidebar
    document.getElementById("sidebar")?.classList.remove("open");
    document.getElementById("sidebar-overlay")?.classList.remove("open");
  };

  navItems.forEach((item) => {
    item.addEventListener("click", () => window.__switchView(item.dataset.view));
  });

  // Mobile menu
  document.getElementById("mobile-menu-btn")?.addEventListener("click", () => {
    document.getElementById("sidebar")?.classList.toggle("open");
    document.getElementById("sidebar-overlay")?.classList.toggle("open");
  });
  document.getElementById("sidebar-overlay")?.addEventListener("click", () => {
    document.getElementById("sidebar")?.classList.remove("open");
    document.getElementById("sidebar-overlay")?.classList.remove("open");
  });
}

// ── Toast ──────────────────────────────────────────────────
export function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = `toast toast--${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ── Auth State UI ──────────────────────────────────────────
function updateAuthUI(loggedIn) {
  const authView = document.getElementById("view-auth");
  const appViews = document.getElementById("app-authenticated");
  const sidebar = document.getElementById("sidebar");
  const mobileHeader = document.getElementById("mobile-header");
  const profileNav = document.getElementById("nav-profile");
  const logoutBtn = document.getElementById("logout-btn");
  const userNameEl = document.getElementById("sidebar-user-name");

  if (loggedIn) {
    authView.style.display = "none";
    appViews.style.display = "block";
    sidebar.style.display = "flex";
    mobileHeader.style.display = "";
    if (profileNav) profileNav.style.display = "";
    if (logoutBtn) logoutBtn.style.display = "";
    if (userNameEl) {
      const user = getUser();
      userNameEl.textContent = user?.name || "";
    }
    // Init features
    const sessionId = getSessionId();
    initChat(sessionId);
    initLearn();
    initVotingPlan(sessionId);
    initQuiz();
    initBooth();
    initManifesto();
    initProfile();
    initJourney();
    window.__switchView("chat");
  } else {
    authView.style.display = "flex";
    appViews.style.display = "none";
    sidebar.style.display = "none";
    mobileHeader.style.display = "none";
  }
}

// ── Init ───────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  initNav();
  initAuth(updateAuthUI);

  // If not logged in, show auth view
  if (!isLoggedIn()) {
    updateAuthUI(false);
  }
});
