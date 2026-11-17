import { apiRequest } from '../core/app-shell.js';

let activeUser = null;
let lastFinanceTransactions = [];

export function initFinanceProfileTabs(user) {
  activeUser = user;

  document.getElementById('profile-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await apiRequest('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: document.getElementById('prof-name').value,
          email: document.getElementById('prof-email').value,
          phone: document.getElementById('prof-phone').value,
          current_password: document.getElementById('prof-curr-pass').value,
          new_password: document.getElementById('prof-new-pass').value
        })
      });
      ClinicUI.showToast('تم تحديث الملف الشخصي بنجاح');
      document.getElementById('prof-curr-pass').value = '';
      document.getElementById('prof-new-pass').value = '';
    } catch (err) {
      ClinicUI.showToast(err.message, 'error');
    }
  });
}

export function loadProfileForm() {
  if (!activeUser) return;
  document.getElementById('prof-name').value = activeUser.name || '';
  document.getElementById('prof-email').value = activeUser.email || '';
  document.getElementById('prof-phone').value = activeUser.phone || '';
}

function renderFinanceTransactionsRows(rows) {
  const txTbody = document.getElementById('finance-transactions-tbody');
  if (!txTbody) return;
  txTbody.innerHTML = rows.length
    ? rows.map((t) => `
        <tr>
          <td>${t.date} <span dir="ltr" style="font-size: 12px; color: var(--text-muted);">(${t.start_time})</span></td>
          <td><strong>${ClinicUI.escapeHtml(t.patient_name)}</strong></td>
          <td>${ClinicUI.escapeHtml(t.doctor_name)}</td>
          <td>${ClinicUI.escapeHtml(t.service_name)}</td>
          <td><span class="fin-status-pill">${t.status === 'completed' ? 'مكتمل ومحصّل' : 'مؤكد'}</span></td>
          <td><strong style="color: var(--text-brand);">${t.amount} دينار</strong></td>
        </tr>`).join('')
    : `<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">لا توجد معاملات مالية مطابقة.</td></tr>`;
}

window.filterFinanceTransactions = () => {
  const query = (document.getElementById('fin-search-input')?.value || '').trim().toLowerCase();
  if (!query) return renderFinanceTransactionsRows(lastFinanceTransactions);
  const filtered = lastFinanceTransactions.filter((t) =>
    String(t.patient_name || '').toLowerCase().includes(query) ||
    String(t.doctor_name || '').toLowerCase().includes(query) ||
    String(t.service_name || '').toLowerCase().includes(query) ||
    String(t.date || '').includes(query)
  );
  renderFinanceTransactionsRows(filtered);
};

export async function loadFinanceReport() {
  try {
    const from = document.getElementById('fin-date-from')?.value || '';
    const to = document.getElementById('fin-date-to')?.value || '';
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);

    const data = await apiRequest(`/api/finance/summary?${params.toString()}`);
    const totalRev = Number(data.totalRevenue || 0);

    document.getElementById('finance-total-revenue').textContent = `${totalRev} دينار`;
    document.getElementById('finance-expected-revenue').textContent = `${data.expectedRevenue || 0} دينار`;
    document.getElementById('finance-paid-count').textContent = data.paidCount || 0;
    document.getElementById('finance-avg-revenue').textContent = `${data.averageRevenue || 0} دينار`;

    const servicesTbody = document.getElementById('finance-services-tbody');
    servicesTbody.innerHTML = data.revenueByService?.length
      ? data.revenueByService.map((s) => {
          const pct = totalRev > 0 ? Math.round((Number(s.revenue || 0) / totalRev) * 100) : 0;
          return `
            <tr>
              <td><strong>${ClinicUI.escapeHtml(s.service_name)}</strong></td>
              <td>${s.booking_count}</td>
              <td>
                <div class="fin-progress-wrap">
                  <div style="display: flex; justify-content: space-between; font-size: 12px;">
                    <strong style="color: var(--text-brand);">${s.revenue} دينار</strong>
                    <span style="color: var(--text-muted);">${pct}%</span>
                  </div>
                  <div class="fin-progress-track"><div class="fin-progress-fill" style="width: ${pct}%;"></div></div>
                </div>
              </td>
            </tr>`;
        }).join('')
      : `<tr><td colspan="3" style="text-align: center; color: var(--text-muted);">لا توجد إيرادات مسجلة في هذه الفترة.</td></tr>`;

    const doctorsTbody = document.getElementById('finance-doctors-tbody');
    if (doctorsTbody) {
      doctorsTbody.innerHTML = data.revenueByDoctor?.length
        ? data.revenueByDoctor.map((d) => {
            const pct = totalRev > 0 ? Math.round((Number(d.revenue || 0) / totalRev) * 100) : 0;
            return `
              <tr>
                <td><strong>${ClinicUI.escapeHtml(d.doctor_name)}</strong></td>
                <td>${d.session_count}</td>
                <td>
                  <div class="fin-progress-wrap">
                    <div style="display: flex; justify-content: space-between; font-size: 12px;">
                      <strong style="color: var(--text-brand);">${d.revenue} دينار</strong>
                      <span style="color: var(--text-muted);">${pct}%</span>
                    </div>
                    <div class="fin-progress-track"><div class="fin-progress-fill" style="width: ${pct}%;"></div></div>
                  </div>
                </td>
              </tr>`;
          }).join('')
        : `<tr><td colspan="3" style="text-align: center; color: var(--text-muted);">لا توجد بيانات للأطباء في هذه الفترة.</td></tr>`;
    }

    lastFinanceTransactions = data.transactions || [];
    window.filterFinanceTransactions();
  } catch (e) {
    console.error('Error loading finance report:', e);
  }
}

window.loadFinanceReport = loadFinanceReport;

window.resetFinanceFilter = () => {
  document.getElementById('fin-date-from').value = '';
  document.getElementById('fin-date-to').value = '';
  loadFinanceReport();
};

window.exportFinanceCSV = () => {
  if (!lastFinanceTransactions.length) return ClinicUI.showToast('لا توجد بيانات مالية لتصديرها', 'warning');
  const headers = ['التاريخ', 'الوقت', 'المريض', 'الطبيب', 'الخدمة', 'الحالة', 'المبلغ (دينار)'];
  const rows = lastFinanceTransactions.map((t) => [t.date, t.start_time, `"${t.patient_name}"`, `"${t.doctor_name}"`, `"${t.service_name}"`, t.status, t.amount]);
  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `clinic-finance-report-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};