import { showToast } from './app.js';

const STATES = ['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Delhi','Jammu & Kashmir','Ladakh','Puducherry','Chandigarh','Andaman & Nicobar','Dadra Nagar Haveli & Daman Diu','Lakshadweep'];

const STEPS = [
  { key: 'age', title: 'How old are you?', desc: 'Your age determines your eligibility.', type: 'input', inputType: 'number', placeholder: 'Enter your age', min: 1, max: 120 },
  { key: 'state', title: 'Which state do you reside in?', desc: 'Election rules can vary by state.', type: 'select', options: STATES },
  { key: 'isRegistered', title: 'Are you registered as a voter?', desc: 'Do you have your name on the electoral roll?', type: 'choice', options: [{ label: 'Yes, I am registered', value: true }, { label: 'No / Not sure', value: false }] },
  { key: 'hasVoterId', title: 'Do you have a Voter ID (EPIC)?', desc: 'The Elector\'s Photo Identity Card issued by ECI.', type: 'choice', options: [{ label: 'Yes, I have it', value: true }, { label: 'No, I don\'t have one', value: false }] },
  { key: 'isFirstTime', title: 'Is this your first time voting?', desc: 'We\'ll add extra guidance if needed.', type: 'choice', options: [{ label: 'Yes, first time! 🎉', value: true }, { label: 'No, I\'ve voted before', value: false }] },
  { key: 'extras', title: 'Any of these apply to you?', desc: 'Select all that apply for personalized guidance.', type: 'multi', options: [{ label: 'I am an NRI (Non-Resident Indian)', key: 'isNRI' }, { label: 'I am a person with disability', key: 'hasPwD' }, { label: 'I am a senior citizen (80+)', key: 'isSenior' }] },
];

let currentStep = 0;
let answers = {};
let sid = '';

export function initVotingPlan(sessionId) {
  sid = sessionId;
  renderStep();
  document.getElementById('plan-next').addEventListener('click', nextStep);
  document.getElementById('plan-prev').addEventListener('click', prevStep);
}

function renderStep() {
  const step = STEPS[currentStep];
  const container = document.getElementById('plan-step');
  const progress = document.getElementById('plan-progress-bar');
  progress.style.width = `${((currentStep + 1) / STEPS.length) * 100}%`;
  document.getElementById('plan-prev').style.display = currentStep > 0 ? 'inline-flex' : 'none';
  const nextBtn = document.getElementById('plan-next');
  nextBtn.textContent = currentStep === STEPS.length - 1 ? 'Generate My Plan' : 'Next';

  let html = `<h3>${step.title}</h3><p>${step.desc}</p>`;

  if (step.type === 'input') {
    html += `<input class="plan__input" type="${step.inputType}" id="step-input" placeholder="${step.placeholder}" min="${step.min || ''}" max="${step.max || ''}" value="${answers[step.key] || ''}">`;
  } else if (step.type === 'select') {
    html += `<select class="plan__input plan__select" id="step-input"><option value="">-- Select --</option>${step.options.map(o => `<option value="${o}" ${answers[step.key] === o ? 'selected' : ''}>${o}</option>`).join('')}</select>`;
  } else if (step.type === 'choice') {
    html += `<div class="plan__options">${step.options.map((o, i) => `<label class="plan__option ${answers[step.key] === o.value ? 'selected' : ''}" data-value="${o.value}"><input type="radio" name="step" value="${o.value}"><div class="plan__option-radio"></div>${o.label}</label>`).join('')}</div>`;
  } else if (step.type === 'multi') {
    html += `<div class="plan__options">${step.options.map(o => `<label class="plan__option ${answers[o.key] ? 'selected' : ''}" data-key="${o.key}"><input type="checkbox" ${answers[o.key] ? 'checked' : ''}><div class="plan__option-radio"></div>${o.label}</label>`).join('')}</div>`;
  }

  container.innerHTML = html;

  // Bind choice/multi events
  container.querySelectorAll('.plan__option').forEach(opt => {
    opt.addEventListener('click', () => {
      if (step.type === 'choice') {
        container.querySelectorAll('.plan__option').forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        const val = opt.dataset.value;
        answers[step.key] = val === 'true' ? true : val === 'false' ? false : val;
      } else if (step.type === 'multi') {
        opt.classList.toggle('selected');
        answers[opt.dataset.key] = opt.classList.contains('selected');
      }
    });
  });
}

function collectCurrentAnswer() {
  const step = STEPS[currentStep];
  if (step.type === 'input' || step.type === 'select') {
    const el = document.getElementById('step-input');
    if (el) answers[step.key] = step.inputType === 'number' ? parseInt(el.value) : el.value;
  }
}

function nextStep() {
  collectCurrentAnswer();
  if (currentStep < STEPS.length - 1) {
    currentStep++;
    renderStep();
  } else {
    generatePlan();
  }
}

function prevStep() {
  collectCurrentAnswer();
  if (currentStep > 0) { currentStep--; renderStep(); }
}

async function generatePlan() {
  const wizard = document.getElementById('plan-wizard');
  const result = document.getElementById('plan-result');
  wizard.style.display = 'none';
  result.style.display = 'block';
  const content = document.getElementById('plan-result-content');
  content.innerHTML = '<div style="text-align:center;padding:60px 20px"><div class="spinner"></div><p style="margin-top:16px;color:var(--text-secondary)">Generating your personalized voting plan...</p></div>';

  try {
    const res = await fetch('/api/voting-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(answers),
    });
    if (!res.ok) throw new Error('Failed');
    const plan = await res.json();
    renderPlan(plan);
  } catch (err) {
    content.innerHTML = '<p style="color:var(--error);text-align:center;padding:40px">Failed to generate plan. Please try again.</p>';
    showToast('Failed to generate voting plan', 'error');
  }
}

function renderPlan(plan) {
  const content = document.getElementById('plan-result-content');

  if (plan.rawContent) {
    content.innerHTML = `<div class="plan__result-card glass-card"><h3>📋 ${plan.title}</h3>${typeof marked !== 'undefined' ? marked.parse(plan.rawContent) : plan.rawContent}</div>` + resetBtn();
    return;
  }

  let html = `<div class="plan__result-card glass-card"><h3>📋 ${plan.title}</h3><p style="color:var(--text-secondary);margin-bottom:16px">${plan.summary || ''}</p>`;
  if (plan.steps?.length) {
    html += '<ul class="plan__checklist">';
    plan.steps.forEach(s => {
      html += `<li><div class="plan__check" onclick="this.classList.toggle('checked')"></div><div><div class="plan__step-title">Step ${s.step}: ${s.title}</div><div class="plan__step-desc">${s.description}</div>`;
      if (s.deadline) html += `<div class="plan__step-meta">⏰ ${s.deadline}</div>`;
      if (s.documents?.length) html += `<div class="plan__step-meta">📄 ${s.documents.join(', ')}</div>`;
      if (s.link) html += `<div class="plan__step-meta">🔗 <a href="${s.link}" target="_blank">${s.link}</a></div>`;
      html += '</div></li>';
    });
    html += '</ul></div>';
  }

  if (plan.tips?.length) {
    html += '<div class="plan__tips"><h4>💡 Tips for You</h4><ul>';
    plan.tips.forEach(t => { html += `<li>${t}</li>`; });
    html += '</ul></div>';
  }

  if (plan.emergencyContacts) {
    html += `<div class="plan__result-card glass-card" style="margin-top:16px"><h3>📞 Helpful Contacts</h3><p>Helpline: <strong>${plan.emergencyContacts.helpline}</strong> | Website: <a href="${plan.emergencyContacts.website}" target="_blank">${plan.emergencyContacts.website}</a> | App: ${plan.emergencyContacts.app}</p></div>`;
  }

  html += resetBtn();
  content.innerHTML = html;
}

function resetBtn() {
  return '<div class="plan__result-actions"><button class="btn btn--ghost" onclick="document.getElementById(\'plan-wizard\').style.display=\'block\';document.getElementById(\'plan-result\').style.display=\'none\'">← Start Over</button></div>';
}
