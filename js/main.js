import { initTranscribeLanguage } from './languageLoaderUsage.js';
import {
  DEFAULTS,
  deriveNoteUiStateFromEffectiveProvider,
  getNoteProviderLogLabel,
  inferNoteProviderUi,
  normalizeTranscribeProvider,
  resolveNoteModulePath as resolveNoteModulePathFromRegistry,
  resolveTranscribeModulePath as resolveTranscribeModulePathFromRegistry,
} from './core/provider-registry.js';

document.addEventListener('DOMContentLoaded', () => {
  initTranscribeLanguage();

  const STATE_KEY = '__ui_state_v1';
  const AUTO_GENERATE_KEY = 'auto_generate_enabled';

  function getApp() {
    const existing = window.__app || {};
    const app = (window.__app = existing);
    app.cachedModules = app.cachedModules || {};
    return app;
  }

  function readSession(key, fallback = '') {
    try {
      const value = sessionStorage.getItem(key);
      return value == null ? fallback : value;
    } catch (_) {
      return fallback;
    }
  }

  function writeSession(key, value) {
    try {
      sessionStorage.setItem(key, String(value ?? ''));
    } catch (_) {}
  }

  function reloadWithSavedState(reason = '') {
    if (reason) {
      console.warn(reason);
    }

    try {
      saveState();
    } catch (_) {}

    window.location.reload();
  }

  function saveState() {
    const grab = (id) => {
      const el = document.getElementById(id);
      if (!el) return null;
      return {
        value: el.value ?? '',
        selStart: el.selectionStart ?? null,
        selEnd: el.selectionEnd ?? null,
        scrollTop: el.scrollTop ?? 0,
      };
    };

    const payload = {
      transcription: grab('transcription'),
      generatedNote: grab('generatedNote'),
      customPrompt: grab('customPrompt'),
      ts: Date.now(),
    };

    try {
      sessionStorage.setItem(STATE_KEY, JSON.stringify(payload));
    } catch {}
  }

  function restoreState() {
    let raw = null;
    try {
      raw = sessionStorage.getItem(STATE_KEY);
    } catch {}
    if (!raw) return;

    try {
      const s = JSON.parse(raw);
      const put = (id, sObj) => {
        if (!sObj) return;
        const el = document.getElementById(id);
        if (!el) return;

        el.value = sObj.value || '';
        if (typeof sObj.scrollTop === 'number') el.scrollTop = sObj.scrollTop;

        setTimeout(() => {
          if (typeof sObj.selStart === 'number' && typeof sObj.selEnd === 'number') {
            try {
              el.setSelectionRange(sObj.selStart, sObj.selEnd);
            } catch {}
          }
        }, 0);
      };

      put('transcription', s.transcription);
      put('generatedNote', s.generatedNote);
      put('customPrompt', s.customPrompt);
    } finally {
      try {
        sessionStorage.removeItem(STATE_KEY);
      } catch {}
    }
  }

  function syncNoteActionButtons() {
    const generateNoteButton = document.getElementById('generateNoteButton');
    const abortNoteButton = document.getElementById('abortNoteButton');
    const noteProviderSelect = document.getElementById('noteProvider');
    const openaiModelSelect = document.getElementById('openaiModel');
    const noteModeSelect = document.getElementById('noteProviderMode');
    const vertexModelSelect = document.getElementById('vertexModel');
    const bedrockModelSelect = document.getElementById('bedrockModel');
    const busy = !!getApp().noteGenerationInFlight;

    if (generateNoteButton) {
      generateNoteButton.disabled = busy;
      generateNoteButton.title = busy ? 'A note is currently generating.' : '';
    }

    if (abortNoteButton) {
      abortNoteButton.disabled = !busy;
      abortNoteButton.title = busy ? '' : 'No active note generation to abort.';
    }

    [
      noteProviderSelect,
      openaiModelSelect,
      noteModeSelect,
      vertexModelSelect,
      bedrockModelSelect,
    ].forEach((el) => {
      if (!el) return;
      el.disabled = busy;
      el.title = busy ? 'Provider settings are locked while a note is generating.' : '';
    });
  }

  function beginNoteGeneration(meta = {}) {
    const app = getApp();
    if (app.noteGenerationInFlight) return null;

    const controller = new AbortController();
    app.noteGenerationInFlight = true;
    app.noteGenerationAbortController = controller;
    app.noteGenerationMeta = meta || {};
    syncNoteActionButtons();
    return controller;
  }

  function finishNoteGeneration() {
    const app = getApp();
    app.noteGenerationInFlight = false;
    app.noteGenerationAbortController = null;
    app.noteGenerationMeta = null;
    syncNoteActionButtons();
  }

  function abortNoteGeneration() {
    const controller = getApp().noteGenerationAbortController;
    if (controller) {
      try {
        controller.abort();
      } catch (_) {}
    }
  }

  function buildFinishedNoteDetail(meta = {}) {
    const noteEl = document.getElementById('generatedNote');
    const text = String(noteEl?.value || '');
    return {
      status: meta?.aborted ? 'aborted' : 'success',
      text,
      textLength: text.length,
      autoCopyEnabled: localStorage.getItem('autoCopyFinishedNote') === 'true',
      emittedAt: Date.now(),
      ...meta,
    };
  }

  function emitNoteFinished(meta = {}) {
    try {
      const detail = buildFinishedNoteDetail(meta);
      window.dispatchEvent(new CustomEvent('note-generation-finished', { detail }));
      window.dispatchEvent(new CustomEvent('note:finished', { detail }));
      finishNoteGeneration();
      return detail;
    } catch (_) {
      finishNoteGeneration();
      return buildFinishedNoteDetail(meta);
    }
  }

  function resetNoteGenerationState() {
    finishNoteGeneration();
  }

  function getSelectedTranscribeProvider() {
    const fromUi = document.getElementById('transcribeProvider')?.value;
    const normalized = normalizeTranscribeProvider(
      fromUi || readSession('transcribe_provider', DEFAULTS.transcribeProvider)
    );

    if (normalized !== readSession('transcribe_provider', DEFAULTS.transcribeProvider)) {
      writeSession('transcribe_provider', normalized);
    }
    if (normalized === 'soniox' && readSession('soniox_speaker_labels', '') !== 'on') {
      // no-op; legacy migration is handled inside normalizeTranscribeProvider + provider persistence
    }

    return normalized;
  }

  function getSelectedSonioxRegion() {
    return String(
      document.getElementById('sonioxRegion')?.value ||
        readSession('soniox_region', DEFAULTS.sonioxRegion)
    ).toLowerCase();
  }

  function getSelectedSonioxSpeakerLabels() {
    return String(
      document.getElementById('sonioxSpeakerLabels')?.value ||
        readSession('soniox_speaker_labels', DEFAULTS.sonioxSpeakerLabels)
    ).toLowerCase();
  }

  function getSelectedEffectiveNoteProvider() {
    return String(readSession('note_provider', DEFAULTS.noteProvider)).toLowerCase();
  }

  function getDerivedNoteUiState() {
    return deriveNoteUiStateFromEffectiveProvider(
      getSelectedEffectiveNoteProvider(),
      readSession('note_provider_mode', DEFAULTS.noteMode)
    );
  }

  function getSelectedNoteProviderUi() {
    return String(
      document.getElementById('noteProvider')?.value ||
        inferNoteProviderUi(getSelectedEffectiveNoteProvider())
    ).toLowerCase();
  }

  function getSelectedOpenAiModel() {
    const domValue = String(document.getElementById('openaiModel')?.value || '').toLowerCase();
    if (domValue) return domValue;

    const stored = String(readSession('openai_model', '')).toLowerCase();
    if (stored) return stored;

    return getDerivedNoteUiState().openaiModel;
  }

  function getSelectedVertexModel() {
    return String(
      document.getElementById('vertexModel')?.value ||
        readSession('vertex_model', '')
    ).toLowerCase();
  }

  function getSelectedBedrockModel() {
    return String(
      document.getElementById('bedrockModel')?.value ||
        readSession('bedrock_model', '')
    ).toLowerCase();
  }

  function getSelectedNoteProviderMode() {
    const domValue = String(document.getElementById('noteProviderMode')?.value || '').toLowerCase();
    if (domValue) return domValue;

    const stored = String(readSession('note_provider_mode', '')).toLowerCase();
    if (stored) return stored;

    return getDerivedNoteUiState().mode;
  }

  function getTranscribeProviderSnapshot() {
    return {
      transcribeProvider: getSelectedTranscribeProvider(),
      sonioxRegion: getSelectedSonioxRegion(),
      sonioxSpeakerLabels: getSelectedSonioxSpeakerLabels(),
    };
  }

  function getNoteProviderSnapshot() {
    const effective = getSelectedEffectiveNoteProvider();
    const uiProvider = getSelectedNoteProviderUi();
    const vertexModel = getSelectedVertexModel();
    const bedrockModel = getSelectedBedrockModel();
    const openaiModel = getSelectedOpenAiModel();
    const noteProviderMode = getSelectedNoteProviderMode();

    return {
      noteProviderUi: uiProvider,
      noteProviderEffective: effective,
      noteProviderMode,
      openaiModel,
      vertexModel,
      bedrockModel,
      noteProviderLogLabel: getNoteProviderLogLabel({
        effectiveProvider: effective,
        openaiModel,
        vertexModel,
        bedrockModel,
      }),
    };
  }

  function resolveTranscribeModulePath(provider) {
    return resolveTranscribeModulePathFromRegistry(provider, {
      sonioxSpeakerLabels: getSelectedSonioxSpeakerLabels(),
    });
  }

  function resolveNoteModulePath(choice) {
    return resolveNoteModulePathFromRegistry(choice || getSelectedEffectiveNoteProvider());
  }

  async function loadCachedModule(path) {
    const app = getApp();
    if (!app.cachedModules[path]) {
      app.cachedModules[path] = await import(path);
    }
    return app.cachedModules[path];
  }

  function replaceButtonWithClone(id, beforeReplace) {
    const btn = document.getElementById(id);
    if (!btn || !btn.parentNode) return null;

    const clone = btn.cloneNode(true);
    if (typeof beforeReplace === 'function') beforeReplace(clone, btn);
    btn.parentNode.replaceChild(clone, btn);
    return clone;
  }

  async function initRecordingProvider(provider) {
    const normalized = normalizeTranscribeProvider(provider || getSelectedTranscribeProvider());
    const path = resolveTranscribeModulePath(normalized);

    console.info('[recording:init] provider:', normalized, 'module:', path);

    try {
      const mod = await loadCachedModule(path);
      if (mod && typeof mod.initRecording === 'function') {
        mod.initRecording();
      } else {
        console.error('Selected recording module lacks initRecording()');
      }
    } catch (e) {
      console.error('Failed to load recording module for provider:', normalized, e);
    }
  }

  async function initNoteProvider(choice) {
    const path = resolveNoteModulePath(choice || getSelectedEffectiveNoteProvider());

    try {
      const mod = await loadCachedModule(path);
      if (mod && typeof mod.initNoteGeneration === 'function') {
        mod.initNoteGeneration();
      } else {
        console.warn(`Module ${path} missing initNoteGeneration(); falling back to GPT-4-latest`);
        const fallback = await loadCachedModule('./noteGeneration.js');
        fallback.initNoteGeneration?.();
      }
    } catch (e) {
      console.warn(`Failed to load ${path}; falling back to GPT-4-latest`, e);
      const fallback = await loadCachedModule('./noteGeneration.js');
      fallback.initNoteGeneration?.();
    }
  }

  function isTranscribeBusy() {
    const stopBtn = document.getElementById('stopButton');
    if (stopBtn && stopBtn.disabled === false) return true;

    const status = (document.getElementById('statusMessage')?.innerText || '').trim();
    if (!status) return false;
    if (/finishing transcription/i.test(status)) return true;
    if (/(transcribing|processing|uploading)/i.test(status) && !/transcription finished/i.test(status)) {
      return true;
    }

    return false;
  }

  function getAutoGenerateEnabled() {
    return readSession(AUTO_GENERATE_KEY, '') === '1';
  }

  function setAutoGenerateEnabled(enabled) {
    writeSession(AUTO_GENERATE_KEY, enabled ? '1' : '0');
    const el = document.getElementById('autoGenerateToggle');
    if (el && el.type === 'checkbox') el.checked = !!enabled;
  }

  function initAutoGenerateToggle() {
    const el = document.getElementById('autoGenerateToggle');
    if (!el || el.type !== 'checkbox') return;

    if (el.dataset.bound === '1') return;
    el.dataset.bound = '1';

    if (readSession(AUTO_GENERATE_KEY, null) == null) {
      writeSession(AUTO_GENERATE_KEY, '0');
    }

    el.checked = getAutoGenerateEnabled();
    el.addEventListener('change', () => {
      writeSession(AUTO_GENERATE_KEY, el.checked ? '1' : '0');
    });
  }

  function emitTranscriptionFinished(opts) {
    try {
      window.dispatchEvent(new CustomEvent('transcription:finished', { detail: opts || {} }));
    } catch (err) {
      try {
        const ev = document.createEvent('CustomEvent');
        ev.initCustomEvent('transcription:finished', false, false, opts || {});
        window.dispatchEvent(ev);
      } catch {}
    }
  }

  function tryAutoGenerateNote(eventDetail) {
    if (!getAutoGenerateEnabled()) return;

    const genBtn = document.getElementById('generateNoteButton');
    if (!genBtn || genBtn.disabled) return;

    const transcript = (document.getElementById('transcription')?.value || '').trim();
    if (!transcript) return;

    if (typeof getApp().isTranscribeBusy === 'function' && getApp().isTranscribeBusy()) {
      return;
    }

    const now = Date.now();
    const fp = `${eventDetail?.provider || 'unknown'}:${eventDetail?.transcriptLength || transcript.length}`;
    const last = getApp().__lastAutoGenerate || null;
    if (last && last.fp === fp && (now - last.at) < 2000) return;
    getApp().__lastAutoGenerate = { fp, at: now };

    if (getApp().isNoteGenerationBusy?.()) return;
    genBtn.click();
  }

  function initAutoGenerateOnFinishListener() {
    const app = getApp();
    if (app.__autoGenerateListenerBound) return;
    app.__autoGenerateListenerBound = true;

    window.addEventListener('transcription:finished', (e) => {
      try {
        tryAutoGenerateNote(e && e.detail ? e.detail : null);
      } catch (err) {
        console.warn('Auto-generate failed', err);
      }
    });
  }

  const app = getApp();
  app.saveState = saveState;
  app.restoreState = restoreState;
  app.reloadWithSavedState = reloadWithSavedState;
  app.noteGenerationInFlight = false;
  app.noteGenerationAbortController = null;
  app.noteGenerationMeta = null;
  app.syncNoteActionButtons = syncNoteActionButtons;
  app.beginNoteGeneration = beginNoteGeneration;
  app.finishNoteGeneration = finishNoteGeneration;
  app.abortNoteGeneration = abortNoteGeneration;
  app.emitNoteFinished = emitNoteFinished;
  app.resetNoteGenerationState = resetNoteGenerationState;
  app.isNoteGenerationBusy = () => !!getApp().noteGenerationInFlight;
  app.isTranscribeBusy = isTranscribeBusy;
  app.getAutoGenerateEnabled = getAutoGenerateEnabled;
  app.setAutoGenerateEnabled = setAutoGenerateEnabled;
  app.initAutoGenerateToggle = initAutoGenerateToggle;
  app.emitTranscriptionFinished = emitTranscriptionFinished;
  app.tryAutoGenerateNote = tryAutoGenerateNote;
  app.initAutoGenerateOnFinishListener = initAutoGenerateOnFinishListener;
  app.getSelectedTranscribeProvider = getSelectedTranscribeProvider;
  app.getSelectedSonioxRegion = getSelectedSonioxRegion;
  app.getSelectedSonioxSpeakerLabels = getSelectedSonioxSpeakerLabels;
  app.getSelectedEffectiveNoteProvider = getSelectedEffectiveNoteProvider;
  app.getSelectedNoteProviderUi = getSelectedNoteProviderUi;
  app.getSelectedOpenAiModel = getSelectedOpenAiModel;
  app.getSelectedVertexModel = getSelectedVertexModel;
  app.getSelectedBedrockModel = getSelectedBedrockModel;
  app.getSelectedNoteProviderMode = getSelectedNoteProviderMode;
  app.getTranscribeProviderSnapshot = getTranscribeProviderSnapshot;
  app.getNoteProviderSnapshot = getNoteProviderSnapshot;
  app.resolveTranscribeModulePath = resolveTranscribeModulePath;
  app.resolveNoteModulePath = resolveNoteModulePath;
  app.providerRegistry = {
    defaults: DEFAULTS,
    deriveNoteUiStateFromEffectiveProvider,
    inferNoteProviderUi,
    normalizeTranscribeProvider,
    resolveTranscribeModulePath,
    resolveNoteModulePath,
  };
  app.loadCachedModule = loadCachedModule;
  app.initRecordingProvider = initRecordingProvider;
  app.initNoteProvider = initNoteProvider;

  app.switchNoteProvider = async function switchNoteProvider(next) {
    if (getApp().noteGenerationInFlight) {
      console.warn('[note:switch] Ignored provider switch while note generation is active.');
      syncNoteActionButtons();
      return;
    }

    resetNoteGenerationState();
    delete getApp().__noteStartPulseBound;

    replaceButtonWithClone('generateNoteButton', (clone) => {
      delete clone.dataset.noteStartPulseBound;
      clone.removeAttribute('data-note-start-pulse-bound');
    });

    const abortBtn = document.getElementById('abortNoteButton');
    if (abortBtn) abortBtn.disabled = true;

    writeSession('note_provider', String(next || DEFAULTS.noteProvider).toLowerCase());
    const choice = getSelectedEffectiveNoteProvider();
    const path = resolveNoteModulePath(choice);

    try {
      const mod = await loadCachedModule(path);
      if (mod && typeof mod.initNoteGeneration === 'function') {
        mod.initNoteGeneration();
        getApp().bindNoteStartPulse?.();
        syncNoteActionButtons();
      } else {
        throw new Error('initNoteGeneration() missing');
      }
    } catch (e) {
      reloadWithSavedState('Switch note provider failed, falling back to reload');
    }
  };

  app.switchTranscribeProvider = async function switchTranscribeProvider(next) {
    ['startButton', 'stopButton', 'pauseResumeButton', 'abortButton'].forEach((id) => {
      replaceButtonWithClone(id);
    });

    writeSession('transcribe_provider', String(next || DEFAULTS.transcribeProvider).toLowerCase());
    const provider = getSelectedTranscribeProvider();
    const path = resolveTranscribeModulePath(provider);

    console.info('[recording:switch] provider:', provider, 'module:', path);

    try {
      const mod = await loadCachedModule(path);
      if (mod && typeof mod.initRecording === 'function') {
        mod.initRecording();
      } else {
        throw new Error('initRecording() missing');
      }
    } catch (e) {
      reloadWithSavedState('Switch transcribe provider failed, falling back to reload');
    }
  };

  const abortNoteButton = document.getElementById('abortNoteButton');
  if (abortNoteButton && abortNoteButton.dataset.mainAbortBound !== '1') {
    abortNoteButton.dataset.mainAbortBound = '1';
    abortNoteButton.addEventListener('click', () => {
      abortNoteGeneration();
    });
  }

  window.addEventListener('note-generation-finished', () => {
    finishNoteGeneration();
  });

  syncNoteActionButtons();
  restoreState();
  initAutoGenerateToggle();
  initAutoGenerateOnFinishListener();

  initRecordingProvider(getSelectedTranscribeProvider());
  initNoteProvider(getSelectedEffectiveNoteProvider());

  if (!document.body.dataset.recordHotkeyBound) {
    document.body.dataset.recordHotkeyBound = '1';
    document.addEventListener('keydown', (event) => {
      const activeElement = document.activeElement;
      if (
        activeElement &&
        (activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          activeElement.isContentEditable)
      ) {
        return;
      }

      if (event.key.toLowerCase() === 'r') {
        const startButton = document.getElementById('startButton');
        if (startButton) {
          startButton.click();
        }
      }
    });
  }
});
