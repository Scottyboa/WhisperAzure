import { initIndexLanguage } from './languageLoaderUsage.js';
import { initConsentBanner, initInfoModals } from './ui.js';

document.addEventListener('DOMContentLoaded', async () => {
  // Initialize language support for the index page.
  await initIndexLanguage();

  // Initialize the consent banner.
  initConsentBanner();

  // Initialize all the info modals (Guide, Price, Security, About).
  initInfoModals();
});
