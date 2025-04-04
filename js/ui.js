// === Consent Banner Functions ===

// Sets a cookie with the given name, value, and expiration in days.
function setCookie(name, value, days) {
  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

// Retrieves the value of a cookie with the specified name.
function getCookie(name) {
  const nameEQ = name + "=";
  const ca = document.cookie.split(";");
  for (let c of ca) {
    c = c.trim();
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length);
  }
  return null;
}

// Dynamically loads the AdsTera script with the proper client parameter and crossorigin attribute.
function loadAdStera() {
  // Define the ad options for AdStera
  window.atOptions = {
    'key': '71a7378e100db1ee346bb177138bb050',
    'format': 'iframe',
    'height': 250,
    'width': 300,
    'params': {}
  };
  // Create and load the AdStera script
  const script = document.createElement("script");
  script.type = "text/javascript";
  script.async = true;
  script.src = "//comparedsobalike.com/71a7378e100db1ee346bb177138bb050/invoke.js";
  document.head.appendChild(script);
}

// Re-enable buttons if they exist on the page.
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

// The consent banner code has been removed.
// The initConsentBanner function now simply loads the ad script and ensures that functional buttons are enabled.
// It assumes that the consent banner markup has been removed from the HTML.
function initConsentBanner() {
  loadAdStera();
  enableFunctionalButtons();
  console.log("Consent banner removed; ads loaded and functions enabled.");
}

function initInfoModals() {
  console.log("initInfoModals: Accordion UI is enabled; modal initialization is disabled.");
}

export { initConsentBanner, initInfoModals };
