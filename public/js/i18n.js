const STORAGE_KEY = "civitra_lang";
const TRANSLATABLE_ATTR = "data-i18n-original";

function getLang() {
  return localStorage.getItem(STORAGE_KEY) || "en";
}

function setLang(code) {
  localStorage.setItem(STORAGE_KEY, code);
}

function getTranslatableElements() {
  const selectors = [
    ".section-header h2",
    ".section-header p",
    ".journey__label",
    ".journey__btn",
    ".sidebar__disclaimer span",
    ".booth__hint",
    ".quiz__start h3",
    ".quiz__start p",
    ".learn__back-btn",
    ".chat__disclaimer",
    ".nav-item span",
    ".btn",
    "label",
    "h3",
    "h4",
    ".stat-card__label",
    ".sidebar__lang-label",
  ];
  return document.querySelectorAll(selectors.join(","));
}

function storeOriginals(els) {
  els.forEach((el) => {
    if (!el.hasAttribute(TRANSLATABLE_ATTR)) {
      el.setAttribute(TRANSLATABLE_ATTR, el.textContent || "");
    }
  });
}

function restoreOriginals(els) {
  els.forEach((el) => {
    const orig = el.getAttribute(TRANSLATABLE_ATTR);
    if (orig != null) el.textContent = orig;
  });
}

async function translateElements(els, target) {
  const texts = [];
  const nodes = [];
  els.forEach((el) => {
    const orig = el.getAttribute(TRANSLATABLE_ATTR) || el.textContent || "";
    if (orig.trim()) {
      texts.push(orig);
      nodes.push(el);
    }
  });
  if (!texts.length) return false;

  try {
    const res = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texts, target }),
    });
    if (!res.ok) return true;
    const data = await res.json();
    if (data.fallback) return true;
    (data.translations || []).forEach((tr, i) => {
      if (nodes[i] && tr.translatedText) {
        nodes[i].textContent = tr.translatedText;
      }
    });
    return false;
  } catch {
    return true;
  }
}

export function initI18n() {
  const select = document.getElementById("lang-select");
  const banner = document.getElementById("lang-fallback-banner");
  if (!select) return;

  const current = getLang();
  select.value = current;

  // Watch for dynamic changes (like when a voting plan is generated)
  const observer = new MutationObserver((_mutations) => {
    if (getLang() === "en") return;

    // Debounce to avoid hitting API too many times per second
    if (window._i18nTimer) clearTimeout(window._i18nTimer);
    window._i18nTimer = setTimeout(async () => {
      const els = getTranslatableElements();
      storeOriginals(els);
      const isFallback = await translateElements(els, getLang());
      if (banner) banner.style.display = isFallback ? "block" : "none";
    }, 500);
  });

  observer.observe(document.body, { childList: true, subtree: true });

  select.addEventListener("change", async () => {
    const code = select.value;
    setLang(code);
    const els = getTranslatableElements();
    storeOriginals(els);

    if (code === "en") {
      restoreOriginals(els);
      document.documentElement.lang = "en";
      if (banner) banner.style.display = "none";
      return;
    }

    document.documentElement.lang = code;
    const isFallback = await translateElements(els, code);
    if (banner) {
      banner.style.display = isFallback ? "block" : "none";
    }
  });

  if (current !== "en") {
    const els = getTranslatableElements();
    storeOriginals(els);
    translateElements(els, current).then((isFallback) => {
      if (banner) banner.style.display = isFallback ? "block" : "none";
    });
  }
}
