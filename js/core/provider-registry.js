// js/core/provider-registry.js
//
// Canonical provider metadata + path resolution for both recording (STT)
// and note-generation providers.
//
// Purpose:
// - keep module-path decisions in one place
// - keep effective-provider <-> UI-provider mapping in one place
// - keep default values together so controller/UI modules stop drifting

export const DEFAULTS = {
  transcribeProvider: 'soniox',
  sonioxRegion: 'eu',
  sonioxSpeakerLabels: 'off',
  noteProvider: 'aws-bedrock',
  openaiModel: 'gpt5',
  openaiReasoning: 'none',
  noteMode: 'streaming',
  geminiModel: 'gemini-3-pro-preview',
  geminiReasoning: 'high',
  vertexModel: 'gemini-2.5-pro',
  bedrockModel: 'opus-4-5',
};

const TRANSCRIBE_PROVIDER_REGISTRY = {
  openai: {
    id: 'openai',
    label: 'OpenAI',
    shortLabel: 'OpenAI',
    modulePath: './recording.js',
    activeApiKeyStorageKey: 'openai_api_key',
  },
  soniox: {
    id: 'soniox',
    label: 'Soniox',
    shortLabel: 'Soniox',
    modulePath: './SONIOX_UPDATE.js',
    diarizedModulePath: './SONIOX_UPDATE_dia.js',
    activeApiKeyStorageKey: 'soniox_api_key',
  },
  lemonfox: {
    id: 'lemonfox',
    label: 'Lemonfox',
    shortLabel: 'Lemonfox',
    modulePath: './LemonfoxSTT.js',
    activeApiKeyStorageKey: 'lemonfox_api_key',
  },
  voxtral: {
    id: 'voxtral',
    label: 'Mistral (Voxtral Mini Transcribe)',
    shortLabel: 'Mistral',
    modulePath: './VoxtralminiSTT.js',
    activeApiKeyStorageKey: 'mistral_api_key',
  },
  deepgram: {
    id: 'deepgram',
    label: 'Deepgram Nova-3',
    shortLabel: 'Deepgram',
    modulePath: './deepgram_nova3.js',
    activeApiKeyStorageKey: 'deepgram_api_key',
  },
};

const NOTE_PROVIDER_REGISTRY = {
  gpt5: {
    id: 'gpt5',
    label: 'GPT-5.1',
    uiProvider: 'openai',
    openaiModel: 'gpt5',
    mode: 'streaming',
    modulePath: './notegeneration%20gpt-5.js',
  },
  'gpt5-ns': {
    id: 'gpt5-ns',
    label: 'GPT-5.1 (non-streaming)',
    uiProvider: 'openai',
    openaiModel: 'gpt5',
    mode: 'non-streaming',
    modulePath: './noteGeneration_gpt5_NS.js',
  },
  gpt52: {
    id: 'gpt52',
    label: 'GPT-5.2',
    uiProvider: 'openai',
    openaiModel: 'gpt52',
    mode: 'streaming',
    modulePath: './noteGeneration_gpt52.js',
  },
  'gpt52-ns': {
    id: 'gpt52-ns',
    label: 'GPT-5.2 (non-streaming)',
    uiProvider: 'openai',
    openaiModel: 'gpt52',
    mode: 'non-streaming',
    modulePath: './noteGeneration_gpt52_NS.js',
  },
  gpt54: {
    id: 'gpt54',
    label: 'GPT-5.4',
    uiProvider: 'openai',
    openaiModel: 'gpt54',
    mode: DEFAULTS.noteMode,
    modulePath: './noteGeneration_gpt54.js',
  },
  lemonfox: {
    id: 'lemonfox',
    label: 'Lemonfox',
    uiProvider: 'lemonfox',
    modulePath: './LemonfoxTXT.js',
  },
  mistral: {
    id: 'mistral',
    label: 'Mistral',
    uiProvider: 'mistral',
    modulePath: './MistralTXT.js',
  },
  gemini3: {
    id: 'gemini3',
    label: 'Google AI Studio',
    uiProvider: 'gemini3',
    modulePath: './Gemini3.js',
  },
  'gemini3-vertex': {
    id: 'gemini3-vertex',
    label: 'Google Vertex',
    uiProvider: 'gemini3-vertex',
    modulePath: './GeminiVertex.js',
  },
  'aws-bedrock': {
    id: 'aws-bedrock',
    label: 'AWS Bedrock',
    uiProvider: 'aws-bedrock',
    modulePath: './AWSBedrock.js',
  },
};

const NOTE_UI_PROVIDER_OPTIONS = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'lemonfox', label: 'Lemonfox' },
  { value: 'mistral', label: 'Mistral' },
  { value: 'gemini3', label: 'Google AI Studio' },
  { value: 'gemini3-vertex', label: 'Google Vertex' },
  { value: 'aws-bedrock', label: 'AWS Bedrock' },
];

const OPENAI_NOTE_MODEL_OPTIONS = [
  { value: 'gpt5', label: 'GPT-5.1' },
  { value: 'gpt52', label: 'GPT-5.2' },
  { value: 'gpt54', label: 'GPT-5.4' },
];

const NOTE_MODE_OPTIONS = [
  { value: 'streaming', label: 'streaming' },
  { value: 'non-streaming', label: 'non-streaming' },
];

const OPENAI_REASONING_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

const GEMINI_REASONING_OPTIONS_COMMON = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

const GEMINI_REASONING_OPTIONS_FLASH = [
  { value: 'minimal', label: 'Minimal' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

function isGeminiFlashModel(modelId) {
  return String(modelId || '').trim().toLowerCase().includes('flash');
}


const GEMINI_API_MODEL_OPTIONS = [
  { value: 'gemini-3-pro-preview', label: 'Gemini 3 Pro' },
  { value: 'gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro' },
  { value: 'gemini-3-flash-preview', label: 'Gemini 3 Flash' },
];

const VERTEX_MODEL_OPTIONS = [
  { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
];

const BEDROCK_MODEL_OPTIONS = [
  { value: 'haiku-4-5', label: 'Claude Haiku 4.5' },
  { value: 'sonnet-4-5', label: 'Claude Sonnet 4.5' },
  { value: 'sonnet-4-6', label: 'Claude Sonnet 4.6' },
  { value: 'opus-4-5', label: 'Claude Opus 4.5' },
  { value: 'opus-4-6', label: 'Claude Opus 4.6' },
];

const SONIOX_REGION_OPTIONS = [
  { value: 'us', label: 'US' },
  { value: 'eu', label: 'EU (GDPR Compliant)' },
];

const SONIOX_SPEAKER_LABEL_OPTIONS = [
  { value: 'off', label: 'Off' },
  { value: 'on', label: 'On' },
];

export function listTranscribeProviders() {
  return Object.keys(TRANSCRIBE_PROVIDER_REGISTRY);
}

export function listNoteEffectiveProviders() {
  return Object.keys(NOTE_PROVIDER_REGISTRY);
}

export function listTranscribeProviderOptions() {
  return listTranscribeProviders().map((providerId) => ({
    value: providerId,
    label: getTranscribeProviderLabel(providerId),
  }));
}

export function listNoteUiProviderOptions() {
  return NOTE_UI_PROVIDER_OPTIONS.map((item) => ({ ...item }));
}

export function listOpenAiModelOptions() {
  return OPENAI_NOTE_MODEL_OPTIONS.map((item) => ({ ...item }));
}

export function listNoteModeOptions() {
  return NOTE_MODE_OPTIONS.map((item) => ({ ...item }));
}

export function listOpenAiReasoningOptions() {
  return OPENAI_REASONING_OPTIONS.map((item) => ({ ...item }));
}

export function listGeminiReasoningOptions(modelId = DEFAULTS.geminiModel) {
  const options = isGeminiFlashModel(modelId)
    ? GEMINI_REASONING_OPTIONS_FLASH
    : GEMINI_REASONING_OPTIONS_COMMON;
  return options.map((item) => ({ ...item }));
}

export function listGeminiApiModelOptions() {
  return GEMINI_API_MODEL_OPTIONS.map((item) => ({ ...item }));
}

export function listVertexModelOptions() {
  return VERTEX_MODEL_OPTIONS.map((item) => ({ ...item }));
}

export function listBedrockModelOptions() {
  return BEDROCK_MODEL_OPTIONS.map((item) => ({ ...item }));
}

export function listSonioxRegionOptions() {
  return SONIOX_REGION_OPTIONS.map((item) => ({ ...item }));
}

export function listSonioxSpeakerLabelOptions() {
  return SONIOX_SPEAKER_LABEL_OPTIONS.map((item) => ({ ...item }));
}

export function normalizeTranscribeProvider(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (raw === 'soniox_dia') return 'soniox';
  return TRANSCRIBE_PROVIDER_REGISTRY[raw] ? raw : DEFAULTS.transcribeProvider;
}

export function getTranscribeProviderConfig(provider, options = {}) {
  const normalized = normalizeTranscribeProvider(provider);
  const config = TRANSCRIBE_PROVIDER_REGISTRY[normalized] || TRANSCRIBE_PROVIDER_REGISTRY[DEFAULTS.transcribeProvider];

  if (normalized === 'soniox') {
    const speakerLabels = String(options.sonioxSpeakerLabels || DEFAULTS.sonioxSpeakerLabels).toLowerCase();
    return {
      ...config,
      modulePath: speakerLabels === 'on' ? config.diarizedModulePath : config.modulePath,
      sonioxSpeakerLabels: speakerLabels,
    };
  }

  return { ...config };
}

export function resolveTranscribeModulePath(provider, options = {}) {
  return getTranscribeProviderConfig(provider, options).modulePath;
}

export function getTranscribeActiveApiKeyStorageKey(provider) {
  return getTranscribeProviderConfig(provider).activeApiKeyStorageKey;
}

export function getTranscribeProviderLabel(provider) {
  const config = getTranscribeProviderConfig(provider);
  return String(config.label || config.id || '').trim();
}

export function getTranscribeProviderShortLabel(provider) {
  const config = getTranscribeProviderConfig(provider);
  return String(config.shortLabel || config.label || config.id || '').trim();
}

export function normalizeNoteEffectiveProvider(value) {
  const raw = String(value || '').trim().toLowerCase();
  // Legacy migration: old saved GPT-4 sessions should land on the current
  // default OpenAI model, not silently fall back to AWS Bedrock.
  if (raw === 'gpt4') return DEFAULTS.openaiModel;
  return NOTE_PROVIDER_REGISTRY[raw] ? raw : DEFAULTS.noteProvider;
}

export function normalizeNoteUiProvider(value) {
  const raw = String(value || '').trim().toLowerCase();
  return NOTE_UI_PROVIDER_OPTIONS.some((item) => item.value === raw)
    ? raw
    : inferNoteProviderUi(DEFAULTS.noteProvider);
}

export function resolveEffectiveNoteProvider({ provider, openaiModel, noteMode } = {}) {
  const uiProvider = String(provider || DEFAULTS.noteProvider).trim().toLowerCase();
  if (uiProvider !== 'openai') {
    return normalizeNoteEffectiveProvider(uiProvider);
  }

  const model = String(openaiModel || DEFAULTS.openaiModel).trim().toLowerCase();
  const mode = String(noteMode || DEFAULTS.noteMode).trim().toLowerCase();

  if (model === 'gpt5' || model === 'gpt52') {
    return mode === 'non-streaming' ? `${model}-ns` : model;
  }

  if (model === 'gpt54') return 'gpt54';

  return DEFAULTS.openaiModel;
}

export function deriveNoteUiStateFromEffectiveProvider(effectiveProvider, storedMode = DEFAULTS.noteMode) {
  const normalized = normalizeNoteEffectiveProvider(effectiveProvider);
  const config = NOTE_PROVIDER_REGISTRY[normalized] || NOTE_PROVIDER_REGISTRY[DEFAULTS.noteProvider];

  if (config.uiProvider !== 'openai') {
    return {
      provider: config.uiProvider,
      openaiModel: DEFAULTS.openaiModel,
      mode: DEFAULTS.noteMode,
      effectiveProvider: normalized,
    };
  }

  const resolvedMode =
    normalized === 'gpt54'
      ? normalizeNoteMode(storedMode)
      : (config.mode || DEFAULTS.noteMode);

  return {
    provider: 'openai',
    openaiModel: config.openaiModel || DEFAULTS.openaiModel,
    mode: resolvedMode,
    effectiveProvider: normalized,
  };
}

export function inferNoteProviderUi(effectiveProvider) {
  return deriveNoteUiStateFromEffectiveProvider(effectiveProvider).provider;
}

export function normalizeNoteMode(mode) {
  return String(mode || '').trim().toLowerCase() === 'non-streaming'
    ? 'non-streaming'
    : DEFAULTS.noteMode;
}

export function normalizeOpenAiReasoning(value) {
  const raw = String(value || '').trim().toLowerCase();
  return OPENAI_REASONING_OPTIONS.some((item) => item.value === raw)
    ? raw
    : DEFAULTS.openaiReasoning;
}

export function normalizeGeminiReasoning(value, modelId = DEFAULTS.geminiModel) {
  const raw = String(value || '').trim().toLowerCase();
  const options = isGeminiFlashModel(modelId)
    ? GEMINI_REASONING_OPTIONS_FLASH
    : GEMINI_REASONING_OPTIONS_COMMON;

  return options.some((item) => item.value === raw)
    ? raw
    : DEFAULTS.geminiReasoning;
}

export function getNoteProviderConfig(effectiveProvider) {
  const normalized = normalizeNoteEffectiveProvider(effectiveProvider);
  return {
    ...(NOTE_PROVIDER_REGISTRY[normalized] || NOTE_PROVIDER_REGISTRY[DEFAULTS.noteProvider]),
    id: normalized,
  };
}

export function resolveNoteModulePath(effectiveProvider) {
  return getNoteProviderConfig(effectiveProvider).modulePath;
}

export function getNoteProviderLogLabel({
  effectiveProvider,
  openaiModel,
  geminiModel,
  vertexModel,
  bedrockModel,
} = {}) {
  const normalized = normalizeNoteEffectiveProvider(effectiveProvider);
  if (normalized === 'aws-bedrock' && bedrockModel) return String(bedrockModel).toLowerCase();
  if (normalized === 'gemini3' && geminiModel) return String(geminiModel).toLowerCase();
  if (normalized === 'gemini3-vertex' && vertexModel) return String(vertexModel).toLowerCase();

  const config = getNoteProviderConfig(normalized);
  if (config.uiProvider === 'openai') {
    const derived = deriveNoteUiStateFromEffectiveProvider(normalized);
    return String(openaiModel || derived.openaiModel || DEFAULTS.openaiModel).toLowerCase();
  }

  return normalized;
}

export function isOpenAiEffectiveNoteProvider(effectiveProvider) {
  return getNoteProviderConfig(effectiveProvider).uiProvider === 'openai';
}

export function isMistralEffectiveNoteProvider(effectiveProvider) {
  return normalizeNoteEffectiveProvider(effectiveProvider) === 'mistral';
}

export function isGeminiApiEffectiveNoteProvider(effectiveProvider) {
  return normalizeNoteEffectiveProvider(effectiveProvider) === 'gemini3';
}

export function isVertexEffectiveNoteProvider(effectiveProvider) {
  return normalizeNoteEffectiveProvider(effectiveProvider) === 'gemini3-vertex';
}

export function isBedrockEffectiveNoteProvider(effectiveProvider) {
  return normalizeNoteEffectiveProvider(effectiveProvider) === 'aws-bedrock';
}

export function getDefaultModelIdForEffectiveNoteProvider({
  effectiveProvider,
  openaiModel,
  geminiModel,
  vertexModel,
  bedrockModel,
} = {}) {
  const normalized = normalizeNoteEffectiveProvider(effectiveProvider);

  if (isBedrockEffectiveNoteProvider(normalized)) {
    return String(bedrockModel || DEFAULTS.bedrockModel || '').trim() || null;
  }

  if (isVertexEffectiveNoteProvider(normalized)) {
    return String(vertexModel || DEFAULTS.vertexModel || '').trim() || null;
  }

  if (isGeminiApiEffectiveNoteProvider(normalized)) {
    return String(geminiModel || DEFAULTS.geminiModel || '').trim() || null;
  }

  if (isMistralEffectiveNoteProvider(normalized)) {
    return 'mistral-large-latest';
  }

  if (normalized === 'lemonfox') {
    return 'llama-70b-chat';
  }

  switch (normalized) {
    case 'gpt5':
    case 'gpt5-ns':
      return 'gpt-5.1';
    case 'gpt52':
    case 'gpt52-ns':
      return 'gpt-5.2';
    case 'gpt54':
      return 'gpt-5.4';
    default:
      return String(openaiModel || '').trim() || null;
  }
}

export function getNoteUiVisibility({ provider, openaiModel } = {}) {
  const uiProvider = String(provider || DEFAULTS.noteProvider).trim().toLowerCase();
  const model = String(openaiModel || DEFAULTS.openaiModel).trim().toLowerCase();

  const isOpenAi = uiProvider === 'openai';
  const isGpt5x = isOpenAi && (model === 'gpt5' || model === 'gpt52' || model === 'gpt54');

  return {
    showOpenAi: isOpenAi,
    showOpenAiMode: isGpt5x,
    showOpenAiReasoning: isGpt5x,
    showGeminiApi: uiProvider === 'gemini3',
    showGeminiReasoning: uiProvider === 'gemini3',
    showVertex: uiProvider === 'gemini3-vertex',
    showBedrock: uiProvider === 'aws-bedrock',
  };
}
