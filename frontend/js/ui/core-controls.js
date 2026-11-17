/* ==========================================================================
   UI Module 1: Core Controls, Notifications & Accessible Custom Select
   ========================================================================== */

(function () {
  window.ClinicUIModules = window.ClinicUIModules || {};

  function escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

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
      success: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#15803d" stroke-width="2.2" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>',
      error: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2.2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
      warning: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#b45309" stroke-width="2.2" aria-hidden="true"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
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

    if (root._selectAbortController) {
      root._selectAbortController.abort();
    }
    const controller = new AbortController();
    root._selectAbortController = controller;

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
      document.querySelectorAll('.custom-select-listbox.is-open').forEach((el) => {
        if (el !== listbox) {
          el.classList.remove('is-open');
          el.previousElementSibling?.setAttribute('aria-expanded', 'false');
        }
      });
      listbox.classList.add('is-open');
      trigger.setAttribute('aria-expanded', 'true');
      const items = listbox.querySelectorAll('.custom-select-option');
      if (items.length > 0) {
        focusedIndex = Math.max(0, Array.from(items).findIndex((el) => el.getAttribute('aria-selected') === 'true'));
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
        const matchIdx = Array.from(items).findIndex((el) =>
          el.textContent.trim().toLowerCase().startsWith(char)
        );
        if (matchIdx >= 0) {
          if (!isOpen) openList();
          focusedIndex = matchIdx;
          updateFocus(items);
        }
      }
    });

    document.addEventListener(
      'click',
      (e) => {
        if (!root.contains(e.target)) {
          closeList();
        }
      },
      { signal: controller.signal }
    );

    renderOptions(options);

    return {
      getValue: () => selectedValue,
      setValue: (val) => {
        const items = Array.from(listbox.querySelectorAll('.custom-select-option'));
        const idx = items.findIndex((el) => el.dataset.value === String(val));
        if (idx >= 0) {
          selectByIndex(idx);
        } else {
          selectedValue = '';
          labelEl.textContent = placeholder;
          items.forEach((el) => el.setAttribute('aria-selected', 'false'));
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

  window.ClinicUIModules.core = {
    escapeHtml,
    showToast,
    setButtonLoading,
    setFieldError,
    createCustomSelect
  };
})();