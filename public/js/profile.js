import { showToast } from "./app.js";
import { authHeaders, getUser } from "./auth.js";

export async function initProfile() {
  document.getElementById("profile-form")?.addEventListener("submit", updateProfile);
  document.getElementById("election-card-form")?.addEventListener("submit", uploadCard);
  await loadProfile();
  await loadChatSessions();
  await loadVotingPlans();
}

async function loadProfile() {
  try {
    const res = await fetch("/api/profile", { headers: authHeaders() });
    if (!res.ok) return;
    const { user } = await res.json();

    document.getElementById("profile-name").value = user.name || "";
    document.getElementById("profile-email").value = user.email || "";
    document.getElementById("profile-epic").value = user.election_card_number || "";
    document.getElementById("profile-constituency").value = user.constituency || "";
    document.getElementById("profile-state").value = user.state || "";
    document.getElementById("profile-user-name").textContent = user.name;
    document.getElementById("profile-user-email").textContent = user.email;

    if (user.election_card_image) {
      document.getElementById("card-preview").innerHTML =
        `<img src="${user.election_card_image}" alt="Election Card" class="profile__card-img">`;
    }

    // Member since
    const joined = new Date(user.created_at).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
    });
    document.getElementById("profile-joined").textContent = `Member since ${joined}`;
  } catch {
    /* ignore */
  }
}

async function updateProfile(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = "Saving...";

  try {
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({
        name: document.getElementById("profile-name").value,
        election_card_number: document.getElementById("profile-epic").value,
        constituency: document.getElementById("profile-constituency").value,
        state: document.getElementById("profile-state").value,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    // Update stored user
    const user = JSON.parse(localStorage.getItem("civitra_user"));
    user.name = document.getElementById("profile-name").value;
    localStorage.setItem("civitra_user", JSON.stringify(user));

    showToast("Profile updated!", "success");
  } catch (err) {
    showToast(err.message, "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "Save Changes";
  }
}

async function uploadCard(e) {
  e.preventDefault();
  const fileInput = document.getElementById("election-card-file");
  if (!fileInput.files.length) {
    showToast("Select a file first.", "error");
    return;
  }

  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = "Uploading...";

  try {
    const formData = new FormData();
    formData.append("electionCard", fileInput.files[0]);

    const res = await fetch("/api/profile/election-card", {
      method: "POST",
      headers: authHeaders(),
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    document.getElementById("card-preview").innerHTML =
      `<img src="${data.imagePath}" alt="Election Card" class="profile__card-img">`;
    showToast("Election card uploaded!", "success");
  } catch (err) {
    showToast(err.message, "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "Upload";
  }
}

async function loadChatSessions() {
  try {
    const res = await fetch("/api/profile/chat-sessions", { headers: authHeaders() });
    if (!res.ok) return;
    const { sessions } = await res.json();
    const container = document.getElementById("profile-chat-sessions");
    if (!sessions.length) {
      container.innerHTML =
        '<p class="profile__empty">No chat history yet. Start a conversation!</p>';
      return;
    }

    container.innerHTML = sessions
      .map((s) => {
        const started = new Date(s.started).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
        return `<div class="profile__session-item" data-session="${s.session_id}">
        <div class="profile__session-info">
          <span class="profile__session-date">💬 ${started}</span>
          <span class="profile__session-id">${s.session_id.slice(0, 8)}...</span>
        </div>
        <button class="btn btn--ghost btn--sm profile__resume-btn" data-session="${s.session_id}">Resume</button>
      </div>`;
      })
      .join("");

    container.querySelectorAll(".profile__resume-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        localStorage.setItem("civitra_session", btn.dataset.session);
        // Switch to chat view
        document.querySelector('[data-view="chat"]')?.click();
        showToast("Chat session restored!", "success");
        setTimeout(() => location.reload(), 300);
      });
    });
  } catch {
    /* ignore */
  }
}

async function loadVotingPlans() {
  try {
    const res = await fetch("/api/profile/voting-plans", { headers: authHeaders() });
    if (!res.ok) return;
    const { plans } = await res.json();
    const container = document.getElementById("profile-voting-plans");
    if (!plans.length) {
      container.innerHTML =
        '<p class="profile__empty">No saved voting plans. Create one in the Voting Plan tab!</p>';
      return;
    }

    container.innerHTML = plans
      .map((p) => {
        const date = new Date(p.created_at).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
        const title = p.plan_data?.title || "Voting Plan";
        return `<div class="profile__plan-item">
        <div class="profile__plan-info">
          <span class="profile__plan-title">📋 ${title}</span>
          <span class="profile__plan-date">${date}</span>
        </div>
      </div>`;
      })
      .join("");
  } catch {
    /* ignore */
  }
}
