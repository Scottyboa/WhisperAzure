// ui.js

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

function initConsentBanner() {
  const cmpAccept = document.getElementById("cmp-accept");
  // Replace the old "Manage" button with a new "Reject" button.
  const cmpReject = document.getElementById("cmp-reject");
  const cmpBanner = document.getElementById("cmp-banner");
  // New confirmation section for rejection
  const cmpRejectConfirmation = document.getElementById("cmp-reject-confirmation");
  const cmpRejectConfirmAccept = document.getElementById("cmp-reject-confirm-accept");
  const cmpRejectConfirmReject = document.getElementById("cmp-reject-confirm-reject");

  // Check if the user has already made a choice.
  const userConsent = getCookie("user_consent");
  if (userConsent === "accepted") {
    if (cmpBanner) cmpBanner.style.display = "none";
    // AdStera code removed – new ad implementation will be loaded later based on consent.
    const adRevenueMessage = document.getElementById("ad-revenue-message");
    if (adRevenueMessage) adRevenueMessage.style.display = "none";
    console.log("Consent already accepted: Banner hidden and AdStera code removed.");
    // Ensure buttons are enabled.
    enableFunctionalButtons();
    return;
  } else if (userConsent === "rejected") {
    if (cmpBanner) cmpBanner.style.display = "none";
    console.log("Consent rejected: Cookie set to rejected. Functions will be disabled.");
    return;
  }

  if (cmpAccept) {
    cmpAccept.addEventListener("click", () => {
      setCookie("user_consent", "accepted", 365);
      if (cmpBanner) cmpBanner.style.display = "none";
      // AdStera code removed – new ad implementation will be loaded later based on consent.
      const adRevenueMessage = document.getElementById("ad-revenue-message");
      if (adRevenueMessage) {
        adRevenueMessage.style.display = "none";
      }
      console.log("Consent accepted: AdStera code removed and banner hidden.");
      // Re-enable the functional buttons immediately.
      enableFunctionalButtons();
    });
  }

  if (cmpReject) {
    cmpReject.addEventListener("click", () => {
      if (cmpRejectConfirmation) {
        cmpRejectConfirmation.style.display = "block";
      }
    });
  }

  if (cmpRejectConfirmAccept) {
    cmpRejectConfirmAccept.addEventListener("click", () => {
      // User changes mind in the rejection confirmation; treat as acceptance.
      setCookie("user_consent", "accepted", 365);
      if (cmpBanner) cmpBanner.style.display = "none";
      // AdStera code removed – new ad implementation will be loaded later based on consent.
      const adRevenueMessage = document.getElementById("ad-revenue-message");
      if (adRevenueMessage) {
        adRevenueMessage.style.display = "none";
      }
      console.log("Consent accepted from reject confirmation: AdStera code removed and banner hidden.");
      enableFunctionalButtons();
    });
  }

  if (cmpRejectConfirmReject) {
    cmpRejectConfirmReject.addEventListener("click", () => {
      setCookie("user_consent", "rejected", 365);
      if (cmpBanner) cmpBanner.style.display = "none";
      console.log("Consent rejected: Cookie set to rejected. Functions will be disabled.");
    });
  }
}

function initInfoModals() {
  console.log("initInfoModals: Accordion UI is enabled; modal initialization is disabled.");
}

export { initConsentBanner, initInfoModals };
