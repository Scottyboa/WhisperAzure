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

// === Info Modals Initialization (Index Page) ===

// Initializes all modal overlays and their corresponding info buttons.
function initInfoModals() {
  // Guide Modal
  const guideOverlay = document.getElementById("apiKeyGuideOverlay");
  const openGuideButton = document.getElementById("openGuideButton");
  const closeGuideBtn = document.getElementById("closeGuideBtn");
  if (openGuideButton && guideOverlay) {
    openGuideButton.addEventListener("click", () => {
      guideOverlay.style.display = "flex";
      guideOverlay.style.flexDirection = "column";
      guideOverlay.style.alignItems = "center";
      console.log("Guide overlay opened.");
    });
  } else {
    console.error("Guide overlay or openGuideButton element missing.");
  }
  if (closeGuideBtn && guideOverlay) {
    closeGuideBtn.addEventListener("click", () => {
      guideOverlay.style.display = "none";
      console.log("Guide overlay closed.");
    });
  } else {
    console.error("Close guide button element missing.");
  }

  // Price Modal
  const priceOverlay = document.getElementById("priceModalOverlay");
  const openPriceButton = document.getElementById("openPriceButton");
  const closePriceBtn = document.getElementById("closePriceModalButton");
  if (openPriceButton && priceOverlay) {
    openPriceButton.addEventListener("click", () => {
      priceOverlay.style.display = "flex";
      priceOverlay.style.flexDirection = "column";
      priceOverlay.style.alignItems = "center";
      console.log("Price modal opened.");
    });
  } else {
    console.error("Price modal or openPriceButton element missing.");
  }
  if (closePriceBtn && priceOverlay) {
    closePriceBtn.addEventListener("click", () => {
      priceOverlay.style.display = "none";
      console.log("Price modal closed.");
    });
  } else {
    console.error("Close price button element missing.");
  }

  // Security Modal
  const securityOverlay = document.getElementById("securityModalOverlay");
  const openSecurityButton = document.getElementById("openSecurityButton");
  const closeSecurityBtn = document.getElementById("closeSecurityModalButton");
  if (openSecurityButton && securityOverlay) {
    openSecurityButton.addEventListener("click", () => {
      securityOverlay.style.display = "flex";
      securityOverlay.style.flexDirection = "column";
      securityOverlay.style.alignItems = "center";
      console.log("Security modal opened.");
    });
  } else {
    console.error("Security modal or openSecurityButton element missing.");
  }
  if (closeSecurityBtn && securityOverlay) {
    closeSecurityBtn.addEventListener("click", () => {
      securityOverlay.style.display = "none";
      console.log("Security modal closed.");
    });
  } else {
    console.error("Close security button element missing.");
  }

  // About Modal
  const aboutOverlay = document.getElementById("aboutModalOverlay");
  const openAboutButton = document.getElementById("openAboutButton");
  const closeAboutBtn = document.getElementById("closeAboutModalButton");
  if (openAboutButton && aboutOverlay) {
    openAboutButton.addEventListener("click", () => {
      aboutOverlay.style.display = "flex";
      aboutOverlay.style.flexDirection = "column";
      aboutOverlay.style.alignItems = "center";
      console.log("About modal opened.");
    });
  } else {
    console.error("About modal or openAboutButton element missing.");
  }
  if (closeAboutBtn && aboutOverlay) {
    closeAboutBtn.addEventListener("click", () => {
      aboutOverlay.style.display = "none";
      console.log("About modal closed.");
    });
  } else {
    console.error("Close about button element missing.");
  }
}

export { initConsentBanner, initInfoModals };
