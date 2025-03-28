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

// Dynamically loads the AdSense script with the proper client parameter and crossorigin attribute.
function loadAdSense() {
  const script = document.createElement("script");
  script.async = true;
  script.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3747901131960450";
  script.setAttribute("crossorigin", "anonymous");
  document.head.appendChild(script);
  (adsbygoogle = window.adsbygoogle || []).push({});
}

// Initializes the consent banner.
function initConsentBanner() {
  const cmpAccept = document.getElementById("cmp-accept");
  const cmpManage = document.getElementById("cmp-manage");
  const cmpBanner = document.getElementById("cmp-banner");

  if (cmpAccept) {
    cmpAccept.addEventListener("click", () => {
      setCookie("user_consent", "accepted", 365);
      if (cmpBanner) cmpBanner.style.display = "none";
      loadAdSense();
      const adRevenueMessage = document.getElementById("ad-revenue-message");
      if (adRevenueMessage) {
        adRevenueMessage.style.display = "none";
      }
      console.log("Consent accepted: AdSense loaded and banner hidden.");
    });
  }

  if (cmpManage) {
    cmpManage.addEventListener("click", () => {
      alert("Here you can manage your cookie and ad preferences.");
    });
  }

  if (getCookie("user_consent") === "accepted") {
    if (cmpBanner) cmpBanner.style.display = "none";
    loadAdSense();
    const adRevenueMessage = document.getElementById("ad-revenue-message");
    if (adRevenueMessage) {
      adRevenueMessage.style.display = "none";
    }
    console.log("Consent already accepted: Banner hidden and AdSense loaded.");
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
