import { showToast } from "./app.js";

let questions = [];
let currentQ = 0;
let score = 0;

export function initQuiz() {
  document.getElementById("quiz-begin")?.addEventListener("click", startQuiz);
  document.getElementById("quiz-next-q")?.addEventListener("click", nextQuestion);
  document.getElementById("quiz-retry")?.addEventListener("click", resetQuiz);
}

async function startQuiz() {
  const topic = document.getElementById("quiz-topic").value;
  const startEl = document.getElementById("quiz-start");
  const activeEl = document.getElementById("quiz-active");

  startEl.innerHTML =
    '<div style="text-align:center;padding:48px"><div class="spinner"></div><p style="margin-top:16px;color:var(--text-secondary)">Generating questions...</p></div>';

  try {
    const res = await fetch("/api/quiz/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic, difficulty: "Medium" }),
    });
    if (!res.ok) throw new Error("Failed");
    const data = await res.json();
    questions = data.questions;
    currentQ = 0;
    score = 0;

    startEl.style.display = "none";
    activeEl.style.display = "block";
    renderQuestion();
  } catch {
    startEl.innerHTML =
      '<div style="text-align:center;padding:48px"><div class="quiz__start-icon">🧠</div><h3>Ready to test your election knowledge?</h3><p style="color:var(--error);margin:12px 0">Failed to generate quiz. Check your API key.</p><button class="btn btn--primary btn--lg" id="quiz-begin">Try Again</button></div>';
    document.getElementById("quiz-begin")?.addEventListener("click", startQuiz);
    showToast("Failed to load quiz", "error");
  }
}

function renderQuestion() {
  const q = questions[currentQ];
  document.getElementById("quiz-counter").textContent =
    `Question ${currentQ + 1} of ${questions.length}`;
  document.getElementById("quiz-score").textContent = `Score: ${score}`;
  document.getElementById("quiz-question").textContent = q.question;
  document.getElementById("quiz-explanation").style.display = "none";
  document.getElementById("quiz-next-q").style.display = "none";

  const optionsEl = document.getElementById("quiz-options");
  optionsEl.innerHTML = q.options
    .map((opt, i) => `<div class="quiz__option" data-index="${i}">${opt}</div>`)
    .join("");

  optionsEl.querySelectorAll(".quiz__option").forEach((el) => {
    el.addEventListener("click", () => selectAnswer(parseInt(el.dataset.index)));
  });
}

function selectAnswer(index) {
  const q = questions[currentQ];
  const options = document.querySelectorAll(".quiz__option");

  // Disable all
  options.forEach((o) => {
    o.classList.add("quiz__option--disabled");
    o.style.pointerEvents = "none";
  });

  // Mark correct/wrong
  options[q.correctIndex]?.classList.add("quiz__option--correct");
  if (index !== q.correctIndex) {
    options[index]?.classList.add("quiz__option--wrong");
  } else {
    score++;
    document.getElementById("quiz-score").textContent = `Score: ${score}`;
  }

  // Show explanation
  const expEl = document.getElementById("quiz-explanation");
  expEl.innerHTML = `<strong>${index === q.correctIndex ? "✅ Correct!" : "❌ Not quite."}</strong> ${q.explanation}`;
  expEl.style.display = "block";

  // Show next button
  const nextBtn = document.getElementById("quiz-next-q");
  nextBtn.style.display = "inline-flex";
  nextBtn.textContent = currentQ < questions.length - 1 ? "Next Question" : "See Results";
}

function nextQuestion() {
  currentQ++;
  if (currentQ < questions.length) {
    renderQuestion();
  } else {
    showResults();
  }
}

function showResults() {
  document.getElementById("quiz-active").style.display = "none";
  const resultsEl = document.getElementById("quiz-results");
  resultsEl.style.display = "block";

  const pct = Math.round((score / questions.length) * 100);
  let emoji = "🎉",
    msg = "Outstanding! You're an election expert!";
  if (pct < 40) {
    emoji = "📚";
    msg = "Keep learning! Democracy needs informed citizens.";
  } else if (pct < 70) {
    emoji = "👍";
    msg = "Good effort! A little more learning and you'll be an expert.";
  } else if (pct < 100) {
    emoji = "🌟";
    msg = "Great job! You know your elections well!";
  }

  document.getElementById("quiz-results-content").innerHTML = `
    <h3>${emoji} Quiz Complete!</h3>
    <div class="quiz__score-circle">${score}/${questions.length}</div>
    <p>${msg}</p>
  `;
}

function resetQuiz() {
  questions = [];
  currentQ = 0;
  score = 0;
  document.getElementById("quiz-results").style.display = "none";
  document.getElementById("quiz-active").style.display = "none";
  const startEl = document.getElementById("quiz-start");
  startEl.style.display = "block";
  startEl.innerHTML =
    '<div class="quiz__start-icon">🧠</div><h3>Ready to test your election knowledge?</h3><p>5 questions about the Indian democratic process. Non-partisan. Educational. Fun!</p><div class="quiz__topics"><label class="quiz__topic-label">Choose a topic:</label><select id="quiz-topic" class="quiz__topic-select"><option value="General">General Knowledge</option><option value="Voter Registration">Voter Registration</option><option value="Voting Process">Voting Process</option><option value="EVM and VVPAT">EVM & VVPAT</option><option value="Special Provisions">Special Provisions</option><option value="Election Commission">Election Commission</option></select></div><button class="btn btn--primary btn--lg" id="quiz-begin">Start Quiz</button>';
  document.getElementById("quiz-begin")?.addEventListener("click", startQuiz);
}
