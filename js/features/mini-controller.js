// js/features/mini-controller.js
//
// Floating mini controller for transcribe.html
// - Opens a Document Picture-in-Picture window when available
// - Falls back to a small popup window when PiP is unavailable
// - Reuses the existing main-page controller on window.__app
// - Listens for app events and mirrors state in the mini panel
// - Includes prompt slot selector (number + title only)

const MINI_PANEL_WINDOW_NAME = 'whisperazure-mini-panel';
const MINI_PANEL_WIDTH = 370;
const MINI_PANEL_HEIGHT = 255;
const STATE_REFRESH_MS = 350;
const AUTO_COPY_DOWNLOAD_HREF = 'div/autocopy.zip';
const MINI_HUB_CHANNEL_NAME = 'whisperazure-mini-panel-hub';
const MINI_HUB_TAB_ID_KEY = 'mini_panel_tab_id';
// Safety fallback only. Normal tab removal should happen via `mini-hub-tab-closed`.
const MINI_HUB_STALE_MS = 10 * 60 * 1000;
const MINI_HUB_HEARTBEAT_MS = 10000;

let miniWindow = null;
let refreshTimer = null;
let appRef = null;
let copiedVisible = false;
let hubChannel = null;
let hubHeartbeatTimer = null;
let localTabId = '';
let selectedHubTabId = '';
const hubTabs = new Map();
let nextHubTabOrder = 1;

function getApp() {
  return window.__app || appRef || null;
}

function canUseDocumentPiP() {
  return !!(
    window.documentPictureInPicture &&
    typeof window.documentPictureInPicture.requestWindow === 'function'
  );
}

function isMiniWindowOpen() {
  return !!miniWindow && !miniWindow.closed;
}

function emitMiniPanelStatus(detail) {
  try {
    window.dispatchEvent(new CustomEvent('mini-panel:status', { detail }));
  } catch (_) {}
}

function getPageLanguage() {
  const lang =
    document.documentElement?.lang ||
    localStorage.getItem('selectedLanguage') ||
    'en';
  return String(lang || 'en').toLowerCase();
}

function tMini(key) {
  const lang = getPageLanguage();

  const dict = {
    copied: {
      en: 'Copied!',
      no: 'Kopiert!',
      nb: 'Kopiert!',
      nn: 'Kopiert!',
      sv: 'Kopierad!',
      da: 'Kopieret!',
      de: 'Kopiert!',
      fr: 'Copié !',
      it: 'Copiato!',
    },
    copyFailed: {
      en: 'Copy failed',
      no: 'Kopiering feilet',
      nb: 'Kopiering feilet',
      nn: 'Kopiering feila',
      sv: 'Kopiering misslyckades',
      da: 'Kopiering mislykkedes',
      de: 'Kopieren fehlgeschlagen',
      fr: 'Échec de la copie',
      it: 'Copia non riuscita',
    },
    idle: {
      en: 'Idle',
      no: 'Klar',
      nb: 'Klar',
      nn: 'Klar',
      sv: 'Klar',
      da: 'Klar',
      de: 'Bereit',
      fr: 'Prêt',
      it: 'Pronto',
    },
    recording: {
      en: 'Recording',
      no: 'Opptak',
      nb: 'Opptak',
      nn: 'Opptak',
      sv: 'Inspelning',
      da: 'Optager',
      de: 'Aufnahme',
      fr: 'Enregistrement',
      it: 'Registrazione',
    },
    generatingTranscript: {
      en: 'Generating transcript',
      no: 'Genererer transkripsjon',
      nb: 'Genererer transkripsjon',
      nn: 'Genererer transkripsjon',
      sv: 'Genererar transkription',
      da: 'Genererer transskription',
      de: 'Transkript wird erstellt',
      fr: 'Génération de la transcription',
      it: 'Generazione trascrizione',
    },
    transcriptCompleted: {
      en: 'Transcript completed',
      no: 'Transkripsjon fullført',
      nb: 'Transkripsjon fullført',
      nn: 'Transkripsjon fullført',
      sv: 'Transkription klar',
      da: 'Transskription klar',
      de: 'Transkript fertig',
      fr: 'Transcription terminée',
      it: 'Trascrizione completata',
    },
    generatingNote: {
      en: 'Generating note',
      no: 'Genererer notat',
      nb: 'Genererer notat',
      nn: 'Genererer notat',
      sv: 'Genererar anteckning',
      da: 'Genererer note',
      de: 'Notiz wird erstellt',
      fr: 'Génération de la note',
      it: 'Generazione nota',
    },
    noteCompleted: {
      en: 'Note completed',
      no: 'Notat fullført',
      nb: 'Notat fullført',
      nn: 'Notat fullført',
      sv: 'Anteckning klar',
      da: 'Note klar',
      de: 'Notiz fertig',
      fr: 'Note terminée',
      it: 'Nota completata',
    },
    recordingAborted: {
      en: 'Aborted',
      no: 'Avbrutt',
      nb: 'Avbrutt',
      nn: 'Avbroten',
      sv: 'Avbruten',
      da: 'Afbrydt',
      de: 'Abgebrochen',
      fr: 'Interrompu',
      it: 'Interrotto',
    },
    paused: {
      en: 'Paused',
      no: 'Pauset',
      nb: 'Pauset',
      nn: 'Pausa',
      sv: 'Pausad',
      da: 'Pauset',
      de: 'Pausiert',
      fr: 'En pause',
      it: 'In pausa',
    },
    ready: {
      en: 'Ready',
      no: 'Klar',
      nb: 'Klar',
      nn: 'Klar',
      sv: 'Redo',
      da: 'Klar',
      de: 'Bereit',
      fr: 'Prêt',
      it: 'Pronto',
    },
    autoGenerate: {
      en: 'Auto-generate',
      no: 'Auto-generer',
      nb: 'Auto-generer',
      nn: 'Auto-generer',
      sv: 'Auto-generera',
      da: 'Auto-generer',
      de: 'Automatisch generieren',
      fr: 'Génération auto',
      it: 'Generazione auto',
    },
    autoCopy: {
      en: 'Auto-copy',
      no: 'Auto-kopi',
      nb: 'Auto-kopi',
      nn: 'Auto-kopi',
      sv: 'Autokopiera',
      da: 'Auto-kopi',
      de: 'Automatisch kopieren',
      fr: 'Copie auto',
      it: 'Copia automatica',
    },
    autoCopyHelpShort: {
      en: 'Chrome extension required',
      no: 'Chrome-utvidelse kreves',
      nb: 'Chrome-utvidelse kreves',
      nn: 'Chrome-utviding krevst',
      sv: 'Chrome-tillägg krävs',
      da: 'Chrome-udvidelse kræves',
      de: 'Chrome-Erweiterung erforderlich',
      fr: 'Extension Chrome requise',
      it: 'Estensione Chrome richiesta',
    },
    miniPanel: {
      en: 'Mini panel',
      no: 'Mini-panel',
      nb: 'Mini-panel',
      nn: 'Mini-panel',
      sv: 'Mini-panel',
      da: 'Mini-panel',
      de: 'Mini-Panel',
      fr: 'Mini-panneau',
      it: 'Mini pannello',
    },
    prompt: {
      en: 'Prompt',
      no: 'Prompt',
      nb: 'Prompt',
      nn: 'Prompt',
      sv: 'Prompt',
      da: 'Prompt',
      de: 'Prompt',
      fr: 'Prompt',
      it: 'Prompt',
    },
    usePrompt: {
      en: 'Use',
      no: 'Bruk',
      nb: 'Bruk',
      nn: 'Bruk',
      sv: 'Använd',
      da: 'Brug',
      de: 'Nutzen',
      fr: 'Utiliser',
      it: 'Usa',
    },
    untitled: {
      en: 'Untitled',
      no: 'Uten tittel',
      nb: 'Uten tittel',
      nn: 'Utan tittel',
      sv: 'Utan titel',
      da: 'Uden titel',
      de: 'Ohne Titel',
      fr: 'Sans titre',
      it: 'Senza titolo',
    },
    start: {
      en: 'Start',
      no: 'Start',
      nb: 'Start',
      nn: 'Start',
      sv: 'Start',
      da: 'Start',
      de: 'Start',
      fr: 'Démarrer',
      it: 'Avvia',
    },
    stop: {
      en: 'Stop',
      no: 'Stopp',
      nb: 'Stopp',
      nn: 'Stopp',
      sv: 'Stoppa',
      da: 'Stop',
      de: 'Stopp',
      fr: 'Arrêter',
      it: 'Stop',
    },
    pause: {
      en: 'Pause',
      no: 'Pause',
      nb: 'Pause',
      nn: 'Pause',
      sv: 'Pausa',
      da: 'Pause',
      de: 'Pause',
      fr: 'Pause',
      it: 'Pausa',
    },
    abort: {
      en: 'Abort',
      no: 'Avbryt',
      nb: 'Avbryt',
      nn: 'Avbryt',
      sv: 'Avbryt',
      da: 'Afbryd',
      de: 'Abbrechen',
      fr: 'Annuler',
      it: 'Interrompi',
    },
    off: {
      en: 'Off',
      no: 'Av',
      nb: 'Av',
      nn: 'Av',
      sv: 'Av',
      da: 'Fra',
      de: 'Aus',
      fr: 'Off',
      it: 'Off',
    },
    transcript: {
      en: 'Transcript',
      no: 'Transkripsjon',
      nb: 'Transkripsjon',
      nn: 'Transkripsjon',
      sv: 'Transkription',
      da: 'Transskription',
      de: 'Transkript',
      fr: 'Transcription',
      it: 'Trascrizione',
    },
    note: {
      en: 'Note',
      no: 'Notat',
      nb: 'Notat',
      nn: 'Notat',
      sv: 'Anteckning',
      da: 'Note',
      de: 'Notiz',
      fr: 'Note',
      it: 'Nota',
    },
    copyTranscript: {
      en: 'Copy transcript',
      no: 'Kopier transkripsjon',
      nb: 'Kopier transkripsjon',
      nn: 'Kopier transkripsjon',
      sv: 'Kopiera transkription',
      da: 'Kopiér transskription',
      de: 'Transkript kopieren',
      fr: 'Copier la transcription',
      it: 'Copia trascrizione',
    },
    copyNote: {
      en: 'Copy note',
      no: 'Kopier notat',
      nb: 'Kopier notat',
      nn: 'Kopier notat',
      sv: 'Kopiera anteckning',
      da: 'Kopiér note',
      de: 'Notiz kopieren',
      fr: 'Copier la note',
      it: 'Copia nota',
    },
    currentTab: {
      en: 'Tab',
      no: 'Fane',
      nb: 'Fane',
      nn: 'Fane',
      sv: 'Flik',
      da: 'Fane',
      de: 'Tab',
      fr: 'Onglet',
      it: 'Scheda',
    },
    noTabsOpen: {
      en: 'No active tabs',
      no: 'Ingen aktive faner',
      nb: 'Ingen aktive faner',
      nn: 'Ingen aktive faner',
      sv: 'Inga aktiva flikar',
      da: 'Ingen aktive faner',
      de: 'Keine aktiven Tabs',
      fr: 'Aucun onglet actif',
      it: 'Nessuna scheda attiva',
    },
    noTabSelected: {
      en: 'Choose a tab',
      no: 'Velg en fane',
      nb: 'Velg en fane',
      nn: 'Vel ei fane',
      sv: 'Välj en flik',
      da: 'Vælg en fane',
      de: 'Tab auswählen',
      fr: 'Choisir un onglet',
      it: 'Scegli una scheda',
    },
    sharedMiniPanel: {
      en: 'Mini panel',
      no: 'Minipanel',
      nb: 'Minipanel',
      nn: 'Minipanel',
      sv: 'Minipanel',
      da: 'Minipanel',
      de: 'Minifenster',
      fr: 'Mini panneau',
      it: 'Mini pannello',
    },
  };

  const row = dict[key] || {};
  return row[lang] || row[lang.split('-')[0]] || row.en || key;
}

function getSafeState() {
  const app = getApp();
  if (!app || typeof app.getMiniPanelState !== 'function') {
    return {
      transcribeBusy: false,
      noteBusy: false,
      canStart: false,
      canStop: false,
      canPauseResume: false,
      canAbort: false,
      hasTranscript: false,
      hasNote: false,
      statusText: '',
      pauseResumeLabel: 'Pause',
      autoGenerateEnabled: false,
      autoCopyMode: 'off',
      miniPanelStatusPhase: 'idle',
      usePromptEnabled: false,
    };
  }

  try {
    return app.getMiniPanelState() || {};
  } catch (_) {
    return {
      transcribeBusy: false,
      noteBusy: false,
      canStart: false,
      canStop: false,
      canPauseResume: false,
      canAbort: false,
      hasTranscript: false,
      hasNote: false,
      statusText: '',
      pauseResumeLabel: 'Pause',
      autoGenerateEnabled: false,
      autoCopyMode: 'off',
      miniPanelStatusPhase: 'idle',
      usePromptEnabled: false,
    };
  }
}

function getSafePromptOptions() {
  const app = getApp();
  if (!app) {
    return [];
  }

  try {
    const result =
      (typeof app.getMiniPanelPromptOptions === 'function' && app.getMiniPanelPromptOptions()) ||
      (typeof app.getMiniPanelPromptOptionsRich === 'function' && app.getMiniPanelPromptOptionsRich()) ||
      [];
    return Array.isArray(result) ? result : [];
  } catch (_) {
    return [];
  }
}

function getSafeSelectedPromptSlot() {
  const app = getApp();
  if (!app || typeof app.getSelectedPromptSlot !== 'function') {
    return '';
  }

  try {
    return String(app.getSelectedPromptSlot() || '').trim();
  } catch (_) {
    return '';
  }
}

function getOrCreateLocalTabId() {
  if (localTabId) return localTabId;

  try {
    const existing = String(sessionStorage.getItem(MINI_HUB_TAB_ID_KEY) || '').trim();
    if (existing) {
      localTabId = existing;
      return localTabId;
    }
  } catch (_) {}

  const generated =
    (window.crypto?.randomUUID && window.crypto.randomUUID()) ||
    `mini-tab-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  try {
    sessionStorage.setItem(MINI_HUB_TAB_ID_KEY, generated);
  } catch (_) {}

  localTabId = generated;
  return localTabId;
}

function stripPromptNumericPrefix(label) {
  return String(label || '')
    .replace(/^\s*\d+\s*[\.\-:)]\s*/u, '')
    .trim();
}

function getPromptLabelFromOptions(options, selectedSlot) {
  const slot = String(selectedSlot || '').trim();
  const items = Array.isArray(options) ? options : [];
  const match = items
    .map(normalizePromptOptionLabel)
    .filter(Boolean)
    .find((item) => item.id === slot);

  if (!match) return tMini('untitled');

  const cleaned = stripPromptNumericPrefix(match.label);
  return cleaned || tMini('untitled');
}

function buildLocalHubSnapshot() {
  const state = getSafeState();
  let promptOptions = getSafePromptOptions()
    .map(normalizePromptOptionLabel)
    .filter(Boolean);
  const selectedPromptSlot = getSafeSelectedPromptSlot();

  if (!promptOptions.length && selectedPromptSlot) {
    promptOptions = [{ id: selectedPromptSlot, label: `${selectedPromptSlot}. ${tMini('untitled')}` }];
  }

  const promptLabel = getPromptLabelFromOptions(promptOptions, selectedPromptSlot);

  return {
    tabId: getOrCreateLocalTabId(),
    promptLabel,
    selectedPromptSlot,
    promptOptions,
    state,
    updatedAt: Date.now(),
  };
}

function upsertHubTab(snapshot) {
  const tabId = String(snapshot?.tabId || '').trim();
  if (!tabId) return null;

  const prev = hubTabs.get(tabId) || {};
  const next = {
    ...prev,
    ...snapshot,
    tabId,
    tabOrder: Number(prev?.tabOrder || snapshot?.tabOrder || 0) || nextHubTabOrder++,
    updatedAt: Number(snapshot?.updatedAt || Date.now()),
  };

  hubTabs.set(tabId, next);
  return next;
}

function pruneStaleHubTabs() {
  // Safety fallback only. Do not aggressively prune normal background tabs.
  const now = Date.now();
  for (const [tabId, entry] of hubTabs.entries()) {
    const updatedAt = Number(entry?.updatedAt || 0);
    if (!updatedAt || now - updatedAt > MINI_HUB_STALE_MS) {
      hubTabs.delete(tabId);
    }
  }

  if (selectedHubTabId && !hubTabs.has(selectedHubTabId)) {
    const remaining = Array.from(hubTabs.values()).sort((a, b) => {
      const aActivated = Number(a?.activatedAt || 0);
      const bActivated = Number(b?.activatedAt || 0);
      if (bActivated !== aActivated) return bActivated - aActivated;

      const aOrder = Number(a?.tabOrder || 0);
      const bOrder = Number(b?.tabOrder || 0);
      return aOrder - bOrder;
    });
    selectedHubTabId = remaining[0]?.tabId || '';
  }
}

function getOrderedHubTabs() {
  pruneStaleHubTabs();

  return Array.from(hubTabs.values()).sort((a, b) => {
    const aActivated = Number(a?.activatedAt || 0);
    const bActivated = Number(b?.activatedAt || 0);
    if (bActivated !== aActivated) return bActivated - aActivated;

    const aOrder = Number(a?.tabOrder || 0);
    const bOrder = Number(b?.tabOrder || 0);
    return aOrder - bOrder;
  });
}

function ensureSelectedHubTab() {
  pruneStaleHubTabs();

  if (selectedHubTabId && hubTabs.has(selectedHubTabId)) {
    return selectedHubTabId;
  }

  const fallback = getOrderedHubTabs()[0];
  selectedHubTabId = fallback?.tabId || '';
  return selectedHubTabId;
}

function getSelectedHubSnapshot() {
  const tabId = ensureSelectedHubTab();
  if (!tabId) return null;
  return hubTabs.get(tabId) || null;
}

function getDisplayLabelForHubTab(snapshot, index) {
  const ordinal = Number(index) + 1;
  const promptLabel = String(
    snapshot?.promptLabel ||
    snapshot?.selectedPromptLabel ||
    ''
  ).trim() || tMini('untitled');
  return `${tMini('currentTab')} ${ordinal} - ${promptLabel}`;
}

function postHubMessage(message) {
  ensureHubChannel();
  if (!hubChannel) return;

  try {
    hubChannel.postMessage(message);
  } catch (_) {}
}

function publishLocalHubSnapshot(reason = 'state') {
  const snapshot = buildLocalHubSnapshot();
  const previous = hubTabs.get(snapshot.tabId);
  const hasIncomingPrompts = Array.isArray(snapshot.promptOptions) && snapshot.promptOptions.length > 0;
  const hasPreviousPrompts = Array.isArray(previous?.promptOptions) && previous.promptOptions.length > 0;

  // Do not let an incomplete heartbeat wipe out a previously good prompt snapshot.
  if (!hasIncomingPrompts && hasPreviousPrompts) {
    snapshot.promptOptions = previous.promptOptions;
    snapshot.selectedPromptSlot = snapshot.selectedPromptSlot || previous.selectedPromptSlot || '';
    snapshot.promptLabel =
      snapshot.promptLabel && snapshot.promptLabel !== tMini('untitled')
        ? snapshot.promptLabel
        : (previous.promptLabel || tMini('untitled'));
  }

  upsertHubTab(snapshot);

  postHubMessage({
    type: 'mini-hub-tab-state',
    reason,
    snapshot,
  });
}

function activateLocalHubTab(reason = 'activate') {
  const tabId = getOrCreateLocalTabId();
  const existing = hubTabs.get(tabId) || {};
  const snapshot = {
    ...existing,
    ...buildLocalHubSnapshot(),
    activatedAt: Date.now(),
  };

  const hasIncomingPrompts = Array.isArray(snapshot.promptOptions) && snapshot.promptOptions.length > 0;
  const hasExistingPrompts = Array.isArray(existing?.promptOptions) && existing.promptOptions.length > 0;
  if (!hasIncomingPrompts && hasExistingPrompts) {
    snapshot.promptOptions = existing.promptOptions;
    snapshot.selectedPromptSlot = snapshot.selectedPromptSlot || existing.selectedPromptSlot || '';
    snapshot.promptLabel =
      snapshot.promptLabel && snapshot.promptLabel !== tMini('untitled')
        ? snapshot.promptLabel
        : (existing.promptLabel || tMini('untitled'));
  }

  upsertHubTab(snapshot);
  selectedHubTabId = tabId;

  postHubMessage({
    type: 'mini-hub-activate-tab',
    reason,
    tabId,
    activatedAt: snapshot.activatedAt,
    snapshot,
  });
}

function removeLocalHubTab() {
  const tabId = getOrCreateLocalTabId();
  hubTabs.delete(tabId);

  postHubMessage({
    type: 'mini-hub-tab-closed',
    tabId,
    at: Date.now(),
  });
}

function ensureHubChannel() {
  if (hubChannel || typeof BroadcastChannel !== 'function') return hubChannel;

  try {
    hubChannel = new BroadcastChannel(MINI_HUB_CHANNEL_NAME);
  } catch (_) {
    hubChannel = null;
    return null;
  }

  hubChannel.addEventListener('message', (event) => {
    const data = event?.data || {};
    const type = String(data?.type || '').trim();

    if (!type) return;

    if (type === 'mini-hub-tab-state') {
      upsertHubTab(data.snapshot || null);
      ensureSelectedHubTab();
      requestUiRefresh();
      return;
    }

    if (type === 'mini-hub-activate-tab') {
      const tabId = String(data?.tabId || '').trim();
      const snapshot = data?.snapshot || null;
      if (snapshot) {
        upsertHubTab({
          ...snapshot,
          activatedAt: Number(data?.activatedAt || Date.now()),
        });
      }
      if (tabId) {
        selectedHubTabId = tabId;
      }
      requestUiRefresh();
      return;
    }

    if (type === 'mini-hub-tab-closed') {
      const tabId = String(data?.tabId || '').trim();
      if (tabId) {
        hubTabs.delete(tabId);
        if (selectedHubTabId === tabId) {
          selectedHubTabId = '';
          ensureSelectedHubTab();
        }
      }
      requestUiRefresh();
      return;
    }

    if (type === 'mini-hub-command') {
      const targetTabId = String(data?.targetTabId || '').trim();
      if (!targetTabId || targetTabId !== getOrCreateLocalTabId()) return;

      const actionName = String(data?.actionName || '').trim();
      const args = Array.isArray(data?.args) ? data.args : [];
      callLocalAppAction(actionName, ...args);
      publishLocalHubSnapshot(`command:${actionName}`);
    }
  });

  return hubChannel;
}

function startHubHeartbeat() {
  if (hubHeartbeatTimer) return;
  hubHeartbeatTimer = window.setInterval(() => {
    publishLocalHubSnapshot('heartbeat');
  }, MINI_HUB_HEARTBEAT_MS);
}

function stopHubHeartbeat() {
  if (!hubHeartbeatTimer) return;
  window.clearInterval(hubHeartbeatTimer);
  hubHeartbeatTimer = null;
}

function getMiniDoc() {
  if (!isMiniWindowOpen()) return null;
  try {
    return miniWindow.document || null;
  } catch (_) {
    return null;
  }
}

function $(id) {
  const doc = getMiniDoc();
  if (!doc) return null;
  return doc.getElementById(id);
}

function setText(id, text) {
  const el = $(id);
  if (el) {
    el.textContent = text;
  }
}

function setDisabled(id, disabled) {
  const el = $(id);
  if (el) {
    el.disabled = !!disabled;
  }
}

function setChecked(id, checked) {
  const el = $(id);
  if (el && 'checked' in el) {
    el.checked = !!checked;
  }
}

function setValue(id, value) {
  const el = $(id);
  if (el && 'value' in el) {
    el.value = value;
  }
}

function setBadge(text, tone) {
  const badge = $('miniStatusBadge');
  if (!badge) return;
  badge.textContent = text;
  badge.dataset.tone = tone;
}

function formatElapsedMs(ms) {
  const totalSeconds = Math.max(0, Math.floor(Number(ms || 0) / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function computeRecordingElapsedMs(state) {
  const accumulatedMs = Number(state?.recordingAccumulatedMs || 0);
  const startedAt = Number(state?.recordingStartedAt || 0);

  if (startedAt > 0) {
    return accumulatedMs + Math.max(0, Date.now() - startedAt);
  }
  return accumulatedMs;
}

function updateMiniRecordingTimer(state) {
  const timerEl = $('miniRecordingTimer');
  if (!timerEl) return;

  const phase = String(state?.miniPanelStatusPhase || '').trim();
  const shouldShow =
    phase === 'recording' ||
    phase === 'paused' ||
    Number(state?.recordingAccumulatedMs || 0) > 0 ||
    Number(state?.recordingStartedAt || 0) > 0;

  if (!shouldShow) {
    timerEl.hidden = true;
    timerEl.textContent = '';
    return;
  }

  timerEl.hidden = false;
  timerEl.textContent = formatElapsedMs(computeRecordingElapsedMs(state));
}

function hideCopiedIndicator() {
  copiedVisible = false;
  const indicator = $('miniCopiedIndicator');
  if (!indicator) return;
  indicator.hidden = true;
  indicator.dataset.show = '0';
}

function showCopiedIndicator() {
  copiedVisible = true;
  const indicator = $('miniCopiedIndicator');
  if (!indicator) return;
  indicator.hidden = false;
  indicator.textContent = tMini('copied');
  indicator.dataset.show = '1';
}

function showCopyFailedIndicator() {
  copiedVisible = true;
  const indicator = $('miniCopiedIndicator');
  if (!indicator) return;
  indicator.hidden = false;
  indicator.textContent = tMini('copyFailed');
  indicator.dataset.show = '1';
}

function normalizePromptOptionLabel(item) {
  const id = String(item?.id || '').trim();
  let label = String(item?.label || '').trim();

  if (!id) return null;

  if (!label) {
    label = `${id}. ${tMini('untitled')}`;
  } else if (label === `${id}.`) {
    label = `${id}. ${tMini('untitled')}`;
  } else if (!label.startsWith(`${id}.`)) {
    label = `${id}. ${label}`;
  }

  return { id, label };
}

function syncPromptDropdown(snapshot) {
  const select = $('miniPromptSelect');
  if (!select) return;

  const options = Array.isArray(snapshot?.promptOptions)
    ? snapshot.promptOptions.map(normalizePromptOptionLabel).filter(Boolean)
    : [];
  const selected = String(snapshot?.selectedPromptSlot || '').trim();

  const existingSignature = Array.from(select.options)
    .map((opt) => `${opt.value}|${opt.textContent}`)
    .join('||');
  const nextSignature = options
    .map((opt) => `${opt.id}|${opt.label}`)
    .join('||');

  if (existingSignature !== nextSignature) {
    select.innerHTML = '';
    options.forEach((opt) => {
      const optionEl = select.ownerDocument.createElement('option');
      optionEl.value = opt.id;
      optionEl.textContent = opt.label;
      select.appendChild(optionEl);
    });
  }

  if (selected) {
    select.value = selected;
  }

  if (!select.value && options.length) {
    select.value = options[0].id;
  }

  select.disabled = options.length === 0;
}

function updateSelectedHubSnapshot(mutator) {
  const tabId = ensureSelectedHubTab();
  if (!tabId) return;

  const prev = hubTabs.get(tabId);
  if (!prev) return;

  const next = typeof mutator === 'function' ? mutator(prev) : prev;
  if (!next || next === prev) return;

  hubTabs.set(tabId, {
    ...next,
    updatedAt: Date.now(),
  });
}

function syncHubTabDropdown() {
  const select = $('miniTabSelect');
  if (!select) return;

  const tabs = getOrderedHubTabs();
  const desired = tabs.map((item, index) => ({
    value: item.tabId,
    label: getDisplayLabelForHubTab(item, index),
  }));

  const existingSignature = Array.from(select.options)
    .map((opt) => `${opt.value}|${opt.textContent}`)
    .join('||');
  const nextSignature = desired
    .map((opt) => `${opt.value}|${opt.label}`)
    .join('||');

  if (existingSignature !== nextSignature) {
    select.innerHTML = '';

    if (!desired.length) {
      const option = select.ownerDocument.createElement('option');
      option.value = '';
      option.textContent = tMini('noTabsOpen');
      select.appendChild(option);
    } else {
      desired.forEach((item) => {
        const option = select.ownerDocument.createElement('option');
        option.value = item.value;
        option.textContent = item.label;
        select.appendChild(option);
      });
    }
  }

  const selected = ensureSelectedHubTab();
  select.value = selected || '';
  select.disabled = desired.length <= 1;
}

function syncAutoCopyOptions() {
  const select = $('miniAutoCopyModeSelect');
  if (!select) return;

  const desired = [
    { value: 'off', label: tMini('off') },
    { value: 'transcript', label: tMini('transcript') },
    { value: 'note', label: tMini('note') },
  ];

  const existingSignature = Array.from(select.options)
    .map((opt) => `${opt.value}|${opt.textContent}`)
    .join('||');
  const nextSignature = desired.map((opt) => `${opt.value}|${opt.label}`).join('||');

  if (existingSignature === nextSignature) return;

  select.innerHTML = '';
  desired.forEach((opt) => {
    const optionEl = select.ownerDocument.createElement('option');
    optionEl.value = opt.value;
    optionEl.textContent = opt.label;
    select.appendChild(optionEl);
  });
}

function getMiniPhasePresentation(state) {
  const phase = String(state?.miniPanelStatusPhase || 'idle').trim();

  switch (phase) {
    case 'recording':
      return { badge: tMini('recording'), text: tMini('recording'), tone: 'recording' };
    case 'paused':
      return { badge: tMini('paused'), text: tMini('paused'), tone: 'paused' };
    case 'transcribing':
    case 'generating-transcript':
      return {
        badge: tMini('generatingTranscript'),
        text: tMini('generatingTranscript'),
        tone: 'transcribe',
      };
    case 'transcript-completed':
    case 'transcript-complete':
      return {
        badge: tMini('transcriptCompleted'),
        text: tMini('transcriptCompleted'),
        tone: 'ready',
      };
    case 'note-generating':
      return {
        badge: tMini('generatingNote'),
        text: tMini('generatingNote'),
        tone: 'transcribe',
      };
    case 'note-completed':
      return {
        badge: tMini('noteCompleted'),
        text: tMini('noteCompleted'),
        tone: 'ready',
      };
    case 'aborted':
      return { badge: tMini('recordingAborted'), text: tMini('recordingAborted'), tone: 'aborted' };
    default:
      return { badge: tMini('idle'), text: tMini('ready'), tone: 'idle' };
  }
}

function updateMiniPanelUi() {
  const doc = getMiniDoc();
  if (!doc) return;

  pruneStaleHubTabs();
  syncHubTabDropdown();

  const snapshot = getSelectedHubSnapshot();
  const state = snapshot?.state || {
    canStart: false,
    canStop: false,
    canPauseResume: false,
    canAbort: false,
    hasTranscript: false,
    hasNote: false,
    statusText: '',
    pauseResumeLabel: tMini('pause'),
    autoGenerateEnabled: false,
    autoCopyMode: 'off',
    autoCopyExtensionAvailable: false,
    miniPanelStatusPhase: 'idle',
    usePromptEnabled: false,
  };
  const statusText = String(state.statusText || '').trim();
  const pauseResumeLabel = String(state.pauseResumeLabel || '').trim() || tMini('pause');
  const phaseUi = getMiniPhasePresentation(state);

  setDisabled('miniStartButton', !state.canStart);
  setDisabled('miniStopButton', !state.canStop);
  setDisabled('miniPauseButton', !state.canPauseResume);
  setDisabled('miniCopyTranscriptButton', !state.hasTranscript);
  setDisabled('miniCopyNoteButton', !state.hasNote);
  setDisabled('miniAbortButton', !state.canAbort);

  setText('miniStartButton', tMini('start'));
  setText('miniStopButton', tMini('stop'));
  setText('miniPauseButton', pauseResumeLabel);
  setText('miniCopyTranscriptButton', tMini('copyTranscript'));
  setText('miniCopyNoteButton', tMini('copyNote'));
  setText('miniAbortButton', tMini('abort'));
  setText(
    'miniStatusText',
    statusText || phaseUi?.text || (snapshot ? tMini('ready') : tMini('noTabSelected'))
  );
  setText('miniTitle', tMini('sharedMiniPanel'));
  setText('miniAutoGenerateLabel', tMini('autoGenerate'));
  setText('miniAutoCopyLabel', tMini('autoCopy'));
  setText('miniPromptLabel', tMini('prompt'));
  setText('miniUsePromptLabel', tMini('usePrompt'));

  setChecked('miniAutoGenerateToggle', !!state.autoGenerateEnabled);
  setChecked('miniUsePromptToggle', !!state.usePromptEnabled);

  syncAutoCopyOptions();
  setValue('miniAutoCopyModeSelect', state.autoCopyMode || 'off');
  setDisabled('miniAutoCopyModeSelect', !state.autoCopyExtensionAvailable);

  const miniAutoCopyHelp = $('miniAutoCopyHelp');
  if (miniAutoCopyHelp) {
    miniAutoCopyHelp.title =
      state.autoCopyExtensionAvailable
        ? ''
        : `Chrome extension required.\n\nDownload: ${AUTO_COPY_DOWNLOAD_HREF}\nUnzip it, read the README, then load the unpacked folder in chrome://extensions and refresh the page.\n\nWhen Auto-generate is turned on, Auto-copy switches to Note.\nWhen Auto-generate is turned off, Auto-copy switches to Transcript.\n\nYou can still change Auto-copy manually afterward. That manual choice stays active until Auto-generate is toggled again.`;
    miniAutoCopyHelp.setAttribute('aria-label', tMini('autoCopyHelpShort'));
  }

  if (phaseUi) {
    setBadge(phaseUi.badge, phaseUi.tone);
  } else {
    setBadge(tMini('idle'), 'idle');
  }

  updateMiniRecordingTimer(state);

  const indicator = $('miniCopiedIndicator');
  if (indicator) {
    if (copiedVisible) {
      indicator.hidden = false;
      indicator.dataset.show = '1';
    } else {
      indicator.hidden = true;
      indicator.dataset.show = '0';
    }
  }

  syncPromptDropdown(snapshot);
}

function requestUiRefresh() {
  window.setTimeout(updateMiniPanelUi, 20);
  window.setTimeout(updateMiniPanelUi, 120);
  window.setTimeout(updateMiniPanelUi, 300);
}

function startRefreshLoop() {
  stopRefreshLoop();
  refreshTimer = window.setInterval(updateMiniPanelUi, STATE_REFRESH_MS);
}

function stopRefreshLoop() {
  if (refreshTimer) {
    window.clearInterval(refreshTimer);
    refreshTimer = null;
  }
}

function callLocalAppAction(actionName, ...args) {
  const app = getApp();
  if (!app || typeof app[actionName] !== 'function') return false;

  try {
    app[actionName](...args);
    requestUiRefresh();
    return true;
  } catch (err) {
    console.warn(`[mini-panel] action failed: ${actionName}`, err);
    return false;
  }
}

function dispatchHubAction(actionName, ...args) {
  const targetTabId = ensureSelectedHubTab();
  if (!targetTabId) return false;

  if (targetTabId === getOrCreateLocalTabId()) {
    return callLocalAppAction(actionName, ...args);
  }

  postHubMessage({
    type: 'mini-hub-command',
    targetTabId,
    actionName,
    args,
    at: Date.now(),
  });

  requestUiRefresh();
  return true;
}

function bindMiniPanelEvents() {
  const startButton = $('miniStartButton');
  const stopButton = $('miniStopButton');
  const pauseButton = $('miniPauseButton');
  const copyTranscriptButton = $('miniCopyTranscriptButton');
  const copyNoteButton = $('miniCopyNoteButton');
  const abortButton = $('miniAbortButton');
  const closeButton = $('miniCloseButton');
  const promptSelect = $('miniPromptSelect');
  const tabSelect = $('miniTabSelect');
  const autoGenerateToggle = $('miniAutoGenerateToggle');
  const autoCopyModeSelect = $('miniAutoCopyModeSelect');
  const usePromptToggle = $('miniUsePromptToggle');

  if (startButton) {
    startButton.addEventListener('click', () => {
      dispatchHubAction('startRecording');
      updateSelectedHubSnapshot((prev) => ({
        ...prev,
        state: {
          ...(prev.state || {}),
          canStart: false,
          canStop: true,
          canPauseResume: true,
          canAbort: true,
          miniPanelStatusPhase: 'recording',
          statusText: 'Listening for speech...',
          recordingStartedAt: Date.now(),
          recordingPausedAt: 0,
          recordingAccumulatedMs: 0,
        },
      }));
      requestUiRefresh();
    });
  }

  if (stopButton) {
    stopButton.addEventListener('click', () => {
      dispatchHubAction('stopRecording');
      updateSelectedHubSnapshot((prev) => {
        const prevState = prev.state || {};
        const startedAt = Number(prevState.recordingStartedAt || 0);
        const accumulatedMs = Number(prevState.recordingAccumulatedMs || 0);
        const elapsedMs = startedAt > 0 ? accumulatedMs + Math.max(0, Date.now() - startedAt) : accumulatedMs;

        return {
          ...prev,
          state: {
            ...prevState,
            canStart: false,
            canStop: false,
            canPauseResume: false,
            canAbort: true,
            miniPanelStatusPhase: 'transcribing',
            statusText: 'Generating transcript...',
            recordingStartedAt: 0,
            recordingPausedAt: 0,
            recordingAccumulatedMs: elapsedMs,
          },
        };
      });
      requestUiRefresh();
    });
  }

  if (pauseButton) {
    pauseButton.addEventListener('click', () => {
      dispatchHubAction('pauseResumeRecording');
      updateSelectedHubSnapshot((prev) => {
        const prevState = prev.state || {};
        const pauseLabel = String(prevState.pauseResumeLabel || '').trim().toLowerCase();
        const isGoingToPause = !/resume/.test(pauseLabel);
        const now = Date.now();
        const startedAt = Number(prevState.recordingStartedAt || 0);
        const accumulatedMs = Number(prevState.recordingAccumulatedMs || 0);

        if (isGoingToPause) {
          const nextAccumulated = startedAt > 0 ? accumulatedMs + Math.max(0, now - startedAt) : accumulatedMs;
          return {
            ...prev,
            state: {
              ...prevState,
              miniPanelStatusPhase: 'paused',
              statusText: 'Paused',
              pauseResumeLabel: 'Resume',
              recordingStartedAt: 0,
              recordingPausedAt: now,
              recordingAccumulatedMs: nextAccumulated,
            },
          };
        }

        return {
          ...prev,
          state: {
            ...prevState,
            miniPanelStatusPhase: 'recording',
            statusText: 'Listening for speech...',
            pauseResumeLabel: 'Pause',
            recordingStartedAt: now,
            recordingPausedAt: 0,
            recordingAccumulatedMs: accumulatedMs,
          },
        };
      });
      requestUiRefresh();
    });
  }

  if (copyTranscriptButton) {
    copyTranscriptButton.addEventListener('click', () => {
      dispatchHubAction('copyTranscription');
    });
  }

  if (copyNoteButton) {
    copyNoteButton.addEventListener('click', () => {
      dispatchHubAction('copyGeneratedNote');
    });
  }

  if (abortButton) {
    abortButton.addEventListener('click', () => {
      dispatchHubAction('abortRecording');
    });
  }

  if (tabSelect) {
    tabSelect.addEventListener('change', () => {
      const nextTabId = String(tabSelect.value || '').trim();
      if (!nextTabId) return;
      selectedHubTabId = nextTabId;
      requestUiRefresh();
    });
  }

  if (autoGenerateToggle) {
    autoGenerateToggle.addEventListener('change', () => {
      const nextEnabled = !!autoGenerateToggle.checked;
      dispatchHubAction('setAutoGenerateEnabled', nextEnabled);

      updateSelectedHubSnapshot((prev) => ({
        ...prev,
        state: {
          ...(prev.state || {}),
          autoGenerateEnabled: nextEnabled,
          autoCopyMode: nextEnabled ? 'note' : 'transcript',
        },
      }));

      requestUiRefresh();
    });
  }

  if (autoCopyModeSelect) {
    autoCopyModeSelect.addEventListener('change', () => {
      const nextMode = String(autoCopyModeSelect.value || 'off').trim() || 'off';
      dispatchHubAction('setAutoCopyMode', nextMode);

      updateSelectedHubSnapshot((prev) => ({
        ...prev,
        state: {
          ...(prev.state || {}),
          autoCopyMode: nextMode,
        },
      }));

      requestUiRefresh();
    });
  }

  if (usePromptToggle) {
    usePromptToggle.addEventListener('change', () => {
      dispatchHubAction('setUsePromptEnabled', !!usePromptToggle.checked);
    });
  }

  if (promptSelect) {
    promptSelect.addEventListener('change', () => {
      const slot = String(promptSelect.value || '').trim();
      if (!slot) return;
      dispatchHubAction('setSelectedPromptSlot', slot);

      updateSelectedHubSnapshot((prev) => {
        const options = Array.isArray(prev.promptOptions) ? prev.promptOptions : [];
        const selected = options
          .map(normalizePromptOptionLabel)
          .filter(Boolean)
          .find((item) => item.id === slot);

        return {
          ...prev,
          selectedPromptSlot: slot,
          selectedPromptLabel: selected?.label || `${slot}. ${tMini('untitled')}`,
          promptLabel: selected
            ? String(selected.label).replace(/^\s*\d+\s*[\.\-:)]\s*/u, '').trim() || tMini('untitled')
            : tMini('untitled'),
        };
      });

      requestUiRefresh();
    });
  }

  if (closeButton) {
    closeButton.addEventListener('click', () => {
      try {
        miniWindow?.close();
      } catch (_) {}
    });
  }
}

function installMiniPanelAutoScale(targetWindow) {
  if (!targetWindow || targetWindow.__miniPanelScaleBound === true) return;
  targetWindow.__miniPanelScaleBound = true;

  const doc = targetWindow.document;
  const root = doc.documentElement;

  let basePanelHeight = null;

  function applyScale() {
    try {
      const width = Math.max(1, targetWindow.innerWidth || MINI_PANEL_WIDTH);
      const height = Math.max(1, targetWindow.innerHeight || MINI_PANEL_HEIGHT);

      const panel = doc.querySelector('.panel-shell');
      if (!basePanelHeight && panel) {
        basePanelHeight = panel.scrollHeight;
      }

      const effectiveHeight = basePanelHeight || MINI_PANEL_HEIGHT;
      const scaleX = width / MINI_PANEL_WIDTH;
      const scaleY = height / effectiveHeight;
      const scale = Math.min(1, scaleX, scaleY);

      root.style.setProperty('--mini-scale', String(scale));
    } catch (_) {}
  }

  try {
    targetWindow.addEventListener('resize', applyScale);
  } catch (_) {}

  applyScale();
}

function renderMiniPanelDocument(targetWindow) {
  const doc = targetWindow.document;
  doc.open();
  doc.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Mini panel</title>
  <style>
    :root {
      color-scheme: dark;
      --bg: #0e1628;
      --panel: #121d34;
      --border: #2e3a57;
      --text: #eef4ff;
      --muted: #9fb0cd;
      --button: #1a2742;
      --button-border: #40557f;
      --accent: #6fd3a6;
      --warn: #f0c36a;
      --danger: #f38a8a;
      --info: #94b7ff;
      --select-bg: #13203a;
      --mini-scale: 1;
    }

    * { box-sizing: border-box; }

    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      background: var(--bg);
      color: var(--text);
      font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
    }

    body {
      padding: 0;
      overflow: hidden;
    }

    .panel-shell {
      position: absolute;
      top: 0;
      left: 0;
      width: ${MINI_PANEL_WIDTH}px;
      height: auto;
      transform: scale(var(--mini-scale));
      transform-origin: top left;
    }

    .panel {
      height: auto;
      display: flex;
      flex-direction: column;
      gap: 6px;
      background: linear-gradient(180deg, rgba(18,29,52,0.98), rgba(14,22,40,0.98));
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 8px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.35);
    }

    .top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
    }

    .top-left {
      min-width: 0;
      flex: 1 1 auto;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .title {
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.02em;
      color: var(--text);
    }

    .mini-tab-select {
      width: 100%;
      min-width: 0;
      border: 1px solid var(--button-border);
      background: var(--select-bg);
      color: var(--text);
      border-radius: 10px;
      padding: 6px 8px;
      font-size: 11px;
      font-weight: 600;
      min-height: 28px;
      outline: none;
    }

    .mini-tab-select:disabled {
      opacity: 0.65;
      cursor: not-allowed;
    }

    .close-btn {
      border: 1px solid var(--border);
      background: transparent;
      color: var(--muted);
      width: 28px;
      height: 28px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 16px;
      line-height: 1;
    }

    .status-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
      min-height: 24px;
      min-width: 0;
    }

    .status-meta {
      display: flex;
      flex-direction: column;
      gap: 3px;
      margin-bottom: 8px;
    }

    .recording-timer {
      font-size: 12px;
      font-weight: 700;
      color: var(--text);
      letter-spacing: 0.02em;
      font-variant-numeric: tabular-nums;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 22px;
      padding: 0 9px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.01em;
      border: 1px solid transparent;
      background: rgba(255,255,255,0.06);
      color: var(--text);
      white-space: nowrap;
    }

    .badge[data-tone="idle"] {
      background: rgba(148,183,255,0.12);
      border-color: rgba(148,183,255,0.28);
      color: var(--info);
    }

    .badge[data-tone="recording"] {
      background: rgba(111,211,166,0.12);
      border-color: rgba(111,211,166,0.28);
      color: var(--accent);
    }

    .badge[data-tone="paused"] {
      background: rgba(240,195,106,0.12);
      border-color: rgba(240,195,106,0.28);
      color: var(--warn);
    }

    .badge[data-tone="transcribe"] {
      background: rgba(148,183,255,0.12);
      border-color: rgba(148,183,255,0.28);
      color: var(--info);
    }

    .badge[data-tone="ready"] {
      background: rgba(111,211,166,0.12);
      border-color: rgba(111,211,166,0.28);
      color: var(--accent);
    }

    .badge[data-tone="aborted"] {
      background: rgba(243,138,138,0.12);
      border-color: rgba(243,138,138,0.28);
      color: var(--danger);
    }

    .copied {
      font-size: 11px;
      font-weight: 700;
      color: var(--accent);
      opacity: 0;
      transition: opacity 0.18s ease;
      white-space: nowrap;
    }

    .copied[data-show="1"] {
      opacity: 1;
    }

    .status-text {
      min-height: 16px;
      font-size: 10px;
      color: var(--muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .controls-wrap {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .primary-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 6px;
    }

    .copy-row {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 6px;
    }

    .ctrl {
      border: 1px solid var(--button-border);
      background: var(--button);
      color: var(--text);
      min-height: 32px;
      border-radius: 10px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 700;
      padding: 6px 8px;
      transition: border-color 0.15s ease, transform 0.08s ease;
    }

    .ctrl:hover:not(:disabled) {
      border-color: rgba(255,255,255,0.3);
    }

    .ctrl:active:not(:disabled) {
      transform: translateY(1px);
    }

    .ctrl.primary {
      background: rgba(111,211,166,0.14);
      color: var(--accent);
    }

    .ctrl.abort {
      color: var(--danger);
    }

    .ctrl.secondary {
      min-height: 28px;
      padding: 5px 8px;
      font-size: 11px;
      font-weight: 600;
    }

    .ctrl.copy {
      color: var(--accent);
    }

    .ctrl:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }

    .settings-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }

    .setting-group {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      min-width: 0;
    }

    .setting-group--copy {
      flex: 1 1 auto;
      justify-content: flex-end;
    }

    .toggle-label,
    .setting-label {
      font-size: 10px;
      font-weight: 700;
      color: var(--muted);
      line-height: 1.2;
      white-space: nowrap;
    }

    .setting-label-wrap {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      min-width: 0;
    }

    .mini-help-wrap {
      position: relative;
      display: inline-flex;
      align-items: center;
      flex: 0 0 auto;
    }

    .mini-help-wrap::after {
      content: "";
      position: absolute;
      right: -4px;
      bottom: 100%;
      width: 40px;
      height: 10px;
      background: transparent;
    }

    .mini-tooltip {
      position: fixed;
      top: 8px;
      right: 8px;
      z-index: 9999;
      width: min(320px, calc(100vw - 16px));
      max-width: calc(100vw - 16px);
      max-height: calc(100vh - 16px);
      overflow-y: auto;
      padding: 8px 10px;
      border-radius: 10px;
      border: 1px solid var(--border);
      background: var(--panel);
      color: var(--text);
      font-size: 10px;
      line-height: 1.35;
      box-shadow: 0 12px 32px rgba(0,0,0,0.35);
      opacity: 0;
      pointer-events: none;
      transform: translateY(-4px);
      transition: opacity 0.14s ease, transform 0.14s ease;
    }

    .mini-help-wrap:hover .mini-tooltip,
    .mini-help-wrap:focus-within .mini-tooltip {
      opacity: 1;
      pointer-events: auto;
      transform: translateY(0);
    }

    .mini-help {
      width: 16px;
      height: 16px;
      border-radius: 999px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: rgba(148,183,255,0.15);
      border: 1px solid rgba(148,183,255,0.35);
      color: var(--info);
      font-size: 10px;
      font-weight: 800;
      cursor: help;
      user-select: none;
      outline: none;
    }

    .mini-tooltip a {
      color: #9fd7ff;
      text-decoration: underline;
    }

    .mini-tooltip code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 10px;
      color: #cde1ff;
    }

    .mini-select {
      min-width: 110px;
      border: 1px solid var(--button-border);
      background: var(--select-bg);
      color: var(--text);
      border-radius: 10px;
      padding: 6px 8px;
      font-size: 11px;
      font-weight: 600;
      min-height: 28px;
      outline: none;
    }

    .mini-select:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .mini-switch {
      position: relative;
      display: inline-flex;
      align-items: center;
      width: 40px;
      height: 22px;
    }

    .mini-switch input {
      opacity: 0;
      width: 0;
      height: 0;
      position: absolute;
    }

    .mini-slider {
      position: absolute;
      inset: 0;
      background: rgba(255,255,255,0.12);
      border: 1px solid var(--button-border);
      border-radius: 999px;
      transition: background 0.15s ease;
    }

    .mini-slider::before {
      content: "";
      position: absolute;
      left: 2px;
      top: 2px;
      width: 16px;
      height: 16px;
      border-radius: 999px;
      background: #fff;
      transition: transform 0.15s ease;
    }

    .mini-switch input:checked + .mini-slider {
      background: rgba(111,211,166,0.22);
      border-color: rgba(111,211,166,0.35);
    }

    .mini-switch input:checked + .mini-slider::before {
      transform: translateX(18px);
    }

    .prompt-wrap {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      min-width: 0;
    }

    .prompt-left {
      display: flex;
      align-items: center;
      gap: 6px;
      min-width: 0;
      flex: 1 1 74%;
    }

    .prompt-right {
      display: inline-flex;
      align-items: center;
      justify-content: flex-end;
      gap: 6px;
      flex: 0 0 auto;
      min-width: 0;
    }

    .prompt-label {
      font-size: 10px;
      font-weight: 700;
      color: var(--muted);
      line-height: 1.2;
      white-space: nowrap;
    }

    .prompt-select {
      width: 100%;
      min-width: 0;
      border: 1px solid var(--button-border);
      background: var(--select-bg);
      color: var(--text);
      border-radius: 10px;
      padding: 6px 8px;
      font-size: 11px;
      font-weight: 600;
      min-height: 28px;
      outline: none;
    }

    .prompt-select:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .mini-check {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      color: var(--muted);
      font-size: 10px;
      font-weight: 700;
      white-space: nowrap;
      cursor: pointer;
      user-select: none;
    }

    .mini-check input {
      margin: 0;
      width: 13px;
      height: 13px;
      accent-color: var(--accent);
      flex: 0 0 auto;
    }
  </style>
</head>
<body>
  <div class="panel-shell">
    <div class="panel">
      <div class="top">
        <div class="top-left">
          <div id="miniTitle" class="title">Mini panel</div>
          <select id="miniTabSelect" class="mini-tab-select" aria-label="Choose tab"></select>
        </div>
        <button id="miniCloseButton" class="close-btn" type="button" aria-label="Close mini panel">×</button>
      </div>

      <div class="status-row">
        <div id="miniStatusBadge" class="badge" data-tone="idle">Idle</div>
        <div id="miniCopiedIndicator" class="copied" data-show="0" hidden>Copied!</div>
      </div>
      <div class="status-meta">
        <div id="miniStatusText" class="status-text">Ready</div>
        <div id="miniRecordingTimer" class="recording-timer" hidden>00:00</div>
      </div>

      <div class="controls-wrap">
        <div class="primary-grid">
          <button id="miniStartButton" class="ctrl primary" type="button">Start</button>
          <button id="miniPauseButton" class="ctrl" type="button">Pause</button>
          <button id="miniStopButton" class="ctrl" type="button">Stop</button>
          <button id="miniAbortButton" class="ctrl abort" type="button">Abort</button>
        </div>

        <div class="copy-row">
          <button id="miniCopyTranscriptButton" class="ctrl secondary copy" type="button">Copy transcript</button>
          <button id="miniCopyNoteButton" class="ctrl secondary copy" type="button">Copy note</button>
        </div>
      </div>

      <div class="settings-row">
        <div class="setting-group">
          <div id="miniAutoGenerateLabel" class="toggle-label">Auto-generate</div>
          <label class="mini-switch" aria-label="Auto-generate">
            <input id="miniAutoGenerateToggle" type="checkbox" />
            <span class="mini-slider"></span>
          </label>
        </div>
        <div class="setting-group setting-group--copy">
          <div class="setting-label-wrap">
            <label id="miniAutoCopyLabel" class="setting-label" for="miniAutoCopyModeSelect">Auto-copy</label>
            <span class="mini-help-wrap">
  <span
    id="miniAutoCopyHelp"
    class="mini-help"
    tabindex="0"
    aria-describedby="miniAutoCopyTooltip"
    aria-label="Chrome extension required"
  >?</span>
  <span id="miniAutoCopyTooltip" class="mini-tooltip" role="tooltip">
    <strong>Chrome extension required</strong><br>
    Download and install:
    <a href="div/autocopy.zip" download>autocopy.zip</a><br><br>
    Unzip it, read the README, then load the unpacked folder in
    <code>chrome://extensions</code> and refresh the page.<br><br>
    When you toggle Auto-generate ON, Auto-copy switches to Note.
    When you toggle Auto-generate OFF, Auto-copy switches to Transcript.<br><br>
    You can still change Auto-copy manually afterward.
    That manual choice stays active until Auto-generate is toggled again.
  </span>
</span>
          </div>
          <select id="miniAutoCopyModeSelect" class="mini-select" aria-label="Auto-copy mode">
            <option value="off">Off</option>
            <option value="transcript">Transcript</option>
            <option value="note">Note</option>
          </select>
        </div>
      </div>

      <div class="prompt-wrap">
        <div class="prompt-left">
          <label id="miniPromptLabel" class="prompt-label" for="miniPromptSelect">Prompt</label>
          <select id="miniPromptSelect" class="prompt-select" aria-label="Prompt slot"></select>
        </div>
        <div class="prompt-right">
          <label class="mini-check" for="miniUsePromptToggle">
            <input id="miniUsePromptToggle" type="checkbox" />
            <span id="miniUsePromptLabel">Use</span>
          </label>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`);
  doc.close();

  installMiniPanelAutoScale(targetWindow);
  bindMiniPanelEvents();
  updateMiniPanelUi();
  startRefreshLoop();
}

function attachWindowLifecycle(targetWindow) {
  const handleClose = () => {
    stopRefreshLoop();
    miniWindow = null;
    emitMiniPanelStatus({ open: false });
  };

  try {
    targetWindow.addEventListener('pagehide', handleClose);
  } catch (_) {}

  try {
    targetWindow.addEventListener('beforeunload', handleClose);
  } catch (_) {}
}

async function openMiniPanel() {
  ensureHubChannel();
  publishLocalHubSnapshot('open-request');

  if (isMiniWindowOpen()) {
    try {
      miniWindow.focus();
    } catch (_) {}
    activateLocalHubTab('focus-existing-panel');
    requestUiRefresh();
    return;
  }

  try {
    if (canUseDocumentPiP()) {
      miniWindow = await window.documentPictureInPicture.requestWindow({
        width: MINI_PANEL_WIDTH,
        height: MINI_PANEL_HEIGHT,
        preferInitialWindowPlacement: true,
      });
    } else {
      miniWindow = window.open(
        '',
        MINI_PANEL_WINDOW_NAME,
        `popup=yes,width=${MINI_PANEL_WIDTH},height=${MINI_PANEL_HEIGHT},resizable=yes`
      );
      if (!miniWindow) {
        console.warn('[mini-panel] popup open failed');
        return;
      }
    }

    renderMiniPanelDocument(miniWindow);
    attachWindowLifecycle(miniWindow);
    activateLocalHubTab('opened-panel');
    emitMiniPanelStatus({ open: true });
  } catch (err) {
    console.warn('[mini-panel] failed to open', err);
  }
}

function handleStateRelevantEvent() {
  publishLocalHubSnapshot('state-relevant-event');
  updateMiniPanelUi();
  requestUiRefresh();
}

function bindMainWindowEvents() {
  if (window.__miniPanelEventsBound === true) return;
  window.__miniPanelEventsBound = true;

  window.addEventListener('mini-panel:open-requested', () => {
    openMiniPanel();
  });

  window.addEventListener('note-copied', () => {
    showCopiedIndicator();
    handleStateRelevantEvent();
  });

  window.addEventListener('transcript-copied', () => {
    showCopiedIndicator();
    handleStateRelevantEvent();
  });

  window.addEventListener('note-copy-failed', () => {
    showCopyFailedIndicator();
    handleStateRelevantEvent();
  });

  window.addEventListener('transcript-copy-failed', () => {
    showCopyFailedIndicator();
    handleStateRelevantEvent();
  });

  window.addEventListener('note-generation-finished', handleStateRelevantEvent);
  window.addEventListener('note:finished', handleStateRelevantEvent);
  window.addEventListener('transcription:finished', handleStateRelevantEvent);
  window.addEventListener('prompt-slot-selection-changed', handleStateRelevantEvent);
  window.addEventListener('prompt-slot-names-changed', handleStateRelevantEvent);
  window.addEventListener('prompt-profile-changed', handleStateRelevantEvent);

  window.addEventListener('app:state-changed', (event) => {
    const reason = event?.detail?.reason || '';
    if (
      reason === 'start-recording-click' ||
      reason === 'record-hotkey' ||
      reason === 'transcribe-provider-switched' ||
      reason === 'recording-provider-initialized' ||
      reason === 'note-generation-begin'
    ) {
      hideCopiedIndicator();
    }
    publishLocalHubSnapshot(`app-state:${reason || 'unknown'}`);
    handleStateRelevantEvent();
  });

  document.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const watchedIds = new Set([
      'startButton',
      'stopButton',
      'pauseResumeButton',
      'abortButton',
      'generateNoteButton',
      'abortNoteButton',
      'copyNoteButton',
      'copyTranscriptionButton',
    ]);

    if (target.id && watchedIds.has(target.id)) {
      if (target.id === 'startButton') {
        hideCopiedIndicator();
      }
      handleStateRelevantEvent();

      if (target.id === 'copyNoteButton' || target.id === 'copyTranscriptionButton') {
        window.setTimeout(() => {
          showCopiedIndicator();
        }, 40);
      }
    }
  });

  window.addEventListener('beforeunload', () => {
    stopHubHeartbeat();
    removeLocalHubTab();
    try {
      miniWindow?.close();
    } catch (_) {}
  });
}

function boot(existingApp) {
  if (window.__miniPanelBooted === true) return;
  window.__miniPanelBooted = true;
  appRef = existingApp || window.__app || null;
  ensureHubChannel();
  upsertHubTab(buildLocalHubSnapshot());
  ensureSelectedHubTab();
  startHubHeartbeat();
  bindMainWindowEvents();
  publishLocalHubSnapshot('boot');
}

function init(app) {
  boot(app);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => boot(window.__app || null), { once: true });
} else {
  boot(window.__app || null);
}

export { init };
