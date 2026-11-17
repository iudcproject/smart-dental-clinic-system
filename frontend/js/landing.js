/* ==========================================================================
   Landing Page Logic: Dynamic Settings, Services, Doctors, AI Trigger and Booking
   ========================================================================== */

(function () {
  let currentUser = null;
  let doctorSelect = null;
  let serviceSelect = null;

  document.addEventListener('DOMContentLoaded', async () => {
    setMinBookingDate();
    initCustomDropdowns();
    bindAiHeroTrigger();
    await Promise.all([
      loadClinicSettings(),
      checkAuthStatus(),
      loadServices(),
      loadDoctors()
    ]);
    restorePendingBooking();
    bindBookingForm();
  });

  function bindAiHeroTrigger() {
  const heroBtn = document.getElementById('open-ai-from-card-btn') || document.getElementById('open-floating-ai-cta');
  if (heroBtn) {
    heroBtn.addEventListener('click', () => {
      document.getElementById('ai-fab-trigger')?.click();
    });
  }
}

  function setMinBookingDate() {
    const dateInput = document.getElementById('booking-date');
    if (dateInput) {
      const today = new Date().toISOString().split('T')[0];
      dateInput.min = today;
      dateInput.value = today;
    }
  }

  function initCustomDropdowns() {
    const isEn = (localStorage.getItem('app_lang') || 'ar') === 'en';
    doctorSelect = ClinicUI.createCustomSelect(
      'doctor-select-container',
      [],
      isEn ? 'Select Attending Doctor' : 'اختر الطبيب المعالج'
    );
    serviceSelect = ClinicUI.createCustomSelect(
      'service-select-container',
      [],
      isEn ? 'Select Required Service' : 'اختر الخدمة العلاجية'
    );
  }

  // دالة جلب وعرض الإعدادات في الصفحة الرئيسية ديناميكياً
  async function loadClinicSettings() {
    try {
      const res = await fetch('/api/settings');
      if (!res.ok) return;
      const settings = await res.json();
      const currentLang = document.documentElement.lang || localStorage.getItem('app_lang') || 'ar';
      const isEn = currentLang === 'en';

      // دالة مساعدة لترجمة النصوص الشائعة التي يدخلها الأدمن
      const autoTranslateAdminText = (text) => {
        if (!isEn || !text) return text;
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
      };

      // 1. اسم العيادة (يترجم تلقائياً أي اسم جديد يدخله الأدمن)
      if (settings.clinic_name) {
        let cName = autoTranslateAdminText(settings.clinic_name);
        if (isEn && /[\u0600-\u06FF]/.test(cName) && window.ClinicUI?.autoTranslateText) {
          cName = await ClinicUI.autoTranslateText(cName, 'en');
        }
        document.title = isEn ? `${cName} | Amman - Online Booking` : `${cName} لطب الأسنان | عمّان - حجز المواعيد`;
        document.querySelectorAll('.brand-name, #brand-clinic-name, [data-setting="clinic_name"]').forEach(el => {
          el.textContent = cName;
        });
      }

      // 2. العنوان (يترجم تلقائياً أي عنوان جديد يدخله الأدمن)
      if (settings.clinic_address) {
        let cAddr = autoTranslateAdminText(settings.clinic_address);
        if (isEn && /[\u0600-\u06FF]/.test(cAddr) && window.ClinicUI?.autoTranslateText) {
          cAddr = await ClinicUI.autoTranslateText(cAddr, 'en');
        }
        document.querySelectorAll('[data-setting="clinic_address"], #footer-address, .clinic-address').forEach(el => {
          el.textContent = cAddr;
        });
      }

      // 3. الهاتف
      if (settings.clinic_phone) {
        document.querySelectorAll('[data-setting="clinic_phone"], #footer-phone, .clinic-phone').forEach(el => {
          el.textContent = settings.clinic_phone;
          if (el.tagName === 'A') el.href = `tel:${settings.clinic_phone.replace(/\s+/g, '')}`;
        });
      }

      // 4. البريد الإلكتروني
      if (settings.clinic_email) {
        document.querySelectorAll('[data-setting="clinic_email"], #footer-email, .clinic-email').forEach(el => {
          el.textContent = settings.clinic_email;
          if (el.tagName === 'A') el.href = `mailto:${settings.clinic_email}`;
        });
      }

      /// 5. تحديث جميع الإحصائيات والمميزات الديناميكية من إعدادات الأدمن وترجمتها تلقائياً
      const metricsContainer = document.getElementById('dynamic-hero-metrics');
      if (metricsContainer) {
        let statsList = [];
        if (settings.clinic_stats_json) {
          try { statsList = JSON.parse(settings.clinic_stats_json); } catch (e) {}
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
          let valText = autoTranslateAdminText(item.value);
          let lblText = autoTranslateAdminText(item.label);

          if (isEn && window.ClinicUI?.autoTranslateText) {
            if (/[\u0600-\u06FF]/.test(valText)) valText = await ClinicUI.autoTranslateText(valText, 'en');
            if (/[\u0600-\u06FF]/.test(lblText)) lblText = await ClinicUI.autoTranslateText(lblText, 'en');
          }

          renderedItems.push(`
            <div style="min-width: 130px; flex: 1 1 calc(33.333% - 1.5rem); max-width: 240px;">
              <span class="metric-value" style="display: block;">${ClinicUI.escapeHtml(valText)}</span>
              <span class="metric-label" style="display: block;">${ClinicUI.escapeHtml(lblText)}</span>
            </div>
          `);
        }
        metricsContainer.innerHTML = renderedItems.join('');
      }

      // 6. ساعات العمل
      const hoursContainers = document.querySelectorAll('[data-setting="working_hours"], #footer-working-hours, .clinic-working-hours');
      if (hoursContainers.length > 0) {
        const dayMap = { 'السبت': 'Saturday', 'الأحد': 'Sunday', 'الإثنين': 'Monday', 'الثلاثاء': 'Tuesday', 'الأربعاء': 'Wednesday', 'الخميس': 'Thursday', 'الجمعة': 'Friday' };
        const rawFrom = settings.work_days_from || 'السبت';
        const rawTo = settings.work_days_to || 'الخميس';
        const dayFrom = isEn ? (dayMap[rawFrom] || rawFrom) : rawFrom;
        const dayTo = isEn ? (dayMap[rawTo] || rawTo) : rawTo;
        const hours = settings.working_hours || '09:00 - 20:00';

        let workingText = isEn ? `${dayFrom} to ${dayTo}: ${hours}` : `${dayFrom} إلى ${dayTo}: ${hours}`;

        if (settings.special_day) {
          const spDay = isEn ? (dayMap[settings.special_day] || settings.special_day) : settings.special_day;
          if (settings.special_status === 'closed') {
            workingText += isEn ? ` (${spDay} Closed)` : ` (${spDay} عطلة / مغلق)`;
          } else if (settings.special_status === 'custom' && settings.special_hours) {
            workingText += ` | ${spDay}: ${settings.special_hours}`;
          }
        }
        hoursContainers.forEach(el => { el.textContent = workingText; });
      }

      // 7. عنوان وخطوات الزيارة في العيادة (قابلة للتعديل من لوحة الأدمن)
      const stepsTitleEl = document.querySelector('[data-setting="visit_steps_title"]');
      if (stepsTitleEl && settings.visit_steps_title) {
        let sTitle = settings.visit_steps_title;
        if (isEn && /[\u0600-\u06FF]/.test(sTitle) && window.ClinicUI?.autoTranslateText) {
          sTitle = await ClinicUI.autoTranslateText(sTitle, 'en');
        }
        stepsTitleEl.textContent = sTitle;
      }

      const stepsListEl = document.getElementById('dynamic-visit-steps-list');
      if (stepsListEl && settings.visit_steps_json) {
        try {
          const parsedSteps = JSON.parse(settings.visit_steps_json);
          if (Array.isArray(parsedSteps) && parsedSteps.length > 0) {
            const renderedSteps = [];
            for (const st of parsedSteps) {
              let stTitle = st.title || '';
              let stDesc = st.desc || '';
              if (isEn && window.ClinicUI?.autoTranslateText) {
                if (/[\u0600-\u06FF]/.test(stTitle)) stTitle = await ClinicUI.autoTranslateText(stTitle, 'en');
                if (/[\u0600-\u06FF]/.test(stDesc)) stDesc = await ClinicUI.autoTranslateText(stDesc, 'en');
              }
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
      console.error("Error loading public settings:", e);
    }
  }

  async function checkAuthStatus() {
    try {
      const res = await fetch('/api/auth/me');
      if (!res.ok) return;
      const data = await res.json();
      currentUser = data.user;

      const headerActions = document.getElementById('header-auth-actions');
      if (headerActions && currentUser) {
        headerActions.innerHTML = `
          <button type="button" id="theme-toggle-btn" onclick="toggleDarkMode()" class="btn btn-secondary btn-sm">${document.documentElement.classList.contains('dark-mode') ? '☀️' : '🌙'}</button>
          <button type="button" id="lang-toggle-btn" onclick="toggleLanguage()" class="btn btn-secondary btn-sm">${document.documentElement.lang === 'en' ? 'عربي' : 'EN'}</button>
          <a href="/dashboard.html" class="btn btn-primary btn-sm">لوحة التحكم (${ClinicUI.escapeHtml(currentUser.name)})</a>
        `;
      }

      const notice = document.getElementById('booking-auth-notice');
      if (notice && currentUser) {
        notice.className = 'alert alert-success';
        notice.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink: 0; margin-top: 2px;" aria-hidden="true">
            <path d="M20 6 9 17l-5-5"/>
          </svg>
          <span>أهلاً بك يا <strong>${ClinicUI.escapeHtml(currentUser.name)}</strong>. حسابك نشط ويمكنك إرسال طلب الحجز مباشرة.</span>
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

      const isEn = (localStorage.getItem('app_lang') || 'ar') === 'en';
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
        let dName = (isEn && tr) ? tr.name : s.name;
        let dDesc = (isEn && tr) ? tr.desc : (s.description || (isEn ? 'Comprehensive specialized dental care.' : 'رعاية تخصصية شاملة بإشراف أطباء العيادة.'));

        // ترجمة تلقائية لأي خدمة جديدة يضيفها الأدمن خارج القاموس
        if (isEn && !tr && window.ClinicUI?.autoTranslateText) {
          if (/[\u0600-\u06FF]/.test(dName)) dName = await ClinicUI.autoTranslateText(dName, 'en');
          if (/[\u0600-\u06FF]/.test(dDesc)) dDesc = await ClinicUI.autoTranslateText(dDesc, 'en');
        }

        mappedServices.push({
          ...s,
          displayName: dName,
          displayDesc: dDesc
        });
      }

      if (serviceSelect) {
        serviceSelect.setOptions(
          mappedServices.map(s => ({
            value: s.id,
            label: s.displayName,
            meta: `${s.duration || 30} ${isEn ? 'mins' : 'دقيقة'}`
          }))
        );
      }

      grid.innerHTML = mappedServices
        .map(
          s => `
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

      grid.querySelectorAll('.select-service-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.serviceId;
          if (serviceSelect) {
            serviceSelect.setValue(id);
          }
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
    const isEn = (localStorage.getItem('app_lang') || 'ar') === 'en';
    const grid = document.getElementById('doctors-grid');
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

      if (doctorSelect) {
        doctorSelect.setOptions(
          translatedDoctors.map(d => ({
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
        .map(d => {
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

  function restorePendingBooking() {
    try {
      const saved = JSON.parse(sessionStorage.getItem('pending_booking') || 'null');
      if (!saved) return;
      if (saved.doctor_id && doctorSelect) doctorSelect.setValue(saved.doctor_id);
      if (saved.service_id && serviceSelect) serviceSelect.setValue(saved.service_id);
      if (saved.date) document.getElementById('booking-date').value = saved.date;
      if (saved.start_time) document.getElementById('booking-time').value = saved.start_time;
      if (saved.notes) document.getElementById('booking-notes').value = saved.notes;
    } catch (e) {}
  }

  function bindBookingForm() {
    const form = document.getElementById('booking-form');
    const btn = document.getElementById('booking-submit-btn');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const doctor_id = doctorSelect ? doctorSelect.getValue() : '';
      const service_id = serviceSelect ? serviceSelect.getValue() : '';
      const date = document.getElementById('booking-date').value;
      const start_time = document.getElementById('booking-time').value;
      const notes = document.getElementById('booking-notes').value.trim();

      if (!currentUser) {
        sessionStorage.setItem(
          'pending_booking',
          JSON.stringify({ doctor_id, service_id, date, start_time, notes })
        );
        ClinicUI.showToast('يجب تسجيل الدخول أو إنشاء حساب لإتمام الحجز، تم حفظ اختياراتك', 'warning');
        setTimeout(() => {
          window.location.href = '/login.html';
        }, 900);
        return;
      }

      let valid = true;

      if (!doctor_id) {
        doctorSelect?.setError(true);
        ClinicUI.setFieldError('', 'booking-doctor-error', 'يرجى اختيار الطبيب المعالج');
        valid = false;
      } else {
        doctorSelect?.setError(false);
        ClinicUI.setFieldError('', 'booking-doctor-error', '');
      }

      if (!service_id) {
        serviceSelect?.setError(true);
        ClinicUI.setFieldError('', 'booking-service-error', 'يرجى اختيار نوع الخدمة');
        valid = false;
      } else {
        serviceSelect?.setError(false);
        ClinicUI.setFieldError('', 'booking-service-error', '');
      }

      if (!date) {
        ClinicUI.setFieldError('booking-date', 'booking-date-error', 'يرجى تحديد تاريخ الموعد');
        valid = false;
      } else {
        ClinicUI.setFieldError('booking-date', 'booking-date-error', '');
      }

      if (!start_time) {
        ClinicUI.setFieldError('booking-time', 'booking-time-error', 'يرجى تحديد وقت الموعد');
        valid = false;
      } else {
        ClinicUI.setFieldError('booking-time', 'booking-time-error', '');
      }

      if (!valid) return;

      ClinicUI.setButtonLoading(btn, true, 'جاري إرسال طلب الحجز...');
      try {
        const res = await fetch('/api/appointments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ doctor_id, service_id, date, start_time, notes })
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'تعذر حجز الموعد');
        }

        sessionStorage.removeItem('pending_booking');
        ClinicUI.showToast(data.message || 'تم حجز الموعد بنجاح');
        form.reset();
        setMinBookingDate();
        doctorSelect?.setValue('');
        serviceSelect?.setValue('');
      } catch (err) {
        ClinicUI.showToast(err.message, 'error');
      } finally {
        ClinicUI.setButtonLoading(btn, false);
      }
    });
  }
})();

window.toggleDarkMode = function() {
  const isDark = document.documentElement.classList.toggle('dark-mode');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  const btn = document.getElementById('theme-toggle-btn');
  if (btn) btn.textContent = isDark ? '☀️' : '🌙';
};

const translations = {
  ar: {
    clinic_name: "عيادة الابتسامة الذكية",
    nav_services: "الخدمات والأسعار",
    nav_booking: "حجز موعد",
    nav_doctors: "الكادر الطبي",
    nav_contact: "الموقع وساعات العمل",
    login_btn: "تسجيل الدخول",
    book_now: "احجز موعدك",
    hero_eyebrow: "عمّان - شارع الجاردنز : حجز إلكتروني فوري",
    hero_title: "رعاية أسنان دقيقة بتقنيات حديثة وأسعار واضحة",
    hero_desc: "نجمع بين الخبرة السريرية وأدوات التقييم الذكي لنمنحك خطة علاجية شفافة، مواعيد منظمة بدون انتظار طويل، وسجلاً طبياً رقمياً متكاملاً لكل زيارة.",
    hero_cta_book: "احجز موعدك الآن",
    hero_cta_services: "استعرض الخدمات والأسعار",
    stat_1_val: "+15 سنة",
    stat_1_lbl: "خبرة سريرية متخصصة",
    stat_2_val: "100%",
    stat_2_lbl: "تعقيم بمعايير دولية",
    stat_3_val: "3 ساعات",
    stat_3_lbl: "حد أدنى لتأكيد الموعد",
    journey_title: "خطوات زيارتك في العيادة",
    journey_sub: "تنظيم رقمي كامل من التقييم الأولي حتى المتابعة",
    step_1_title: "استشر المساعد الذكي العائم:",
    step_1_desc: "اضغط على أيقونة المساعد في أسفل الشاشة (أو اسحبها لأي مكان يناسبك) لوصف أعراضك ومعرفة العلاج المرجح وتكلفته فوراً.",
    step_2_title: "اختر الطبيب والموعد المناسب:",
    step_2_desc: "حدد الوقت المفضل لديك قبل الزيارة بالمدة المعتمدة دون انتظار في العيادة.",
    step_3_title: "تابع سجلك العلاجي الرقمي:",
    step_3_desc: "اطلع على تفاصيل كل جلسة وتعليمات ما بعد العلاج من حسابك الشخصي.",
    open_ai_btn: "فتح المساعد الطبي الذكي الآن",
    services_title: "الخدمات العلاجية المعتمدة",
    services_sub: "قائمة محدثة مباشرة من نظام العيادة تشمل مدة الجلسة التقديرية لكل خدمة علاجية.",
    booking_title: "حجز موعد زيارة",
    booking_notice_1: "يرجى",
    booking_notice_link: "تسجيل الدخول أو إنشاء حساب مريض",
    booking_notice_2: "لتثبيت الحجز في سجلك الطبي. يمكنك اختيار التفاصيل أدناه وسنحفظها لك تلقائياً.",
    lbl_doctor: "الطبيب المعالج",
    lbl_service: "نوع الخدمة المطلوبة",
    lbl_date: "تاريخ الزيارة",
    lbl_time: "الوقت المفضل (09:00 ص - 08:00 م)",
    lbl_notes: "ملاحظات إضافية للطبيب (اختياري)",
    ph_notes: "أذكر أي حساسية دوائية أو تفاصيل تود إبلاغ الطبيب بها",
    btn_confirm_booking: "تأكيد طلب الموعد",
    contact_title: "معلومات التواصل والموقع",
    contact_sub: "يسعدنا استقبالكم في عيادتنا أو الرد على استفساراتكم على مدار الأسبوع",
    lbl_address: "العنوان",
    val_address: "عمّان، شارع وصفي التل (الجاردنز)، مجمع الياسمين الطبي، الطابق الثالث",
    lbl_hours: "ساعات العمل",
    lbl_phone: "الهاتف المباشر",
    lbl_email: "البريد الإلكتروني",
    doctors_title: "الكادر الطبي المتخصص",
    doctors_sub: "فريق من أطباء وجراحي الفم والأسنان المعتمدين لمتابعة حالتك بدقة.",
    footer_rights: "جميع الحقوق محفوظة © 2026",
    footer_suffix: "لطب الأسنان - عمّان، الأردن.",
    footer_privacy: "سياسة الخصوصية",
    footer_terms: "الشروط والأحكام",
    footer_portal: "بوابة المرضى والأطباء"
  },
  en: {
    clinic_name: "Smart Smile Dental Clinic",
    nav_services: "Services & Prices",
    nav_booking: "Book Appointment",
    nav_doctors: "Medical Team",
    nav_contact: "Location & Hours",
    login_btn: "Login",
    book_now: "Book Now",
    hero_eyebrow: "Amman - Gardens St: Instant Online Booking",
    hero_title: "Precision Dental Care with Modern Tech & Transparent Pricing",
    hero_desc: "We combine clinical expertise with smart evaluation tools to give you a transparent treatment plan, organized appointments without long waits, and a complete digital medical record.",
    hero_cta_book: "Book Your Appointment",
    hero_cta_services: "Explore Services & Prices",
    stat_1_val: "+15 Years",
    stat_1_lbl: "Specialized Clinical Experience",
    stat_2_val: "100%",
    stat_2_lbl: "International Sterilization",
    stat_3_val: "3 Hours",
    stat_3_lbl: "Min. Advance Booking",
    journey_title: "Your Clinic Visit Steps",
    journey_sub: "Complete digital organization from initial checkup to follow-up",
    step_1_title: "Consult the Floating AI Assistant:",
    step_1_desc: "Click the assistant icon at the bottom of the screen to describe your symptoms and get instant treatment & cost estimates.",
    step_2_title: "Choose Your Doctor & Time:",
    step_2_desc: "Pick your preferred time slot in advance with zero waiting room delays.",
    step_3_title: "Track Your Digital Medical Record:",
    step_3_desc: "View every session's details and post-treatment care instructions from your account.",
    open_ai_btn: "Open Smart Medical Assistant Now",
    services_title: "Approved Dental Services",
    services_sub: "Directly updated from our clinic system including estimated session duration.",
    booking_title: "Book a Visit",
    booking_notice_1: "Please",
    booking_notice_link: "Login or Create a Patient Account",
    booking_notice_2: "to confirm the booking in your medical record. You can select details below and we will save them automatically.",
    lbl_doctor: "Attending Doctor",
    lbl_service: "Required Service",
    lbl_date: "Visit Date",
    lbl_time: "Preferred Time (09:00 AM - 08:00 PM)",
    lbl_notes: "Additional Notes for Doctor (Optional)",
    ph_notes: "Mention any drug allergies or details you wish to share",
    btn_confirm_booking: "Confirm Appointment Request",
    contact_title: "Contact Info & Location",
    contact_sub: "We are pleased to welcome you to our clinic or answer your inquiries throughout the week",
    lbl_address: "Address",
    val_address: "Amman, Wasfi Al-Tal St (Gardens), Al-Yasmin Medical Complex, 3rd Floor",
    lbl_hours: "Working Hours",
    lbl_phone: "Direct Phone",
    lbl_email: "Email Address",
    doctors_title: "Specialized Medical Team",
    doctors_sub: "A team of certified oral and dental surgeons to care for your smile.",
    footer_rights: "All Rights Reserved © 2026",
    footer_suffix: "Dental Clinic - Amman, Jordan.",
    footer_privacy: "Privacy Policy",
    footer_terms: "Terms & Conditions",
    footer_portal: "Patients & Doctors Portal"
  }
};

function applyTranslations(lang) {
  const dict = translations[lang] || translations.ar;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (dict[key]) el.textContent = dict[key];
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (dict[key]) el.placeholder = dict[key];
  });
}

window.toggleLanguage = function() {
  const currentLang = document.documentElement.lang || 'ar';
  const newLang = currentLang === 'ar' ? 'en' : 'ar';
  
  document.documentElement.lang = newLang;
  document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
  localStorage.setItem('app_lang', newLang);
  
  const btn = document.getElementById('lang-toggle-btn');
  if (btn) btn.textContent = newLang === 'ar' ? 'EN' : 'عربي';
  
  applyTranslations(newLang);
  // إعادة تحميل البطاقات وساعات العمل لتتحدث باللغة الجديدة فوراً
  location.reload(); 
};

document.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('theme') === 'dark') {
    document.documentElement.classList.add('dark-mode');
    const tBtn = document.getElementById('theme-toggle-btn');
    if (tBtn) tBtn.textContent = '☀️';
  }
  const savedLang = localStorage.getItem('app_lang') || 'ar';
  document.documentElement.lang = savedLang;
  document.documentElement.dir = savedLang === 'ar' ? 'rtl' : 'ltr';
  const lBtn = document.getElementById('lang-toggle-btn');
  if (lBtn) lBtn.textContent = savedLang === 'ar' ? 'EN' : 'عربي';
  applyTranslations(savedLang);
});

// محرك الكروت المتراكبة (Stacking Cards Curtain) + التزامن الطبيعي 1:1 مع الفيديو
function initCinematicScrollEffects() {
  const slides = Array.from(document.querySelectorAll('.cinematic-slide'));
  const dots = document.querySelectorAll('.stage-dot');
  const bgVideo = document.getElementById('dental-bg-video');

  if (slides.length < 4) return;

  let targetVideoTime = 0;

  function updateStackAndVideo() {
    const scrollY = window.scrollY;
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const scrollProgress = Math.min(Math.max(0, scrollY / maxScroll), 1);

    // 1. تحديث وقت الفيديو المستهدف بناءً على نسبة التمرير الطبيعية في الصفحة
    const videoDuration = (bgVideo && bgVideo.duration && !isNaN(bgVideo.duration)) ? bgVideo.duration : 15;
    targetVideoTime = Math.min(scrollProgress * videoDuration, videoDuration - 0.05);

    // 2. تأثير العمق (Scale & Fade) على الورقة الخلفية عندما تصعد فوقها الورقة التالية
    let activeStage = 0;
    slides.forEach((slide, idx) => {
      const rect = slide.getBoundingClientRect();
      if (rect.top <= window.innerHeight * 0.45) {
        activeStage = idx;
      }

      const nextSlide = slides[idx + 1];
      if (nextSlide && window.innerWidth > 768) {
        const nextRect = nextSlide.getBoundingClientRect();
        const vh = window.innerHeight;
        const overlap = Math.min(Math.max(0, (vh - nextRect.top) / vh), 1);
        const scale = 1 - overlap * 0.05;
        const opacity = 1 - overlap * 0.35;
        slide.style.transform = `scale(${scale.toFixed(4)})`;
        slide.style.opacity = opacity.toFixed(3);
      } else {
        slide.style.transform = 'scale(1)';
        slide.style.opacity = '1';
      }
    });

    // تحديث النقاط الجانبية
    dots.forEach((dot, idx) => dot.classList.toggle('active', idx === activeStage));
  }
  // الانتقال السلس لأي محطة عند النقر على القائمة أو النقاط
  window.goToCinematicStage = function(stageIndex) {
    const targetSlide = slides[stageIndex];
    if (!targetSlide) return;
    // حساب الموقع الفعلي للشريحة في الصفحة
    let offsetTop = 0;
    for (let i = 0; i < stageIndex; i++) {
      offsetTop += slides[i].offsetHeight;
    }
    window.scrollTo({ top: offsetTop, behavior: 'smooth' });
  };

  window.addEventListener('scroll', updateStackAndVideo, { passive: true });
  window.addEventListener('resize', updateStackAndVideo, { passive: true });
  updateStackAndVideo();

  // تنعيم حركة إطارات الفيديو 60fps
  if (bgVideo) {
    bgVideo.pause();
    function smoothVideoLoop() {
      if (bgVideo.duration && !bgVideo.seeking && Math.abs(bgVideo.currentTime - targetVideoTime) > 0.015) {
        bgVideo.currentTime += (targetVideoTime - bgVideo.currentTime) * 0.16;
      }
      requestAnimationFrame(smoothVideoLoop);
    }
    requestAnimationFrame(smoothVideoLoop);
  }

  // ربط النقاط الجانبية وروابط القائمة العلوية
  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      window.goToCinematicStage(Number(dot.dataset.targetStage || 0));
    });
  });

  document.querySelectorAll('a[href="#doctors"]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); window.goToCinematicStage(0); }));
  document.querySelectorAll('a[href="#services"]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); window.goToCinematicStage(1); }));
  document.querySelectorAll('a[href="#booking"]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); window.goToCinematicStage(2); }));
  document.querySelectorAll('a[href="#contact"]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); window.goToCinematicStage(3); }));

  // تأثير الإمالة ثلاثية الأبعاد (3D Tilt) على البطاقات
  document.addEventListener('mousemove', (e) => {
    const card = e.target.closest('.service-card, .doctor-card, #contact.card');
    document.querySelectorAll('.service-card, .doctor-card, #contact.card').forEach(c => {
      if (c !== card) {
        c.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
      }
    });
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const rotateX = (((e.clientY - rect.top) - rect.height / 2) / (rect.height / 2)) * -6;
    const rotateY = (((e.clientX - rect.left) - rect.width / 2) / (rect.width / 2)) * 6;
    card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.02, 1.02, 1.02)`;
  });
}

document.addEventListener('DOMContentLoaded', initCinematicScrollEffects);