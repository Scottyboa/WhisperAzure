import { PromptManager } from "../promptManager.js";
import { PromptCloudBackup } from "./prompt-cloud-backup.js";

const promptSlotSelect = document.getElementById("promptSlot");
const promptSlotPicker = document.getElementById("promptSlotPicker");
const promptSlotTrigger = document.getElementById("promptSlotTrigger");
const promptSlotTriggerSlot = document.getElementById("promptSlotTriggerSlot");
const promptSlotTriggerName = document.getElementById("promptSlotTriggerName");
const promptSlotPopover = document.getElementById("promptSlotPopover");
const promptSlotList = document.getElementById("promptSlotList");
const customPromptTextarea = document.getElementById("customPrompt");
const clearPromptButton = document.getElementById("clearPromptButton");
const copyPromptButton = document.getElementById("copyPromptButton");
const promptSlotNameInput = document.getElementById("promptSlotName");

const promptProfileValue = document.getElementById("promptProfileValue");
const promptExportBtn = document.getElementById("promptExportBtn");
const promptImportBtn = document.getElementById("promptImportBtn");
const promptImportFile = document.getElementById("promptImportFile");
const promptBackupStatus = document.getElementById("promptBackupStatus");
const promptBackupModal = {
  backdrop: document.getElementById("promptBackupModalBackdrop"),
  card: document.getElementById("promptBackupModal"),
  title: document.getElementById("promptBackupModalTitle"),
  close: document.getElementById("promptBackupModalClose"),
  profile: document.getElementById("promptBackupModalProfile"),
  choiceStep: document.getElementById("promptBackupChoiceStep"),
  choiceNotice: document.getElementById("promptBackupChoiceNotice"),
  jsonChoice: document.getElementById("promptBackupJsonChoice"),
  jsonHelp: document.getElementById("promptBackupJsonHelp"),
  oneDriveChoice: document.getElementById("promptBackupOneDriveChoice"),
  oneDriveHelp: document.getElementById("promptBackupOneDriveHelp"),
  googleDriveChoice: document.getElementById("promptBackupGoogleDriveChoice"),
  googleDriveHelp: document.getElementById("promptBackupGoogleDriveHelp"),
  cloudStep: document.getElementById("promptBackupCloudStep"),
  cloudNotice: document.getElementById("promptBackupCloudNotice"),
  passwordLabel: document.getElementById("promptBackupPasswordLabel"),
  password: document.getElementById("promptBackupPassword"),
  passwordConfirmWrap: document.getElementById("promptBackupPasswordConfirmWrap"),
  passwordConfirmLabel: document.getElementById("promptBackupPasswordConfirmLabel"),
  passwordConfirm: document.getElementById("promptBackupPasswordConfirm"),
  cloudAction: document.getElementById("promptBackupCloudAction"),
  cloudBack: document.getElementById("promptBackupCloudBack"),
  status: document.getElementById("promptBackupModalStatus"),
};
const MINI_HUB_UI_REFRESH_EVENT = "mini-hub:prompt-ui-refresh";

const PROMPT_BACKUP_TEXT = {
  en: {
    close: "Close",
    exportTitle: "Export prompts",
    importTitle: "Import prompts",
    activeProfile: "Active prompt profile: {profile}",
    exportNotice: "Before exporting, make sure every prompt you want to back up is filled in. All 20 prompt slots and their labels in the active profile are included; empty slots are saved as empty.",
    importNotice: "Import replaces all 20 prompt slots and their labels in the active profile. A JSON or cloud backup must already have been created.",
    exportJson: "Export as JSON file",
    importJson: "Import from JSON file",
    exportJsonHelp: "Uses the existing method and saves a readable JSON file on this device. Store the file securely.",
    importJsonHelp: "Uses the existing method: choose a previously exported prompt JSON file from this device.",
    exportOneDrive: "Export to Microsoft OneDrive",
    importOneDrive: "Import from Microsoft OneDrive",
    exportOneDriveHelp: "Encrypts the active profile in this browser and saves one prompt backup in your private Microsoft OneDrive app folder. A new export replaces only the previous OneDrive prompt backup.",
    importOneDriveHelp: "Sign in with the same personal Microsoft account and enter the backup password. The prompts are downloaded from your private OneDrive app folder.",
    exportGoogleDrive: "Export to Google Drive",
    importGoogleDrive: "Import from Google Drive",
    exportGoogleDriveHelp: "Encrypts the active profile in this browser and saves one prompt backup in your private Google Drive app storage. A new export replaces only the previous Google Drive prompt backup.",
    importGoogleDriveHelp: "Sign in with the same Google account and enter the backup password. The prompts are downloaded from private Google Drive app storage.",
    exportCloudNotice: "Create an encryption password. It is never uploaded or stored by this app. If you forget it, the backup cannot be restored. This prompt backup is separate from your API-key backup and other files.",
    importCloudNotice: "Enter the password used when this prompt backup was exported. The password is used only in this browser and is never stored.",
    newPassword: "Encryption password (minimum 10 characters)",
    currentPassword: "Encryption password",
    repeatPassword: "Repeat password",
    saveOneDrive: "Save to OneDrive",
    saveGoogleDrive: "Save to Google Drive",
    importOneDriveAction: "Import from OneDrive",
    importGoogleDriveAction: "Import from Google Drive",
    back: "Back",
    loadingGoogle: "Loading Google…",
    saving: "Saving…",
    importing: "Importing…",
    minimumPassword: "Use an encryption password with at least 10 characters.",
    passwordsMismatch: "The two encryption passwords do not match.",
    passwordRequired: "Enter the encryption password for this backup.",
    confirmOneDriveExport: "Save this encrypted prompt backup to Microsoft OneDrive? The previous OneDrive prompt backup will be replaced.",
    confirmGoogleDriveExport: "Save this encrypted prompt backup to Google Drive? The previous Google Drive prompt backup will be replaced.",
    microsoftSignIn: "Waiting for Microsoft sign-in…",
    googleSignIn: "Waiting for Google sign-in…",
    encryptingAndSaving: "Encrypting and saving the prompt backup…",
    downloadingAndDecrypting: "Downloading and decrypting the prompt backup…",
    oneDriveSaved: "Encrypted prompt backup saved to Microsoft OneDrive. Any previous OneDrive prompt backup was replaced.",
    googleDriveSaved: "Encrypted prompt backup saved to Google Drive. Any previous Google Drive prompt backup was replaced.",
    oneDriveImported: "Prompts imported from Microsoft OneDrive into the active profile.",
    googleDriveImported: "Prompts imported from Google Drive into the active profile.",
    jsonExported: "Prompt JSON export completed.",
    jsonImported: "Prompts imported from the JSON file into the active profile.",
    exportFailed: "Prompt export failed: {error}",
    importFailed: "Prompt import failed: {error}",
    invalidJson: "Prompt import failed: the file is not valid JSON.",
    replaceActive: "Replace all 20 prompts and labels in the active profile \"{active}\"?",
    profileMismatch: "This backup was exported from profile \"{source}\", but the active profile is \"{active}\".\n\nImporting will replace the active profile; it will not switch profiles. Continue?",
  },
  no: {
    close: "Lukk",
    exportTitle: "Eksporter prompter",
    importTitle: "Importer prompter",
    activeProfile: "Aktiv promptprofil: {profile}",
    exportNotice: "Før eksport må alle promptene du ønsker å sikkerhetskopiere være ferdig utfylt. Alle 20 promptplassene og navnene deres i den aktive profilen tas med; tomme plasser lagres som tomme.",
    importNotice: "Import erstatter alle 20 promptplassene og navnene deres i den aktive profilen. En JSON- eller skysikkerhetskopi må være opprettet på forhånd.",
    exportJson: "Eksporter som JSON-fil",
    importJson: "Importer fra JSON-fil",
    exportJsonHelp: "Bruker den eksisterende metoden og lagrer en lesbar JSON-fil på denne enheten. Oppbevar filen sikkert.",
    importJsonHelp: "Bruker den eksisterende metoden: velg en tidligere eksportert prompt-JSON-fil fra denne enheten.",
    exportOneDrive: "Eksporter til Microsoft OneDrive",
    importOneDrive: "Importer fra Microsoft OneDrive",
    exportOneDriveHelp: "Krypterer den aktive profilen i nettleseren og lagrer én prompt-sikkerhetskopi i den private appmappen i Microsoft OneDrive. Ny eksport erstatter bare den forrige OneDrive-kopien av promptene.",
    importOneDriveHelp: "Logg inn med samme private Microsoft-konto og skriv inn passordet. Promptene hentes fra den private appmappen i OneDrive.",
    exportGoogleDrive: "Eksporter til Google Drive",
    importGoogleDrive: "Importer fra Google Drive",
    exportGoogleDriveHelp: "Krypterer den aktive profilen i nettleseren og lagrer én prompt-sikkerhetskopi i det private appområdet i Google Drive. Ny eksport erstatter bare den forrige Google Drive-kopien av promptene.",
    importGoogleDriveHelp: "Logg inn med samme Google-konto og skriv inn passordet. Promptene hentes fra det private appområdet i Google Drive.",
    exportCloudNotice: "Lag et krypteringspassord. Det blir aldri lastet opp eller lagret av appen. Hvis du glemmer det, kan sikkerhetskopien ikke gjenopprettes. Promptkopien er adskilt fra sikkerhetskopien av API-nøkler og andre filer.",
    importCloudNotice: "Skriv inn passordet som ble brukt da promptkopien ble eksportert. Passordet brukes bare i nettleseren og lagres aldri.",
    newPassword: "Krypteringspassord (minst 10 tegn)",
    currentPassword: "Krypteringspassord",
    repeatPassword: "Gjenta passord",
    saveOneDrive: "Lagre i OneDrive",
    saveGoogleDrive: "Lagre i Google Drive",
    importOneDriveAction: "Importer fra OneDrive",
    importGoogleDriveAction: "Importer fra Google Drive",
    back: "Tilbake",
    loadingGoogle: "Laster Google…",
    saving: "Lagrer…",
    importing: "Importerer…",
    minimumPassword: "Bruk et krypteringspassord med minst 10 tegn.",
    passwordsMismatch: "De to krypteringspassordene er ikke like.",
    passwordRequired: "Skriv inn krypteringspassordet for sikkerhetskopien.",
    confirmOneDriveExport: "Lagre denne krypterte promptkopien i Microsoft OneDrive? Den forrige OneDrive-kopien av promptene erstattes.",
    confirmGoogleDriveExport: "Lagre denne krypterte promptkopien i Google Drive? Den forrige Google Drive-kopien av promptene erstattes.",
    microsoftSignIn: "Venter på Microsoft-innlogging…",
    googleSignIn: "Venter på Google-innlogging…",
    encryptingAndSaving: "Krypterer og lagrer promptkopien…",
    downloadingAndDecrypting: "Laster ned og dekrypterer promptkopien…",
    oneDriveSaved: "Kryptert promptkopi lagret i Microsoft OneDrive. En eventuell tidligere OneDrive-kopi ble erstattet.",
    googleDriveSaved: "Kryptert promptkopi lagret i Google Drive. En eventuell tidligere Google Drive-kopi ble erstattet.",
    oneDriveImported: "Promptene ble importert fra Microsoft OneDrive til den aktive profilen.",
    googleDriveImported: "Promptene ble importert fra Google Drive til den aktive profilen.",
    jsonExported: "Eksport av prompt-JSON er fullført.",
    jsonImported: "Promptene ble importert fra JSON-filen til den aktive profilen.",
    exportFailed: "Eksport av prompter mislyktes: {error}",
    importFailed: "Import av prompter mislyktes: {error}",
    invalidJson: "Import av prompter mislyktes: filen inneholder ikke gyldig JSON.",
    replaceActive: "Erstatt alle 20 promptene og navnene i den aktive profilen \"{active}\"?",
    profileMismatch: "Denne sikkerhetskopien ble eksportert fra profilen \"{source}\", men den aktive profilen er \"{active}\".\n\nImporten erstatter den aktive profilen; den bytter ikke profil. Vil du fortsette?",
  },
};

function getPromptBackupText() {
  let language = "en";
  try { language = localStorage.getItem("siteLanguage") || "en"; } catch {}
  return PROMPT_BACKUP_TEXT[language] || PROMPT_BACKUP_TEXT.en;
}

function formatPromptBackupText(template, values = {}) {
  return String(template || "").replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? ""));
}

function getPromptOptionsForMiniPanel() {
  const slots = getAvailableSlots();
  const names = getSlotNames();

  return slots.map((slot) => {
    const explicit = getSlotDisplayName(slot, names);
    return {
      id: String(slot),
      label: explicit ? `${slot}. ${explicit}` : `${slot}.`,
      title: explicit || "",
    };
  });
}

function getCurrentPromptTitleForMiniPanel() {
  const slot = getCurrentSlot();
  const direct = String(promptSlotTriggerName?.textContent || "").trim();
  if (direct) return direct;

  const fallback = getSlotDisplayName(slot);
  if (fallback) return fallback;

  return "";
}

function syncMiniPanelPromptApi() {
  const app = (window.__app = window.__app || {});
  app.getMiniPanelPromptOptionsRich = () => getPromptOptionsForMiniPanel();
  app.getSelectedPromptSlotRich = () => getCurrentSlot();
  app.getCurrentPromptSlotTitleRich = () => getCurrentPromptTitleForMiniPanel();
}

function getAvailableSlots() {
  if (!promptSlotSelect) return [];
  return Array.from(promptSlotSelect.options)
    .map((opt) => String(opt.value || "").trim())
    .filter(Boolean);
}

function getCurrentSlot() {
  return String(promptSlotSelect?.value || getAvailableSlots()[0] || "1");
}

function getCurrentProfileId() {
  const profileId = (typeof PromptManager.getPromptProfileId === "function")
    ? String(PromptManager.getPromptProfileId() || "").trim()
    : "";
  return profileId || "";
}

function getEffectiveProfileId() {
  return getCurrentProfileId() || "default";
}

function getSlotNames() {
  if (typeof PromptManager.getSlotNames === "function") {
    return PromptManager.getSlotNames(getCurrentProfileId());
  }
  return {};
}

function getSlotDisplayName(slot, names = getSlotNames()) {
  const key = String(slot || "").trim();
  if (!key) return "";
  const explicit = (names && typeof names === "object") ? String(names[key] || "").trim() : "";
  if (explicit) return explicit;
  if (typeof PromptManager.getSlotDisplayName === "function") {
    return String(PromptManager.getSlotDisplayName(key, getCurrentProfileId()) || "").trim();
  }
  return "";
}

function emitMiniHubPromptUiRefresh(reason, extra = {}) {
  try {
    window.dispatchEvent(new CustomEvent(MINI_HUB_UI_REFRESH_EVENT, {
      detail: {
        reason: String(reason || "prompt-ui").trim() || "prompt-ui",
        profileId: getEffectiveProfileId(),
        slot: getCurrentSlot(),
        ...extra,
      },
    }));
  } catch {}
}

function persistCurrentSelectedSlot() {
  const slot = getCurrentSlot();
  if (typeof PromptManager.setSelectedPromptSlot === "function") {
    PromptManager.setSelectedPromptSlot(slot, getCurrentProfileId());
  }
  return slot;
}

function restorePersistedSelectedSlot() {
  if (!promptSlotSelect) return;
  const allowed = new Set(getAvailableSlots());
  let persisted = "";

  if (typeof PromptManager.getSelectedPromptSlot === "function") {
    persisted = String(PromptManager.getSelectedPromptSlot(getCurrentProfileId()) || "").trim();
  }

  if (!persisted || !allowed.has(persisted)) return;
  promptSlotSelect.value = persisted;
}

function reloadCurrentPromptSlot() {
  if (!promptSlotSelect || !customPromptTextarea) return;
  if (typeof PromptManager.loadPrompt === "function") {
    PromptManager.loadPrompt(promptSlotSelect.value);
  }
}

function setCurrentSlotValue(slot, { reload = true, emitChange = true } = {}) {
  if (!promptSlotSelect) return;
  const next = String(slot || "").trim();
  if (!next) return;

  const allowed = new Set(getAvailableSlots());
  if (!allowed.has(next)) return;

  if (promptSlotSelect.value !== next) {
    promptSlotSelect.value = next;
  }

  persistCurrentSelectedSlot();

  if (reload) {
    reloadCurrentPromptSlot();
    syncNameInputForCurrentSlot();
    renderPromptSlotTrigger();
    renderPromptSlotPopover();
    syncMiniPanelPromptApi();
    emitMiniHubPromptUiRefresh("slot-value-set", { slot: next, reload: true });
  }

  if (emitChange) {
    promptSlotSelect.dispatchEvent(new Event("change", { bubbles: true }));
  }
}

function renderPromptSlotTrigger() {
  if (!promptSlotTrigger || !promptSlotTriggerSlot || !promptSlotTriggerName) return;
  const slot = getCurrentSlot();
  promptSlotTriggerSlot.textContent = `${slot}.`;

  const name = getSlotDisplayName(slot);
  if (name) {
    promptSlotTriggerName.textContent = name;
    promptSlotTrigger.title = `Slot ${slot}: ${name}`;
    syncMiniPanelPromptApi();
    return;
  }

  promptSlotTriggerName.textContent = "";
  promptSlotTrigger.title = `Slot ${slot}`;
  syncMiniPanelPromptApi();
}

function clearDragOverState() {
  if (!promptSlotList) return;
  promptSlotList.querySelectorAll(".prompt-slot-item.is-drag-over").forEach((el) => {
    el.classList.remove("is-drag-over");
  });
  promptSlotList.querySelectorAll(".prompt-slot-item.is-dragging").forEach((el) => {
    el.classList.remove("is-dragging");
  });
}

let dragIntentSlot = "";
let dragSourceSlot = "";

function buildPromptSlotItem(slot, names, activeSlot) {
  const isActive = String(slot) === String(activeSlot);
  const row = document.createElement("div");
  row.className = `prompt-slot-item${isActive ? " is-active" : ""}`;
  row.dataset.slot = String(slot);
  row.setAttribute("role", "option");
  row.setAttribute("aria-selected", isActive ? "true" : "false");
  row.draggable = true;

  const selectButton = document.createElement("button");
  selectButton.type = "button";
  selectButton.className = "prompt-slot-item-button";
  selectButton.dataset.slot = String(slot);
  selectButton.setAttribute("aria-label", `Select slot ${slot}`);

  const title = document.createElement("span");
  title.className = "prompt-slot-item-title";

  const badge = document.createElement("span");
  badge.className = "prompt-slot-badge";
  badge.textContent = `${slot}.`;

  const name = document.createElement("span");
  name.className = "prompt-slot-item-name";
  name.textContent = getSlotDisplayName(slot, names);

  title.appendChild(badge);
  title.appendChild(name);
  selectButton.appendChild(title);

  const dragHandle = document.createElement("button");
  dragHandle.type = "button";
  dragHandle.className = "prompt-slot-drag-handle";
  dragHandle.dataset.slot = String(slot);
  dragHandle.dataset.slotDragHandle = "true";
  dragHandle.setAttribute("aria-label", `Drag slot ${slot} to reorder`);
  dragHandle.title = "Drag to reorder";
  dragHandle.textContent = "⋮⋮";

  dragHandle.addEventListener("pointerdown", () => {
    dragIntentSlot = String(slot);
  });

  dragHandle.addEventListener("keydown", (e) => {
    if (e.key === " " || e.key === "Enter") {
      dragIntentSlot = String(slot);
    }
  });

  row.appendChild(selectButton);
  row.appendChild(dragHandle);

  selectButton.addEventListener("click", () => {
    setCurrentSlotValue(slot);
    closePromptSlotPopover();
    promptSlotTrigger?.focus();
  });

  row.addEventListener("dragstart", (e) => {
    if (dragIntentSlot !== String(slot)) {
      e.preventDefault();
      return;
    }
    dragSourceSlot = String(slot);
    row.classList.add("is-dragging");
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", String(slot));
    }
  });

  row.addEventListener("dragover", (e) => {
    if (!dragSourceSlot || dragSourceSlot === String(slot)) return;
    e.preventDefault();
    row.classList.add("is-drag-over");
  });

  row.addEventListener("dragleave", () => {
    row.classList.remove("is-drag-over");
  });

  row.addEventListener("drop", async (e) => {
    e.preventDefault();
    row.classList.remove("is-drag-over");

    const from = dragSourceSlot;
    const to = String(slot);
    dragSourceSlot = "";
    dragIntentSlot = "";
    clearDragOverState();

    if (!from || !to || from === to) return;

    try {
      let finalSlot = null;
      if (typeof PromptManager.reorderPromptSlots === "function") {
        finalSlot = PromptManager.reorderPromptSlots(from, to);
      }

      if (!finalSlot) {
        console.warn("Prompt slot reorder was not applied.");
        return;
      }

      const current = getCurrentSlot();
      if (String(current) === String(from)) {
        promptSlotSelect.value = String(finalSlot);
      } else if (String(current) === String(to)) {
        promptSlotSelect.value = String(from);
      }

      persistCurrentSelectedSlot();
      reloadCurrentPromptSlot();
      syncNameInputForCurrentSlot();
      renderPromptSlotTrigger();
      renderPromptSlotPopover();
      syncMiniPanelPromptApi();
    } catch (err) {
      console.warn("Prompt slot reorder failed:", err);
    }
  });

  row.addEventListener("dragend", () => {
    dragSourceSlot = "";
    dragIntentSlot = "";
    clearDragOverState();
  });

  return row;
}

function renderPromptSlotPopover() {
  if (!promptSlotList) return;
  const names = getSlotNames();
  const activeSlot = getCurrentSlot();

  promptSlotList.innerHTML = "";
  getAvailableSlots().forEach((slot) => {
    promptSlotList.appendChild(buildPromptSlotItem(slot, names, activeSlot));
  });
  syncMiniPanelPromptApi();
}

function updatePromptSlotPopoverPlacement() {
  if (!promptSlotPopover || !promptSlotTrigger || promptSlotPopover.hidden) return;

  promptSlotPopover.classList.remove("opens-up");

  const triggerRect = promptSlotTrigger.getBoundingClientRect();
  const popoverRect = promptSlotPopover.getBoundingClientRect();
  const margin = 12;
  const spaceBelow = window.innerHeight - triggerRect.bottom - margin;
  const spaceAbove = triggerRect.top - margin;
  const needsUpward = spaceBelow < popoverRect.height && spaceAbove > spaceBelow;

  promptSlotPopover.classList.toggle("opens-up", needsUpward);
}

function openPromptSlotPopover() {
  if (!promptSlotPopover || !promptSlotPicker || !promptSlotTrigger) return;
  renderPromptSlotPopover();
  renderPromptSlotTrigger();
  promptSlotPopover.hidden = false;
  promptSlotPicker.classList.add("is-open");
  promptSlotTrigger.setAttribute("aria-expanded", "true");
  updatePromptSlotPopoverPlacement();
}

function closePromptSlotPopover() {
  if (!promptSlotPopover || !promptSlotPicker || !promptSlotTrigger) return;
  promptSlotPopover.hidden = true;
  promptSlotPicker.classList.remove("is-open");
  promptSlotTrigger.setAttribute("aria-expanded", "false");
  clearDragOverState();
  dragIntentSlot = "";
  dragSourceSlot = "";
}

function togglePromptSlotPopover() {
  if (!promptSlotPopover) return;
  if (promptSlotPopover.hidden) openPromptSlotPopover();
  else closePromptSlotPopover();
}

function syncNameInputForCurrentSlot() {
  if (!promptSlotSelect || !promptSlotNameInput) return;
  const slot = String(promptSlotSelect.value || "");
  promptSlotNameInput.value = getSlotDisplayName(slot);
}

function renderPromptProfileLabel() {
  if (!promptProfileValue) return;
  const pid = getCurrentProfileId();
  promptProfileValue.textContent = pid ? pid : "(not set)";
}

function ensurePromptProfileId({ allowChange = false } = {}) {
  const existing = getCurrentProfileId();
  if (existing && !allowChange) return existing;

  const currentHint = existing ? `Current: ${existing}\n\n` : "";
  const entered = window.prompt(
    `${currentHint}Enter a prompt profile ID.\n\n` +
    `This lets you keep a separate set of custom prompts on this device.\n` +
    `Example: David1`,
    existing || ""
  );

  if (entered == null) return existing;

  const next = String(entered || "").trim();
  if (!next) {
    window.alert("Profile ID cannot be blank.");
    return existing;
  }

  const active = (typeof PromptManager.setPromptProfileId === "function")
    ? PromptManager.setPromptProfileId(next)
    : next;

  if (promptSlotSelect) {
    const restored = (typeof PromptManager.getSelectedPromptSlot === "function")
      ? String(PromptManager.getSelectedPromptSlot(active) || "").trim()
      : "";
    const allowed = new Set(getAvailableSlots());
    promptSlotSelect.value = (restored && allowed.has(restored)) ? restored : (getAvailableSlots()[0] || "1");
  }

  reloadCurrentPromptSlot();
  persistCurrentSelectedSlot();
  renderPromptProfileLabel();
  renderPromptSlotTrigger();
  renderPromptSlotPopover();
  syncNameInputForCurrentSlot();
  syncMiniPanelPromptApi();

  return active;
}

const promptBackupModalState = {
  mode: "export",
  provider: "",
  busy: false,
};

function setPromptBackupStatus(message, isError = false, { modalOnly = false } = {}) {
  const color = isError ? "#b00020" : "#2e7d32";
  if (promptBackupModal.status) {
    promptBackupModal.status.textContent = String(message || "");
    promptBackupModal.status.style.color = color;
  }
  if (!modalOnly && promptBackupStatus) {
    promptBackupStatus.textContent = String(message || "");
    promptBackupStatus.style.color = color;
  }
}

function setPromptBackupBusy(busy, label = "") {
  promptBackupModalState.busy = Boolean(busy);
  if (promptBackupModal.cloudAction) {
    promptBackupModal.cloudAction.disabled = Boolean(busy);
    if (label) promptBackupModal.cloudAction.textContent = label;
  }
  if (promptBackupModal.cloudBack) promptBackupModal.cloudBack.disabled = Boolean(busy);
  if (promptBackupModal.close) promptBackupModal.close.disabled = Boolean(busy);
}

function clearPromptBackupPasswords() {
  if (promptBackupModal.password) promptBackupModal.password.value = "";
  if (promptBackupModal.passwordConfirm) promptBackupModal.passwordConfirm.value = "";
}

function updatePromptBackupChoiceText() {
  const text = getPromptBackupText();
  const isExport = promptBackupModalState.mode === "export";
  const profileId = getCurrentProfileId();

  if (promptBackupModal.title) {
    promptBackupModal.title.textContent = isExport ? text.exportTitle : text.importTitle;
  }
  if (promptBackupModal.close) promptBackupModal.close.setAttribute("aria-label", text.close);
  if (promptBackupModal.profile) {
    promptBackupModal.profile.textContent = formatPromptBackupText(text.activeProfile, {
      profile: profileId,
    });
  }
  if (promptBackupModal.choiceNotice) {
    promptBackupModal.choiceNotice.textContent = isExport ? text.exportNotice : text.importNotice;
  }
  if (promptBackupModal.jsonChoice) {
    promptBackupModal.jsonChoice.textContent = isExport ? text.exportJson : text.importJson;
  }
  if (promptBackupModal.jsonHelp) {
    promptBackupModal.jsonHelp.textContent = isExport ? text.exportJsonHelp : text.importJsonHelp;
  }
  if (promptBackupModal.oneDriveChoice) {
    promptBackupModal.oneDriveChoice.textContent = isExport ? text.exportOneDrive : text.importOneDrive;
  }
  if (promptBackupModal.oneDriveHelp) {
    promptBackupModal.oneDriveHelp.textContent = isExport
      ? text.exportOneDriveHelp
      : text.importOneDriveHelp;
  }
  if (promptBackupModal.googleDriveChoice) {
    promptBackupModal.googleDriveChoice.textContent = isExport
      ? text.exportGoogleDrive
      : text.importGoogleDrive;
  }
  if (promptBackupModal.googleDriveHelp) {
    promptBackupModal.googleDriveHelp.textContent = isExport
      ? text.exportGoogleDriveHelp
      : text.importGoogleDriveHelp;
  }
  if (promptBackupModal.cloudBack) promptBackupModal.cloudBack.textContent = text.back;
}

function showPromptBackupChoiceStep() {
  promptBackupModalState.provider = "";
  setPromptBackupBusy(false);
  clearPromptBackupPasswords();
  updatePromptBackupChoiceText();
  if (promptBackupModal.choiceStep) promptBackupModal.choiceStep.style.display = "";
  if (promptBackupModal.cloudStep) promptBackupModal.cloudStep.style.display = "none";
  setPromptBackupStatus("", false, { modalOnly: true });
  promptBackupModal.jsonChoice?.focus();
}

function getPromptBackupActionLabel() {
  const text = getPromptBackupText();
  const isExport = promptBackupModalState.mode === "export";
  if (promptBackupModalState.provider === "oneDrive") {
    return isExport ? text.saveOneDrive : text.importOneDriveAction;
  }
  return isExport ? text.saveGoogleDrive : text.importGoogleDriveAction;
}

async function showPromptBackupCloudStep(provider) {
  promptBackupModalState.provider = provider;
  const text = getPromptBackupText();
  const isExport = promptBackupModalState.mode === "export";

  if (promptBackupModal.choiceStep) promptBackupModal.choiceStep.style.display = "none";
  if (promptBackupModal.cloudStep) promptBackupModal.cloudStep.style.display = "";
  if (promptBackupModal.cloudNotice) {
    promptBackupModal.cloudNotice.textContent = isExport
      ? text.exportCloudNotice
      : text.importCloudNotice;
  }
  if (promptBackupModal.passwordLabel) {
    promptBackupModal.passwordLabel.textContent = isExport ? text.newPassword : text.currentPassword;
  }
  if (promptBackupModal.passwordConfirmLabel) {
    promptBackupModal.passwordConfirmLabel.textContent = text.repeatPassword;
  }
  if (promptBackupModal.passwordConfirmWrap) {
    promptBackupModal.passwordConfirmWrap.style.display = isExport ? "" : "none";
  }
  if (promptBackupModal.password) {
    promptBackupModal.password.setAttribute("autocomplete", isExport ? "new-password" : "current-password");
  }
  if (promptBackupModal.cloudAction) {
    promptBackupModal.cloudAction.textContent = getPromptBackupActionLabel();
  }
  clearPromptBackupPasswords();
  setPromptBackupStatus("", false, { modalOnly: true });

  if (provider === "googleDrive") {
    setPromptBackupBusy(true, text.loadingGoogle);
    try {
      await PromptCloudBackup.prepareGoogleSignIn();
      setPromptBackupBusy(false, getPromptBackupActionLabel());
      promptBackupModal.password?.focus();
    } catch (error) {
      setPromptBackupBusy(false, getPromptBackupActionLabel());
      setPromptBackupStatus(error?.message || "Google sign-in could not be loaded.", true, {
        modalOnly: true,
      });
    }
    return;
  }

  promptBackupModal.password?.focus();
}

function openPromptBackupModal(mode) {
  if (!promptBackupModal.backdrop) return;
  promptBackupModalState.mode = mode === "import" ? "import" : "export";
  promptBackupModalState.busy = false;
  setPromptBackupStatus("");
  showPromptBackupChoiceStep();
  promptBackupModal.backdrop.classList.add("active");
  promptBackupModal.backdrop.setAttribute("aria-hidden", "false");
  promptBackupModal.jsonChoice?.focus();
}

function closePromptBackupModal({ force = false } = {}) {
  if (!promptBackupModal.backdrop || (promptBackupModalState.busy && !force)) return;
  clearPromptBackupPasswords();
  promptBackupModal.backdrop.classList.remove("active");
  promptBackupModal.backdrop.setAttribute("aria-hidden", "true");
  if (promptBackupModal.status) promptBackupModal.status.textContent = "";
  const returnFocus = promptBackupModalState.mode === "export" ? promptExportBtn : promptImportBtn;
  returnFocus?.focus();
}

function buildPromptImportConfirmation(bundle) {
  const text = getPromptBackupText();
  const validated = PromptManager.validatePromptImportBundle(bundle);
  const active = getCurrentProfileId();
  if (validated.profileId && validated.profileId !== active) {
    return formatPromptBackupText(text.profileMismatch, {
      source: validated.profileId,
      active,
    });
  }
  return formatPromptBackupText(text.replaceActive, { active });
}

function importPromptBundleWithConfirmation(bundle) {
  const confirmMessage = buildPromptImportConfirmation(bundle);
  return PromptManager.importPromptsFromBundle(bundle, { confirmMessage });
}

function refreshPromptUiAfterImport() {
  reloadCurrentPromptSlot();
  renderPromptSlotTrigger();
  renderPromptSlotPopover();
  syncNameInputForCurrentSlot();
  syncMiniPanelPromptApi();
  emitMiniHubPromptUiRefresh("prompt-slots-imported", { imported: true });
}

async function runPromptCloudAction() {
  if (promptBackupModalState.busy) return;
  const text = getPromptBackupText();
  const isExport = promptBackupModalState.mode === "export";
  const provider = promptBackupModalState.provider;
  const password = String(promptBackupModal.password?.value || "");
  const confirmation = String(promptBackupModal.passwordConfirm?.value || "");

  if (isExport && password.length < 10) {
    setPromptBackupStatus(text.minimumPassword, true, { modalOnly: true });
    promptBackupModal.password?.focus();
    return;
  }
  if (isExport && password !== confirmation) {
    setPromptBackupStatus(text.passwordsMismatch, true, { modalOnly: true });
    promptBackupModal.passwordConfirm?.focus();
    return;
  }
  if (!isExport && !password) {
    setPromptBackupStatus(text.passwordRequired, true, { modalOnly: true });
    promptBackupModal.password?.focus();
    return;
  }

  if (isExport) {
    const confirmText = provider === "oneDrive"
      ? text.confirmOneDriveExport
      : text.confirmGoogleDriveExport;
    if (!window.confirm(confirmText)) return;
  }

  let succeeded = false;
  const busyLabel = isExport ? text.saving : text.importing;
  setPromptBackupBusy(true, busyLabel);
  setPromptBackupStatus("", false, { modalOnly: true });

  try {
    const updateProgress = (statusKey) => {
      setPromptBackupStatus(text[statusKey] || statusKey, false, { modalOnly: true });
    };

    if (isExport) {
      const bundle = PromptManager.buildPromptExportBundle();
      if (provider === "oneDrive") {
        await PromptCloudBackup.saveToOneDrive(bundle, password, updateProgress);
      } else {
        await PromptCloudBackup.saveToGoogleDrive(bundle, password, updateProgress);
      }
      succeeded = true;
    } else {
      const bundle = provider === "oneDrive"
        ? await PromptCloudBackup.loadFromOneDrive(password, updateProgress)
        : await PromptCloudBackup.loadFromGoogleDrive(password, updateProgress);
      const imported = importPromptBundleWithConfirmation(bundle);
      if (!imported) return;
      refreshPromptUiAfterImport();
      succeeded = true;
    }
  } catch (error) {
    const template = isExport ? text.exportFailed : text.importFailed;
    setPromptBackupStatus(formatPromptBackupText(template, {
      error: error?.message || "Unknown error",
    }), true, { modalOnly: true });
  } finally {
    clearPromptBackupPasswords();
    setPromptBackupBusy(false, getPromptBackupActionLabel());
  }

  if (!succeeded) return;

  const successMessage = isExport
    ? (provider === "oneDrive" ? text.oneDriveSaved : text.googleDriveSaved)
    : (provider === "oneDrive" ? text.oneDriveImported : text.googleDriveImported);
  closePromptBackupModal({ force: true });
  setPromptBackupStatus(successMessage, false);
}

restorePersistedSelectedSlot();
renderPromptProfileLabel();
renderPromptSlotTrigger();
renderPromptSlotPopover();
syncNameInputForCurrentSlot();
closePromptSlotPopover();

if (promptSlotTrigger) {
  promptSlotTrigger.addEventListener("click", () => {
    togglePromptSlotPopover();
  });
}

document.addEventListener("pointerdown", (e) => {
  if (!promptSlotPicker || !promptSlotPopover || promptSlotPopover.hidden) return;
  if (promptSlotPicker.contains(e.target)) return;
  closePromptSlotPopover();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && promptSlotPopover && !promptSlotPopover.hidden) {
    closePromptSlotPopover();
    promptSlotTrigger?.focus();
  }
});

window.addEventListener("resize", () => {
  if (promptSlotPopover && !promptSlotPopover.hidden) {
    updatePromptSlotPopoverPlacement();
  }
});

window.addEventListener("scroll", () => {
  if (promptSlotPopover && !promptSlotPopover.hidden) {
    updatePromptSlotPopoverPlacement();
  }
}, true);

if (promptSlotSelect && customPromptTextarea) {
  let isLoadingPrompt = false;

  function loadCurrentSlot() {
    persistCurrentSelectedSlot();
    isLoadingPrompt = true;
    PromptManager.loadPrompt(promptSlotSelect.value);
    isLoadingPrompt = false;
    syncNameInputForCurrentSlot();
    renderPromptSlotTrigger();
    renderPromptSlotPopover();
    syncMiniPanelPromptApi();
  }

  loadCurrentSlot();

  customPromptTextarea.addEventListener("input", () => {
    if (isLoadingPrompt) return;
    const value = window.__getVisibleCustomPromptValue
      ? window.__getVisibleCustomPromptValue()
      : customPromptTextarea.value;
    PromptManager.savePrompt(promptSlotSelect.value, value);
    customPromptTextarea.style.height = "auto";
    customPromptTextarea.style.height = `${customPromptTextarea.scrollHeight}px`;
  });

  promptSlotSelect.addEventListener("change", loadCurrentSlot);
}

if (promptSlotNameInput && promptSlotSelect) {
  const commitName = () => {
    const slot = String(promptSlotSelect.value || "");
    const name = String(promptSlotNameInput.value || "").trim();
    if (typeof PromptManager.setSlotDisplayName === "function") {
      PromptManager.setSlotDisplayName(slot, name, getCurrentProfileId());
    }
    renderPromptSlotTrigger();
    renderPromptSlotPopover();
    syncMiniPanelPromptApi();
  };

  promptSlotNameInput.addEventListener("blur", commitName);
  promptSlotNameInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      promptSlotNameInput.blur();
    }
  });
}

if (clearPromptButton && promptSlotSelect && customPromptTextarea) {
  clearPromptButton.addEventListener("click", () => {
    customPromptTextarea.value = "";
    PromptManager.savePrompt(promptSlotSelect.value, "");
    customPromptTextarea.style.height = "auto";
    customPromptTextarea.style.height = `${customPromptTextarea.scrollHeight}px`;
  });
}

if (copyPromptButton && customPromptTextarea) {
  const originalLabel = copyPromptButton.textContent;
  copyPromptButton.addEventListener("click", async () => {
    const text = window.__getVisibleCustomPromptValue
      ? window.__getVisibleCustomPromptValue()
      : customPromptTextarea.value;

    try {
      await navigator.clipboard.writeText(text || "");
      copyPromptButton.textContent = "Copied";
      setTimeout(() => { copyPromptButton.textContent = originalLabel; }, 1200);
    } catch (err) {
      try {
        customPromptTextarea.focus();
        customPromptTextarea.select();
        document.execCommand("copy");
        copyPromptButton.textContent = "Copied";
        setTimeout(() => { copyPromptButton.textContent = originalLabel; }, 1200);
      } catch (_) {
        console.warn("Copy failed", err);
      } finally {
        try { window.getSelection()?.removeAllRanges?.(); } catch (_) {}
      }
    }
  });
}

if (promptProfileValue) {
  promptProfileValue.style.cursor = "pointer";
  promptProfileValue.title = "Click to set/change prompt profile";
  promptProfileValue.addEventListener("click", () => {
    ensurePromptProfileId({ allowChange: true });
  });
}

if (promptExportBtn) {
  promptExportBtn.addEventListener("click", () => {
    const pid = ensurePromptProfileId();
    if (!pid) return;
    openPromptBackupModal("export");
  });
}

if (promptImportBtn && promptImportFile) {
  promptImportBtn.addEventListener("click", () => {
    const pid = ensurePromptProfileId();
    if (!pid) return;
    openPromptBackupModal("import");
  });

  promptImportFile.addEventListener("change", async () => {
    const text = getPromptBackupText();
    const file = promptImportFile.files && promptImportFile.files[0];
    if (!file) return;
    try {
      const raw = await file.text();
      const bundle = JSON.parse(raw);
      const imported = importPromptBundleWithConfirmation(bundle);
      if (!imported) return;
      refreshPromptUiAfterImport();
      setPromptBackupStatus(text.jsonImported, false);
    } catch (error) {
      const message = error instanceof SyntaxError
        ? text.invalidJson
        : formatPromptBackupText(text.importFailed, {
            error: error?.message || "Unknown error",
          });
      setPromptBackupStatus(message, true);
    }
  });
}

promptBackupModal.close?.addEventListener("click", () => closePromptBackupModal());
promptBackupModal.cloudBack?.addEventListener("click", showPromptBackupChoiceStep);
promptBackupModal.oneDriveChoice?.addEventListener("click", () => {
  showPromptBackupCloudStep("oneDrive");
});
promptBackupModal.googleDriveChoice?.addEventListener("click", () => {
  showPromptBackupCloudStep("googleDrive");
});
promptBackupModal.cloudAction?.addEventListener("click", runPromptCloudAction);

promptBackupModal.jsonChoice?.addEventListener("click", async () => {
  const text = getPromptBackupText();
  if (promptBackupModalState.mode === "import") {
    closePromptBackupModal({ force: true });
    promptImportFile.value = "";
    promptImportFile.click();
    return;
  }

  closePromptBackupModal({ force: true });
  try {
    const exported = await PromptManager.exportPromptsToFile();
    if (exported) setPromptBackupStatus(text.jsonExported, false);
  } catch (error) {
    if (error?.name === "AbortError") return;
    setPromptBackupStatus(formatPromptBackupText(text.exportFailed, {
      error: error?.message || "Unknown error",
    }), true);
  }
});

promptBackupModal.backdrop?.addEventListener("click", (event) => {
  if (event.target === promptBackupModal.backdrop) closePromptBackupModal();
});

[promptBackupModal.password, promptBackupModal.passwordConfirm].forEach((input) => {
  input?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      runPromptCloudAction();
    }
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && promptBackupModal.backdrop?.classList.contains("active")) {
    closePromptBackupModal();
  }
});

window.addEventListener("transcribe-language-updated", () => {
  if (promptBackupModal.backdrop?.classList.contains("active")) {
    updatePromptBackupChoiceText();
    if (promptBackupModalState.provider && promptBackupModal.cloudStep?.style.display !== "none") {
      showPromptBackupCloudStep(promptBackupModalState.provider);
    }
  }
});

window.addEventListener("prompt-profile-changed", (event) => {
  const detail = event?.detail || {};
  const nextProfileId = String(detail.profileId || detail.effectiveProfileId || "").trim();
  const currentProfileId = getEffectiveProfileId();
  if (nextProfileId && nextProfileId !== currentProfileId) return;

  restorePersistedSelectedSlot();
  renderPromptProfileLabel();
  reloadCurrentPromptSlot();
  syncNameInputForCurrentSlot();
  renderPromptSlotTrigger();
  renderPromptSlotPopover();
  syncMiniPanelPromptApi();
  emitMiniHubPromptUiRefresh("prompt-profile-changed", {
    profileId: currentProfileId,
  });
});

window.addEventListener("prompt-slot-selection-changed", (event) => {
  if (!promptSlotSelect) return;
  const detail = event?.detail || {};
  const eventProfileId = String(detail.profileId || "").trim();
  if (eventProfileId && eventProfileId !== getEffectiveProfileId()) return;

  const slot = String(detail.slot || "").trim();
  const allowed = new Set(getAvailableSlots());
  if (!slot || !allowed.has(slot) || promptSlotSelect.value === slot) return;

  promptSlotSelect.value = slot;
  reloadCurrentPromptSlot();
  syncNameInputForCurrentSlot();
  renderPromptSlotTrigger();
  renderPromptSlotPopover();
  syncMiniPanelPromptApi();
  emitMiniHubPromptUiRefresh("prompt-slot-selection-changed", { slot });
});

window.addEventListener("prompt-slot-names-changed", (event) => {
  const detail = event?.detail || {};
  const eventProfileId = String(detail.profileId || "").trim();
  if (eventProfileId && eventProfileId !== getEffectiveProfileId()) return;

  syncNameInputForCurrentSlot();
  renderPromptSlotTrigger();
  renderPromptSlotPopover();
  syncMiniPanelPromptApi();
  emitMiniHubPromptUiRefresh("prompt-slot-names-changed");
});

window.addEventListener("prompt-slots-imported", (event) => {
  const detail = event?.detail || {};
  const eventProfileId = String(detail.profileId || "").trim();
  if (eventProfileId && eventProfileId !== getEffectiveProfileId()) return;

  reloadCurrentPromptSlot();
  syncNameInputForCurrentSlot();
  renderPromptSlotTrigger();
  renderPromptSlotPopover();
  syncMiniPanelPromptApi();
  emitMiniHubPromptUiRefresh("prompt-slots-imported");
});

window.addEventListener("prompt-slots-reordered", (event) => {
  const detail = event?.detail || {};
  const eventProfileId = String(detail.profileId || "").trim();
  if (eventProfileId && eventProfileId !== getEffectiveProfileId()) return;

  syncNameInputForCurrentSlot();
  renderPromptSlotTrigger();
  renderPromptSlotPopover();
  syncMiniPanelPromptApi();
  emitMiniHubPromptUiRefresh("prompt-slots-reordered");
});

syncMiniPanelPromptApi();
