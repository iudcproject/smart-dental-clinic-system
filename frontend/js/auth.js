/* ==========================================================================
   Authentication Logic & Little Doctor Mascot Integration
   ========================================================================== */

(function () {
  document.addEventListener('DOMContentLoaded', async () => {
    await redirectIfAlreadyLoggedIn();
    checkPendingBookingNotice();
    initTabsAndViews();
    bindForms();
  });

  function getMascot() {
    return window.littleDoctorController || null;
  }

  async function redirectIfAlreadyLoggedIn() {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        window.location.href = '/dashboard.html';
      }
    } catch (e) {}
  }

  function checkPendingBookingNotice() {
    try {
      const pending = sessionStorage.getItem('pending_booking');
      const banner = document.getElementById('pending-booking-banner');
      if (pending && banner) {
        banner.hidden = false;
      }
    } catch (e) {}
  }

  function initTabsAndViews() {
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');
    const panelLogin = document.getElementById('panel-login');
    const panelRegister = document.getElementById('panel-register');
    const panelForgot = document.getElementById('panel-forgot');
    const panelReset = document.getElementById('panel-reset');
    const subtitle = document.getElementById('auth-subtitle');
    const tabsBar = document.querySelector('.auth-tabs');

    function showPanel(mode) {
      panelLogin.hidden = mode !== 'login';
      panelRegister.hidden = mode !== 'register';
      panelForgot.hidden = mode !== 'forgot';
      panelReset.hidden = mode !== 'reset';

      tabLogin.setAttribute('aria-selected', mode === 'login' ? 'true' : 'false');
      tabRegister.setAttribute('aria-selected', mode === 'register' ? 'true' : 'false');
      tabsBar.style.display = mode === 'forgot' || mode === 'reset' ? 'none' : 'grid';

      getMascot()?.resetMood();

      if (mode === 'login') {
        subtitle.textContent = 'سجل الدخول لمتابعة مواعيدك وسجلك العلاجي';
      } else if (mode === 'register') {
        subtitle.textContent = 'أنشئ حساب مريض جديد لحجز المواعيد إلكترونياً';
      } else if (mode === 'forgot') {
        subtitle.textContent = 'أدخل بريدك الإلكتروني لإرسال رابط إعادة تعيين كلمة المرور';
      } else if (mode === 'reset') {
        subtitle.textContent = 'أدخل كلمة المرور الجديدة لحسابك';
      }
    }

    tabLogin.addEventListener('click', () => showPanel('login'));
    tabRegister.addEventListener('click', () => showPanel('register'));

    document.getElementById('show-forgot-btn')?.addEventListener('click', () => showPanel('forgot'));
    document.getElementById('back-to-login-btn')?.addEventListener('click', () => showPanel('login'));

    const params = new URLSearchParams(window.location.search);
    if (params.get('token')) {
      showPanel('reset');
    } else if (params.get('mode') === 'register') {
      showPanel('register');
    }
  }

  async function finalizePostAuthNavigation() {
    try {
      const rawPending = sessionStorage.getItem('pending_booking');
      if (rawPending) {
        const booking = JSON.parse(rawPending);
        const res = await fetch('/api/appointments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(booking)
        });
        const data = await res.json();
        sessionStorage.removeItem('pending_booking');

        if (res.ok) {
          ClinicUI.showToast('تم تسجيل الدخول وتثبيت موعدك المحفوظ بنجاح');
          setTimeout(() => {
            window.location.href = '/dashboard.html';
          }, 900);
          return;
        } else {
          ClinicUI.showToast(data.error || 'يرجى مراجعة تفاصيل الموعد المحفوظ', 'warning');
          setTimeout(() => {
            window.location.href = '/#booking';
          }, 1200);
          return;
        }
      }
    } catch (e) {}

    setTimeout(() => {
      window.location.href = '/dashboard.html';
    }, 750);
  }

  function bindForms() {
    // 1. Login Form
    const loginForm = document.getElementById('panel-login');
    const loginBtn = document.getElementById('login-submit-btn');

    loginForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;

      let valid = true;
      if (!email || !email.includes('@')) {
        ClinicUI.setFieldError('login-email', 'login-email-error', 'يرجى إدخال بريد إلكتروني صحيح');
        valid = false;
      } else {
        ClinicUI.setFieldError('login-email', 'login-email-error', '');
      }

      if (!password) {
        ClinicUI.setFieldError('login-password', 'login-password-error', 'يرجى إدخال كلمة المرور');
        valid = false;
      } else {
        ClinicUI.setFieldError('login-password', 'login-password-error', '');
      }

      if (!valid) {
        getMascot()?.reactError();
        return;
      }

      ClinicUI.setButtonLoading(loginBtn, true, 'جاري التحقق...');
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'بيانات الدخول غير صحيحة');
        }

        getMascot()?.reactSuccess();
        ClinicUI.showToast(`أهلاً بك، ${data.user.name}`);
        await finalizePostAuthNavigation();
      } catch (err) {
        getMascot()?.reactError();
        ClinicUI.showToast(err.message, 'error');
      } finally {
        ClinicUI.setButtonLoading(loginBtn, false);
      }
    });

    // 2. Register Form
    const regForm = document.getElementById('panel-register');
    const regBtn = document.getElementById('register-submit-btn');

    regForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('reg-name').value.trim();
      const email = document.getElementById('reg-email').value.trim();
      const phone = document.getElementById('reg-phone').value.trim();
      const password = document.getElementById('reg-password').value;

      let valid = true;
      if (name.length < 3) {
        ClinicUI.setFieldError('reg-name', 'reg-name-error', 'يرجى إدخال الاسم الكامل (3 أحرف على الأقل)');
        valid = false;
      } else {
        ClinicUI.setFieldError('reg-name', 'reg-name-error', '');
      }

      if (!email || !email.includes('@')) {
        ClinicUI.setFieldError('reg-email', 'reg-email-error', 'يرجى إدخال بريد إلكتروني صحيح');
        valid = false;
      } else {
        ClinicUI.setFieldError('reg-email', 'reg-email-error', '');
      }

      if (password.length < 6) {
        ClinicUI.setFieldError('reg-password', 'reg-password-error', 'كلمة المرور يجب أن تكون 6 أحرف على الأقل');
        valid = false;
      } else {
        ClinicUI.setFieldError('reg-password', 'reg-password-error', '');
      }

      if (!valid) {
        getMascot()?.reactError();
        return;
      }

      ClinicUI.setButtonLoading(regBtn, true, 'جاري إنشاء الحساب...');
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, phone, password })
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'تعذر إنشاء الحساب');
        }

        getMascot()?.reactSuccess();
        ClinicUI.showToast('تم إنشاء حسابك بنجاح');
        await finalizePostAuthNavigation();
      } catch (err) {
        getMascot()?.reactError();
        ClinicUI.showToast(err.message, 'error');
      } finally {
        ClinicUI.setButtonLoading(regBtn, false);
      }
    });

    // 3. Forgot Password Form
    const forgotForm = document.getElementById('panel-forgot');
    const forgotBtn = document.getElementById('forgot-submit-btn');

    forgotForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('forgot-email').value.trim();

      if (!email || !email.includes('@')) {
        ClinicUI.setFieldError('forgot-email', 'forgot-email-error', 'يرجى إدخال بريد إلكتروني صحيح');
        getMascot()?.reactError();
        return;
      }
      ClinicUI.setFieldError('forgot-email', 'forgot-email-error', '');

      ClinicUI.setButtonLoading(forgotBtn, true, 'جاري الإرسال...');
      try {
        const res = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'تعذر إرسال رابط الاستعادة');

        getMascot()?.reactSuccess();
        ClinicUI.showToast(data.message || 'تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني');
      } catch (err) {
        getMascot()?.reactError();
        ClinicUI.showToast(err.message, 'error');
      } finally {
        ClinicUI.setButtonLoading(forgotBtn, false);
      }
    });

    // 4. Reset Password Form
    const resetForm = document.getElementById('panel-reset');
    const resetBtn = document.getElementById('reset-submit-btn');

    resetForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const newPassword = document.getElementById('reset-new-password').value;
      const token = new URLSearchParams(window.location.search).get('token');

      if (newPassword.length < 6) {
        ClinicUI.setFieldError('reset-new-password', 'reset-password-error', 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل');
        getMascot()?.reactError();
        return;
      }
      ClinicUI.setFieldError('reset-new-password', 'reset-password-error', '');

      ClinicUI.setButtonLoading(resetBtn, true, 'جاري التحديث...');
      try {
        const res = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, newPassword })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'رابط الاستعادة غير صالح أو منتهي الصلاحية');

        getMascot()?.reactSuccess();
        ClinicUI.showToast('تم تحديث كلمة المرور بنجاح، يمكنك تسجيل الدخول الآن');
        setTimeout(() => {
          window.location.href = '/login.html';
        }, 1000);
      } catch (err) {
        getMascot()?.reactError();
        ClinicUI.showToast(err.message, 'error');
      } finally {
        ClinicUI.setButtonLoading(resetBtn, false);
      }
    });
  }
})();