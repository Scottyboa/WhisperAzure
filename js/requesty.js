// requesty.js
//
// Note generation via Requesty (https://docs.requesty.ai) — a unified,
// OpenAI-compatible LLM router. This module always talks to Requesty's
// EU endpoint (Frankfurt, AWS eu-central-1) and only requests EU-region
// models, so both Requesty's processing AND the model inference stay in
// the EU (GDPR compliant):
//
//   - Claude Opus 5    -> bedrock/claude-opus-5@eu-north-1   (AWS Bedrock, Stockholm)
//   - GPT-5.5          -> azure/gpt-5.5@swedencentral        (Azure, Sweden Central)
//   - GPT-5.6 Luna     -> azure/gpt-5.6-luna@swedencentral   (Azure, Sweden Central)
//   - GPT-5.6 Terra    -> azure/gpt-5.6-terra@swedencentral  (Azure, Sweden Central)
//   - GPT-5.6 Sol      -> azure/gpt-5.6-sol@swedencentral    (Azure, Sweden Central)
//   - Kimi K3          -> nebius/kimi-k3                      (Nebius, EU)
//
// sessionStorage keys used:
//   requesty_api_key   (set on the start page, index.html)
//   requesty_model     (one of the Requesty model values registered below)
//
// API notes (see https://docs.requesty.ai/quickstart and
// https://docs.requesty.ai/features/eu-routing):
//   - Endpoint:   POST https://router.eu.requesty.ai/v1/chat/completions
//   - Auth:       Authorization: Bearer <requesty_api_key>
//   - Format:     OpenAI Chat Completions (messages / stream / usage)
//   - Streaming:  SSE; usage arrives in a final chunk when
//                 stream_options.include_usage is set
//   - Reasoning:  `reasoning_effort` works for both OpenAI models and
//                 Anthropic models. Requesty forwards the standard OpenAI
//                 efforts, including model-supported "xhigh", and converts
//                 Anthropic efforts to a thinking-token budget.
//                 "none" is handled here by omitting the parameter, matching
//                 the native OpenAI note module's behaviour.

import {
  beginNoteRun,
  bindGenerateNoteButton,
  buildStandardNotePrompt,
  finishNoteAbort,
  getSelectValue,
  pushNormalizedNoteUsage,
  requireSessionKey,
  resolveCommonNoteInputs,
  startNoteTimer,
  streamChatCompletionsSse
} from "./core/note-runner.js";
import { normalizeOpenAiReasoning, normalizeRequestyNanoReasoning } from "./core/provider-registry.js";

// EU router: Requesty processing/storage stays in Frankfurt. Combined with
// the EU-region model ids below, no request data leaves the EU.
const REQUESTY_EU_CHAT_COMPLETIONS_URL =
  "https://router.eu.requesty.ai/v1/chat/completions";

// -----------------------------------------------------------------------------
// Variant configuration table
// -----------------------------------------------------------------------------
//
// Keyed by the #requestyModel select value / requesty_model session value.
//
//   requestyModelId : full `provider/model@region` id sent to Requesty
//   pricingModelId  : short key used by note-usage-cost.js pricing tables
//                     and pushed as `modelId` in usage payloads

const VARIANTS = Object.freeze({
  "claude-opus-5": {
    // AWS Bedrock, EU (Stockholm region).
    requestyModelId: "bedrock/claude-opus-5@eu-north-1",
    pricingModelId: "claude-opus-5"
  },
  "claude-sonnet-5": {
    // Google Vertex AI, EU-resident deployment (GDPR). Confirmed model id
    // on Requesty: vertex/claude-sonnet-5@eu.
    requestyModelId: "vertex/claude-sonnet-5@eu",
    pricingModelId: "claude-sonnet-5"
  },
  "gpt-5.5": {
    // Azure OpenAI, Sweden Central (EU).
    requestyModelId: "azure/gpt-5.5@swedencentral",
    pricingModelId: "gpt-5.5"
  },
  "gpt-5-nano": {
    // Azure OpenAI, Sweden Central (EU). GPT-5 Nano is a reasoning model whose
    // reasoning_effort values are minimal | low | medium | high (default
    // medium) — read from the dedicated #requestyNanoReasoning selector.
    requestyModelId: "azure/gpt-5-nano@swedencentral",
    pricingModelId: "gpt-5-nano",
    reasoningSelector: "dedicated"
  },
  "gpt-5.6-luna": {
    requestyModelId: "azure/gpt-5.6-luna@swedencentral",
    pricingModelId: "gpt-5.6-luna",
    reasoningSelector: "dedicated"
  },
  "gpt-5.6-terra": {
    requestyModelId: "azure/gpt-5.6-terra@swedencentral",
    pricingModelId: "gpt-5.6-terra",
    reasoningSelector: "dedicated"
  },
  "gpt-5.6-sol": {
    requestyModelId: "azure/gpt-5.6-sol@swedencentral",
    pricingModelId: "gpt-5.6-sol",
    reasoningSelector: "dedicated"
  },
  "kimi-k3": {
    // Nebius's EU-hosted endpoint. Kimi K3 always reasons and supports
    // reasoning_effort low | high | max. The app defaults to low.
    requestyModelId: "nebius/kimi-k3",
    pricingModelId: "kimi-k3",
    reasoningSelector: "dedicated"
  }
});

const DEFAULT_VARIANT_KEY = "claude-opus-5";

// -----------------------------------------------------------------------------
// Shared helpers
// -----------------------------------------------------------------------------

function getSelectedVariantKey() {
  const raw = String(
    document.getElementById("requestyModel")?.value ||
      sessionStorage.getItem("requesty_model") ||
      DEFAULT_VARIANT_KEY
  ).trim().toLowerCase();

  return VARIANTS[raw] ? raw : DEFAULT_VARIANT_KEY;
}

function resolveEffectiveMode() {
  // All Requesty models are mode-driven: they read the shared
  // #noteProviderMode dropdown (streaming | non-streaming) at run time.
  return getSelectValue("noteProviderMode", "streaming").toLowerCase();
}

function resolveReasoningLevel(variantKey, variantConfig) {
  // GPT-5 Nano, GPT-5.6, and Kimi K3 use the dedicated Requesty selector.
  // Its options are hydrated for the selected model by provider-persistence.js.
  if (variantConfig && variantConfig.reasoningSelector === "dedicated") {
    return normalizeRequestyNanoReasoning(
      getSelectValue("requestyNanoReasoning", "medium"),
      variantKey
    );
  }
  // All other Requesty models reuse the shared #gpt5Reasoning selector
  // (none | low | medium | high). For the Anthropic models (Opus 5,
  // Sonnet 5) Requesty accepts reasoning_effort on its OpenAI-compatible
  // endpoint and maps it to a thinking budget; "none" is handled in
  // buildRequestBody by omitting the parameter (the model then uses its own
  // adaptive default). For GPT-5.5 it is the native OpenAI effort string.
  return normalizeOpenAiReasoning(getSelectValue("gpt5Reasoning", "none"));
}

function buildRequestBody({
  requestyModelId,
  finalPromptText,
  supplementaryWrapped,
  transcriptionText,
  streaming,
  reasoningLevel
}) {
  const requestBody = {
    model: requestyModelId,
    messages: [
      { role: "system", content: finalPromptText },
      { role: "user", content: `${supplementaryWrapped}${transcriptionText}` }
    ]
  };

  if (streaming) {
    requestBody.stream = true;
    // Opt in to the final usage chunk so token counts / cost can be shown.
    requestBody.stream_options = { include_usage: true };
  }

  if (reasoningLevel && reasoningLevel !== "none") {
    requestBody.reasoning_effort = reasoningLevel;
  }

  return requestBody;
}

function pushRequestyUsage(variantConfig, usage) {
  if (!usage) return;

  pushNormalizedNoteUsage({
    providerKey: "requesty",
    modelId: variantConfig.pricingModelId,
    usage,
    meta: {
      reasoningTokens: usage?.completion_tokens_details?.reasoning_tokens ?? 0,
      // Requesty reports its exact USD cost per request. The cost display
      // prefers this value and falls back to the static model price table.
      requestyReportedCost: typeof usage?.cost === "number" ? usage.cost : null
    }
  });

  if (typeof usage?.cost === "number") {
    console.log(`[Requesty] reported request cost: $${usage.cost}`);
  }
}

// -----------------------------------------------------------------------------
// Core engine
// -----------------------------------------------------------------------------

async function generateNote() {
  const variantKey = getSelectedVariantKey();
  const variantConfig = VARIANTS[variantKey];

  const effectiveMode = resolveEffectiveMode();
  const streaming = effectiveMode !== "non-streaming";
  const runMeta = {
    provider: "requesty",
    model: variantConfig.pricingModelId,
    mode: effectiveMode
  };

  const { app, controller } = beginNoteRun(runMeta);
  if (!controller) {
    return;
  }

  const common = resolveCommonNoteInputs(app);
  if (!common) {
    return;
  }

  const {
    transcriptionText,
    promptText,
    supplementaryWrapped,
    generatedNoteField,
    noteTimerElement
  } = common;

  generatedNoteField.value = "";
  const noteTimer = startNoteTimer(noteTimerElement);

  const apiKey = requireSessionKey("requesty_api_key", {
    alertText:
      "No Requesty API key available.\n\n" +
      "Please paste your Requesty API key on the start page before using the Requesty provider.",
    onMissing: () => {
      noteTimer.stop("");
      app.finishNoteGeneration?.();
    }
  });

  if (!apiKey) {
    return;
  }

  const finalPromptText = buildStandardNotePrompt(promptText);
  const reasoningLevel = resolveReasoningLevel(variantKey, variantConfig);
  const requestBody = buildRequestBody({
    requestyModelId: variantConfig.requestyModelId,
    finalPromptText,
    supplementaryWrapped,
    transcriptionText,
    streaming,
    reasoningLevel
  });

  try {
    const resp = await fetch(REQUESTY_EU_CHAT_COMPLETIONS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });

    if (!streaming) {
      if (!resp.ok) {
        const errText = await resp.text().catch(() => "");
        throw new Error(`Requesty error ${resp.status}: ${errText}`);
      }

      const json = await resp.json();
      pushRequestyUsage(variantConfig, json?.usage ?? null);
      generatedNoteField.value = json?.choices?.[0]?.message?.content || "";
    } else {
      await streamChatCompletionsSse(resp, {
        signal: controller.signal,
        errorLabel: "Requesty",
        captureUsage: true,
        onDelta: (textChunk) => {
          generatedNoteField.value += textChunk;
        },
        onDone: (finalEvent) => {
          pushRequestyUsage(variantConfig, finalEvent?.usage ?? null);
        },
        onError: (error) => {
          throw error;
        }
      });
    }

    noteTimer.stop("Text generation completed!");
    app.emitNoteFinished?.(runMeta);
  } catch (error) {
    if (error?.name === "AbortError") {
      finishNoteAbort({
        generatedNoteField,
        noteTimer,
        runMeta
      });
      return;
    }

    noteTimer.stop("");
    generatedNoteField.value = "Error generating note via Requesty: " + error;
    app.finishNoteGeneration?.();
  }
}

// -----------------------------------------------------------------------------
// Public init functions
// -----------------------------------------------------------------------------
//
// All effective providers (requesty-claude / requesty-sonnet /
// requesty-gpt55 / requesty-nano / requesty-gpt56-* / requesty-kimi-k3)
// bind the same generate function; the active model is read from the
// #requestyModel select / requesty_model session key at click time. Separate
// exports are kept so the provider-registry entries stay explicit and
// symmetrical with the OpenAI module.

function initRequestyClaudeOpus5() {
  bindGenerateNoteButton(generateNote);
}

function initRequestyClaudeSonnet5() {
  bindGenerateNoteButton(generateNote);
}

function initRequestyGpt55() {
  bindGenerateNoteButton(generateNote);
}

function initRequestyGpt5Nano() {
  bindGenerateNoteButton(generateNote);
}

function initRequestyGpt56Luna() {
  bindGenerateNoteButton(generateNote);
}

function initRequestyGpt56Terra() {
  bindGenerateNoteButton(generateNote);
}

function initRequestyGpt56Sol() {
  bindGenerateNoteButton(generateNote);
}

function initRequestyKimiK3() {
  bindGenerateNoteButton(generateNote);
}

export {
  initRequestyClaudeOpus5,
  initRequestyClaudeSonnet5,
  initRequestyGpt55,
  initRequestyGpt5Nano,
  initRequestyGpt56Luna,
  initRequestyGpt56Terra,
  initRequestyGpt56Sol,
  initRequestyKimiK3
};
