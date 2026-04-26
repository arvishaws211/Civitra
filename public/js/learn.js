import { showToast } from './app.js';

const TOPICS = [
  { id: 'eligibility', icon: '🎂', title: 'Voter Eligibility', desc: 'Who can vote? Age, citizenship, and residency requirements explained.', prompt: 'Explain voter eligibility requirements in India in detail. Cover age, citizenship, residency, and disqualifications. Use tables and lists.' },
  { id: 'registration', icon: '📋', title: 'Voter Registration', desc: 'Step-by-step guide to registering as a voter — online and offline.', prompt: 'Give a complete guide to voter registration in India. Cover Form 6, online registration at voters.eci.gov.in, offline methods, required documents, and the Voter Helpline App. Use numbered steps.' },
  { id: 'voting-day', icon: '🗳️', title: 'Voting Day Guide', desc: 'What happens at the polling booth? EVM, VVPAT, and your rights.', prompt: 'Explain what happens on Election Day in India step by step. Cover what to bring, polling booth procedures, EVM usage, VVPAT verification, and voter rights. Include timing details.' },
  { id: 'election-types', icon: '🏛️', title: 'Types of Elections', desc: 'Lok Sabha, Vidhan Sabha, Panchayat — understand each level.', prompt: 'Explain all types of elections in India — Lok Sabha, Rajya Sabha, Vidhan Sabha, Panchayat, and Municipal elections. Use a comparison table with scope, term, and conducting body.' },
  { id: 'special', icon: '♿', title: 'Special Provisions', desc: 'Voting rights for NRIs, persons with disabilities, senior citizens, and more.', prompt: 'Explain all special voting provisions in India for NRI voters, persons with disabilities, senior citizens (80+), service voters, transgender voters, and first-time voters. Cover forms, facilities, and postal ballots.' },
  { id: 'nota', icon: '❌', title: 'NOTA & Your Rights', desc: 'Understanding NOTA, election complaints, and your democratic rights.', prompt: 'Explain NOTA (None of the Above) in Indian elections — its history, how it works on the EVM, its legal effect, and voter rights including the right to reject. Also cover how to file election complaints.' },
  { id: 'eci', icon: '⚖️', title: 'Election Commission', desc: 'How the ECI works, Model Code of Conduct, and election timeline.', prompt: 'Explain the Election Commission of India — its constitutional basis, composition, powers, the Model Code of Conduct, and a typical election timeline from announcement to results. Use a timeline format.' },
  { id: 'voter-id', icon: '🪪', title: 'Voter ID (EPIC)', desc: 'Getting, correcting, and using your Voter ID card.', prompt: 'Explain everything about the Voter ID card (EPIC) in India — how to apply, required documents, how to correct details using Form 8, alternative IDs accepted at polling booths, and the e-EPIC digital voter ID.' },
];

export function initLearn() {
  renderGrid();
  document.getElementById('learn-back')?.addEventListener('click', showGrid);
}

function renderGrid() {
  const grid = document.getElementById('learn-grid');
  grid.innerHTML = TOPICS.map(t => `
    <div class="learn__card" data-topic="${t.id}">
      <div class="learn__card-icon">${t.icon}</div>
      <div class="learn__card-title">${t.title}</div>
      <div class="learn__card-desc">${t.desc}</div>
    </div>
  `).join('');

  grid.querySelectorAll('.learn__card').forEach(card => {
    card.addEventListener('click', () => loadTopic(card.dataset.topic));
  });
}

function showGrid() {
  document.getElementById('learn-grid').style.display = 'grid';
  document.getElementById('learn-detail').style.display = 'none';
  document.querySelector('#view-learn .section-header').style.display = 'block';
}

async function loadTopic(topicId) {
  const topic = TOPICS.find(t => t.id === topicId);
  if (!topic) return;

  document.getElementById('learn-grid').style.display = 'none';
  document.querySelector('#view-learn .section-header').style.display = 'none';
  const detail = document.getElementById('learn-detail');
  const content = document.getElementById('learn-detail-content');
  detail.style.display = 'block';
  content.innerHTML = `<h2>${topic.icon} ${topic.title}</h2><div class="learn__loading"><div class="spinner"></div><p style="margin-top:12px">Loading content...</p></div>`;

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: topic.prompt, sessionId: 'learn-' + topicId }),
    });

    if (!res.ok) throw new Error('Failed to load');

    let fullText = '';
    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      for (const line of chunk.split('\n')) {
        if (!line.startsWith('data: ')) continue;
        try {
          const data = JSON.parse(line.slice(6));
          if (data.text) {
            fullText += data.text;
            content.innerHTML = `<h2>${topic.icon} ${topic.title}</h2>` + (typeof marked !== 'undefined' ? marked.parse(fullText) : fullText.replace(/\n/g, '<br>'));
          }
        } catch {}
      }
    }
  } catch (err) {
    content.innerHTML = `<h2>${topic.icon} ${topic.title}</h2><p style="color:var(--error)">Failed to load content. Please check your API key and try again.</p>`;
    showToast('Failed to load topic', 'error');
  }
}
