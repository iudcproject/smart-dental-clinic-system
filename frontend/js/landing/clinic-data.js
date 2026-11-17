/* ==========================================================================
   Landing Module 3: Dynamic Clinic Settings, Services, Doctors & Auth Header
   ========================================================================== */

(function () {
  window.ClinicLanding = window.ClinicLanding || {};

  function isEnglish() {
    return (document.documentElement.lang || localStorage.getItem('app_lang') || 'ar') === 'en';
  }

  function autoTranslateAdminText(text) {
    if (!isEnglish() || !text) return text;
    const dictionary = {
      'عيادة الابتسامة الذكية': 'Smart Smile Dental Clinic',
      'عمّان، شارع وصفي التل (الجاردنز)، مجمع الياسمين الطبي، الطابق الثالث': 'Amman, Wasfi Al-Tal St (Gardens), Al-Yasmin Medical Complex, 3rd Floor',
      '+15 سنة': '+15 Years',
      'خبرة سريرية متخصصة': 'Specialized Clinical Experience',
      '100%': '100%',
      'تعقيم بمعايير دولية': 'International Sterilization',
      '3 ساعات': '3 Hours',
      'حد أدنى لتأكيد الموعد': 'Min. Advance Booking'
    };
    return dictionary[text.trim()] || text;
  }

  async function translateIfNeeded(text) {
    let translated = autoTranslateAdminText(text);
    if (isEnglish() && /[\u0600-\u06FF]/.test(translated) && window.ClinicUI?.autoTranslateText) {
      translated = await ClinicUI.autoTranslateText(translated, 'en');
    }
    return translated;
  }

  async function loadClinicSettings() {
    try {
      const res = await fetch('/api/settings');
      if (!res.ok) return;
      const settings = await res.json();
      const isEn = isEnglish();

      if (settings.clinic_name) {
        const cName = await translateIfNeeded(settings.clinic_name);
        document.title = isEn ? `${cName} | Amman - Online Booking` : `${cName} لطب الأسنان | عمّان - حجز المواعيد`;
        document.querySelectorAll('.brand-name, #brand-clinic-name, [data-setting="clinic_name"]').forEach((el) => {
          el.textContent = cName;
        });
      }

      if (settings.clinic_address) {
        const cAddr = await translateIfNeeded(settings.clinic_address);
        document.querySelectorAll('[data-setting="clinic_address"], #footer-address, .clinic-address').forEach((el) => {
          el.textContent = cAddr;
        });
      }

      if (settings.clinic_phone) {
        document.querySelectorAll('[data-setting="clinic_phone"], #footer-phone, .clinic-phone').forEach((el) => {
          el.textContent = settings.clinic_phone;
          if (el.tagName === 'A') el.href = `tel:${settings.clinic_phone.replace(/\s+/g, '')}`;
        });
      }

      if (settings.clinic_email) {
        document.querySelectorAll('[data-setting="clinic_email"], #footer-email, .clinic-email').forEach((el) => {
          el.textContent = settings.clinic_email;
          if (el.tagName === 'A') el.href = `mailto:${settings.clinic_email}`;
        });
      }

      const metricsContainer = document.getElementById('dynamic-hero-metrics');
      if (metricsContainer) {
        let statsList = [];
        if (settings.clinic_stats_json) {
          try {
            statsList = JSON.parse(settings.clinic_stats_json);
          } catch (e) {}
        }
        if (!Array.isArray(statsList) || statsList.length === 0) {
          statsList = [
            { value: settings.stat_1_value || '+15 سنة', label: settings.stat_1_label || 'خبرة سريرية متخصصة' },
            { value: settings.stat_2_value || '100%', label: settings.stat_2_label || 'تعقيم بمعايير دولية' },
            { value: settings.stat_3_value || '3 ساعات', label: settings.stat_3_label || 'حد أدنى لتأكيد الموعد' }
          ];
        }

        const renderedItems = [];
        for (const item of statsList) {
          const valText = await translateIfNeeded(item.value);
          const lblText = await translateIfNeeded(item.label);
          renderedItems.push(`
            <div style="min-width: 130px; flex: 1 1 calc(33.333% - 1.5rem); max-width: 240px;">
              <span class="metric-value" style="display: block;">${ClinicUI.escapeHtml(valText)}</span>
              <span class="metric-label" style="display: block;">${ClinicUI.escapeHtml(lblText)}</span>
            </div>
          `);
        }
        metricsContainer.innerHTML = renderedItems.join('');
      }

      const hoursContainers = document.querySelectorAll('[data-setting="working_hours"], #footer-working-hours, .clinic-working-hours');
      if (hoursContainers.length > 0) {
        const dayMap = {
          'السبت': 'Saturday',
          'الأحد': 'Sunday',
          'الإثنين': 'Monday',
          'الثلاثاء': 'Tuesday',
          'الأربعاء': 'Wednesday',
          'الخميس': 'Thursday',
          'الجمعة': 'Friday'
        };
        const rawFrom = settings.work_days_from || 'السبت';
        const rawTo = settings.work_days_to || 'الخميس';
        const dayFrom = isEn ? dayMap[rawFrom] || rawFrom : rawFrom;
        const dayTo = isEn ? dayMap[rawTo] || rawTo : rawTo;
        const hours = settings.working_hours || '09:00 - 20:00';

        let workingText = isEn ? `${dayFrom} to ${dayTo}: ${hours}` : `${dayFrom} إلى ${dayTo}: ${hours}`;
        if (settings.special_day) {
          const spDay = isEn ? dayMap[settings.special_day] || settings.special_day : settings.special_day;
          if (settings.special_status === 'closed') {
            workingText += isEn ? ` (${spDay} Closed)` : ` (${spDay} عطلة / مغلق)`;
          } else if (settings.special_status === 'custom' && settings.special_hours) {
            workingText += ` | ${spDay}: ${settings.special_hours}`;
          }
        }
        hoursContainers.forEach((el) => {
          el.textContent = workingText;
        });
      }

      const stepsTitleEl = document.querySelector('[data-setting="visit_steps_title"]');
      if (stepsTitleEl && settings.visit_steps_title) {
        stepsTitleEl.textContent = await translateIfNeeded(settings.visit_steps_title);
      }

      const stepsListEl = document.getElementById('dynamic-visit-steps-list');
      if (stepsListEl && settings.visit_steps_json) {
        try {
          const parsedSteps = JSON.parse(settings.visit_steps_json);
          if (Array.isArray(parsedSteps) && parsedSteps.length > 0) {
            const renderedSteps = [];
            for (const st of parsedSteps) {
              const stTitle = await translateIfNeeded(st.title || '');
              const stDesc = await translateIfNeeded(st.desc || '');
              renderedSteps.push(`
                <li>
                  <strong style="color: var(--text-primary);">${ClinicUI.escapeHtml(stTitle)}</strong>
                  <span>${ClinicUI.escapeHtml(stDesc)}</span>
                </li>
              `);
            }
            stepsListEl.innerHTML = renderedSteps.join('');
          }
        } catch (e) {}
      }
    } catch (e) {
      console.error('Error loading public settings:', e);
    }
  }

  function renderHeaderAuth() {
    const state = window.ClinicLanding;
    const currentUser = state.currentUser;
    const headerActions = document.getElementById('header-auth-actions');
    const isDark = document.documentElement.classList.contains('dark-mode');
    const isEn = isEnglish();
    const themeIcon = state.getThemeButtonHtml ? state.getThemeButtonHtml(isDark) : '';

    if (headerActions && currentUser) {
      headerActions.innerHTML = `
        <button type="button" id="theme-toggle-btn" onclick="toggleDarkMode()" class="btn btn-secondary btn-sm" aria-label="تبديل المظهر الليلي والنهاري">${themeIcon}</button>
        <button type="button" id="lang-toggle-btn" onclick="toggleLanguage()" class="btn btn-secondary btn-sm">${isEn ? 'عربي' : 'EN'}</button>
        <a href="/dashboard.html" class="btn btn-primary btn-sm">${isEn ? 'Dashboard' : 'لوحة التحكم'} (${ClinicUI.escapeHtml(currentUser.name)})</a>
      `;
    }
  }

  async function checkAuthStatus() {
    try {
      const res = await fetch('/api/auth/me');
      if (!res.ok) return;
      const data = await res.json();
      const user = data.user;
      window.ClinicLanding.currentUser = user;

      renderHeaderAuth();

      const nameInput = document.getElementById('booking-name');
      const phoneInput = document.getElementById('booking-phone');
      if (nameInput && user?.name && !nameInput.value) nameInput.value = user.name;
      if (phoneInput && user?.phone && !phoneInput.value) phoneInput.value = user.phone;

      const notice = document.getElementById('booking-auth-notice');
      if (notice && user) {
        notice.className = 'alert alert-success';
        notice.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink: 0; margin-top: 2px;" aria-hidden="true">
            <path d="M20 6 9 17l-5-5"/>
          </svg>
          <span>أهلاً بك يا <strong>${ClinicUI.escapeHtml(user.name)}</strong>. حسابك نشط ويمكنك إرسال طلب الحجز مباشرة.</span>
        `;
      }
    } catch (e) {}
  }

  async function loadServices() {
    const grid = document.getElementById('services-grid');
    if (!grid) return;

    try {
      const res = await fetch('/api/services');
      const data = res.ok ? await res.json() : { services: [] };
      let services = data.services || [];

      if (services.length === 0) {
        services = [
          { id: 1, name: 'تنظيف وإزالة الجير', description: 'تنظيف الأسنان من التصبغات والجير وتلميعها للحفاظ على صحة اللثة', duration: 30, price: 30 },
          { id: 2, name: 'حشو تجميلي (كومبوزيت)', description: 'علاج التسوس وحشو الأسنان بمواد تجميلية مطابقة للون السن الطبيعي', duration: 45, price: 45 },
          { id: 3, name: 'سحب عصب (معالجة لبية)', description: 'تنظيف قناة الجذور وعلاج التهاب العصب بأحدث التقنيات وبدون ألم', duration: 60, price: 100 }
        ];
      }

      const isEn = isEnglish();
      const serviceDict = {
        'تنظيف وإزالة الجير': { name: 'Teeth Cleaning & Scaling', desc: 'Removing plaque, tartar, and stains with polishing for healthy gums.' },
        'حشو تجميلي (كومبوزيت)': { name: 'Composite Aesthetic Filling', desc: 'Treating cavities with tooth-colored composite restorations.' },
        'سحب عصب (معالجة لبية)': { name: 'Root Canal Treatment', desc: 'Cleaning root canals and treating nerve inflammation painlessly.' },
        'خلع سن / ضرس عقل': { name: 'Tooth / Wisdom Tooth Extraction', desc: 'Simple or surgical extraction of damaged or impacted teeth.' },
        'تقويم الأسنان': { name: 'Orthodontics (Braces)', desc: 'Aligning teeth and correcting bite with modern braces.' }
      };

      const mappedServices = [];
      for (const s of services) {
        const cleanName = (s.name || '').trim();
        const tr = serviceDict[cleanName];
        let dName = isEn && tr ? tr.name : s.name;
        let dDesc = isEn && tr ? tr.desc : s.description || (isEn ? 'Comprehensive specialized dental care.' : 'رعاية تخصصية شاملة بإشراف أطباء العيادة.');

        if (isEn && !tr && window.ClinicUI?.autoTranslateText) {
          if (/[\u0600-\u06FF]/.test(dName)) dName = await ClinicUI.autoTranslateText(dName, 'en');
          if (/[\u0600-\u06FF]/.test(dDesc)) dDesc = await ClinicUI.autoTranslateText(dDesc, 'en');
        }

        mappedServices.push({ ...s, displayName: dName, displayDesc: dDesc });
      }

      const serviceSelect = window.ClinicLanding.serviceSelect;
      if (serviceSelect) {
        serviceSelect.setOptions(
          mappedServices.map((s) => ({
            value: s.id,
            label: s.displayName,
            meta: `${s.duration || 30} ${isEn ? 'mins' : 'دقيقة'}`
          }))
        );
      }

      grid.innerHTML = mappedServices
        .map(
          (s) => `
          <article class="service-card">
            <div>
              <h3 style="margin: 0 0 var(--space-2); font-size: var(--text-lg);">${ClinicUI.escapeHtml(s.displayName)}</h3>
              <p style="margin: 0; font-size: var(--text-sm); color: var(--text-secondary);">${ClinicUI.escapeHtml(s.displayDesc)}</p>
            </div>
            <div>
              <div class="service-meta-row" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-3);">
                <span class="price-tag" style="font-weight: 700; color: var(--text-brand);">${ClinicUI.escapeHtml(String(s.price || 0))} ${isEn ? 'JOD' : 'دينار'}</span>
                <span class="duration-tag">${ClinicUI.escapeHtml(String(s.duration || 30))} ${isEn ? 'mins' : 'دقيقة'}</span>
              </div>
              <button
                type="button"
                class="btn btn-secondary btn-sm select-service-btn"
                data-service-id="${s.id}"
                style="width: 100%;"
              >
                ${isEn ? 'Select Service to Book' : 'اختيار هذه الخدمة للحجز'}
              </button>
            </div>
          </article>
        `
        )
        .join('');

      grid.querySelectorAll('.select-service-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.serviceId;
          window.ClinicLanding.serviceSelect?.setValue(id);
          if (window.goToCinematicStage) {
            window.goToCinematicStage(2);
          } else {
            document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' });
          }
          ClinicUI.showToast(isEn ? 'Service selected in booking form' : 'تم تحديد الخدمة في نموذج الحجز بنجاح');
        });
      });
    } catch (e) {
      console.error('Services load error:', e);
      grid.innerHTML = `<div class="alert alert-error" style="grid-column: 1 / -1;">تعذر تحميل قائمة الخدمات حالياً. يرجى تحديث الصفحة.</div>`;
    }
  }

  async function loadDoctors() {
    const isEn = isEnglish();
    const grid = document.getElementById('doctors-grid');
    if (!grid) return;

    try {
      const res = await fetch('/api/doctors-list');
      const data = await res.json();
      const doctors = data.doctors || [];

      const translatedDoctors = [];
      for (const d of doctors) {
        let docName = d.name || '';
        let docSpec = d.specialty || 'أخصائي طب وجراحة الفم والأسنان';
        if (isEn && window.ClinicUI?.autoTranslateText) {
          if (/[\u0600-\u06FF]/.test(docName)) docName = await ClinicUI.autoTranslateText(docName, 'en');
          if (/[\u0600-\u06FF]/.test(docSpec)) docSpec = await ClinicUI.autoTranslateText(docSpec, 'en');
        }
        translatedDoctors.push({ ...d, displayName: docName, displaySpec: docSpec });
      }

      const doctorSelect = window.ClinicLanding.doctorSelect;
      if (doctorSelect) {
        doctorSelect.setOptions(
          translatedDoctors.map((d) => ({
            value: d.id,
            label: d.displayName,
            meta: d.displaySpec
          }))
        );
      }

      if (translatedDoctors.length === 0) {
        grid.innerHTML = `
          <div class="card" style="grid-column: 1 / -1; text-align: center; padding: var(--space-8);">
            <p style="margin: 0; color: var(--text-muted);">${isEn ? 'Doctors list will appear once added by admin.' : 'سيتم عرض قائمة الأطباء فور إضافتهم من لوحة الإدارة.'}</p>
          </div>
        `;
        return;
      }

      grid.innerHTML = translatedDoctors
        .map((d) => {
          const initial = (d.displayName || 'D').trim().charAt(0);
          return `
            <article class="doctor-card" style="padding: 0.65rem 1rem; display: flex; align-items: center; gap: 0.75rem;">
              <div class="doctor-avatar" style="width: 2.35rem; height: 2.35rem; font-size: 0.95rem; flex-shrink: 0;" aria-hidden="true">${ClinicUI.escapeHtml(initial)}</div>
              <div style="min-width: 0;">
                <h3 style="margin: 0; font-size: 0.95rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${ClinicUI.escapeHtml(d.displayName)}</h3>
                <p style="margin: 2px 0 0; font-size: 0.78rem; color: var(--text-brand); font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${ClinicUI.escapeHtml(d.displaySpec)}</p>
              </div>
            </article>
          `;
        })
        .join('');
    } catch (e) {
      grid.innerHTML = `<div class="alert alert-error" style="grid-column: 1 / -1;">تعذر تحميل قائمة الأطباء حالياً.</div>`;
    }
  }

  window.ClinicLanding.loadClinicSettings = loadClinicSettings;
  window.ClinicLanding.checkAuthStatus = checkAuthStatus;
  window.ClinicLanding.renderHeaderAuth = renderHeaderAuth;
  window.ClinicLanding.loadServices = loadServices;
  window.ClinicLanding.loadDoctors = loadDoctors;
})();