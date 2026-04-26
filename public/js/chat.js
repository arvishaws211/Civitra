import { showToast } from './app.js';

let sessionId = '';
let isStreaming = false;

export function initChat(sid) {
  sessionId = sid;
  loadSuggestions();
  bindEvents();
}

function bindEvents() {
  const input = document.getElementById('chat-input');
  const sendBtn = document.getElementById('chat-send');

  sendBtn.addEventListener('click', () => sendMessage());
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });
  // Auto-resize textarea
  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 120) + 'px';
  });
}

async function loadSuggestions() {
  try {
    const res = await fetch('/api/chat/suggestions');
    const data = await res.json();
    const container = document.getElementById('suggestions');
    container.innerHTML = data.suggestions.map(s =>
      `<button class="suggestion-chip" onclick="document.getElementById('chat-input').value='${s}';document.getElementById('chat-send').click()">${s}</button>`
    ).join('');
  } catch { /* silently fail */ }
}

function addMessage(role, content) {
  const messages = document.getElementById('chat-messages');
  // Hide welcome on first message
  const welcome = messages.querySelector('.chat__welcome');
  if (welcome) welcome.style.display = 'none';

  const div = document.createElement('div');
  div.className = `message message--${role}`;
  const avatarText = role === 'ai' ? '🗳️' : '👤';
  div.innerHTML = `
    <div class="message__avatar">${avatarText}</div>
    <div class="message__bubble">${role === 'ai' ? parseMarkdown(content) : escapeHtml(content)}</div>
  `;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
  return div;
}

function addTypingIndicator() {
  const messages = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.className = 'message message--ai';
  div.id = 'typing-indicator';
  div.innerHTML = `
    <div class="message__avatar">🗳️</div>
    <div class="message__bubble"><div class="typing"><span></span><span></span><span></span></div></div>
  `;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

function removeTypingIndicator() {
  document.getElementById('typing-indicator')?.remove();
}

async function sendMessage() {
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text || isStreaming) return;

  input.value = '';
  input.style.height = 'auto';
  addMessage('user', text);
  addTypingIndicator();

  isStreaming = true;
  document.getElementById('chat-send').disabled = true;

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, sessionId }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Request failed');
    }

    removeTypingIndicator();
    const msgDiv = addMessage('ai', '');
    const bubble = msgDiv.querySelector('.message__bubble');
    let fullText = '';

    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        try {
          const data = JSON.parse(line.slice(6));
          if (data.error) { showToast(data.error, 'error'); break; }
          if (data.text) {
            fullText += data.text;
            bubble.innerHTML = parseMarkdown(fullText);
            document.getElementById('chat-messages').scrollTop = document.getElementById('chat-messages').scrollHeight;
          }
        } catch { /* skip malformed */ }
      }
    }
  } catch (error) {
    removeTypingIndicator();
    showToast(error.message, 'error');
  } finally {
    isStreaming = false;
    document.getElementById('chat-send').disabled = false;
  }
}

function parseMarkdown(text) {
  if (typeof marked !== 'undefined') {
    marked.setOptions({ breaks: true, gfm: true });
    return marked.parse(text);
  }
  return text.replace(/\n/g, '<br>');
}

function escapeHtml(text) {
  const d = document.createElement('div');
  d.textContent = text;
  return d.innerHTML;
}
