
import {
  DEFAULTS,
  getDefaultModelIdForEffectiveNoteProvider,
  isBedrockEffectiveNoteProvider,
  isGeminiApiEffectiveNoteProvider,
  isMistralEffectiveNoteProvider,
  isOpenAiEffectiveNoteProvider,
  isVertexEffectiveNoteProvider,
  normalizeNoteEffectiveProvider,
} from '../core/provider-registry.js';

// Extracted from transcribe.html inline script.
// Owns note usage normalization, pricing estimation, and cost display wiring.

(function initNoteUsageCostFeature() {
  function getApp() {
    return (window.__app = window.__app || {});
  }

  function readSession(key, fallback = "") {
    try {
      const value = sessionStorage.getItem(key);
      return value == null ? fallback : value;
    } catch (_) {
      return fallback;
    }
  }

  function getControllerNoteSnapshot() {
    try {
      const app = getApp();
      if (typeof app.getNoteProviderSnapshot === "function") {
        return app.getNoteProviderSnapshot() || {};
      }
    } catch (_) {}
    return {};
  }

  function getSelectedGeminiModelKey() {
    const app = getApp();
    if (typeof app.getSelectedGeminiModel === "function") {
      const value = app.getSelectedGeminiModel();
      return value ? String(value).trim() : null;
    }

    const sel = document.getElementById("geminiModel");
    const value = (sel && sel.value) || readSession("gemini_model", DEFAULTS.geminiModel) || "";
    return value ? String(value).trim() : null;
  }

  function getSelectedBedrockModelKey() {
    const app = getApp();
    if (typeof app.getSelectedBedrockModel === "function") {
      const value = app.getSelectedBedrockModel();
      return value ? String(value).trim() : null;
    }

    const sel = document.getElementById("bedrockModel");
    const value = (sel && sel.value) || readSession("bedrock_model", "") || "";
    return value ? String(value).trim() : null;
  }

  function getEffectiveProviderKey() {
    const snapshot = getControllerNoteSnapshot();
    if (snapshot.noteProviderEffective) {
      return normalizeNoteEffectiveProvider(snapshot.noteProviderEffective);
    }
    return normalizeNoteEffectiveProvider(readSession("note_provider", "") || DEFAULTS.noteProvider);
  }

  function resolveUsageProviderKey(providerKey, modelId = null) {
    const rawProvider = String(providerKey || "").trim().toLowerCase();
    if (!rawProvider) {
      return getEffectiveProviderKey();
    }

    // Some OpenAI note modules report the UI provider ("openai") instead of an
    // effective provider key ("gpt5", "gpt52", "gpt54"). Normalize those here
    // so pricing and logging do not fall back to DEFAULTS.noteProvider.
    if (rawProvider === "openai") {
      const rawModel = String(modelId || "").trim().toLowerCase();
      if (rawModel === "gpt-5.4") return "gpt54";
      if (rawModel === "gpt-5.2") return "gpt52";
      if (rawModel === "gpt-5.1") return "gpt5";

      const snapshot = getControllerNoteSnapshot();
      const openAiModel = String(
        snapshot.openaiModel || readSession("openai_model", "") || DEFAULTS.openaiModel
      ).trim().toLowerCase();
      if (openAiModel === "gpt54") return "gpt54";
      if (openAiModel === "gpt52") return "gpt52";
      return "gpt5";
    }

    return normalizeNoteEffectiveProvider(rawProvider);
  }

  function getDefaultModelIdForProvider(providerKey) {
    const snapshot = getControllerNoteSnapshot();
    return getDefaultModelIdForEffectiveNoteProvider({
      effectiveProvider: providerKey,
      openaiModel: snapshot.openaiModel || readSession("openai_model", "") || DEFAULTS.openaiModel,
      geminiModel:
        snapshot.geminiModel ||
        getSelectedGeminiModelKey() ||
        DEFAULTS.geminiModel,
      vertexModel: snapshot.vertexModel || readSession("vertex_model", "") || DEFAULTS.vertexModel,
      bedrockModel:
        snapshot.bedrockModel ||
        getSelectedBedrockModelKey() ||
        DEFAULTS.bedrockModel,
    });
  }

  function getDebugNoteCostEnabled() {
    return readSession("debug_note_cost", "") === "1";
  }

  const costEl = () => document.getElementById("noteUsageCost");
  const nfInt = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 });

  // Prices are USD per 1M tokens (Standard pricing; cached-input discounts not applied here).
  const OPENAI_USD_PER_MTOK = {
    "gpt-5.1": { input: 1.25, output: 10.0 },
    "gpt-5.2": { input: 1.75, output: 14.0 },
    "gpt-5.4": { input: 2.5, output: 15.0 },
    "chatgpt-4o-latest": { input: 5.0, output: 15.0 },
    "GPT-5.1": { input: 1.25, output: 10.0 },
    "GPT-5.2": { input: 1.75, output: 14.0 },
    "GPT-5.4": { input: 2.5, output: 15.0 },
  };

  // AWS Bedrock (Claude) — USD per 1M tokens
  // NOTE: 4.6 rates are set equal to 4.5 here for now; update if/when AWS pricing differs.
  const BEDROCK_CLAUDE_USD_PER_MTOK = {
    "haiku-4-5": { input: 1.0, output: 5.0 },
    "sonnet-4-5": { input: 3.0, output: 15.0 },
    "sonnet-4-6": { input: 3.0, output: 15.0 },
    "opus-4-5": { input: 5.0, output: 25.0 },
    "opus-4-6": { input: 5.0, output: 25.0 },
    "opus-4-7": { input: 5.0, output: 25.0 },
  };

  // Mistral API (USD per 1M tokens)
  const MISTRAL_USD_PER_MTOK = {
    "mistral-large-latest": { input: 0.5, output: 1.5 },
  };

  // Gemini API (AI Studio): USD per 1M billable tokens.
  const GEMINI_API_USD_PER_MTOK = {
    "gemini-3-pro-preview": {
      thresholdInputTokens: 200_000,
      short: { input: 2.0, output: 12.0 },
      long: { input: 4.0, output: 18.0 },
    },
    "gemini-3.1-pro-preview": {
      thresholdInputTokens: 200_000,
      short: { input: 2.0, output: 12.0 },
      long: { input: 4.0, output: 18.0 },
    },
    "gemini-3-flash-preview": {
      rates: { input: 0.5, output: 3.0 },
    },
  };

  // Vertex AI: Gemini 2.5 Pro (USD per 1M tokens)
  const GEMINI_25_PRO_VERTEX_USD_PER_MTOK = {
    thresholdInputTokens: 200_000,
    short: { input: 1.25, output: 10.0 },
    long: { input: 2.5, output: 15.0 },
  };

  function estimateUsdFromRates({ rates, inputTokens, outputTokens }) {
    const inTok = Number(inputTokens);
    const outTok = Number(outputTokens);
    if (!Number.isFinite(inTok) || !Number.isFinite(outTok)) return null;

    const inputUsd = (inTok / 1_000_000) * rates.input;
    const outputUsd = (outTok / 1_000_000) * rates.output;
    return inputUsd + outputUsd;
  }

  function estimateUsd(payload) {
    if (!payload || typeof payload !== "object") return null;
    if (payload.estimatedUsd != null) return payload.estimatedUsd;
    if (payload.inputTokens == null || payload.outputTokens == null) return null;

    const pk = resolveUsageProviderKey(payload.providerKey, payload.modelId);

    if (isOpenAiEffectiveNoteProvider(pk)) {
      const modelId = payload.modelId;
      const rates = modelId ? OPENAI_USD_PER_MTOK[modelId] : null;
      if (!rates) return null;
      return estimateUsdFromRates({
        rates,
        inputTokens: payload.inputTokens,
        outputTokens: payload.outputTokens,
      });
    }

    if (isMistralEffectiveNoteProvider(pk)) {
      const modelId = String(payload.modelId || "mistral-large-latest").trim();
      const rates =
        MISTRAL_USD_PER_MTOK[modelId] ||
        (modelId.startsWith("mistral-large")
          ? MISTRAL_USD_PER_MTOK["mistral-large-latest"]
          : null);
      if (!rates) return null;
      return estimateUsdFromRates({
        rates,
        inputTokens: payload.inputTokens,
        outputTokens: payload.outputTokens,
      });
    }

    if (isBedrockEffectiveNoteProvider(pk)) {
      const modelKeyRaw = payload.modelId || getSelectedBedrockModelKey();
      const modelKey = modelKeyRaw ? String(modelKeyRaw).trim() : null;
      const rates = modelKey ? BEDROCK_CLAUDE_USD_PER_MTOK[modelKey] : null;
      if (!rates) return null;
      return estimateUsdFromRates({
        rates,
        inputTokens: payload.inputTokens,
        outputTokens: payload.outputTokens,
      });
    }

    if (isGeminiApiEffectiveNoteProvider(pk)) {
      const promptTokens = Number(payload.inputTokens);
      const outTokens = Number(payload.outputTokens);
      if (!Number.isFinite(promptTokens) || !Number.isFinite(outTokens)) return null;

      const geminiMeta = payload.meta && payload.meta.gemini ? payload.meta.gemini : null;
      const toolUsePrompt =
        geminiMeta && typeof geminiMeta.toolUsePromptTokenCount === "number"
          ? geminiMeta.toolUsePromptTokenCount
          : 0;
      const thoughts =
        geminiMeta && typeof geminiMeta.thoughtsTokenCount === "number"
          ? geminiMeta.thoughtsTokenCount
          : 0;

      const billableInput = promptTokens + toolUsePrompt;
      const billableOutput = outTokens + thoughts;
      const modelId = String(
        payload.modelId || getSelectedGeminiModelKey() || DEFAULTS.geminiModel
      ).trim().toLowerCase();
      const pricing = GEMINI_API_USD_PER_MTOK[modelId];
      if (!pricing) return null;

      if (pricing.rates) {
        return estimateUsdFromRates({
          rates: pricing.rates,
          inputTokens: billableInput,
          outputTokens: billableOutput,
        });
      }

      const tier =
        promptTokens > Number(pricing.thresholdInputTokens || 0) ? "long" : "short";
      const rates = pricing[tier];
      if (!rates) return null;

      return estimateUsdFromRates({
        rates,
        inputTokens: billableInput,
        outputTokens: billableOutput,
      });
    }

    if (isVertexEffectiveNoteProvider(pk)) {
      const promptTokens = Number(payload.inputTokens);
      const outTokens = Number(payload.outputTokens);
      if (!Number.isFinite(promptTokens) || !Number.isFinite(outTokens)) return null;

      const vertexMeta = payload.meta && payload.meta.vertex ? payload.meta.vertex : null;
      const toolUsePrompt =
        vertexMeta && typeof vertexMeta.toolUsePromptTokenCount === "number"
          ? vertexMeta.toolUsePromptTokenCount
          : 0;
      const thoughts =
        vertexMeta && typeof vertexMeta.thoughtsTokenCount === "number"
          ? vertexMeta.thoughtsTokenCount
          : 0;

      const billableInput = promptTokens + toolUsePrompt;
      const billableOutput = outTokens + thoughts;
      const tier =
        promptTokens > GEMINI_25_PRO_VERTEX_USD_PER_MTOK.thresholdInputTokens ? "long" : "short";
      const rates = GEMINI_25_PRO_VERTEX_USD_PER_MTOK[tier];

      return estimateUsdFromRates({
        rates,
        inputTokens: billableInput,
        outputTokens: billableOutput,
      });
    }

    return null;
  }

  function toFiniteInt(value) {
    if (typeof value === "number" && Number.isFinite(value)) return Math.trunc(value);
    if (typeof value === "string" && value.trim() !== "") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return Math.trunc(parsed);
    }
    return null;
  }

  function fmtTokens(value) {
    return typeof value === "number" && Number.isFinite(value) ? nfInt.format(value) : "—";
  }

  function fmtUsd(value) {
    if (!(typeof value === "number" && Number.isFinite(value))) return "—";
    const abs = Math.abs(value);
    const digits = abs > 1 ? 2 : abs > 0.1 ? 3 : 6;
    return `$${value.toFixed(digits)}`;
  }

  function logUnifiedNoteUsageAndCost({
    payload,
    billableInputTokens,
    billableOutputTokens,
    notes = [],
  } = {}) {
    if (!payload || typeof payload !== "object") return;

    const providerKey = resolveUsageProviderKey(payload.providerKey, payload.modelId);
    const modelId = payload.modelId || getDefaultModelIdForProvider(providerKey);
    const billableTotalTokens =
      Number.isFinite(Number(billableInputTokens)) && Number.isFinite(Number(billableOutputTokens))
        ? Number(billableInputTokens) + Number(billableOutputTokens)
        : null;

    const summaryParts = [
      `[note usage/cost] provider=${providerKey || "unknown"}`,
      `model=${modelId || "unknown"}`,
      `input=${fmtTokens(payload.inputTokens)}`,
      `output=${fmtTokens(payload.outputTokens)}`,
      `total=${fmtTokens(payload.totalTokens)}`,
      `billableInput=${fmtTokens(billableInputTokens)}`,
      `billableOutput=${fmtTokens(billableOutputTokens)}`,
      `billableTotal=${fmtTokens(billableTotalTokens)}`,
      `estimated=${payload.estimatedUsd == null ? "—" : fmtUsd(payload.estimatedUsd)}`,
    ];

    if (notes.length) {
      summaryParts.push(`extras=${notes.join(", ")}`);
    }

    console.log(summaryParts.join(" | "));

    if (getDebugNoteCostEnabled()) {
      console.log("[note cost estimate]", {
        providerKey: payload.providerKey,
        modelId: payload.modelId,
        inputTokens: payload.inputTokens,
        outputTokens: payload.outputTokens,
        totalTokens: payload.totalTokens,
        billableInputTokens,
        billableOutputTokens,
        estimatedUsd: payload.estimatedUsd,
        notes,
        meta: payload.meta || null,
      });
    }
  }

  const app = getApp();

  app.normalizeNoteUsage = function normalizeNoteUsage({
    providerKey = null,
    modelId = null,
    usage = null,
    meta = null,
  } = {}) {
    let inputTokens = null;
    let outputTokens = null;
    let totalTokens = null;
    const outMeta = meta && typeof meta === "object" ? { ...meta } : {};

    if (usage && typeof usage === "object") {
      if ("input_tokens" in usage || "output_tokens" in usage) {
        inputTokens = toFiniteInt(usage.input_tokens);
        outputTokens = toFiniteInt(usage.output_tokens);
        totalTokens = toFiniteInt(usage.total_tokens);

        const reasoningTokens = toFiniteInt(
          usage.output_tokens_details && usage.output_tokens_details.reasoning_tokens
        );
        if (reasoningTokens != null) outMeta.reasoningTokens = reasoningTokens;
      }

      if (inputTokens == null && ("prompt_tokens" in usage || "completion_tokens" in usage)) {
        inputTokens = toFiniteInt(usage.prompt_tokens);
        outputTokens = toFiniteInt(usage.completion_tokens);
        totalTokens = toFiniteInt(usage.total_tokens);
      }

      if (inputTokens == null && ("promptTokenCount" in usage || "candidatesTokenCount" in usage)) {
        inputTokens = toFiniteInt(usage.promptTokenCount);
        outputTokens = toFiniteInt(usage.candidatesTokenCount);
        totalTokens = toFiniteInt(usage.totalTokenCount);
        outMeta.gemini = {
          thoughtsTokenCount: toFiniteInt(usage.thoughtsTokenCount),
          toolUsePromptTokenCount: toFiniteInt(usage.toolUsePromptTokenCount),
          cachedContentTokenCount: toFiniteInt(usage.cachedContentTokenCount),
        };
      }

      if (inputTokens == null && ("promptTokens" in usage || "outputTokens" in usage)) {
        inputTokens = toFiniteInt(usage.promptTokens);
        outputTokens = toFiniteInt(usage.outputTokens);
        totalTokens = toFiniteInt(usage.totalTokens);
        if (usage.raw && typeof usage.raw === "object") outMeta.vertex = { ...usage.raw };
      }

      if (inputTokens == null && ("inputTokens" in usage || "outputTokens" in usage)) {
        inputTokens = toFiniteInt(usage.inputTokens);
        outputTokens = toFiniteInt(usage.outputTokens);
      }
    }

    if (totalTokens == null && inputTokens != null && outputTokens != null) {
      totalTokens = inputTokens + outputTokens;
    }

    const effectiveProviderKey = providerKey
      ? resolveUsageProviderKey(providerKey, modelId)
      : getEffectiveProviderKey();

    const effectiveModelId = modelId
      ? String(modelId)
      : getDefaultModelIdForProvider(effectiveProviderKey);

    return {
      providerKey: effectiveProviderKey,
      modelId: effectiveModelId,
      inputTokens,
      outputTokens,
      totalTokens,
      estimatedUsd: null,
      meta: outMeta,
    };
  };

  app.clearNoteUsageAndCost = function clearNoteUsageAndCost() {
    const el = costEl();
    if (el) el.textContent = "";
  };

  app.setNoteUsageAndCost = function setNoteUsageAndCost(payloadOrArgs) {
    let payload = payloadOrArgs;

    if (payload && typeof payload === "object" && "usage" in payload && !("inputTokens" in payload)) {
      payload = app.normalizeNoteUsage(payload);
    }

    const el = costEl();
    if (!el || !payload || typeof payload !== "object") return;

    try {
      const usd = estimateUsd(payload);
      if (usd != null) payload.estimatedUsd = usd;
    } catch (_) {}

    let billableInputTokens = payload.inputTokens;
    let billableOutputTokens = payload.outputTokens;
    const notes = [];

    try {
      const pk = resolveUsageProviderKey(payload.providerKey, payload.modelId);

      const reasoningTokens =
        payload.meta && typeof payload.meta.reasoningTokens === "number"
          ? payload.meta.reasoningTokens
          : null;
      if (reasoningTokens && Number.isFinite(reasoningTokens) && reasoningTokens > 0) {
        notes.push(`${fmtTokens(reasoningTokens)} reasoning`);
      }

      if (isGeminiApiEffectiveNoteProvider(pk)) {
        const geminiMeta = payload.meta && payload.meta.gemini ? payload.meta.gemini : null;
        const toolUsePrompt =
          geminiMeta && typeof geminiMeta.toolUsePromptTokenCount === "number"
            ? geminiMeta.toolUsePromptTokenCount
            : 0;
        const thoughts =
          geminiMeta && typeof geminiMeta.thoughtsTokenCount === "number"
            ? geminiMeta.thoughtsTokenCount
            : 0;

        if (Number.isFinite(toolUsePrompt) && toolUsePrompt > 0) {
          billableInputTokens = Number(billableInputTokens ?? 0) + toolUsePrompt;
          notes.push(`${fmtTokens(toolUsePrompt)} tool-use prompt`);
        }
        if (Number.isFinite(thoughts) && thoughts > 0) {
          billableOutputTokens = Number(billableOutputTokens ?? 0) + thoughts;
          notes.push(`${fmtTokens(thoughts)} thinking`);
        }
      }

      if (isVertexEffectiveNoteProvider(pk)) {
        const vertexMeta = payload.meta && payload.meta.vertex ? payload.meta.vertex : null;
        const toolUsePrompt =
          vertexMeta && typeof vertexMeta.toolUsePromptTokenCount === "number"
            ? vertexMeta.toolUsePromptTokenCount
            : 0;
        const thoughts =
          vertexMeta && typeof vertexMeta.thoughtsTokenCount === "number"
            ? vertexMeta.thoughtsTokenCount
            : 0;

        if (Number.isFinite(toolUsePrompt) && toolUsePrompt > 0) {
          billableInputTokens = Number(billableInputTokens ?? 0) + toolUsePrompt;
          notes.push(`${fmtTokens(toolUsePrompt)} tool-use prompt`);
        }
        if (Number.isFinite(thoughts) && thoughts > 0) {
          billableOutputTokens = Number(billableOutputTokens ?? 0) + thoughts;
          notes.push(`${fmtTokens(thoughts)} thinking`);
        }
      }
    } catch (_) {}

    try {
      logUnifiedNoteUsageAndCost({
        payload,
        billableInputTokens,
        billableOutputTokens,
        notes,
      });
    } catch (_) {}

    const noteSuffix = notes.length ? ` (${notes.join(", ")})` : "";
    const parts = [
      `Billable input: ${fmtTokens(billableInputTokens)}`,
      `Billable output: ${fmtTokens(billableOutputTokens)}${noteSuffix}`,
      `Est cost: ${payload.estimatedUsd == null ? "—" : fmtUsd(payload.estimatedUsd)}`,
    ];
    el.textContent = parts.join("  ·  ");
  };

  function wireAutoClear() {
    const clear = () => {
      try {
        app.clearNoteUsageAndCost?.();
      } catch (_) {}
    };

    const genBtn = document.getElementById("generateNoteButton");
    if (genBtn) {
      genBtn.addEventListener("pointerdown", clear, true);
      genBtn.addEventListener("click", clear, true);
    }

    [
      "noteProvider",
      "openaiModel",
      "noteProviderMode",
      "geminiModel",
      "vertexModel",
      "bedrockModel",
    ].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener("change", clear, true);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wireAutoClear, { once: true });
  } else {
    wireAutoClear();
  }
})();

