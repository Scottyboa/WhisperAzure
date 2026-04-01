const ADS_ENABLED_DEFAULT = false;
const AUTO_COPY_STORAGE_KEY = "autoCopyFinishedNote";

function getCurrentTranscribeLanguage() {
  const select = document.getElementById("lang-select-transcribe");
  return (select && select.value) || localStorage.getItem("siteLanguage") || "en";
}

function setGridHeight() {
  const grid = document.querySelector(".grid-container");
  if (!grid) return;
  const height = window.visualViewport ? window.visualViewport.height : window.innerHeight;
  grid.style.height = `${height}px`;
}

function applyAdsEnabled(enabled) {
  const grid = document.querySelector(".grid-container");
  if (!grid) return;
  if (enabled) grid.classList.remove("ads-disabled");
  else grid.classList.add("ads-disabled");
}

function setupAdsAndGridHeight() {
  window.setAdsEnabled = function setAdsEnabled(enabled) {
    applyAdsEnabled(Boolean(enabled));
  };

  applyAdsEnabled(ADS_ENABLED_DEFAULT);

  window.addEventListener("load", () => {
    setGridHeight();
    const interval = setInterval(setGridHeight, 200);
    setTimeout(() => clearInterval(interval), 2000);
  });

  window.addEventListener("resize", setGridHeight);
  window.visualViewport?.addEventListener?.("resize", setGridHeight);
}

function setupAutoGenerateTooltip() {
  const labelEl = document.getElementById("autoGenerateToggleLabel");
  const tooltipEl = document.getElementById("autoGenerateTooltipText");
  const langSelectTranscribe = document.getElementById("lang-select-transcribe");
  if (!labelEl || !tooltipEl) return;

  const syncAutoGenerateCopy = () => {
    const isNorwegian = getCurrentTranscribeLanguage() === "no";
    labelEl.textContent = isNorwegian ? "Auto-generer" : "Auto-generate";
    tooltipEl.innerHTML = isNorwegian
      ? "<strong>Når PÅ:</strong><br/>Et notat genereres automatisk når transkripsjonen er ferdig.<br/><br/><strong>Når AV:</strong><br/>Du genererer notater manuelt med Generate Note-knappen."
      : "<strong>When ON:</strong><br/>A note is generated automatically when transcription finishes.<br/><br/><strong>When OFF:</strong><br/>You generate notes manually using the Generate Note button.";
  };

  langSelectTranscribe?.addEventListener("change", syncAutoGenerateCopy);
  window.addEventListener("transcribe-language-updated", syncAutoGenerateCopy);
  syncAutoGenerateCopy();
}

function setupAutoCopyToggle() {
  const toggle = document.getElementById("autoCopyFinishedNoteToggle");
  const labelEl = document.getElementById("autoCopyFinishedNoteToggleLabel");
  const tooltipEl = document.getElementById("autoCopyFinishedNoteTooltipText");
  const langSelectTranscribe = document.getElementById("lang-select-transcribe");
  if (!toggle) return;

  const syncCopyLabel = () => {
    const isNorwegian = getCurrentTranscribeLanguage() === "no";
    if (labelEl) labelEl.textContent = "Auto-copy";
    if (tooltipEl) {
      tooltipEl.innerHTML = isNorwegian
        ? 'Kopierer ferdige notater automatisk til utklippstavlen slik at du kan lime dem inn med Ctrl + V, og viser et skrivebordsvarsel når kopieringen er fullført.<br/><br/>For å bruke denne funksjonen, last ned <a href="./div/autocopy.zip" target="_blank" rel="noopener noreferrer" style="color:#2563eb; text-decoration:underline;">Chrome-utvidelsen her</a>.<br/><br/>Pakk ut filen og les README-tekstfilen inni for installasjonsinstruksjoner.<br/><br/>Hvis du ikke ser varselet i Windows, kontroller at varsler er aktivert både i Windows og i Chrome. I Windows går du til Innstillinger → System → Varsler og sjekker at Chrome er slått på. Kontroller også at Ikke forstyrr / Fokusassistent er slått av eller tillater Chrome.'
        : 'Automatically copies finished notes to your clipboard so you can paste with Ctrl + V, and shows a desktop notification when copying is complete.<br/><br/>To use this feature, download the <a href="./div/autocopy.zip" target="_blank" rel="noopener noreferrer" style="color:#2563eb; text-decoration:underline;">Chrome extension here</a>.<br/><br/>Unzip the file and read the README text file inside for installation instructions.<br/><br/>If you do not see the notification pop-up in Windows, check that notifications are enabled both in Windows and in Chrome. In Windows, go to Settings → System → Notifications and make sure Chrome is turned on. Also check that Do Not Disturb / Focus Assist is turned off or allows Chrome.';
    }
  };

  const stored = localStorage.getItem(AUTO_COPY_STORAGE_KEY);
  toggle.checked = stored === "true";

  const persist = () => {
    localStorage.setItem(AUTO_COPY_STORAGE_KEY, toggle.checked ? "true" : "false");
  };

  toggle.addEventListener("change", persist);
  langSelectTranscribe?.addEventListener("change", syncCopyLabel);
  window.addEventListener("transcribe-language-updated", syncCopyLabel);

  syncCopyLabel();
  persist();
}



function setupPromptInclusionToggle() {
  const promptTextarea = document.getElementById("customPrompt");
  const includePromptToggle = document.getElementById("includePromptToggle");
  const includePromptToggleLabel = document.getElementById("includePromptToggleLabel");
  const includePromptToggleTooltip = document.getElementById("includePromptToggleTooltip");

  if (!promptTextarea || !includePromptToggle) return;

  const nativeValueDescriptor = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value");
  const nativeGetValue = nativeValueDescriptor?.get;
  const nativeSetValue = nativeValueDescriptor?.set;

  if (nativeGetValue && nativeSetValue && !promptTextarea.__promptMaskInstalled) {
    Object.defineProperty(promptTextarea, "value", {
      configurable: true,
      enumerable: true,
      get() {
        const actualValue = nativeGetValue.call(this);
        return includePromptToggle.checked ? actualValue : "";
      },
      set(nextValue) {
        nativeSetValue.call(this, nextValue ?? "");
      }
    });

    promptTextarea.__promptMaskInstalled = true;
    promptTextarea.__getVisiblePromptValue = () => nativeGetValue.call(promptTextarea);
    promptTextarea.__setVisiblePromptValue = (nextValue) => nativeSetValue.call(promptTextarea, nextValue ?? "");

    window.__getVisibleCustomPromptValue = () => nativeGetValue.call(promptTextarea);
    window.__setVisibleCustomPromptValue = (nextValue) => nativeSetValue.call(promptTextarea, nextValue ?? "");
  }

  const syncPromptToggleLabel = () => {
    const isNorwegian = getCurrentTranscribeLanguage() === "no";

    if (includePromptToggleLabel) {
      includePromptToggleLabel.textContent = isNorwegian ? "Bruk prompt" : "Use prompt";
    }

    if (includePromptToggleTooltip) {
      includePromptToggleTooltip.textContent = isNorwegian
        ? "Når denne er aktivert, blir den egendefinerte prompten brukt i notatgenerering. Slå den av for å generere notater uten prompt/instruksjon."
        : "When enabled, your custom prompt is included in note generation. Turn it off to generate notes without using the prompt text.";
    }
  };

  const langSelectTranscribe = document.getElementById("lang-select-transcribe");
  langSelectTranscribe?.addEventListener("change", syncPromptToggleLabel);
  window.addEventListener("transcribe-language-updated", syncPromptToggleLabel);
  syncPromptToggleLabel();
}

function setupNoteAutoClearCopy() {
  const labelEl = document.getElementById("autoClearNoteToggleLabel");
  const tooltipEl = document.getElementById("autoClearNoteTooltipText");
  const langSelectTranscribe = document.getElementById("lang-select-transcribe");
  if (!labelEl || !tooltipEl) return;

  const syncNoteAutoClearCopy = () => {
    const isNorwegian = getCurrentTranscribeLanguage() === "no";
    labelEl.textContent = "Auto clear";
    tooltipEl.innerHTML = isNorwegian
      ? "<strong>Når PÅ:</strong><br/>Notatfeltet tømmes når du starter et nytt opptak.<br/><br/><strong>Når AV:</strong><br/>Å starte et nytt opptak endrer ikke notatfeltet."
      : "<strong>When ON:</strong><br/>The generated note field is cleared when you start a new recording.<br/><br/><strong>When OFF:</strong><br/>Starting a new recording does not change the generated note field.";
  };

  langSelectTranscribe?.addEventListener("change", syncNoteAutoClearCopy);
  window.addEventListener("transcribe-language-updated", syncNoteAutoClearCopy);
  syncNoteAutoClearCopy();
}

function initPageUi() {
  setupAdsAndGridHeight();
  setupAutoGenerateTooltip();
  setupAutoCopyToggle();
  setupPromptInclusionToggle();
  setupNoteAutoClearCopy();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initPageUi, { once: true });
} else {
  initPageUi();
}
