import { loadLanguageModule } from './languageLoader.js';

// For the index page
export async function initIndexLanguage() {
  let currentLang = localStorage.getItem("siteLanguage") || "en";
  const langSelect = document.getElementById("lang-select");
  if (!langSelect) return;
  langSelect.value = currentLang;
  
  // Load the language module and update the index page UI
  const mod = await loadLanguageModule(currentLang);
  console.log("Loaded index language module:", mod);
  const indexTranslations = mod?.indexTranslations || mod?.default?.indexTranslations;
  if (!indexTranslations) {
    console.error("Index translations not found for language:", currentLang);
    return;
  }
  updateIndexUI(indexTranslations);
  
  // Listen for language changes
  langSelect.addEventListener("change", async function() {
    currentLang = this.value;
    localStorage.setItem("siteLanguage", currentLang);
    const mod = await loadLanguageModule(currentLang);
    console.log("Loaded index language module on change:", mod);
    const indexTranslations = mod?.indexTranslations || mod?.default?.indexTranslations;
    if (!indexTranslations) {
      console.error("Index translations not found for language:", currentLang);
      return;
    }
    updateIndexUI(indexTranslations);
  });
}

// Update the index page elements with the translations
function updateIndexUI(trans) {
  document.getElementById("page-title").textContent = trans.pageTitle;
  document.getElementById("header-title").textContent = trans.headerTitle;
  document.getElementById("header-subtitle").textContent = trans.headerSubtitle;
  document.getElementById("start-text").textContent = trans.startText;
  document.getElementById("apiKeyInput").placeholder = trans.apiPlaceholder;
  document.getElementById("enterTranscriptionBtn").textContent = trans.enterButton;
  document.getElementById("openGuideButton").textContent = trans.guideButton;
  document.getElementById("openSecurityButton").textContent = trans.securityButton;
  document.getElementById("openAboutButton").textContent = trans.aboutButton;
  document.getElementById("ad-revenue-message").textContent = trans.adRevenueMessage;
  
  // Update API Guide Modal content
  const guideHeading = document.getElementById("guide-heading");
  if (guideHeading) {
    guideHeading.textContent = trans.guideModalHeading;
  }
  const guideContent = document.getElementById("guide-p1");
  if (guideContent) {
    guideContent.innerHTML = trans.guideModalText;
    // Automatically modify all links in the guide to open in a new tab
    guideContent.querySelectorAll("a").forEach(anchor => {
      anchor.setAttribute("target", "_blank");
      anchor.setAttribute("rel", "noopener noreferrer");
    });
  }
  
  // Update Price Modal content
  const priceModalHeading = document.getElementById("priceModalHeading");
  if (priceModalHeading) {
    priceModalHeading.textContent = trans.priceModalHeading;
  }
  const priceModalText = document.getElementById("priceModalText");
  if (priceModalText) {
    priceModalText.innerHTML = trans.priceModalText;
  }
  
  // Update Security Modal content
  const securityModalHeading = document.getElementById("securityModalHeading");
  if (securityModalHeading) {
    securityModalHeading.textContent = trans.securityModalHeading;
  }
  const securityModalText = document.getElementById("securityModalText");
  if (securityModalText) {
    securityModalText.innerHTML = trans.securityModalText;
  }
  
  // Update About Modal content
  const aboutModalHeading = document.getElementById("aboutModalHeading");
  if (aboutModalHeading) {
    aboutModalHeading.textContent = trans.aboutModalHeading;
  }
  const aboutModalText = document.getElementById("aboutModalText");
  if (aboutModalText) {
    aboutModalText.innerHTML = trans.aboutModalText;
  }
}

// For the transcribe page
export async function initTranscribeLanguage() {
  let currentLang = localStorage.getItem("siteLanguage") || "en";
  const langSelect = document.getElementById("lang-select-transcribe");
  if (!langSelect) return;
  langSelect.value = currentLang;
  
  // Load and update UI for the current language
  const mod = await loadLanguageModule(currentLang);
  console.log("Loaded transcribe language module:", mod);
  const transcribeTranslations = mod?.transcribeTranslations || mod?.default?.transcribeTranslations;
  if (!transcribeTranslations) {
    console.error("Transcribe translations not found for language:", currentLang);
    return;
  }
  updateTranscribeUI(transcribeTranslations);
  
  // Listen for language changes using the "change" event
  langSelect.addEventListener("change", async function() {
    currentLang = this.value;
    localStorage.setItem("siteLanguage", currentLang);
    const mod = await loadLanguageModule(currentLang);
    console.log("Loaded transcribe language module on change:", mod);
    const transcribeTranslations = mod?.transcribeTranslations || mod?.default?.transcribeTranslations;
    if (!transcribeTranslations) {
      console.error("Transcribe translations not found for language:", currentLang);
      return;
    }
    updateTranscribeUI(transcribeTranslations);
  });
  
  // Also listen for "click" events to force an update even if the same language is re-selected
  langSelect.addEventListener("click", async function() {
    const mod = await loadLanguageModule(this.value);
    console.log("Loaded transcribe language module on click:", mod);
    const transcribeTranslations = mod?.transcribeTranslations || mod?.default?.transcribeTranslations;
    if (!transcribeTranslations) {
      console.error("Transcribe translations not found for language:", this.value);
      return;
    }
    updateTranscribeUI(transcribeTranslations);
  });
}

// Update the transcribe page elements with the translations
function updateTranscribeUI(trans) {
  document.getElementById("page-title-transcribe").textContent = trans.pageTitle;
  document.getElementById("openaiUsageLink").textContent = trans.openaiUsageLinkText;
  document.getElementById("btnFunctions").textContent = trans.btnFunctions;
  document.getElementById("btnGuide").textContent = trans.btnGuide;
  document.getElementById("recordingAreaTitle").textContent = trans.recordingAreaTitle;
  document.getElementById("recordTimer").textContent = trans.recordTimer;
  document.getElementById("transcribeTimer").textContent = trans.transcribeTimer;
  document.getElementById("transcription").placeholder = trans.transcriptionPlaceholder;
  document.getElementById("startButton").textContent = trans.startButton;
  document.getElementById("stopButton").textContent = trans.stopButton;
  document.getElementById("pauseResumeButton").textContent = trans.pauseButton;
  document.getElementById("statusMessage").textContent = trans.statusMessage;
  document.getElementById("noteGenerationTitle").textContent = trans.noteGenerationTitle;
  document.getElementById("generateNoteButton").textContent = trans.generateNoteButton;
  document.getElementById("noteTimer").textContent = trans.noteTimer;
  document.getElementById("generatedNote").placeholder = trans.generatedNotePlaceholder;
  document.getElementById("customPromptTitle").textContent = trans.customPromptTitle;
  document.getElementById("promptSlotLabel").textContent = trans.promptSlotLabel;
  document.getElementById("customPrompt").placeholder = trans.customPromptPlaceholder;
  document.getElementById("adUnit").textContent = trans.adUnitText;
  document.getElementById("guideHeading").textContent = trans.guideHeading;
  document.getElementById("guideText").innerHTML = trans.guideText;
}
