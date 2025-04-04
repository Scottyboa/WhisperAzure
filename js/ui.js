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

// Dynamically loads the AdSense script based on user consent.
// If consent is "accepted", loads personalized ads;
// otherwise, loads with npa=1 (non‑personalized ads).
function loadAdSenseAds() {
  const consent = getCookie("user_consent");
  // If consent is accepted, load personalized ads; if not (or rejected/not set), add npa=1.
  const npaParam = (consent === "accepted") ? "" : "&npa=1";
  const adScript = document.createElement('script');
  adScript.async = true;
  adScript.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3747901131960450" + npaParam;
  adScript.crossOrigin = "anonymous";
  document.head.appendChild(adScript);
}

// Inserts an AdSense ad unit into a specified container.
// containerId: the HTML element's ID where the ad will be injected.
// adSlot: your AdSense ad slot ID.
function insertAdSenseAd(containerId, adSlot) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  const ins = document.createElement('ins');
  ins.className = "adsbygoogle";
  ins.style.display = "inline-block";
  ins.style.width = "300px";
  ins.style.height = "250px";
  ins.setAttribute("data-ad-client", "ca-pub-3747901131960450");
  ins.setAttribute("data-ad-slot", adSlot);
  
  container.appendChild(ins);
  (adsbygoogle = window.adsbygoogle || []).push({});
}

// Initializes ad units in the right sidebar.
// Here we insert two 300x250 medium rectangle ad units.
// For the top ad unit, we use the provided ad slot "4927329947".
// The second ad unit currently remains as a placeholder; update its ad slot when available.
function initAdUnits() {
  // Delay slightly to allow the AdSense script to load.
  setTimeout(() => {
    insertAdSenseAd("right-ad-unit-1", "4927329947"); // Right sidebar top ad (300x250)
    // For the second ad unit, replace "YOUR_AD_SLOT_2" with the actual slot when ready.
    insertAdSenseAd("right-ad-unit-2", "YOUR_AD_SLOT_2");
  }, 500);
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
  // New confirmation section for rejection.
  const cmpRejectConfirmation = document.getElementById("cmp-reject-confirmation");
  const cmpRejectConfirmAccept = document.getElementById("cmp-reject-confirm-accept");
  const cmpRejectConfirmReject = document.getElementById("cmp-reject-confirm-reject");

  // Check if the user has already made a choice.
  const userConsent = getCookie("user_consent");
  if (userConsent === "accepted") {
    if (cmpBanner) cmpBanner.style.display = "none";
    loadAdSenseAds();
    initAdUnits();
    const adRevenueMessage = document.getElementById("ad-revenue-message");
    if (adRevenueMessage) adRevenueMessage.style.display = "none";
    console.log("Consent already accepted: Banner hidden and personalized AdSense loaded.");
    enableFunctionalButtons();
    return;
  } else if (userConsent === "rejected") {
    if (cmpBanner) cmpBanner.style.display = "none";
    loadAdSenseAds();
    initAdUnits();
    console.log("Consent rejected: Banner hidden and non-personalized AdSense loaded.");
    enableFunctionalButtons();
    return;
  }

  if (cmpAccept) {
    cmpAccept.addEventListener("click", () => {
      setCookie("user_consent", "accepted", 365);
      if (cmpBanner) cmpBanner.style.display = "none";
      loadAdSenseAds();
      initAdUnits();
      const adRevenueMessage = document.getElementById("ad-revenue-message");
      if (adRevenueMessage) {
        adRevenueMessage.style.display = "none";
      }
      console.log("Consent accepted: Personalized AdSense loaded and banner hidden.");
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
      loadAdSenseAds();
      initAdUnits();
      const adRevenueMessage = document.getElementById("ad-revenue-message");
      if (adRevenueMessage) {
        adRevenueMessage.style.display = "none";
      }
      console.log("Consent accepted from reject confirmation: Personalized AdSense loaded and banner hidden.");
      enableFunctionalButtons();
    });
  }

  if (cmpRejectConfirmReject) {
    cmpRejectConfirmReject.addEventListener("click", () => {
      setCookie("user_consent", "rejected", 365);
      if (cmpBanner) cmpBanner.style.display = "none";
      loadAdSenseAds();
      initAdUnits();
      console.log("Consent rejected: Non-personalized AdSense loaded and banner hidden.");
      enableFunctionalButtons();
    });
  }
}

function initInfoModals() {
  console.log("initInfoModals: Accordion UI is enabled; modal initialization is disabled.");
}

export { initConsentBanner, initInfoModals };
