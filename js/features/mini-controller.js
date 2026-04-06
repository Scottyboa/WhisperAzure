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
      da: 'Transskription fuldført',
      de: 'Transkript fertig',
      fr: 'Transcription terminée',
      it: 'Trascrizione completata',
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
    recordingAborted: {
      en: 'Recording aborted',
      no: 'Opptak avbrutt',
      nb: 'Opptak avbrutt',
      nn: 'Opptak avbrote',
      sv: 'Inspelning avbruten',
      da: 'Optagelse afbrudt',
      de: 'Aufnahme abgebrochen',
      fr: 'Enregistrement annulé',
      it: 'Registrazione annullata',
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
    autoGenerate: {
      en: 'Auto-generate',
      no: 'Auto-generer',
      nb: 'Auto-generer',
      nn: 'Auto-generer',
      sv: 'Autogenerera',
      da: 'Auto-generer',
      de: 'Automatisch erzeugen',
      fr: 'Génération auto',
      it: 'Generazione auto',
    },
    autoCopy: {
      en: 'Auto-copy',
      no: 'Auto-copy',
      nb: 'Auto-copy',
      nn: 'Auto-copy',
      sv: 'Autokopiera',
      da: 'Auto-copy',
      de: 'Auto-Kopie',
      fr: 'Auto-copie',
      it: 'Copia auto',
    },
    autoCopyHelpShort: {
      en: 'Chrome extension required',
      no: 'Krever Chrome-utvidelse',
      nb: 'Krever Chrome-utvidelse',
      nn: 'Krev Chrome-utviding',
      sv: 'Chrome-tillägg krävs',
      da: 'Kræver Chrome-udvidelse',
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
      sv: 'Transkript',
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
    copyButton: {
      en: 'Copy',
      no: 'Kopier',
      nb: 'Kopier',
      nn: 'Kopier',
      sv: 'Kopiera',
      da: 'Kopiér',
      de: 'Kopieren',
      fr: 'Copier',
      it: 'Copia',
    },
    copyTranscript: {
      en: 'Copy transcript',
      no: 'Kopier transkripsjon',
      nb: 'Kopier transkripsjon',
      nn: 'Kopier transkripsjon',
      sv: 'Kopiera transkript',
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

function setChecked(id, checked) {
  const el = $(id);
  if (el && el.type === 'checkbox') {
    el.checked = !!checked;
  }
}

function setValue(id, value) {
  const el = $(id);
  if (el && 'value' in el) {
    el.value = value == null ? '' : String(value);
  }
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
  const nextSignature = desired
    .map((opt) => `${opt.value}|${opt.label}`)
    .join('||');

  if (existingSignature !== nextSignature) {
    select.innerHTML = '';
    desired.forEach((item) => {
      const option = select.ownerDocument.createElement('option');
      option.value = item.value;
      option.textContent = item.label;
      select.appendChild(option);
    });
  }
}

function getMiniPhasePresentation(state) {
  const phase = String(state?.miniPanelStatusPhase || 'idle').trim();

  switch (phase) {
    case 'recording':
      return { text: tMini('recording'), badge: tMini('recording'), tone: 'recording' };
    case 'paused':
      return { text: tMini('paused'), badge: tMini('paused'), tone: 'paused' };
    case 'transcribing':
      return { text: tMini('generatingTranscript'), badge: tMini('generatingTranscript'), tone: 'transcribe' };
    case 'transcript-completed':
      return { text: tMini('transcriptCompleted'), badge: tMini('transcriptCompleted'), tone: 'ready' };
    case 'note-generating':
      return { text: tMini('generatingNote'), badge: tMini('generatingNote'), tone: 'note' };
    case 'note-completed':
      return { text: tMini('noteCompleted'), badge: tMini('noteCompleted'), tone: 'ready' };
    case 'aborted':
      return { text: tMini('recordingAborted'), badge: tMini('recordingAborted'), tone: 'idle' };
    default:
      return null;
  }
}

function updateMiniPanelUi() {
  const doc = getMiniDoc();
  if (!doc) return;

  const state = getSafeState();
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
  setText('miniStatusText', phaseUi?.text || statusText || tMini('ready'));
  setText('miniTitle', tMini('miniPanel'));
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
  const copyTranscriptButton = $('miniCopyTranscriptButton');
  const copyNoteButton = $('miniCopyNoteButton');
  const abortButton = $('miniAbortButton');
  const closeButton = $('miniCloseButton');
  const promptSelect = $('miniPromptSelect');
  const autoGenerateToggle = $('miniAutoGenerateToggle');
  const autoCopyModeSelect = $('miniAutoCopyModeSelect');
  const usePromptToggle = $('miniUsePromptToggle');

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
      callAppAction('pauseResumeRecording');
    });
  }

  if (copyTranscriptButton) {
    copyTranscriptButton.addEventListener('click', () => {
      callAppAction('copyTranscription');
    });
  }

  if (copyNoteButton) {
    copyNoteButton.addEventListener('click', () => {
      callAppAction('copyGeneratedNote');
    });
  }

  if (abortButton) {
    abortButton.addEventListener('click', () => {
      callAppAction('abortRecording');
    });
  }

  if (autoGenerateToggle) {
    autoGenerateToggle.addEventListener('change', () => {
      callAppAction('setAutoGenerateEnabled', !!autoGenerateToggle.checked);
    });
  }

  if (autoCopyModeSelect) {
    autoCopyModeSelect.addEventListener('change', () => {
      callAppAction('setAutoCopyMode', autoCopyModeSelect.value);
    });
  }

  if (usePromptToggle) {
    usePromptToggle.addEventListener('change', () => {
      callAppAction('setUsePromptEnabled', !!usePromptToggle.checked);
    });
  }

  if (promptSelect) {
    promptSelect.addEventListener('change', () => {
      const slot = String(promptSelect.value || '').trim();
      if (!slot) return;
      callAppAction('setSelectedPromptSlot', slot);
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
      gap: 6px;
      min-height: 24px;
      min-width: 0;
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

    .badge[data-tone="note"] {
      background: rgba(148,183,255,0.12);
      border-color: rgba(148,183,255,0.28);
      color: var(--info);
    }

    .badge[data-tone="transcript"] {
      background: rgba(148,183,255,0.12);
      border-color: rgba(148,183,255,0.28);
      color: var(--info);
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
  transition: opacity 0.16s ease, transform 0.16s ease;
  white-space: normal;
  overflow-wrap: break-word;
}

.mini-tooltip a {
  color: var(--accent);
  text-decoration: underline;
}

.mini-tooltip code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 10px;
}

.mini-help-wrap:hover .mini-tooltip,
.mini-help-wrap:focus-within .mini-tooltip {
  opacity: 1;
  pointer-events: auto;
  transform: translateY(0);
}

    .setting-group--copy {
      flex: 0 0 auto;
    }

    .toggle-label,
    .setting-label {
      font-size: 10px;
      font-weight: 700;
      color: var(--muted);
      white-space: nowrap;
    }

    .mini-help {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 16px;
      height: 16px;
      border-radius: 999px;
      border: 1px solid var(--border);
      color: var(--muted);
      background: transparent;
      font-size: 10px;
      font-weight: 700;
      cursor: help;
      user-select: none;
      line-height: 1;
      padding: 0;
    }

    .mini-help:hover {
      border-color: var(--accent);
      color: var(--accent);
    }

    .mini-switch {
      position: relative;
      display: inline-flex;
      width: 34px;
      height: 20px;
      flex: 0 0 auto;
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
      background: rgba(255,255,255,0.08);
      border: 1px solid var(--button-border);
      border-radius: 999px;
      transition: background-color 0.18s ease, border-color 0.18s ease;
    }

    .mini-slider::before {
      content: "";
      position: absolute;
      width: 14px;
      height: 14px;
      left: 2px;
      top: 2px;
      border-radius: 50%;
      background: var(--text);
      transition: transform 0.18s ease;
    }

    .mini-switch input:checked + .mini-slider {
      background: rgba(111,211,166,0.18);
      border-color: rgba(111,211,166,0.38);
    }

    .mini-switch input:checked + .mini-slider::before {
      transform: translateX(14px);
    }

    .mini-select {
      min-width: 88px;
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

    .grid {
      display: grid;
      gap: 6px;
    }

    .ctrl {
      min-height: 34px;
      border-radius: 10px;
      border: 1px solid var(--button-border);
      background: var(--button);
      padding: 6px 8px;
      font-size: 12px;
      font-weight: 700;
      color: var(--text);
      cursor: pointer;
      transition: transform 0.08s ease, border-color 0.18s ease, background-color 0.18s ease;
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
        <div id="miniTitle" class="title">Mini panel</div>
        <button id="miniCloseButton" class="close-btn" type="button" aria-label="Close mini panel">×</button>
      </div>

      <div class="status-row">
        <div id="miniStatusBadge" class="badge" data-tone="idle">Idle</div>
        <div id="miniCopiedIndicator" class="copied" data-show="0" hidden>Copied!</div>
      </div>

      <div id="miniStatusText" class="status-text">Ready</div>

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
