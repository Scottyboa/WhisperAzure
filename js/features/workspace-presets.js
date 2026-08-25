import { PromptManager } from "../promptManager.js";
import { PromptCloudBackup } from "./prompt-cloud-backup.js";
import { CloudBackupSession } from "./cloud-backup-session.js";

const PRESET_SCHEMA = "whisper.workspace-presets";
const PRESET_VERSION = 1;
const DEFINITIONS_KEY = "whisper_workspace_presets_v1";
const ACTIVE_KEY = "whisper_workspace_active_preset_v1";
const PRIMARY_RUNTIME_KEY = "whisper_workspace_primary_runtime_v1";
const PANEL_MODE_KEY = "whisper_workspace_mini_panel_mode";
const DRAFT_KEY = "whisper_workspace_draft_v1";
const MAX_PRESETS = 12;

const VALUE_IDS = [
  "transcribeProvider", "sonioxSpeakerLabels", "sonioxRegion",
  "noteProvider", "noteProviderMode", "openaiModel",
  "bedrockModel", "requestyModel", "gpt5Reasoning",
  "requestyNanoReasoning", "promptSlot",
  "autoCopyModeSelect", "secondaryProvider", "secondaryMode",
  "secondaryOpenaiModel", "secondaryOpenaiReasoning",
  "secondaryBedrockModel", "secondaryRequestyModel", "secondaryNanoReasoning",
  "secondaryPromptSelect",
];

const CHECKBOX_IDS = [
  "autoClearSupplementaryToggle", "supplementaryDateToggle",
  "autoClearNoteToggle", "autoGenerateToggle", "includePromptToggle",
  "secondarySourceDateToggle", "secondaryAutoTransferToggle",
  "secondaryClearOnGenerateToggle", "redactorAutocopyToggle",
];

const DRAFT_FIELD_IDS = [
  "transcription", "supplementaryInfo", "generatedNote",
  "secondarySourceText", "secondaryGeneratedNote", "redactorTerms",
  "redactorOcrRawOutput", "redactorBirthdateInput",
];

const DELEGATED_APP_ACTIONS = [
  "startRecording", "stopRecording", "togglePauseResume", "pauseResumeRecording",
  "abortRecording", "triggerGenerateNote", "abortNoteGeneration",
  "copyGeneratedNote", "copyTranscription", "setAutoGenerateEnabled",
  "getAutoGenerateEnabled", "setAutoCopyMode", "getAutoCopyMode",
  "setUsePromptEnabled", "getUsePromptEnabled", "switchNoteProvider",
  "switchTranscribeProvider", "setSonioxSpeakerLabels", "setOpenAiModel",
  "setBedrockModel", "setRequestyModel",
  "setNoteProviderMode", "setSelectedPromptSlot", "selectPromptSlot",
  "getMiniPanelState", "getMiniPanelPromptOptions", "getSelectedPromptSlot",
  "getCurrentPromptSlotTitle",
];

const TEXT = {
  en: {
    presets: "Workspace set:", help: "Workspace set help", import: "Import", export: "Export",
    add: "Add workspace", move: "Move workspace", clone: "Clone workspace", close: "Close workspace", defaultName: "Workspace {n}",
    cloneName: "{name} (copy)", cloneLoading: "Wait for this workspace to finish loading before cloning it.",
    namePrompt: "Workspace name", max: "You can have up to 12 workspaces open.",
    atLeastOne: "At least one workspace must remain open.",
    busyClose: "Stop or abort the active recording, transcription, or generation before closing this workspace.",
    closeConfirm: "Close \"{name}\"? Its transcript, notes and other workspace text will be removed from this tab session.",
    importBusy: "Stop or abort all active recordings and generations before importing a workspace set.",
    helpHtml: `<strong>Workspaces are separate work areas in this browser tab.</strong><br/>Each workspace keeps its own text, prompts, models, settings, history and active processes. Its name automatically follows the selected prompt slot name. Switching workspaces does not stop recording or generation.<br/><br/>Use + to add a workspace and × to close one.<br/><br/><strong>Import/export:</strong> A workspace set backup saves the workspace setup, selected prompts, models and relevant settings. Transcripts, supplementary information, notes, history, audio, API keys and other patient information are never exported. Cloud backups are encrypted. A downloaded JSON file is readable and should be stored securely.`,
    exportTitle: "Export workspace set", importTitle: "Import workspace set",
    jsonExport: "Export as JSON file", jsonImport: "Import from JSON file",
    oneDriveExport: "Export to Microsoft OneDrive", oneDriveImport: "Import from Microsoft OneDrive",
    googleExport: "Export to Google Drive", googleImport: "Import from Google Drive",
    exportNotice: "Exports every workspace currently shown in the workspace set, including selected prompts, models and workflow settings. Window text, history, recordings, API keys and patient information are not included.",
    importNotice: "Choose a previously exported workspace set. Imported workspaces start with empty text fields and empty history.",
    password: "Encryption password", repeat: "Repeat password",
    passwordMin: "Use a password with at least 10 characters.", mismatch: "The passwords do not match.",
    passwordRequired: "Enter the backup password.", save: "Save", back: "Back", cancel: "Cancel",
    unlockedPassword: "Your unlocked Cloud Backup Password for {provider} will be used.",
    legacyPassword: "This older Workspace Set uses a different password. Enter its previous password to import it.",
    migrateLegacy: "This Workspace Set used an older password. Update it now to use your current Cloud Backup Password?",
    cloudRestored: "Selected cloud backups were loaded.",
    addMode: "Add workspaces", replaceMode: "Replace workspace set",
    preview: "{n} workspaces found: {names}",
    replaceWarning: "Replace the current workspace set? Existing workspace text and history will be discarded. Active jobs must already be stopped.",
    microsoftSignIn: "Waiting for Microsoft sign-in…", googleSignIn: "Waiting for Google sign-in…",
    encryptingAndSaving: "Encrypting and saving workspace set backup…",
    downloadingAndDecrypting: "Downloading and decrypting workspace set backup…",
    savedJson: "Workspace set JSON export completed.", savedOneDrive: "Encrypted workspace set saved to Microsoft OneDrive.",
    savedGoogle: "Encrypted workspace set saved to Google Drive.", imported: "Workspace set imported.",
    failed: "Workspace set backup failed: {error}", invalid: "The selected file is not a valid workspace set backup.",
    recording: "Recording", paused: "Paused", transcribing: "Transcribing", generating: "Generating", complete: "Completed",
  },
  no: {
    presets: "Workspace set:", help: "Hjelp om Workspace set", import: "Importer", export: "Eksporter",
    add: "Legg til Workspace", move: "Flytt Workspace", clone: "Klon Workspace", close: "Lukk Workspace", defaultName: "Workspace {n}",
    cloneName: "{name} (kopi)", cloneLoading: "Vent til dette Workspace-et er ferdig lastet før du kloner det.",
    namePrompt: "Navn på Workspace", max: "Du kan ha opptil 12 åpne Workspaces.",
    atLeastOne: "Minst ett Workspace må være åpent.",
    busyClose: "Stopp eller avbryt aktivt opptak, transkribering eller generering før Workspace-et lukkes.",
    closeConfirm: "Lukk \"{name}\"? Transkripsjon, notater, historikk og annen Workspace-tekst fjernes fra denne faneøkten.",
    importBusy: "Stopp eller avbryt alle aktive opptak og genereringer før du importerer et Workspace set.",
    helpHtml: `<strong>Workspaces er separate arbeidsområder i denne nettleserfanen.</strong><br/>Hvert Workspace beholder egne tekster, prompts, modeller, innstillinger, historikk og aktive prosesser. Navnet følger automatisk navnet på valgt prompt-slot. Bytte mellom Workspaces stopper ikke opptak eller generering.<br/><br/>Bruk + for å legge til et Workspace og × for å lukke det.<br/><br/><strong>Import/eksport:</strong> En Workspace set-backup lagrer Workspace-oppsettet, valgte prompts, modeller og relevante innstillinger. Transkripsjoner, supplerende informasjon, notater, historikk, lyd, API-nøkler og andre pasientopplysninger eksporteres aldri. Skybackup krypteres. En nedlastet JSON-fil er lesbar og bør oppbevares sikkert.`,
    exportTitle: "Eksporter Workspace set", importTitle: "Importer Workspace set",
    jsonExport: "Eksporter som JSON-fil", jsonImport: "Importer fra JSON-fil",
    oneDriveExport: "Eksporter til Microsoft OneDrive", oneDriveImport: "Importer fra Microsoft OneDrive",
    googleExport: "Eksporter til Google Drive", googleImport: "Importer fra Google Drive",
    exportNotice: "Eksporterer alle Workspaces i Workspace set-et, inkludert valgte prompts, modeller og workflow-innstillinger. Tekst i vinduene, historikk, opptak, API-nøkler og pasientopplysninger tas ikke med.",
    importNotice: "Velg et tidligere eksportert Workspace set. Importerte Workspaces starter med tomme tekstfelt og tom historikk.",
    password: "Krypteringspassord", repeat: "Gjenta passord",
    passwordMin: "Bruk et passord med minst 10 tegn.", mismatch: "Passordene er ikke like.",
    passwordRequired: "Skriv inn passordet til backupen.", save: "Lagre", back: "Tilbake", cancel: "Avbryt",
    unlockedPassword: "Det opplåste Cloud Backup-passordet for {provider} vil bli brukt.",
    legacyPassword: "Dette eldre Workspace set-et bruker et annet passord. Skriv inn det tidligere passordet for å importere det.",
    migrateLegacy: "Dette Workspace set-et brukte et eldre passord. Vil du oppdatere det nå til ditt nåværende Cloud Backup-passord?",
    cloudRestored: "Valgte skysikkerhetskopier ble lastet inn.",
    addMode: "Legg til Workspaces", replaceMode: "Erstatt Workspace set",
    preview: "{n} Workspaces funnet: {names}",
    replaceWarning: "Erstatt nåværende Workspace set? Eksisterende Workspace-tekst og historikk forkastes. Aktive jobber må allerede være stoppet.",
    microsoftSignIn: "Venter på Microsoft-innlogging…", googleSignIn: "Venter på Google-innlogging…",
    encryptingAndSaving: "Krypterer og lagrer Workspace set-backup…",
    downloadingAndDecrypting: "Laster ned og dekrypterer Workspace set-backup…",
    savedJson: "Eksport av Workspace set-JSON er fullført.", savedOneDrive: "Kryptert Workspace set lagret i Microsoft OneDrive.",
    savedGoogle: "Kryptert Workspace set lagret i Google Drive.", imported: "Workspace set-et ble importert.",
    failed: "Workspace set-backup mislyktes: {error}", invalid: "Den valgte filen er ikke en gyldig Workspace set-backup.",
    recording: "Tar opp", paused: "Pauset", transcribing: "Transkriberer", generating: "Genererer", complete: "Ferdig",
  },
};

function lang() {
  const selected = document.getElementById("lang-select-transcribe")?.value;
  let stored = "";
  try { stored = localStorage.getItem("siteLanguage") || ""; } catch {}
  return selected || stored || "en";
}

function t() { return TEXT[lang()] || TEXT.en; }
function fmt(value, data = {}) {
  return String(value || "").replace(/\{(\w+)\}/g, (_, key) => String(data[key] ?? ""));
}
function uid() {
  return crypto.randomUUID?.() || `preset-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
function safeName(value, fallback = "Workspace") {
  return String(value || "").trim().slice(0, 120) || fallback;
}

function normalizeWorkspaceName(value, index) {
  const fallback = `Workspace ${index + 1}`;
  const name = safeName(value, fallback);
  return /^Preset\s+\d+$/i.test(name) ? fallback : name;
}
function dispatchChange(win, element) {
  if (!element) return;
  try { element.dispatchEvent(new win.Event("change", { bubbles: true })); } catch {}
}
function dispatchInput(win, element) {
  if (!element) return;
  try { element.dispatchEvent(new win.Event("input", { bubbles: true })); } catch {}
}

function ensureSecondaryNoteModuleReady(win, doc) {
  const pane = doc?.getElementById("secondaryNotePane");
  const toggleButton = doc?.getElementById("toggleSecondaryNoteButton");
  if (!pane || !toggleButton) return true;
  if (win?.__secondaryNoteModuleReady === true) return true;

  if (typeof win?.__initSecondaryNoteModule === "function") {
    try {
      return win.__initSecondaryNoteModule() === true || win.__secondaryNoteModuleReady === true;
    } catch (error) {
      console.warn("[workspace-presets] Secondary Note initialization failed.", error);
      return false;
    }
  }

  // Compatibility fallback if this file is briefly mixed with an older cached
  // secondary-note.js that does not expose an explicit readiness handshake.
  return doc?.readyState === "complete";
}

function captureConfig(doc) {
  const values = {};
  const checks = {};
  VALUE_IDS.forEach((id) => {
    const el = doc.getElementById(id);
    if (!el || !("value" in el)) return;
    values[id] = id === "autoCopyModeSelect"
      ? String(el.dataset.workspaceConfiguredMode || el.value || "off")
      : String(el.value || "");
  });
  CHECKBOX_IDS.forEach((id) => {
    const el = doc.getElementById(id);
    if (el?.type === "checkbox") checks[id] = Boolean(el.checked);
  });
  return {
    values,
    checks,
    panes: {
      redactorOpen: !Boolean(doc.getElementById("redactorPane")?.hidden),
      secondaryNoteOpen: !Boolean(doc.getElementById("secondaryNotePane")?.hidden),
    },
  };
}

function normalizeAutoCopyMode(value) {
  const mode = String(value || "").trim().toLowerCase();
  if (mode === "both") return "note";
  return ["off", "transcript", "note"].includes(mode) ? mode : "off";
}

async function applyConfiguredAutoCopyMode(win, doc, values) {
  if (!Object.prototype.hasOwnProperty.call(values, "autoCopyModeSelect")) return;
  const el = doc.getElementById("autoCopyModeSelect");
  if (!el || !("value" in el)) return;

  const desired = normalizeAutoCopyMode(values.autoCopyModeSelect);
  el.dataset.workspaceConfiguredMode = desired;

  let available = Boolean(win.__app?.isAutoCopyExtensionAvailable?.());
  if (!available && typeof win.__app?.pingAutoCopyExtension === "function") {
    try { available = Boolean(await win.__app.pingAutoCopyExtension()); } catch {}
  }

  el.value = available ? desired : "off";
  dispatchChange(win, el);
  // A synthetic change while the extension is unavailable must not erase the
  // imported per-workspace preference merely because the visible control is Off.
  el.dataset.workspaceConfiguredMode = desired;
}

async function applyConfig(win, doc, config = {}) {
  const values = config?.values && typeof config.values === "object" ? config.values : {};
  const checks = config?.checks && typeof config.checks === "object" ? config.checks : {};
  const orderedValues = [
    "transcribeProvider", "noteProvider", "secondaryProvider",
    ...VALUE_IDS.filter((id) => ![
      "transcribeProvider", "noteProvider", "secondaryProvider", "autoCopyModeSelect",
    ].includes(id)),
  ];
  orderedValues.forEach((id) => {
    if (!Object.prototype.hasOwnProperty.call(values, id)) return;
    const el = doc.getElementById(id);
    if (!el || !("value" in el)) return;
    const next = String(values[id] ?? "");
    if ([...el.options || []].some((option) => option.value === next)) {
      el.value = next;
      dispatchChange(win, el);
    }
  });
  Object.entries(checks).forEach(([id, checked]) => {
    const el = doc.getElementById(id);
    if (el?.type !== "checkbox") return;
    el.checked = Boolean(checked);
    dispatchChange(win, el);
  });

  await applyConfiguredAutoCopyMode(win, doc, values);

  await new Promise((resolve) => win.setTimeout(resolve, 30));
  const panePairs = [
    ["redactorOpen", "redactorPane", "toggleRedactorButton"],
    ["secondaryNoteOpen", "secondaryNotePane", "toggleSecondaryNoteButton"],
  ];
  panePairs.forEach(([key, paneId, buttonId]) => {
    if (!Object.prototype.hasOwnProperty.call(config?.panes || {}, key)) return;
    const pane = doc.getElementById(paneId);
    const desired = Boolean(config.panes[key]);
    const current = pane ? !pane.hidden : false;
    if (pane && current !== desired) doc.getElementById(buttonId)?.click();
  });
}

function captureDraft(doc) {
  const fields = {};
  DRAFT_FIELD_IDS.forEach((id) => {
    const el = doc.getElementById(id);
    if (el && "value" in el) fields[id] = String(el.value || "");
  });
  return {
    version: 1,
    fields,
    preserveSupplementaryDate:
      doc.getElementById("supplementaryInfo")?.dataset.preserveHistoricalDate === "1",
    savedAt: new Date().toISOString(),
  };
}

function applyDraft(win, doc, draft) {
  const fields = draft?.fields && typeof draft.fields === "object" ? draft.fields : {};
  const supplementary = doc.getElementById("supplementaryInfo");
  if (supplementary) {
    if (draft?.preserveSupplementaryDate) {
      supplementary.dataset.preserveHistoricalDate = "1";
    } else {
      delete supplementary.dataset.preserveHistoricalDate;
    }
  }
  DRAFT_FIELD_IDS.forEach((id) => {
    if (!Object.prototype.hasOwnProperty.call(fields, id)) return;
    const el = doc.getElementById(id);
    if (!el || !("value" in el)) return;
    el.value = String(fields[id] ?? "");
    dispatchInput(win, el);
  });
}

function hasDraftText(draft) {
  return Object.values(draft?.fields || {}).some((value) => String(value || "").trim());
}

function getRuntimeSnapshot(win, doc, getStateOverride = null) {
  let state = {};
  try {
    state = typeof getStateOverride === "function"
      ? getStateOverride() || {}
      : win.__app?.getMiniPanelState?.() || {};
  } catch {}
  const secondaryAbort = doc.getElementById("secondaryAbortButton");
  const secondaryBusy = Boolean(secondaryAbort && !secondaryAbort.disabled);
  return {
    state,
    secondaryBusy,
    busy: Boolean(
      state.transcribeBusy || state.noteBusy || secondaryBusy ||
      ["recording", "paused", "transcribing", "generating-transcript", "note-generating"]
        .includes(String(state.miniPanelStatusPhase || ""))
    ),
  };
}

function injectFrameStyle() {
  const style = document.createElement("style");
  style.textContent = `
    html.workspace-preset-frame, html.workspace-preset-frame body { background:#f8f8f8; min-height:0; }
    body.workspace-preset-frame-body { margin:0; padding:0; overflow:hidden; }
    .workspace-preset-frame-root { width:100%; box-sizing:border-box; }
    .workspace-preset-frame-root > .recording-area { margin-top:0 !important; }
    .workspace-preset-frame-root > .bottom-half { margin-bottom:0 !important; }
  `;
  document.head.appendChild(style);
}

function initFrameRuntime() {
  document.documentElement.classList.add("workspace-preset-frame");
  injectFrameStyle();
  const id = window.__workspacePresetRuntimeId;
  const root = document.createElement("div");
  root.className = "workspace-preset-frame-root";
  const recording = document.querySelector(".recording-area");
  const bottom = document.querySelector(".bottom-half");
  const noteHistoryModal = document.getElementById("noteHistoryModal");
  if (!recording || !bottom) return;

  root.append(recording, bottom);
  if (noteHistoryModal) root.appendChild(noteHistoryModal);
  document.body.appendChild(root);
  document.body.classList.add("workspace-preset-frame-body");
  [...document.body.children].forEach((child) => {
    if (child !== root && !["SCRIPT", "STYLE"].includes(child.tagName)) child.style.display = "none";
  });

  const saveDraft = () => {
    try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify(captureDraft(document))); } catch {}
  };
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (raw) applyDraft(window, document, JSON.parse(raw));
  } catch {}
  DRAFT_FIELD_IDS.forEach((fieldId) => {
    document.getElementById(fieldId)?.addEventListener("input", saveDraft);
  });

  const notifyParent = (reason = "state") => {
    saveDraft();
    try {
      window.parent.postMessage({ type: "workspace-preset-frame-update", id, reason }, window.location.origin);
    } catch {}
  };
  document.addEventListener("change", () => notifyParent("config"), true);
  document.addEventListener("click", () => window.setTimeout(() => notifyParent("click"), 0), true);
  window.addEventListener("app:state-changed", () => notifyParent("app-state"));
  window.addEventListener("note-history-updated", () => notifyParent("history"));
  window.addEventListener("mini-hub:prompt-ui-refresh", () => notifyParent("prompt-title"));

  window.__workspacePresetBridge = Object.freeze({
    id,
    captureConfig: () => captureConfig(document),
    applyConfig: (config) => applyConfig(window, document, config),
    captureDraft: () => captureDraft(document),
    applyDraft: (draft) => applyDraft(window, document, draft),
    clearDraft() {
      applyDraft(window, document, { fields: Object.fromEntries(DRAFT_FIELD_IDS.map((key) => [key, ""])) });
      try { sessionStorage.removeItem(DRAFT_KEY); } catch {}
    },
    getSnapshot: () => getRuntimeSnapshot(window, document),
    getHistorySnapshot: () => window.__noteHistory?.getSnapshot?.() || { entries: [], nextSequence: 1 },
    clearHistory: () => window.__noteHistory?.clearLocal?.() !== false,
    replaceHistory(snapshot) {
      const replace = window.__noteHistory?.replaceLocal;
      return typeof replace === "function" ? replace(snapshot) !== false : false;
    },
    getGeneralTerms: () => String(document.getElementById("redactorGeneralTerms")?.value || ""),
    setGeneralTerms(value) {
      const el = document.getElementById("redactorGeneralTerms");
      if (!el) return;
      el.value = String(value || "");
      dispatchInput(window, el);
    },
    runAction(actionName, ...args) {
      const fn = window.__app?.[String(actionName || "")];
      return typeof fn === "function" ? fn(...args) : false;
    },
    getContent(kind) {
      const idForKind = String(kind || "").toLowerCase() === "note" ? "generatedNote" : "transcription";
      return String(document.getElementById(idForKind)?.value || "");
    },
  });

  const sendHeight = () => {
    const height = Math.max(600, Math.ceil(root.getBoundingClientRect().height + 4));
    try {
      window.parent.postMessage({ type: "workspace-preset-frame-height", id, height }, window.location.origin);
    } catch {}
  };
  new ResizeObserver(sendHeight).observe(root);
  window.__openMiniPanel = () => window.parent.__openMiniPanel?.();
  window.addEventListener("mini-panel:open-requested", () => window.parent.__openMiniPanel?.());
  sendHeight();

  let secondaryReadyAttempts = 0;
  const notifyWhenRuntimeReady = () => {
    if (ensureSecondaryNoteModuleReady(window, document)) {
      notifyParent("ready");
      return;
    }

    secondaryReadyAttempts += 1;
    if (secondaryReadyAttempts < 200) {
      window.setTimeout(notifyWhenRuntimeReady, 25);
      return;
    }

    console.warn("[workspace-presets] Secondary Note readiness timed out; continuing with the frame runtime.");
    notifyParent("ready-secondary-timeout");
  };
  notifyWhenRuntimeReady();
}

function injectManagerStyle() {
  const style = document.createElement("style");
  style.textContent = `
    .workspace-preset-bar{display:flex;align-items:center;gap:12px;min-height:74px;margin:0 0 16px;padding:12px 17px;border:1px solid #e1e7e4;border-radius:12px;background:#fbfcfb;color:#4b5550;font-size:16.5px;box-sizing:border-box}
    .workspace-preset-bar button,.workspace-modal button{margin:0}.workspace-preset-bar button{font:inherit}.workspace-preset-help{position:relative;width:36px;height:36px;padding:0;border:1px solid #b8c6c0;border-radius:50%;background:#fff;color:#46705f;font-weight:700;cursor:help;flex:0 0 auto}
    .workspace-preset-help-content{display:none;position:absolute;z-index:9999;left:0;top:36px;width:min(400px,78vw);padding:10px 12px;border:1px solid #b8c6c0;border-radius:8px;background:#fff;box-shadow:0 7px 22px rgba(0,0,0,.16);color:#27332e;text-align:left;line-height:1.35;font-weight:400}
    .workspace-preset-help:hover .workspace-preset-help-content,.workspace-preset-help:focus .workspace-preset-help-content,.workspace-preset-help.is-open .workspace-preset-help-content{display:block}
    .workspace-preset-io{min-height:39px;padding:8px 16px;border:1px solid #cbd5d1;border-radius:8px;background:#fff;color:#3d5148;cursor:pointer}.workspace-preset-io:hover{background:#f1f7f4}
    .workspace-preset-label{margin-left:17px;color:#68746f;font-weight:600;white-space:nowrap}.workspace-preset-list{display:flex;align-items:center;gap:10px;min-width:0;overflow-x:auto;padding:4px 6px;scrollbar-width:thin}
    .workspace-preset-chip{position:relative;display:inline-flex;align-items:center;gap:2px;flex:0 0 auto;min-height:49px;padding:0 9px 0 4px;border:1px solid #d2dad6;border-radius:999px;background:#fff;color:#34463e;max-width:310px;box-sizing:border-box}.workspace-preset-chip:hover{background:#f2f8f5;color:#34463e}
    .workspace-preset-chip.is-active{border-color:#69a98d;background:#edf7f2;box-shadow:inset 0 -2px 0 #5a9}.workspace-preset-chip.is-workspace-dragging{opacity:.5}.workspace-preset-chip.is-workspace-drop-before::before,.workspace-preset-chip.is-workspace-drop-after::after{content:"";position:absolute;z-index:3;top:5px;bottom:5px;width:3px;border-radius:999px;background:#4f9d7b;box-shadow:0 0 0 2px rgba(79,157,123,.14)}.workspace-preset-chip.is-workspace-drop-before::before{left:-7px}.workspace-preset-chip.is-workspace-drop-after::after{right:-7px}
    .workspace-preset-drag{align-self:stretch;display:inline-flex;align-items:center;justify-content:center;flex:0 0 auto;width:25px;padding:0;border:0;border-radius:999px 5px 5px 999px;background:transparent;color:#8a9691;font-size:17px;line-height:1;cursor:grab}.workspace-preset-drag:hover,.workspace-preset-drag:focus-visible{background:rgba(90,169,153,.12);color:#46705f;outline:none}.workspace-preset-drag:active{cursor:grabbing}.workspace-preset-select{display:inline-flex;align-items:center;gap:10px;align-self:stretch;min-width:0;max-width:246px;padding:9px 7px;border:0;border-radius:5px;background:transparent;color:inherit;cursor:pointer}.workspace-preset-select:hover,.workspace-preset-select:focus-visible{background:rgba(90,169,153,.09);outline:none}.workspace-preset-select[aria-pressed="true"]{font-weight:600}.workspace-preset-name{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .workspace-preset-dot{width:10.5px;height:10.5px;border-radius:50%;background:#b8c0bd;flex:0 0 auto}.workspace-preset-dot.recording{background:#d7263d;box-shadow:0 0 0 0 rgba(215,38,61,.5);animation:workspacePulse 1.3s infinite}.workspace-preset-dot.generating{background:#7b61c9;animation:workspaceSpin 1.2s linear infinite}.workspace-preset-dot.transcribing{background:#2c7bd9}.workspace-preset-dot.complete{background:#2f9d61}
    .workspace-preset-clone,.workspace-preset-close{position:relative;flex:0 0 auto;border:0;background:transparent;color:#87918d;padding:0;cursor:pointer}.workspace-preset-clone{width:25px;height:29px;border-radius:5px}.workspace-preset-clone::before,.workspace-preset-clone::after{content:"";position:absolute;width:9px;height:9px;border:1.5px solid currentColor;border-radius:2px;box-sizing:border-box}.workspace-preset-clone::before{left:7px;top:7px}.workspace-preset-clone::after{left:10px;top:10px}.workspace-preset-clone:hover,.workspace-preset-clone:focus-visible{background:rgba(90,169,153,.12);color:#46705f;outline:none}.workspace-preset-close{width:24px;height:29px;border-radius:5px;line-height:1;font-size:19px}.workspace-preset-close:hover,.workspace-preset-close:focus-visible{background:rgba(164,0,30,.07);color:#a4001e;outline:none}.workspace-preset-add{width:47px;height:47px;padding:0;border:1px dashed #aebbb5;border-radius:50%;background:#fff;color:#426857;font-size:26px;line-height:1;cursor:pointer;flex:0 0 auto}
    .workspace-preset-frame-host{position:relative;width:100%}.workspace-preset-frame{border:0;background:#f8f8f8}.workspace-preset-frame.is-active{position:relative;display:block;width:100%;min-height:600px;opacity:1;pointer-events:auto}.workspace-preset-frame.is-parked{position:fixed;left:-10000px;top:0;width:2px!important;height:2px!important;opacity:0;pointer-events:none}
    .workspace-preset-toast{position:fixed;z-index:10020;left:50%;bottom:18px;transform:translateX(-50%);padding:8px 13px;border-radius:8px;background:#24352d;color:white;font-size:13px;box-shadow:0 5px 20px rgba(0,0,0,.2)}
    .workspace-backdrop{position:fixed;z-index:10010;inset:0;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(0,0,0,.4)}.workspace-backdrop[hidden]{display:none}.workspace-modal{width:min(480px,94vw);max-height:88vh;overflow:auto;background:#fff;border-radius:12px;padding:16px;box-shadow:0 16px 48px rgba(0,0,0,.3)}.workspace-modal-head{display:flex;align-items:center;justify-content:space-between;gap:12px}.workspace-modal-head h2{font-size:18px;margin:0}.workspace-modal-close{border:0;background:transparent;color:#a4001e;padding:2px 6px;font-size:22px;cursor:pointer}.workspace-modal-notice{padding:9px;border:1px solid #b8d6ca;border-radius:8px;background:#f3faf7;font-size:12px;line-height:1.4}.workspace-modal-option{display:block;width:100%;margin-top:10px!important;padding:9px;border:1px solid #9bc4b2;border-radius:8px;background:#fff;color:#2e5544;text-align:left;cursor:pointer}.workspace-modal-option:hover{background:#f1f8f5;color:#2e5544}.workspace-modal-field{display:block;width:100%;box-sizing:border-box;margin-top:6px;padding:8px;border:1px solid #cbd5d1;border-radius:7px}.workspace-modal-actions{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap}.workspace-modal-actions button{padding:7px 11px;border-radius:7px;font-size:12px}.workspace-modal-status{min-height:18px;font-size:12px}.workspace-import-preview{margin-top:10px;padding:9px;border:1px solid #d8dfdc;border-radius:8px;background:#fafafa;font-size:12px}
    @keyframes workspacePulse{0%{box-shadow:0 0 0 0 rgba(215,38,61,.48)}70%{box-shadow:0 0 0 5px rgba(215,38,61,0)}100%{box-shadow:0 0 0 0 rgba(215,38,61,0)}}@keyframes workspaceSpin{50%{opacity:.35}}
    @media(max-width:700px){.workspace-preset-label{margin-left:4px}.workspace-preset-io{min-height:35px;font-size:11px;padding:4px 6px}.workspace-preset-bar{min-height:69px;padding:10px 12px;gap:3.5px}.workspace-preset-help{width:34px;height:34px}.workspace-preset-chip{min-height:46px;padding-right:7px}.workspace-preset-drag{width:23px;font-size:16px}.workspace-preset-select{padding:8px 5px;max-width:210px}.workspace-preset-clone,.workspace-preset-close{height:27px}.workspace-preset-add{width:44px;height:44px;font-size:24px}}
  `;
  document.head.appendChild(style);
}

function initTopLevelManager() {
  injectManagerStyle();
  const nativeRecording = document.querySelector(".recording-area");
  const nativeBottom = document.querySelector(".bottom-half");
  if (!nativeRecording || !nativeBottom) return;

  const runtimes = new Map();
  const workspaceUi = new Map();
  let definitions = loadDefinitions();
  let primaryPresetId = readSessionRaw(PRIMARY_RUNTIME_KEY);
  if (!definitions.some((item) => item.id === primaryPresetId)) primaryPresetId = definitions[0].id;
  writeSessionRaw(PRIMARY_RUNTIME_KEY, primaryPresetId);
  let activeId = readSessionRaw(ACTIVE_KEY) || primaryPresetId;
  if (!definitions.some((item) => item.id === activeId)) activeId = primaryPresetId;
  let draggedWorkspaceId = "";
  let dragDropTarget = null;
  let lastGeneralTerms = String(document.getElementById("redactorGeneralTerms")?.value || "");
  let configTimer = 0;
  let modalState = { mode: "", provider: "", bundle: null, legacyPasswordMode: false };
  const originalActions = {};

  const toolbar = buildToolbar();
  nativeRecording.parentNode.insertBefore(toolbar.bar, nativeRecording);
  const frameHost = document.createElement("div");
  frameHost.className = "workspace-preset-frame-host";
  nativeRecording.parentNode.insertBefore(frameHost, nativeRecording);
  const modal = buildModal();
  document.body.appendChild(modal.backdrop);

  runtimes.set(primaryPresetId, { id: primaryPresetId, kind: "native", win: window, doc: document, ready: true });
  window.addEventListener("message", handleFrameMessage);
  definitions.filter((item) => item.id !== primaryPresetId).forEach(createFrameRuntime);
  bindRuntimeDocument(runtimes.get(primaryPresetId));
  installAppDelegation();
  applyActiveWorkspace({ applySavedConfig: true });

  function handleFrameMessage(event) {
    if (event.origin !== window.location.origin) return;
    const data = event.data || {};
    const runtime = runtimes.get(String(data.id || ""));
    if (!runtime || runtime.kind !== "frame") return;
    if (event.source !== runtime.frame.contentWindow) return;
    if (data.type === "workspace-preset-frame-height") {
      runtime.height = Math.max(600, Math.min(6000, Number(data.height) || 600));
      if (runtime.id === activeId) runtime.frame.style.height = `${runtime.height}px`;
      return;
    }
    if (data.type === "workspace-preset-frame-update") {
      let becameReady = false;
      if (!runtime.ready && runtime.frame.contentWindow?.__workspacePresetBridge) {
        const secondaryReady = ensureSecondaryNoteModuleReady(
          runtime.frame.contentWindow,
          runtime.frame.contentDocument
        );
        const secondaryTimedOut = data.reason === "ready-secondary-timeout";
        if (!secondaryReady && !secondaryTimedOut) return;
        if (!secondaryReady) {
          console.warn("[workspace-presets] Frame became ready without a confirmed Secondary Note module.");
        }

        runtime.ready = true;
        becameReady = true;
        runtime.win = runtime.frame.contentWindow;
        runtime.doc = runtime.frame.contentDocument;
        bindRuntimeDocument(runtime);
        const definition = findDefinition(runtime.id);
        if (definition?.config) runtime.win.__workspacePresetBridge.applyConfig(definition.config);
        runtime.win.__workspacePresetBridge.setGeneralTerms(lastGeneralTerms);
        if (runtime.pendingDraft) {
          runtime.win.__workspacePresetBridge.applyDraft(runtime.pendingDraft);
          runtime.pendingDraft = null;
        }
        if (runtime.pendingHistory) {
          runtime.win.__workspacePresetBridge.replaceHistory(runtime.pendingHistory);
          runtime.pendingHistory = null;
        }
      }
      scheduleConfigSave(runtime.id);
      render();
      notifyHub();
      if ((data.reason === "history" || becameReady) && runtime.id === activeId) {
        notifyHistoryUpdated(becameReady ? "runtime-ready" : "background-generation", runtime.id);
      }
    }
  }

  const poll = window.setInterval(() => {
    render();
    notifyHub();
  }, 500);
  window.addEventListener("mini-hub:prompt-ui-refresh", () => {
    render();
    notifyHub();
  });
  window.addEventListener("pagehide", () => window.clearInterval(poll), { once: true });

  window.__workspacePresets = Object.freeze({
    get activeId() { return activeId; },
    selectPreset: (id) => switchPreset(id),
    runAction(id, actionName, ...args) {
      const runtime = runtimes.get(String(id || ""));
      return runtimeAction(runtime, actionName, ...args);
    },
    getSnapshot: buildWorkspaceSnapshot,
    getHistorySnapshot(presetId = activeId) {
      const requestedId = String(presetId || activeId);
      return runtimeHistorySnapshot(runtimes.get(requestedId) || runtimes.get(activeId));
    },
    clearHistory(presetId = activeId) {
      const requestedId = String(presetId || activeId);
      const runtime = runtimes.get(requestedId) || runtimes.get(activeId);
      const cleared = clearRuntimeHistory(runtime);
      if (cleared && runtime?.id === activeId) notifyHistoryUpdated("cleared", runtime.id);
      return cleared;
    },
    restoreHistoryEntry(entry, target = "current") {
      return restoreHistoryEntry(entry, target);
    },
    getContent(kind, presetId = activeId) {
      const requestedId = String(presetId || activeId);
      const runtime = runtimes.get(requestedId) || runtimes.get(activeId);
      if (runtime?.kind === "frame") return runtime.win?.__workspacePresetBridge?.getContent(kind) || "";
      const fieldId = String(kind || "").toLowerCase() === "note" ? "generatedNote" : "transcription";
      return String(document.getElementById(fieldId)?.value || "");
    },
    decorateHubSnapshot(snapshot) {
      const workspacePresets = buildWorkspaceSnapshot();
      const activeItem = workspacePresets.items.find((item) => item.id === activeId);
      const activeRuntime = runtimes.get(activeId);
      const promptOptions = runtimeAction(activeRuntime, "getMiniPanelPromptOptions");
      const selectedPromptSlot = runtimeAction(activeRuntime, "getSelectedPromptSlot");
      const promptLabel = runtimeAction(activeRuntime, "getCurrentPromptSlotTitle");
      return {
        ...snapshot,
        state: activeItem?.state || snapshot.state,
        promptOptions: Array.isArray(promptOptions) && promptOptions.length ? promptOptions : snapshot.promptOptions,
        selectedPromptSlot: selectedPromptSlot || snapshot.selectedPromptSlot,
        promptLabel: promptLabel || snapshot.promptLabel,
        workspacePresets,
      };
    },
    panelModeKey: PANEL_MODE_KEY,
  });
  void applyPendingCloudRestore();
  window.setTimeout(() => notifyHistoryViewChanged("manager-ready"), 0);

  function loadDefinitions() {
    try {
      const parsed = JSON.parse(localStorage.getItem(DEFINITIONS_KEY) || "[]");
      if (Array.isArray(parsed) && parsed.length) {
        return parsed.slice(0, MAX_PRESETS).map((item, index) => ({
          id: String(item?.id || uid()),
          name: normalizeWorkspaceName(item?.name, index),
          config: sanitizeConfig(item?.config),
        }));
      }
    } catch {}
    return [{ id: uid(), name: "Workspace 1", config: captureConfig(document) }];
  }

  function persistDefinitions() {
    definitions.forEach((definition) => {
      const runtime = runtimes.get(definition.id);
      if (runtime?.ready) definition.config = captureRuntimeConfig(runtime);
    });
    writeSessionRaw(PRIMARY_RUNTIME_KEY, primaryPresetId);
    try { localStorage.setItem(DEFINITIONS_KEY, JSON.stringify(definitions)); } catch {}
  }

  function readSessionRaw(key) {
    try { return sessionStorage.getItem(key); } catch { return ""; }
  }
  function writeSessionRaw(key, value) {
    try { sessionStorage.setItem(key, String(value || "")); } catch {}
  }
  function findDefinition(id) { return definitions.find((item) => item.id === id); }

  function createFrameRuntime(definition) {
    const frame = document.createElement("iframe");
    frame.className = "workspace-preset-frame is-parked";
    frame.title = definition.name;
    frame.allow = "microphone; clipboard-read; clipboard-write";
    const url = new URL(window.location.href);
    url.searchParams.set("workspacePresetFrame", definition.id);
    url.hash = "";
    frame.src = url.toString();
    frameHost.appendChild(frame);
    const runtime = { id: definition.id, kind: "frame", frame, win: null, doc: null, ready: false, height: 900 };
    runtimes.set(definition.id, runtime);
  }

  function bindRuntimeDocument(runtime) {
    if (!runtime?.doc || runtime.bound) return;
    runtime.bound = true;
    const handler = () => scheduleConfigSave(runtime.id);
    runtime.doc.addEventListener("change", handler, true);
    ["toggleRedactorButton", "toggleSecondaryNoteButton"].forEach((id) => {
      runtime.doc.getElementById(id)?.addEventListener("click", () => setTimeout(handler, 0));
    });
    if (runtime.kind === "native") {
      const saveDraft = () => {
        const currentPrimary = primaryPresetId;
        try { sessionStorage.setItem(`${DRAFT_KEY}::${currentPrimary}`, JSON.stringify(captureDraft(document))); } catch {}
      };
      DRAFT_FIELD_IDS.forEach((id) => runtime.doc.getElementById(id)?.addEventListener("input", saveDraft));
      try {
        const raw = sessionStorage.getItem(`${DRAFT_KEY}::${runtime.id}`);
        if (raw) applyDraft(window, document, JSON.parse(raw));
      } catch {}
    }
  }

  function scheduleConfigSave(id) {
    window.clearTimeout(configTimer);
    configTimer = window.setTimeout(() => {
      const definition = findDefinition(id);
      const runtime = runtimes.get(id);
      if (definition && runtime?.ready) {
        definition.config = captureRuntimeConfig(runtime);
        persistDefinitions();
      }
    }, 80);
  }

  function captureRuntimeConfig(runtime) {
    if (runtime.kind === "frame") return runtime.win?.__workspacePresetBridge?.captureConfig() || {};
    return captureConfig(document);
  }
  function captureRuntimeDraft(runtime) {
    if (runtime.kind === "frame") return runtime.win?.__workspacePresetBridge?.captureDraft() || { fields: {} };
    return captureDraft(document);
  }
  function runtimeSnapshot(runtime) {
    if (!runtime?.ready) return { state: {}, secondaryBusy: false, busy: false };
    if (runtime.kind === "frame") return runtime.win?.__workspacePresetBridge?.getSnapshot() || { state: {}, busy: false };
    // The top-level __app.getMiniPanelState function is delegated to whichever
    // preset is currently selected. Using it here would make inactive Preset 1
    // inherit the selected preset's idle/recording state. Call the captured
    // native getter so its background recording dot remains independent.
    return getRuntimeSnapshot(window, document, originalActions.getMiniPanelState);
  }
  function runtimeAction(runtime, actionName, ...args) {
    if (!runtime?.ready) return false;
    if (runtime.kind === "frame") return runtime.win?.__workspacePresetBridge?.runAction(actionName, ...args);
    const original = originalActions[String(actionName || "")];
    return typeof original === "function" ? original(...args) : false;
  }

  function historyEntryDraft(entry) {
    return {
      version: 1,
      fields: {
        transcription: String(entry?.transcript || ""),
        supplementaryInfo: String(entry?.supplementary || ""),
        generatedNote: String(entry?.note || ""),
      },
      preserveSupplementaryDate: true,
      savedAt: new Date().toISOString(),
    };
  }

  function applyHistoryDraft(runtime, draft) {
    if (!runtime?.ready) return false;
    if (runtime.kind === "frame") {
      runtime.win?.__workspacePresetBridge?.applyDraft(draft);
    } else {
      applyDraft(window, document, draft);
    }
    return true;
  }

  function restoreHistoryEntry(entry, target) {
    const draft = historyEntryDraft(entry);
    if (target === "new") {
      if (definitions.length >= MAX_PRESETS) return { ok: false, reason: "max" };
      const definition = {
        id: uid(),
        name: fmt(t().defaultName, { n: definitions.length + 1 }),
        config: {},
      };
      definitions.push(definition);
      createFrameRuntime(definition);
      const runtime = runtimes.get(definition.id);
      if (runtime) runtime.pendingDraft = draft;
      persistDefinitions();
      switchPreset(definition.id);
      return { ok: true, workspaceId: definition.id };
    }

    const runtime = runtimes.get(activeId);
    if (!runtime?.ready) return { ok: false, reason: "not-ready" };
    if (runtimeSnapshot(runtime).busy) return { ok: false, reason: "busy" };
    return applyHistoryDraft(runtime, draft)
      ? { ok: true, workspaceId: activeId }
      : { ok: false, reason: "not-ready" };
  }

  function runtimeHistorySnapshot(runtime) {
    if (!runtime?.ready) return { entries: [], nextSequence: 1 };
    if (runtime.kind === "frame") {
      return runtime.win?.__workspacePresetBridge?.getHistorySnapshot?.() || {
        entries: [],
        nextSequence: 1,
      };
    }
    return window.__noteHistory?.getSnapshot?.() || { entries: [], nextSequence: 1 };
  }

  function clearRuntimeHistory(runtime) {
    if (!runtime?.ready) return false;
    if (runtime.kind === "frame") {
      return runtime.win?.__workspacePresetBridge?.clearHistory?.() !== false;
    }
    return window.__noteHistory?.clearLocal?.() !== false;
  }

  function replaceNativeHistory(snapshot) {
    return window.__noteHistory?.replaceLocal?.(snapshot) !== false;
  }

  function notifyHistoryViewChanged(reason = "workspace-switched") {
    try {
      window.dispatchEvent(
        new CustomEvent("workspace-history-view-changed", {
          detail: { reason, workspaceId: activeId },
        })
      );
    } catch (_) {}
  }

  function notifyHistoryUpdated(reason = "updated", workspaceId = activeId) {
    try {
      window.dispatchEvent(
        new CustomEvent("workspace-history-updated", {
          detail: { reason, workspaceId: String(workspaceId || activeId) },
        })
      );
    } catch (_) {}
  }

  function syncGeneralTermsFrom(runtime) {
    if (!runtime?.ready) return;
    lastGeneralTerms = runtime.kind === "frame"
      ? String(runtime.win?.__workspacePresetBridge?.getGeneralTerms() || "")
      : String(document.getElementById("redactorGeneralTerms")?.value || "");
  }
  function syncGeneralTermsTo(runtime) {
    if (!runtime?.ready) return;
    if (runtime.kind === "frame") runtime.win?.__workspacePresetBridge?.setGeneralTerms(lastGeneralTerms);
    else {
      const el = document.getElementById("redactorGeneralTerms");
      if (el) { el.value = lastGeneralTerms; dispatchInput(window, el); }
    }
  }

  function switchPreset(id) {
    const next = String(id || "");
    if (!findDefinition(next) || next === activeId) return false;
    const current = runtimes.get(activeId);
    if (current?.ready) {
      syncGeneralTermsFrom(current);
      const definition = findDefinition(activeId);
      if (definition) definition.config = captureRuntimeConfig(current);
    }
    activeId = next;
    writeSessionRaw(ACTIVE_KEY, activeId);
    applyActiveWorkspace();
    persistDefinitions();
    notifyHub();
    return true;
  }

  function applyActiveWorkspace({ applySavedConfig = false } = {}) {
    const activeRuntime = runtimes.get(activeId);
    nativeRecording.style.display = activeRuntime?.kind === "native" ? "" : "none";
    nativeBottom.style.display = activeRuntime?.kind === "native" ? "" : "none";
    runtimes.forEach((runtime) => {
      if (runtime.kind !== "frame") return;
      const active = runtime.id === activeId;
      runtime.frame.classList.toggle("is-active", active);
      runtime.frame.classList.toggle("is-parked", !active);
      runtime.frame.style.height = active ? `${runtime.height || 900}px` : "2px";
    });
    if (activeRuntime?.ready) {
      syncGeneralTermsTo(activeRuntime);
      if (applySavedConfig) applyConfig(activeRuntime.win, activeRuntime.doc, findDefinition(activeId)?.config || {});
    }
    render();
    notifyHistoryViewChanged("workspace-switched");
  }

  function buildToolbar() {
    const bar = document.createElement("div");
    bar.className = "workspace-preset-bar";
    const help = document.createElement("button");
    help.type = "button";
    help.className = "workspace-preset-help";
    help.textContent = "?";
    const helpContent = document.createElement("span");
    helpContent.className = "workspace-preset-help-content";
    help.appendChild(helpContent);
    help.addEventListener("click", (event) => { event.stopPropagation(); help.classList.toggle("is-open"); });
    document.addEventListener("click", () => help.classList.remove("is-open"));
    const importButton = document.createElement("button");
    importButton.type = "button"; importButton.className = "workspace-preset-io";
    const exportButton = document.createElement("button");
    exportButton.type = "button"; exportButton.className = "workspace-preset-io";
    const label = document.createElement("span"); label.className = "workspace-preset-label";
    const list = document.createElement("div"); list.className = "workspace-preset-list";
    const add = document.createElement("button"); add.type = "button"; add.className = "workspace-preset-add"; add.textContent = "+";
    bar.append(help, importButton, exportButton, label, list, add);
    importButton.addEventListener("click", () => openBackupModal("import"));
    exportButton.addEventListener("click", () => openBackupModal("export"));
    add.addEventListener("click", addPreset);
    list.addEventListener("dragover", handleWorkspaceListDragOver);
    list.addEventListener("drop", handleWorkspaceListDrop);
    return { bar, help, helpContent, importButton, exportButton, label, list, add };
  }

  function clearWorkspaceDropIndicators() {
    workspaceUi.forEach((ui) => {
      ui.chip.classList.remove("is-workspace-drop-before", "is-workspace-drop-after");
    });
    dragDropTarget = null;
  }

  function finishWorkspaceDrag() {
    clearWorkspaceDropIndicators();
    workspaceUi.forEach((ui) => ui.chip.classList.remove("is-workspace-dragging"));
    draggedWorkspaceId = "";
  }

  function showWorkspaceDropTarget(id, placement) {
    clearWorkspaceDropIndicators();
    if (!id || id === draggedWorkspaceId) return;
    const ui = workspaceUi.get(id);
    if (!ui) return;
    dragDropTarget = { id, placement: placement === "after" ? "after" : "before" };
    ui.chip.classList.add(
      dragDropTarget.placement === "after"
        ? "is-workspace-drop-after"
        : "is-workspace-drop-before"
    );
  }

  function handleWorkspaceListDragOver(event) {
    if (!draggedWorkspaceId) return;
    const candidates = definitions
      .filter((definition) => definition.id !== draggedWorkspaceId)
      .map((definition) => ({ definition, chip: workspaceUi.get(definition.id)?.chip }))
      .filter((item) => item.chip?.isConnected);
    if (!candidates.length) return;

    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = "move";

    const listRect = toolbar.list.getBoundingClientRect();
    if (event.clientX < listRect.left + 28) toolbar.list.scrollLeft -= 14;
    else if (event.clientX > listRect.right - 28) toolbar.list.scrollLeft += 14;

    let target = candidates[candidates.length - 1];
    let placement = "after";
    for (const candidate of candidates) {
      const rect = candidate.chip.getBoundingClientRect();
      if (event.clientX < rect.left + (rect.width / 2)) {
        target = candidate;
        placement = "before";
        break;
      }
    }
    showWorkspaceDropTarget(target.definition.id, placement);
  }

  function handleWorkspaceListDrop(event) {
    if (!draggedWorkspaceId || !dragDropTarget) return;
    event.preventDefault();
    const movedId = draggedWorkspaceId;
    const target = { ...dragDropTarget };
    finishWorkspaceDrag();
    reorderWorkspace(movedId, target.id, target.placement);
  }

  function reorderWorkspace(movedId, targetId, placement) {
    if (!movedId || !targetId || movedId === targetId) return false;
    const sourceIndex = definitions.findIndex((item) => item.id === movedId);
    if (sourceIndex < 0) return false;

    const [moved] = definitions.splice(sourceIndex, 1);
    const targetIndex = definitions.findIndex((item) => item.id === targetId);
    if (targetIndex < 0) {
      definitions.splice(sourceIndex, 0, moved);
      return false;
    }

    definitions.splice(targetIndex + (placement === "after" ? 1 : 0), 0, moved);
    persistDefinitions();
    render();
    notifyHub();
    return true;
  }

  function render() {
    syncDefinitionNames();
    const copy = t();
    toolbar.help.setAttribute("aria-label", copy.help); toolbar.helpContent.innerHTML = copy.helpHtml;
    toolbar.importButton.textContent = copy.import; toolbar.exportButton.textContent = copy.export;
    toolbar.label.textContent = copy.presets; toolbar.add.setAttribute("aria-label", copy.add); toolbar.add.title = copy.add;

    const liveIds = new Set(definitions.map((definition) => definition.id));
    workspaceUi.forEach((ui, id) => {
      if (liveIds.has(id)) return;
      ui.chip.remove();
      workspaceUi.delete(id);
    });

    definitions.forEach((definition, index) => {
      const runtime = runtimes.get(definition.id);
      const snapshot = runtimeSnapshot(runtime);
      let ui = workspaceUi.get(definition.id);
      if (!ui) {
        ui = createWorkspaceUi(definition.id);
        workspaceUi.set(definition.id, ui);
      }

      const expectedNode = toolbar.list.children[index] || null;
      if (expectedNode !== ui.chip) toolbar.list.insertBefore(ui.chip, expectedNode);

      const active = definition.id === activeId;
      ui.chip.classList.toggle("is-active", active);
      ui.select.setAttribute("aria-pressed", active ? "true" : "false");
      ui.select.title = statusTitle(snapshot, copy);
      ui.dot.className = `workspace-preset-dot ${statusClass(snapshot)}`;
      ui.name.textContent = definition.name;
      ui.dragHandle.setAttribute("aria-label", copy.move);
      ui.dragHandle.title = copy.move;
      ui.clone.setAttribute("aria-label", copy.clone);
      ui.clone.title = copy.clone;
      ui.close.setAttribute("aria-label", copy.close);
      ui.close.title = copy.close;
    });
  }

  function createWorkspaceUi(id) {
    const chip = document.createElement("div");
    chip.className = "workspace-preset-chip";
    chip.dataset.workspaceId = id;

    const dragHandle = document.createElement("button");
    dragHandle.type = "button";
    dragHandle.className = "workspace-preset-drag";
    dragHandle.textContent = "⠿";
    dragHandle.draggable = true;
    dragHandle.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
    dragHandle.addEventListener("dragstart", (event) => {
      if (!findDefinition(id)) {
        event.preventDefault();
        return;
      }
      finishWorkspaceDrag();
      draggedWorkspaceId = id;
      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", id);
        try { event.dataTransfer.setDragImage(chip, 18, Math.max(10, chip.offsetHeight / 2)); } catch {}
      }
      chip.classList.add("is-workspace-dragging");
    });
    dragHandle.addEventListener("dragend", finishWorkspaceDrag);

    const select = document.createElement("button");
    select.type = "button";
    select.className = "workspace-preset-select";
    const dot = document.createElement("span");
    dot.className = "workspace-preset-dot";
    dot.setAttribute("aria-hidden", "true");
    const name = document.createElement("span");
    name.className = "workspace-preset-name";
    select.append(dot, name);
    select.addEventListener("click", () => switchPreset(id));

    const clone = document.createElement("button");
    clone.type = "button";
    clone.className = "workspace-preset-clone";
    clone.addEventListener("click", () => clonePreset(id));

    const close = document.createElement("button");
    close.type = "button";
    close.className = "workspace-preset-close";
    close.textContent = "×";
    close.addEventListener("click", () => closePreset(id));

    chip.append(dragHandle, select, clone, close);
    return { chip, dragHandle, select, dot, name, clone, close };
  }

  function syncDefinitionNames() {
    let changed = false;
    definitions.forEach((definition, index) => {
      const runtime = runtimes.get(definition.id);
      if (!runtime?.ready) return;
      const title = String(
        runtimeAction(runtime, "getCurrentPromptSlotTitle") ||
        runtime.doc?.getElementById("promptSlotTriggerName")?.textContent ||
        ""
      ).trim();
      if (!title) return;
      const nextName = safeName(title, fmt(t().defaultName, { n: index + 1 }));
      if (definition.name === nextName) return;
      definition.name = nextName;
      if (runtime.frame) runtime.frame.title = nextName;
      changed = true;
    });
    if (changed) {
      try { localStorage.setItem(DEFINITIONS_KEY, JSON.stringify(definitions)); } catch {}
    }
    return changed;
  }

  function statusClass(snapshot) {
    const phase = String(snapshot?.state?.miniPanelStatusPhase || "");
    if (["recording", "paused"].includes(phase)) return "recording";
    if (snapshot?.state?.noteBusy || snapshot?.secondaryBusy) return "generating";
    if (snapshot?.state?.transcribeBusy || phase.includes("transcrib")) return "transcribing";
    if (["transcript-completed", "transcript-complete", "note-completed"].includes(phase)) return "complete";
    return "";
  }
  function statusTitle(snapshot, copy) {
    const phase = String(snapshot?.state?.miniPanelStatusPhase || "");
    if (phase === "recording") return copy.recording;
    if (phase === "paused") return copy.paused;
    if (snapshot?.state?.noteBusy || snapshot?.secondaryBusy) return copy.generating;
    if (snapshot?.state?.transcribeBusy) return copy.transcribing;
    return "";
  }

  function addPreset() {
    const copy = t();
    if (definitions.length >= MAX_PRESETS) { toast(copy.max, true); return; }
    const suggested = fmt(copy.defaultName, { n: definitions.length + 1 });
    const definition = { id: uid(), name: suggested, config: {} };
    definitions.push(definition);
    createFrameRuntime(definition);
    persistDefinitions();
    switchPreset(definition.id);
  }

  function clonePreset(id) {
    const copy = t();
    const source = findDefinition(id);
    const sourceRuntime = runtimes.get(id);
    if (!source || !sourceRuntime?.ready) { toast(copy.cloneLoading, true); return; }
    if (definitions.length >= MAX_PRESETS) { toast(copy.max, true); return; }

    source.config = captureRuntimeConfig(sourceRuntime);
    const draft = captureRuntimeDraft(sourceRuntime);
    const history = runtimeHistorySnapshot(sourceRuntime);
    const definition = {
      id: uid(),
      name: safeName(
        fmt(copy.cloneName, { name: source.name }),
        fmt(copy.defaultName, { n: definitions.length + 1 })
      ),
      config: sanitizeConfig(source.config),
    };
    definitions.push(definition);
    createFrameRuntime(definition);
    const runtime = runtimes.get(definition.id);
    if (runtime) {
      runtime.pendingDraft = draft;
      runtime.pendingHistory = history;
    }
    persistDefinitions();
    switchPreset(definition.id);
  }

  function closePreset(id) {
    const definition = findDefinition(id); const runtime = runtimes.get(id);
    if (!definition || !runtime) return;
    const copy = t(); const snapshot = runtimeSnapshot(runtime);
    if (snapshot.busy) { toast(copy.busyClose, true); return; }
    if (definitions.length === 1) { toast(copy.atLeastOne, true); return; }
    const draft = captureRuntimeDraft(runtime);
    if (hasDraftText(draft) && !window.confirm(fmt(copy.closeConfirm, { name: definition.name }))) return;

    if (runtime.kind === "native") {
      const replacement = definitions.find((item) => item.id !== id && !runtimeSnapshot(runtimes.get(item.id)).busy);
      if (!replacement) {
        toast(copy.busyClose, true);
        return;
      }
      const replacementRuntime = runtimes.get(replacement.id);
      const replacementDraft = captureRuntimeDraft(replacementRuntime);
      const replacementHistory = runtimeHistorySnapshot(replacementRuntime);
      replacement.config = captureRuntimeConfig(replacementRuntime);
      clearRuntimeHistory(replacementRuntime);
      replacementRuntime.frame?.remove();
      runtimes.delete(replacement.id);
      clearRuntimeDraft(runtime);
      applyDraft(window, document, replacementDraft);
      void applyConfig(window, document, replacement.config).then(() => persistDefinitions());
      runtimes.delete(id);
      runtimes.set(replacement.id, { id: replacement.id, kind: "native", win: window, doc: document, ready: true, bound: true });
      primaryPresetId = replacement.id;
      definitions = definitions.filter((item) => item.id !== id);
      activeId = replacement.id;
      replaceNativeHistory(replacementHistory);
    } else {
      clearRuntimeHistory(runtime);
      runtime.frame.remove(); runtimes.delete(id);
      definitions = definitions.filter((item) => item.id !== id);
      if (activeId === id) activeId = primaryPresetId;
    }
    writeSessionRaw(ACTIVE_KEY, activeId);
    persistDefinitions(); applyActiveWorkspace(); notifyHub();
  }

  function clearRuntimeDraft(runtime) {
    const empty = { fields: Object.fromEntries(DRAFT_FIELD_IDS.map((key) => [key, ""])) };
    if (runtime.kind === "frame") runtime.win?.__workspacePresetBridge?.clearDraft();
    else {
      applyDraft(window, document, empty);
      try { sessionStorage.removeItem(`${DRAFT_KEY}::${runtime.id}`); } catch {}
    }
  }

  function installAppDelegation() {
    const app = window.__app || (window.__app = {});
    DELEGATED_APP_ACTIONS.forEach((name) => {
      if (typeof app[name] === "function") originalActions[name] = app[name].bind(app);
      app[name] = (...args) => runtimeAction(runtimes.get(activeId), name, ...args);
    });
    app.selectWorkspacePreset = (id) => switchPreset(id);
    app.runWorkspacePresetAction = (id, actionName, ...args) => {
      const targetId = String(id || "");
      const runtime = runtimes.get(targetId);
      if (!runtime) return false;
      // Keep the visible/highlighted workspace and the action target atomic.
      // This prevents a Mini Panel Start click from reaching the previously
      // active preset while a preset-selection message is still in flight.
      if (targetId !== activeId) switchPreset(targetId);
      return runtimeAction(runtime, actionName, ...args);
    };
    app.getWorkspacePresetSnapshot = buildWorkspaceSnapshot;
  }

  function buildWorkspaceSnapshot() {
    return {
      activePresetId: activeId,
      items: definitions.map((definition) => {
        const snapshot = runtimeSnapshot(runtimes.get(definition.id));
        return { id: definition.id, name: definition.name, ...snapshot };
      }),
    };
  }

  function notifyHub() {
    try { window.__app?.emitAppStateChanged?.("workspace-presets-updated", { activePresetId: activeId }); } catch {}
  }

  function buildExportBundle() {
    syncDefinitionNames();
    persistDefinitions();
    const slots = new Set();
    definitions.forEach((definition) => {
      [definition.config?.values?.promptSlot, definition.config?.values?.secondaryPromptSelect]
        .filter(Boolean).forEach((slot) => slots.add(String(slot)));
    });
    const promptProfileId = PromptManager.getPromptProfileId();
    const prompts = {};
    slots.forEach((slot) => {
      prompts[slot] = {
        text: String(PromptManager.getPrompt(slot) || ""),
        label: String(PromptManager.getSlotDisplayName(slot, promptProfileId) || ""),
      };
    });
    return {
      schema: PRESET_SCHEMA, version: PRESET_VERSION, exportedAt: new Date().toISOString(),
      promptProfileId, presets: definitions.map((item) => ({ name: item.name, config: sanitizeConfig(item.config) })), prompts,
    };
  }

  function sanitizeConfig(config) {
    const safe = { values: {}, checks: {}, panes: {} };
    VALUE_IDS.forEach((id) => {
      if (Object.prototype.hasOwnProperty.call(config?.values || {}, id)) safe.values[id] = String(config.values[id] ?? "").slice(0, 300);
    });
    CHECKBOX_IDS.forEach((id) => {
      if (Object.prototype.hasOwnProperty.call(config?.checks || {}, id)) safe.checks[id] = Boolean(config.checks[id]);
    });
    ["redactorOpen", "secondaryNoteOpen"].forEach((id) => {
      if (Object.prototype.hasOwnProperty.call(config?.panes || {}, id)) safe.panes[id] = Boolean(config.panes[id]);
    });
    return safe;
  }

  function validateBundle(bundle) {
    if (!bundle || bundle.schema !== PRESET_SCHEMA || Number(bundle.version) !== PRESET_VERSION || !Array.isArray(bundle.presets)) throw new Error(t().invalid);
    const presets = bundle.presets.slice(0, MAX_PRESETS).map((item, index) => ({
      id: uid(), name: normalizeWorkspaceName(item?.name, index), config: sanitizeConfig(item?.config),
    }));
    if (!presets.length) throw new Error(t().invalid);
    const prompts = {};
    Object.entries(bundle.prompts || {}).forEach(([slot, item]) => {
      const n = Number(slot); if (!Number.isInteger(n) || n < 1 || n > 20) return;
      prompts[String(n)] = { text: String(item?.text || "").slice(0, 100000), label: String(item?.label || "").slice(0, 120) };
    });
    return { presets, prompts, promptProfileId: String(bundle.promptProfileId || "") };
  }

  function importPromptDependencies(prompts) {
    Object.entries(prompts || {}).forEach(([slot, item]) => {
      PromptManager.savePrompt(slot, item.text);
      PromptManager.setSlotDisplayName(slot, item.label, PromptManager.getPromptProfileId());
    });
    window.dispatchEvent(new CustomEvent("prompt-slots-imported", { detail: { source: "workspace-presets" } }));
  }

  async function importBundle(
    bundle,
    mode,
    { confirmReplace = true, importPrompts = true } = {}
  ) {
    const validated = validateBundle(bundle);
    if (allBusy()) throw new Error(t().importBusy);
    if (importPrompts) importPromptDependencies(validated.prompts);
    if (mode === "replace") {
      if (confirmReplace && !window.confirm(t().replaceWarning)) return false;
      [...runtimes.values()].filter((runtime) => runtime.kind === "frame").forEach((runtime) => {
        clearRuntimeHistory(runtime);
        runtime.frame.remove();
      });
      replaceNativeHistory({ entries: [], nextSequence: 1 });
      runtimes.clear(); clearRuntimeDraft({ id: primaryPresetId, kind: "native", win: window, doc: document });
      definitions = validated.presets;
      primaryPresetId = definitions[0].id; activeId = primaryPresetId;
      writeSessionRaw(PRIMARY_RUNTIME_KEY, primaryPresetId);
      runtimes.set(primaryPresetId, { id: primaryPresetId, kind: "native", win: window, doc: document, ready: true, bound: true });
      await applyConfig(window, document, definitions[0].config);
      definitions.filter((item) => item.id !== primaryPresetId).forEach(createFrameRuntime);
    } else {
      const available = Math.max(0, MAX_PRESETS - definitions.length);
      validated.presets.slice(0, available).forEach((definition) => { definitions.push(definition); createFrameRuntime(definition); });
    }
    writeSessionRaw(ACTIVE_KEY, activeId); persistDefinitions(); applyActiveWorkspace(); render(); notifyHub();
    return true;
  }

  function applyPendingGeneralTerms(bundle) {
    if (!bundle || bundle.schema !== "whisper.redactor-general-terms" ||
        Number(bundle.version) !== 1 || typeof bundle.generalTerms !== "string") return false;
    const value = String(bundle.generalTerms || "").replace(/\r\n?/g, "\n").trim();
    if (!value) return false;
    lastGeneralTerms = value;
    try { sessionStorage.setItem("redactor_general_terms_session", value); } catch {}
    const field = document.getElementById("redactorGeneralTerms");
    if (field) { field.value = value; dispatchInput(window, field); }
    runtimes.forEach((runtime) => syncGeneralTermsTo(runtime));
    return true;
  }

  async function applyPendingCloudRestore() {
    const pending = CloudBackupSession.consumePendingRestore();
    if (!pending.promptPackage && !pending.workspaceSet) return;
    try {
      if (pending.promptPackage?.promptBundle) {
        PromptManager.importPromptsFromBundle(pending.promptPackage.promptBundle, { confirm: false });
      }
      if (pending.workspaceSet) {
        await importBundle(pending.workspaceSet, "replace", {
          confirmReplace: false,
          // When both are selected, the complete prompt-list backup is the
          // source of truth and must not be overwritten by the Workspace Set's
          // smaller collection of prompt dependencies.
          importPrompts: !pending.promptPackage?.promptBundle,
        });
      }
      if (pending.promptPackage?.generalTermsBundle) {
        applyPendingGeneralTerms(pending.promptPackage.generalTermsBundle);
      }
      window.dispatchEvent(new CustomEvent("prompt-slots-imported", {
        detail: { source: "cloud-entry-restore" },
      }));
      render();
      notifyHub();
      toast(t().cloudRestored);
    } catch (error) {
      toast(fmt(t().failed, { error: error?.message || "Unknown error" }), true);
    }
  }

  function allBusy() { return [...runtimes.values()].some((runtime) => runtimeSnapshot(runtime).busy); }

  function buildModal() {
    const backdrop = document.createElement("div"); backdrop.className = "workspace-backdrop"; backdrop.hidden = true;
    const card = document.createElement("div"); card.className = "workspace-modal"; card.setAttribute("role", "dialog"); card.setAttribute("aria-modal", "true");
    const head = document.createElement("div"); head.className = "workspace-modal-head";
    const title = document.createElement("h2"); const close = document.createElement("button"); close.type = "button"; close.className = "workspace-modal-close"; close.textContent = "×";
    head.append(title, close); const body = document.createElement("div"); const status = document.createElement("p"); status.className = "workspace-modal-status";
    card.append(head, body, status); backdrop.appendChild(card);
    close.addEventListener("click", closeModal); backdrop.addEventListener("click", (event) => { if (event.target === backdrop) closeModal(); });
    return { backdrop, title, body, status, close };
  }

  function openBackupModal(mode) {
    if (mode === "import" && allBusy()) { toast(t().importBusy, true); return; }
    modalState = { mode, provider: "", bundle: null, legacyPasswordMode: false };
    renderChoiceModal(); modal.backdrop.hidden = false;
  }
  function closeModal() { modal.backdrop.hidden = true; modal.body.replaceChildren(); modal.status.textContent = ""; modalState = { mode: "", provider: "", bundle: null, legacyPasswordMode: false }; }
  function setModalStatus(message, error = false) { modal.status.textContent = String(message || ""); modal.status.style.color = error ? "#b00020" : "#2e7d32"; }

  function renderChoiceModal() {
    const copy = t(); const exporting = modalState.mode === "export";
    modal.title.textContent = exporting ? copy.exportTitle : copy.importTitle; modal.body.replaceChildren(); setModalStatus("");
    const notice = document.createElement("div"); notice.className = "workspace-modal-notice"; notice.textContent = exporting ? copy.exportNotice : copy.importNotice; modal.body.appendChild(notice);
    const options = [
      ["json", exporting ? copy.jsonExport : copy.jsonImport],
      ["oneDrive", exporting ? copy.oneDriveExport : copy.oneDriveImport],
      ["googleDrive", exporting ? copy.googleExport : copy.googleImport],
    ];
    options.forEach(([provider, label]) => {
      const button = document.createElement("button"); button.type = "button"; button.className = "workspace-modal-option"; button.textContent = label;
      button.addEventListener("click", () => selectBackupProvider(provider)); modal.body.appendChild(button);
    });
  }

  async function selectBackupProvider(provider) {
    modalState.provider = provider;
    if (provider === "json") {
      if (modalState.mode === "export") await exportJson(); else chooseJsonImport();
      return;
    }
    if (provider === "googleDrive") {
      setModalStatus(t().googleSignIn);
      try { await PromptCloudBackup.prepareGoogleSignIn(); } catch (error) { setModalStatus(error?.message, true); return; }
    }
    renderPasswordStep();
  }

  function renderPasswordStep() {
    const copy = t(); const exporting = modalState.mode === "export"; modal.body.replaceChildren(); setModalStatus("");
    const unlockedPassword = CloudBackupSession.getPassword(modalState.provider);
    const useUnlockedPassword = Boolean(unlockedPassword) && !modalState.legacyPasswordMode;
    const providerName = modalState.provider === "oneDrive" ? "Microsoft OneDrive" : "Google Drive";
    const notice = document.createElement("div"); notice.className = "workspace-modal-notice";
    notice.textContent = modalState.legacyPasswordMode
      ? copy.legacyPassword
      : useUnlockedPassword
        ? fmt(copy.unlockedPassword, { provider: providerName })
        : exporting ? copy.exportNotice : copy.importNotice;
    const password = document.createElement("input"); password.type = "password"; password.className = "workspace-modal-field"; password.placeholder = copy.password; password.autocomplete = exporting ? "new-password" : "current-password";
    let repeat = null;
    if (exporting && !useUnlockedPassword) {
      repeat = document.createElement("input"); repeat.type = "password"; repeat.className = "workspace-modal-field"; repeat.placeholder = copy.repeat; repeat.autocomplete = "new-password";
    }
    const actions = document.createElement("div"); actions.className = "workspace-modal-actions";
    const run = document.createElement("button"); run.type = "button"; run.textContent = exporting ? copy.save : copy.import;
    const back = document.createElement("button"); back.type = "button"; back.textContent = copy.back; actions.append(run, back);
    modal.body.append(notice);
    if (!useUnlockedPassword) modal.body.append(password);
    if (repeat) modal.body.append(repeat);
    modal.body.append(actions); back.addEventListener("click", renderChoiceModal);
    run.addEventListener("click", async () => {
      const value = useUnlockedPassword ? unlockedPassword : password.value;
      if (exporting && !useUnlockedPassword && value.length < 10) { setModalStatus(copy.passwordMin, true); return; }
      if (exporting && !useUnlockedPassword && value !== repeat.value) { setModalStatus(copy.mismatch, true); return; }
      if (!exporting && !value) { setModalStatus(copy.passwordRequired, true); return; }
      run.disabled = true;
      try {
        const progress = (key) => setModalStatus(copy[key] || key);
        const accessToken = await PromptCloudBackup.connect(modalState.provider, progress);
        if (exporting) {
          const bundle = buildExportBundle();
          progress("encryptingAndSaving");
          await PromptCloudBackup.saveWorkspaceSetWithAccessToken(
            modalState.provider, accessToken, bundle, value
          );
          CloudBackupSession.unlock(modalState.provider, value);
          const message = modalState.provider === "oneDrive" ? copy.savedOneDrive : copy.savedGoogle; closeModal(); toast(message);
        } else {
          progress("downloadingAndDecrypting");
          const bundle = await PromptCloudBackup.loadWorkspaceSetWithAccessToken(
            modalState.provider, accessToken, value
          );
          if (!unlockedPassword) {
            CloudBackupSession.unlock(modalState.provider, value);
          } else if (modalState.legacyPasswordMode && window.confirm(copy.migrateLegacy)) {
            progress("encryptingAndSaving");
            await PromptCloudBackup.saveWorkspaceSetWithAccessToken(
              modalState.provider, accessToken, bundle, unlockedPassword
            );
          }
          showImportPreview(bundle);
        }
      } catch (error) {
        if (!exporting && useUnlockedPassword &&
            /incorrect password|damaged/i.test(String(error?.message || ""))) {
          modalState.legacyPasswordMode = true;
          renderPasswordStep();
          setModalStatus(copy.legacyPassword, true);
          return;
        }
        setModalStatus(fmt(copy.failed, { error: error?.message || "Unknown error" }), true);
      }
      finally { password.value = ""; if (repeat) repeat.value = ""; run.disabled = false; }
    });
    if (useUnlockedPassword) run.focus(); else password.focus();
  }

  async function exportJson() {
    const copy = t(); const bundle = buildExportBundle(); const text = JSON.stringify(bundle, null, 2); const filename = `transcribe-notes-workspace-set-${new Date().toISOString().slice(0, 10)}.json`;
    try {
      if (window.showSaveFilePicker) {
        const handle = await window.showSaveFilePicker({ suggestedName: filename, types: [{ description: "JSON", accept: { "application/json": [".json"] } }] });
        const writable = await handle.createWritable(); await writable.write(new Blob([text], { type: "application/json" })); await writable.close();
      } else {
        const blob = new Blob([text], { type: "application/json" }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = filename; link.click(); URL.revokeObjectURL(url);
      }
      closeModal(); toast(copy.savedJson);
    } catch (error) { if (error?.name !== "AbortError") setModalStatus(fmt(copy.failed, { error: error?.message }), true); }
  }

  function chooseJsonImport() {
    const input = document.createElement("input"); input.type = "file"; input.accept = "application/json,.json";
    input.addEventListener("change", async () => {
      try { const parsed = JSON.parse(await input.files?.[0]?.text()); showImportPreview(parsed); }
      catch { setModalStatus(t().invalid, true); }
    }, { once: true }); input.click();
  }

  function showImportPreview(bundle) {
    let validated; try { validated = validateBundle(bundle); } catch (error) { setModalStatus(error?.message || t().invalid, true); return; }
    modalState.bundle = bundle; const copy = t(); modal.body.replaceChildren(); setModalStatus("");
    const preview = document.createElement("div"); preview.className = "workspace-import-preview";
    preview.textContent = fmt(copy.preview, { n: validated.presets.length, names: validated.presets.map((item) => item.name).join(", ") });
    const actions = document.createElement("div"); actions.className = "workspace-modal-actions";
    const add = document.createElement("button"); add.type = "button"; add.textContent = copy.addMode;
    const replace = document.createElement("button"); replace.type = "button"; replace.textContent = copy.replaceMode;
    const cancel = document.createElement("button"); cancel.type = "button"; cancel.textContent = copy.cancel;
    actions.append(add, replace, cancel); modal.body.append(preview, actions);
    add.addEventListener("click", () => finishImport("add")); replace.addEventListener("click", () => finishImport("replace")); cancel.addEventListener("click", closeModal);
  }

  async function finishImport(mode) {
    try { if (await importBundle(modalState.bundle, mode)) { closeModal(); toast(t().imported); } }
    catch (error) { setModalStatus(fmt(t().failed, { error: error?.message || "Unknown error" }), true); }
  }

  function toast(message, error = false) {
    const node = document.createElement("div"); node.className = "workspace-preset-toast"; node.textContent = String(message || "");
    if (error) node.style.background = "#8e1830"; document.body.appendChild(node); window.setTimeout(() => node.remove(), 4200);
  }

}

function sanitizeConfig(config) {
  const safe = { values: {}, checks: {}, panes: {} };
  VALUE_IDS.forEach((id) => {
    if (Object.prototype.hasOwnProperty.call(config?.values || {}, id)) safe.values[id] = String(config.values[id] ?? "").slice(0, 300);
  });
  CHECKBOX_IDS.forEach((id) => {
    if (Object.prototype.hasOwnProperty.call(config?.checks || {}, id)) safe.checks[id] = Boolean(config.checks[id]);
  });
  ["redactorOpen", "secondaryNoteOpen"].forEach((id) => {
    if (Object.prototype.hasOwnProperty.call(config?.panes || {}, id)) safe.panes[id] = Boolean(config.panes[id]);
  });
  return safe;
}

function bootWorkspacePresets() {
  if (window.__workspacePresetFrame) {
    initFrameRuntime();
    return;
  }

  // ES modules with dependency graphs do not guarantee that this module's
  // DOMContentLoaded listener runs after main.js has finished registering its
  // window.__app actions. Preset 1 uses the native page runtime and captures
  // those actions during manager installation, so binding even one tick too
  // early leaves its Mini Panel command bridge permanently empty.
  let attempts = 0;
  const waitForNativeActions = () => {
    const app = window.__app;
    const ready = [
      "startRecording", "stopRecording", "pauseResumeRecording",
      "abortRecording", "getMiniPanelState", "setAutoGenerateEnabled",
      "setUsePromptEnabled", "setSelectedPromptSlot", "switchNoteProvider",
    ].every((name) => typeof app?.[name] === "function");

    if (ready) {
      initTopLevelManager();
      return;
    }

    attempts += 1;
    if (attempts < 200) {
      window.setTimeout(waitForNativeActions, 25);
      return;
    }

    console.error("[workspace-presets] Native app actions were not ready; preset manager was not started.");
  };

  waitForNativeActions();
}

// main.js also registers from DOMContentLoaded. bootWorkspacePresets performs
// an explicit readiness check because listener ordering alone is insufficient.
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootWorkspacePresets, { once: true });
} else {
  bootWorkspacePresets();
}
