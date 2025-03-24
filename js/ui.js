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

// === Guide Overlay (Index Page) ===

// Initializes the API key guide overlay and the enter button event listener.
function initGuideOverlay() {
  const overlay = document.getElementById("apiKeyGuideOverlay");
  const openGuideButton = document.getElementById("openGuideButton");
  const closeGuideBtn = document.getElementById("closeGuideBtn");

  if (openGuideButton && overlay) {
    openGuideButton.addEventListener("click", () => {
      // Toggle the overlay display
      if (overlay.style.display === "flex") {
        overlay.style.display = "none";
        console.log("Guide overlay closed via toggle.");
      } else {
        overlay.style.display = "flex";
        overlay.style.flexDirection = "column";
        overlay.style.alignItems = "center";
        console.log("Guide overlay opened.");
      }
    });
  } else {
    console.error("Guide overlay or openGuideButton element missing.");
  }

  // Attach event listener for the close (exit) button.
  if (closeGuideBtn && overlay) {
    closeGuideBtn.addEventListener("click", () => {
      overlay.style.display = "none";
      console.log("Guide overlay closed via exit button.");
    });
  } else {
    console.error("Close guide button element missing.");
  }
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

export { initConsentBanner, initGuideOverlay };
