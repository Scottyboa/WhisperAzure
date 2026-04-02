const ADS_ENABLED_DEFAULT = false;
const AUTO_COPY_STORAGE_KEY = "auto_copy_mode";

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

function normalizeAutoCopyMode(value) {
  const mode = String(value || "").toLowerCase();
  if (mode === "both") return "note";
  return ["off", "transcript", "note"].includes(mode) ? mode : "off";
}

function setupAutoCopyModeUi() {
  const selectEl = document.getElementById("autoCopyModeSelect");
  const labelEl = document.getElementById("autoCopyModeLabel");
  const tooltipEl = document.getElementById("autoCopyModeTooltipText");
  const langSelectTranscribe = document.getElementById("lang-select-transcribe");
  if (!selectEl) return;

  const syncCopyLabel = () => {
    const isNorwegian = getCurrentTranscribeLanguage() === "no";
    if (labelEl) {
      labelEl.textContent = isNorwegian ? "Auto-copy" : "Auto-copy";
    }
    if (tooltipEl) {
      tooltipEl.innerHTML = isNorwegian
        ? "<strong>Av:</strong><br/>Ingenting kopieres automatisk.<br/><br/><strong>Transkripsjon:</strong><br/>Den ferdige transkripsjonen kopieres automatisk.<br/><br/><strong>Notat:</strong><br/>Det ferdige genererte notatet kopieres automatisk."
        : "<strong>Off:</strong><br/>Nothing is copied automatically.<br/><br/><strong>Transcript:</strong><br/>The finished transcript is copied automatically.<br/><br/><strong>Note:</strong><br/>The finished generated note is copied automatically.";
    }

    const options = Array.from(selectEl.options || []);
    options.forEach((option) => {
      const value = String(option.value || "").toLowerCase();
      if (isNorwegian) {
        if (value === "off") option.textContent = "Av";
        else if (value === "transcript") option.textContent = "Transkripsjon";
        else if (value === "note") option.textContent = "Notat";
      } else {
        if (value === "off") option.textContent = "Off";
        else if (value === "transcript") option.textContent = "Transcript";
        else if (value === "note") option.textContent = "Note";
      }
    });
  };

  const stored = normalizeAutoCopyMode(localStorage.getItem(AUTO_COPY_STORAGE_KEY));
  if ((localStorage.getItem(AUTO_COPY_STORAGE_KEY) || "") !== stored) {
    localStorage.setItem(AUTO_COPY_STORAGE_KEY, stored);
  }
  selectEl.value = stored;
  selectEl.addEventListener("change", () => {
    const next = normalizeAutoCopyMode(selectEl.value);
    selectEl.value = next;
    localStorage.setItem(AUTO_COPY_STORAGE_KEY, next);
  });

  langSelectTranscribe?.addEventListener("change", syncCopyLabel);
  window.addEventListener("transcribe-language-updated", syncCopyLabel);
  syncCopyLabel();
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
  setupAutoCopyModeUi();
  setupPromptInclusionToggle();
  setupNoteAutoClearCopy();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initPageUi, { once: true });
} else {
  initPageUi();
}
