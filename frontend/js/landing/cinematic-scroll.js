/* ==========================================================================
   Landing Module 2: Cinematic Curtain Stages, Video Scrubbing & 3D Tilt
   ========================================================================== */

(function () {
  window.ClinicLanding = window.ClinicLanding || {};

  function initCinematicScrollEffects() {
    const track = document.getElementById('cinematic-scroll-track');
    const slides = Array.from(document.querySelectorAll('.cinematic-slide'));
    const dots = document.querySelectorAll('.stage-dot');
    const bgVideo = document.getElementById('dental-bg-video');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (slides.length < 4) return;

    let targetVideoTime = 0;
    let isVideoPrimed = false;

    function primeVideoDecoder() {
      if (!bgVideo || isVideoPrimed) return;
      bgVideo.muted = true;
      if (bgVideo.readyState === 0) {
        bgVideo.load();
      }
      const playPromise = bgVideo.play();
      if (playPromise && typeof playPromise.then === 'function') {
        playPromise
          .then(() => {
            bgVideo.pause();
            isVideoPrimed = true;
          })
          .catch(() => {
            isVideoPrimed = false;
          });
      }
    }

    function updateStackAndVideo() {
      const scrollY = window.scrollY || window.pageYOffset || 0;
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const scrollProgress = Math.min(Math.max(0, scrollY / maxScroll), 1);

      if (bgVideo) {
        const duration = bgVideo.duration && !isNaN(bgVideo.duration) && bgVideo.duration > 0 ? bgVideo.duration : 15;
        targetVideoTime = Math.min(Math.max(0, scrollProgress * (duration - 0.05)), duration - 0.05);

        const parallaxY = (0.5 - scrollProgress) * 56;
        bgVideo.style.transform = `scale(1.12) translate3d(0, ${parallaxY.toFixed(2)}px, 0)`;
      }

      let activeStage = 0;
      slides.forEach((slide, idx) => {
        const rect = slide.getBoundingClientRect();
        if (rect.top <= window.innerHeight * 0.45) {
          activeStage = idx;
        }

        const nextSlide = slides[idx + 1];
        if (nextSlide && window.innerWidth > 768 && !prefersReducedMotion) {
          const nextRect = nextSlide.getBoundingClientRect();
          const vh = window.innerHeight;
          const overlap = Math.min(Math.max(0, (vh - nextRect.top) / vh), 1);
          const scale = 1 - overlap * 0.05;
          const opacity = 1 - overlap * 0.35;
          slide.style.transform = `scale(${scale.toFixed(4)})`;
          slide.style.opacity = opacity.toFixed(3);
        } else {
          slide.style.transform = 'scale(1)';
          slide.style.opacity = '1';
        }
      });

      dots.forEach((dot, idx) => dot.classList.toggle('active', idx === activeStage));
    }

    function videoScrubLoop() {
      if (bgVideo && bgVideo.duration && !isNaN(bgVideo.duration) && bgVideo.duration > 0) {
        if (!bgVideo.seeking && bgVideo.readyState >= 2) {
          const diff = targetVideoTime - bgVideo.currentTime;
          if (Math.abs(diff) > 0.04) {
            const nextTime = bgVideo.currentTime + diff * 0.25;
            bgVideo.currentTime = Math.min(Math.max(0, nextTime), bgVideo.duration - 0.05);
          }
        }
      }
      requestAnimationFrame(videoScrubLoop);
    }
    requestAnimationFrame(videoScrubLoop);

    window.goToCinematicStage = function (stageIndex) {
      const targetSlide = slides[stageIndex];
      if (!targetSlide) return;

      let offsetTop = track ? track.offsetTop : 0;
      for (let i = 0; i < stageIndex; i++) {
        offsetTop += slides[i].offsetHeight;
      }
      window.scrollTo({
        top: offsetTop,
        behavior: prefersReducedMotion ? 'auto' : 'smooth'
      });
    };

    window.addEventListener('scroll', () => {
      if (!isVideoPrimed) primeVideoDecoder();
      updateStackAndVideo();
    }, { passive: true });

    window.addEventListener('pointerdown', primeVideoDecoder, { once: true, passive: true });
    window.addEventListener('wheel', primeVideoDecoder, { once: true, passive: true });
    window.addEventListener('resize', updateStackAndVideo, { passive: true });

    if (bgVideo) {
      bgVideo.addEventListener('loadeddata', () => {
        primeVideoDecoder();
        updateStackAndVideo();
      });
      if (bgVideo.readyState >= 2) {
        primeVideoDecoder();
      }
    }

    updateStackAndVideo();

    dots.forEach((dot) => {
      dot.addEventListener('click', () => {
        window.goToCinematicStage(Number(dot.dataset.targetStage || 0));
      });
    });

    const anchorStageMap = {
      '#doctors': 0,
      '#services': 1,
      '#booking': 2,
      '#contact': 3
    };

    Object.entries(anchorStageMap).forEach(([selector, stageIdx]) => {
      document.querySelectorAll(`a[href="${selector}"]`).forEach((link) => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          window.goToCinematicStage(stageIdx);
        });
      });
    });

    const tiltSelector = '.service-card, .doctor-card, #visit-steps-card, #contact.card';
    let activeCard = null;

    document.addEventListener('mousemove', (e) => {
      const card = e.target.closest(tiltSelector);
      if (activeCard && activeCard !== card) {
        activeCard.style.transition = 'transform 0.35s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.35s ease';
        activeCard.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
        activeCard = null;
      }
      if (!card) return;
      activeCard = card;
      card.style.transition = 'transform 0.08s ease-out, box-shadow 0.25s ease';
      const rect = card.getBoundingClientRect();
      const rotateX = ((e.clientY - rect.top - rect.height / 2) / (rect.height / 2)) * -7;
      const rotateY = ((e.clientX - rect.left - rect.width / 2) / (rect.width / 2)) * 7;
      card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.025, 1.025, 1.025)`;
    });
  }

  window.ClinicLanding.initCinematicScrollEffects = initCinematicScrollEffects;
})();