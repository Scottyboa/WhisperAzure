// js/features/mini-controller.js
//
// Floating mini controller for transcribe.html
// - Opens a Document Picture-in-Picture window when available
// - Falls back to a small popup window when PiP is unavailable
// - Reuses the existing main-page controller on window.__app
// - Listens for app events and mirrors state in the mini panel

const MINI_PANEL_WINDOW_NAME = 'whisperazure-mini-panel';
const MINI_PANEL_WIDTH = 260;
const MINI_PANEL_HEIGHT = 170;
const STATE_REFRESH_MS = 350;

let miniWindow = null;
let refreshTimer = null;
let appRef = null;
let copiedFlashTimer = null;

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

function flashCopiedIndicator() {
  const indicator = $('miniCopiedIndicator');
  if (!indicator) return;

  indicator.hidden = false;
  indicator.textContent = 'Copied';
  indicator.dataset.show = '1';

  if (copiedFlashTimer) {
    clearTimeout(copiedFlashTimer);
  }

  copiedFlashTimer = setTimeout(() => {
    const nextIndicator = $('miniCopiedIndicator');
    if (!nextIndicator) return;
    nextIndicator.hidden = true;
    nextIndicator.dataset.show = '0';
  }, 1800);
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
  setText('miniStatusText', statusText || 'Ready');

  if (state.noteBusy) {
    setBadge('Generating note', 'note');
  } else if (state.transcribeBusy) {
    if (/resume/i.test(pauseResumeLabel)) {
      setBadge('Paused', 'paused');
    } else {
      setBadge('Recording', 'recording');
    }
  } else if (state.hasNote) {
    setBadge('Note ready', 'ready');
  } else {
    setBadge('Idle', 'idle');
  }
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

function callAppAction(actionName) {
  const app = getApp();
  if (!app || typeof app[actionName] !== 'function') return false;

  try {
    app[actionName]();
    window.setTimeout(updateMiniPanelUi, 40);
    window.setTimeout(updateMiniPanelUi, 200);
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

  if (closeButton) {
    closeButton.addEventListener('click', () => {
      try {
        miniWindow?.close();
      } catch (_) {}
    });
  }
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
      padding: 10px;
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
      min-height: 28px;
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
      font-size: 11px;
      font-weight: 700;
      color: var(--accent);
      opacity: 0.98;
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
  </style>
</head>
<body>
  <div class="panel">
    <div class="top">
      <div class="title">Mini panel</div>
      <button id="miniCloseButton" class="close-btn" type="button" aria-label="Close mini panel">×</button>
    </div>

    <div class="status-row">
      <div id="miniStatusBadge" class="badge" data-tone="idle">Idle</div>
      <div id="miniCopiedIndicator" class="copied" data-show="0" hidden>Copied</div>
    </div>

    <div id="miniStatusText" class="status-text">Ready</div>

    <div class="grid">
      <button id="miniStartButton" class="ctrl primary" type="button">Start</button>
      <button id="miniPauseButton" class="ctrl" type="button">Pause</button>
      <button id="miniStopButton" class="ctrl" type="button">Stop</button>
      <button id="miniCopyButton" class="ctrl copy" type="button">Copy</button>
    </div>
  </div>
</body>
</html>`);
  doc.close();

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
    updateMiniPanelUi();
    return;
  }

  try {
    if (canUseDocumentPiP()) {
      miniWindow = await window.documentPictureInPicture.requestWindow({
        width: MINI_PANEL_WIDTH,
        height: MINI_PANEL_HEIGHT,
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
  window.setTimeout(updateMiniPanelUi, 20);
  window.setTimeout(updateMiniPanelUi, 200);
}

function bindMainWindowEvents() {
  if (window.__miniPanelEventsBound === true) return;
  window.__miniPanelEventsBound = true;

  window.addEventListener('mini-panel:open-requested', () => {
    openMiniPanel();
  });

  window.addEventListener('note-copied', () => {
    flashCopiedIndicator();
    handleStateRelevantEvent();
  });

  window.addEventListener('note-generation-finished', handleStateRelevantEvent);
  window.addEventListener('note:finished', handleStateRelevantEvent);
  window.addEventListener('transcription:finished', handleStateRelevantEvent);

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
      handleStateRelevantEvent();
      if (target.id === 'copyNoteButton') {
        window.setTimeout(() => {
          flashCopiedIndicator();
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
