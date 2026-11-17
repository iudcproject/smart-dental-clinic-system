/* ==========================================================================
   Shared UI Components Entrypoint & Public Facade
   ========================================================================== */

window.ClinicUI = (function () {
  const core = window.ClinicUIModules?.core || {};
  const floatingAi = window.ClinicUIModules?.floatingAi || {};
  const privacyTranslator = window.ClinicUIModules?.privacyTranslator || {};

  document.addEventListener('DOMContentLoaded', () => {
    privacyTranslator.initCookieAndAnalytics?.();
    floatingAi.initFloatingAiAssistant?.();
    privacyTranslator.initAutoTranslatorObserver?.();
  });

  return {
    showToast: core.showToast,
    setButtonLoading: core.setButtonLoading,
    setFieldError: core.setFieldError,
    createCustomSelect: core.createCustomSelect,
    escapeHtml: core.escapeHtml,
    autoTranslateText: privacyTranslator.autoTranslateText,
    translateDynamicElements: privacyTranslator.translateDynamicElements,
    refreshFloatingAiLanguage: floatingAi.refreshFloatingAiLanguage
  };
})();