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
  listBedrockModelOptions,
  listGeminiApiModelOptions,
  listGeminiReasoningOptions,
  listNoteModeOptions,
  listNoteUiProviderOptions,
  listOpenAiModelOptions,
  listOpenAiReasoningOptions,
  listSonioxRegionOptions,
  listSonioxSpeakerLabelOptions,
  listTranscribeProviderOptions,
  listVertexModelOptions,
  normalizeGeminiReasoning,
  normalizeNoteMode,
  normalizeOpenAiReasoning,
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
    openaiReasoning: 'openai_reasoning',
    geminiModel: 'gemini_model',
    geminiReasoning: 'gemini_reasoning',
    vertexModel: 'vertex_model',
    bedrockModel: 'bedrock_model',
  };

  // Keep reasoning/thinking defaults local to provider persistence so the
  // selector hydration defaults can be adjusted without touching every
  // provider module.
  const DEFAULT_OPENAI_REASONING = 'low';
  const DEFAULT_GEMINI_REASONING = 'low';

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

  function getOptionSignature(options) {
    return (Array.isArray(options) ? options : [])
      .map((item) => `${String(item?.value || '').trim()}|${String(item?.label || item?.value || '').trim()}`)
      .join('||');
  }

  function ensureSelectOptions(selectEl, options) {
    if (!selectEl) return;

    const normalizedOptions = (Array.isArray(options) ? options : []).map((item) => ({
      value: String(item?.value || '').trim(),
      label: String(item?.label || item?.value || '').trim(),
    }));

    const nextSignature = getOptionSignature(normalizedOptions);
    if (selectEl.dataset.optionsSignature === nextSignature) return;

    const previousValue = String(selectEl.value || '').trim();
    selectEl.innerHTML = '';

    normalizedOptions.forEach((item) => {
      const optionEl = selectEl.ownerDocument.createElement('option');
      optionEl.value = item.value;
      optionEl.textContent = item.label;
      selectEl.appendChild(optionEl);
    });

    selectEl.dataset.optionsSignature = nextSignature;

    if (normalizedOptions.some((item) => item.value === previousValue)) {
      selectEl.value = previousValue;
    }
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
      openaiReasoning: normalizeOpenAiReasoning(
        readSession(STORAGE_KEYS.openaiReasoning, DEFAULT_OPENAI_REASONING)
      ),
      mode: ui.mode,
      geminiModel: normalizeLower(
        readSession(STORAGE_KEYS.geminiModel, DEFAULTS.geminiModel),
        DEFAULTS.geminiModel
      ),
      geminiReasoning: normalizeGeminiReasoning(
        readSession(STORAGE_KEYS.geminiReasoning, DEFAULT_GEMINI_REASONING),
        readSession(STORAGE_KEYS.geminiModel, DEFAULTS.geminiModel)
      ),
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
    openaiReasoning,
    noteMode,
    geminiModel,
    geminiReasoning,
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
    writeSession(STORAGE_KEYS.openaiReasoning, normalizeOpenAiReasoning(openaiReasoning));
    writeSession(STORAGE_KEYS.geminiModel, normalizeLower(geminiModel, DEFAULTS.geminiModel));
    writeSession(
      STORAGE_KEYS.geminiReasoning,
      normalizeGeminiReasoning(geminiReasoning, geminiModel)
    );
    writeSession(STORAGE_KEYS.vertexModel, normalizeLower(vertexModel, DEFAULTS.vertexModel));
    writeSession(STORAGE_KEYS.bedrockModel, normalizeLower(bedrockModel, DEFAULTS.bedrockModel));

    return effectiveProvider;
  }

  function applyNoteProviderUI({
    providerSelect,
    openaiModelContainer,
    openaiModelSelect,
    openaiReasoningContainer,
    openaiReasoningSelect,
    noteModeContainer,
    noteModeSelect,
    geminiModelContainer,
    geminiModelSelect,
    geminiReasoningContainer,
    geminiReasoningSelect,
    vertexModelContainer,
    vertexModelSelect,
    bedrockModelContainer,
    bedrockModelSelect,
    providerValue,
  }) {
    const selectedProvider = normalizeLower(providerValue, DEFAULTS.noteProvider);
    const selectedOpenAiModel = normalizeLower(openaiModelSelect?.value, DEFAULTS.openaiModel);
    const selectedGeminiModel = normalizeLower(geminiModelSelect?.value, DEFAULTS.geminiModel);
    const visibility = getNoteUiVisibility({
      provider: selectedProvider,
      openaiModel: selectedOpenAiModel,
    });

    ensureSelectOptions(openaiReasoningSelect, listOpenAiReasoningOptions());
    ensureSelectOptions(geminiReasoningSelect, listGeminiReasoningOptions(selectedGeminiModel));

    if (openaiReasoningSelect) {
      const normalizedOpenAiReasoning = normalizeOpenAiReasoning(openaiReasoningSelect.value);
      if (openaiReasoningSelect.value !== normalizedOpenAiReasoning) {
        openaiReasoningSelect.value = normalizedOpenAiReasoning;
      }
    }

    if (geminiReasoningSelect) {
      const normalizedGeminiEffort = normalizeGeminiReasoning(
        geminiReasoningSelect.value,
        selectedGeminiModel
      );
      if (geminiReasoningSelect.value !== normalizedGeminiEffort) {
        geminiReasoningSelect.value = normalizedGeminiEffort;
      }
    }

    if (providerSelect && providerSelect.value !== selectedProvider) {
      providerSelect.value = selectedProvider;
    }

    setDisplay(openaiModelContainer, visibility.showOpenAi);
    setDisplay(openaiReasoningContainer, visibility.showOpenAiReasoning);
    setDisplay(noteModeContainer, visibility.showOpenAiMode);
    setDisplay(geminiModelContainer, visibility.showGeminiApi);
    setDisplay(geminiReasoningContainer, visibility.showGeminiReasoning);
    setDisplay(vertexModelContainer, visibility.showVertex);
    setDisplay(bedrockModelContainer, visibility.showBedrock);

    if (noteModeSelect && !visibility.showOpenAiMode && noteModeSelect.value !== DEFAULTS.noteMode) {
      noteModeSelect.value = DEFAULTS.noteMode;
    }

    if (geminiModelSelect && !geminiModelSelect.value) {
      geminiModelSelect.value = DEFAULTS.geminiModel;
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

    ensureSelectOptions(providerSelect, listTranscribeProviderOptions());
    ensureSelectOptions(regionSelect, listSonioxRegionOptions());
    ensureSelectOptions(speakerSelect, listSonioxSpeakerLabelOptions());

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
    const openaiReasoningContainer = document.getElementById('gpt5-reasoning-container');
    const openaiReasoningSelect = document.getElementById('gpt5Reasoning');
    const noteModeContainer = document.getElementById('note-provider-mode-container');
    const noteModeSelect = document.getElementById('noteProviderMode');
    const geminiModelContainer = document.getElementById('gemini-model-container');
    const geminiModelSelect = document.getElementById('geminiModel');
    const geminiReasoningContainer = document.getElementById('gemini-reasoning-container');
    const geminiReasoningSelect = document.getElementById('geminiReasoning');
    const vertexModelContainer = document.getElementById('vertex-model-container');
    const vertexModelSelect = document.getElementById('vertexModel');
    const bedrockModelContainer = document.getElementById('bedrock-model-container');
    const bedrockModelSelect = document.getElementById('bedrockModel');

    ensureSelectOptions(providerSelect, listNoteUiProviderOptions());
    ensureSelectOptions(openaiModelSelect, listOpenAiModelOptions());
    ensureSelectOptions(openaiReasoningSelect, listOpenAiReasoningOptions());
    ensureSelectOptions(noteModeSelect, listNoteModeOptions());
    ensureSelectOptions(geminiModelSelect, listGeminiApiModelOptions());
    ensureSelectOptions(geminiReasoningSelect, listGeminiReasoningOptions(geminiModelSelect?.value || DEFAULTS.geminiModel));
    ensureSelectOptions(vertexModelSelect, listVertexModelOptions());
    ensureSelectOptions(bedrockModelSelect, listBedrockModelOptions());

    const stored = readSelectedNoteState();

    providerSelect.value = stored.provider;
    if (openaiModelSelect) openaiModelSelect.value = stored.openaiModel;
    if (openaiReasoningSelect) openaiReasoningSelect.value = stored.openaiReasoning;
    if (noteModeSelect) noteModeSelect.value = stored.mode;
    if (geminiModelSelect) geminiModelSelect.value = stored.geminiModel;
    if (geminiReasoningSelect) geminiReasoningSelect.value = stored.geminiReasoning;
    if (vertexModelSelect) vertexModelSelect.value = stored.vertexModel;
    if (bedrockModelSelect) bedrockModelSelect.value = stored.bedrockModel;

    applyNoteProviderUI({
      providerSelect,
      openaiModelContainer,
      openaiModelSelect,
      openaiReasoningContainer,
      openaiReasoningSelect,
      noteModeContainer,
      noteModeSelect,
      geminiModelContainer,
      geminiModelSelect,
      geminiReasoningContainer,
      geminiReasoningSelect,
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
        openaiReasoning: openaiReasoningSelect?.value || DEFAULT_OPENAI_REASONING,
        noteMode: noteModeSelect?.value || DEFAULTS.noteMode,
        geminiModel: geminiModelSelect?.value || DEFAULTS.geminiModel,
        geminiReasoning: geminiReasoningSelect?.value || DEFAULT_GEMINI_REASONING,
        vertexModel: vertexModelSelect?.value || DEFAULTS.vertexModel,
        bedrockModel: bedrockModelSelect?.value || DEFAULTS.bedrockModel,
      });

      applyNoteProviderUI({
        providerSelect,
        openaiModelContainer,
        openaiModelSelect,
        openaiReasoningContainer,
        openaiReasoningSelect,
        noteModeContainer,
        noteModeSelect,
        geminiModelContainer,
        geminiModelSelect,
        geminiReasoningContainer,
        geminiReasoningSelect,
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
    openaiReasoningSelect?.addEventListener('change', () => {
      writeSession(
        STORAGE_KEYS.openaiReasoning,
        normalizeOpenAiReasoning(openaiReasoningSelect.value)
      );
    });
    noteModeSelect?.addEventListener('change', persistAndSwitchNoteProvider);

    geminiModelSelect?.addEventListener('change', () => {
      writeSession(STORAGE_KEYS.geminiModel, normalizeLower(geminiModelSelect.value, DEFAULTS.geminiModel));
      applyNoteProviderUI({
        providerSelect,
        openaiModelContainer,
        openaiModelSelect,
        openaiReasoningContainer,
        openaiReasoningSelect,
        noteModeContainer,
        noteModeSelect,
        geminiModelContainer,
        geminiModelSelect,
        geminiReasoningContainer,
        geminiReasoningSelect,
        vertexModelContainer,
        vertexModelSelect,
        bedrockModelContainer,
        bedrockModelSelect,
        providerValue: providerSelect.value,
      });
      if (geminiReasoningSelect) {
        writeSession(
          STORAGE_KEYS.geminiReasoning,
          normalizeGeminiReasoning(geminiReasoningSelect.value, geminiModelSelect.value)
        );
      }
    });

    geminiReasoningSelect?.addEventListener('change', () => {
      writeSession(
        STORAGE_KEYS.geminiReasoning,
        normalizeGeminiReasoning(
          geminiReasoningSelect.value,
          geminiModelSelect?.value || DEFAULTS.geminiModel
        )
      );
    });

    vertexModelSelect?.addEventListener('change', () => {
      writeSession(STORAGE_KEYS.vertexModel, normalizeLower(vertexModelSelect.value, DEFAULTS.vertexModel));
      applyNoteProviderUI({
        providerSelect,
        openaiModelContainer,
        openaiModelSelect,
        openaiReasoningContainer,
        openaiReasoningSelect,
        noteModeContainer,
        noteModeSelect,
        geminiModelContainer,
        geminiModelSelect,
        geminiReasoningContainer,
        geminiReasoningSelect,
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
        openaiReasoningContainer,
        openaiReasoningSelect,
        noteModeContainer,
        noteModeSelect,
        geminiModelContainer,
        geminiModelSelect,
        geminiReasoningContainer,
        geminiReasoningSelect,
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
