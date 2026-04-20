import {
  DEFAULTS,
  getNoteUiVisibility,
  getTranscribeProviderShortLabel,
  listBedrockModelOptions,
  listGeminiApiModelOptions,
  listNoteModeOptions,
  listNoteUiProviderOptions,
  listOpenAiModelOptions,
  listVertexModelOptions,
} from '../core/provider-registry.js';

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
const MINI_HUB_PAGE_SESSION_KEY = 'mini_panel_page_session_id';

// Liveness model: instead of blindly pruning tabs whose updatedAt has
// gone stale (which was causing "tab vanishes and reappears" flicker
// due to Chrome background-tab throttling), we use an active
// ping/pong probe protocol. Any tab whose updatedAt is older than
// PROBE_THRESHOLD is probed with a targeted `mini-hub-ping`. Live
// tabs respond with `mini-hub-pong` — which refreshes their
// updatedAt without actually changing any UI state. If no pong
// arrives within PROBE_TIMEOUT, the tab is confirmed dead and
// removed.
//
// BroadcastChannel message delivery is NOT throttled by Chrome's
// background-tab rules (only setInterval/setTimeout are). A pong
// from a deeply-backgrounded tab still arrives within milliseconds
// of the ping, so PROBE_TIMEOUT can be very short without risking
// false positives.
//
// This gives three properties simultaneously:
//   1. Immediate removal when a tab posts mini-hub-tab-closed
//      (normal close: beforeunload / pagehide).
//   2. Fast removal of crashed tabs (~PROBE_THRESHOLD + PROBE_TIMEOUT
//      worst case = ~26.5s, independent of heartbeat throttling).
//   3. Never wrongly removes a live tab, even under aggressive
//      background throttling, deep sleep, or OS freeze.
const MINI_HUB_HEARTBEAT_MS = 10000;
// Two probe cadences:
//
// - "idle" (Mini Panel window is NOT open in this tab): gentle probing
//   at 5s intervals with a 25s threshold. Just enough to clean up
//   crashed peers eventually, without generating channel traffic for
//   no visible benefit.
//
// - "active" (Mini Panel window IS open in this tab): aggressive
//   probing at 400ms intervals with ~0ms threshold and a 350ms pong
//   window. This means any tab in the picker gets pinged constantly
//   and a dead peer is detected within ~750ms, independent of whether
//   the closing tab's beforeunload message was successfully delivered.
//
// Chrome does NOT throttle BroadcastChannel message delivery or the
// message-event handlers that receive them, only setInterval timing.
// The probe scanner's setInterval IS throttled when the parent tab
// is backgrounded (which happens when the user focuses the PiP
// window), so we ALSO wake the probe scan from the 350ms UI refresh
// loop which runs whenever the Mini Panel is visible — see
// updateMiniPanelUi.
const MINI_HUB_PROBE_INTERVAL_MS_IDLE = 5000;
const MINI_HUB_PROBE_THRESHOLD_MS_IDLE = 25000;
const MINI_HUB_PROBE_TIMEOUT_MS_IDLE = 1500;

const MINI_HUB_PROBE_INTERVAL_MS_ACTIVE = 500;
const MINI_HUB_PROBE_THRESHOLD_MS_ACTIVE = 0;  // probe every scan
const MINI_HUB_PROBE_TIMEOUT_MS_ACTIVE = 450;

let miniWindow = null;
let refreshTimer = null;
let appRef = null;
let hubChannel = null;
let hubHeartbeatTimer = null;
let probeTimer = null;
// tabId -> timeout handle for in-flight probes
const pendingProbes = new Map();
// requestId -> { resolve, timeoutHandle, targetTabId, kind }
const pendingContentRequests = new Map();
let localTabId = '';
let localPageSessionId = '';
let selectedHubTabId = '';
let hubSelectionMode = 'auto';
const MINI_HUB_ACTIVATION_DEBOUNCE_MS = 150;
let lastLocalHubActivationAt = 0;
const hubTabs = new Map();
let nextHubTabOrder = 1;

// Authoritative color assignment. Each tab owns its OWN color
// assignment exclusively — it picks a color for itself on first sight
// and broadcasts it via `mini-hub-accent-assigned`. Other tabs record
// the assignment in `tabColors` as observed fact and use it for
// display purposes. If two tabs race and pick the same color, the
// tab with the lexicographically-lower tabId keeps it and the loser
// re-picks. This way every tab's Mini Panel shows the same color for
// a given tab, and that color matches the tab's own Chrome favicon.
//
// The palette has exactly 8 distinct colors (fixes the previous
// orange/amber `#f59e0b` duplicate).
const MINI_HUB_ACCENT_PALETTE = [
  { key: 'green',  color: '#22c55e' },
  { key: 'blue',   color: '#3b82f6' }, 
  { key: 'orange', color: '#f59e0b' },
  { key: 'purple', color: '#8b5cf6' },
  { key: 'teal',   color: '#14b8a6' },
  { key: 'rose',   color: '#f43f5e' },
  { key: 'indigo', color: '#6366f1' },
  { key: 'cyan',   color: '#06b6d4' },
];

// tabId -> { key, color }. Contains both the local tab's own
// assignment (made once, broadcast once) and observed assignments
// from other tabs (recorded as fact, never re-chosen).
const tabColors = new Map();

function getPaletteByKey(key) {
  const k = String(key || '').trim();
  if (!k) return null;
  return MINI_HUB_ACCENT_PALETTE.find((p) => p.key === k) || null;
}

// Pick a color for the LOCAL tab only. Called exactly once per tab
// lifetime. Picks the lowest-index palette entry not already claimed
// by another tab this tab has observed.
function pickOwnColor() {
  const ownId = getOrCreateLocalTabId();
  const existing = tabColors.get(ownId);
  if (existing) return existing;

  const used = new Set();
  for (const [id, entry] of tabColors.entries()) {
    if (id !== ownId && entry?.key) used.add(entry.key);
  }

  let chosen = MINI_HUB_ACCENT_PALETTE.find((p) => !used.has(p.key));
  if (!chosen) {
    // Fallback for >8 tabs: wrap around deterministically.
    chosen = MINI_HUB_ACCENT_PALETTE[tabColors.size % MINI_HUB_ACCENT_PALETTE.length];
  }

  tabColors.set(ownId, chosen);
  return chosen;
}

// Record an accent assignment broadcast by another tab. If the
// incoming tab claims a color that WE have already assigned to
// ourselves, the lexicographically-lower tabId wins and the loser
// re-picks on its next publish cycle.
function recordObservedAccent(tabId, accentKey, accentColor) {
  const id = String(tabId || '').trim();
  if (!id) return { changed: false, conflict: false };

  const palette = getPaletteByKey(accentKey);
  if (!palette || palette.color !== accentColor) {
    // Ignore malformed assignments.
    return { changed: false, conflict: false };
  }

  const ownId = getOrCreateLocalTabId();
  const prev = tabColors.get(id);
  if (prev && prev.key === palette.key) {
    return { changed: false, conflict: false };
  }

  // Conflict with our own color?
  const ownAssignment = tabColors.get(ownId);
  if (id !== ownId && ownAssignment && ownAssignment.key === palette.key) {
    // Lower tabId wins. If the incoming tab wins, we drop our own
    // assignment and pick a new color on the next publish cycle.
    if (id < ownId) {
      tabColors.set(id, palette);
      tabColors.delete(ownId);
      return { changed: true, conflict: true };
    }
    // We win: keep our own color, ignore the incoming claim for now.
    // The other tab will see our broadcast and re-pick.
    return { changed: false, conflict: true };
  }

  tabColors.set(id, palette);
  return { changed: true, conflict: false };
}

function releaseColorForTab(tabId) {
  const id = String(tabId || '').trim();
  if (!id) return;
  tabColors.delete(id);
}

// Sticky vs live field policy for tab snapshots. Sticky fields only
// get overwritten when the incoming value is meaningful (non-empty);
// live fields always overwrite. accentKey/accentColor are intentionally
// NOT in either list — they are owned locally by tabColors.
const STICKY_FIELDS = [
  'promptOptions',
  'promptLabel',
  'selectedPromptSlot',
  'tabOrder',
  'pageSessionId',
];
const LIVE_FIELDS = ['state', 'updatedAt', 'activatedAt'];

function isMeaningfulValue(v) {
  if (v === undefined || v === null) return false;
  if (typeof v === 'string') return v.trim() !== '';
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === 'object') return Object.keys(v).length > 0;
  return true;
}

function mergeTabSnapshot(prev, incoming) {
  const base = prev || {};
  const src = incoming || {};
  const next = { ...base };

  for (const key of LIVE_FIELDS) {
    if (src[key] !== undefined) next[key] = src[key];
  }

  for (const key of STICKY_FIELDS) {
    if (isMeaningfulValue(src[key])) next[key] = src[key];
    // else: keep base[key]
  }

  next.tabId = base.tabId || src.tabId;
  return next;
}

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
    recordingCompleted: {
      en: 'Recording completed',
      no: 'Opptak fullført',
      sv: 'Inspelning klar',
      de: 'Aufnahme abgeschlossen',
      fr: 'Enregistrement terminé',
      it: 'Registrazione completata',
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
    generateNote: {
      en: 'Generate note',
      no: 'Generer notat',
      nb: 'Generer notat',
      nn: 'Generer notat',
      sv: 'Generera anteckning',
      da: 'Generér note',
      de: 'Notiz generieren',
      fr: 'Générer la note',
      it: 'Genera nota',
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

  const app = getApp() || (window.__app = window.__app || {});
  const shared = String(app.__miniHubRuntimeTabId || '').trim();
  if (shared) {
    localTabId = shared;
    return localTabId;
  }

  localTabId =
    (window.crypto?.randomUUID && window.crypto.randomUUID()) ||
    `mini-tab-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  app.__miniHubRuntimeTabId = localTabId;

  return localTabId;
}

function getOrCreateLocalPageSessionId() {
  if (localPageSessionId) return localPageSessionId;

  const app = getApp() || (window.__app = window.__app || {});
  const shared = String(app.__miniHubPageSessionId || '').trim();
  if (shared) {
    localPageSessionId = shared;
    return localPageSessionId;
  }

  try {
    const existing = String(sessionStorage.getItem(MINI_HUB_PAGE_SESSION_KEY) || '').trim();
    if (existing) {
      localPageSessionId = existing;
      app.__miniHubPageSessionId = localPageSessionId;
      return localPageSessionId;
    }
  } catch (_) {}

  localPageSessionId =
    (window.crypto?.randomUUID && window.crypto.randomUUID()) ||
    `mini-page-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  try {
    sessionStorage.setItem(MINI_HUB_PAGE_SESSION_KEY, localPageSessionId);
  } catch (_) {}

  app.__miniHubPageSessionId = localPageSessionId;
  return localPageSessionId;
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
  const tabId = getOrCreateLocalTabId();
  const state = getSafeState();
  let promptOptions = getSafePromptOptions()
    .map(normalizePromptOptionLabel)
    .filter(Boolean);
  const selectedPromptSlot = getSafeSelectedPromptSlot();

  if (!promptOptions.length && selectedPromptSlot) {
    promptOptions = [{ id: selectedPromptSlot, label: `${selectedPromptSlot}. ${tMini('untitled')}` }];
  }

  const promptLabel = getPromptLabelFromOptions(promptOptions, selectedPromptSlot);

  // Outbound snapshot intentionally omits accentKey/accentColor. Color
  // is owned by the hub via tabColors and is not part of the snapshot
  // protocol. Receivers assign/lookup their own color locally.
  return {
    tabId,
    pageSessionId: getOrCreateLocalPageSessionId(),
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

  const prev = hubTabs.get(tabId) || null;

  // Single merge path. STICKY fields are preserved when incoming is
  // empty; LIVE fields always overwrite. Accent fields are NOT merged
  // from the snapshot — they come exclusively from the tabColors map.
  const merged = mergeTabSnapshot(prev, snapshot);

  // Assign tabOrder exactly once per tab, the first time the hub sees it.
  if (!Number(merged.tabOrder) || merged.tabOrder <= 0) {
    merged.tabOrder = nextHubTabOrder++;
  }

  // Look up the accent this tab is known to have. For the LOCAL tab
  // this is set by pickOwnColor(); for other tabs it comes from
  // recordObservedAccent() called on `mini-hub-accent-assigned`
  // messages. If nothing is known yet, the entry simply has no accent
  // until an assignment message arrives.
  const ownId = getOrCreateLocalTabId();
  if (tabId === ownId && !tabColors.has(ownId)) {
    pickOwnColor();
  }
  const assigned = tabColors.get(tabId);
  merged.accentKey = assigned ? assigned.key : '';
  merged.accentColor = assigned ? assigned.color : '';

  merged.updatedAt = Number(snapshot?.updatedAt || merged.updatedAt || Date.now());

  hubTabs.set(tabId, merged);
  return merged;
}

// True when the Mini Panel window is open in this tab. Probing runs
// aggressively in this mode so the picker reflects tab closures
// within ~750ms even if the closing tab's beforeunload message was
// dropped by Chrome during the unload race.
function isProbingActive() {
  return isMiniWindowOpen();
}

function getProbeThresholdMs() {
  return isProbingActive()
    ? MINI_HUB_PROBE_THRESHOLD_MS_ACTIVE
    : MINI_HUB_PROBE_THRESHOLD_MS_IDLE;
}

function getProbeTimeoutMs() {
  return isProbingActive()
    ? MINI_HUB_PROBE_TIMEOUT_MS_ACTIVE
    : MINI_HUB_PROBE_TIMEOUT_MS_IDLE;
}

function getProbeIntervalMs() {
  return isProbingActive()
    ? MINI_HUB_PROBE_INTERVAL_MS_ACTIVE
    : MINI_HUB_PROBE_INTERVAL_MS_IDLE;
}

// Walks hubTabs and kicks off a probe for any peer that has gone
// beyond the current threshold. In active mode the threshold is 0,
// so every peer gets probed on every scan.
function pruneStaleHubTabs() {
  const now = Date.now();
  const ownId = getOrCreateLocalTabId();
  const threshold = getProbeThresholdMs();

  for (const [tabId, entry] of hubTabs.entries()) {
    if (tabId === ownId) continue; // we know we're alive
    const updatedAt = Number(entry?.updatedAt || 0);
    if (threshold > 0 && updatedAt && now - updatedAt <= threshold) continue;
    if (pendingProbes.has(tabId)) continue; // probe already in flight
    startProbe(tabId);
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
    setHubSelectionModeAuto();
  }
}

function startProbe(tabId) {
  const id = String(tabId || '').trim();
  if (!id) return;
  if (pendingProbes.has(id)) return;

  // Fire the targeted ping first, then arm the timeout. If the pong
  // arrives before the timeout, resolveProbe() clears the timeout and
  // refreshes the tab's updatedAt. If not, the timeout handler runs
  // and removes the tab.
  postHubMessage({
    type: 'mini-hub-ping',
    targetTabId: id,
    at: Date.now(),
  });

  const handle = window.setTimeout(() => {
    pendingProbes.delete(id);
    if (!hubTabs.has(id)) return; // already gone for another reason
    hubTabs.delete(id);
    releaseColorForTab(id);
    if (selectedHubTabId === id) {
      selectedHubTabId = '';
      setHubSelectionModeAuto();
      ensureSelectedHubTab();
    }
    updateMiniPanelUi();
  }, getProbeTimeoutMs());

  pendingProbes.set(id, handle);
}

function resolveProbe(tabId) {
  const id = String(tabId || '').trim();
  if (!id) return;
  const handle = pendingProbes.get(id);
  if (handle === undefined) return;
  window.clearTimeout(handle);
  pendingProbes.delete(id);

  const entry = hubTabs.get(id);
  if (entry) {
    entry.updatedAt = Date.now();
    hubTabs.set(id, entry);
  }
}

function startProbeScanner() {
  if (probeTimer) return;
  probeTimer = window.setInterval(() => {
    pruneStaleHubTabs();
  }, getProbeIntervalMs());
}

// Called when the Mini Panel opens or closes so the scanner switches
// between idle (5s) and active (400ms) cadences without waiting for
// the current interval to elapse.
function restartProbeScanner() {
  if (probeTimer) {
    window.clearInterval(probeTimer);
    probeTimer = null;
  }
  // Don't clear pendingProbes here — in-flight probes remain valid.
  startProbeScanner();
}

function stopProbeScanner() {
  if (!probeTimer) return;
  window.clearInterval(probeTimer);
  probeTimer = null;
  for (const handle of pendingProbes.values()) {
    window.clearTimeout(handle);
  }
  pendingProbes.clear();
}

function getOrderedHubTabs() {
  // Read-only: does not prune. Prune is done centrally by
  // updateMiniPanelUi on its 350ms refresh tick so that all three
  // consumers (dropdown sync, selection resolution, ordered list)
  // see a consistent snapshot within a single frame.
  return Array.from(hubTabs.values()).sort((a, b) => {
    const aActivated = Number(a?.activatedAt || 0);
    const bActivated = Number(b?.activatedAt || 0);
    if (bActivated !== aActivated) return bActivated - aActivated;

    const aOrder = Number(a?.tabOrder || 0);
    const bOrder = Number(b?.tabOrder || 0);
    return aOrder - bOrder;
  });
}

function setHubSelectionModeAuto() {
  hubSelectionMode = 'auto';
}

function syncHubSelectionToActivatedTab(tabId) {
  const nextTabId = String(tabId || '').trim();
  if (!nextTabId) return;
  selectedHubTabId = nextTabId;
  setHubSelectionModeAuto();
}

function setHubSelectionManual(tabId) {
  const nextTabId = String(tabId || '').trim();
  if (!nextTabId) return;
  selectedHubTabId = nextTabId;
  hubSelectionMode = 'manual';
}

function isHubSelectionManual() {
  return hubSelectionMode === 'manual' && !!selectedHubTabId && hubTabs.has(selectedHubTabId);
}

function ensureSelectedHubTab() {
  // Read-only: does not prune. See getOrderedHubTabs().
  if (selectedHubTabId && hubTabs.has(selectedHubTabId)) {
    return selectedHubTabId;
  }

  setHubSelectionModeAuto();
  const fallback = getOrderedHubTabs()[0];
  selectedHubTabId = fallback?.tabId || '';
  return selectedHubTabId;
}

function shouldAutoFollowHubSelection() {
  return !isHubSelectionManual();
}

function triggerLocalHubActivation(reason = 'activate', options = {}) {
  const { prune = false, force = false } = options || {};
  const now = Date.now();

  if (!force && now - lastLocalHubActivationAt < MINI_HUB_ACTIVATION_DEBOUNCE_MS) {
    if (prune) {
      pruneStaleHubTabs();
    }
    return;
  }

  lastLocalHubActivationAt = now;
  activateLocalHubTab(reason);

  if (prune) {
    pruneStaleHubTabs();
  }
}

function getSelectedHubSnapshot() {
  const tabId = ensureSelectedHubTab();
  if (!tabId) return null;
  return hubTabs.get(tabId) || null;
}

function getDisplayLabelForHubTab(snapshot, _index) {
  // Option B: no tab numbers. The prompt label is the primary
  // identifier; the accent color (already shown as a dot next to the
  // label) distinguishes tabs that happen to share the same prompt.
  // Removing the number also eliminates the "reshuffling" problem
  // where the freshly-selected tab always became "Tab 1" because
  // activatedAt bumped it to the top of the sort order.
  const promptLabel = String(
    snapshot?.promptLabel ||
    snapshot?.selectedPromptLabel ||
    ''
  ).trim();
  return promptLabel || tMini('untitled');
}

function shouldShowTabAccents() {
  return getOrderedHubTabs().length > 1;
}

function getAccentColorForHubTab(snapshot) {
  if (!shouldShowTabAccents()) return '';
  const color = String(snapshot?.accentColor || '').trim();
  return color || '';
}

function isHubTabActivelyRecording(snapshot) {
  return String(snapshot?.state?.miniPanelStatusPhase || '').trim().toLowerCase() === 'recording';
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function closeMiniTabPicker() {
  const popover = $('miniTabPickerPopover');
  const trigger = $('miniTabPickerTrigger');
  if (popover) popover.hidden = true;
  if (trigger) trigger.setAttribute('aria-expanded', 'false');
}

function openMiniTabPicker() {
  const popover = $('miniTabPickerPopover');
  const trigger = $('miniTabPickerTrigger');
  if (popover) popover.hidden = false;
  if (trigger) trigger.setAttribute('aria-expanded', 'true');
}

function toggleMiniTabPicker() {
  const popover = $('miniTabPickerPopover');
  if (!popover) return;
  if (popover.hidden) openMiniTabPicker();
  else closeMiniTabPicker();
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

  // upsertHubTab handles sticky-field preservation via mergeTabSnapshot
  // and triggers local-own color pick via pickOwnColor() when needed.
  upsertHubTab(snapshot);

  postHubMessage({
    type: 'mini-hub-tab-state',
    reason,
    snapshot,
  });

  // Always re-broadcast our own accent. This is cheap, idempotent,
  // and ensures new tabs that come online learn our color from every
  // heartbeat instead of waiting for the next pickOwnColor event.
  broadcastOwnAccentAssignment();
}

function activateLocalHubTab(reason = 'activate') {
  const tabId = getOrCreateLocalTabId();
  const snapshot = buildLocalHubSnapshot();
  snapshot.activatedAt = Date.now();

  upsertHubTab(snapshot);
  // A real browser/tab activation should always win over a temporary
  // Mini Panel manual pick. This keeps the panel aligned with the
  // actual active Chrome tab after normal tab switching.
  syncHubSelectionToActivatedTab(tabId);

  postHubMessage({
    type: 'mini-hub-activate-tab',
    reason,
    tabId,
    activatedAt: snapshot.activatedAt,
    snapshot,
  });

  broadcastOwnAccentAssignment();
}

function removeLocalHubTab() {
  const tabId = getOrCreateLocalTabId();
  hubTabs.delete(tabId);
  releaseColorForTab(tabId);

  postHubMessage({
    type: 'mini-hub-tab-closed',
    tabId,
    at: Date.now(),
  });
}

// Broadcast this tab's own color assignment to every other tab. Called
// after pickOwnColor, after heartbeats, after activation, and after
// losing a color-conflict and picking a fresh color. Idempotent.
function broadcastOwnAccentAssignment() {
  const ownId = getOrCreateLocalTabId();
  const assigned = tabColors.get(ownId);
  if (!assigned) return;

  postHubMessage({
    type: 'mini-hub-accent-assigned',
    tabId: ownId,
    accentKey: assigned.key,
    accentColor: assigned.color,
    liveTabCount: hubTabs.size,
    at: Date.now(),
  });

  // Also notify main.js locally so the favicon updates immediately
  // without waiting for a channel round-trip.
  try {
    window.dispatchEvent(
      new CustomEvent('mini-panel:accent-changed', {
        detail: {
          accentKey: assigned.key,
          accentColor: assigned.color,
          liveTabCount: hubTabs.size,
        },
      })
    );
  } catch (_) {}
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
      // Synchronous update — see the long comment in mini-hub-tab-closed
      // below for why we don't go through requestUiRefresh here.
      updateMiniPanelUi();
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
        syncHubSelectionToActivatedTab(tabId);
      }
      updateMiniPanelUi();
      return;
    }

    if (type === 'mini-hub-tab-closed') {
      const tabId = String(data?.tabId || '').trim();
      if (tabId) {
        hubTabs.delete(tabId);
        releaseColorForTab(tabId);
        if (selectedHubTabId === tabId) {
          selectedHubTabId = '';
          ensureSelectedHubTab();
        }
      }
      // CRITICAL: call updateMiniPanelUi synchronously rather than
      // via requestUiRefresh(). requestUiRefresh schedules via
      // setTimeout, which Chrome throttles to ~1 Hz minimum when the
      // parent tab is backgrounded — and the parent tab IS
      // backgrounded whenever the user is focused on the PiP window.
      // A synchronous call from inside the message handler runs as
      // part of the message task, which Chrome does not throttle, so
      // the PiP DOM updates with no perceptible delay regardless of
      // parent tab state.
      updateMiniPanelUi();
      return;
    }

    if (type === 'mini-hub-accent-assigned') {
      const tabId = String(data?.tabId || '').trim();
      const accentKey = String(data?.accentKey || '').trim();
      const accentColor = String(data?.accentColor || '').trim();
      if (!tabId || !accentKey || !accentColor) return;

      const result = recordObservedAccent(tabId, accentKey, accentColor);

      // If we lost a color conflict (the incoming tab had a lower
      // tabId and claimed our color), our own assignment was dropped
      // by recordObservedAccent. Pick a fresh color and re-broadcast
      // so everyone converges.
      const ownId = getOrCreateLocalTabId();
      if (result.conflict && !tabColors.has(ownId)) {
        const fresh = pickOwnColor();
        if (fresh) {
          broadcastOwnAccentAssignment();
        }
      }

      // Re-apply the new accent to the existing hubTabs entry so the
      // UI picks it up on the next render.
      if (result.changed) {
        const existing = hubTabs.get(tabId);
        if (existing) {
          existing.accentKey = accentKey;
          existing.accentColor = accentColor;
          hubTabs.set(tabId, existing);
        }
        // Tell main.js to refresh its favicon (only matters for
        // the local tab — main.js ignores messages for other tabs).
        if (tabId === ownId) {
          try {
            window.dispatchEvent(
              new CustomEvent('mini-panel:accent-changed', {
                detail: { accentKey, accentColor, liveTabCount: hubTabs.size },
              })
            );
          } catch (_) {}
        }
      }
      updateMiniPanelUi();
      return;
    }

    if (type === 'mini-hub-ping') {
      // Someone wants to confirm we're alive. Respond immediately
      // with our own tabId. BroadcastChannel message delivery isn't
      // throttled by background-tab rules, so this round-trip works
      // even when our setInterval is being throttled.
      const targetTabId = String(data?.targetTabId || '').trim();
      if (!targetTabId || targetTabId !== getOrCreateLocalTabId()) return;
      postHubMessage({
        type: 'mini-hub-pong',
        tabId: getOrCreateLocalTabId(),
        at: Date.now(),
      });
      return;
    }

    if (type === 'mini-hub-pong') {
      const tabId = String(data?.tabId || '').trim();
      if (tabId) resolveProbe(tabId);
      return;
    }

    if (type === 'mini-hub-content-response') {
      const requestId = String(data?.requestId || '').trim();
      if (!requestId) return;

      const pending = pendingContentRequests.get(requestId);
      if (!pending) return;

      const responseTabId = String(data?.tabId || '').trim();
      const responseKind = normalizeLower(data?.kind, 'transcript');
      if (responseTabId !== pending.targetTabId || responseKind !== pending.kind) return;

      pendingContentRequests.delete(requestId);
      window.clearTimeout(pending.timeoutHandle);
      pending.resolve(String(data?.text || ''));
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

function setHidden(id, hidden) {
  const el = $(id);
  if (el) {
    el.hidden = !!hidden;
  }
}

function normalizeLower(value, fallback = '') {
  const next = String(value ?? '').trim().toLowerCase();
  return next || fallback;
}

function getOptionSignature(options) {
  return (Array.isArray(options) ? options : [])
    .map((item) => `${String(item?.value || '').trim()}|${String(item?.label || item?.value || '').trim()}`)
    .join('||');
}

function ensureSelectOptions(selectId, options) {
  const el = $(selectId);
  if (!el) return;

  const normalizedOptions = (Array.isArray(options) ? options : []).map((item) => ({
    value: String(item?.value || '').trim(),
    label: String(item?.label || item?.value || '').trim(),
  }));

  const nextSignature = getOptionSignature(normalizedOptions);
  if (el.dataset.optionsSignature === nextSignature) return;

  const previousValue = String(el.value || '').trim();
  el.innerHTML = '';

  normalizedOptions.forEach((item) => {
    const optionEl = el.ownerDocument.createElement('option');
    optionEl.value = item.value;
    optionEl.textContent = item.label;
    el.appendChild(optionEl);
  });

  el.dataset.optionsSignature = nextSignature;

  if (normalizedOptions.some((item) => item.value === previousValue)) {
    el.value = previousValue;
  }
}

function syncMiniNoteProviderOptions() {
  ensureSelectOptions('miniNoteProviderSelect', listNoteUiProviderOptions());
  ensureSelectOptions('miniOpenAiModelSelect', listOpenAiModelOptions());
  ensureSelectOptions('miniNoteProviderModeSelect', listNoteModeOptions());
  ensureSelectOptions('miniGeminiModelSelect', listGeminiApiModelOptions());
  ensureSelectOptions('miniVertexModelSelect', listVertexModelOptions());
  ensureSelectOptions('miniBedrockModelSelect', listBedrockModelOptions());
}

function formatMiniSttSummary(state) {
  const provider = normalizeLower(state?.transcribeProvider, DEFAULTS.transcribeProvider);
  const providerLabel = getTranscribeProviderShortLabel(provider);
  if (!providerLabel) return '';

  if (provider !== 'soniox') {
    return providerLabel;
  }

  const speakerLabels = normalizeLower(
    state?.sonioxSpeakerLabels,
    DEFAULTS.sonioxSpeakerLabels
  );
  return speakerLabels === 'on' ? 'Soniox (dia)' : 'Soniox';
}

function syncMiniSttSummary(state) {
  const text = formatMiniSttSummary(state);
  const el = $('miniSttSummary');
  if (!el) return;
  el.hidden = !text;
  el.textContent = text;
}

function syncMiniNoteProviderControls(state, snapshot) {
  syncMiniNoteProviderOptions();

  const noteProvider = normalizeLower(state?.noteProviderUi, 'aws-bedrock');
  const openaiModel = normalizeLower(state?.openaiModel, DEFAULTS.openaiModel);
  const noteMode = normalizeLower(state?.noteProviderMode, DEFAULTS.noteMode);
  const geminiModel = normalizeLower(state?.geminiModel, DEFAULTS.geminiModel);
  const vertexModel = normalizeLower(state?.vertexModel, DEFAULTS.vertexModel);
  const bedrockModel = normalizeLower(state?.bedrockModel, DEFAULTS.bedrockModel);
  const hasSnapshot = !!snapshot;
  const visibility = getNoteUiVisibility({
    provider: noteProvider,
    openaiModel,
  });

  setValue('miniNoteProviderSelect', noteProvider);
  setValue('miniOpenAiModelSelect', openaiModel);
  setValue('miniNoteProviderModeSelect', noteMode);
  setValue('miniGeminiModelSelect', geminiModel);
  setValue('miniVertexModelSelect', vertexModel);
  setValue('miniBedrockModelSelect', bedrockModel);

  const noteConfigControls = $('miniNoteConfigControls');
  if (noteConfigControls) {
    noteConfigControls.dataset.noteProvider = noteProvider;
  }

  setHidden('miniOpenAiModelSelect', !visibility.showOpenAi);
  setHidden('miniNoteProviderModeSelect', !visibility.showOpenAiMode);
  setHidden('miniGeminiModelSelect', !visibility.showGeminiApi);
  setHidden('miniVertexModelSelect', !visibility.showVertex);
  setHidden('miniBedrockModelSelect', !visibility.showBedrock);

  setDisabled('miniNoteProviderSelect', !hasSnapshot);
  setDisabled('miniOpenAiModelSelect', !hasSnapshot || !visibility.showOpenAi);
  setDisabled('miniNoteProviderModeSelect', !hasSnapshot || !visibility.showOpenAiMode);
  setDisabled('miniGeminiModelSelect', !hasSnapshot || !visibility.showGeminiApi);
  setDisabled('miniVertexModelSelect', !hasSnapshot || !visibility.showVertex);
  setDisabled('miniBedrockModelSelect', !hasSnapshot || !visibility.showBedrock);
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
    phase === 'transcribing' ||
    phase === 'generating-transcript' ||
    phase === 'transcript-completed' ||
    phase === 'note-generating' ||
    phase === 'note-completed' ||
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

function computeTimerElapsedMs(startedAt, frozenMs) {
  if (startedAt > 0) return Math.max(0, Date.now() - startedAt);
  return frozenMs || 0;
}

function updateMiniTranscriptTimer(state) {
  const row = $('miniTranscriptRow');
  const statusEl = $('miniTranscriptStatusText');
  const timerEl = $('miniTranscriptTimer');
  if (!row) return;

  const phase = String(state?.miniPanelStatusPhase || '').trim();
  const startedAt = Number(state?.transcriptStartedAt || 0);
  const elapsedMs = Number(state?.transcriptElapsedMs || 0);
  const hasTimerData = startedAt > 0 || elapsedMs > 0;

  const isTranscribing = phase === 'transcribing' || phase === 'generating-transcript';
  const isPostTranscript =
    phase === 'transcript-completed' ||
    phase === 'note-generating' ||
    phase === 'note-completed';

  // Hide when recording, idle, paused, aborted, or any phase
  // that isn't actively transcribing/post-transcript
  if (!isTranscribing && !(isPostTranscript && hasTimerData)) {
    row.hidden = true;
    if (statusEl) statusEl.textContent = '';
    if (timerEl) { timerEl.hidden = true; timerEl.textContent = ''; }
    return;
  }

  row.hidden = false;

  if (statusEl) {
    statusEl.textContent = isTranscribing
      ? tMini('generatingTranscript')
      : tMini('transcriptCompleted');
  }

  if (timerEl) {
    if (hasTimerData) {
      timerEl.hidden = false;
      timerEl.textContent = formatElapsedMs(computeTimerElapsedMs(startedAt, elapsedMs));
    } else {
      timerEl.hidden = true;
    }
  }
}

function updateMiniNoteTimer(state) {
  const row = $('miniNoteStatusRow');
  const statusEl = $('miniNoteStatusText');
  const timerEl = $('miniNoteTimer');
  if (!row) return;

  const phase = String(state?.miniPanelStatusPhase || '').trim();
  const startedAt = Number(state?.noteGenerationStartedAt || 0);
  const elapsedMs = Number(state?.noteGenerationElapsedMs || 0);
  const hasTimerData = startedAt > 0 || elapsedMs > 0;

  const isGenerating = phase === 'note-generating';
  const isCompleted = phase === 'note-completed';

  if (!isGenerating && !(isCompleted && hasTimerData)) {
    row.hidden = true;
    if (statusEl) statusEl.textContent = '';
    if (timerEl) { timerEl.hidden = true; timerEl.textContent = ''; }
    return;
  }

  row.hidden = false;

  if (statusEl) {
    statusEl.textContent = isGenerating
      ? tMini('generatingNote')
      : tMini('noteCompleted');
  }

  if (timerEl) {
    if (hasTimerData) {
      timerEl.hidden = false;
      timerEl.textContent = formatElapsedMs(computeTimerElapsedMs(startedAt, elapsedMs));
    } else {
      timerEl.hidden = true;
    }
  }
}

function hideCopiedIndicator() {
  const indicator = $('miniCopiedIndicator');
  if (!indicator) return;
  indicator.hidden = true;
  indicator.textContent = tMini('copied');
  indicator.dataset.show = '0';
}

function showCopiedIndicator() {
  const indicator = $('miniCopiedIndicator');
  if (!indicator) return;
  indicator.hidden = false;
  indicator.textContent = tMini('copied');
  indicator.dataset.show = '1';
}

function showCopyFailedIndicator() {
  const indicator = $('miniCopiedIndicator');
  if (!indicator) return;
  indicator.hidden = false;
  indicator.textContent = tMini('copyFailed');
  indicator.dataset.show = '1';
}

function syncCopiedIndicatorFromState(state) {
  const copiedState = String(state?.miniPanelCopiedState || '').trim();
  if (copiedState === 'copied') {
    showCopiedIndicator();
    return;
  }
  if (copiedState === 'copyFailed') {
    showCopyFailedIndicator();
    return;
  }
  hideCopiedIndicator();
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
  const trigger = $('miniTabPickerTrigger');
  const triggerText = $('miniTabPickerText');
  const triggerDot = $('miniTabPickerDot');
  const triggerRecording = $('miniTabPickerRecording');
  const list = $('miniTabPickerList');
  const popover = $('miniTabPickerPopover');
  if (!select) return;

  const items = getOrderedHubTabs();
  const selectedTabId = ensureSelectedHubTab();
  const showAccents = items.length > 1;

  select.dataset.syncing = '1';
  select.innerHTML = '';

  if (!items.length) {
    const option = select.ownerDocument.createElement('option');
    option.value = '';
    option.textContent = tMini('noTabsOpen');
    select.appendChild(option);
    select.disabled = true;
    if (trigger) {
      trigger.disabled = false;
      trigger.hidden = true;
      trigger.setAttribute('aria-label', 'Mini panel tab selector');
    }
    if (triggerText) triggerText.textContent = tMini('noTabsOpen');
    if (triggerDot) {
      triggerDot.hidden = true;
      triggerDot.style.setProperty('--tab-accent', 'transparent');
    }
    if (triggerRecording) {
      triggerRecording.hidden = true;
      triggerRecording.title = '';
    }
    if (list) list.innerHTML = '';
    if (popover) popover.hidden = true;
    delete select.dataset.syncing;
    return;
  }

  items.forEach((snapshot, index) => {
    const option = select.ownerDocument.createElement('option');
    option.value = String(snapshot?.tabId || '').trim();
    option.textContent = getDisplayLabelForHubTab(snapshot, index);
    if (option.value === selectedTabId) {
      option.selected = true;
    }
    select.appendChild(option);
  });

  select.disabled = items.length === 0;
  // Do NOT disable the trigger based on item count. A disabled button
  // shows the red-circle not-allowed cursor, which was misleading
  // users during brief prune/heartbeat races. Instead, hide the
  // trigger entirely when there is nothing to pick between, and show
  // it when there are 2+ tabs. Hiding is cursor-neutral.
  if (trigger) {
    trigger.disabled = false;
    trigger.hidden = items.length <= 1;
  }

  const selected =
    items.find((item) => String(item?.tabId || '') === String(selectedTabId || '')) ||
    items[0] ||
    null;

  if (selected) {
    const accentColor = showAccents ? getAccentColorForHubTab(selected) : '';
    const text = getDisplayLabelForHubTab(selected, items.indexOf(selected));
    const isRecording = isHubTabActivelyRecording(selected);

    if (triggerText) {
      triggerText.textContent = text;
    }

    if (triggerDot) {
      triggerDot.hidden = !accentColor;
      triggerDot.style.setProperty('--tab-accent', accentColor || 'transparent');
    }

    if (triggerRecording) {
      triggerRecording.hidden = !isRecording;
      triggerRecording.title = isRecording ? tMini('recording') : '';
    }

    if (trigger) {
      trigger.setAttribute(
        'aria-label',
        isRecording
          ? `Mini panel tab selector, ${text}, ${tMini('recording')}`
          : `Mini panel tab selector, ${text}`
      );
    }
  }

  if (list) {
    list.innerHTML = '';

    items.forEach((snapshot, index) => {
      const button = list.ownerDocument.createElement('button');
      button.type = 'button';
      button.className = 'mini-tab-picker-item';
      if (String(snapshot?.tabId || '') === String(selectedTabId || '')) {
        button.classList.add('is-active');
      }

      const accentColor = showAccents ? getAccentColorForHubTab(snapshot) : '';
      const text = getDisplayLabelForHubTab(snapshot, index);
      const isRecording = isHubTabActivelyRecording(snapshot);

      button.innerHTML = `
        <span class="mini-tab-picker-item-dot" style="--tab-accent:${escapeHtml(accentColor || 'transparent')};" ${accentColor ? '' : 'hidden'}></span>
        <span class="mini-tab-picker-item-text">${escapeHtml(text)}</span>
        ${isRecording ? `<span class="mini-tab-picker-item-recording" aria-hidden="true"></span>` : ''}
      `;

      button.setAttribute(
        'aria-label',
        isRecording ? `${text}, ${tMini('recording')}` : text
      );
      button.title = isRecording ? `${text} — ${tMini('recording')}` : text;

      const selectHubTabFromPicker = () => {
        const nextTabId = String(snapshot?.tabId || '').trim();
        if (!nextTabId) return;
        // Manual pick is a temporary override only. The next real
        // browser-tab activation will switch the Mini Panel back to
        // the active tab automatically.
        setHubSelectionManual(nextTabId);
        closeMiniTabPicker();
        hideCopiedIndicator();
        updateSelectedHubSnapshot((prev) => ({
          ...prev,
          state: {
            ...(prev.state || {}),
            miniPanelCopiedState: '',
            miniPanelCopiedAt: 0,
          },
        }));
        requestUiRefresh();
      };

      button.addEventListener('pointerdown', (event) => {
        if (event.pointerType === 'mouse' && event.button !== 0) return;
        event.preventDefault();
        selectHubTabFromPicker();
      });

      button.addEventListener('click', (event) => {
        if (event.detail > 0) return;
        selectHubTabFromPicker();
      });

      list.appendChild(button);
    });
  }

  delete select.dataset.syncing;
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

  // Pruning/probing is driven by startProbeScanner() on its own 5s
  // cadence plus on focus/visibility wake-ups. The 350ms UI refresh
  // loop does not need to probe — it just renders whatever is
  // currently in hubTabs.
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
  setDisabled('miniGenerateNoteButton', !state.hasTranscript || !!state.noteBusy);
  setDisabled('miniAbortButton', !state.canAbort);

  setText('miniStartButton', tMini('start'));
  setText('miniStopButton', tMini('stop'));
  setText('miniPauseButton', pauseResumeLabel);
  setText('miniCopyTranscriptButton', tMini('copyTranscript'));
  setText('miniCopyNoteButton', tMini('copyNote'));
  setText('miniGenerateNoteButton', tMini('generateNote'));
  setText('miniAbortButton', tMini('abort'));
  // Recording line status text: show phase-appropriate label
  const phase = String(state?.miniPanelStatusPhase || 'idle').trim();
  let recordingLineText;
  const hasRecordingTime = Number(state?.recordingAccumulatedMs || 0) > 0;
  if (hasRecordingTime && (
    phase === 'transcribing' || phase === 'generating-transcript' ||
    phase === 'transcript-completed' || phase === 'note-generating' ||
    phase === 'note-completed'
  )) {
    // After stop: show "Recording completed" with frozen timer
    recordingLineText = tMini('recordingCompleted');
  } else {
    recordingLineText = statusText || phaseUi?.text || (snapshot ? tMini('ready') : tMini('noTabSelected'));
  }
  setText('miniStatusText', recordingLineText);
  syncMiniSttSummary(state);
  setText('miniTitle', tMini('sharedMiniPanel'));
  setText('miniAutoGenerateLabel', tMini('autoGenerate'));
  setText('miniAutoCopyLabel', tMini('autoCopy'));
  setText('miniPromptLabel', tMini('prompt'));
  setText('miniUsePromptLabel', tMini('usePrompt'));
  setText('miniNoteModelLabel', 'Note model');

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
  updateMiniTranscriptTimer(state);
  updateMiniNoteTimer(state);

  const indicator = $('miniCopiedIndicator');
  if (indicator) {
    syncCopiedIndicatorFromState(state);
  }

  syncPromptDropdown(snapshot);
  syncMiniNoteProviderControls(state, snapshot);
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

function getLocalMiniContentText(kind) {
  const normalizedKind = normalizeLower(kind, 'transcript');
  const fieldId = normalizedKind === 'note' ? 'generatedNote' : 'transcription';
  return String(document.getElementById(fieldId)?.value || '');
}

function requestHubTabContent(targetTabId, kind) {
  const channel = ensureHubChannel();
  const normalizedTargetTabId = String(targetTabId || '').trim();
  const normalizedKind = normalizeLower(kind, 'transcript');

  if (!channel || !normalizedTargetTabId) {
    return Promise.resolve('');
  }

  const requestId =
    (window.crypto?.randomUUID && window.crypto.randomUUID()) ||
    `mini-content-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  return new Promise((resolve) => {
    const timeoutHandle = window.setTimeout(() => {
      pendingContentRequests.delete(requestId);
      resolve('');
    }, 1500);

    pendingContentRequests.set(requestId, {
      resolve,
      timeoutHandle,
      targetTabId: normalizedTargetTabId,
      kind: normalizedKind,
    });

    postHubMessage({
      type: 'mini-hub-content-request',
      requestId,
      targetTabId: normalizedTargetTabId,
      kind: normalizedKind,
      at: Date.now(),
    });
  });
}

function getSelectedHubContentText(kind) {
  const targetTabId = ensureSelectedHubTab();
  if (!targetTabId) {
    return Promise.resolve('');
  }

  if (targetTabId === getOrCreateLocalTabId()) {
    return Promise.resolve(getLocalMiniContentText(kind));
  }

  return requestHubTabContent(targetTabId, kind);
}

async function writeMiniPanelTextToClipboard(text) {
  const value = String(text || '');
  if (!value) return false;

  const doc = getMiniDoc() || document;
  const ownerWindow = doc.defaultView || miniWindow || window;
  const clipboard = ownerWindow?.navigator?.clipboard || navigator.clipboard;

  if (clipboard && typeof clipboard.writeText === 'function') {
    try {
      await clipboard.writeText(value);
      return true;
    } catch (_) {}
  }

  const textarea = doc.createElement('textarea');
  textarea.value = value;
  textarea.setAttribute('readonly', 'readonly');
  textarea.setAttribute('aria-hidden', 'true');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  textarea.style.pointerEvents = 'none';
  textarea.style.top = '-9999px';
  textarea.style.left = '-9999px';

  try {
    doc.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);
    return !!doc.execCommand('copy');
  } catch (_) {
    return false;
  } finally {
    textarea.remove();
    try {
      ownerWindow?.getSelection?.()?.removeAllRanges?.();
    } catch (_) {}
  }
}

function syncMiniPanelCopyFeedback(kind) {
  const nextKind = String(kind || '').trim();
  const at = Date.now();

  updateSelectedHubSnapshot((prev) => ({
    ...(prev || {}),
    state: {
      ...((prev && prev.state) || {}),
      miniPanelCopiedState: nextKind,
      miniPanelCopiedAt: at,
    },
  }));

  if (nextKind) {
    dispatchHubAction('setMiniPanelCopyFeedback', nextKind);
  }
  requestUiRefresh();
}

async function copySelectedHubContent(kind) {
  const normalizedKind = normalizeLower(kind, 'transcript');
  const text = await getSelectedHubContentText(normalizedKind);
  if (!String(text || '').trim()) {
    syncMiniPanelCopyFeedback('copyFailed');
    return false;
  }

  const ok = await writeMiniPanelTextToClipboard(text);
  syncMiniPanelCopyFeedback(ok ? 'copied' : 'copyFailed');
  return ok;
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
  const tabPickerTrigger = $('miniTabPickerTrigger');
  const tabPickerPopover = $('miniTabPickerPopover');
  const autoGenerateToggle = $('miniAutoGenerateToggle');
  const autoCopyModeSelect = $('miniAutoCopyModeSelect');
  const usePromptToggle = $('miniUsePromptToggle');
  const miniNoteProviderSelect = $('miniNoteProviderSelect');
  const miniOpenAiModelSelect = $('miniOpenAiModelSelect');
  const miniNoteProviderModeSelect = $('miniNoteProviderModeSelect');
  const miniGeminiModelSelect = $('miniGeminiModelSelect');
  const miniVertexModelSelect = $('miniVertexModelSelect');
  const miniBedrockModelSelect = $('miniBedrockModelSelect');

  if (startButton) {
    startButton.addEventListener('click', () => {
      dispatchHubAction('startRecording');
      hideCopiedIndicator();
      // Force-hide transcript/note rows immediately in the local DOM
      // to avoid any lag while waiting for the state round-trip.
      const trRow = $('miniTranscriptRow');
      const noteRow = $('miniNoteStatusRow');
      if (trRow) trRow.hidden = true;
      if (noteRow) noteRow.hidden = true;
      requestUiRefresh();
    });
  }

  if (stopButton) {
    stopButton.addEventListener('click', () => {
      dispatchHubAction('stopRecording');
      requestUiRefresh();
    });
  }

  if (pauseButton) {
    pauseButton.addEventListener('click', () => {
      dispatchHubAction('pauseResumeRecording');
      hideCopiedIndicator();
      requestUiRefresh();
    });
  }

  if (copyTranscriptButton) {
    copyTranscriptButton.addEventListener('click', () => {
      void copySelectedHubContent('transcript');
    });
  }

  if (copyNoteButton) {
    copyNoteButton.addEventListener('click', () => {
      void copySelectedHubContent('note');
    });
  }

  const generateNoteButton = $('miniGenerateNoteButton');
  if (generateNoteButton) {
    generateNoteButton.addEventListener('click', () => {
      dispatchHubAction('triggerGenerateNote');
      requestUiRefresh();
    });
  }

  if (abortButton) {
    abortButton.addEventListener('click', () => {
      dispatchHubAction('abortRecording');
      hideCopiedIndicator();
      requestUiRefresh();
    });
  }

  if (tabSelect) {
    tabSelect.addEventListener('change', () => {
      if (tabSelect.dataset.syncing === '1') return;
      const nextTabId = String(tabSelect.value || '').trim();
      if (!nextTabId) return;
      setHubSelectionManual(nextTabId);
      hideCopiedIndicator();
      updateSelectedHubSnapshot((prev) => ({
        ...prev,
        state: {
          ...(prev.state || {}),
          miniPanelCopiedState: '',
          miniPanelCopiedAt: 0,
        },
      }));
      requestUiRefresh();
    });
  }

  if (tabPickerTrigger) {
    tabPickerTrigger.addEventListener('click', () => {
      toggleMiniTabPicker();
    });
  }

  const doc = getMiniDoc();
  if (doc && !doc.body.dataset.miniTabPickerBound) {
    doc.body.dataset.miniTabPickerBound = '1';

    doc.addEventListener('click', (event) => {
      const target = event.target;
      const trigger = $('miniTabPickerTrigger');
      const popover = $('miniTabPickerPopover');
      if (!trigger || !popover || popover.hidden) return;
      if (trigger.contains(target) || popover.contains(target)) return;
      closeMiniTabPicker();
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
      requestUiRefresh();
    });
  }

  if (miniNoteProviderSelect) {
    miniNoteProviderSelect.addEventListener('change', () => {
      const next = String(miniNoteProviderSelect.value || '').trim().toLowerCase();
      if (!next) return;
      dispatchHubAction('switchNoteProvider', next);
      requestUiRefresh();
    });
  }

  if (miniOpenAiModelSelect) {
    miniOpenAiModelSelect.addEventListener('change', () => {
      const next = String(miniOpenAiModelSelect.value || '').trim().toLowerCase();
      if (!next) return;
      dispatchHubAction('setOpenAiModel', next);
      requestUiRefresh();
    });
  }

  if (miniNoteProviderModeSelect) {
    miniNoteProviderModeSelect.addEventListener('change', () => {
      const next = String(miniNoteProviderModeSelect.value || '').trim().toLowerCase();
      if (!next) return;
      dispatchHubAction('setNoteProviderMode', next);
      requestUiRefresh();
    });
  }

  if (miniGeminiModelSelect) {
    miniGeminiModelSelect.addEventListener('change', () => {
      const next = String(miniGeminiModelSelect.value || '').trim().toLowerCase();
      if (!next) return;
      dispatchHubAction('setGeminiModel', next);
      requestUiRefresh();
    });
  }

  if (miniVertexModelSelect) {
    miniVertexModelSelect.addEventListener('change', () => {
      const next = String(miniVertexModelSelect.value || '').trim().toLowerCase();
      if (!next) return;
      dispatchHubAction('setVertexModel', next);
      requestUiRefresh();
    });
  }

  if (miniBedrockModelSelect) {
    miniBedrockModelSelect.addEventListener('change', () => {
      const next = String(miniBedrockModelSelect.value || '').trim().toLowerCase();
      if (!next) return;
      dispatchHubAction('setBedrockModel', next);
      requestUiRefresh();
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

    .mini-tab-picker {
      position: relative;
      width: 100%;
      min-width: 0;
      max-width: 100%;
    }

    .mini-tab-select--hidden {
      position: absolute;
      inset: 0;
      opacity: 0;
      pointer-events: none;
      width: 1px;
      height: 1px;
    }

    .mini-tab-picker-trigger {
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
      display: inline-flex;
      align-items: center;
      gap: 8px;
      text-align: left;
      outline: none;
    }

    .mini-tab-picker-trigger:disabled {
      opacity: 0.65;
      cursor: not-allowed;
    }

    .mini-tab-picker-dot,
    .mini-tab-picker-item-dot {
      width: 10px;
      height: 10px;
      border-radius: 999px;
      background: var(--tab-accent, transparent);
      box-shadow: 0 0 0 1px rgba(255,255,255,0.18) inset;
      flex: 0 0 auto;
    }

    .mini-tab-picker-recording,
    .mini-tab-picker-item-recording {
      width: 8px;
      height: 8px;
      border-radius: 999px;
      background: #ef4444;
      box-shadow:
        0 0 0 1px rgba(255,255,255,0.16) inset,
        0 0 0 0 rgba(239,68,68,0.45);
      flex: 0 0 auto;
      animation: mini-recording-pulse 1.35s ease-out infinite;
      will-change: transform, opacity, box-shadow;
    }

    .mini-tab-picker-text,
    .mini-tab-picker-item-text {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      flex: 1 1 auto;
    }

    .mini-tab-picker-caret {
      flex: 0 0 auto;
      color: var(--muted);
      font-size: 11px;
    }

    @keyframes mini-recording-pulse {
      0% {
        transform: scale(0.92);
        opacity: 0.95;
        box-shadow:
          0 0 0 1px rgba(255,255,255,0.16) inset,
          0 0 0 0 rgba(239,68,68,0.45);
      }

      65% {
        transform: scale(1.1);
        opacity: 1;
        box-shadow:
          0 0 0 1px rgba(255,255,255,0.16) inset,
          0 0 0 5px rgba(239,68,68,0);
      }

      100% {
        transform: scale(0.92);
        opacity: 0.95;
        box-shadow:
          0 0 0 1px rgba(255,255,255,0.16) inset,
          0 0 0 0 rgba(239,68,68,0);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .mini-tab-picker-recording,
      .mini-tab-picker-item-recording {
        animation: none;
      }
    }

    .mini-tab-picker-popover {
      position: absolute;
      top: calc(100% + 6px);
      left: 0;
      right: 0;
      z-index: 20;
      background: #10131a;
      border: 1px solid var(--button-border);
      border-radius: 12px;
      box-shadow: 0 12px 24px rgba(0,0,0,0.28);
      overflow: hidden;
    }

    .mini-tab-picker-list {
      display: flex;
      flex-direction: column;
      max-height: 220px;
      overflow-y: auto;
    }

    .mini-tab-picker-item {
      width: 100%;
      border: 0;
      background: transparent;
      color: var(--text);
      padding: 8px 10px;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      text-align: left;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
    }

    .mini-tab-picker-item:hover,
    .mini-tab-picker-item.is-active {
      background: rgba(255,255,255,0.08);
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
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, auto) minmax(74px, 1fr);
      align-items: center;
      gap: 8px;
      min-height: 24px;
      min-width: 0;
      margin-bottom: 1px;
    }

    .status-slot {
      min-width: 0;
      display: flex;
      align-items: center;
    }

    .status-slot--left {
      justify-content: flex-start;
    }

    .status-slot--center {
      justify-content: center;
    }

    .status-slot--right {
      justify-content: flex-end;
    }

    .status-meta {
      display: flex;
      flex-direction: column;
      gap: 3px;
      margin-bottom: 8px;
    }

    .status-meta-main {
      min-width: 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
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
      flex: 0 0 auto;
      min-width: 74px;
      text-align: right;
      justify-self: end;
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
      flex: 1 1 auto;
    }

    .stt-summary {
      font-size: 11px;
      font-weight: 700;
      color: var(--muted);
      line-height: 1.2;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      min-width: 0;
      max-width: 100%;
      flex: 0 1 auto;
      text-align: center;
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
      grid-template-columns: repeat(3, minmax(0, 1fr));
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

    .note-config-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      min-width: 0;
      margin-top: 6px;
    }

    .note-config-left {
      display: flex;
      align-items: center;
      min-width: 0;
      flex: 0 0 auto;
    }

    .note-config-right {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 4px;
      min-width: 0;
      flex: 1 1 auto;
      flex-wrap: nowrap;
    }

    .note-config-select {
      min-width: 0;
      font-size: 10px;
      min-height: 26px;
      padding: 5px 7px;
    }

    .note-config-select--provider {
      flex: 0 1 96px;
    }

    .note-config-select--model {
      flex: 1 1 0;
    }

    .note-config-select--mode {
      flex: 0 1 88px;
    }

    .note-config-right[data-note-provider="openai"] .note-config-select--provider {
      flex-basis: 102px;
    }

    .note-config-right[data-note-provider="openai"] #miniOpenAiModelSelect {
      flex: 0 1 82px;
    }

    .note-config-right[data-note-provider="openai"] #miniNoteProviderModeSelect {
      flex: 0 1 92px;
    }

    .note-config-right[data-note-provider="aws-bedrock"] .note-config-select--provider {
      flex-basis: 90px;
    }

    .note-config-right[data-note-provider="aws-bedrock"] #miniBedrockModelSelect {
      flex: 1 1 0;
    }

    .note-config-right[data-note-provider="gemini3"] .note-config-select--provider {
      flex-basis: 112px;
    }

    .note-config-right[data-note-provider="gemini3"] #miniGeminiModelSelect {
      flex: 1 1 0;
    }

    .note-config-right[data-note-provider="gemini3-vertex"] .note-config-select--provider {
      flex-basis: 92px;
    }

    .note-config-right[data-note-provider="gemini3-vertex"] #miniVertexModelSelect {
      flex: 1 1 0;
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
          <div class="mini-tab-picker">
            <select id="miniTabSelect" class="mini-tab-select mini-tab-select--hidden" aria-label="Mini panel tab selector"></select>
            <button id="miniTabPickerTrigger" class="mini-tab-picker-trigger" type="button" aria-label="Mini panel tab selector" aria-expanded="false">
              <span id="miniTabPickerDot" class="mini-tab-picker-dot" hidden></span>
              <span id="miniTabPickerText" class="mini-tab-picker-text">Choose tab</span>
              <span id="miniTabPickerRecording" class="mini-tab-picker-recording" hidden aria-hidden="true"></span>
              <span class="mini-tab-picker-caret">▾</span>
            </button>
            <div id="miniTabPickerPopover" class="mini-tab-picker-popover" hidden>
              <div id="miniTabPickerList" class="mini-tab-picker-list"></div>
            </div>
          </div>
        </div>
        <button id="miniCloseButton" class="close-btn" type="button" aria-label="Close mini panel">×</button>
      </div>

      <div class="status-row">
        <div class="status-slot status-slot--left">
          <div id="miniStatusBadge" class="badge" data-tone="idle">Idle</div>
        </div>
        <div class="status-slot status-slot--center">
          <div id="miniSttSummary" class="stt-summary" hidden>Soniox</div>
        </div>
        <div class="status-slot status-slot--right">
          <div id="miniCopiedIndicator" class="copied" data-show="0" hidden>Copied!</div>
        </div>
      </div>
      <div class="status-meta">
        <div class="status-meta-main" id="miniRecordingRow">
          <div id="miniStatusText" class="status-text">Ready</div>
          <div id="miniRecordingTimer" class="recording-timer" hidden>00:00</div>
        </div>
        <div class="status-meta-main" id="miniTranscriptRow" hidden>
          <div id="miniTranscriptStatusText" class="status-text"></div>
          <div id="miniTranscriptTimer" class="recording-timer" hidden>00:00</div>
        </div>
        <div class="status-meta-main" id="miniNoteStatusRow" hidden>
          <div id="miniNoteStatusText" class="status-text"></div>
          <div id="miniNoteTimer" class="recording-timer" hidden>00:00</div>
        </div>
      </div>

      <div class="controls-wrap">
        <div class="primary-grid">
          <button id="miniStartButton" class="ctrl primary" type="button">Start</button>
          <button id="miniPauseButton" class="ctrl" type="button">Pause</button>
          <button id="miniStopButton" class="ctrl" type="button">Stop</button>
          <button id="miniAbortButton" class="ctrl abort" type="button">Abort</button>
        </div>

        <div class="copy-row">
          <button id="miniGenerateNoteButton" class="ctrl secondary" type="button">Generate note</button>
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

      <div class="note-config-row">
        <div class="note-config-left">
          <div id="miniNoteModelLabel" class="prompt-label">Note model</div>
        </div>
        <div id="miniNoteConfigControls" class="note-config-right" data-note-provider="">
          <select id="miniNoteProviderSelect" class="prompt-select note-config-select note-config-select--provider" aria-label="Note provider"></select>
          <select id="miniOpenAiModelSelect" class="prompt-select note-config-select note-config-select--model" aria-label="OpenAI model" hidden></select>
          <select id="miniNoteProviderModeSelect" class="prompt-select note-config-select note-config-select--mode" aria-label="Note mode" hidden></select>
          <select id="miniGeminiModelSelect" class="prompt-select note-config-select note-config-select--model" aria-label="Google AI Studio model" hidden></select>
          <select id="miniVertexModelSelect" class="prompt-select note-config-select note-config-select--model" aria-label="Vertex model" hidden></select>
          <select id="miniBedrockModelSelect" class="prompt-select note-config-select note-config-select--model" aria-label="Bedrock model" hidden></select>
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
    // Switch the probe scanner back to idle cadence now that we're
    // not watching.
    restartProbeScanner();
  };

  try {
    targetWindow.addEventListener('pagehide', handleClose);
  } catch (_) {}

  try {
    targetWindow.addEventListener('beforeunload', handleClose);
  } catch (_) {}
}

// Install a wake-up loop inside the PiP window itself. The PiP
// window's setInterval / rAF is NOT throttled by Chrome's
// background-tab rules (because the PiP window is a separate visible
// surface, not a hidden tab) even when the user has focused the PiP
// and the parent tab has become background. This loop calls back
// into the parent tab to run pruneStaleHubTabs and updateMiniPanelUi
// at full cadence, which is what makes tab-close detection feel
// immediate regardless of parent-tab throttling.
function installMiniPanelWakeupLoop(targetWindow) {
  if (!targetWindow || targetWindow.__miniHubWakeupBound === true) return;
  targetWindow.__miniHubWakeupBound = true;

  try {
    // Capture the opener window reference so we can detect if the
    // main tab has gone away (reload, navigate, crash). In Chrome PiP
    // the panel dies with its opener, but in a Safari popup the
    // window can outlive its opener — in which case the closures
    // below would reference dead functions.
    const opener = window;
    let timer = null;

    const tick = () => {
      try {
        // If the opener is gone or closed, stop trying.
        if (!opener || opener.closed) {
          if (timer) {
            try { targetWindow.clearInterval(timer); } catch (_) {}
            timer = null;
          }
          return;
        }
        pruneStaleHubTabs();
        updateMiniPanelUi();
      } catch (_) {
        // Any error (including "can't access dead closure") stops
        // the loop cleanly rather than thrashing every 500ms.
        if (timer) {
          try { targetWindow.clearInterval(timer); } catch (_) {}
          timer = null;
        }
      }
    };

    timer = targetWindow.setInterval(tick, MINI_HUB_PROBE_INTERVAL_MS_ACTIVE);

    const teardown = () => {
      if (timer) {
        try { targetWindow.clearInterval(timer); } catch (_) {}
        timer = null;
      }
    };
    try { targetWindow.addEventListener('pagehide', teardown); } catch (_) {}
    try { targetWindow.addEventListener('beforeunload', teardown); } catch (_) {}
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
        // window.open returning null in Safari almost always means
        // the popup blocker intercepted the call. The user needs to
        // allow popups for this site (Safari > Settings > Websites >
        // Pop-up Windows). Surface this as a status event so the
        // main page can show a helpful message if it wants.
        console.warn(
          '[mini-panel] popup open failed — likely blocked by the browser popup blocker. ' +
          'Allow popups for this site to use the Mini Panel.'
        );
        emitMiniPanelStatus({ open: false, blocked: true });
        return;
      }
    }

    renderMiniPanelDocument(miniWindow);
    attachWindowLifecycle(miniWindow);
    installMiniPanelWakeupLoop(miniWindow);
    // Switch probe scanner to active cadence now that there's a
    // panel to feed.
    restartProbeScanner();
    activateLocalHubTab('opened-panel');
    emitMiniPanelStatus({ open: true });
  } catch (err) {
    console.warn('[mini-panel] failed to open', err);
  }
}

function handleStateRelevantEvent() {
  publishLocalHubSnapshot('state-relevant-event');
  requestUiRefresh();
}

function tryHookApp(reference) {
  if (!reference) return null;
  appRef = reference;
  return reference;
}

function wireAppEvents(app) {
  if (!app || app.__miniPanelEventsBound) return;
  app.__miniPanelEventsBound = true;

  const eventNames = [
    'mini-panel:update',
    'mini-panel:state',
    'transcription:updated',
    'transcription:complete',
    'note:updated',
    'note:complete',
    'recording:started',
    'recording:stopped',
    'recording:paused',
    'recording:resumed',
    'recording:aborted',
    'prompt:changed',
    // main.js emits this for every internal UI change. Listening to it
    // keeps the Mini Panel in lockstep with whatever main.js considers
    // publishable state — without it, this tab's hubTabs entry only
    // updates via the narrower recording/transcription events above,
    // and the Mini Panel lags behind the main app.
    'app:state-changed',
  ];

  eventNames.forEach((eventName) => {
    try {
      window.addEventListener(eventName, handleStateRelevantEvent);
    } catch (_) {}
  });
}

function discoverApp() {
  const direct = tryHookApp(window.__app);
  if (direct) {
    wireAppEvents(direct);
    return direct;
  }

  try {
    if (window.parent && window.parent !== window && window.parent.__app) {
      const parentApp = tryHookApp(window.parent.__app);
      if (parentApp) {
        wireAppEvents(parentApp);
        return parentApp;
      }
    }
  } catch (_) {}

  return null;
}

function initMiniPanelBridge() {
  const app = discoverApp();
  if (app) {
    publishLocalHubSnapshot('init');
  }

  ensureHubChannel();
  startHubHeartbeat();
  startProbeScanner();

  try {
    window.addEventListener('focus', () => {
      triggerLocalHubActivation('window-focus', { prune: true, force: true });
    });
  } catch (_) {}

  try {
    window.addEventListener('pageshow', () => {
      // The opener tab that owns the Mini Panel can miss a clean
      // focus/visibility transition when returning from another tab
      // or from a PiP/popup interaction. pageshow gives us one more
      // browser-driven reactivation hook so the owner tab auto-follows
      // just like peer tabs do.
      triggerLocalHubActivation('page-show', { prune: true, force: true });
    });
  } catch (_) {}

  try {
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        triggerLocalHubActivation('visibility-visible', { prune: true, force: true });
      } else {
        publishLocalHubSnapshot('visibility-hidden');
      }
    });
  } catch (_) {}

  try {
    document.addEventListener('pointerdown', () => {
      if (document.hidden) return;
      // Extra safety net for the Mini Panel owner tab: a real user
      // interaction inside the page should count as "this tab is
      // active" even if the browser did not emit the focus transition
      // we expected. Debounced in triggerLocalHubActivation().
      triggerLocalHubActivation('page-pointerdown');
    }, { capture: true, passive: true });
  } catch (_) {}

  try {
    window.addEventListener('beforeunload', () => {
      removeLocalHubTab();
      stopHubHeartbeat();
      stopProbeScanner();
    });
  } catch (_) {}

  try {
    window.addEventListener('pagehide', () => {
      removeLocalHubTab();
      stopHubHeartbeat();
      stopProbeScanner();
    });
  } catch (_) {}

  publishLocalHubSnapshot('bridge-ready');
}

function bootMiniController() {
  initMiniPanelBridge();

  const app = discoverApp();
  if (!app) {
    const retryUntil = Date.now() + 8000;
    const timer = window.setInterval(() => {
      const found = discoverApp();
      if (found) {
        window.clearInterval(timer);
        publishLocalHubSnapshot('app-found-late');
        requestUiRefresh();
        return;
      }
      if (Date.now() > retryUntil) {
        window.clearInterval(timer);
      }
    }, 250);
  }

  try {
    window.__openMiniPanel = openMiniPanel;
  } catch (_) {}

  try {
    window.__miniPanelController = {
      open: openMiniPanel,
      refresh: requestUiRefresh,
      publishState: publishLocalHubSnapshot,
      activate: activateLocalHubTab,
      // main.js asks the hub what color was assigned to it so the
      // favicon can match the Mini Panel dot. Returns { key, color }
      // or null. Accent is only considered "live" when there are 2+
      // tabs open; callers should also check getLiveTabCount().
      getAccentForTabId: (tabId) => {
        const id = String(tabId || '').trim();
        if (!id) return null;
        const assigned = tabColors.get(id);
        return assigned ? { key: assigned.key, color: assigned.color } : null;
      },
      getLiveTabCount: () => hubTabs.size,
    };
  } catch (_) {}

  // main.js dispatches 'mini-panel:open-requested' from the toolbar
  // button click handler and from app.openMiniPanel(). We are the only
  // listener — without this binding, clicking the Mini-panel button
  // does nothing because the event fires into the void.
  //
  // Note: window.open() and documentPictureInPicture.requestWindow()
  // both require a transient user activation. Dispatching a
  // CustomEvent from a click handler and handling it synchronously
  // here preserves that activation, so openMiniPanel() will still be
  // allowed to create the popup / PiP window.
  try {
    window.addEventListener('mini-panel:open-requested', () => {
      openMiniPanel().catch((err) => {
        console.warn('[mini-panel] open-requested failed', err);
      });
    });
  } catch (_) {}

  // The main page's recording runner mutates #statusMessage.innerText
  // directly (e.g. "Listening for speech…" → "Recording…") without
  // firing any event. Without a direct observer the Mini Panel only
  // picks up these transitions on the next heartbeat or button state
  // change, which is the lag the user sees. Observing the element
  // itself turns every silent text mutation into an immediate
  // publishLocalHubSnapshot, so the Mini Panel updates within ~20ms
  // of the main page.
  try {
    const bindStatusObserver = () => {
      const statusEl = document.getElementById('statusMessage');
      if (!statusEl || typeof MutationObserver !== 'function') return false;
      if (statusEl.dataset.miniHubStatusObserverBound === '1') return true;
      statusEl.dataset.miniHubStatusObserverBound = '1';

      let queued = false;
      const queuePublish = () => {
        if (queued) return;
        queued = true;
        // Microtask scheduling is NOT throttled by Chrome's background
        // tab rules, unlike setTimeout. Using a microtask means the
        // publish and UI update happen in the same task as the DOM
        // mutation that triggered the observer — no perceptible lag
        // even when the parent tab is backgrounded (PiP focus case).
        Promise.resolve().then(() => {
          queued = false;
          publishLocalHubSnapshot('status-text-observed');
          updateMiniPanelUi();
        });
      };

      const observer = new MutationObserver(() => queuePublish());
      observer.observe(statusEl, {
        childList: true,
        characterData: true,
        subtree: true,
      });
      return true;
    };

    if (!bindStatusObserver()) {
      // The status element may not exist yet at boot. Retry a few
      // times on DOMContentLoaded-ish intervals.
      let tries = 0;
      const retry = window.setInterval(() => {
        tries += 1;
        if (bindStatusObserver() || tries > 20) {
          window.clearInterval(retry);
        }
      }, 250);
    }
  } catch (_) {}
}

bootMiniController();

