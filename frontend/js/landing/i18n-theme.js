/* ==========================================================================
   Landing Module 1: Theme Toggle & Bilingual Dictionary (AR / EN)
   ========================================================================== */

(function () {
  window.ClinicLanding = window.ClinicLanding || {};

  const ICONS = {
    moon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`,
    sun: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`
  };

  const translations = {
    ar: {
      clinic_name: 'عيادة الابتسامة الذكية',
      nav_services: 'الخدمات والأسعار',
      nav_booking: 'حجز موعد',
      nav_doctors: 'الكادر الطبي',
      nav_contact: 'الموقع وساعات العمل',
      login_btn: 'تسجيل الدخول',
      book_now: 'احجز موعدك',
      hero_eyebrow: 'عمّان - شارع الجاردنز : حجز إلكتروني فوري',
      hero_title: 'رعاية أسنان دقيقة بتقنيات حديثة وأسعار واضحة',
      hero_desc: 'نجمع بين الخبرة السريرية وأدوات التقييم الذكي لنمنحك خطة علاجية شفافة، مواعيد منظمة بدون انتظار طويل، وسجلاً طبياً رقمياً متكاملاً لكل زيارة.',
      hero_cta_book: 'احجز موعدك الآن',
      hero_cta_services: 'استعرض الخدمات والأسعار',
      stat_1_val: '+15 سنة',
      stat_1_lbl: 'خبرة سريرية متخصصة',
      stat_2_val: '100%',
      stat_2_lbl: 'تعقيم بمعايير دولية',
      stat_3_val: '3 ساعات',
      stat_3_lbl: 'حد أدنى لتأكيد الموعد',
      journey_title: 'كيف تتم زيارتك في العيادة؟',
      step_1_title: '1. استشارة وتقييم أولي:',
      step_1_desc: 'صف أعراضك للمساعد الطبي الذكي أو اختر الخدمة العلاجية المناسبة مباشرة.',
      step_2_title: '2. تحديد الطبيب والوقت:',
      step_2_desc: 'اختر الموعد المناسب لك مسبقاً لتجنب الازدحام والانتظار في العيادة.',
      step_3_title: '3. متابعة سجلك الرقمي:',
      step_3_desc: 'اطّلع على تفاصيل كل جلسة وتعليمات ما بعد العلاج من حسابك الشخصي.',
      open_ai_btn: 'افتح المساعد الطبي الذكي الآن',
      services_title: 'الخدمات العلاجية المعتمدة',
      services_sub: 'قائمة محدثة مباشرة من نظام العيادة تشمل مدة الجلسة التقديرية والأسعار الواضحة لكل خدمة علاجية.',
      booking_title: 'حجز موعد زيارة',
      booking_sub: 'اختر الطبيب، الخدمة العلاجية، والتاريخ المناسب وسيتم تأكيد موعدك فوراً.',
      lbl_fullname: 'الاسم الكامل للمريض',
      ph_fullname: 'أدخل اسمك الكامل',
      lbl_mobile: 'رقم الهاتف للتواصل',
      lbl_doctor: 'الطبيب المعالج',
      lbl_service: 'نوع الخدمة المطلوبة',
      lbl_date: 'تاريخ الزيارة',
      lbl_time: 'الوقت المفضل (09:00 ص - 08:00 م)',
      lbl_notes: 'ملاحظات إضافية للطبيب (اختياري)',
      ph_notes: 'أذكر أي حساسية دوائية أو تفاصيل تود إبلاغ الطبيب بها',
      btn_confirm_booking: 'تأكيد طلب الموعد',
      contact_title: 'معلومات التواصل والموقع',
      contact_sub: 'يسعدنا استقبالكم في عيادتنا أو الرد على استفساراتكم على مدار الأسبوع',
      lbl_address: 'العنوان',
      val_address: 'عمّان، شارع وصفي التل (الجاردنز)، مجمع الياسمين الطبي، الطابق الثالث',
      lbl_hours: 'ساعات العمل',
      lbl_phone: 'الهاتف المباشر',
      lbl_email: 'البريد الإلكتروني',
      doctors_title: 'الكادر الطبي المتخصص',
      doctors_sub: 'فريق من أطباء وجراحي الفم والأسنان المعتمدين لمتابعة حالتك بدقة.',
      footer_rights: 'جميع الحقوق محفوظة © 2026',
      footer_privacy: 'سياسة الخصوصية',
      footer_terms: 'شروط الاستخدام',
      footer_portal: 'بوابة الكادر الطبي'
    },
    en: {
      clinic_name: 'Smart Smile Dental Clinic',
      nav_services: 'Services & Prices',
      nav_booking: 'Book Appointment',
      nav_doctors: 'Medical Team',
      nav_contact: 'Location & Hours',
      login_btn: 'Login',
      book_now: 'Book Now',
      hero_eyebrow: 'Amman - Gardens St: Instant Online Booking',
      hero_title: 'Precision Dental Care with Modern Tech & Transparent Pricing',
      hero_desc: 'We combine clinical expertise with smart evaluation tools to give you a transparent treatment plan, organized appointments without long waits, and a complete digital medical record.',
      hero_cta_book: 'Book Your Appointment',
      hero_cta_services: 'Explore Services & Prices',
      stat_1_val: '+15 Years',
      stat_1_lbl: 'Specialized Clinical Experience',
      stat_2_val: '100%',
      stat_2_lbl: 'International Sterilization',
      stat_3_val: '3 Hours',
      stat_3_lbl: 'Min. Advance Booking',
      journey_title: 'How Your Clinic Visit Works',
      step_1_title: '1. Initial Consultation & Triage:',
      step_1_desc: 'Describe your symptoms to our smart medical assistant or select your treatment directly.',
      step_2_title: '2. Choose Doctor & Time:',
      step_2_desc: 'Book your preferred slot in advance to avoid waiting room delays.',
      step_3_title: '3. Track Your Digital Record:',
      step_3_desc: 'Review session details and post-treatment instructions from your patient portal.',
      open_ai_btn: 'Open Smart Medical Assistant Now',
      services_title: 'Approved Dental Services',
      services_sub: 'Directly updated from our clinic system including estimated session duration and transparent pricing.',
      booking_title: 'Book a Visit',
      booking_sub: 'Choose your doctor, required service, and preferred date for instant confirmation.',
      lbl_fullname: 'Patient Full Name',
      ph_fullname: 'Enter your full name',
      lbl_mobile: 'Contact Phone Number',
      lbl_doctor: 'Attending Doctor',
      lbl_service: 'Required Service',
      lbl_date: 'Visit Date',
      lbl_time: 'Preferred Time (09:00 AM - 08:00 PM)',
      lbl_notes: 'Additional Notes for Doctor (Optional)',
      ph_notes: 'Mention any drug allergies or details you wish to share',
      btn_confirm_booking: 'Confirm Appointment Request',
      contact_title: 'Contact Info & Location',
      contact_sub: 'We are pleased to welcome you to our clinic or answer your inquiries throughout the week',
      lbl_address: 'Address',
      val_address: 'Amman, Wasfi Al-Tal St (Gardens), Al-Yasmin Medical Complex, 3rd Floor',
      lbl_hours: 'Working Hours',
      lbl_phone: 'Direct Phone',
      lbl_email: 'Email Address',
      doctors_title: 'Specialized Medical Team',
      doctors_sub: 'A team of certified oral and dental surgeons to care for your smile.',
      footer_rights: 'All Rights Reserved © 2026',
      footer_privacy: 'Privacy Policy',
      footer_terms: 'Terms & Conditions',
      footer_portal: 'Medical Staff Portal'
    }
  };

  function getThemeButtonHtml(isDark) {
    return isDark ? ICONS.sun : ICONS.moon;
  }

  function applyTranslations(lang) {
    const dict = translations[lang] || translations.ar;
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (dict[key]) el.textContent = dict[key];
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (dict[key]) el.placeholder = dict[key];
    });
  }

  function initThemeAndLang() {
    const isDark = localStorage.getItem('theme') === 'dark';
    document.documentElement.classList.toggle('dark-mode', isDark);
    const tBtn = document.getElementById('theme-toggle-btn');
    if (tBtn) tBtn.innerHTML = getThemeButtonHtml(isDark);

    const savedLang = localStorage.getItem('app_lang') || 'ar';
    document.documentElement.lang = savedLang;
    document.documentElement.dir = savedLang === 'ar' ? 'rtl' : 'ltr';
    const lBtn = document.getElementById('lang-toggle-btn');
    if (lBtn) lBtn.textContent = savedLang === 'ar' ? 'EN' : 'عربي';
    applyTranslations(savedLang);
  }

  window.toggleDarkMode = function () {
    const isDark = document.documentElement.classList.toggle('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    const btn = document.getElementById('theme-toggle-btn');
    if (btn) btn.innerHTML = getThemeButtonHtml(isDark);
  };

  window.toggleLanguage = async function () {
    const currentLang = document.documentElement.lang || 'ar';
    const newLang = currentLang === 'ar' ? 'en' : 'ar';

    document.documentElement.lang = newLang;
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
    localStorage.setItem('app_lang', newLang);

    const btn = document.getElementById('lang-toggle-btn');
    if (btn) btn.textContent = newLang === 'ar' ? 'EN' : 'عربي';

    applyTranslations(newLang);
    window.ClinicUI?.refreshFloatingAiLanguage?.();

    // تحديث القوائم المنسدلة والبيانات الديناميكية فوراً دون إعادة تحميل الصفحة
    const state = window.ClinicLanding;
    const prevDoc = state.doctorSelect?.getValue() || '';
    const prevSvc = state.serviceSelect?.getValue() || '';

    state.initCustomDropdowns?.();
    await Promise.all([
      state.loadClinicSettings?.(),
      state.loadServices?.(),
      state.loadDoctors?.()
    ]);

    if (prevDoc && state.doctorSelect) state.doctorSelect.setValue(prevDoc);
    if (prevSvc && state.serviceSelect) state.serviceSelect.setValue(prevSvc);
    state.renderHeaderAuth?.();
  };

  window.ClinicLanding.getThemeButtonHtml = getThemeButtonHtml;
  window.ClinicLanding.applyTranslations = applyTranslations;
  window.ClinicLanding.initThemeAndLang = initThemeAndLang;
})();