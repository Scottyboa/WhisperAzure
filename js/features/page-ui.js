const ADS_ENABLED_DEFAULT = false;
const AUTO_COPY_STORAGE_KEY = "auto_copy_mode";
const AUTO_COPY_DOWNLOAD_HREF = "div/autocopy.zip";

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

function getApp() {
  const existing = window.__app || {};
  window.__app = existing;
  return existing;
}

function readSession(key, fallback = "") {
  try {
    const value = sessionStorage.getItem(key);
    return value == null ? fallback : value;
  } catch (_) {
    return fallback;
  }
}

function writeSession(key, value) {
  try {
    sessionStorage.setItem(key, String(value ?? ""));
  } catch (_) {}
}

function isAutoCopyExtensionAvailable() {
  return !!getApp().isAutoCopyExtensionAvailable?.();
}

function setupAutoCopyModeUi() {
  const selectEl = document.getElementById("autoCopyModeSelect");
  const labelEl = document.getElementById("autoCopyModeLabel");
  const tooltipEl = document.getElementById("autoCopyModeTooltipText");
  const tooltipContainer = document.getElementById("autoCopyModeTooltipContainer");
  const langSelectTranscribe = document.getElementById("lang-select-transcribe");
  if (!selectEl) return;

  const syncCopyLabel = () => {
    const isNorwegian = getCurrentTranscribeLanguage() === "no";
    if (labelEl) {
      labelEl.textContent = isNorwegian ? "Auto-copy" : "Auto-copy";
    }
    if (tooltipEl) {
      tooltipEl.innerHTML = isNorwegian
        ? `<strong>Krever Chrome-utvidelse</strong><br/>
For å bruke Auto-copy må du først laste ned og installere Chrome-utvidelsen:
<a href="${AUTO_COPY_DOWNLOAD_HREF}" download>autocopy.zip</a><br/><br/>
Pakk ut filen, les README-filen inni mappen, åpne chrome://extensions, slå på Developer mode, velg Load unpacked og oppdater siden etterpå.<br/><br/>
Når utvidelsen er installert, kan ferdige transkripsjoner eller notater kopieres automatisk avhengig av valgt modus.<br/><br/>
Når du slår Auto-generer PÅ, byttes Auto-copy automatisk til Notat.
Når du slår Auto-generer AV, byttes Auto-copy automatisk til Transkripsjon.<br/><br/>
Du kan fortsatt endre Auto-copy manuelt etterpå. Det valget beholdes helt til du bytter Auto-generer igjen.<br/><br/>
Hvis varsler er tillatt i Chrome/Windows, kan du også få et varsel når kopieringen er fullført.`
        : `<strong>Chrome extension required</strong><br/>
To use Auto-copy, first download and install the Chrome extension:
<a href="${AUTO_COPY_DOWNLOAD_HREF}" download>autocopy.zip</a><br/><br/>
Unzip the file, read the README inside the folder, open chrome://extensions, turn on Developer mode, choose Load unpacked, and refresh this page afterwards.<br/><br/>
After installation, finished transcripts or notes can be copied automatically depending on the selected mode.<br/><br/>
When you turn Auto-generate ON, Auto-copy automatically switches to Note.
When you turn Auto-generate OFF, Auto-copy automatically switches to Transcript.<br/><br/>
You can still change Auto-copy manually afterward. That manual choice stays active until Auto-generate is toggled again.<br/><br/>
If notifications are allowed in Chrome/Windows, you may also get a notification when copying is complete.`;
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

  const storedRaw = readSession(AUTO_COPY_STORAGE_KEY, "");
  const stored = normalizeAutoCopyMode(storedRaw);
  if (storedRaw !== stored) {
    writeSession(AUTO_COPY_STORAGE_KEY, stored);
  }
  selectEl.value = stored;
  selectEl.addEventListener("change", () => {
    const next = normalizeAutoCopyMode(selectEl.value);
    selectEl.value = next;
    writeSession(AUTO_COPY_STORAGE_KEY, next);
  });

  const syncAvailabilityUi = () => {
    const available = isAutoCopyExtensionAvailable();
    const storedMode = normalizeAutoCopyMode(readSession(AUTO_COPY_STORAGE_KEY, "off"));
    const appliedMode = available ? storedMode : "off";

    selectEl.disabled = !available;
    selectEl.value = appliedMode;
    selectEl.title = available
      ? ""
      : "Install and activate the Chrome extension to enable Auto-copy.";

    if (labelEl) {
      labelEl.style.opacity = available ? "1" : "0.6";
    }
    if (tooltipContainer) {
      tooltipContainer.style.opacity = "1";
    }
  };

  langSelectTranscribe?.addEventListener("change", syncCopyLabel);
  window.addEventListener("transcribe-language-updated", syncCopyLabel);
  window.addEventListener("app:state-changed", syncAvailabilityUi);
  syncCopyLabel();
  syncAvailabilityUi();
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

function setupSupplementaryDateToggleCopy() {
  const labelEl = document.getElementById("supplementaryDateToggleLabel");
  const tooltipEl = document.getElementById("supplementaryDateTooltipText");
  const langSelectTranscribe = document.getElementById("lang-select-transcribe");
  if (!labelEl || !tooltipEl) return;

  const syncSupplementaryDateCopy = () => {
    const isNorwegian = getCurrentTranscribeLanguage() === "no";

    labelEl.textContent = isNorwegian ? "Dato" : "Date";
    tooltipEl.innerHTML = isNorwegian
      ? "<strong>Når PÅ:</strong><br/>Holder linjen <strong>\"Dagens dato er DD.MM.YYYY\"</strong> øverst i Tilleggsinformasjon og legger den inn igjen etter oppdatering av siden.<br/><br/><strong>Når AV:</strong><br/>Fjerner denne datolinjen fra Tilleggsinformasjon."
      : "<strong>When ON:</strong><br/>Keeps the line <strong>\"Dagens dato er DD.MM.YYYY\"</strong> at the top of Supplementary information and restores it after refresh.<br/><br/><strong>When OFF:</strong><br/>Removes that date line from Supplementary information.";
  };

  langSelectTranscribe?.addEventListener("change", syncSupplementaryDateCopy);
  window.addEventListener("transcribe-language-updated", syncSupplementaryDateCopy);
  syncSupplementaryDateCopy();
}

function initPageUi() {
  setupAdsAndGridHeight();
  setupAutoGenerateTooltip();
  setupAutoCopyModeUi();
  setupPromptInclusionToggle();
  setupNoteAutoClearCopy();
  setupSupplementaryDateToggleCopy();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initPageUi, { once: true });
} else {
  initPageUi();
}
