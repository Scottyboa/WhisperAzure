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

  const STATE_KEY = '__ui_state';
  const MODULE_CACHE = new Map();

  const app = {
    recordingInFlight: false,
    recordingPaused: false,
    noteGenerationInFlight: false,
    noteAbortController: null,
    noteGenerationTimerId: null,
  };

  window.__app = app;

  function getApp() {
    return window.__app || app;
  }

  function getEffectiveNoteUi() {
    const currentApp = getApp();
    return deriveNoteUiStateFromEffectiveProvider({
      noteProvider: currentApp.currentNoteProvider,
      noteProviderMode:
        currentApp.currentNoteProviderMode ||
        sessionStorage.getItem('selectedNoteProviderMode') ||
        DEFAULTS.noteProviderMode,
      openaiModel:
        currentApp.currentOpenAiModel ||
        sessionStorage.getItem('selectedOpenAIModel') ||
        DEFAULTS.openaiModel,
      vertexModel:
        currentApp.currentVertexModel ||
        sessionStorage.getItem('selectedVertexModel') ||
        DEFAULTS.vertexModel,
      bedrockModel:
        currentApp.currentBedrockModel ||
        sessionStorage.getItem('selectedBedrockModel') ||
        DEFAULTS.bedrockModel,
    });
  }

  function loadCachedModule(path) {
    if (!path) return Promise.reject(new Error('Missing module path'));
    if (!MODULE_CACHE.has(path)) {
      MODULE_CACHE.set(path, import(path));
    }
    return MODULE_CACHE.get(path);
  }

  function resolveNoteModulePath({
    noteProvider,
    noteProviderMode,
    openaiModel,
    vertexModel,
    bedrockModel,
  }) {
    return resolveNoteModulePathFromRegistry({
      noteProvider,
      noteProviderMode,
      openaiModel,
      vertexModel,
      bedrockModel,
    });
  }

  function resolveTranscribeModulePath(provider, { useDiarization } = {}) {
    return resolveTranscribeModulePathFromRegistry(provider, { useDiarization });
  }

  function resolveCurrentNoteModulePath() {
    const currentApp = getApp();
    const uiState = inferNoteProviderUi({
      noteProvider:
        currentApp.currentNoteProvider ||
        sessionStorage.getItem('selectedNoteProvider') ||
        DEFAULTS.noteProvider,
      noteProviderMode:
        currentApp.currentNoteProviderMode ||
        sessionStorage.getItem('selectedNoteProviderMode') ||
        DEFAULTS.noteProviderMode,
      openaiModel:
        currentApp.currentOpenAiModel ||
        sessionStorage.getItem('selectedOpenAIModel') ||
        DEFAULTS.openaiModel,
      vertexModel:
        currentApp.currentVertexModel ||
        sessionStorage.getItem('selectedVertexModel') ||
        DEFAULTS.vertexModel,
      bedrockModel:
        currentApp.currentBedrockModel ||
        sessionStorage.getItem('selectedBedrockModel') ||
        DEFAULTS.bedrockModel,
    });
    return resolveNoteModulePath(uiState);
  }

  function reloadWithSavedState(message) {
    console.warn(message);
    saveUIState();
    location.reload();
  }

  function getCurrentProvider() {
    return normalizeTranscribeProvider(
      sessionStorage.getItem('selectedProvider') || DEFAULTS.transcribeProvider
    );
  }

  function saveUIState() {
    const state = {
      transcription: document.getElementById('transcriptionText')?.value || '',
      note: document.getElementById('noteText')?.value || '',
      extraPrompt: document.getElementById('noteExtraPrompt')?.value || '',
      outputLanguage: document.getElementById('outputLanguageSelect')?.value || '',
      provider: sessionStorage.getItem('selectedProvider') || '',
      noteProvider: sessionStorage.getItem('selectedNoteProvider') || '',
      noteProviderMode: sessionStorage.getItem('selectedNoteProviderMode') || '',
      openaiModel: sessionStorage.getItem('selectedOpenAIModel') || '',
      vertexModel: sessionStorage.getItem('selectedVertexModel') || '',
      bedrockModel: sessionStorage.getItem('selectedBedrockModel') || '',
    };
    try {
      sessionStorage.setItem(STATE_KEY, JSON.stringify(state));
    } catch {}
  }

  function restoreUIState() {
    try {
      const raw = sessionStorage.getItem(STATE_KEY);
      if (!raw) return;
      const state = JSON.parse(raw);
      if (state.transcription && document.getElementById('transcriptionText')) {
        document.getElementById('transcriptionText').value = state.transcription;
      }
      if (state.note && document.getElementById('noteText')) {
        document.getElementById('noteText').value = state.note;
      }
      if (state.extraPrompt && document.getElementById('noteExtraPrompt')) {
        document.getElementById('noteExtraPrompt').value = state.extraPrompt;
      }
      if (state.outputLanguage && document.getElementById('outputLanguageSelect')) {
        document.getElementById('outputLanguageSelect').value = state.outputLanguage;
      }
      sessionStorage.removeItem(STATE_KEY);
    } catch {}
  }

  function replaceButtonWithClone(id, configureClone) {
    const button = document.getElementById(id);
    if (!button || !button.parentNode) return null;
    const clone = button.cloneNode(true);
    button.parentNode.replaceChild(clone, button);
    if (typeof configureClone === 'function') {
      configureClone(clone);
    }
    return clone;
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
      el.setAttribute('aria-disabled', busy ? 'true' : 'false');
    });
  }

  function beginNoteGeneration(abortController) {
    const currentApp = getApp();
    currentApp.noteGenerationInFlight = true;
    currentApp.noteAbortController = abortController || null;
    syncNoteActionButtons();
  }

  function finishNoteGeneration() {
    const currentApp = getApp();
    currentApp.noteGenerationInFlight = false;
    currentApp.noteAbortController = null;
    if (currentApp.noteGenerationTimerId) {
      clearInterval(currentApp.noteGenerationTimerId);
      currentApp.noteGenerationTimerId = null;
    }
    syncNoteActionButtons();
  }

  function resetNoteGenerationState() {
    const currentApp = getApp();
    if (currentApp.noteAbortController) {
      try {
        currentApp.noteAbortController.abort();
      } catch {}
    }
    finishNoteGeneration();
  }

  app.beginNoteGeneration = beginNoteGeneration;
  app.finishNoteGeneration = finishNoteGeneration;
  app.resetNoteGenerationState = resetNoteGenerationState;
  app.syncNoteActionButtons = syncNoteActionButtons;
  app.resolveCurrentNoteModulePath = resolveCurrentNoteModulePath;
  app.getEffectiveNoteUi = getEffectiveNoteUi;
  app.loadCachedModule = loadCachedModule;

  app.updateRecordingUiState = function updateRecordingUiState({
    inFlight = app.recordingInFlight,
    paused = app.recordingPaused,
  } = {}) {
    app.recordingInFlight = !!inFlight;
    app.recordingPaused = !!paused;
    document.dispatchEvent(
      new CustomEvent('app:recording-state-changed', {
        detail: {
          inFlight: app.recordingInFlight,
          paused: app.recordingPaused,
        },
      })
    );
  };

  app.isBusy = function isBusy() {
    return !!(getApp().recordingInFlight || getApp().noteGenerationInFlight);
  };

  app.switchNoteProvider = async function switchNoteProvider(next) {
    if (getApp().noteGenerationInFlight) {
      console.warn('[note:switch] Ignored provider switch while note generation is active.');
      syncNoteActionButtons();
      return false;
    }

    resetNoteGenerationState();
    delete getApp().__noteStartPulseBound;

    replaceButtonWithClone('generateNoteButton', (clone) => {
      delete clone.dataset.noteStartPulseBound;
      clone.id = 'generateNoteButton';
    });

    replaceButtonWithClone('abortNoteButton', (clone) => {
      clone.id = 'abortNoteButton';
    });

    const uiState = inferNoteProviderUi({
      noteProvider: next,
      noteProviderMode:
        sessionStorage.getItem('selectedNoteProviderMode') || DEFAULTS.noteProviderMode,
      openaiModel: sessionStorage.getItem('selectedOpenAIModel') || DEFAULTS.openaiModel,
      vertexModel: sessionStorage.getItem('selectedVertexModel') || DEFAULTS.vertexModel,
      bedrockModel: sessionStorage.getItem('selectedBedrockModel') || DEFAULTS.bedrockModel,
    });

    const path = resolveNoteModulePath(uiState);
    console.log(`[note:switch] ${getNoteProviderLogLabel(uiState)}`);

    getApp().currentNoteProvider = uiState.noteProvider;
    getApp().currentNoteProviderMode = uiState.noteProviderMode;
    getApp().currentOpenAiModel = uiState.openaiModel;
    getApp().currentVertexModel = uiState.vertexModel;
    getApp().currentBedrockModel = uiState.bedrockModel;
    getApp().currentNoteModulePath = path;

    try {
      const mod = await loadCachedModule(path);
      if (mod && typeof mod.initNoteGeneration === 'function') {
        mod.initNoteGeneration();
        getApp().bindNoteStartPulse?.();
        syncNoteActionButtons();
        return true;
      } else {
        throw new Error('initNoteGeneration() missing');
      }
    } catch (e) {
      reloadWithSavedState('Switch note provider failed, falling back to reload');
      return false;
    }
  };

  app.switchTranscribeProvider = async function switchTranscribeProvider(next, opts = {}) {
    const provider = normalizeTranscribeProvider(next);
    const useDiarization = !!opts.useDiarization;
    const path = resolveTranscribeModulePath(provider, { useDiarization });

    getApp().currentProvider = provider;
    getApp().currentTranscribeModulePath = path;

    try {
      const mod = await loadCachedModule(path);
      if (mod && typeof mod.init === 'function') {
        mod.init();
      } else {
        throw new Error('init() missing');
      }
    } catch (e) {
      reloadWithSavedState('Switch transcribe provider failed, falling back to reload');
    }
  };

  app.reloadWithSavedState = reloadWithSavedState;

  app.bindNoteStartPulse = function bindNoteStartPulse() {
    const currentApp = getApp();
    const button = document.getElementById('generateNoteButton');
    if (!button || button.dataset.noteStartPulseBound === '1') return;
    button.dataset.noteStartPulseBound = '1';
    button.addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('app:note-generation-start-click'));
    });
    currentApp.__noteStartPulseBound = true;
  };

  function initNoteProviderState() {
    const uiState = inferNoteProviderUi({
      noteProvider: sessionStorage.getItem('selectedNoteProvider') || DEFAULTS.noteProvider,
      noteProviderMode:
        sessionStorage.getItem('selectedNoteProviderMode') || DEFAULTS.noteProviderMode,
      openaiModel: sessionStorage.getItem('selectedOpenAIModel') || DEFAULTS.openaiModel,
      vertexModel: sessionStorage.getItem('selectedVertexModel') || DEFAULTS.vertexModel,
      bedrockModel: sessionStorage.getItem('selectedBedrockModel') || DEFAULTS.bedrockModel,
    });

    getApp().currentNoteProvider = uiState.noteProvider;
    getApp().currentNoteProviderMode = uiState.noteProviderMode;
    getApp().currentOpenAiModel = uiState.openaiModel;
    getApp().currentVertexModel = uiState.vertexModel;
    getApp().currentBedrockModel = uiState.bedrockModel;
    getApp().currentNoteModulePath = resolveNoteModulePath(uiState);
  }

  function initTranscribeProviderState() {
    const provider = getCurrentProvider();
    const useDiarization = provider === 'soniox' && !!sessionStorage.getItem('selectedProviderDiarization');
    getApp().currentProvider = provider;
    getApp().currentTranscribeModulePath = resolveTranscribeModulePath(provider, {
      useDiarization,
    });
  }

  function setupBackButton() {
    const button = document.getElementById('backButton');
    if (!button) return;
    button.addEventListener('click', () => {
      saveUIState();
      window.location.href = 'index.html';
    });
  }

  function setupCopyButtons() {
    const copyTranscriptionButton = document.getElementById('copyTranscriptionButton');
    const copyNoteButton = document.getElementById('copyNoteButton');
    const transcriptionText = document.getElementById('transcriptionText');
    const noteText = document.getElementById('noteText');

    if (copyTranscriptionButton && transcriptionText) {
      copyTranscriptionButton.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(transcriptionText.value || '');
        } catch {}
      });
    }

    if (copyNoteButton && noteText) {
      copyNoteButton.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(noteText.value || '');
        } catch {}
      });
    }
  }

  function setupClearButtons() {
    const clearTranscriptionButton = document.getElementById('clearTranscriptionButton');
    const clearNoteButton = document.getElementById('clearNoteButton');
    const transcriptionText = document.getElementById('transcriptionText');
    const noteText = document.getElementById('noteText');

    if (clearTranscriptionButton && transcriptionText) {
      clearTranscriptionButton.addEventListener('click', () => {
        transcriptionText.value = '';
        transcriptionText.dispatchEvent(new Event('input', { bubbles: true }));
      });
    }

    if (clearNoteButton && noteText) {
      clearNoteButton.addEventListener('click', () => {
        noteText.value = '';
        noteText.dispatchEvent(new Event('input', { bubbles: true }));
      });
    }
  }

  function setupAutoCopyAndClear() {
    const autoCopyCheckbox = document.getElementById('autoCopyToggle');
    const autoClearCheckbox = document.getElementById('autoClearToggle');

    if (autoCopyCheckbox) {
      autoCopyCheckbox.checked = localStorage.getItem('autoCopyEnabled') === '1';
      autoCopyCheckbox.addEventListener('change', () => {
        localStorage.setItem('autoCopyEnabled', autoCopyCheckbox.checked ? '1' : '0');
      });
    }

    if (autoClearCheckbox) {
      autoClearCheckbox.checked = localStorage.getItem('autoClearEnabled') === '1';
      autoClearCheckbox.addEventListener('change', () => {
        localStorage.setItem('autoClearEnabled', autoClearCheckbox.checked ? '1' : '0');
      });
    }
  }

  function setupSupplementaryFieldToggles() {
    const toggle = document.getElementById('showSupplementaryFieldsToggle');
    const wrap = document.getElementById('supplementaryFieldsWrap');
    if (!toggle || !wrap) return;

    const apply = () => {
      wrap.style.display = toggle.checked ? '' : 'none';
    };

    toggle.addEventListener('change', apply);
    apply();
  }

  function initOutputLanguage() {
    const select = document.getElementById('outputLanguageSelect');
    if (!select) return;

    const saved = localStorage.getItem('selectedOutputLanguage');
    if (saved) {
      select.value = saved;
    }

    select.addEventListener('change', () => {
      localStorage.setItem('selectedOutputLanguage', select.value || '');
    });
  }

  function emitReadyEvents() {
    document.dispatchEvent(new CustomEvent('app:controller-ready', { detail: { app: getApp() } }));
    document.dispatchEvent(new CustomEvent('app:note-ui-ready'));
    document.dispatchEvent(new CustomEvent('app:recording-ui-ready'));
  }

  async function initFeatureModules() {
    const featurePaths = [
      './js/features/provider-persistence.js',
      './js/features/page-ui.js',
      './js/features/recording-ui.js',
      './js/features/field-feedback.js',
      './js/features/note-usage-cost.js',
      './js/features/analytics.js',
      './js/features/overlays.js',
      './js/features/editor-tools.js',
      './js/features/prompt-slots-ui.js',
      './js/features/ad-refresh.js',
    ];

    for (const path of featurePaths) {
      try {
        const mod = await import(path.replace('./js/', './'));
        if (mod && typeof mod.init === 'function') {
          mod.init(getApp());
        }
      } catch (e) {
        console.warn(`[feature] Failed to initialize ${path}`, e);
      }
    }
  }

  async function initProviders() {
    try {
      const transcribePath = getApp().currentTranscribeModulePath;
      if (transcribePath) {
        const transcribeMod = await loadCachedModule(transcribePath);
        if (transcribeMod && typeof transcribeMod.init === 'function') {
          transcribeMod.init();
        }
      }
    } catch (e) {
      console.warn('[transcribe:init] failed', e);
    }

    try {
      const notePath = getApp().currentNoteModulePath;
      if (notePath) {
        const noteMod = await loadCachedModule(notePath);
        if (noteMod && typeof noteMod.initNoteGeneration === 'function') {
          noteMod.initNoteGeneration();
        }
      }
    } catch (e) {
      console.warn('[note:init] failed', e);
    }
  }

  function setupBeforeUnload() {
    window.addEventListener('beforeunload', () => {
      saveUIState();
      const currentApp = getApp();
      if (currentApp.noteAbortController) {
        try {
          currentApp.noteAbortController.abort();
        } catch {}
      }
    });
  }

  function wireGlobalBusyEvents() {
    document.addEventListener('app:note-generation-begin', (event) => {
      beginNoteGeneration(event?.detail?.abortController || null);
    });

    document.addEventListener('app:note-generation-finish', () => {
      finishNoteGeneration();
    });

    document.addEventListener('app:note-generation-reset', () => {
      resetNoteGenerationState();
    });
  }

  function setupPromptProfileRestore() {
    const profileId = localStorage.getItem('promptProfileId');
    if (!profileId) return;
    try {
      window.PromptManager?.setPromptProfileId(profileId);
    } catch {}
  }

  function setupDebugHelpers() {
    window.__reloadTranscribePageWithState = reloadWithSavedState;
    window.__resolveCurrentNoteModulePath = resolveCurrentNoteModulePath;
    window.__getEffectiveNoteUi = getEffectiveNoteUi;
  }

  (async function boot() {
    initNoteProviderState();
    initTranscribeProviderState();

    restoreUIState();
    setupBackButton();
    setupCopyButtons();
    setupClearButtons();
    setupAutoCopyAndClear();
    setupSupplementaryFieldToggles();
    initOutputLanguage();
    wireGlobalBusyEvents();
    setupBeforeUnload();
    setupDebugHelpers();

    await initFeatureModules();
    await initProviders();

    getApp().bindNoteStartPulse?.();
    syncNoteActionButtons();
    setupPromptProfileRestore();
    emitReadyEvents();
  })();
});
