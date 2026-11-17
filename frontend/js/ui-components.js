/* ==========================================================================
   Shared UI Components, Accessibility Engine and Draggable AI Assistant
   ========================================================================== */

window.ClinicUI = (function () {
  // 1. Toast Notification System (Icon + Text + Full Hairline Border)
  function showToast(message, type = 'success') {
    let container = document.getElementById('clinic-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'clinic-toast-container';
      container.className = 'toast-container';
      container.setAttribute('aria-live', 'polite');
      document.body.appendChild(container);
    }

    const icons = {
      success: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#15803d" stroke-width="2.2"><path d="M20 6 9 17l-5-5"/></svg>',
      error: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
      warning: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#b45309" stroke-width="2.2"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
    };

    const toast = document.createElement('div');
    toast.className = `toast-item alert-${type} animate-enter`;
    toast.innerHTML = `${icons[type] || icons.success}<span>${escapeHtml(message)}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(6px)';
      setTimeout(() => toast.remove(), 220);
    }, 3800);
  }

  // 2. Button Loading State Helper
  function setButtonLoading(button, isLoading, loadingText = 'جاري المعالجة...') {
    if (!button) return;
    if (isLoading) {
      button.dataset.originalHtml = button.innerHTML;
      button.setAttribute('aria-busy', 'true');
      button.disabled = true;
      const textHtml = loadingText ? `<span>${escapeHtml(loadingText)}</span>` : '';
      button.innerHTML = `<span class="btn-spinner" aria-hidden="true"></span>${textHtml}`;
    } else {
      button.removeAttribute('aria-busy');
      button.disabled = false;
      if (button.dataset.originalHtml) {
        button.innerHTML = button.dataset.originalHtml;
      }
    }
  }

  // 3. Field Error State Helper
  function setFieldError(inputId, errorId, message) {
    const input = inputId ? document.getElementById(inputId) : null;
    const errorEl = errorId ? document.getElementById(errorId) : null;
    if (input) {
      if (message) {
        input.classList.add('is-error');
        input.setAttribute('aria-invalid', 'true');
      } else {
        input.classList.remove('is-error');
        input.removeAttribute('aria-invalid');
      }
    }
    if (errorEl) {
      errorEl.textContent = message || '';
      errorEl.classList.toggle('is-visible', Boolean(message));
    }
  }

  // 4. Custom Accessible Dropdown Component (ARIA Listbox + Full Keyboard Nav)
  function createCustomSelect(containerId, options, placeholder = 'اختر من القائمة', onChange = null) {
    const root = document.getElementById(containerId);
    if (!root) return null;

    let selectedValue = '';
    let focusedIndex = -1;

    root.className = 'custom-select';
    root.innerHTML = `
      <button type="button" class="custom-select-trigger" aria-haspopup="listbox" aria-expanded="false">
        <span class="custom-select-label">${escapeHtml(placeholder)}</span>
        <svg class="custom-select-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>
      <ul class="custom-select-listbox" role="listbox" tabindex="-1"></ul>
    `;

    const trigger = root.querySelector('.custom-select-trigger');
    const labelEl = root.querySelector('.custom-select-label');
    const listbox = root.querySelector('.custom-select-listbox');

    function renderOptions(items) {
      listbox.innerHTML = '';
      items.forEach((opt, idx) => {
        const li = document.createElement('li');
        li.className = 'custom-select-option';
        li.setAttribute('role', 'option');
        li.dataset.value = String(opt.value);
        li.dataset.index = String(idx);
        li.setAttribute('aria-selected', String(opt.value) === String(selectedValue) ? 'true' : 'false');
        li.innerHTML = `<span>${escapeHtml(opt.label)}</span>${opt.meta ? `<span style="color:var(--text-muted);font-size:var(--text-xs);">${escapeHtml(opt.meta)}</span>` : ''}`;

        li.addEventListener('click', () => {
          selectByIndex(idx);
          closeList();
          trigger.focus();
        });
        listbox.appendChild(li);
      });
    }

    function openList() {
      document.querySelectorAll('.custom-select-listbox.is-open').forEach(el => {
        if (el !== listbox) {
          el.classList.remove('is-open');
          el.previousElementSibling?.setAttribute('aria-expanded', 'false');
        }
      });
      listbox.classList.add('is-open');
      trigger.setAttribute('aria-expanded', 'true');
      const items = listbox.querySelectorAll('.custom-select-option');
      if (items.length > 0) {
        focusedIndex = Math.max(0, Array.from(items).findIndex(el => el.getAttribute('aria-selected') === 'true'));
        updateFocus(items);
      }
    }

    function closeList() {
      listbox.classList.remove('is-open');
      trigger.setAttribute('aria-expanded', 'false');
      focusedIndex = -1;
    }

    function updateFocus(items) {
      items.forEach((el, i) => {
        el.classList.toggle('is-focused', i === focusedIndex);
        if (i === focusedIndex) {
          el.scrollIntoView({ block: 'nearest' });
        }
      });
    }

    function selectByIndex(idx) {
      const items = listbox.querySelectorAll('.custom-select-option');
      const target = items[idx];
      if (!target) return;

      selectedValue = target.dataset.value;
      labelEl.textContent = target.firstElementChild.textContent;
      trigger.classList.remove('is-error');

      items.forEach((el, i) => {
        el.setAttribute('aria-selected', i === idx ? 'true' : 'false');
      });

      if (typeof onChange === 'function') {
        onChange(selectedValue);
      }
    }

    trigger.addEventListener('click', () => {
      const isOpen = listbox.classList.contains('is-open');
      isOpen ? closeList() : openList();
    });

    trigger.addEventListener('keydown', (e) => {
      const items = listbox.querySelectorAll('.custom-select-option');
      const isOpen = listbox.classList.contains('is-open');

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (!isOpen) return openList();
        focusedIndex = Math.min(items.length - 1, focusedIndex + 1);
        updateFocus(items);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (!isOpen) return openList();
        focusedIndex = Math.max(0, focusedIndex - 1);
        updateFocus(items);
      } else if (e.key === 'Home' && isOpen) {
        e.preventDefault();
        focusedIndex = 0;
        updateFocus(items);
      } else if (e.key === 'End' && isOpen) {
        e.preventDefault();
        focusedIndex = items.length - 1;
        updateFocus(items);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (!isOpen) {
          openList();
        } else if (focusedIndex >= 0) {
          selectByIndex(focusedIndex);
          closeList();
        }
      } else if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        closeList();
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && items.length > 0) {
        const char = e.key.toLowerCase();
        const matchIdx = Array.from(items).findIndex(el =>
          el.textContent.trim().toLowerCase().startsWith(char)
        );
        if (matchIdx >= 0) {
          if (!isOpen) openList();
          focusedIndex = matchIdx;
          updateFocus(items);
        }
      }
    });

    document.addEventListener('click', (e) => {
      if (!root.contains(e.target)) {
        closeList();
      }
    });

    renderOptions(options);

    return {
      getValue: () => selectedValue,
      setValue: (val) => {
        const items = Array.from(listbox.querySelectorAll('.custom-select-option'));
        const idx = items.findIndex(el => el.dataset.value === String(val));
        if (idx >= 0) {
          selectByIndex(idx);
        } else {
          selectedValue = '';
          labelEl.textContent = placeholder;
          items.forEach(el => el.setAttribute('aria-selected', 'false'));
        }
      },
      setOptions: (newOptions) => {
        renderOptions(newOptions);
      },
      setError: (hasError) => {
        trigger.classList.toggle('is-error', Boolean(hasError));
      }
    };
  }

  // 5. Cookie Consent and Lightweight Analytics Tracker
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

    document.getElementById('cookie-accept-btn').addEventListener('click', () => {
      localStorage.setItem('clinic_cookie_consent', 'accepted');
      banner.hidden = true;
      trackPageView();
    });

    document.getElementById('cookie-decline-btn').addEventListener('click', () => {
      localStorage.setItem('clinic_cookie_consent', 'declined');
      banner.hidden = true;
    });
  }

  function trackPageView() {
    try {
      const views = JSON.parse(localStorage.getItem('clinic_analytics_views') || '[]');
      views.push({ path: window.location.pathname, ts: new Date().toISOString() });
      localStorage.setItem('clinic_analytics_views', JSON.stringify(views.slice(-50)));
    } catch (e) {}
  }

  // 6. Floating Draggable AI Assistant Widget (GPU-Composited Smooth Physics)
  function initFloatingAiAssistant() {
    if (document.getElementById('ai-floating-root')) return;

    const root = document.createElement('div');
    root.id = 'ai-floating-root';
    root.className = 'ai-floating-root';

    // استبدل كود زر الإغلاق في الـ HTML داخل الدالة بهذا الشكل لضمان الاستجابة الفورية:
    const isEn = (localStorage.getItem('app_lang') || 'ar') === 'en';

    root.innerHTML = `
      <div id="ai-popover-panel" class="ai-popover-panel animate-enter" role="dialog" aria-label="${isEn ? 'Smart Medical Assistant' : 'المساعد الطبي الذكي'}" hidden>
        <div class="ai-popover-header" id="ai-popover-drag-handle" title="${isEn ? 'Drag to move window' : 'اسحب لتحريك النافذة'}">
          <div class="ai-popover-title-wrap">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-brand)" stroke-width="2.2" aria-hidden="true">
              <path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z"/>
              <path d="M16 14H8a4 4 0 0 0-4 4v2h16v-2a4 4 0 0 0-4-4z"/>
            </svg>
            <div>
              <strong style="display: block; font-size: var(--text-sm); color: var(--text-primary); line-height: 1.2;">${isEn ? 'Smart Medical Assistant' : 'المساعد الطبي الذكي'}</strong>
              <span style="display: block; font-size: var(--text-xs); color: var(--text-muted);">${isEn ? 'Drag button to move on screen' : 'اسحب الزر لتحريكه في الشاشة'}</span>
            </div>
          </div>
          <button type="button" class="ai-popover-close" id="ai-popover-close-btn" aria-label="${isEn ? 'Close Smart Assistant' : 'إغلاق المساعد الذكي'}" style="cursor: pointer; z-index: 20; position: relative;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div class="ai-chat-stream" id="ai-chat-stream" aria-live="polite">
          <div class="ai-msg-bubble ai-msg-assistant">
            ${isEn 
              ? 'Welcome to Smart Smile Dental Clinic. Describe your symptoms and I will recommend the suitable treatment and estimated cost from our clinic services.' 
              : 'أهلاً بك في عيادة الابتسامة الذكية. صف لي الأعراض التي تشعر بها وسأرشح لك العلاج المناسب وتكلفته التقديرية من خدمات عيادتنا.'}
          </div>
        </div>

        <div class="ai-quick-chips" aria-label="${isEn ? 'Quick symptom examples' : 'أمثلة سريعة للأعراض'}">
          <button type="button" class="ai-chip-btn" data-prompt="${isEn ? 'Tooth pain when drinking cold water' : 'ألم في الضرس عند شرب الماء البارد'}">${isEn ? 'Cold Water Sensitivity' : 'حساسية الماء البارد'}</button>
          <button type="button" class="ai-chip-btn" data-prompt="${isEn ? 'Mild gum bleeding and swelling when brushing' : 'نزيف وتورم بسيط في اللثة عند التفريش'}">${isEn ? 'Bleeding Gums' : 'نزيف اللثة'}</button>
          <button type="button" class="ai-chip-btn" data-prompt="${isEn ? 'I want teeth cleaning and tartar removal' : 'أرغب بتنظيف الأسنان وإزالة الجير'}">${isEn ? 'Teeth Cleaning & Scaling' : 'تنظيف وإزالة الجير'}</button>
        </div>

        <form class="ai-popover-footer" id="ai-popover-form" novalidate>
          <label for="ai-popover-input" class="sr-only">${isEn ? 'Type your symptoms here' : 'اكتب أعراضك هنا'}</label>
          <textarea
            id="ai-popover-input"
            class="ai-popover-input"
            rows="1"
            placeholder="${isEn ? 'Type your symptoms here...' : 'اكتب أعراضك هنا...'}"
            required
          ></textarea>
          <button type="submit" id="ai-popover-send-btn" class="btn btn-primary btn-sm" aria-label="${isEn ? 'Send' : 'إرسال'}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </form>
      </div>

      <button
        type="button"
        id="ai-fab-trigger"
        class="ai-fab-trigger"
        aria-expanded="false"
        aria-controls="ai-popover-panel"
        aria-label="${isEn ? 'Open Smart Medical Assistant (Draggable)' : 'فتح المساعد الطبي الذكي (قابل للسحب)'}"
      >
        <span class="ai-fab-badge" aria-hidden="true"></span>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        <span>${isEn ? 'Smart Assistant' : 'المساعد الذكي'}</span>
      </button>
    `;

    document.body.appendChild(root);
    
    const triggerBtn = document.getElementById('ai-fab-trigger');
    const panel = document.getElementById('ai-popover-panel');
    const closeBtn = document.getElementById('ai-popover-close-btn');
    
    // ربط حدث النقر مع منع تداخل السحب (Drag)
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      closePopover();
    });

    // منع انتقال حدث الضغط إلى الهيدر أثناء النقر على زر الإغلاق
    closeBtn.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
    });
    const dragHandle = document.getElementById('ai-popover-drag-handle');
    const form = document.getElementById('ai-popover-form');
    const input = document.getElementById('ai-popover-input');
    const sendBtn = document.getElementById('ai-popover-send-btn');
    const stream = document.getElementById('ai-chat-stream');

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let hasCustomPosition = false;
    let currentX = 0;
    let currentY = 0;
    let targetX = 0;
    let targetY = 0;
    let rafId = null;

    function clampCoordinates(x, y) {
      const rect = triggerBtn.getBoundingClientRect();
      const maxX = Math.max(8, window.innerWidth - rect.width - 8);
      const maxY = Math.max(8, window.innerHeight - rect.height - 8);
      return {
        x: Math.min(Math.max(8, x), maxX),
        y: Math.min(Math.max(8, y), maxY)
      };
    }

    function switchToTransformMode(initialX, initialY) {
      if (!hasCustomPosition) {
        root.style.left = '0px';
        root.style.top = '0px';
        root.style.right = 'auto';
        root.style.bottom = 'auto';
        hasCustomPosition = true;
      }
      const clamped = clampCoordinates(initialX, initialY);
      currentX = clamped.x;
      currentY = clamped.y;
      targetX = clamped.x;
      targetY = clamped.y;
      root.style.transform = `translate3d(${currentX.toFixed(2)}px, ${currentY.toFixed(2)}px, 0)`;
      updatePopoverPlacement();
    }

    function animateDragLoop() {
      const ease = prefersReducedMotion ? 1 : 0.34;
      const dx = targetX - currentX;
      const dy = targetY - currentY;

      if (Math.abs(dx) < 0.15 && Math.abs(dy) < 0.15) {
        currentX = targetX;
        currentY = targetY;
        root.style.transform = `translate3d(${currentX.toFixed(2)}px, ${currentY.toFixed(2)}px, 0)`;
        updatePopoverPlacement();
        rafId = null;
        return;
      }

      currentX += dx * ease;
      currentY += dy * ease;
      root.style.transform = `translate3d(${currentX.toFixed(2)}px, ${currentY.toFixed(2)}px, 0)`;
      rafId = requestAnimationFrame(animateDragLoop);
    }

    function updatePopoverPlacement() {
      const rect = triggerBtn.getBoundingClientRect();
      const openDown = rect.top < window.innerHeight * 0.48;
      const alignStart = rect.left > window.innerWidth * 0.5;
      panel.classList.toggle('open-downward', openDown);
      panel.classList.toggle('align-start', alignStart);
    }

    try {
      const savedPos = JSON.parse(sessionStorage.getItem('ai_widget_pos') || 'null');
      if (savedPos && typeof savedPos.x === 'number' && typeof savedPos.y === 'number') {
        switchToTransformMode(savedPos.x, savedPos.y);
      }
    } catch (e) {}

    let isPointerDown = false;
    let hasMoved = false;
    let startPointerX = 0;
    let startPointerY = 0;
    let originX = 0;
    let originY = 0;

    function onPointerDown(e) {
      if (e.button !== undefined && e.button !== 0) return;
      isPointerDown = true;
      hasMoved = false;
      startPointerX = e.clientX;
      startPointerY = e.clientY;

      const rect = triggerBtn.getBoundingClientRect();
      if (!hasCustomPosition) {
        switchToTransformMode(rect.left, rect.top);
      }
      originX = targetX;
      originY = targetY;

      if (e.currentTarget.setPointerCapture && e.pointerId !== undefined) {
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch (err) {}
      }
    }

    function onPointerMove(e) {
      if (!isPointerDown) return;
      const deltaX = e.clientX - startPointerX;
      const deltaY = e.clientY - startPointerY;

      if (!hasMoved && Math.hypot(deltaX, deltaY) < 5) {
        return;
      }

      hasMoved = true;
      root.classList.add('is-dragging');
      const clamped = clampCoordinates(originX + deltaX, originY + deltaY);
      targetX = clamped.x;
      targetY = clamped.y;

      if (!rafId) {
        rafId = requestAnimationFrame(animateDragLoop);
      }
    }

    function onPointerUp(e) {
      if (!isPointerDown) return;
      isPointerDown = false;
      root.classList.remove('is-dragging');

      if (e.currentTarget.releasePointerCapture && e.pointerId !== undefined) {
        try {
          e.currentTarget.releasePointerCapture(e.pointerId);
        } catch (err) {}
      }

      if (hasMoved) {
        updatePopoverPlacement();
        try {
          sessionStorage.setItem('ai_widget_pos', JSON.stringify({ x: targetX, y: targetY }));
        } catch (err) {}
      }
    }

    triggerBtn.addEventListener('pointerdown', onPointerDown);
    triggerBtn.addEventListener('pointermove', onPointerMove);
    triggerBtn.addEventListener('pointerup', onPointerUp);
    triggerBtn.addEventListener('pointercancel', onPointerUp);

    dragHandle.addEventListener('pointerdown', onPointerDown);
    dragHandle.addEventListener('pointermove', onPointerMove);
    dragHandle.addEventListener('pointerup', onPointerUp);
    dragHandle.addEventListener('pointercancel', onPointerUp);

    window.addEventListener('resize', () => {
      if (hasCustomPosition) {
        switchToTransformMode(targetX, targetY);
      }
    });

    triggerBtn.addEventListener('click', () => {
      if (hasMoved) {
        hasMoved = false;
        return;
      }
      const isOpen = !panel.hidden;
      isOpen ? closePopover() : openPopover();
    });
   
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !panel.hidden) {
        closePopover();
        triggerBtn.focus();
      }
    });

    function openPopover() {
      updatePopoverPlacement();
      panel.hidden = false;
      triggerBtn.setAttribute('aria-expanded', 'true');
      setTimeout(() => input.focus(), 60);
    }

    function closePopover() {
      panel.hidden = true;
      triggerBtn.setAttribute('aria-expanded', 'false');
    }

    root.querySelectorAll('.ai-chip-btn').forEach(chip => {
      chip.addEventListener('click', () => {
        input.value = chip.dataset.prompt || '';
        input.classList.remove('is-error');
        form.dispatchEvent(new Event('submit', { cancelable: true }));
      });
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        form.dispatchEvent(new Event('submit', { cancelable: true }));
      }
    });

    function appendMessage(text, role) {
      const bubble = document.createElement('div');
      bubble.className = `ai-msg-bubble ai-msg-${role} animate-enter`;

      const lines = String(text || '').split('\n').filter(l => l.trim() !== '');
      lines.forEach((line, index) => {
        const p = document.createElement('p');
        p.style.margin = index === lines.length - 1 ? '0' : '0 0 var(--space-2)';
        const parts = line.split(/(\*\*.*?\*\*)/g);
        parts.forEach(part => {
          if (part.startsWith('**') && part.endsWith('**')) {
            const strong = document.createElement('strong');
            strong.textContent = part.slice(2, -2);
            p.appendChild(strong);
          } else {
            p.appendChild(document.createTextNode(part));
          }
        });
        bubble.appendChild(p);
      });

      if (role === 'assistant') {
        const isEn = (localStorage.getItem('app_lang') || 'ar') === 'en';
        const actionRow = document.createElement('div');
        actionRow.style.marginTop = 'var(--space-2)';
        actionRow.style.paddingTop = 'var(--space-2)';
        actionRow.style.borderTop = '1px solid var(--border-subtle)';
        const bookBtn = document.createElement('button');
        bookBtn.type = 'button';
        bookBtn.className = 'btn btn-secondary btn-sm';
        bookBtn.style.width = '100%';
        bookBtn.textContent = isEn ? 'Proceed to Book Appointment' : 'الانتقال لحجز موعد';
        bookBtn.addEventListener('click', () => {
          closePopover();
          const bookingSec = document.getElementById('booking');
          if (bookingSec) {
            bookingSec.scrollIntoView({ behavior: 'smooth' });
          } else {
            window.location.href = '/#booking';
          }
        });
        actionRow.appendChild(bookBtn);
        bubble.appendChild(actionRow);
      }

      stream.appendChild(bubble);
      stream.scrollTop = stream.scrollHeight;
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const symptoms = input.value.trim();

      if (symptoms.length < 3) {
        input.classList.add('is-error');
        input.focus();
        return;
      }

      input.classList.remove('is-error');
      appendMessage(symptoms, 'user');
      input.value = '';
      input.disabled = true;
      setButtonLoading(sendBtn, true, '');

      try {
        const res = await fetch('/api/ai/analyze-symptoms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symptoms })
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'تعذر الحصول على تحليل الأعراض حالياً');
        }

        appendMessage(data.analysis, 'assistant');
      } catch (err) {
        appendMessage(err.message, 'error');
      } finally {
        input.disabled = false;
        setButtonLoading(sendBtn, false);
        input.focus();
      }
    });
  }

  function escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  document.addEventListener('DOMContentLoaded', () => {
    initCookieAndAnalytics();
    initFloatingAiAssistant();
    if ((localStorage.getItem('app_lang') || 'ar') === 'en') {
      translateDynamicElements(document.body);
      const observer = new MutationObserver((mutations) => {
        mutations.forEach(m => {
          m.addedNodes.forEach(n => {
            if (n.nodeType === 1) translateDynamicElements(n);
          });
        });
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }
  });

  // 7. محرك الترجمة الشامل (ثابت + ترجمة تلقائية فورية لمدخلات الأدمن والطبيب)
  const translationCache = JSON.parse(sessionStorage.getItem('clinic_tr_cache') || '{}');

  async function autoTranslateText(text, targetLang) {
    if (!text || targetLang !== 'en' || !/[\u0600-\u06FF]/.test(text)) return text;
    const clean = text.trim();
    if (translationCache[clean]) return translationCache[clean];

    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=ar&tl=en&dt=t&q=${encodeURIComponent(clean)}`;
      const res = await fetch(url);
      const data = await res.json();
      const translated = data[0].map(item => item[0]).join('');
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
    if (lang !== 'en') return;

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

    // ترجمة الـ placeholders
    rootElement.querySelectorAll('[placeholder]').forEach(async el => {
      const ph = el.getAttribute('placeholder');
      if (ph && /[\u0600-\u06FF]/.test(ph)) {
        el.setAttribute('placeholder', await autoTranslateText(ph, 'en'));
      }
    });
  }

  return {
    showToast,
    setButtonLoading,
    setFieldError,
    createCustomSelect,
    escapeHtml,
    autoTranslateText,
    translateDynamicElements
  };
})();