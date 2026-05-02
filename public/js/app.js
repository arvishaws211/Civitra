import { initChat } from "./chat.js";
import { initLearn } from "./learn.js";
import { initVotingPlan } from "./voting-plan.js";
import { initQuiz } from "./quiz.js";
import { initBooth } from "./booth.js";
import { initManifesto } from "./manifesto.js";
import { initAuth, isLoggedIn, getUser } from "./auth.js";
import { initProfile } from "./profile.js";
import { initJourney } from "./journey.js";
import { initI18n } from "./i18n.js";

// ── Session ────────────────────────────────────────────────
function getSessionId() {
  let id = localStorage.getItem("civitra_session");
  if (!id) {
    id = crypto.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2);
    localStorage.setItem("civitra_session", id);
  }
  return id;
}

// ── PWA Service Worker ─────────────────────────────────────
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.warn("SW registration failed:", err); // eslint-disable-line no-console
    });
  });
}

const MYTHS = [
  "EVMs are standalone machines and are not connected to any network or internet.",
  "NOTA is a protest vote. The candidate with the most votes still wins.",
  "NRIs must be physically present at their registered polling station in India to vote.",
  "You can use 12 different photo IDs (like Aadhaar or Passport) to vote, not just Voter ID.",
  "Indelible ink is used to prevent multiple voting and cannot be easily removed.",
];

function initMythBuster() {
  const mythEl = document.getElementById("myth-text");
  if (!mythEl) return;
  let index = 0;
  setInterval(() => {
    index = (index + 1) % MYTHS.length;
    mythEl.style.opacity = 0;
    setTimeout(() => {
      mythEl.textContent = MYTHS[index];
      mythEl.style.opacity = 1;
    }, 500);
  }, 10000);
}

// ── Navigation ─────────────────────────────────────────────
function initNav() {
  const navItems = document.querySelectorAll(".nav-item");
  const views = document.querySelectorAll(".view");

  window.__switchView = function switchView(viewId) {
    views.forEach((v) => v.classList.remove("view--active"));
    navItems.forEach((n) => {
      n.classList.remove("active");
      n.removeAttribute("aria-current");
    });

    const activeView = document.getElementById(`view-${viewId}`);
    const activeNav = document.querySelector(`[data-view="${viewId}"]`);

    if (activeView) activeView.classList.add("view--active");
    if (activeNav) {
      activeNav.classList.add("active");
      activeNav.setAttribute("aria-current", "page");
    }

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

// ── Global Error Handling ──────────────────────────────────
window.addEventListener("error", (event) => {
  console.error("Global error:", event.error); // eslint-disable-line no-console
  showToast("An unexpected error occurred. Please refresh.", "error");
});

window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled promise rejection:", event.reason); // eslint-disable-line no-console
  showToast("Network error or server unavailable.", "error");
});

// ── Auth State UI ──────────────────────────────────────────
function updateAuthUI(loggedIn) {
  const landingView = document.getElementById("view-landing");
  const authView = document.getElementById("view-auth");
  const appViews = document.getElementById("app-authenticated");
  const sidebar = document.getElementById("sidebar");
  const mobileHeader = document.getElementById("mobile-header");
  const profileNav = document.getElementById("nav-profile");
  const logoutBtn = document.getElementById("logout-btn");
  const userNameEl = document.getElementById("sidebar-user-name");

  if (loggedIn) {
    if (landingView) landingView.style.display = "none";
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
    initI18n();
    window.__switchView("chat");
  } else {
    // Let the CSS handle view-landing being active by default
    appViews.style.display = "none";
    sidebar.style.display = "none";
    mobileHeader.style.display = "none";
  }
}

// ── Init ───────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  initNav();
  initMythBuster();
  initAuth(updateAuthUI);

  // If not logged in, show auth view (or let landing be active)
  if (!isLoggedIn()) {
    updateAuthUI(false);
  }

  // Hook up landing page Get Started button
  const getStartedBtn = document.getElementById("landing-get-started");
  if (getStartedBtn) {
    getStartedBtn.addEventListener("click", () => {
      document.getElementById("view-landing").classList.remove("view--active");
      document.getElementById("view-auth").classList.add("view--active");
      document.getElementById("view-auth").style.display = "flex";
    });
  }

  // Voter Pledge Logic
  const pledgeBtn = document.getElementById("landing-pledge");
  const pledgeModal = document.getElementById("pledge-modal");
  const pledgeClose = document.getElementById("pledge-close");
  const pledgeSubmit = document.getElementById("pledge-submit");

  if (pledgeBtn) {
    pledgeBtn.addEventListener("click", () => {
      pledgeModal.style.display = "flex";
    });
  }
  if (pledgeClose) {
    pledgeClose.addEventListener("click", () => {
      pledgeModal.style.display = "none";
    });
  }
  if (pledgeSubmit) {
    pledgeSubmit.addEventListener("click", () => {
      const name = document.getElementById("pledge-name").value;
      if (!name) return showToast("Please enter your name", "warning");
      document.getElementById("pledge-form").style.display = "none";
      document.getElementById("pledge-success").style.display = "block";
      document.getElementById("pledge-display-name").textContent = name;
      showToast("Pledge committed!", "success");
    });
  }
});
