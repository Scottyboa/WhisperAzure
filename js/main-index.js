import { initIndexLanguage } from './languageLoaderUsage.js';
import { initConsentBanner, initInfoModals } from './ui.js';

document.addEventListener('DOMContentLoaded', async () => {
  // Initialize language support for the index page (this now includes the new "offerText" update)
  await initIndexLanguage();

  // Initialize the consent banner.
  initConsentBanner();

  // Initialize the info accordions (replacing the previous modal implementation).
  initInfoModals();
});
