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
    const heroBtn = document.getElementById('open-floating-ai-cta');
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
    doctorSelect = ClinicUI.createCustomSelect(
      'doctor-select-container',
      [],
      'اختر الطبيب المعالج'
    );
    serviceSelect = ClinicUI.createCustomSelect(
      'service-select-container',
      [],
      'اختر الخدمة العلاجية'
    );
  }

  async function loadClinicSettings() {
    try {
      const res = await fetch('/api/settings');
      if (!res.ok) return;
      const data = await res.json();
      const settings = data.settings || {};

      if (settings.clinic_name) {
        document.title = `${settings.clinic_name} لطب الأسنان | عمّان - حجز المواعيد`;
      }

      document.querySelectorAll('[data-setting]').forEach(el => {
        const key = el.dataset.setting;
        if (settings[key] !== undefined && settings[key] !== '') {
          el.textContent = settings[key];
          if (el.dataset.settingHref === 'tel') {
            el.href = `tel:${settings[key].replace(/\s+/g, '')}`;
          } else if (el.dataset.settingHref === 'mailto') {
            el.href = `mailto:${settings[key]}`;
          }
        }
      });
    } catch (e) {}
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
    try {
      const res = await fetch('/api/services');
      const data = await res.json();
      const services = data.services || [];

      if (serviceSelect) {
        serviceSelect.setOptions(
          services.map(s => ({
            value: s.id,
            label: s.name,
            meta: `${s.price} د.أ`
          }))
        );
      }

      if (services.length === 0) {
        grid.innerHTML = `
          <div class="card" style="grid-column: 1 / -1; text-align: center; padding: var(--space-10);">
            <h3 style="margin: 0 0 var(--space-2);">لا توجد خدمات مضافة حالياً</h3>
            <p style="margin: 0; color: var(--text-muted);">يرجى التواصل مع إدارة العيادة عبر الهاتف للاستفسار عن العلاجات المتوفرة.</p>
          </div>
        `;
        return;
      }

      grid.innerHTML = services
        .map(
          s => `
          <article class="service-card">
            <div>
              <h3 style="margin: 0 0 var(--space-2); font-size: var(--text-lg);">${ClinicUI.escapeHtml(s.name)}</h3>
              <p style="margin: 0; font-size: var(--text-sm); color: var(--text-secondary);">${ClinicUI.escapeHtml(s.description || 'رعاية تخصصية شاملة بإشراف أطباء العيادة.')}</p>
            </div>
            <div>
              <div class="service-meta-row">
                <span class="price-tag">${ClinicUI.escapeHtml(s.price)} دينار</span>
                <span class="duration-tag">${ClinicUI.escapeHtml(s.duration || 30)} دقيقة</span>
              </div>
              <button
                type="button"
                class="btn btn-secondary btn-sm select-service-btn"
                data-service-id="${s.id}"
                style="width: 100%; margin-top: var(--space-3);"
              >
                اختيار هذه الخدمة للحجز
              </button>
            </div>
          </article>
        `
        )
        .join('');

      grid.querySelectorAll('.select-service-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.serviceId;
          if (serviceSelect) serviceSelect.setValue(id);
          document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' });
          ClinicUI.showToast('تم تحديد الخدمة في نموذج الحجز');
        });
      });
    } catch (e) {
      grid.innerHTML = `<div class="alert alert-error" style="grid-column: 1 / -1;">تعذر تحميل قائمة الخدمات حالياً. يرجى تحديث الصفحة.</div>`;
    }
  }

  async function loadDoctors() {
    const grid = document.getElementById('doctors-grid');
    try {
      const res = await fetch('/api/doctors-list');
      const data = await res.json();
      const doctors = data.doctors || [];

      if (doctorSelect) {
        doctorSelect.setOptions(
          doctors.map(d => ({
            value: d.id,
            label: d.name,
            meta: d.specialty || 'طب الأسنان'
          }))
        );
      }

      if (doctors.length === 0) {
        grid.innerHTML = `
          <div class="card" style="grid-column: 1 / -1; text-align: center; padding: var(--space-8);">
            <p style="margin: 0; color: var(--text-muted);">سيتم عرض قائمة الأطباء فور إضافتهم من لوحة الإدارة.</p>
          </div>
        `;
        return;
      }

      grid.innerHTML = doctors
        .map(d => {
          const initial = (d.name || 'ط').trim().charAt(0);
          return `
            <article class="doctor-card">
              <div class="doctor-avatar" aria-hidden="true">${ClinicUI.escapeHtml(initial)}</div>
              <div>
                <h3 style="margin: 0 0 var(--space-1); font-size: var(--text-lg);">${ClinicUI.escapeHtml(d.name)}</h3>
                <p style="margin: 0; font-size: var(--text-sm); color: var(--text-brand); font-weight: 600;">${ClinicUI.escapeHtml(d.specialty || 'أخصائي طب وجراحة الفم والأسنان')}</p>
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
    const form = document.getElementById('public-booking-form');
    const btn = document.getElementById('booking-submit-btn');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const doctor_id = doctorSelect ? doctorSelect.getValue() : '';
      const service_id = serviceSelect ? serviceSelect.getValue() : '';
      const date = document.getElementById('booking-date').value;
      const start_time = document.getElementById('booking-time').value;
      const notes = document.getElementById('booking-notes').value.trim();

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

      if (!currentUser) {
        sessionStorage.setItem(
          'pending_booking',
          JSON.stringify({ doctor_id, service_id, date, start_time, notes })
        );
        ClinicUI.showToast('يرجى تسجيل الدخول لإتمام الحجز، تم حفظ اختياراتك', 'warning');
        setTimeout(() => {
          window.location.href = '/login.html';
        }, 900);
        return;
      }

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