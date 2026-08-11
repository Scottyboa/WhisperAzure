
import {
  DEFAULTS,
  getDefaultModelIdForEffectiveNoteProvider,
  isBedrockEffectiveNoteProvider,
  isGeminiApiEffectiveNoteProvider,
  isMistralEffectiveNoteProvider,
  isOpenAiEffectiveNoteProvider,
  isRequestyEffectiveNoteProvider,
  isVertexEffectiveNoteProvider,
  normalizeNoteEffectiveProvider,
  resolveRequestyEffectiveProvider,
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
    // effective provider key ("gpt5", "gpt52", "gpt54", "gpt55"). Normalize those here
    // so pricing and logging do not fall back to DEFAULTS.noteProvider.
    if (rawProvider === "openai") {
      const rawModel = String(modelId || "").trim().toLowerCase();
      if (rawModel === "gpt-5.5") return "gpt55";
      if (rawModel === "gpt-5.4") return "gpt54";
      if (rawModel === "gpt-5.2") return "gpt52";
      if (rawModel === "gpt-5.1") return "gpt5";

      const snapshot = getControllerNoteSnapshot();
      const openAiModel = String(
        snapshot.openaiModel || readSession("openai_model", "") || DEFAULTS.openaiModel
      ).trim().toLowerCase();
      if (openAiModel === "gpt55") return "gpt55";
      if (openAiModel === "gpt54") return "gpt54";
      if (openAiModel === "gpt52") return "gpt52";
      return "gpt5";
    }

    // The Requesty note module reports the UI provider ("requesty");
    // resolve it to the effective provider key using the model id so it
    // does not fall back to DEFAULTS.noteProvider.
    if (rawProvider === "requesty") {
      const rawModel = String(modelId || "").trim().toLowerCase();
      // Prefer the model id reported in the usage payload; fall back to the
      // live snapshot / session value. resolveRequestyEffectiveProvider maps
      // the model to its effective provider (requesty-claude / requesty-sonnet
      // / requesty-gpt55) directly from the registry, so new models resolve
      // without touching this branch.
      const snapshot = getControllerNoteSnapshot();
      const requestyModel =
        rawModel ||
        String(
          snapshot.requestyModel || readSession("requesty_model", "") || DEFAULTS.requestyModel
        ).trim().toLowerCase();
      return resolveRequestyEffectiveProvider(requestyModel);
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
    "gpt-5.5": { input: 5.0, output: 30.0 },
    "chatgpt-4o-latest": { input: 5.0, output: 15.0 },
    "GPT-5.1": { input: 1.25, output: 10.0 },
    "GPT-5.2": { input: 1.75, output: 14.0 },
    "GPT-5.4": { input: 2.5, output: 15.0 },
    "GPT-5.5": { input: 5.0, output: 30.0 },
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

  // Lemonfox Llama 3.3 70B uses one flat per-token rate for both directions.
  const LEMONFOX_USD_PER_MTOK = {
    "llama-70b-chat": { input: 1.25, output: 1.25 },
  };

  // Requesty (EU router) — underlying model list prices, USD per 1M tokens.
  // claude-opus-5: bedrock/claude-opus-5@eu-north-1 rates
  // claude-sonnet-5: vertex/claude-sonnet-5@eu rates (EU regional pricing)
  // gpt-5.5:         azure/gpt-5.5@swedencentral rates
  // gpt-5-nano:      azure/gpt-5-nano@swedencentral rates
  // gpt-5.6-*:       Azure Sweden Central rates from Requesty's model cards
  // kimi-k3:          nebius/kimi-k3 rates
  const REQUESTY_USD_PER_MTOK = {
    "claude-opus-5": { input: 5.5, output: 27.5 },
    "claude-sonnet-5": { input: 2.2, output: 11.0 },
    "gpt-5.5": { input: 5.0, output: 30.0 },
    "gpt-5-nano": { input: 0.05, output: 0.4 },
    "gpt-5.6-luna": { input: 0.22, output: 1.32 },
    "gpt-5.6-terra": { input: 2.2, output: 13.2 },
    "gpt-5.6-sol": { input: 5.5, output: 33.0 },
    "kimi-k3": { input: 3.0, output: 15.0 },
  };

  // Requesty's ~5% premium is a one-time top-up fee applied when funding
  // credits, NOT a per-request charge, so it is intentionally not applied to
  // the per-generation cost estimates below (raw underlying rates are used).

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

  // Vertex AI: USD per 1M tokens, keyed by model id.
  // Flash/Flash-Lite use flat rates; Pro uses 200K short/long tiers.
  // NOTE: verify the 3.1 Flash-Lite rate against the live Vertex pricing page
  // (public sources conflicted: $0.25/$1.50 at launch vs $0.30/$2.50 post-GA).
  const VERTEX_USD_PER_MTOK = {
    "gemini-2.5-pro": {
      thresholdInputTokens: 200_000,
      short: { input: 1.25, output: 10.0 },
      long: { input: 2.5, output: 15.0 },
    },
    "gemini-3.5-flash": { rates: { input: 1.5, output: 9.0 } },
    "gemini-3.1-flash-lite": { rates: { input: 0.3, output: 2.5 } },
  };

  const OPENAI_UI_MODEL_IDS = {
    gpt5: "gpt-5.1",
    gpt52: "gpt-5.2",
    gpt54: "gpt-5.4",
    gpt55: "gpt-5.5",
  };

  function getModelPricing({
    provider,
    openaiModel,
    geminiModel,
    vertexModel,
    bedrockModel,
    requestyModel,
  } = {}) {
    const providerKey = String(provider || "").trim().toLowerCase();

    if (providerKey === "openai") {
      const rawModel = String(openaiModel || DEFAULTS.openaiModel).trim().toLowerCase();
      const modelId = OPENAI_UI_MODEL_IDS[rawModel] || rawModel;
      const rates = OPENAI_USD_PER_MTOK[modelId];
      return rates ? { rates } : null;
    }

    if (providerKey === "lemonfox") {
      return { rates: LEMONFOX_USD_PER_MTOK["llama-70b-chat"] };
    }

    if (providerKey === "mistral") {
      return { rates: MISTRAL_USD_PER_MTOK["mistral-large-latest"] };
    }

    if (providerKey === "gemini3") {
      const modelId = String(geminiModel || DEFAULTS.geminiModel).trim().toLowerCase();
      return GEMINI_API_USD_PER_MTOK[modelId] || null;
    }

    if (providerKey === "gemini3-vertex") {
      const modelId = String(vertexModel || DEFAULTS.vertexModel).trim().toLowerCase();
      return VERTEX_USD_PER_MTOK[modelId] || null;
    }

    if (providerKey === "aws-bedrock") {
      const modelId = String(bedrockModel || DEFAULTS.bedrockModel).trim().toLowerCase();
      const rates = BEDROCK_CLAUDE_USD_PER_MTOK[modelId];
      return rates ? { rates } : null;
    }

    if (providerKey === "requesty") {
      const modelId = String(requestyModel || DEFAULTS.requestyModel).trim().toLowerCase();
      const rates = REQUESTY_USD_PER_MTOK[modelId];
      return rates ? { rates } : null;
    }

    return null;
  }

  function fmtRate(value) {
    const amount = Number(value);
    return Number.isFinite(amount) ? `$${amount.toFixed(2)}` : "—";
  }

  function fmtRateRange(first, second) {
    const firstAmount = Number(first);
    const secondAmount = Number(second);
    if (!Number.isFinite(firstAmount) || !Number.isFinite(secondAmount)) return "—";
    if (firstAmount === secondAmount) return fmtRate(firstAmount);
    return `${fmtRate(firstAmount)}–${fmtRate(secondAmount)}`;
  }

  function formatModelPricing(pricing) {
    if (!pricing || typeof pricing !== "object") return "";

    if (pricing.rates) {
      return `Input: ${fmtRate(pricing.rates.input)}/1M · Output: ${fmtRate(pricing.rates.output)}/1M`;
    }

    if (pricing.short && pricing.long) {
      return (
        `Input: ${fmtRateRange(pricing.short.input, pricing.long.input)}/1M · ` +
        `Output: ${fmtRateRange(pricing.short.output, pricing.long.output)}/1M`
      );
    }

    return "";
  }

  function readSelectValue(id, fallback = "") {
    const value = document.getElementById(id)?.value;
    return String(value || fallback || "").trim();
  }

  function setModelPriceLabel(id, text, { hidden = false } = {}) {
    const label = document.getElementById(id);
    if (!label) return;
    label.textContent = String(text || "");
    label.hidden = hidden || !text;
  }

  function renderNoteModelPrices() {
    const mainProvider = readSelectValue(
      "noteProvider",
      readSession("note_provider", DEFAULTS.noteProvider)
    ).toLowerCase();
    const mainSelections = {
      openaiModel: readSelectValue("openaiModel", DEFAULTS.openaiModel),
      geminiModel: readSelectValue("geminiModel", DEFAULTS.geminiModel),
      vertexModel: readSelectValue("vertexModel", DEFAULTS.vertexModel),
      bedrockModel: readSelectValue("bedrockModel", DEFAULTS.bedrockModel),
      requestyModel: readSelectValue("requestyModel", DEFAULTS.requestyModel),
    };

    setModelPriceLabel(
      "openaiModelPrice",
      formatModelPricing(getModelPricing({ provider: "openai", ...mainSelections }))
    );
    setModelPriceLabel(
      "geminiModelPrice",
      formatModelPricing(getModelPricing({ provider: "gemini3", ...mainSelections }))
    );
    setModelPriceLabel(
      "vertexModelPrice",
      formatModelPricing(getModelPricing({ provider: "gemini3-vertex", ...mainSelections }))
    );
    setModelPriceLabel(
      "bedrockModelPrice",
      formatModelPricing(getModelPricing({ provider: "aws-bedrock", ...mainSelections }))
    );
    setModelPriceLabel(
      "requestyModelPrice",
      formatModelPricing(getModelPricing({ provider: "requesty", ...mainSelections }))
    );

    const mainFixedPrice =
      mainProvider === "lemonfox" || mainProvider === "mistral"
        ? formatModelPricing(getModelPricing({ provider: mainProvider }))
        : "";
    setModelPriceLabel("fixedNoteModelPrice", mainFixedPrice, {
      hidden: !mainFixedPrice,
    });

    const secondaryProvider = readSelectValue(
      "secondaryProvider",
      readSession("secondary_note_provider", DEFAULTS.noteProvider)
    ).toLowerCase();
    const secondarySelections = {
      openaiModel: readSelectValue("secondaryOpenaiModel", DEFAULTS.openaiModel),
      geminiModel: readSelectValue("secondaryGeminiModel", DEFAULTS.geminiModel),
      vertexModel: readSelectValue("secondaryVertexModel", DEFAULTS.vertexModel),
      bedrockModel: readSelectValue("secondaryBedrockModel", DEFAULTS.bedrockModel),
      requestyModel: readSelectValue("secondaryRequestyModel", DEFAULTS.requestyModel),
    };

    setModelPriceLabel(
      "secondaryOpenaiModelPrice",
      formatModelPricing(getModelPricing({ provider: "openai", ...secondarySelections }))
    );
    setModelPriceLabel(
      "secondaryGeminiModelPrice",
      formatModelPricing(getModelPricing({ provider: "gemini3", ...secondarySelections }))
    );
    setModelPriceLabel(
      "secondaryVertexModelPrice",
      formatModelPricing(getModelPricing({ provider: "gemini3-vertex", ...secondarySelections }))
    );
    setModelPriceLabel(
      "secondaryBedrockModelPrice",
      formatModelPricing(getModelPricing({ provider: "aws-bedrock", ...secondarySelections }))
    );
    setModelPriceLabel(
      "secondaryRequestyModelPrice",
      formatModelPricing(getModelPricing({ provider: "requesty", ...secondarySelections }))
    );

    const secondaryFixedPrice =
      secondaryProvider === "lemonfox" || secondaryProvider === "mistral"
        ? formatModelPricing(getModelPricing({ provider: secondaryProvider }))
        : "";
    setModelPriceLabel("secondaryFixedModelPrice", secondaryFixedPrice, {
      hidden: !secondaryFixedPrice,
    });
  }

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
    const pk = resolveUsageProviderKey(payload.providerKey, payload.modelId);

    // Requesty returns the exact USD charge for each completion. Prefer that
    // value over a local estimate so caching, regional rates, long-context
    // multipliers, and future price changes are reflected automatically.
    if (isRequestyEffectiveNoteProvider(pk)) {
      const rawReportedCost = payload.meta?.requestyReportedCost;
      if (rawReportedCost !== null && rawReportedCost !== undefined && rawReportedCost !== "") {
        const reportedCost = Number(rawReportedCost);
        if (Number.isFinite(reportedCost) && reportedCost >= 0) return reportedCost;
      }
    }

    if (payload.estimatedUsd != null) return payload.estimatedUsd;
    if (payload.inputTokens == null || payload.outputTokens == null) return null;

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

    if (isRequestyEffectiveNoteProvider(pk)) {
      const modelId = String(payload.modelId || "").trim().toLowerCase();
      const rates = REQUESTY_USD_PER_MTOK[modelId];
      if (!rates) return null;

      const baseUsd = estimateUsdFromRates({
        rates,
        inputTokens: payload.inputTokens,
        outputTokens: payload.outputTokens,
      });
      if (baseUsd == null) return null;

      // Requesty balance is charged at the underlying model's list price at
      // request time; the ~5% premium is a one-time top-up fee applied when
      // credits are funded, not per request. So the per-generation estimate
      // uses the raw underlying rates (like every other provider) to reflect
      // the actual balance drawdown for this note.
      return baseUsd;
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

    if (pk === "lemonfox") {
      const rates = LEMONFOX_USD_PER_MTOK["llama-70b-chat"];
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

      const modelId = String(
        payload.modelId || readSession("vertex_model", "") || DEFAULTS.vertexModel
      ).trim().toLowerCase();
      const pricing = VERTEX_USD_PER_MTOK[modelId];
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

  app.formatNoteModelPrice = function formatNoteModelPrice(selection) {
    return formatModelPricing(getModelPricing(selection));
  };

  app.renderNoteModelPrices = renderNoteModelPrices;

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

    // Requesty includes the exact per-request USD charge in usage.cost. Copy
    // it into normalized metadata here so this works for both the primary and
    // secondary note generators, even when a caller does not pass it itself.
    if (isRequestyEffectiveNoteProvider(effectiveProviderKey)) {
      const rawReportedCost = usage?.cost ?? outMeta.requestyReportedCost;
      if (rawReportedCost !== null && rawReportedCost !== undefined && rawReportedCost !== "") {
        const reportedCost = Number(rawReportedCost);
        if (Number.isFinite(reportedCost) && reportedCost >= 0) {
          outMeta.requestyReportedCost = reportedCost;
        }
      }
    }

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

  // Computes the "Billable input … · Billable output … · Est cost …" line for
  // a usage payload WITHOUT touching the primary #noteUsageCost element.
  // Shared by setNoteUsageAndCost (primary generator) and the secondary note
  // generator, so both use identical normalization, pricing, and formatting.
  app.formatNoteUsageAndCost = function formatNoteUsageAndCost(payloadOrArgs) {
    let payload = payloadOrArgs;

    if (payload && typeof payload === "object" && "usage" in payload && !("inputTokens" in payload)) {
      payload = app.normalizeNoteUsage(payload);
    }

    if (!payload || typeof payload !== "object") return "";

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
    return parts.join("  ·  ");
  };

  app.setNoteUsageAndCost = function setNoteUsageAndCost(payloadOrArgs) {
    const el = costEl();
    if (!el) return;

    const text = app.formatNoteUsageAndCost(payloadOrArgs);
    if (!text) return;

    el.textContent = text;
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
      "requestyModel",
    ].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener("change", clear, true);
    });

    [
      "noteProvider",
      "openaiModel",
      "geminiModel",
      "vertexModel",
      "bedrockModel",
      "requestyModel",
      "secondaryProvider",
      "secondaryOpenaiModel",
      "secondaryGeminiModel",
      "secondaryVertexModel",
      "secondaryBedrockModel",
      "secondaryRequestyModel",
    ].forEach((id) => {
      const select = document.getElementById(id);
      if (select) select.addEventListener("change", renderNoteModelPrices);
    });

    renderNoteModelPrices();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wireAutoClear, { once: true });
  } else {
    wireAutoClear();
  }
})();
