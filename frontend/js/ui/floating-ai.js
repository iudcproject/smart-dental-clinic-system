/* ==========================================================================
   UI Module 2: Draggable Floating AI Medical Assistant Widget
   ========================================================================== */

(function () {
  window.ClinicUIModules = window.ClinicUIModules || {};

  function getAiCopy() {
    const isEn = (document.documentElement.lang || localStorage.getItem('app_lang') || 'ar') === 'en';
    return isEn
      ? {
          title: 'Smart Medical Assistant',
          dragHint: 'Drag button to move on screen',
          dragWindowTitle: 'Drag to move window',
          closeAria: 'Close Smart Assistant',
          welcome: 'Welcome to Smart Smile Dental Clinic. Describe your symptoms and I will recommend the suitable treatment and estimated cost from our clinic services.',
          chipsAria: 'Quick symptom examples',
          chips: [
            { label: 'Cold Water Sensitivity', prompt: 'Tooth pain when drinking cold water' },
            { label: 'Bleeding Gums', prompt: 'Mild gum bleeding and swelling when brushing' },
            { label: 'Teeth Cleaning & Scaling', prompt: 'I want teeth cleaning and tartar removal' }
          ],
          inputLabel: 'Type your symptoms here',
          inputPlaceholder: 'Type your symptoms here...',
          sendAria: 'Send',
          fabAria: 'Open Smart Medical Assistant (Draggable)',
          fabLabel: 'Smart Assistant',
          bookBtn: 'Proceed to Book Appointment',
          fetchError: 'Unable to analyze symptoms right now'
        }
      : {
          title: 'المساعد الطبي الذكي',
          dragHint: 'اسحب الزر لتحريكه في الشاشة',
          dragWindowTitle: 'اسحب لتحريك النافذة',
          closeAria: 'إغلاق المساعد الذكي',
          welcome: 'أهلاً بك في عيادة الابتسامة الذكية. صف لي الأعراض التي تشعر بها وسأرشح لك العلاج المناسب وتكلفته التقديرية من خدمات عيادتنا.',
          chipsAria: 'أمثلة سريعة للأعراض',
          chips: [
            { label: 'حساسية الماء البارد', prompt: 'ألم في الضرس عند شرب الماء البارد' },
            { label: 'نزيف اللثة', prompt: 'نزيف وتورم بسيط في اللثة عند التفريش' },
            { label: 'تنظيف وإزالة الجير', prompt: 'أرغب بتنظيف الأسنان وإزالة الجير' }
          ],
          inputLabel: 'اكتب أعراضك هنا',
          inputPlaceholder: 'اكتب أعراضك هنا...',
          sendAria: 'إرسال',
          fabAria: 'فتح المساعد الطبي الذكي (قابل للسحب)',
          fabLabel: 'المساعد الذكي',
          bookBtn: 'الانتقال لحجز موعد',
          fetchError: 'تعذر الحصول على تحليل الأعراض حالياً'
        };
  }

  function refreshFloatingAiLanguage() {
    const root = document.getElementById('ai-floating-root');
    if (!root) return;

    const copy = getAiCopy();
    const panel = document.getElementById('ai-popover-panel');
    const dragHandle = document.getElementById('ai-popover-drag-handle');
    const closeBtn = document.getElementById('ai-popover-close-btn');
    const titleEl = document.getElementById('ai-popover-title-text');
    const subEl = document.getElementById('ai-popover-subtitle-text');
    const welcomeEl = document.getElementById('ai-welcome-bubble');
    const chipsWrap = document.getElementById('ai-quick-chips-wrap');
    const inputLabel = document.querySelector('label[for="ai-popover-input"]');
    const input = document.getElementById('ai-popover-input');
    const sendBtn = document.getElementById('ai-popover-send-btn');
    const triggerBtn = document.getElementById('ai-fab-trigger');
    const triggerText = document.getElementById('ai-fab-label-text');

    if (panel) panel.setAttribute('aria-label', copy.title);
    if (dragHandle) dragHandle.title = copy.dragWindowTitle;
    if (closeBtn) closeBtn.setAttribute('aria-label', copy.closeAria);
    if (titleEl) titleEl.textContent = copy.title;
    if (subEl) subEl.textContent = copy.dragHint;
    if (welcomeEl) welcomeEl.textContent = copy.welcome;
    if (chipsWrap) {
      chipsWrap.setAttribute('aria-label', copy.chipsAria);
      const chipBtns = chipsWrap.querySelectorAll('.ai-chip-btn');
      copy.chips.forEach((chipData, idx) => {
        if (chipBtns[idx]) {
          chipBtns[idx].textContent = chipData.label;
          chipBtns[idx].dataset.prompt = chipData.prompt;
        }
      });
    }
    if (inputLabel) inputLabel.textContent = copy.inputLabel;
    if (input) input.placeholder = copy.inputPlaceholder;
    if (sendBtn) sendBtn.setAttribute('aria-label', copy.sendAria);
    if (triggerBtn) triggerBtn.setAttribute('aria-label', copy.fabAria);
    if (triggerText) triggerText.textContent = copy.fabLabel;

    root.querySelectorAll('.ai-proceed-booking-btn').forEach((btn) => {
      btn.textContent = copy.bookBtn;
    });
  }

  function initFloatingAiAssistant() {
    if (document.getElementById('ai-floating-root')) return;

    const core = window.ClinicUIModules.core;
    const copy = getAiCopy();
    const root = document.createElement('div');
    root.id = 'ai-floating-root';
    root.className = 'ai-floating-root';

    const chipsHtml = copy.chips
      .map(
        (c) =>
          `<button type="button" class="ai-chip-btn" data-prompt="${core.escapeHtml(c.prompt)}">${core.escapeHtml(c.label)}</button>`
      )
      .join('');

    root.innerHTML = `
      <div id="ai-popover-panel" class="ai-popover-panel animate-enter" role="dialog" aria-label="${core.escapeHtml(copy.title)}" hidden>
        <div class="ai-popover-header" id="ai-popover-drag-handle" title="${core.escapeHtml(copy.dragWindowTitle)}">
          <div class="ai-popover-title-wrap">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-brand)" stroke-width="2.2" aria-hidden="true">
              <path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z"/>
              <path d="M16 14H8a4 4 0 0 0-4 4v2h16v-2a4 4 0 0 0-4-4z"/>
            </svg>
            <div>
              <strong id="ai-popover-title-text" style="display: block; font-size: var(--text-sm); color: var(--text-primary); line-height: 1.2;">${core.escapeHtml(copy.title)}</strong>
              <span id="ai-popover-subtitle-text" style="display: block; font-size: var(--text-xs); color: var(--text-muted);">${core.escapeHtml(copy.dragHint)}</span>
            </div>
          </div>
          <button type="button" class="ai-popover-close" id="ai-popover-close-btn" aria-label="${core.escapeHtml(copy.closeAria)}" style="cursor: pointer; z-index: 20; position: relative;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div class="ai-chat-stream" id="ai-chat-stream" aria-live="polite">
          <div id="ai-welcome-bubble" class="ai-msg-bubble ai-msg-assistant">${core.escapeHtml(copy.welcome)}</div>
        </div>

        <div id="ai-quick-chips-wrap" class="ai-quick-chips" aria-label="${core.escapeHtml(copy.chipsAria)}">
          ${chipsHtml}
        </div>

        <form class="ai-popover-footer" id="ai-popover-form" novalidate>
          <label for="ai-popover-input" class="sr-only">${core.escapeHtml(copy.inputLabel)}</label>
          <textarea
            id="ai-popover-input"
            class="ai-popover-input"
            rows="1"
            placeholder="${core.escapeHtml(copy.inputPlaceholder)}"
            required
          ></textarea>
          <button type="submit" id="ai-popover-send-btn" class="btn btn-primary btn-sm" aria-label="${core.escapeHtml(copy.sendAria)}">
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
        aria-label="${core.escapeHtml(copy.fabAria)}"
      >
        <span class="ai-fab-badge" aria-hidden="true"></span>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        <span id="ai-fab-label-text">${core.escapeHtml(copy.fabLabel)}</span>
      </button>
    `;

    document.body.appendChild(root);

    const triggerBtn = document.getElementById('ai-fab-trigger');
    const panel = document.getElementById('ai-popover-panel');
    const closeBtn = document.getElementById('ai-popover-close-btn');
    const dragHandle = document.getElementById('ai-popover-drag-handle');
    const form = document.getElementById('ai-popover-form');
    const input = document.getElementById('ai-popover-input');
    const sendBtn = document.getElementById('ai-popover-send-btn');
    const stream = document.getElementById('ai-chat-stream');

    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      closePopover();
    });

    closeBtn.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
    });

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

    [triggerBtn, dragHandle].forEach((handle) => {
      handle.addEventListener('pointerdown', onPointerDown);
      handle.addEventListener('pointermove', onPointerMove);
      handle.addEventListener('pointerup', onPointerUp);
      handle.addEventListener('pointercancel', onPointerUp);
    });

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

    root.querySelectorAll('.ai-chip-btn').forEach((chip) => {
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

      const lines = String(text || '')
        .split('\n')
        .filter((l) => l.trim() !== '');
      lines.forEach((line, index) => {
        const p = document.createElement('p');
        p.style.margin = index === lines.length - 1 ? '0' : '0 0 var(--space-2)';
        const parts = line.split(/(\*\*.*?\*\*)/g);
        parts.forEach((part) => {
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
        const activeCopy = getAiCopy();
        const actionRow = document.createElement('div');
        actionRow.style.marginTop = 'var(--space-2)';
        actionRow.style.paddingTop = 'var(--space-2)';
        actionRow.style.borderTop = '1px solid var(--border-subtle)';
        const bookBtn = document.createElement('button');
        bookBtn.type = 'button';
        bookBtn.className = 'btn btn-secondary btn-sm ai-proceed-booking-btn';
        bookBtn.style.width = '100%';
        bookBtn.textContent = activeCopy.bookBtn;
        bookBtn.addEventListener('click', () => {
          closePopover();
          if (typeof window.goToCinematicStage === 'function') {
            window.goToCinematicStage(2);
          } else {
            const bookingSec = document.getElementById('booking');
            if (bookingSec) {
              bookingSec.scrollIntoView({ behavior: 'smooth' });
            } else {
              window.location.href = '/#booking';
            }
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
      core.setButtonLoading(sendBtn, true, '');

      try {
        const res = await fetch('/api/ai/analyze-symptoms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symptoms })
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || getAiCopy().fetchError);
        }

        appendMessage(data.analysis, 'assistant');
      } catch (err) {
        appendMessage(err.message, 'error');
      } finally {
        input.disabled = false;
        core.setButtonLoading(sendBtn, false);
        input.focus();
      }
    });
  }

  window.ClinicUIModules.floatingAi = {
    initFloatingAiAssistant,
    refreshFloatingAiLanguage
  };
})();