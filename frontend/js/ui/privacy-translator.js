/* ==========================================================================
   UI Module 3: Cookie Consent Banner, Analytics & Dynamic Auto-Translator
   ========================================================================== */

(function () {
  window.ClinicUIModules = window.ClinicUIModules || {};

  const translationCache = JSON.parse(sessionStorage.getItem('clinic_tr_cache') || '{}');

  function trackPageView() {
    try {
      const views = JSON.parse(localStorage.getItem('clinic_analytics_views') || '[]');
      views.push({ path: window.location.pathname, ts: new Date().toISOString() });
      localStorage.setItem('clinic_analytics_views', JSON.stringify(views.slice(-50)));
    } catch (e) {}
  }

  function initCookieAndAnalytics() {
    const consent = localStorage.getItem('clinic_cookie_consent');
    if (consent === 'accepted') {
      trackPageView();
      return;
    }
    if (consent === 'declined') {
      return;
    }

    const isEn = (localStorage.getItem('app_lang') || 'ar') === 'en';
    const banner = document.createElement('aside');
    banner.className = 'cookie-banner animate-enter';
    banner.setAttribute('aria-label', isEn ? 'Cookie notice' : 'إشعار ملفات تعريف الارتباط');
    banner.innerHTML = `
      <div style="font-size: var(--text-sm); color: var(--text-secondary);">
        <strong style="color: var(--text-primary);">${isEn ? 'Your Data Privacy & Cookies:' : 'خصوصية بياناتك وملفات الارتباط:'}</strong>
        ${isEn ? 'We use essential cookies to securely manage your login session and improve your booking experience.' : 'نستخدم ملفات تعريف الارتباط الضرورية لإدارة جلسة دخولك بأمان وتحسين تجربة حجز المواعيد.'}
        <a href="/privacy.html" style="text-decoration: underline;">${isEn ? 'Privacy Policy' : 'سياسة الخصوصية'}</a>
      </div>
      <div style="display: flex; gap: var(--space-2); flex-shrink: 0;">
        <button type="button" class="btn btn-secondary btn-sm" id="cookie-decline-btn">${isEn ? 'Essential Only' : 'الضرورية فقط'}</button>
        <button type="button" class="btn btn-primary btn-sm" id="cookie-accept-btn">${isEn ? 'Accept' : 'موافق'}</button>
      </div>
    `;
    document.body.appendChild(banner);

    document.getElementById('cookie-accept-btn')?.addEventListener('click', () => {
      localStorage.setItem('clinic_cookie_consent', 'accepted');
      banner.hidden = true;
      trackPageView();
    });

    document.getElementById('cookie-decline-btn')?.addEventListener('click', () => {
      localStorage.setItem('clinic_cookie_consent', 'declined');
      banner.hidden = true;
    });
  }

  async function autoTranslateText(text, targetLang) {
    if (!text || targetLang !== 'en' || !/[\u0600-\u06FF]/.test(text)) return text;
    const clean = text.trim();
    if (translationCache[clean]) return translationCache[clean];

    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=ar&tl=en&dt=t&q=${encodeURIComponent(clean)}`;
      const res = await fetch(url);
      const data = await res.json();
      const translated = data[0].map((item) => item[0]).join('');
      if (translated) {
        translationCache[clean] = translated;
        sessionStorage.setItem('clinic_tr_cache', JSON.stringify(translationCache));
        return translated;
      }
    } catch (e) {}
    return text;
  }

  async function translateDynamicElements(rootElement = document.body) {
    const lang = localStorage.getItem('app_lang') || 'ar';
    if (lang !== 'en' || !rootElement) return;

    const walker = document.createTreeWalker(rootElement, NodeFilter.SHOW_TEXT, null, false);
    const nodes = [];
    let node;
    while ((node = walker.nextNode())) {
      const parentTag = node.parentElement?.tagName;
      if (parentTag !== 'SCRIPT' && parentTag !== 'STYLE' && /[\u0600-\u06FF]/.test(node.nodeValue)) {
        nodes.push(node);
      }
    }

    for (const textNode of nodes) {
      const original = textNode.nodeValue;
      const trimmed = original.trim();
      if (trimmed) {
        const translated = await autoTranslateText(trimmed, 'en');
        textNode.nodeValue = original.replace(trimmed, translated);
      }
    }

    const placeholderEls = rootElement.querySelectorAll ? rootElement.querySelectorAll('[placeholder]') : [];
    for (const el of placeholderEls) {
      const ph = el.getAttribute('placeholder');
      if (ph && /[\u0600-\u06FF]/.test(ph)) {
        el.setAttribute('placeholder', await autoTranslateText(ph, 'en'));
      }
    }
  }

  function initAutoTranslatorObserver() {
    if ((localStorage.getItem('app_lang') || 'ar') !== 'en') return;

    translateDynamicElements(document.body);
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((m) => {
        m.addedNodes.forEach((n) => {
          if (n.nodeType === 1) translateDynamicElements(n);
        });
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  window.ClinicUIModules.privacyTranslator = {
    initCookieAndAnalytics,
    autoTranslateText,
    translateDynamicElements,
    initAutoTranslatorObserver
  };
})();