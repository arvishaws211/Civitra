import { showToast } from './app.js';

let recaptchaSiteKey = '';
let recaptchaReady = false;

// ── Auth State ─────────────────────────────────────────────
export function getToken() { return localStorage.getItem('civitra_token'); }
export function getUser() {
  const u = localStorage.getItem('civitra_user');
  return u ? JSON.parse(u) : null;
}
function setAuth(token, user) {
  localStorage.setItem('civitra_token', token);
  localStorage.setItem('civitra_user', JSON.stringify(user));
}
function clearAuth() {
  localStorage.removeItem('civitra_token');
  localStorage.removeItem('civitra_user');
}
export function isLoggedIn() { return !!getToken(); }

// ── Auth headers helper ────────────────────────────────────
export function authHeaders() {
  const token = getToken();
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

// ── Load reCAPTCHA ─────────────────────────────────────────
async function loadRecaptcha() {
  try {
    const res = await fetch('/api/config');
    const config = await res.json();
    recaptchaSiteKey = config.recaptchaSiteKey;

    if (recaptchaSiteKey) {
      const script = document.createElement('script');
      script.src = `https://www.google.com/recaptcha/api.js?render=${recaptchaSiteKey}`;
      script.onload = () => { recaptchaReady = true; };
      document.head.appendChild(script);
    }
  } catch { /* reCAPTCHA optional */ }
}

async function getRecaptchaToken(action) {
  if (!recaptchaReady || !recaptchaSiteKey) return '';
  try {
    return await grecaptcha.execute(recaptchaSiteKey, { action });
  } catch { return ''; }
}

// ── Initialize Auth UI ─────────────────────────────────────
export function initAuth(onAuthChange) {
  loadRecaptcha();

  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const forgotForm = document.getElementById('forgot-form');
  const resetForm = document.getElementById('reset-form');

  // Form submissions
  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = loginForm.querySelector('button[type="submit"]');
    btn.disabled = true; btn.textContent = 'Signing in...';

    try {
      const recaptchaToken = await getRecaptchaToken('login');
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: document.getElementById('login-email').value,
          password: document.getElementById('login-password').value,
          recaptchaToken,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setAuth(data.token, data.user);
      showToast(`Welcome back, ${data.user.name}!`, 'success');
      onAuthChange(true);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btn.disabled = false; btn.textContent = 'Sign In';
    }
  });

  registerForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = registerForm.querySelector('button[type="submit"]');
    const pw = document.getElementById('register-password').value;
    const pw2 = document.getElementById('register-confirm').value;

    if (pw !== pw2) { showToast('Passwords do not match.', 'error'); return; }

    btn.disabled = true; btn.textContent = 'Creating account...';

    try {
      const recaptchaToken = await getRecaptchaToken('register');
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: document.getElementById('register-name').value,
          email: document.getElementById('register-email').value,
          password: pw,
          recaptchaToken,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setAuth(data.token, data.user);
      showToast(`Welcome to Civitra, ${data.user.name}!`, 'success');
      onAuthChange(true);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btn.disabled = false; btn.textContent = 'Create Account';
    }
  });

  forgotForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = forgotForm.querySelector('button[type="submit"]');
    btn.disabled = true; btn.textContent = 'Sending...';

    try {
      const recaptchaToken = await getRecaptchaToken('forgot');
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: document.getElementById('forgot-email').value,
          recaptchaToken,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast('If an account exists, a reset link was generated.', 'success');

      // Show reset form with token (demo mode)
      if (data.resetToken) {
        document.getElementById('reset-token').value = data.resetToken;
        switchAuthView('reset');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btn.disabled = false; btn.textContent = 'Send Reset Link';
    }
  });

  resetForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = resetForm.querySelector('button[type="submit"]');
    const pw = document.getElementById('reset-password').value;
    const pw2 = document.getElementById('reset-confirm').value;

    if (pw !== pw2) { showToast('Passwords do not match.', 'error'); return; }

    btn.disabled = true; btn.textContent = 'Resetting...';

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: document.getElementById('reset-token').value,
          password: pw,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast('Password reset successfully! Please sign in.', 'success');
      switchAuthView('login');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btn.disabled = false; btn.textContent = 'Reset Password';
    }
  });

  // Navigation links inside auth forms
  document.querySelectorAll('[data-auth-view]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      switchAuthView(link.dataset.authView);
    });
  });

  // Logout button
  document.getElementById('logout-btn')?.addEventListener('click', () => {
    clearAuth();
    showToast('Signed out successfully.', 'success');
    onAuthChange(false);
  });

  // Check if already logged in
  if (isLoggedIn()) {
    onAuthChange(true);
  }
}

export function switchAuthView(viewName) {
  document.querySelectorAll('.auth__form-container').forEach(f => f.style.display = 'none');
  const target = document.getElementById(`auth-${viewName}`);
  if (target) target.style.display = 'block';
}

// ── Logout ─────────────────────────────────────────────────
export function logout() {
  clearAuth();
}
