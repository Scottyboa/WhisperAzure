import { initIndexLanguage } from './languageLoaderUsage.js';
import { initConsentBanner, initGuideOverlay } from './ui.js';

document.addEventListener('DOMContentLoaded', async () => {
  // Wait for the language initialization to complete.
  await initIndexLanguage();
  
  // Initialize the consent banner.
  initConsentBanner();
  
  // Initialize the API key guide overlay and API key redirect functionality.
  initGuideOverlay();
});
