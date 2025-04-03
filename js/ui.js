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
    loadAdStera();
    const adRevenueMessage = document.getElementById("ad-revenue-message");
    if (adRevenueMessage) adRevenueMessage.style.display = "none";
    console.log("Consent already accepted: Banner hidden and AdStera loaded.");
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
      loadAdStera();
      const adRevenueMessage = document.getElementById("ad-revenue-message");
      if (adRevenueMessage) {
        adRevenueMessage.style.display = "none";
      }
      console.log("Consent accepted: AdStera loaded and banner hidden.");
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
      loadAdStera();
      const adRevenueMessage = document.getElementById("ad-revenue-message");
      if (adRevenueMessage) {
        adRevenueMessage.style.display = "none";
      }
      console.log("Consent accepted from reject confirmation: AdStera loaded and banner hidden.");
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

// === Info Accordions Initialization (Index Page) ===
// Previously, this function initialized modal overlays and their event listeners.
// Now that we have replaced modals with accordions in index.html,
// the accordion toggle is handled by inline JavaScript there.
// We leave this function as a stub to avoid breaking any references.
function initInfoModals() {
  console.log("initInfoModals: Accordion UI is enabled; modal initialization is disabled.");
}

export { initConsentBanner, initInfoModals };
