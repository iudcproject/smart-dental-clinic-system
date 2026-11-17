import { initAppShell, applyTranslations, apiRequest } from '../core/app-shell.js';
import { initAppointmentsTab, loadAppointments } from './appointments-tab.js';
import { initRecordsCatalogTabs, loadPatientsTable, loadDentalRecordsTable, loadDoctorsTable, loadServicesTable } from './records-catalog-tab.js';
import { initAdminSettingsTab, loadClinicSettingsForm } from './admin-settings-tab.js';
import { initFinanceProfileTabs, loadFinanceReport, loadProfileForm } from './finance-profile-tab.js';

let currentUser = null;

async function bootstrapDashboard() {
  initAppShell();
  await loadSidebarClinicName();
  await checkAuth();
  if (!currentUser) return;

  initAppointmentsTab(currentUser);
  initRecordsCatalogTabs(currentUser);
  initAdminSettingsTab();
  initFinanceProfileTabs(currentUser);

  bindNavigation();
  bindNotifications();
  bindPatientBookingModal();
  loadTabData('overview');
}

async function loadSidebarClinicName() {
  try {
    const data = await apiRequest('/api/settings');
    if (data?.clinic_name) {
      window.savedClinicName = data.clinic_name;
      const brandEl = document.getElementById('brand-clinic-name');
      if (brandEl) brandEl.textContent = data.clinic_name;
      document.title = `لوحة التحكم | ${data.clinic_name}`;
    }
  } catch {}
}

async function checkAuth() {
  try {
    const data = await apiRequest('/api/auth/me');
    currentUser = data.user;
    document.getElementById('user-avatar-name').textContent = currentUser.name;
    const roleMap = { admin: 'مدير النظام (Admin)', doctor: 'طبيب العيادة', patient: 'مريض' };
    document.getElementById('user-role-badge').textContent = roleMap[currentUser.role] || currentUser.role;

    buildSidebarMenu(currentUser.role);
    const bookBtn = document.getElementById('open-book-modal');
    if (bookBtn) bookBtn.style.display = 'inline-flex';
    fetchNotifications();
  } catch {
    window.location.href = '/login.html';
  }
}

function buildSidebarMenu(role) {
  const menu = document.getElementById('dash-nav-menu');
  let html = `<button type="button" class="dash-nav-btn active" data-tab="overview"><span>📊</span><span data-i18n="tab_overview">نظرة عامة</span></button>`;

  if (role === 'admin' || role === 'doctor') {
    html += `<button type="button" class="dash-nav-btn" data-tab="patients"><span>🧑‍⚕️</span><span data-i18n="tab_patients">إدارة المرضى</span></button>`;
  }

  html += `<button type="button" class="dash-nav-btn" data-tab="appointments"><span>📅</span><span data-i18n="tab_appts">إدارة المواعيد</span></button>`;

  if (role === 'admin' || role === 'doctor') {
    html += `<button type="button" class="dash-nav-btn" data-tab="dental"><span>🦷</span><span data-i18n="tab_dental">السجلات الطبية</span></button>`;
  }
  if (role === 'admin') {
    html += `<button type="button" class="dash-nav-btn" data-tab="doctors"><span>👨‍⚕️</span><span data-i18n="tab_doctors">إدارة الأطباء</span></button>`;
    html += `<button type="button" class="dash-nav-btn" data-tab="services"><span>🛠️</span><span data-i18n="tab_services">إدارة الخدمات والأوقات</span></button>`;
    html += `<button type="button" class="dash-nav-btn" data-tab="settings"><span>⚙️</span><span data-i18n="tab_settings">إعدادات الصفحة الرئيسية</span></button>`;
    html += `<button type="button" class="dash-nav-btn" data-tab="finance"><span>💰</span><span data-i18n="tab_finance">التقارير المالية</span></button>`;
  }
  html += `<button type="button" class="dash-nav-btn" data-tab="profile"><span>👤</span><span data-i18n="tab_profile">الملف الشخصي</span></button>`;

  menu.innerHTML = html;
  applyTranslations(document.documentElement.lang || 'ar');
}

window.switchDashboardTab = (tab) => {
  const btn = document.querySelector(`.dash-nav-btn[data-tab="${tab}"]`);
  if (!btn) return;
  document.querySelectorAll('.dash-nav-btn').forEach((b) => b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.tab-pane').forEach((p) => p.classList.remove('active'));
  document.getElementById(`tab-${tab}`).classList.add('active');

  const titles = {
    overview: 'نظرة عامة', patients: 'إدارة المرضى', appointments: 'إدارة المواعيد',
    dental: 'السجلات الطبية', doctors: 'إدارة أطباء العيادة', services: 'إدارة الخدمات العلاجية',
    settings: 'إعدادات الصفحة الرئيسية', profile: 'الملف الشخصي', finance: 'التقارير المالية والإيرادات'
  };
  document.getElementById('page-title').textContent = titles[tab] || 'لوحة التحكم';
  loadTabData(tab);
};

function bindNavigation() {
  document.getElementById('dash-nav-menu').addEventListener('click', (e) => {
    const btn = e.target.closest('.dash-nav-btn[data-tab]');
    if (!btn) return;
    window.switchDashboardTab(btn.dataset.tab);
  });

  document.getElementById('logout-btn').addEventListener('click', async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login.html';
  });
}

async function loadTabData(tab) {
  if (tab === 'overview' && currentUser.role === 'admin') {
    try {
      const data = await apiRequest('/api/admin/stats');
      if (data.stats) {
        document.getElementById('admin-stats-grid').style.display = 'grid';
        document.getElementById('stat-doctors').textContent = data.stats.doctorsCount;
        document.getElementById('stat-patients').textContent = data.stats.patientsCount;
        document.getElementById('stat-appts').textContent = data.stats.apptsCount;
        document.getElementById('stat-services').textContent = data.stats.servicesCount;
      }
    } catch {}
  } else if (tab === 'patients' && (currentUser.role === 'admin' || currentUser.role === 'doctor')) loadPatientsTable();
  else if (tab === 'appointments') loadAppointments();
  else if (tab === 'dental') loadDentalRecordsTable();
  else if (tab === 'doctors' && currentUser.role === 'admin') loadDoctorsTable();
  else if (tab === 'services' && currentUser.role === 'admin') loadServicesTable();
  else if (tab === 'settings' && currentUser.role === 'admin') loadClinicSettingsForm();
  else if (tab === 'finance' && currentUser.role === 'admin') loadFinanceReport();
  else if (tab === 'profile') loadProfileForm();
}

async function fetchNotifications() {
  try {
    const data = await apiRequest('/api/notifications');
    const badge = document.getElementById('notif-badge');
    badge.textContent = data.unreadCount || 0;
    badge.style.display = data.unreadCount > 0 ? 'inline-block' : 'none';

    const listContainer = document.getElementById('notifications-list');
    listContainer.innerHTML = data.notifications?.length
      ? data.notifications.map((n) => `
          <div style="padding: 8px; border-bottom: 1px solid var(--border-subtle); background: ${n.is_read ? 'transparent' : 'var(--surface-brand-tint, #eff6ff)'}; border-radius: 4px; margin-bottom: 4px;">
            <div style="font-weight: 600; color: var(--text-primary);">${ClinicUI.escapeHtml(n.title)}</div>
            <div>${ClinicUI.escapeHtml(n.message)}</div>
            <div style="font-size: 10px; color: var(--text-muted); margin-top: 2px;">${n.created_at}</div>
          </div>`).join('')
      : `<div style="text-align: center; color: var(--text-muted); padding: 1rem;">لا توجد إشعارات حالياً.</div>`;
  } catch {}
}

function bindNotifications() {
  document.getElementById('notifications-bell')?.addEventListener('click', (e) => {
    e.stopPropagation();
    const dropdown = document.getElementById('notifications-dropdown');
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    if (dropdown.style.display === 'block') fetchNotifications();
  });
  window.addEventListener('click', () => {
    const dropdown = document.getElementById('notifications-dropdown');
    if (dropdown) dropdown.style.display = 'none';
  });
  setInterval(fetchNotifications, 60000);
}

window.markAllNotificationsRead = async () => {
  try {
    await apiRequest('/api/notifications/read-all', { method: 'PATCH' });
    fetchNotifications();
    ClinicUI.showToast('تم تحديث كافة الإشعارات كمقروءة');
  } catch {}
};

window.openBookingModalForPatient = async (preselectedPatientId = '') => {
  const modal = document.getElementById('modal-book-appointment');
  document.getElementById('book-date').min = new Date().toISOString().split('T')[0];
  document.getElementById('book-appointment-form').reset();

  const isStaff = currentUser.role === 'admin' || currentUser.role === 'doctor';
  const patientGroup = document.getElementById('book-patient-group');
  const patientSelect = document.getElementById('book-patient-id');
  const doctorGroup = document.getElementById('book-doctor-group');
  const doctorSelect = document.getElementById('book-doctor-id');

  patientGroup.style.display = isStaff ? 'block' : 'none';
  patientSelect.required = isStaff;
  doctorGroup.style.display = currentUser.role === 'doctor' ? 'none' : 'block';

  modal.style.display = 'block';

  try {
    const requests = [apiRequest('/api/doctors-list'), apiRequest('/api/services')];
    if (isStaff) requests.push(apiRequest('/api/patients'));

    const [docData, servData, patData] = await Promise.all(requests);

    if (currentUser.role === 'doctor') {
      doctorSelect.innerHTML = `<option value="${currentUser.id}" selected>${ClinicUI.escapeHtml(currentUser.name)}</option>`;
    } else {
      doctorSelect.innerHTML = (docData.doctors || [])
        .map((d) => `<option value="${d.id}">${ClinicUI.escapeHtml(d.name)} (${ClinicUI.escapeHtml(d.specialty || 'أسنان')})</option>`)
        .join('') || '<option value="">لا يوجد أطباء</option>';
    }

    document.getElementById('book-service-id').innerHTML = (servData.services || [])
      .map((s) => `<option value="${s.id}">${ClinicUI.escapeHtml(s.name)} - ${s.price || 0} دينار (${s.duration || 30} دقيقة)</option>`)
      .join('') || '<option value="">لا توجد خدمات</option>';

    if (isStaff && patData) {
      patientSelect.innerHTML = (patData.patients || [])
        .map((p) => `<option value="${p.id}" ${String(p.id) === String(preselectedPatientId) ? 'selected' : ''}>${ClinicUI.escapeHtml(p.name)} ${p.phone ? `(${ClinicUI.escapeHtml(p.phone)})` : ''}</option>`)
        .join('') || '<option value="">لا يوجد مرضى مسجلون</option>';
    }
  } catch {}
};

function bindPatientBookingModal() {
  const modal = document.getElementById('modal-book-appointment');
  document.getElementById('open-book-modal')?.addEventListener('click', () => {
    window.openBookingModalForPatient('');
  });

  document.getElementById('close-book-modal')?.addEventListener('click', () => { modal.style.display = 'none'; });

  document.getElementById('book-appointment-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const isStaff = currentUser.role === 'admin' || currentUser.role === 'doctor';
    const payload = {
      doctor_id: currentUser.role === 'doctor' ? currentUser.id : document.getElementById('book-doctor-id').value,
      service_id: document.getElementById('book-service-id').value,
      date: document.getElementById('book-date').value,
      start_time: document.getElementById('book-time').value,
      notes: document.getElementById('book-notes')?.value || ''
    };
    if (isStaff) {
      payload.patient_id = document.getElementById('book-patient-id').value;
    }

    try {
      const res = await apiRequest('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      ClinicUI.showToast(res.message || 'تم حجز الموعد بنجاح');
      modal.style.display = 'none';
      e.target.reset();
      loadAppointments();
      if (document.getElementById('tab-patients')?.classList.contains('active')) {
        loadPatientsTable();
      }
    } catch (err) {
      ClinicUI.showToast(err.message, 'error');
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrapDashboard);
} else {
  bootstrapDashboard();
}