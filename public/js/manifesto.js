import { showToast } from "./app.js";

let selectedParties = [];
let selectedIssues = [];

const DEFAULT_ISSUES = [
  "Economy & Jobs",
  "Education",
  "Healthcare",
  "Agriculture",
  "Infrastructure",
  "Women's Empowerment",
  "Environment & Climate",
  "Digital India & Technology",
  "National Security",
  "Social Welfare",
];

export async function initManifesto() {
  await loadParties();
  renderIssues();
  document.getElementById("manifesto-compare-btn")?.addEventListener("click", runComparison);
  document.getElementById("manifesto-back")?.addEventListener("click", showSelector);
}

async function loadParties() {
  try {
    const res = await fetch("/api/manifesto/parties");
    const data = await res.json();
    renderParties(data);
  } catch {
    showToast("Failed to load party list", "error");
  }
}

function renderParties(data) {
  const container = document.getElementById("manifesto-parties");

  let html =
    '<div class="manifesto__group"><h4>National Parties</h4><div class="manifesto__chips">';
  data.national.forEach((p) => {
    html += `<div class="manifesto__chip" data-party="${p.abbr}" data-fullname="${p.name}">${p.abbr}</div>`;
  });
  html += "</div></div>";

  html += '<div class="manifesto__group"><h4>Regional Parties</h4><div class="manifesto__chips">';
  data.regional.forEach((p) => {
    html += `<div class="manifesto__chip" data-party="${p.abbr}" data-fullname="${p.name}">${p.abbr} <span class="manifesto__chip-state">${p.state}</span></div>`;
  });
  html += "</div></div>";

  container.innerHTML = html;

  container.querySelectorAll(".manifesto__chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      chip.classList.toggle("selected");
      const party = chip.dataset.fullname;
      if (chip.classList.contains("selected")) {
        selectedParties.push(party);
      } else {
        selectedParties = selectedParties.filter((p) => p !== party);
      }
      updateCompareBtn();
    });
  });
}

function renderIssues() {
  const container = document.getElementById("manifesto-issues");
  let html = '<div class="manifesto__chips">';
  DEFAULT_ISSUES.forEach((issue) => {
    html += `<div class="manifesto__chip manifesto__chip--issue" data-issue="${issue}">${issue}</div>`;
  });
  html += "</div>";
  container.innerHTML = html;

  container.querySelectorAll(".manifesto__chip--issue").forEach((chip) => {
    chip.addEventListener("click", () => {
      chip.classList.toggle("selected");
      const issue = chip.dataset.issue;
      if (chip.classList.contains("selected")) {
        selectedIssues.push(issue);
      } else {
        selectedIssues = selectedIssues.filter((i) => i !== issue);
      }
    });
  });
}

function updateCompareBtn() {
  const btn = document.getElementById("manifesto-compare-btn");
  btn.disabled = selectedParties.length < 2;
  btn.textContent =
    selectedParties.length < 2
      ? `Select ${2 - selectedParties.length} more ${selectedParties.length === 1 ? "party" : "parties"}`
      : `Compare ${selectedParties.length} Parties`;
}

async function runComparison() {
  const selector = document.getElementById("manifesto-selector");
  const results = document.getElementById("manifesto-results");
  const content = document.getElementById("manifesto-results-content");

  selector.style.display = "none";
  results.style.display = "block";
  content.innerHTML =
    '<div style="text-align:center;padding:60px 20px"><div class="spinner"></div><p style="margin-top:16px;color:var(--text-secondary)">Analyzing manifestos with AI...<br><small>This may take a moment</small></p></div>';

  try {
    const res = await fetch("/api/manifesto/compare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        parties: selectedParties,
        issues: selectedIssues.length ? selectedIssues : null,
      }),
    });

    if (!res.ok) throw new Error("Failed");
    const data = await res.json();
    renderComparison(data);
  } catch (err) {
    content.innerHTML =
      '<p style="color:var(--error);text-align:center;padding:40px">Failed to generate comparison. Please try again.</p>';
    showToast("Manifesto comparison failed", "error");
  }
}

function renderComparison(data) {
  const content = document.getElementById("manifesto-results-content");

  // Handle rawContent fallback
  if (data.rawContent) {
    try {
      const cleaned = data.rawContent
        .replace(/```json\s*/gi, "")
        .replace(/```\s*/g, "")
        .trim();
      const parsed = JSON.parse(cleaned);
      Object.assign(data, parsed);
      delete data.rawContent;
    } catch {
      content.innerHTML = `<div class="glass-card" style="padding:24px">${typeof marked !== "undefined" ? marked.parse(data.rawContent) : data.rawContent}</div>`;
      return;
    }
  }

  let html = "";

  // Disclaimer
  if (data.disclaimer) {
    html += `<div class="manifesto__disclaimer glass-card"><span>⚖️</span> ${data.disclaimer}</div>`;
  }

  // Comparisons
  if (data.comparisons?.length) {
    data.comparisons.forEach((comp) => {
      html += `<div class="manifesto__issue-card glass-card">`;
      html += `<h3 class="manifesto__issue-title">${comp.issue}</h3>`;
      html += '<div class="manifesto__positions">';

      comp.positions?.forEach((pos) => {
        html += `
          <div class="manifesto__position">
            <div class="manifesto__party-badge">${pos.party}</div>
            <p class="manifesto__stance">${pos.stance}</p>
            ${
              pos.keyPromises?.length
                ? `
              <ul class="manifesto__promises">
                ${pos.keyPromises.map((p) => `<li>${p}</li>`).join("")}
              </ul>
            `
                : ""
            }
          </div>
        `;
      });

      html += "</div></div>";
    });
  }

  // Sources
  if (data.sources?.length) {
    html += '<div class="manifesto__sources glass-card"><h4>📚 Sources</h4><ul>';
    data.sources.forEach((s) => {
      html += `<li>${s}</li>`;
    });
    html += "</ul></div>";
  }

  content.innerHTML = html;
}

function showSelector() {
  document.getElementById("manifesto-selector").style.display = "block";
  document.getElementById("manifesto-results").style.display = "none";
}
