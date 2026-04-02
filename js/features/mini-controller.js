// js/features/mini-controller.js
//
// Floating mini controller for transcribe.html
// - Opens a Document Picture-in-Picture window when available
// - Falls back to a small popup window when PiP is unavailable
// - Reuses the existing main-page controller on window.__app
// - Listens for app events and mirrors state in the mini panel
// - Includes prompt slot selector (number + title only)

const MINI_PANEL_WINDOW_NAME = 'whisperazure-mini-panel';
const MINI_PANEL_WIDTH = 320;
const MINI_PANEL_HEIGHT = 290;
const STATE_REFRESH_MS = 350;

let miniWindow = null;
let refreshTimer = null;
let appRef = null;
let copiedVisible = false;

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
    paused: {
      en: 'Paused',
      no: 'Pauset',
      nb: 'Pauset',
      nn: 'Pausa',
      sv: 'Pausad',
      da: 'Sat på pause',
      de: 'Pausiert',
      fr: 'En pause',
      it: 'In pausa',
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
      da: 'Note fuldført',
      de: 'Notiz abgeschlossen',
      fr: 'Note terminée',
      it: 'Nota completata',
    },
    ready: {
      en: 'Ready',
      no: 'Klar',
      nb: 'Klar',
      nn: 'Klar',
      sv: 'Klar',
      da: 'Klar',
      de: 'Bereit',
      fr: 'Prêt',
      it: 'Pronto',
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
      hasNote: false,
      statusText: '',
      pauseResumeLabel: 'Pause',
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
      hasNote: false,
      statusText: '',
      pauseResumeLabel: 'Pause',
    };
  }
}

function getSafePromptOptions() {
  const app = getApp();
  if (!app || typeof app.getMiniPanelPromptOptions !== 'function') {
    return [];
  }

  try {
    return Array.isArray(app.getMiniPanelPromptOptions())
      ? app.getMiniPanelPromptOptions()
      : [];
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
  return doc ? doc.getElementById(id) : null;
}

function setText(id, value) {
  const el = $(id);
  if (el) el.textContent = value;
}

function setDisabled(id, disabled) {
  const el = $(id);
  if (el) el.disabled = !!disabled;
}

function setBadge(text, tone = 'idle') {
  const badge = $('miniStatusBadge');
  if (!badge) return;
  badge.textContent = text;
  badge.dataset.tone = tone;
}

function showCopiedIndicator() {
  copiedVisible = true;
  const indicator = $('miniCopiedIndicator');
  if (!indicator) return;
  indicator.hidden = false;
  indicator.textContent = tMini('copied');
  indicator.dataset.show = '1';
}

function hideCopiedIndicator() {
  copiedVisible = false;
  const indicator = $('miniCopiedIndicator');
  if (!indicator) return;
  indicator.hidden = true;
  indicator.dataset.show = '0';
}

function showCopyFailedIndicator() {
  copiedVisible = true;
  const indicator = $('miniCopiedIndicator');
  if (!indicator) return;
  indicator.hidden = false;
  indicator.textContent = 'Copy failed';
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
  }

  return { id, label };
}

function syncPromptDropdown() {
  const select = $('miniPromptSelect');
  if (!select) return;

  const options = getSafePromptOptions()
    .map(normalizePromptOptionLabel)
    .filter(Boolean);
  const selected = getSafeSelectedPromptSlot();

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

function updateMiniPanelUi() {
  const doc = getMiniDoc();
  if (!doc) return;

  const state = getSafeState();
  const statusText = String(state.statusText || '').trim();
  const pauseResumeLabel = String(state.pauseResumeLabel || '').trim() || 'Pause/Resume';

  setDisabled('miniStartButton', !state.canStart);
  setDisabled('miniStopButton', !state.canStop);
  setDisabled('miniPauseButton', !state.canPauseResume);
  setDisabled('miniCopyButton', !state.hasNote);

  setText('miniPauseButton', pauseResumeLabel);
  setText('miniStatusText', statusText || tMini('ready'));
  setText('miniTitle', tMini('miniPanel'));
  setText('miniPromptLabel', tMini('prompt'));

  if (state.noteBusy) {
    setBadge(tMini('generatingNote'), 'note');
  } else if (state.transcribeBusy) {
    if (/resume/i.test(pauseResumeLabel)) {
      setBadge(tMini('paused'), 'paused');
    } else {
      setBadge(tMini('recording'), 'recording');
    }
  } else if (state.hasNote) {
    setBadge(tMini('noteCompleted'), 'ready');
  } else {
    setBadge(tMini('idle'), 'idle');
  }

  const indicator = $('miniCopiedIndicator');
  if (indicator) {
    indicator.textContent = tMini('copied');
    indicator.hidden = !copiedVisible;
    indicator.dataset.show = copiedVisible ? '1' : '0';
  }

  syncPromptDropdown();
}

function requestUiRefresh() {
  window.setTimeout(updateMiniPanelUi, 20);
  window.setTimeout(updateMiniPanelUi, 120);
  window.setTimeout(updateMiniPanelUi, 300);
}

function startRefreshLoop() {
  stopRefreshLoop();
  refreshTimer = window.setInterval(() => {
    if (!isMiniWindowOpen()) {
      stopRefreshLoop();
      return;
    }
    updateMiniPanelUi();
  }, STATE_REFRESH_MS);
}

function stopRefreshLoop() {
  if (refreshTimer) {
    window.clearInterval(refreshTimer);
    refreshTimer = null;
  }
}

function callAppAction(actionName, ...args) {
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

function bindMiniPanelEvents() {
  const startButton = $('miniStartButton');
  const stopButton = $('miniStopButton');
  const pauseButton = $('miniPauseButton');
  const copyButton = $('miniCopyButton');
  const closeButton = $('miniCloseButton');
  const promptSelect = $('miniPromptSelect');

  if (startButton) {
    startButton.addEventListener('click', () => {
      callAppAction('startRecording');
    });
  }

  if (stopButton) {
    stopButton.addEventListener('click', () => {
      callAppAction('stopRecording');
    });
  }

  if (pauseButton) {
    pauseButton.addEventListener('click', () => {
      callAppAction('togglePauseResume');
    });
  }

  if (copyButton) {
    copyButton.addEventListener('click', () => {
      callAppAction('copyGeneratedNote');
    });
  }

  if (promptSelect) {
    promptSelect.addEventListener('change', () => {
      const slot = String(promptSelect.value || '').trim();
      if (!slot) return;
      callAppAction('selectPromptSlot', slot);
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

  function applyScale() {
    try {
      const width = Math.max(1, targetWindow.innerWidth || MINI_PANEL_WIDTH);
      const height = Math.max(1, targetWindow.innerHeight || MINI_PANEL_HEIGHT);

      const scaleX = width / MINI_PANEL_WIDTH;
      const scaleY = height / MINI_PANEL_HEIGHT;

      // Current size is the max (1). Smaller windows scale content down.
      // No lower clamp here, so content can become very tiny if you want.
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
      width: 320px;
      height: 290px;
      transform: scale(var(--mini-scale));
      transform-origin: top left;
    }

    .panel {
      height: 100%;
      display: flex;
      flex-direction: column;
      gap: 8px;
      background: linear-gradient(180deg, rgba(18,29,52,0.98), rgba(14,22,40,0.98));
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 10px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.35);
    }

    .top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }

    .title {
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.02em;
      color: var(--text);
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
      gap: 8px;
      min-height: 30px;
      min-width: 0;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      min-height: 24px;
      padding: 4px 8px;
      border-radius: 999px;
      border: 1px solid var(--border);
      background: rgba(255,255,255,0.04);
      color: var(--muted);
      font-size: 11px;
      font-weight: 700;
      white-space: nowrap;
    }

    .badge[data-tone="idle"] { color: var(--muted); }
    .badge[data-tone="recording"] { color: var(--accent); }
    .badge[data-tone="paused"] { color: var(--warn); }
    .badge[data-tone="note"] { color: var(--info); }
    .badge[data-tone="ready"] { color: var(--accent); }

    .copied {
      font-size: 14px;
      font-weight: 800;
      color: var(--accent);
      opacity: 1;
      line-height: 1;
      white-space: nowrap;
      min-width: 0;
      flex: 0 1 auto;
    }

    .status-text {
      min-height: 18px;
      font-size: 11px;
      color: var(--muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-top: 2px;
    }

    @media (max-width: 220px) {
      .grid {
        grid-template-columns: 1fr;
      }
    }

    button.ctrl {
      border: 1px solid var(--button-border);
      background: var(--button);
      color: var(--text);
      border-radius: 10px;
      padding: 10px 8px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      min-height: 40px;
    }

    button.ctrl:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    button.ctrl.primary {
      background: #183151;
    }

    button.ctrl.copy {
      background: #17382f;
    }

    .prompt-wrap {
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-top: 2px;
    }

    .prompt-label {
      font-size: 11px;
      font-weight: 700;
      color: var(--muted);
      line-height: 1.2;
    }

    .prompt-select {
      width: 100%;
      border: 1px solid var(--button-border);
      background: var(--select-bg);
      color: var(--text);
      border-radius: 10px;
      padding: 8px 10px;
      font-size: 12px;
      font-weight: 600;
      min-height: 38px;
      outline: none;
    }

    .prompt-select:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  </style>
</head>
<body>
  <div class="panel-shell">
    <div class="panel">
      <div class="top">
        <div id="miniTitle" class="title">Mini panel</div>
        <button id="miniCloseButton" class="close-btn" type="button" aria-label="Close mini panel">×</button>
      </div>

      <div class="status-row">
        <div id="miniStatusBadge" class="badge" data-tone="idle">Idle</div>
        <div id="miniCopiedIndicator" class="copied" data-show="0" hidden>Copied!</div>
      </div>

      <div id="miniStatusText" class="status-text">Ready</div>

      <div class="grid">
        <button id="miniStartButton" class="ctrl primary" type="button">Start</button>
        <button id="miniPauseButton" class="ctrl" type="button">Pause</button>
        <button id="miniStopButton" class="ctrl" type="button">Stop</button>
        <button id="miniCopyButton" class="ctrl copy" type="button">Copy</button>
      </div>

      <div class="prompt-wrap">
        <label id="miniPromptLabel" class="prompt-label" for="miniPromptSelect">Prompt</label>
        <select id="miniPromptSelect" class="prompt-select" aria-label="Prompt slot"></select>
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
  if (isMiniWindowOpen()) {
    try {
      miniWindow.focus();
    } catch (_) {}
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
    emitMiniPanelStatus({ open: true });
  } catch (err) {
    console.warn('[mini-panel] failed to open', err);
  }
}

function handleStateRelevantEvent() {
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

  window.addEventListener('note-copy-failed', () => {
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
    ]);

    if (target.id && watchedIds.has(target.id)) {
      if (target.id === 'startButton') {
        hideCopiedIndicator();
      }
      handleStateRelevantEvent();

      if (target.id === 'copyNoteButton') {
        window.setTimeout(() => {
          showCopiedIndicator();
        }, 40);
      }
    }
  });

  window.addEventListener('beforeunload', () => {
    try {
      miniWindow?.close();
    } catch (_) {}
  });
}

function boot(existingApp) {
  if (window.__miniPanelBooted === true) return;
  window.__miniPanelBooted = true;
  appRef = existingApp || window.__app || null;
  bindMainWindowEvents();
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
