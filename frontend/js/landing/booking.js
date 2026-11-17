/* ==========================================================================
   Landing Module 4: Custom Selects, Pending Booking & Form Submission
   ========================================================================== */

(function () {
  window.ClinicLanding = window.ClinicLanding || {};

  function setMinBookingDate() {
    const dateInput = document.getElementById('booking-date');
    if (dateInput) {
      const today = new Date().toISOString().split('T')[0];
      dateInput.min = today;
      if (!dateInput.value) dateInput.value = today;
    }
  }

  function initCustomDropdowns() {
    const isEn = (document.documentElement.lang || localStorage.getItem('app_lang') || 'ar') === 'en';
    window.ClinicLanding.doctorSelect = ClinicUI.createCustomSelect(
      'doctor-select-container',
      [],
      isEn ? 'Select Attending Doctor' : 'اختر الطبيب المعالج'
    );
    window.ClinicLanding.serviceSelect = ClinicUI.createCustomSelect(
      'service-select-container',
      [],
      isEn ? 'Select Required Service' : 'اختر الخدمة العلاجية'
    );
  }

  function restorePendingBooking() {
    try {
      const saved = JSON.parse(sessionStorage.getItem('pending_booking') || 'null');
      if (!saved) return;

      const { doctorSelect, serviceSelect } = window.ClinicLanding;
      if (saved.patient_name) document.getElementById('booking-name').value = saved.patient_name;
      if (saved.patient_phone) document.getElementById('booking-phone').value = saved.patient_phone;
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

      const { currentUser, doctorSelect, serviceSelect } = window.ClinicLanding;
      const patient_name = document.getElementById('booking-name')?.value.trim() || '';
      const patient_phone = document.getElementById('booking-phone')?.value.trim() || '';
      const doctor_id = doctorSelect ? doctorSelect.getValue() : '';
      const service_id = serviceSelect ? serviceSelect.getValue() : '';
      const date = document.getElementById('booking-date').value;
      const start_time = document.getElementById('booking-time').value;
      const notes = document.getElementById('booking-notes').value.trim();

      if (!currentUser) {
        sessionStorage.setItem(
          'pending_booking',
          JSON.stringify({ patient_name, patient_phone, doctor_id, service_id, date, start_time, notes })
        );
        ClinicUI.showToast('يجب تسجيل الدخول أو إنشاء حساب لإتمام الحجز، تم حفظ اختياراتك', 'warning');
        setTimeout(() => {
          window.location.href = '/login.html';
        }, 900);
        return;
      }

      let valid = true;

      if (patient_name.length < 3) {
        ClinicUI.setFieldError('booking-name', 'err-booking-name', 'يرجى إدخال الاسم الكامل للمريض');
        valid = false;
      } else {
        ClinicUI.setFieldError('booking-name', 'err-booking-name', '');
      }

      if (patient_phone.length < 7) {
        ClinicUI.setFieldError('booking-phone', 'err-booking-phone', 'يرجى إدخال رقم هاتف صحيح للتواصل');
        valid = false;
      } else {
        ClinicUI.setFieldError('booking-phone', 'err-booking-phone', '');
      }

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
        if (currentUser.name) document.getElementById('booking-name').value = currentUser.name;
        if (currentUser.phone) document.getElementById('booking-phone').value = currentUser.phone;
        doctorSelect?.setValue('');
        serviceSelect?.setValue('');
      } catch (err) {
        ClinicUI.showToast(err.message, 'error');
      } finally {
        ClinicUI.setButtonLoading(btn, false);
      }
    });
  }

  window.ClinicLanding.setMinBookingDate = setMinBookingDate;
  window.ClinicLanding.initCustomDropdowns = initCustomDropdowns;
  window.ClinicLanding.restorePendingBooking = restorePendingBooking;
  window.ClinicLanding.bindBookingForm = bindBookingForm;
})();