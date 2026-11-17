import { apiRequest } from '../core/app-shell.js';

let activeUser = null;

export function initAppointmentsTab(user) {
  activeUser = user;

  document.getElementById('assign-service-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const apptId = document.getElementById('assign-appt-id').value;
    const serviceVal = document.getElementById('assign-service-select').value;
    const customName = document.getElementById('assign-custom-service').value.trim();

    if (!serviceVal) return ClinicUI.showToast('يرجى اختيار خدمة أو تحديد خدمة مخصصة', 'warning');
    if (serviceVal === 'custom' && !customName) return ClinicUI.showToast('يرجى كتابة اسم الخدمة المخصصة', 'warning');

    const payload = serviceVal === 'custom'
      ? { service_id: null, custom_service_name: customName }
      : { service_id: serviceVal, custom_service_name: null };

    try {
      await apiRequest(`/api/appointments/${apptId}/service`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      ClinicUI.showToast('تم اعتماد الخدمة وتحديثها للمريض بنجاح');
      document.getElementById('modal-assign-service').style.display = 'none';
      loadAppointments();
    } catch (err) {
      ClinicUI.showToast(err.message, 'error');
    }
  });

  document.getElementById('complete-visit-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const apptId = document.getElementById('cv-appt-id').value;
    const payload = {
      visit_completed: document.getElementById('cv-visit-completed').value === '1',
      procedure_done: document.getElementById('cv-procedure-done').value === '1',
      visits_count: document.getElementById('cv-visits-count').value,
      tooth_number: document.getElementById('cv-tooth').value,
      cost: document.getElementById('cv-cost').value,
      diagnosis: document.getElementById('cv-diagnosis').value,
      treatment: document.getElementById('cv-treatment').value,
      notes: document.getElementById('cv-notes').value
    };

    try {
      const data = await apiRequest(`/api/appointments/${apptId}/complete-visit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      ClinicUI.showToast(data.message);
      document.getElementById('modal-complete-visit').style.display = 'none';
      loadAppointments();
    } catch (err) {
      ClinicUI.showToast(err.message, 'error');
    }
  });
}

export async function loadAppointments() {
  const tbody = document.getElementById('appointments-tbody');
  tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: var(--space-6);">جاري التحميل...</td></tr>`;

  try {
    const endpoint = activeUser?.role === 'patient' ? '/api/appointments/my' : '/api/appointments';
    const data = await apiRequest(endpoint);
    const list = data.appointments || [];

    if (!list.length) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: var(--space-6); color: var(--text-muted);">لا توجد مواعيد مسجلة حالياً.</td></tr>`;
      return;
    }

    tbody.innerHTML = list.map((a) => {
      const serviceDisplay = a.service_name
        ? `<span style="font-weight: 600; color: var(--text-brand);">${ClinicUI.escapeHtml(a.service_name)}</span>`
        : `<span style="padding: 2px 8px; border-radius: 4px; font-size: 12px; background: var(--status-warning-bg); color: var(--status-warning-text); font-weight: 600;">⏳ الخدمة قيد المراجعة</span>`;

    const badgeStyle = a.status === 'completed'
        ? 'background: rgba(13, 148, 136, 0.16); color: #0f766e; border: 1px solid rgba(13, 148, 136, 0.35);'
        : a.status === 'confirmed'
        ? 'background: rgba(16, 185, 129, 0.16); color: #059669; border: 1px solid rgba(16, 185, 129, 0.35);'
        : a.status === 'cancelled'
        ? 'background: rgba(239, 68, 68, 0.16); color: #dc2626; border: 1px solid rgba(239, 68, 68, 0.35);'
        : 'background: rgba(245, 158, 11, 0.16); color: #d97706; border: 1px solid rgba(245, 158, 11, 0.35);';

      const statusText = a.status === 'completed'
        ? 'مكتمل (Completed)'
        : a.status === 'confirmed'
        ? 'مؤكد (Confirmed)'
        : a.status === 'cancelled'
        ? 'ملغي (Cancelled)'
        : 'قيد الانتظار (Pending)';

      return `
        <tr>
          <td><strong>${ClinicUI.escapeHtml(a.patient_name)}</strong><br><span style="font-size: 12px; color: var(--text-muted);">${ClinicUI.escapeHtml(a.patient_phone || '')}</span></td>
          <td>${ClinicUI.escapeHtml(a.doctor_name)}<br><span style="font-size: 12px; color: var(--text-brand);">${ClinicUI.escapeHtml(a.doctor_specialty || '')}</span></td>
          <td>${serviceDisplay}</td>
          <td>${a.date} <br><span dir="ltr">${a.start_time}</span></td>
          <td><span style="display: inline-block; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 700; ${badgeStyle}">${statusText}</span></td>
          <td>
            <div style="display: flex; flex-wrap: wrap; gap: 4px; align-items: center;">
              ${activeUser.role !== 'patient' && a.status !== 'completed' ? `<button type="button" class="btn btn-secondary btn-sm" onclick="openAssignServiceModal(${a.id})">تحديد الخدمة</button>` : ''}
              ${activeUser.role !== 'patient' && a.status === 'pending' ? `<button type="button" class="btn btn-primary btn-sm" onclick="updateApptStatus(${a.id}, 'confirmed')">موافقة وتأكيد</button>` : ''}
              ${activeUser.role !== 'patient' && a.status === 'confirmed' ? `<button type="button" class="btn btn-primary btn-sm" onclick="updateApptStatus(${a.id}, 'completed')">حضر وأتمّ الزيارة (سجل تلقائي)</button>` : ''}
              ${activeUser.role !== 'patient' && a.status === 'confirmed' ? `<button type="button" class="btn btn-secondary btn-sm" onclick='openCompleteVisitModal(${JSON.stringify(a)})'>توثيق مخصص</button>` : ''}
              ${a.status === 'completed' ? `<span style="font-size: 11px; color: var(--status-success-text); font-weight: 700;">تمت الزيارة ونزل السجل الطبي</span>` : ''}
              ${a.status !== 'cancelled' && a.status !== 'completed' ? `<button type="button" class="btn btn-secondary btn-sm" onclick="updateApptStatus(${a.id}, 'cancelled')">إلغاء</button>` : ''}
              ${activeUser.role === 'admin' ? `<button type="button" class="btn btn-destructive btn-sm" onclick="deleteAppointment(${a.id})">حذف</button>` : ''}
            </div>
          </td>
        </tr>`;
    }).join('');
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--status-error-text);">تعذر تحميل المواعيد.</td></tr>`;
  }
}

window.updateApptStatus = async (id, status) => {
  try {
    const res = await apiRequest(`/api/appointments/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    ClinicUI.showToast(res.message || 'تم تحديث حالة الموعد بنجاح');
    loadAppointments();
  } catch (err) {
    ClinicUI.showToast(err.message, 'error');
  }
};

window.deleteAppointment = async (id) => {
  if (!confirm('هل أنت متأكد من حذف هذا الموعد نهائياً؟')) return;
  try {
    await apiRequest(`/api/appointments/${id}`, { method: 'DELETE' });
    ClinicUI.showToast('تم حذف الموعد بنجاح');
    loadAppointments();
  } catch (err) {
    ClinicUI.showToast(err.message, 'error');
  }
};

window.toggleCustomServiceInput = (val) => {
  document.getElementById('custom-service-name-group').style.display = val === 'custom' ? 'block' : 'none';
};

window.openAssignServiceModal = async (apptId) => {
  document.getElementById('assign-appt-id').value = apptId;
  const select = document.getElementById('assign-service-select');
  document.getElementById('assign-custom-service').value = '';
  document.getElementById('custom-service-name-group').style.display = 'none';

  try {
    const data = await apiRequest('/api/services');
    const opts = (data.services || []).map((s) => `<option value="${s.id}">${ClinicUI.escapeHtml(s.name)} (${s.price || 0} دينار)</option>`).join('');
    select.innerHTML = `<option value="">-- اختر خدمة من القائمة --</option>${opts}<option value="custom">✏️ خدمة مخصصة (كتابة يدوية)...</option>`;
  } catch (e) {
    select.innerHTML = `<option value="custom">✏️ خدمة مخصصة (كتابة يدوية)...</option>`;
  }
  document.getElementById('modal-assign-service').style.display = 'block';
};

window.toggleVisitRecordFields = (val) => {
  document.getElementById('cv-record-details-box').style.display = val === '1' ? 'block' : 'none';
};

window.openCompleteVisitModal = (appt) => {
  document.getElementById('cv-appt-id').value = appt.id;
  document.getElementById('cv-visit-completed').value = '1';
  document.getElementById('cv-procedure-done').value = '1';
  document.getElementById('cv-visits-count').value = appt.visits_count || 1;
  document.getElementById('cv-tooth').value = 'عام';
  document.getElementById('cv-cost').value = appt.service_price || 0;
  document.getElementById('cv-diagnosis').value = '';
  document.getElementById('cv-treatment').value = appt.service_name || '';
  document.getElementById('cv-notes').value = appt.notes || '';
  document.getElementById('cv-record-details-box').style.display = 'block';
  document.getElementById('modal-complete-visit').style.display = 'block';
};