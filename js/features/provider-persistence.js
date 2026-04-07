// js/features/provider-persistence.js
//
// Centralized provider persistence + selector UI wiring.
// This module owns:
// - reading/writing provider-related sessionStorage keys
// - keeping provider-specific selector UI visible/hidden
// - delegating runtime provider switches to window.__app when available
//
// It intentionally does NOT own provider engine internals.
// Those stay in js/main.js and the provider modules themselves.

import {
  DEFAULTS,
  deriveNoteUiStateFromEffectiveProvider,
  getNoteUiVisibility,
  getTranscribeActiveApiKeyStorageKey,
  normalizeNoteMode,
  normalizeTranscribeProvider,
  resolveEffectiveNoteProvider,
} from '../core/provider-registry.js';

(function initProviderPersistenceModule() {
  const STORAGE_KEYS = {
    activeApiKey: 'user_api_key',

    transcribeProvider: 'transcribe_provider',
    sonioxRegion: 'soniox_region',
    sonioxSpeakerLabels: 'soniox_speaker_labels',

    noteProvider: 'note_provider',
    noteProviderMode: 'note_provider_mode',
    vertexModel: 'vertex_model',
    bedrockModel: 'bedrock_model',
  };

  function getApp() {
    return window.__app || {};
  }

  function readSession(key, fallback = '') {
    try {
      const value = sessionStorage.getItem(key);
      return value == null ? fallback : value;
    } catch {
      return fallback;
    }
  }

  function writeSession(key, value) {
    try {
      sessionStorage.setItem(key, String(value ?? ''));
    } catch {}
  }

  function normalizeLower(value, fallback = '') {
    const next = String(value ?? '').trim().toLowerCase();
    return next || fallback;
  }

  function setDisplay(el, show, displayValue = 'flex') {
    if (!el) return;
    el.style.display = show ? displayValue : 'none';
  }

  function isSoniox(providerValue) {
    return normalizeTranscribeProvider(providerValue) === 'soniox';
  }

  function readSelectedTranscribeProvider() {
    return normalizeTranscribeProvider(
      readSession(STORAGE_KEYS.transcribeProvider, DEFAULTS.transcribeProvider)
    );
  }

  function persistSelectedTranscribeProvider(providerValue) {
    const provider = normalizeTranscribeProvider(providerValue);
    writeSession(STORAGE_KEYS.transcribeProvider, provider);

    if (
      String(providerValue || '').trim().toLowerCase() === 'soniox_dia' ||
      normalizeLower(readSession(STORAGE_KEYS.sonioxSpeakerLabels, ''), '') === 'on'
    ) {
      // Back-compat for old soniox_dia sessions is preserved by forcing speaker labels on.
      if (String(providerValue || '').trim().toLowerCase() === 'soniox_dia') {
        writeSession(STORAGE_KEYS.sonioxSpeakerLabels, 'on');
      }
    }

    const activeKeyStorage = getTranscribeActiveApiKeyStorageKey(provider);
    const activeKey = readSession(activeKeyStorage, '');
    writeSession(STORAGE_KEYS.activeApiKey, activeKey);

    return provider;
  }

  function applyTranscribeProviderUI({
    providerSelect,
    regionContainer,
    regionSelect,
    regionNote,
    speakerContainer,
    speakerSelect,
    providerValue,
  }) {
    const provider = normalizeTranscribeProvider(providerValue);
    const showSoniox = isSoniox(provider);
    const region = normalizeLower(regionSelect?.value, DEFAULTS.sonioxRegion);

    if (providerSelect && providerSelect.value !== provider) {
      providerSelect.value = provider;
    }

    setDisplay(regionContainer, showSoniox, 'block');
    setDisplay(speakerContainer, showSoniox, 'block');

    if (regionNote) {
      regionNote.style.display = showSoniox && region === 'eu' ? 'block' : 'none';
    }

    if (speakerSelect) {
      const speakerLabels = normalizeLower(
        readSession(STORAGE_KEYS.sonioxSpeakerLabels, DEFAULTS.sonioxSpeakerLabels),
        DEFAULTS.sonioxSpeakerLabels
      );
      if (speakerSelect.value !== speakerLabels) {
        speakerSelect.value = speakerLabels;
      }
    }

    if (regionSelect) {
      const storedRegion = normalizeLower(
        readSession(STORAGE_KEYS.sonioxRegion, DEFAULTS.sonioxRegion),
        DEFAULTS.sonioxRegion
      );
      if (regionSelect.value !== storedRegion) {
        regionSelect.value = storedRegion;
      }
    }
  }

  function readSelectedNoteState() {
    const effectiveProvider = normalizeLower(
      readSession(STORAGE_KEYS.noteProvider, DEFAULTS.noteProvider),
      DEFAULTS.noteProvider
    );
    const storedMode = normalizeNoteMode(
      readSession(STORAGE_KEYS.noteProviderMode, DEFAULTS.noteMode)
    );
    const ui = deriveNoteUiStateFromEffectiveProvider(effectiveProvider, storedMode);

    return {
      effectiveProvider: ui.effectiveProvider,
      provider: ui.provider,
      openaiModel: ui.openaiModel,
      mode: ui.mode,
      vertexModel: normalizeLower(
        readSession(STORAGE_KEYS.vertexModel, DEFAULTS.vertexModel),
        DEFAULTS.vertexModel
      ),
      bedrockModel: normalizeLower(
        readSession(STORAGE_KEYS.bedrockModel, DEFAULTS.bedrockModel),
        DEFAULTS.bedrockModel
      ),
    };
  }

  function persistSelectedNoteState({
    provider,
    openaiModel,
    noteMode,
    vertexModel,
    bedrockModel,
  }) {
    const effectiveProvider = resolveEffectiveNoteProvider({
      provider,
      openaiModel,
      noteMode,
    });

    writeSession(STORAGE_KEYS.noteProvider, effectiveProvider);
    writeSession(STORAGE_KEYS.noteProviderMode, normalizeNoteMode(noteMode));
    writeSession(STORAGE_KEYS.vertexModel, normalizeLower(vertexModel, DEFAULTS.vertexModel));
    writeSession(STORAGE_KEYS.bedrockModel, normalizeLower(bedrockModel, DEFAULTS.bedrockModel));

    return effectiveProvider;
  }

  function applyNoteProviderUI({
    providerSelect,
    openaiModelContainer,
    openaiModelSelect,
    noteModeContainer,
    noteModeSelect,
    vertexModelContainer,
    vertexModelSelect,
    bedrockModelContainer,
    bedrockModelSelect,
    providerValue,
  }) {
    const selectedProvider = normalizeLower(providerValue, DEFAULTS.noteProvider);
    const selectedOpenAiModel = normalizeLower(openaiModelSelect?.value, DEFAULTS.openaiModel);
    const visibility = getNoteUiVisibility({
      provider: selectedProvider,
      openaiModel: selectedOpenAiModel,
    });

    if (providerSelect && providerSelect.value !== selectedProvider) {
      providerSelect.value = selectedProvider;
    }

    setDisplay(openaiModelContainer, visibility.showOpenAi);
    setDisplay(noteModeContainer, visibility.showOpenAiMode);
    setDisplay(vertexModelContainer, visibility.showVertex);
    setDisplay(bedrockModelContainer, visibility.showBedrock);

    if (noteModeSelect && !visibility.showOpenAiMode && noteModeSelect.value !== DEFAULTS.noteMode) {
      noteModeSelect.value = DEFAULTS.noteMode;
    }

    if (vertexModelSelect && !vertexModelSelect.value) {
      vertexModelSelect.value = DEFAULTS.vertexModel;
    }

    if (bedrockModelSelect && !bedrockModelSelect.value) {
      bedrockModelSelect.value = DEFAULTS.bedrockModel;
    }

    const noteCoordinator = getApp();
    if (typeof noteCoordinator.renderNoteUsageCost === 'function') {
      try {
        noteCoordinator.renderNoteUsageCost();
      } catch (_) {}
    }
  }

  async function performRuntimeSwitch({
    isBusy,
    switcher,
    fallbackLabel,
    nextValue,
  }) {
    const app = getApp();
    const busyNow = typeof isBusy === 'function' ? !!isBusy() : false;

    if (busyNow) {
      if (typeof app.reloadWithSavedState === 'function') {
        app.reloadWithSavedState(`${fallbackLabel}: busy state requires reload`);
        return false;
      }

      if (typeof app.saveState === 'function') {
        try { app.saveState(); } catch (_) {}
      }
      window.location.reload();
      return false;
    }

    if (typeof switcher === 'function') {
      try {
        await switcher(nextValue);
        return true;
      } catch (err) {
        console.warn(`${fallbackLabel} failed, falling back to reload`, err);
      }
    }

    if (typeof app.reloadWithSavedState === 'function') {
      app.reloadWithSavedState(`${fallbackLabel} failed, falling back to reload`);
      return false;
    }

    if (typeof app.saveState === 'function') {
      try { app.saveState(); } catch (_) {}
    }
    window.location.reload();
    return false;
  }

  function initTranscribeProviderPersistence() {
    const providerSelect = document.getElementById('transcribeProvider');
    if (!providerSelect) return;

    const regionContainer = document.getElementById('soniox-region-container');
    const regionSelect = document.getElementById('sonioxRegion');
    const regionNote = document.getElementById('soniox-region-note');
    const speakerContainer = document.getElementById('soniox-speaker-labels-container');
    const speakerSelect = document.getElementById('sonioxSpeakerLabels');

    if (providerSelect.dataset.providerPersistenceBound === '1') return;
    providerSelect.dataset.providerPersistenceBound = '1';

    const storedProvider = persistSelectedTranscribeProvider(readSelectedTranscribeProvider());

    if (regionSelect) {
      const storedRegion = normalizeLower(
        readSession(STORAGE_KEYS.sonioxRegion, DEFAULTS.sonioxRegion),
        DEFAULTS.sonioxRegion
      );
      regionSelect.value = storedRegion;
      regionSelect.addEventListener('change', () => {
        const nextRegion = normalizeLower(regionSelect.value, DEFAULTS.sonioxRegion);
        writeSession(STORAGE_KEYS.sonioxRegion, nextRegion);
        applyTranscribeProviderUI({
          providerSelect,
          regionContainer,
          regionSelect,
          regionNote,
          speakerContainer,
          speakerSelect,
          providerValue: providerSelect.value,
        });
      });
    }

    if (speakerSelect) {
      const storedSpeaker = normalizeLower(
        readSession(STORAGE_KEYS.sonioxSpeakerLabels, DEFAULTS.sonioxSpeakerLabels),
        DEFAULTS.sonioxSpeakerLabels
      );
      speakerSelect.value = storedSpeaker;
      speakerSelect.addEventListener('change', async () => {
        const nextSpeaker = normalizeLower(speakerSelect.value, DEFAULTS.sonioxSpeakerLabels);
        writeSession(STORAGE_KEYS.sonioxSpeakerLabels, nextSpeaker);

        applyTranscribeProviderUI({
          providerSelect,
          regionContainer,
          regionSelect,
          regionNote,
          speakerContainer,
          speakerSelect,
          providerValue: providerSelect.value,
        });

        if (!isSoniox(providerSelect.value)) return;
        const busyNow = !!getApp().isTranscribeBusy?.();
        if (busyNow) {
          console.warn('Soft recording switch (speaker labels) ignored while transcription is busy.');
          return;
        }

        try {
          await getApp().switchTranscribeProvider?.('soniox');
        } catch (err) {
          console.warn('Soft recording switch (speaker labels) failed without reload', err);
        }
      });
    }

    applyTranscribeProviderUI({
      providerSelect,
      regionContainer,
      regionSelect,
      regionNote,
      speakerContainer,
      speakerSelect,
      providerValue: storedProvider,
    });

    providerSelect.addEventListener('change', async () => {
      const provider = persistSelectedTranscribeProvider(providerSelect.value);

      applyTranscribeProviderUI({
        providerSelect,
        regionContainer,
        regionSelect,
        regionNote,
        speakerContainer,
        speakerSelect,
        providerValue: provider,
      });

      const busyNow = !!getApp().isTranscribeBusy?.();
      if (busyNow) {
        console.warn('Soft recording switch ignored while transcription is busy.');
        return;
      }

      try {
        await getApp().switchTranscribeProvider?.(provider);
      } catch (err) {
        console.warn('Soft recording switch failed without reload', err);
      }
    });
  }

  function initNoteProviderPersistence() {
    const providerSelect = document.getElementById('noteProvider');
    if (!providerSelect) return;
    if (providerSelect.dataset.noteProviderPersistenceBound === '1') return;
    providerSelect.dataset.noteProviderPersistenceBound = '1';

    const openaiModelContainer = document.getElementById('openai-model-container');
    const openaiModelSelect = document.getElementById('openaiModel');
    const noteModeContainer = document.getElementById('note-provider-mode-container');
    const noteModeSelect = document.getElementById('noteProviderMode');
    const vertexModelContainer = document.getElementById('vertex-model-container');
    const vertexModelSelect = document.getElementById('vertexModel');
    const bedrockModelContainer = document.getElementById('bedrock-model-container');
    const bedrockModelSelect = document.getElementById('bedrockModel');

    const stored = readSelectedNoteState();

    providerSelect.value = stored.provider;
    if (openaiModelSelect) openaiModelSelect.value = stored.openaiModel;
    if (noteModeSelect) noteModeSelect.value = stored.mode;
    if (vertexModelSelect) vertexModelSelect.value = stored.vertexModel;
    if (bedrockModelSelect) bedrockModelSelect.value = stored.bedrockModel;

    applyNoteProviderUI({
      providerSelect,
      openaiModelContainer,
      openaiModelSelect,
      noteModeContainer,
      noteModeSelect,
      vertexModelContainer,
      vertexModelSelect,
      bedrockModelContainer,
      bedrockModelSelect,
      providerValue: stored.provider,
    });

    const persistAndSwitchNoteProvider = async () => {
      const effectiveProvider = persistSelectedNoteState({
        provider: providerSelect.value,
        openaiModel: openaiModelSelect?.value || DEFAULTS.openaiModel,
        noteMode: noteModeSelect?.value || DEFAULTS.noteMode,
        vertexModel: vertexModelSelect?.value || DEFAULTS.vertexModel,
        bedrockModel: bedrockModelSelect?.value || DEFAULTS.bedrockModel,
      });

      applyNoteProviderUI({
        providerSelect,
        openaiModelContainer,
        openaiModelSelect,
        noteModeContainer,
        noteModeSelect,
        vertexModelContainer,
        vertexModelSelect,
        bedrockModelContainer,
        bedrockModelSelect,
        providerValue: providerSelect.value,
      });

      const busyNow = !!getApp().isNoteGenerationBusy?.();
      if (busyNow) {
        console.warn('Soft note switch ignored while note generation is busy.');
        return;
      }

      try {
        await getApp().switchNoteProvider?.(effectiveProvider);
      } catch (err) {
        console.warn('Soft note switch failed without reload', err);
      }
    };

    providerSelect.addEventListener('change', persistAndSwitchNoteProvider);
    openaiModelSelect?.addEventListener('change', persistAndSwitchNoteProvider);
    noteModeSelect?.addEventListener('change', persistAndSwitchNoteProvider);

    vertexModelSelect?.addEventListener('change', () => {
      writeSession(STORAGE_KEYS.vertexModel, normalizeLower(vertexModelSelect.value, DEFAULTS.vertexModel));
      applyNoteProviderUI({
        providerSelect,
        openaiModelContainer,
        openaiModelSelect,
        noteModeContainer,
        noteModeSelect,
        vertexModelContainer,
        vertexModelSelect,
        bedrockModelContainer,
        bedrockModelSelect,
        providerValue: providerSelect.value,
      });
    });

    bedrockModelSelect?.addEventListener('change', () => {
      writeSession(STORAGE_KEYS.bedrockModel, normalizeLower(bedrockModelSelect.value, DEFAULTS.bedrockModel));
      applyNoteProviderUI({
        providerSelect,
        openaiModelContainer,
        openaiModelSelect,
        noteModeContainer,
        noteModeSelect,
        vertexModelContainer,
        vertexModelSelect,
        bedrockModelContainer,
        bedrockModelSelect,
        providerValue: providerSelect.value,
      });
    });
  }

  function init() {
    initTranscribeProviderPersistence();
    initNoteProviderPersistence();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
