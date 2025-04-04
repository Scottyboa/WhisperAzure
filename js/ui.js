// ui.js

// Dynamically loads the AdSense script.
// Google’s own CMP (consent management) will then trigger as needed in regulated regions.
function loadAdSenseAds() {
  const adScript = document.createElement('script');
  adScript.async = true;
  adScript.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3747901131960450";
  adScript.crossOrigin = "anonymous";
  document.head.appendChild(adScript);
}

// Inserts an AdSense ad unit into a specified container.
// containerId: the ID of the HTML element where the ad will be injected.
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

// Initializes ad units in the right sidebar by inserting two 300x250 ad units.
// "right-ad-unit-1" will use the ad slot "4927329947" (top ad unit),
// and "right-ad-unit-2" is a placeholder for the second ad slot (replace "YOUR_AD_SLOT_2" when available).
function initAdUnits() {
  // Use a short delay to ensure the AdSense script has loaded.
  setTimeout(() => {
    insertAdSenseAd("right-ad-unit-1", "4927329947");
    insertAdSenseAd("right-ad-unit-2", "YOUR_AD_SLOT_2");
  }, 500);
}

// Initializes the "Enter Transcription Tool" button.
// When clicked, this function loads the AdSense script (and its associated Google CMP),
// initializes the right sidebar ad units, and then navigates the user to transcribe.html.
function initEnterTranscriptionTool() {
  const enterBtn = document.getElementById("enterTranscriptionBtn");
  if (enterBtn) {
    enterBtn.addEventListener("click", () => {
      // Load AdSense (and consequently, Google’s consent form may appear for regulated regions)
      loadAdSenseAds();
      // Insert the ad units into the right sidebar
      initAdUnits();
      // Redirect to transcribe.html after a brief delay to allow ad script to load
      setTimeout(() => {
        window.location.href = "transcribe.html";
      }, 1000);
    });
  }
}

// Initializes info modals (unchanged).
function initInfoModals() {
  console.log("initInfoModals: Accordion UI is enabled; modal initialization is disabled.");
}

export { initEnterTranscriptionTool, initInfoModals };
