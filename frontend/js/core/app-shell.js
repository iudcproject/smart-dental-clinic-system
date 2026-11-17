export const translations = {
  ar: {
    clinic_name: 'عيادة الابتسامة الذكية',
    dash_title: 'لوحة التحكم',
    dash_home: 'الرئيسية',
    dash_logout: 'تسجيل الخروج',
    tab_overview: 'نظرة عامة',
    tab_appts: 'إدارة المواعيد',
    tab_dental: 'السجلات الطبية',
    tab_doctors: 'إدارة الأطباء',
    tab_services: 'إدارة الخدمات والأوقات',
    tab_settings: 'إعدادات الصفحة الرئيسية',
    tab_finance: 'التقارير المالية',
    tab_profile: 'الملف الشخصي'
  },
  en: {
    clinic_name: 'Smart Smile Dental Clinic',
    dash_title: 'Dashboard',
    dash_home: 'Home',
    dash_logout: 'Logout',
    tab_overview: 'Overview',
    tab_appts: 'Appointments',
    tab_dental: 'Dental Records',
    tab_doctors: 'Manage Doctors',
    tab_services: 'Services & Times',
    tab_settings: 'Home Settings',
    tab_finance: 'Financial Reports',
    tab_profile: 'Profile'
  }
};

export function applyTranslations(lang) {
  const dict = translations[lang] || translations.ar;
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (key === 'clinic_name' && window.savedClinicName) {
      el.textContent = window.savedClinicName;
      return;
    }
    if (dict[key]) el.textContent = dict[key];
  });
}

export function initAppShell() {
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
}

export async function apiRequest(url, options = {}) {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'حدث خطأ في الاتصال بالخادم');
  return data;
}

window.toggleDarkMode = function () {
  const isDark = document.documentElement.classList.toggle('dark-mode');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  const btn = document.getElementById('theme-toggle-btn');
  if (btn) btn.textContent = isDark ? '☀️' : '🌙';
};

window.toggleLanguage = function () {
  const currentLang = document.documentElement.lang || 'ar';
  const newLang = currentLang === 'ar' ? 'en' : 'ar';
  localStorage.setItem('app_lang', newLang);
  location.reload();
};