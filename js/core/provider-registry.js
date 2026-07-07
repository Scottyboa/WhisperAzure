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
  openaiReasoning: 'low',
  noteMode: 'streaming',
  geminiModel: 'gemini-3-pro-preview',
  geminiReasoning: 'high',
  vertexModel: 'gemini-2.5-pro',
  bedrockModel: 'opus-4-5',
  requestyModel: 'claude-opus-4-8',
  requestyNanoReasoning: 'medium',
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
    // Both async-plain and async-diarized live in the merged module; it
    // detects the speaker-labels setting at initRecording() time.
    modulePath: './soniox.js',
    activeApiKeyStorageKey: 'soniox_api_key',
  },
  soniox_rt: {
    id: 'soniox_rt',
    // Tagline displayed in dropdowns. The "(real-time)" suffix is intentional:
    // it's how the user can distinguish this entry from the plain "Soniox"
    // (async/batch) entry — same family, different transport.
    label: 'Soniox (real-time)',
    shortLabel: 'Soniox RT',
    // Same merged module — the realtime branch is selected when the
    // transcribe_provider session key is 'soniox_rt'.
    modulePath: './soniox.js',
    // Reuse the same API key as plain Soniox so the user only enters it once.
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
    modulePath: './noteGeneration_openai.js',
    initExportName: 'initGpt5Streaming',
  },
  'gpt5-ns': {
    id: 'gpt5-ns',
    label: 'GPT-5.1 (non-streaming)',
    uiProvider: 'openai',
    openaiModel: 'gpt5',
    mode: 'non-streaming',
    modulePath: './noteGeneration_openai.js',
    initExportName: 'initGpt5NonStreaming',
  },
  gpt52: {
    id: 'gpt52',
    label: 'GPT-5.2',
    uiProvider: 'openai',
    openaiModel: 'gpt52',
    mode: 'streaming',
    modulePath: './noteGeneration_openai.js',
    initExportName: 'initGpt52Streaming',
  },
  'gpt52-ns': {
    id: 'gpt52-ns',
    label: 'GPT-5.2 (non-streaming)',
    uiProvider: 'openai',
    openaiModel: 'gpt52',
    mode: 'non-streaming',
    modulePath: './noteGeneration_openai.js',
    initExportName: 'initGpt52NonStreaming',
  },
  gpt54: {
    id: 'gpt54',
    label: 'GPT-5.4',
    uiProvider: 'openai',
    openaiModel: 'gpt54',
    mode: DEFAULTS.noteMode,
    modulePath: './noteGeneration_openai.js',
    initExportName: 'initGpt54',
  },
  gpt55: {
    id: 'gpt55',
    label: 'GPT-5.5',
    uiProvider: 'openai',
    openaiModel: 'gpt55',
    mode: 'streaming',
    modulePath: './noteGeneration_openai.js',
    initExportName: 'initGpt55Streaming',
  },
  'gpt55-ns': {
    id: 'gpt55-ns',
    label: 'GPT-5.5 (non-streaming)',
    uiProvider: 'openai',
    openaiModel: 'gpt55',
    mode: 'non-streaming',
    modulePath: './noteGeneration_openai.js',
    initExportName: 'initGpt55NonStreaming',
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
  // Requesty (GDPR-compliant router; EU endpoint + EU-region models).
  // Like gpt54, both Requesty variants are mode-driven: the module reads
  // #noteProviderMode at run time, so one effective provider per model.
  'requesty-claude': {
    id: 'requesty-claude',
    label: 'Requesty Claude Opus 4.8',
    uiProvider: 'requesty',
    requestyModel: 'claude-opus-4-8',
    mode: DEFAULTS.noteMode,
    modulePath: './requesty.js',
    initExportName: 'initRequestyClaudeOpus48',
  },
  'requesty-sonnet': {
    id: 'requesty-sonnet',
    label: 'Requesty Claude Sonnet 5',
    uiProvider: 'requesty',
    requestyModel: 'claude-sonnet-5',
    mode: DEFAULTS.noteMode,
    modulePath: './requesty.js',
    initExportName: 'initRequestyClaudeSonnet5',
  },
  'requesty-gpt55': {
    id: 'requesty-gpt55',
    label: 'Requesty GPT-5.5',
    uiProvider: 'requesty',
    requestyModel: 'gpt-5.5',
    mode: DEFAULTS.noteMode,
    modulePath: './requesty.js',
    initExportName: 'initRequestyGpt55',
  },
  'requesty-nano': {
    id: 'requesty-nano',
    label: 'Requesty GPT-5 Nano',
    uiProvider: 'requesty',
    requestyModel: 'gpt-5-nano',
    mode: DEFAULTS.noteMode,
    modulePath: './requesty.js',
    initExportName: 'initRequestyGpt5Nano',
  },
};

const NOTE_UI_PROVIDER_OPTIONS = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'lemonfox', label: 'Lemonfox' },
  { value: 'mistral', label: 'Mistral' },
  { value: 'gemini3', label: 'Google AI Studio' },
  { value: 'gemini3-vertex', label: 'Google Vertex' },
  { value: 'aws-bedrock', label: 'AWS Bedrock' },
  { value: 'requesty', label: 'Requesty' },
];

const REQUESTY_MODEL_OPTIONS = [
  { value: 'claude-opus-4-8', label: 'Claude Opus 4.8' },
  { value: 'claude-sonnet-5', label: 'Claude Sonnet 5' },
  { value: 'gpt-5.5', label: 'GPT-5.5' },
  { value: 'gpt-5-nano', label: 'GPT-5 Nano' },
];

// GPT-5 Nano reasoning effort. The GPT-5 API family (gpt-5 / gpt-5-mini /
// gpt-5-nano) supports reasoning_effort of minimal | low | medium | high
// (default medium). Note this differs from the shared OpenAI selector, which
// uses "none" instead of "minimal" — so GPT-5 Nano gets its own dropdown.
const REQUESTY_NANO_REASONING_OPTIONS = [
  { value: 'minimal', label: 'Minimal' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

const OPENAI_NOTE_MODEL_OPTIONS = [
  { value: 'gpt5', label: 'GPT-5.1' },
  { value: 'gpt52', label: 'GPT-5.2' },
  { value: 'gpt54', label: 'GPT-5.4' },
  { value: 'gpt55', label: 'GPT-5.5' },
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
  { value: 'gemini-3.5-flash', label: 'Gemini 3.5 Flash' },
  { value: 'gemini-3.1-flash-lite', label: 'Gemini 3.1 Flash-Lite' },
];

const BEDROCK_MODEL_OPTIONS = [
  { value: 'haiku-4-5', label: 'Claude Haiku 4.5' },
  { value: 'sonnet-4-5', label: 'Claude Sonnet 4.5' },
  { value: 'sonnet-4-6', label: 'Claude Sonnet 4.6' },
  { value: 'opus-4-5', label: 'Claude Opus 4.5' },
  { value: 'opus-4-6', label: 'Claude Opus 4.6' },
  { value: 'opus-4-7', label: 'Claude Opus 4.7' },
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

export function listRequestyModelOptions() {
  return REQUESTY_MODEL_OPTIONS.map((item) => ({ ...item }));
}

export function normalizeRequestyModel(value) {
  const raw = String(value || '').trim().toLowerCase();
  return REQUESTY_MODEL_OPTIONS.some((item) => item.value === raw)
    ? raw
    : DEFAULTS.requestyModel;
}

export function listRequestyNanoReasoningOptions() {
  return REQUESTY_NANO_REASONING_OPTIONS.map((item) => ({ ...item }));
}

export function normalizeRequestyNanoReasoning(value) {
  const raw = String(value || '').trim().toLowerCase();
  return REQUESTY_NANO_REASONING_OPTIONS.some((item) => item.value === raw)
    ? raw
    : DEFAULTS.requestyNanoReasoning;
}

// Maps a Requesty UI model value to its effective note provider by scanning
// the registry (derived, not hard-coded), so adding a new Requesty model only
// requires a registry entry + option — routing follows automatically.
export function resolveRequestyEffectiveProvider(requestyModel) {
  const normalizedModel = normalizeRequestyModel(requestyModel);
  const match = Object.values(NOTE_PROVIDER_REGISTRY).find(
    (config) => config.uiProvider === 'requesty' && config.requestyModel === normalizedModel
  );
  return match ? match.id : 'requesty-claude';
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

  // The plain "soniox" provider serves both the async-plain and
  // async-diarized modes from the same module file. We still surface the
  // resolved speakerLabels in the returned config so callers (e.g. the
  // mini panel label "Soniox" vs "Soniox (dia)") can distinguish them
  // without doing their own session lookup.
  if (normalized === 'soniox') {
    const speakerLabels = String(options.sonioxSpeakerLabels || DEFAULTS.sonioxSpeakerLabels).toLowerCase();
    return {
      ...config,
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

export function resolveEffectiveNoteProvider({ provider, openaiModel, noteMode, requestyModel } = {}) {
  const uiProvider = String(provider || DEFAULTS.noteProvider).trim().toLowerCase();

  if (uiProvider === 'requesty') {
    return resolveRequestyEffectiveProvider(requestyModel);
  }

  if (uiProvider !== 'openai') {
    return normalizeNoteEffectiveProvider(uiProvider);
  }

  const model = String(openaiModel || DEFAULTS.openaiModel).trim().toLowerCase();
  const mode = String(noteMode || DEFAULTS.noteMode).trim().toLowerCase();

  if (model === 'gpt5' || model === 'gpt52' || model === 'gpt55') {
    return mode === 'non-streaming' ? `${model}-ns` : model;
  }

  if (model === 'gpt54') return 'gpt54';

  return DEFAULTS.openaiModel;
}

export function deriveNoteUiStateFromEffectiveProvider(effectiveProvider, storedMode = DEFAULTS.noteMode) {
  const normalized = normalizeNoteEffectiveProvider(effectiveProvider);
  const config = NOTE_PROVIDER_REGISTRY[normalized] || NOTE_PROVIDER_REGISTRY[DEFAULTS.noteProvider];

  if (config.uiProvider === 'requesty') {
    // Requesty variants are mode-driven (gpt54 style): respect the stored
    // note mode instead of forcing the default.
    return {
      provider: 'requesty',
      openaiModel: DEFAULTS.openaiModel,
      requestyModel: config.requestyModel || DEFAULTS.requestyModel,
      mode: normalizeNoteMode(storedMode),
      effectiveProvider: normalized,
    };
  }

  if (config.uiProvider !== 'openai') {
    return {
      provider: config.uiProvider,
      openaiModel: DEFAULTS.openaiModel,
      requestyModel: DEFAULTS.requestyModel,
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
    requestyModel: DEFAULTS.requestyModel,
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

// Returns the name of the named export to call on the loaded module
// (e.g. 'initGpt5Streaming'). Falls back to 'initNoteGeneration' for
// providers that don't specify an explicit export, so non-OpenAI
// modules (Gemini, Lemonfox, Mistral, AWS Bedrock) keep their existing
// loader behaviour.
export function resolveNoteInitExportName(effectiveProvider) {
  const config = getNoteProviderConfig(effectiveProvider);
  return String(config.initExportName || 'initNoteGeneration');
}

export function getNoteProviderLogLabel({
  effectiveProvider,
  openaiModel,
  geminiModel,
  vertexModel,
  bedrockModel,
} = {}) {
  const normalized = normalizeNoteEffectiveProvider(effectiveProvider);
  if (isRequestyEffectiveNoteProvider(normalized)) {
    const config = getNoteProviderConfig(normalized);
    return `requesty:${config.requestyModel || DEFAULTS.requestyModel}`;
  }
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

export function isRequestyEffectiveNoteProvider(effectiveProvider) {
  return getNoteProviderConfig(effectiveProvider).uiProvider === 'requesty';
}

export function getDefaultModelIdForEffectiveNoteProvider({
  effectiveProvider,
  openaiModel,
  geminiModel,
  vertexModel,
  bedrockModel,
} = {}) {
  const normalized = normalizeNoteEffectiveProvider(effectiveProvider);

  if (isRequestyEffectiveNoteProvider(normalized)) {
    const config = getNoteProviderConfig(normalized);
    return String(config.requestyModel || DEFAULTS.requestyModel || '').trim() || null;
  }

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
    case 'gpt55':
    case 'gpt55-ns':
      return 'gpt-5.5';
    default:
      return String(openaiModel || '').trim() || null;
  }
}

export function getNoteUiVisibility({ provider, openaiModel, requestyModel } = {}) {
  const uiProvider = String(provider || DEFAULTS.noteProvider).trim().toLowerCase();
  const model = String(openaiModel || DEFAULTS.openaiModel).trim().toLowerCase();
  const reqModel = normalizeRequestyModel(requestyModel);

  const isOpenAi = uiProvider === 'openai';
  const isGpt5x = isOpenAi && (model === 'gpt5' || model === 'gpt52' || model === 'gpt54' || model === 'gpt55');
  const isRequesty = uiProvider === 'requesty';
  const isRequestyNano = isRequesty && reqModel === 'gpt-5-nano';

  // Streaming/non-streaming (#noteProviderMode) is available for all Requesty
  // models. For reasoning, most Requesty models share the OpenAI selector
  // (#gpt5Reasoning, None/Low/Medium/High): the Anthropic models (Opus 4.8,
  // Sonnet 5) map reasoning_effort to a thinking budget ("None" omits it),
  // and GPT-5.5 uses the native OpenAI effort string. GPT-5 Nano is the
  // exception — its valid values are Minimal/Low/Medium/High (no "None"), so
  // it gets its own dedicated selector (#requestyNanoReasoning) instead.

  return {
    showOpenAi: isOpenAi,
    showOpenAiMode: isGpt5x || isRequesty,
    showOpenAiReasoning: isGpt5x || (isRequesty && !isRequestyNano),
    showRequestyNanoReasoning: isRequestyNano,
    showGeminiApi: uiProvider === 'gemini3',
    showGeminiReasoning: uiProvider === 'gemini3',
    showVertex: uiProvider === 'gemini3-vertex',
    showBedrock: uiProvider === 'aws-bedrock',
    showRequesty: isRequesty,
  };
}


