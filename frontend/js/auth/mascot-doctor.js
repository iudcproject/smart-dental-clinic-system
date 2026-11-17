const MOON_ICON_SVG = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
const SUN_ICON_SVG = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';

function initLoginShell() {
  const isDark = localStorage.getItem('theme') === 'dark';
  if (isDark) {
    document.documentElement.classList.add('dark-mode');
  }
  const tBtn = document.getElementById('theme-toggle-btn');
  if (tBtn) tBtn.innerHTML = isDark ? SUN_ICON_SVG : MOON_ICON_SVG;

  const savedLang = localStorage.getItem('app_lang') || 'ar';
  document.documentElement.lang = savedLang;
  document.documentElement.dir = savedLang === 'ar' ? 'rtl' : 'ltr';
  const lBtn = document.getElementById('lang-toggle-btn');
  if (lBtn) lBtn.textContent = savedLang === 'ar' ? 'EN' : 'عربي';
}

window.toggleLoginTheme = function () {
  const isDark = document.documentElement.classList.toggle('dark-mode');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  const btn = document.getElementById('theme-toggle-btn');
  if (btn) btn.innerHTML = isDark ? SUN_ICON_SVG : MOON_ICON_SVG;
};

window.toggleLoginLang = function () {
  const current = document.documentElement.lang || 'ar';
  const next = current === 'ar' ? 'en' : 'ar';
  localStorage.setItem('app_lang', next);
  location.reload();
};

function initLittleDoctorMascot() {
  const stage = document.getElementById('little-doctor-stage');
  const wholeBody = document.getElementById('doc-whole-body');
  const seatShadow = document.getElementById('seat-shadow');
  const pulseWave = document.getElementById('mascot-pulse-wave');
  const sparkles = document.getElementById('mascot-sparkles');
  const torso = document.getElementById('doc-torso');
  const stethoscope = document.getElementById('doc-stethoscope');
  const headRig = document.getElementById('doc-head-rig');
  const headBack = document.getElementById('doc-head-back');
  const hairLayer = document.getElementById('doc-hair-layer');
  const faceFront = document.getElementById('doc-face-front');
  const brows = document.getElementById('doc-brows');
  const pupilLeft = document.getElementById('pupil-left');
  const pupilRight = document.getElementById('pupil-right');
  const eyelidLeft = document.getElementById('eyelid-left');
  const eyelidRight = document.getElementById('eyelid-right');
  const armLeft = document.getElementById('doc-arm-left');
  const armRight = document.getElementById('doc-arm-right');
  const mouth = document.getElementById('doc-mouth');

  if (!stage || !headRig) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;
  let isReady = false;
  let isCoveringEyes = false;
  let isPeeking = false;

  function triggerPulseWave() {
    if (!pulseWave || prefersReducedMotion) return;
    pulseWave.classList.remove('is-rippling');
    void pulseWave.offsetWidth;
    pulseWave.classList.add('is-rippling');
  }

  function flashSparkles(durationMs = 1100) {
    if (!sparkles || prefersReducedMotion) return;
    sparkles.animate(
      [
        { opacity: 0, transform: 'scale(0.85) translateY(4px)' },
        { opacity: 1, transform: 'scale(1.05) translateY(-2px)' },
        { opacity: 0, transform: 'scale(0.95) translateY(-8px)' }
      ],
      { duration: durationMs, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
    );
  }

  // 1. دخول ناعم من خلف حافة البطاقة مع استقرار مرن
  if (prefersReducedMotion) {
    isReady = true;
    wholeBody.classList.add('doc-body-seated');
    if (seatShadow) seatShadow.style.opacity = '1';
  } else {
    wholeBody.animate(
      [
        { opacity: 0, transform: 'translateY(34px) scale(0.88)' },
        { opacity: 1, transform: 'translateY(-10px) scale(1.03)' },
        { opacity: 1, transform: 'translateY(2px) scale(0.98)' },
        { opacity: 1, transform: 'translateY(0px) scale(1)' }
      ],
      { duration: 760, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'forwards' }
    ).onfinish = () => {
      isReady = true;
      wholeBody.classList.add('doc-body-seated');
      if (seatShadow) {
        seatShadow.style.transition = 'opacity 0.45s ease';
        seatShadow.style.opacity = '1';
      }
      triggerPulseWave();
      waveHello();
    };
  }

  function waveHello() {
    if (isCoveringEyes) return;
    mouth.setAttribute('d', 'M86 55 Q95 64 104 55');
    brows.style.transform = 'translateY(-2px)';
    flashSparkles(950);

    armRight.style.transform = 'translate(5px, -34px) rotate(-128deg)';
    setTimeout(() => {
      if (!isCoveringEyes) armRight.style.transform = 'translate(5px, -34px) rotate(-96deg)';
    }, 210);
    setTimeout(() => {
      if (!isCoveringEyes) armRight.style.transform = 'translate(5px, -34px) rotate(-132deg)';
    }, 420);
    setTimeout(() => {
      if (!isCoveringEyes) {
        armRight.style.transform = 'translate(0px, 0px) rotate(0deg)';
        mouth.setAttribute('d', 'M87.5 55.5 Q95 62 102.5 55.5');
        brows.style.transform = 'translateY(0px)';
      }
    }, 700);
  }

  function coverEyes(peek = false) {
    isCoveringEyes = true;
    isPeeking = peek;
    brows.style.transform = 'translateY(-2px)';
    if (peek) {
      armLeft.style.transform = 'translate(13px, -58px) rotate(134deg)';
      armRight.style.transform = 'translate(-12px, -45px) rotate(-108deg)';
      mouth.setAttribute('d', 'M89 56.5 Q95 59.5 101 56.5');
    } else {
      armLeft.style.transform = 'translate(14px, -60px) rotate(146deg)';
      armRight.style.transform = 'translate(-14px, -60px) rotate(-146deg)';
      mouth.setAttribute('d', 'M90 57 Q95 54.5 100 57');
    }
  }

  function uncoverEyes() {
    isCoveringEyes = false;
    isPeeking = false;
    brows.style.transform = 'translateY(0px)';
    armLeft.style.transform = 'translate(0px, 0px) rotate(0deg)';
    armRight.style.transform = 'translate(0px, 0px) rotate(0deg)';
    mouth.setAttribute('d', 'M87.5 55.5 Q95 62 102.5 55.5');
  }

  // 2. تتبع الفأرة والحقول بعمق ثلاثي الأبعاد
  window.addEventListener('mousemove', (e) => {
    if (!isReady) return;
    const rect = stage.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    targetX = Math.max(-1, Math.min(1, (e.clientX - centerX) / (window.innerWidth / 2)));
    targetY = Math.max(-1, Math.min(1, (e.clientY - centerY) / (window.innerHeight / 2)));

    if (!isCoveringEyes) {
      const dist = Math.hypot(e.clientX - centerX, e.clientY - centerY);
      brows.style.transform = dist < 175 ? 'translateY(-2px)' : 'translateY(0px)';
    }
  });

  stage.addEventListener('mouseenter', () => {
    if (!isReady || isCoveringEyes) return;
    flashSparkles(900);
    mouth.setAttribute('d', 'M86 55 Q95 63.5 104 55');
  });

  stage.addEventListener('mouseleave', () => {
    if (!isCoveringEyes) {
      mouth.setAttribute('d', 'M87.5 55.5 Q95 62 102.5 55.5');
    }
  });

  document.querySelectorAll('.auth-tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (isReady) {
        triggerPulseWave();
        waveHello();
      }
    });
  });

  document.querySelectorAll('.track-gaze').forEach((input) => {
    input.addEventListener('focus', () => {
      uncoverEyes();
      targetY = 0.62;
      brows.style.transform = 'translateY(-1.5px)';
    });
    input.addEventListener('input', (e) => {
      const progress = Math.min(1, e.target.value.length / 24);
      targetX = (document.dir === 'rtl' ? 0.5 - progress : progress - 0.5) * 1.3;
      targetY = 0.7;
    });
    input.addEventListener('blur', () => {
      targetY = 0;
      brows.style.transform = 'translateY(0px)';
    });
  });

  document.querySelectorAll('.privacy-secret').forEach((pwInput) => {
    pwInput.addEventListener('focus', () => coverEyes(pwInput.type === 'text'));
    pwInput.addEventListener('blur', () => {
      setTimeout(() => {
        if (!document.activeElement?.classList.contains('privacy-secret')) uncoverEyes();
      }, 120);
    });
  });

  document.querySelectorAll('.password-toggle-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      setTimeout(() => {
        const input = document.getElementById(btn.getAttribute('data-target'));
        if (input && document.activeElement === input) coverEyes(input.type === 'text');
      }, 20);
    });
  });

  document.querySelectorAll('form').forEach((form) => {
    form.addEventListener('submit', () => {
      setTimeout(() => {
        const hasError = Array.from(form.querySelectorAll('.form-error-text')).some((el) => el.textContent.trim().length > 0);
        if (hasError && !isCoveringEyes) {
          window.littleDoctorController.reactError();
        }
      }, 80);
    });
  });

  // 3. حلقة التحديث 60fps مع Parallax متعدد الطبقات لعمق 2.5D
  function updateHeadAndDepthLayers() {
    currentX += (targetX - currentX) * 0.1;
    currentY += (targetY - currentY) * 0.1;

    headRig.style.transform = `translate(${(currentX * 4.2).toFixed(2)}px, ${(currentY * 3).toFixed(2)}px) rotate(${(currentX * 11).toFixed(2)}deg)`;

    if (faceFront) {
      faceFront.setAttribute('transform', `translate(${(currentX * 2.4).toFixed(2)}, ${(currentY * 1.8).toFixed(2)})`);
    }
    if (hairLayer) {
      hairLayer.setAttribute('transform', `translate(${(currentX * 0.8).toFixed(2)}, ${(currentY * 0.5).toFixed(2)})`);
    }
    if (headBack) {
      headBack.setAttribute('transform', `translate(${(-currentX * 1.9).toFixed(2)}, ${(-currentY * 1.1).toFixed(2)})`);
    }
    if (torso) {
      torso.style.transform = `rotate(${(currentX * 3.2).toFixed(2)}deg)`;
    }
    if (stethoscope) {
      stethoscope.style.transform = `rotate(${(-currentX * 5.5).toFixed(2)}deg)`;
    }

    pupilLeft.setAttribute('transform', `translate(${(currentX * 2.6).toFixed(2)}, ${(currentY * 2.2).toFixed(2)})`);
    pupilRight.setAttribute('transform', `translate(${(currentX * 2.6).toFixed(2)}, ${(currentY * 2.2).toFixed(2)})`);

    requestAnimationFrame(updateHeadAndDepthLayers);
  }
  requestAnimationFrame(updateHeadAndDepthLayers);

  // الرمش الطبيعي
  setInterval(() => {
    if (isCoveringEyes && !isPeeking) return;
    eyelidLeft.setAttribute('ry', '6.8');
    eyelidRight.setAttribute('ry', '6.8');
    setTimeout(() => {
      eyelidLeft.setAttribute('ry', '0');
      eyelidRight.setAttribute('ry', '0');
    }, 145);
  }, 3500);

  // التفاعل عند النقر على الماسكوت
  stage.addEventListener('click', () => {
    if (!isReady) return;
    triggerPulseWave();
    waveHello();
    if (!prefersReducedMotion) {
      wholeBody.animate(
        [
          { transform: 'translateY(0px) scale(1)' },
          { transform: 'translateY(-11px) scale(1.04)' },
          { transform: 'translateY(2px) scale(0.98)' },
          { transform: 'translateY(0px) scale(1)' }
        ],
        { duration: 520, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
      );
    }
  });

  window.littleDoctorController = {
    reactSuccess: () => {
      if (!isReady) return;
      uncoverEyes();
      triggerPulseWave();
      waveHello();
      if (!prefersReducedMotion) {
        wholeBody.animate(
          [
            { transform: 'translateY(0px) scale(1)' },
            { transform: 'translateY(-14px) scale(1.05)' },
            { transform: 'translateY(0px) scale(1)' }
          ],
          { duration: 550, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
        );
      }
    },
    reactError: () => {
      if (!isCoveringEyes) {
        mouth.setAttribute('d', 'M89 58 Q95 54 101 58');
        if (!prefersReducedMotion) {
          headRig.animate(
            [
              { transform: 'rotate(0deg)' },
              { transform: 'rotate(-8deg)' },
              { transform: 'rotate(8deg)' },
              { transform: 'rotate(-4deg)' },
              { transform: 'rotate(0deg)' }
            ],
            { duration: 480, easing: 'ease-in-out' }
          );
        }
        setTimeout(() => {
          if (!isCoveringEyes) mouth.setAttribute('d', 'M87.5 55.5 Q95 62 102.5 55.5');
        }, 950);
      }
    },
    resetMood: () => uncoverEyes()
  };
}

function bootstrapLoginPage() {
  initLoginShell();
  initLittleDoctorMascot();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrapLoginPage);
} else {
  bootstrapLoginPage();
}