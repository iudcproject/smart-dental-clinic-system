import { apiRequest } from '../core/app-shell.js';

let activeUser = null;

export function initRecordsCatalogTabs(user) {
  activeUser = user;
  bindDentalModal();
  bindDoctorModal();
  bindServiceModal();
}

// --- 1. السجلات الطبية ---
export async function loadDentalRecordsTable() {
  const tbody = document.getElementById('dental-records-tbody');
  if (!tbody) return;
  const addBtn = document.getElementById('open-add-dental-modal');
  if (addBtn) addBtn.style.display = activeUser?.role === 'patient' ? 'none' : 'inline-flex';

  tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: var(--space-6);">جاري تحميل السجلات الطبية...</td></tr>`;
  try {
    const endpoint = activeUser?.role === 'patient' ? `/api/dental/records/${activeUser.id}` : '/api/dental/records';
    const data = await apiRequest(endpoint);
    const records = data.records || [];

    if (!records.length) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: var(--space-6);">لا توجد سجلات طبية مسجلة حالياً.</td></tr>`;
      return;
    }

    tbody.innerHTML = records.map((r) => `
      <tr>
        <td><strong>${ClinicUI.escapeHtml(r.patient_name || '')}</strong></td>
        <td>${ClinicUI.escapeHtml(r.doctor_name || '')}</td>
        <td><span style="padding: 2px 6px; background: var(--surface-subtle); border-radius: 4px; font-weight: 600;">سن ${ClinicUI.escapeHtml(String(r.tooth_number))}</span></td>
        <td>
          <div style="font-weight: 600; margin-bottom: 2px;">${ClinicUI.escapeHtml(r.diagnosis || '')}</div>
          ${r.treatment ? `<div style="font-size: 13px; color: var(--text-secondary);">الإجراء: ${ClinicUI.escapeHtml(r.treatment)} (${r.cost || 0} د.أ)</div>` : ''}
          ${r.notes ? `<div style="font-size: 12px; color: var(--text-brand); background: var(--surface-brand-tint, #eff6ff); padding: 4px 8px; border-radius: 4px; margin-top: 4px;"><strong>🤖 التعليمات:</strong> ${ClinicUI.escapeHtml(r.notes)}</div>` : ''}
        </td>
        <td>${r.created_at ? r.created_at.split('T')[0] : '-'}</td>
        <td>
          ${activeUser?.role !== 'patient' ? `
            <div style="display: flex; gap: 6px;">
              <button type="button" class="btn btn-secondary btn-sm" onclick='openEditDentalRecord(${JSON.stringify(r)})'>تعديل</button>
              <button type="button" class="btn btn-destructive btn-sm" onclick="deleteDentalRecord(${r.id})">حذف</button>
            </div>` : `<span style="color: var(--text-muted); font-size: 12px;">معتمد</span>`}
        </td>
      </tr>`).join('');
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--status-error-text);">تعذر تحميل السجلات الطبية.</td></tr>`;
  }
}

function bindDentalModal() {
  const modal = document.getElementById('modal-dental');
  document.getElementById('open-add-dental-modal')?.addEventListener('click', () => {
    document.getElementById('dental-modal-title').textContent = 'تسجيل علاج ومعالجة سن جديد';
    document.getElementById('edit-dental-id').value = '';
    document.getElementById('add-dental-form').reset();
    modal.style.display = 'block';
  });
  document.getElementById('close-dental-modal')?.addEventListener('click', () => { modal.style.display = 'none'; });

  document.getElementById('generate-ai-care')?.addEventListener('click', async () => {
    const diagnosis = document.getElementById('dental-diagnosis').value;
    const tooth = document.getElementById('dental-tooth').value;
    if (!diagnosis) return ClinicUI.showToast('يرجى كتابة التشخيص أولاً ليقوم الذكاء الاصطناعي بتوليد التعليمات', 'warning');

    ClinicUI.showToast('جاري توليد تعليمات ما بعد العلاج بالذكاء الاصطناعي...', 'info');
    try {
      const data = await apiRequest('/api/ai/care-instructions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ diagnosis, tooth_number: tooth })
      });
      document.getElementById('dental-care').value = data.instructions || data.care_instructions || '';
    } catch {
      document.getElementById('dental-care').value = `تعليمات العناية بالسن رقم ${tooth || 'المعالج'}: تجنب الأكل الساخن أو القاسي لمدة 24 ساعة، واستخدام مسكن الألم عند الحاجة.`;
    }
    ClinicUI.showToast('تم توليد التعليمات بنجاح');
  });

  document.getElementById('add-dental-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const editId = document.getElementById('edit-dental-id').value;
    const payload = {
      patient_id: document.getElementById('dental-patient-id').value,
      tooth_number: document.getElementById('dental-tooth').value,
      diagnosis: document.getElementById('dental-diagnosis').value,
      treatment: document.getElementById('dental-treatment').value,
      cost: document.getElementById('dental-cost').value,
      notes: document.getElementById('dental-care').value
    };
    try {
      await apiRequest(editId ? `/api/dental/records/${editId}` : '/api/dental/records', {
        method: editId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      ClinicUI.showToast(editId ? 'تم تحديث السجل الطبي بنجاح' : 'تم حفظ السجل الطبي بنجاح');
      modal.style.display = 'none';
      e.target.reset();
      loadDentalRecordsTable();
    } catch (err) {
      ClinicUI.showToast(err.message, 'error');
    }
  });
}

window.openEditDentalRecord = (r) => {
  document.getElementById('dental-modal-title').textContent = 'تعديل السجل الطبي وتشخيص السن';
  document.getElementById('edit-dental-id').value = r.id;
  document.getElementById('dental-patient-id').value = r.patient_id || '';
  document.getElementById('dental-tooth').value = r.tooth_number || '';
  document.getElementById('dental-diagnosis').value = r.diagnosis || '';
  document.getElementById('dental-treatment').value = r.treatment || '';
  document.getElementById('dental-cost').value = r.cost || 0;
  document.getElementById('dental-care').value = r.notes || '';
  document.getElementById('modal-dental').style.display = 'block';
};

window.deleteDentalRecord = async (id) => {
  if (!confirm('هل أنت متأكد من حذف هذا السجل الطبي؟')) return;
  try {
    await apiRequest(`/api/dental/records/${id}`, { method: 'DELETE' });
    ClinicUI.showToast('تم حذف السجل الطبي بنجاح');
    loadDentalRecordsTable();
  } catch (err) {
    ClinicUI.showToast(err.message, 'error');
  }
};

// --- 2. الأطباء ---
export async function loadDoctorsTable() {
  const tbody = document.getElementById('doctors-tbody');
  try {
    const data = await apiRequest('/api/admin/doctors');
    const docs = data.doctors || [];
    tbody.innerHTML = docs.length ? docs.map((d) => `
      <tr>
        <td><strong>${ClinicUI.escapeHtml(d.name)}</strong></td>
        <td>${ClinicUI.escapeHtml(d.specialty)}</td>
        <td dir="ltr">${ClinicUI.escapeHtml(d.email)}</td>
        <td dir="ltr">${ClinicUI.escapeHtml(d.phone || '-')}</td>
        <td><button type="button" class="btn btn-destructive btn-sm" onclick="deleteDoctor(${d.id})">حذف</button></td>
      </tr>`).join('') : `<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">لا يوجد أطباء مضافين حالياً.</td></tr>`;
  } catch (e) {}
}

function bindDoctorModal() {
  const modal = document.getElementById('modal-doctor');
  document.getElementById('open-add-doctor-modal')?.addEventListener('click', () => { modal.style.display = 'block'; });
  document.getElementById('close-doc-modal')?.addEventListener('click', () => { modal.style.display = 'none'; });

  document.getElementById('add-doctor-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await apiRequest('/api/admin/doctors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: document.getElementById('doc-name').value,
          email: document.getElementById('doc-email').value,
          password: document.getElementById('doc-pass').value,
          specialty: document.getElementById('doc-spec').value,
          phone: document.getElementById('doc-phone').value
        })
      });
      ClinicUI.showToast('تمت إضافة الطبيب بنجاح');
      modal.style.display = 'none';
      e.target.reset();
      loadDoctorsTable();
    } catch (err) {
      ClinicUI.showToast(err.message, 'error');
    }
  });
}

window.deleteDoctor = async (id) => {
  if (!confirm('هل أنت متأكد من حذف هذا الطبيب؟')) return;
  try {
    await apiRequest(`/api/admin/doctors/${id}`, { method: 'DELETE' });
    ClinicUI.showToast('تم حذف الطبيب بنجاح');
    loadDoctorsTable();
  } catch (err) {
    ClinicUI.showToast(err.message, 'error');
  }
};

// --- 3. الخدمات العلاجية ---
export async function loadServicesTable() {
  const tbody = document.getElementById('services-tbody');
  try {
    const data = await apiRequest('/api/services');
    const servs = data.services || [];
    tbody.innerHTML = servs.length ? servs.map((s) => `
      <tr>
        <td><strong>${ClinicUI.escapeHtml(s.name)}</strong></td>
        <td style="color: var(--text-secondary); max-width: 300px;">${ClinicUI.escapeHtml(s.description || '-')}</td>
        <td><span style="font-weight: 600; color: var(--text-brand);">${s.price || 0} دينار</span></td>
        <td>${s.duration || 30} دقيقة</td>
        <td>
          <div style="display: flex; gap: 8px;">
            <button type="button" class="btn btn-secondary btn-sm" onclick='openEditService(${JSON.stringify(s)})'>تعديل</button>
            <button type="button" class="btn btn-destructive btn-sm" onclick="deleteService(${s.id})">حذف</button>
          </div>
        </td>
      </tr>`).join('') : `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 2rem;">لا توجد خدمات مضافة.</td></tr>`;
  } catch (e) {}
}

function bindServiceModal() {
  const modal = document.getElementById('modal-service');
  document.getElementById('open-add-service-modal')?.addEventListener('click', () => {
    document.getElementById('service-modal-title').textContent = 'إضافة خدمة علاجية جديدة';
    document.getElementById('edit-service-id').value = '';
    document.getElementById('add-service-form').reset();
    document.getElementById('serv-price').value = '0';
    document.getElementById('serv-duration').value = '30';
    modal.style.display = 'block';
  });
  document.getElementById('close-serv-modal')?.addEventListener('click', () => { modal.style.display = 'none'; });

  document.getElementById('add-service-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const editId = document.getElementById('edit-service-id').value;
    try {
      await apiRequest(editId ? `/api/services/${editId}` : '/api/services', {
        method: editId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: document.getElementById('serv-name').value,
          description: document.getElementById('serv-desc').value,
          price: document.getElementById('serv-price').value,
          duration: document.getElementById('serv-duration').value
        })
      });
      ClinicUI.showToast(editId ? 'تم تحديث الخدمة بنجاح' : 'تمت إضافة الخدمة بنجاح');
      modal.style.display = 'none';
      e.target.reset();
      loadServicesTable();
    } catch (err) {
      ClinicUI.showToast(err.message, 'error');
    }
  });
}

window.openEditService = (s) => {
  document.getElementById('service-modal-title').textContent = 'تعديل الخدمة العلاجية';
  document.getElementById('edit-service-id').value = s.id;
  document.getElementById('serv-name').value = s.name || '';
  document.getElementById('serv-desc').value = s.description || '';
  document.getElementById('serv-price').value = s.price || 0;
  document.getElementById('serv-duration').value = s.duration || 30;
  document.getElementById('modal-service').style.display = 'block';
};

window.deleteService = async (id) => {
  if (!confirm('هل أنت متأكد من حذف هذه الخدمة؟')) return;
  try {
    await apiRequest(`/api/services/${id}`, { method: 'DELETE' });
    ClinicUI.showToast('تم حذف الخدمة بنجاح');
    loadServicesTable();
  } catch (err) {
    ClinicUI.showToast(err.message, 'error');
  }
};