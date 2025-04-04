// ui.js

// Enable functional buttons on the page.
function enableFunctionalButtons() {
  const startButton = document.getElementById("startButton");
  if (startButton) {
    startButton.disabled = false;
    startButton.title = "";
  }
  const generateNoteButton = document.getElementById("generateNoteButton");
  if (generateNoteButton) {
    generateNoteButton.disabled = false;
    generateNoteButton.title = "";
  }
}

// Initialize info modals (using an accordion UI in this case).
function initInfoModals() {
  console.log("initInfoModals: Accordion UI is enabled; modal initialization is disabled.");
}

// Removed adsterra code; these functions are now no-ops because AdSense is managed directly in the HTML.
function loadAdStera() {
  // AdStera ad code removed; no ad script is loaded here.
}

function initConsentBanner() {
  // Ads are now managed directly in the HTML via AdSense.
  enableFunctionalButtons();
  console.log("Consent banner removed; ads loaded and functions enabled.");
}

// Export functions if using ES modules.
export { enableFunctionalButtons, initInfoModals, loadAdStera, initConsentBanner };
