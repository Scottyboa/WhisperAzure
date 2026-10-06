import {
  getDefaultOpenAiReasoning,
  normalizeOpenAiModel,
  getDefaultRequestyReasoning,
  getNoteUiVisibility,
  listOpenAiModelOptions,
  listOpenAiReasoningOptions,
  listRequestyModelOptions,
  listRequestyNanoReasoningOptions,
  listSharedRequestyReasoningOptions,
} from './provider-registry.js';

// Generator-local, Workspace-local settings. The legacy scalar keys remain
// available to the provider engines; this map remembers each model separately.
export const MODEL_REASONING_STORAGE_KEYS = {
  primary: 'note_model_reasoning_v1',
  secondary: 'secondary_note_model_reasoning_v1',
};

function modelSpec(provider, model) {
  const models = provider === 'openai' ? listOpenAiModelOptions()
    : provider === 'requesty' ? listRequestyModelOptions() : [];
  if (!models.some(({ value }) => value === model)) return null;
  const dedicated = provider === 'requesty' && getNoteUiVisibility({
    provider, requestyModel: model,
  }).showRequestyNanoReasoning;
  return {
    key: `${provider}:${model}`,
    options: provider === 'openai' ? listOpenAiReasoningOptions(model)
      : dedicated ? listRequestyNanoReasoningOptions(model) : listSharedRequestyReasoningOptions(),
    fallback: provider === 'openai' ? getDefaultOpenAiReasoning()
      : dedicated ? getDefaultRequestyReasoning(model) : 'low',
  };
}

export function sanitizeModelReasoningPreferences(preferences) {
  const safe = {};
  if (!preferences || typeof preferences !== 'object' || Array.isArray(preferences)) return safe;
  for (const [key, value] of Object.entries(preferences)) {
    const [provider, model, extra] = key.split(':');
    const upgradingSol = provider === 'openai' && model === 'gpt-6-sol';
    const spec = extra === undefined ? modelSpec(provider, upgradingSol ? normalizeOpenAiModel(model) : model) : null;
    if (!spec) continue;
    // A saved choice for the new model takes precedence over its predecessor.
    if (upgradingSol && Object.prototype.hasOwnProperty.call(preferences, spec.key)) continue;
    if (spec.options.some((option) => option.value === value)) safe[spec.key] = value;
    else if (upgradingSol && value === 'none') safe[spec.key] = spec.fallback;
  }
  return safe;
}

function readPreferences(storage, key) {
  try { return sanitizeModelReasoningPreferences(JSON.parse(storage.getItem(key) || '{}')); }
  catch { return {}; }
}

function writePreferences(storage, key, preferences) {
  try { storage.setItem(key, JSON.stringify(preferences)); } catch {}
}

export function createModelReasoningMemory(key, storage = sessionStorage) {
  return {
    get(provider, model) {
      const spec = modelSpec(provider, model);
      if (!spec) return '';
      return readPreferences(storage, key)[spec.key] ?? spec.fallback;
    },
    remember(provider, model, value) {
      const spec = modelSpec(provider, model);
      if (!spec) return '';
      const normalized = spec.options.some((option) => option.value === value) ? value : spec.fallback;
      const preferences = readPreferences(storage, key);
      preferences[spec.key] = normalized;
      writePreferences(storage, key, preferences);
      return normalized;
    },
    seed(provider, model, legacyValue) {
      // Migrate only the currently active model; an old shared value must not
      // become the preference for every other model or the other provider.
      const spec = modelSpec(provider, model);
      if (spec && legacyValue != null && !(spec.key in readPreferences(storage, key))) {
        this.remember(provider, model, legacyValue);
      }
    },
  };
}

export function captureModelReasoningSettings(storage) {
  return Object.fromEntries(Object.entries(MODEL_REASONING_STORAGE_KEYS)
    .map(([scope, key]) => [scope, readPreferences(storage, key)]));
}

export function restoreModelReasoningSettings(settings, storage) {
  for (const [scope, key] of Object.entries(MODEL_REASONING_STORAGE_KEYS)) {
    writePreferences(storage, key, sanitizeModelReasoningPreferences(settings?.[scope]));
  }
}
