import { apiRequest } from '../core/app-shell.js';

export function initAdminSettingsTab() {
  document.getElementById('clinic-settings-form')?.addEventListener('submit', saveClinicSettings);
  document.getElementById('upload-bg-video-btn')?.addEventListener('click', handleVideoUpload);
}

export async function loadClinicSettingsForm() {
  try {
    const data = await apiRequest('/api/settings');
    if (!data) return;

    if (data.clinic_name) document.getElementById('set-clinic-name').value = data.clinic_name;
    if (data.clinic_address) document.getElementById('set-clinic-address').value = data.clinic_address;
    if (data.work_days_from) document.getElementById('set-day-from').value = data.work_days_from;
    if (data.work_days_to) document.getElementById('set-day-to').value = data.work_days_to;

    if (data.working_hours?.includes('-')) {
      const [start, end] = data.working_hours.split('-');
      document.getElementById('set-work-start').value = start.trim();
      document.getElementById('set-work-end').value = end.trim();
    }

    if (data.special_day) document.getElementById('set-special-day').value = data.special_day;
    if (data.special_status) {
      document.getElementById('set-special-status').value = data.special_status;
      window.handleSpecialStatus(data.special_status);
    }
    if (data.special_hours && data.special_status === 'custom' && data.special_hours.includes('-')) {
      const [spStart, spEnd] = data.special_hours.split('-');
      document.getElementById('set-special-start').value = spStart.trim();
      document.getElementById('set-special-end').value = spEnd.trim();
    }

    const phone = data.clinic_phone || '';
    const prefixes = ['+962', '+966', '+963', '+970', '+971', '+20'];
    const matched = prefixes.find((p) => phone.startsWith(p)) || '+962';
    document.getElementById('set-phone-prefix').value = matched;
    document.getElementById('set-clinic-phone').value = phone.replace(matched, '').trim();

    if (data.clinic_email) document.getElementById('set-clinic-email').value = data.clinic_email;

    // تحميل المميزات
    const statsContainer = document.getElementById('dynamic-stats-container');
    statsContainer.innerHTML = '';
    let statsList = [];
    try { statsList = JSON.parse(data.clinic_stats_json || '[]'); } catch {}
    if (!statsList.length) {
      statsList = [
        { value: data.stat_1_value || '+15 سنة', label: data.stat_1_label || 'خبرة سريرية متخصصة' },
        { value: data.stat_2_value || '100%', label: data.stat_2_label || 'تعقيم بمعايير دولية' },
        { value: data.stat_3_value || '3 ساعات', label: data.stat_3_label || 'حد أدنى لتأكيد الموعد' }
      ];
    }
    statsList.forEach((item) => window.addStatItemRow(item.value, item.label));

    // تحميل خطوات الزيارة
    document.getElementById('set-visit-steps-title').value = data.visit_steps_title || 'كيف تتم زيارتك في العيادة؟';
    const stepsContainer = document.getElementById('admin-visit-steps-container');
    stepsContainer.innerHTML = '';
    let stepsList = [];
    try { stepsList = JSON.parse(data.visit_steps_json || '[]'); } catch {}
    if (!stepsList.length) {
      stepsList = [
        { title: '1. استشارة وتقييم أولي:', desc: 'صف أعراضك للمساعد الطبي الذكي أو اختر الخدمة العلاجية المناسبة مباشرة.' },
        { title: '2. تحديد الطبيب والوقت:', desc: 'اختر الموعد المناسب لك مسبقاً لتجنب الازدحام والانتظار في العيادة.' },
        { title: '3. متابعة سجلك الرقمي:', desc: 'اطّلع على تفاصيل كل جلسة وتعليمات ما بعد العلاج من حسابك الشخصي.' }
      ];
    }
    stepsList.forEach((st) => window.addVisitStepRow(st.title, st.desc));

    const minHours = String(data.min_booking_hours || '3');
    const selectEl = document.getElementById('set-min-hours-select');
    const customInput = document.getElementById('set-min-hours-custom');
    const hasOpt = Array.from(selectEl.options).some((opt) => opt.value === minHours);
    selectEl.value = hasOpt ? minHours : 'custom';
    customInput.style.display = hasOpt ? 'none' : 'block';
    if (!hasOpt) customInput.value = minHours;
  } catch (e) {
    console.error('Error loading settings:', e);
  }
}

async function saveClinicSettings(e) {
  e.preventDefault();
  const phonePrefix = document.getElementById('set-phone-prefix').value;
  const phoneNum = document.getElementById('set-clinic-phone').value.trim();
  const workStart = document.getElementById('set-work-start').value;
  const workEnd = document.getElementById('set-work-end').value;
  const email = document.getElementById('set-clinic-email').value.trim();

  if (email && !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
    return ClinicUI.showToast('يرجى إدخال بريد إلكتروني صحيح', 'error');
  }

  const selectVal = document.getElementById('set-min-hours-select').value;
  const specialStatus = document.getElementById('set-special-status').value;
  const spStart = document.getElementById('set-special-start').value;
  const spEnd = document.getElementById('set-special-end').value;

  const statsPayload = Array.from(document.querySelectorAll('#dynamic-stats-container .stat-item-row'))
    .map((r) => ({ value: r.querySelector('.stat-val-input').value.trim(), label: r.querySelector('.stat-lbl-input').value.trim() }))
    .filter((i) => i.value || i.label);

  const stepsPayload = Array.from(document.querySelectorAll('#admin-visit-steps-container .visit-step-row'))
    .map((r) => ({ title: r.querySelector('.step-title-input').value.trim(), desc: r.querySelector('.step-desc-input').value.trim() }))
    .filter((i) => i.title || i.desc);

  const payload = {
    clinic_stats_json: JSON.stringify(statsPayload),
    visit_steps_title: document.getElementById('set-visit-steps-title')?.value.trim() || 'كيف تتم زيارتك في العيادة؟',
    visit_steps_json: JSON.stringify(stepsPayload),
    clinic_name: document.getElementById('set-clinic-name').value,
    clinic_address: document.getElementById('set-clinic-address').value,
    work_days_from: document.getElementById('set-day-from').value,
    work_days_to: document.getElementById('set-day-to').value,
    working_hours: (workStart && workEnd) ? `${workStart} - ${workEnd}` : '',
    special_day: document.getElementById('set-special-day').value,
    special_status: specialStatus,
    special_hours: (specialStatus === 'custom' && spStart && spEnd) ? `${spStart} - ${spEnd}` : '',
    clinic_phone: phoneNum ? `${phonePrefix} ${phoneNum}` : '',
    clinic_email: email,
    min_booking_hours: selectVal === 'custom' ? document.getElementById('set-min-hours-custom').value : selectVal
  };

  try {
    await apiRequest('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    ClinicUI.showToast('تم تحديث الإعدادات وترحيلها بنجاح');
    loadClinicSettingsForm();
    window.savedClinicName = payload.clinic_name;
    const brandEl = document.getElementById('brand-clinic-name');
    if (brandEl && payload.clinic_name) brandEl.textContent = payload.clinic_name;
  } catch (err) {
    ClinicUI.showToast(err.message, 'error');
  }
}

async function handleVideoUpload() {
  const fileInput = document.getElementById('bg-video-file-input');
  const file = fileInput?.files?.[0];
  if (!file) return ClinicUI.showToast('يرجى اختيار ملف فيديو أولاً', 'warning');

  if (file.name !== 'dental-bg.mp4') {
    fileInput.value = '';
    return ClinicUI.showToast('خطأ في التسمية: يجب أن يكون اسم الملف dental-bg.mp4 بالضبط!', 'error');
  }
  if (file.size > 4 * 1024 * 1024) {
    fileInput.value = '';
    return ClinicUI.showToast('حجم الفيديو يتجاوز 4 ميجابايت! يرجى ضغط الفيديو ليشتغل بسلاسة.', 'error');
  }

  const validDuration = await new Promise((resolve) => {
    const v = document.createElement('video');
    v.preload = 'metadata';
    v.onloadedmetadata = () => { URL.revokeObjectURL(v.src); resolve(v.duration <= 15.5); };
    v.onerror = () => { URL.revokeObjectURL(v.src); resolve(false); };
    v.src = URL.createObjectURL(file);
  });

  if (!validDuration) {
    fileInput.value = '';
    return ClinicUI.showToast('مدة الفيديو تتجاوز 15 ثانية! يرجى تقصير المدة لـ 15 ثانية كحد أقصى.', 'error');
  }

  const btn = document.getElementById('upload-bg-video-btn');
  ClinicUI.setButtonLoading(btn, true, 'جاري رفع الفيديو...');
  try {
    await apiRequest('/api/settings/upload-video', {
      method: 'POST',
      headers: { 'Content-Type': 'video/mp4', 'X-File-Name': file.name },
      body: file
    });
    ClinicUI.showToast('تم تحديث الفيديو الخلفي (dental-bg.mp4) بنجاح!');
    fileInput.value = '';
  } catch (err) {
    ClinicUI.showToast(err.message, 'error');
  } finally {
    ClinicUI.setButtonLoading(btn, false);
  }
}

window.toggleEditField = (id, btn) => {
  const input = document.getElementById(id);
  const locked = input.hasAttribute('readonly');
  if (locked) {
    input.removeAttribute('readonly');
    input.style.backgroundColor = '';
    input.style.cursor = '';
    input.focus();
    btn.textContent = 'إقفال';
    btn.classList.replace('btn-secondary', 'btn-primary');
  } else {
    input.setAttribute('readonly', 'true');
    input.style.backgroundColor = 'var(--surface-subtle)';
    input.style.cursor = 'not-allowed';
    btn.textContent = 'تعديل';
    btn.classList.replace('btn-primary', 'btn-secondary');
  }
};

window.handleSpecialStatus = (val) => {
  document.getElementById('special-hours-div').style.display = val === 'custom' ? 'block' : 'none';
};

window.handleMinHoursChange = (val) => {
  const customInput = document.getElementById('set-min-hours-custom');
  customInput.style.display = val === 'custom' ? 'block' : 'none';
  if (val === 'custom') customInput.focus();
};

window.addStatItemRow = (val = '', lbl = '') => {
  const container = document.getElementById('dynamic-stats-container');
  const idx = container.children.length + 1;
  const row = document.createElement('div');
  row.className = 'stat-item-row';
  row.style.cssText = 'display: grid; grid-template-columns: 1fr 1.5fr auto; gap: 0.5rem; align-items: end; background: var(--surface-subtle); padding: 0.75rem; border-radius: 8px;';
  row.innerHTML = `
    <div><label style="font-size: 11px; display: block; margin-bottom: 2px;">الميزة #${idx} (الرقم / العنوان):</label><input type="text" class="form-input stat-val-input" value="${ClinicUI.escapeHtml(val)}" required></div>
    <div><label style="font-size: 11px; display: block; margin-bottom: 2px;">الوصف المختصر:</label><input type="text" class="form-input stat-lbl-input" value="${ClinicUI.escapeHtml(lbl)}" required></div>
    <button type="button" class="btn btn-destructive btn-sm" onclick="removeStatItemRow(this)">✕</button>`;
  container.appendChild(row);
};

window.removeStatItemRow = (btn) => {
  const container = document.getElementById('dynamic-stats-container');
  if (container.children.length <= 1) return ClinicUI.showToast('يجب الإبقاء على ميزة واحدة على الأقل', 'warning');
  btn.closest('.stat-item-row').remove();
};

window.addVisitStepRow = (title = '', desc = '') => {
  const container = document.getElementById('admin-visit-steps-container');
  const idx = container.children.length + 1;
  const row = document.createElement('div');
  row.className = 'visit-step-row';
  row.style.cssText = 'display: grid; grid-template-columns: 1fr 1.8fr auto; gap: 0.5rem; align-items: start; background: var(--surface-subtle); padding: 0.75rem; border-radius: 8px;';
  row.innerHTML = `
    <div><label style="font-size: 11px; display: block; margin-bottom: 2px;">عنوان الخطوة #${idx}:</label><input type="text" class="form-input step-title-input" value="${ClinicUI.escapeHtml(title)}" required></div>
    <div><label style="font-size: 11px; display: block; margin-bottom: 2px;">التفاصيل:</label><textarea class="form-textarea step-desc-input" rows="2" required>${ClinicUI.escapeHtml(desc)}</textarea></div>
    <button type="button" class="btn btn-destructive btn-sm" style="margin-top: 18px;" onclick="removeVisitStepRow(this)">✕</button>`;
  container.appendChild(row);
};

window.removeVisitStepRow = (btn) => {
  const container = document.getElementById('admin-visit-steps-container');
  if (container.children.length <= 1) return ClinicUI.showToast('يجب الإبقاء على خطوة واحدة على الأقل', 'warning');
  btn.closest('.visit-step-row').remove();
};