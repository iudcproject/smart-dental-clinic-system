/* ==========================================================================
   Landing Page Entrypoint & Orchestrator
   ========================================================================== */

(function () {
  document.addEventListener('DOMContentLoaded', async () => {
    const app = window.ClinicLanding;

    app.initThemeAndLang?.();
    app.setMinBookingDate?.();
    app.initCustomDropdowns?.();

    const heroAiBtn = document.getElementById('open-ai-from-card-btn') || document.getElementById('open-floating-ai-cta');
    heroAiBtn?.addEventListener('click', () => {
      document.getElementById('ai-fab-trigger')?.click();
    });

   app.initCinematicScrollEffects?.();

    await Promise.all([
      app.loadClinicSettings?.(),
      app.checkAuthStatus?.(),
      app.loadServices?.(),
      app.loadDoctors?.()
    ]);

    app.restorePendingBooking?.();
    app.bindBookingForm?.();
  });
})();