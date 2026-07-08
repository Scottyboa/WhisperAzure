// js/features/secondary-note.js
//
// Optional Secondary Note Generation module displayed beside the Recording
// Transcript. It reuses the application's shared infrastructure:
//
//   - provider registry (option lists, normalizers, UI visibility rules)
//   - note-runner streaming/request helpers
//   - PromptManager (shared saved prompt slots — read-only from here)
//   - note-usage-cost normalization + pricing (via window.__app helpers)
//   - the same sessionStorage credential keys as the primary generator
//
// ...while keeping a completely separate generation session:
//
//   - own provider/model/mode/reasoning selections (own storage keys)
//   - own prompt-slot selection (prompt TEXTS are shared, selection is not)
//   - own AbortController, timer, usage/cost line, status and output field
//
// The module never calls app.beginNoteGeneration / app.emitNoteFinished, so
// primary and secondary requests can run independently without locking or
// overwriting each other's UI.

import {
  buildStandardNotePrompt,
  extractResponsesOutputText,
  formatTime,
  streamChatCompletionsSse,
  streamGeminiSse,
  streamResponsesSse
} from "../core/note-runner.js";
import {
  DEFAULTS,
  getNoteUiVisibility,
  listBedrockModelOptions,
  listGeminiApiModelOptions,
  listGeminiReasoningOptions,
  listNoteModeOptions,
  listNoteUiProviderOptions,
  listOpenAiModelOptions,
  listOpenAiReasoningOptions,
  listRequestyModelOptions,
  listRequestyNanoReasoningOptions,
  listVertexModelOptions,
  normalizeGeminiReasoning,
  normalizeNoteMode,
  normalizeNoteUiProvider,
  normalizeOpenAiReasoning,
  normalizeRequestyModel,
  normalizeRequestyNanoReasoning
} from "../core/provider-registry.js";
import { PromptManager } from "../promptManager.js";

// -----------------------------------------------------------------------------
// Storage keys (secondary-only — never overlap with the primary generator)
// -----------------------------------------------------------------------------

const STORAGE_KEYS = {
  provider: "secondary_note_provider",
  mode: "secondary_note_provider_mode",
  openaiModel: "secondary_openai_model",
  openaiReasoning: "secondary_openai_reasoning",
  geminiModel: "secondary_gemini_model",
  geminiReasoning: "secondary_gemini_reasoning",
  vertexModel: "secondary_vertex_model",
  bedrockModel: "secondary_bedrock_model",
  requestyModel: "secondary_requesty_model",
  requestyNanoReasoning: "secondary_requesty_nano_reasoning",
  promptSlot: "secondary_prompt_slot",
  autoTransfer: "secondary_auto_transfer",
  overwrite: "secondary_overwrite"
};

// Same allow-list as AWSBedrock.js so stale values never reach the backend.
const ALLOWED_BEDROCK_MODEL_KEYS = new Set([
  "haiku-4-5",
  "sonnet-4",
  "sonnet-4-5",
  "sonnet-4-6",
  "opus-4-5",
  "opus-4-6",
  "opus-4-7"
]);

// Mirrors noteGeneration_openai.js model ids.
const OPENAI_MODEL_IDS = {
  gpt5: "gpt-5.1",
  gpt52: "gpt-5.2",
  gpt54: "gpt-5.4",
  gpt55: "gpt-5.5"
};

// Mirrors requesty.js VARIANTS (EU endpoint + EU-region models).
const REQUESTY_EU_CHAT_COMPLETIONS_URL =
  "https://router.eu.requesty.ai/v1/chat/completions";

const REQUESTY_VARIANTS = {
  "claude-opus-4-8": {
    requestyModelId: "bedrock/claude-opus-4-8@eu-west-3",
    pricingModelId: "claude-opus-4-8"
  },
  "claude-sonnet-5": {
    requestyModelId: "vertex/claude-sonnet-5@eu",
    pricingModelId: "claude-sonnet-5"
  },
  "gpt-5.5": {
    requestyModelId: "azure/gpt-5.5@swedencentral",
    pricingModelId: "gpt-5.5"
  },
  "gpt-5-nano": {
    requestyModelId: "azure/gpt-5-nano@swedencentral",
    pricingModelId: "gpt-5-nano",
    reasoningSelector: "nano"
  }
};

// Mirrors GeminiVertex.js model → backend modelVariant mapping.
const VERTEX_MODEL_VARIANTS = {
  "gemini-2.5-pro": "g25",
  "gemini-3.5-flash": "g35-flash",
  "gemini-3.1-flash-lite": "g31-flash-lite"
};

// -----------------------------------------------------------------------------
// i18n
// -----------------------------------------------------------------------------
//
// languageLoaderUsage.js merges the active language's `secondaryNote` object
// with English fallbacks and publishes it on window.__secondaryNoteI18n,
// dispatching "secondary-note-i18n-changed" whenever the language changes.

const I18N_FALLBACK = {
  showButton: "Show secondary note generator",
  hideButton: "Hide secondary note generator",
  title: "Secondary Note Generator",
  sourceLabel: "Source text",
  sourcePlaceholder: "Paste or type source text here...",
  providerLabel: "Provider:",
  modelLabel: "Model:",
  modeLabel: "Mode:",
  reasoningLabel: "Reasoning effort:",
  thinkingLabel: "Thinking level:",
  promptLabel: "Prompt:",
  generateButton: "Generate Note",
  abortButton: "Abort",
  copyButton: "Copy",
  copiedButton: "Copied",
  pushButton: "To Supplementary",
  overwriteLabel: "Overwrite Supplementary Information (off = append below)",
  autoTransferLabel: "Automatically copy result to Supplementary Information",
  outputPlaceholder: "Generated note will appear here...",
  timerLabel: "Note Generation Timer",
  statusGenerating: "Generating…",
  statusCompleted: "Text generation completed!",
  statusFailed: "Generation failed",
  statusAborted: "Note generation aborted.",
  noSourceText: "No source text",
  noPromptSelected: "No prompt selected",
  noOutputToPush: "No note to copy over yet",
  transferred: "Result copied to Supplementary Information."
};

function i18n() {
  const fromLoader = window.__secondaryNoteI18n;
  return fromLoader && typeof fromLoader === "object"
    ? { ...I18N_FALLBACK, ...fromLoader }
    : { ...I18N_FALLBACK };
}

// -----------------------------------------------------------------------------
// Small helpers
// -----------------------------------------------------------------------------

function getApp() {
  return window.__app || {};
}

function readSession(key, fallback = "") {
  try {
    const value = sessionStorage.getItem(key);
    return value == null ? fallback : value;
  } catch (_) {
    return fallback;
  }
}

function writeSession(key, value) {
  try {
    sessionStorage.setItem(key, String(value ?? ""));
  } catch (_) {}
}

function el(id) {
  return document.getElementById(id);
}

function setSelectOptions(selectEl, options) {
  if (!selectEl) return;
  const previous = String(selectEl.value || "").trim();
  selectEl.innerHTML = "";
  (Array.isArray(options) ? options : []).forEach((item) => {
    const optionEl = document.createElement("option");
    optionEl.value = String(item.value ?? "");
    optionEl.textContent = String(item.label ?? item.value ?? "");
    selectEl.appendChild(optionEl);
  });
  if (options.some((item) => String(item.value) === previous)) {
    selectEl.value = previous;
  }
}

function setDisplay(container, show) {
  if (!container) return;
  container.style.display = show ? "inline-flex" : "none";
}

// -----------------------------------------------------------------------------
// Module state — fully independent of the primary generator
// -----------------------------------------------------------------------------

const state = {
  inFlight: false,
  abortController: null,
  timerIntervalId: null,
  timerStartedAt: 0
};

// -----------------------------------------------------------------------------
// Timer / status / usage helpers (secondary-only DOM targets)
// -----------------------------------------------------------------------------

function renderTimerText(ms) {
  const timerEl = el("secondaryNoteTimer");
  if (!timerEl) return;
  timerEl.textContent = `${i18n().timerLabel}: ${formatTime(ms)}`;
}

function startSecondaryTimer() {
  stopSecondaryTimer();
  state.timerStartedAt = Date.now();
  renderTimerText(0);
  state.timerIntervalId = setInterval(() => {
    renderTimerText(Date.now() - state.timerStartedAt);
  }, 1000);
}

function stopSecondaryTimer() {
  if (state.timerIntervalId) {
    clearInterval(state.timerIntervalId);
    state.timerIntervalId = null;
  }
}

function setStatus(text, { isError = false } = {}) {
  const statusEl = el("secondaryNoteStatus");
  if (!statusEl) return;
  statusEl.textContent = text || "";
  statusEl.style.color = isError ? "#b00020" : "#555";
}

function clearSecondaryUsageAndCost() {
  const usageEl = el("secondaryNoteUsageCost");
  if (usageEl) usageEl.textContent = "";
}

function pushSecondaryUsage({ providerKey, modelId, usage, meta = null }) {
  if (!usage) return;
  const usageEl = el("secondaryNoteUsageCost");
  if (!usageEl) return;

  try {
    const app = getApp();
    if (typeof app.formatNoteUsageAndCost === "function") {
      const text = app.formatNoteUsageAndCost({
        providerKey,
        modelId,
        usage,
        meta: meta || undefined
      });
      if (text) usageEl.textContent = text;
    }
  } catch (_) {}
}

// -----------------------------------------------------------------------------
// Persistence + hydration of the secondary selectors
// -----------------------------------------------------------------------------

function getSelections() {
  const provider = normalizeNoteUiProvider(readSession(STORAGE_KEYS.provider, DEFAULTS.noteProvider));
  const openaiModel = (() => {
    const raw = String(readSession(STORAGE_KEYS.openaiModel, DEFAULTS.openaiModel)).trim().toLowerCase();
    return OPENAI_MODEL_IDS[raw] ? raw : DEFAULTS.openaiModel;
  })();
  const geminiModel = (() => {
    const raw = String(readSession(STORAGE_KEYS.geminiModel, DEFAULTS.geminiModel)).trim().toLowerCase();
    return listGeminiApiModelOptions().some((o) => o.value === raw) ? raw : DEFAULTS.geminiModel;
  })();
  const vertexModel = (() => {
    const raw = String(readSession(STORAGE_KEYS.vertexModel, DEFAULTS.vertexModel)).trim().toLowerCase();
    return VERTEX_MODEL_VARIANTS[raw] ? raw : DEFAULTS.vertexModel;
  })();
  const bedrockModel = (() => {
    const raw = String(readSession(STORAGE_KEYS.bedrockModel, DEFAULTS.bedrockModel)).trim();
    return ALLOWED_BEDROCK_MODEL_KEYS.has(raw) ? raw : DEFAULTS.bedrockModel;
  })();

  return {
    provider,
    mode: normalizeNoteMode(readSession(STORAGE_KEYS.mode, DEFAULTS.noteMode)),
    openaiModel,
    openaiReasoning: normalizeOpenAiReasoning(
      readSession(STORAGE_KEYS.openaiReasoning, DEFAULTS.openaiReasoning)
    ),
    geminiModel,
    geminiReasoning: normalizeGeminiReasoning(
      readSession(STORAGE_KEYS.geminiReasoning, DEFAULTS.geminiReasoning),
      geminiModel
    ),
    vertexModel,
    bedrockModel,
    requestyModel: normalizeRequestyModel(readSession(STORAGE_KEYS.requestyModel, DEFAULTS.requestyModel)),
    requestyNanoReasoning: normalizeRequestyNanoReasoning(
      readSession(STORAGE_KEYS.requestyNanoReasoning, DEFAULTS.requestyNanoReasoning)
    ),
    promptSlot: (() => {
      const raw = parseInt(readSession(STORAGE_KEYS.promptSlot, "1"), 10);
      return Number.isFinite(raw) && raw >= 1 && raw <= PromptManager.PROMPT_SLOT_COUNT
        ? String(raw)
        : "1";
    })(),
    autoTransfer: readSession(STORAGE_KEYS.autoTransfer, "0") === "1",
    overwrite: readSession(STORAGE_KEYS.overwrite, "1") === "1"
  };
}

function syncVisibility() {
  const selections = getSelections();
  const visibility = getNoteUiVisibility({
    provider: selections.provider,
    openaiModel: selections.openaiModel,
    requestyModel: selections.requestyModel
  });

  setDisplay(el("secondaryOpenaiModelContainer"), visibility.showOpenAi);
  setDisplay(el("secondaryModeContainer"), visibility.showOpenAiMode);
  setDisplay(el("secondaryOpenaiReasoningContainer"), visibility.showOpenAiReasoning);
  setDisplay(el("secondaryNanoReasoningContainer"), visibility.showRequestyNanoReasoning);
  setDisplay(el("secondaryGeminiModelContainer"), visibility.showGeminiApi);
  setDisplay(el("secondaryGeminiReasoningContainer"), visibility.showGeminiReasoning);
  setDisplay(el("secondaryVertexModelContainer"), visibility.showVertex);
  setDisplay(el("secondaryBedrockModelContainer"), visibility.showBedrock);
  setDisplay(el("secondaryRequestyModelContainer"), visibility.showRequesty);
}

function hydrateSelectors() {
  const selections = getSelections();

  setSelectOptions(el("secondaryProvider"), listNoteUiProviderOptions());
  setSelectOptions(el("secondaryOpenaiModel"), listOpenAiModelOptions());
  setSelectOptions(el("secondaryMode"), listNoteModeOptions());
  setSelectOptions(el("secondaryOpenaiReasoning"), listOpenAiReasoningOptions());
  setSelectOptions(el("secondaryNanoReasoning"), listRequestyNanoReasoningOptions());
  setSelectOptions(el("secondaryGeminiModel"), listGeminiApiModelOptions());
  setSelectOptions(
    el("secondaryGeminiReasoning"),
    listGeminiReasoningOptions(selections.geminiModel)
  );
  setSelectOptions(el("secondaryVertexModel"), listVertexModelOptions());
  setSelectOptions(el("secondaryBedrockModel"), listBedrockModelOptions());
  setSelectOptions(el("secondaryRequestyModel"), listRequestyModelOptions());

  const assign = (id, value) => {
    const select = el(id);
    if (select) select.value = value;
  };

  assign("secondaryProvider", selections.provider);
  assign("secondaryOpenaiModel", selections.openaiModel);
  assign("secondaryMode", selections.mode);
  assign("secondaryOpenaiReasoning", selections.openaiReasoning);
  assign("secondaryNanoReasoning", selections.requestyNanoReasoning);
  assign("secondaryGeminiModel", selections.geminiModel);
  assign("secondaryGeminiReasoning", selections.geminiReasoning);
  assign("secondaryVertexModel", selections.vertexModel);
  assign("secondaryBedrockModel", selections.bedrockModel);
  assign("secondaryRequestyModel", selections.requestyModel);

  const autoTransfer = el("secondaryAutoTransferToggle");
  if (autoTransfer) autoTransfer.checked = selections.autoTransfer;

  const overwriteToggle = el("secondaryOverwriteToggle");
  if (overwriteToggle) overwriteToggle.checked = selections.overwrite;

  hydratePromptOptions(selections.promptSlot);
  syncVisibility();
}

// -----------------------------------------------------------------------------
// Prompt dropdown — SHARED prompt texts, INDEPENDENT selection
// -----------------------------------------------------------------------------
//
// The dropdown only stores the selected slot number. The actual prompt text is
// read from PromptManager at generation time, so edits saved in the main
// Custom Prompt area are always picked up without any duplicate copy here.

function buildPromptOptionLabel(slot) {
  let name = "";
  try {
    const profileId = PromptManager.getPromptProfileId();
    name = String(PromptManager.getSlotDisplayName(String(slot), profileId) || "").trim();
  } catch (_) {}
  return name ? `${slot}. ${name}` : `${slot}.`;
}

function hydratePromptOptions(preferredSlot = null) {
  const select = el("secondaryPromptSelect");
  if (!select) return;

  const current = preferredSlot != null ? String(preferredSlot) : String(select.value || "1");
  const options = [];
  for (let slot = 1; slot <= PromptManager.PROMPT_SLOT_COUNT; slot++) {
    options.push({ value: String(slot), label: buildPromptOptionLabel(slot) });
  }
  setSelectOptions(select, options);
  select.value = options.some((o) => o.value === current) ? current : "1";
}

// -----------------------------------------------------------------------------
// Transfer to Supplementary Information
// -----------------------------------------------------------------------------
//
// The generated note is always wrapped in a single pair of quotation marks
// ("...") — this applies to BOTH the automatic transfer (on successful
// generation) and the manual "To Supplementary" button.
//
// The secondary "Overwrite" toggle (default ON) decides how the quoted note
// is written into the Supplementary Information field:
//
//   ON  — overwrite the field's contents, but preserve the app-managed
//         "Dagens dato er DD.MM.YYYY" header exactly like the app manages it.
//   OFF — leave existing content untouched and append the quoted note as a
//         new paragraph at the bottom.

function isOverwriteEnabled() {
  const toggle = el("secondaryOverwriteToggle");
  // Default ON when the control is missing for any reason.
  return toggle ? !!toggle.checked : true;
}

function transferToSupplementary(noteText) {
  const supplementaryEl = el("supplementaryInfo");
  if (!supplementaryEl) return false;

  const app = getApp();
  const quotedNote = `"${String(noteText || "")}"`;

  if (isOverwriteEnabled()) {
    // Overwrite mode — replace contents, preserving the managed date header.
    let nextValue = quotedNote;
    try {
      const dateEnabled =
        typeof app.getSupplementaryDateEnabled === "function"
          ? !!app.getSupplementaryDateEnabled()
          : false;

      if (typeof app.normalizeSupplementaryDateLine === "function") {
        nextValue = app.normalizeSupplementaryDateLine(quotedNote, { enabled: dateEnabled });
      }
    } catch (_) {}

    supplementaryEl.value = nextValue;
  } else {
    // Append mode — keep existing content untouched, add the quoted note as a
    // new paragraph at the bottom.
    const existing = String(supplementaryEl.value || "");
    if (existing.trim()) {
      supplementaryEl.value = `${existing.replace(/\s+$/, "")}\n\n${quotedNote}`;
    } else {
      supplementaryEl.value = quotedNote;
    }
  }

  try {
    supplementaryEl.dispatchEvent(new Event("input", { bubbles: true }));
  } catch (_) {}
  return true;
}

// Manual push — user-initiated copy of the current secondary output into the
// Supplementary Information field (uses the same quoting + overwrite/append
// rules as the automatic transfer).
function pushToSupplementary() {
  const strings = i18n();
  const outputField = el("secondaryGeneratedNote");
  if (!outputField) return;

  const text = String(outputField.value || "");
  if (!text.trim()) {
    setStatus(strings.noOutputToPush, { isError: true });
    return;
  }

  if (transferToSupplementary(text)) {
    setStatus(strings.transferred);
  }
}

// -----------------------------------------------------------------------------
// Busy-state handling (secondary controls only)
// -----------------------------------------------------------------------------

const LOCKABLE_CONTROL_IDS = [
  "secondaryProvider",
  "secondaryOpenaiModel",
  "secondaryMode",
  "secondaryOpenaiReasoning",
  "secondaryNanoReasoning",
  "secondaryGeminiModel",
  "secondaryGeminiReasoning",
  "secondaryVertexModel",
  "secondaryBedrockModel",
  "secondaryRequestyModel",
  "secondaryPromptSelect"
];

function setBusy(busy) {
  state.inFlight = busy;

  const generateButton = el("secondaryGenerateButton");
  if (generateButton) generateButton.disabled = busy;

  const abortButton = el("secondaryAbortButton");
  if (abortButton) abortButton.disabled = !busy;

  LOCKABLE_CONTROL_IDS.forEach((id) => {
    const control = el(id);
    if (control) control.disabled = busy;
  });
}

// -----------------------------------------------------------------------------
// Generation — one parameterized request function per provider, mirroring the
// exact request shapes of the primary provider modules (same endpoints, same
// credential sessionStorage keys, same usage payloads).
// -----------------------------------------------------------------------------

function requireSecondarySessionKey(storageKey, alertText) {
  const value = readSession(storageKey, "").trim();
  if (value) return value;
  alert(alertText || "No API key available for note generation.");
  return "";
}

async function generateOpenAi({ selections, sourceText, promptText, outputField, signal }) {
  const apiKey = requireSecondarySessionKey(
    "openai_api_key",
    "No API key available for note generation."
  );
  if (!apiKey) return { ok: false, silent: true };

  const modelId = OPENAI_MODEL_IDS[selections.openaiModel] || OPENAI_MODEL_IDS.gpt5;
  const streaming = selections.mode !== "non-streaming";
  const reasoningLevel = selections.openaiReasoning;

  const requestBody = {
    model: modelId,
    input: [
      {
        role: "system",
        content: [{ type: "input_text", text: buildStandardNotePrompt(promptText) }]
      },
      {
        role: "user",
        content: [{ type: "input_text", text: sourceText }]
      }
    ],
    text: { verbosity: "medium" }
  };
  if (streaming) requestBody.stream = true;
  if (reasoningLevel && reasoningLevel !== "none") {
    requestBody.reasoning = { effort: reasoningLevel };
  }

  const resp = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify(requestBody),
    signal
  });

  if (!streaming) {
    if (!resp.ok) {
      const errText = await resp.text().catch(() => "");
      throw new Error(`OpenAI error ${resp.status}: ${errText}`);
    }
    const json = await resp.json();
    outputField.value = extractResponsesOutputText(json) || "";
    pushSecondaryUsage({
      providerKey: "openai",
      modelId,
      usage: json?.usage ?? null,
      meta: { reasoningTokens: json?.usage?.output_tokens_details?.reasoning_tokens ?? 0 }
    });
  } else {
    await streamResponsesSse(resp, {
      signal,
      errorLabel: "OpenAI",
      onDelta: (textChunk) => {
        outputField.value += textChunk;
      },
      onDone: (finalEvent) => {
        const usage = finalEvent?.response?.usage ?? finalEvent?.usage ?? null;
        pushSecondaryUsage({
          providerKey: "openai",
          modelId,
          usage,
          meta: { reasoningTokens: usage?.output_tokens_details?.reasoning_tokens ?? 0 }
        });
      },
      onError: (error) => {
        throw error;
      }
    });
  }

  return { ok: true };
}

async function generateLemonfox({ sourceText, promptText, outputField, signal }) {
  const apiKey = requireSecondarySessionKey(
    "lemonfox_api_key",
    "No API key available for note generation."
  );
  if (!apiKey) return { ok: false, silent: true };

  const resp = await fetch("https://eu-api.lemonfox.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "llama-70b-chat",
      messages: [
        { role: "system", content: buildStandardNotePrompt(promptText) },
        { role: "user", content: sourceText }
      ],
      stream: true
    }),
    signal
  });

  await streamChatCompletionsSse(resp, {
    signal,
    errorLabel: "Lemonfox",
    onDelta: (textChunk) => {
      outputField.value += textChunk;
    },
    onDone: () => {},
    onError: (error) => {
      throw error;
    }
  });

  return { ok: true };
}

async function generateMistral({ sourceText, promptText, outputField, signal }) {
  const apiKey = requireSecondarySessionKey(
    "mistral_api_key",
    "No API key available for note generation."
  );
  if (!apiKey) return { ok: false, silent: true };

  const resp = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "mistral-large-latest",
      messages: [
        { role: "system", content: buildStandardNotePrompt(promptText) },
        { role: "user", content: sourceText }
      ],
      stream: true
    }),
    signal
  });

  await streamChatCompletionsSse(resp, {
    signal,
    errorLabel: "Mistral",
    captureUsage: true,
    onDelta: (textChunk) => {
      outputField.value += textChunk;
    },
    onDone: (finalEvent) => {
      pushSecondaryUsage({
        providerKey: "mistral",
        modelId: "mistral-large-latest",
        usage: finalEvent?.usage ?? null
      });
    },
    onError: (error) => {
      throw error;
    }
  });

  return { ok: true };
}

function buildSecondaryGeminiPrompt({ promptText, sourceText }) {
  const baseInstruction = [
    "Do not use bold text. Do not use asterisks (*) or Markdown formatting anywhere in the output.",
    "All headings should be plain text with a colon."
  ].join("\n");

  return [promptText || "", baseInstruction, `TRANSCRIPTION:\n${sourceText}`]
    .filter(Boolean)
    .join("\n\n");
}

async function generateGeminiApi({ selections, sourceText, promptText, outputField, signal, controller }) {
  const apiKey = requireSecondarySessionKey(
    "gemini_api_key",
    "No Gemini API key available for note generation."
  );
  if (!apiKey) return { ok: false, silent: true };

  const modelId = selections.geminiModel;
  const thinkingLevel = normalizeGeminiReasoning(selections.geminiReasoning, modelId);
  const finalPromptText = buildSecondaryGeminiPrompt({ promptText, sourceText });

  const makeUrl = (apiVersion) =>
    `https://generativelanguage.googleapis.com/${apiVersion}/models/${modelId}:streamGenerateContent?alt=sse&key=${encodeURIComponent(apiKey)}`;

  const requestBody = JSON.stringify({
    contents: [{ parts: [{ text: finalPromptText }] }],
    generationConfig: {
      thinkingConfig: { thinkingLevel }
    }
  });

  const GEMINI_TIMEOUT_MS = 120_000;
  const timeoutId = setTimeout(() => {
    try {
      controller.abort();
    } catch (_) {}
  }, GEMINI_TIMEOUT_MS);

  try {
    let response = await fetch(makeUrl("v1beta"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: requestBody,
      signal
    });

    if (response.status === 404) {
      response = await fetch(makeUrl("v1alpha"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: requestBody,
        signal
      });
    }

    if (!response.ok || !response.body) {
      const text = await response.text().catch(() => "");
      throw new Error("Gemini stream HTTP " + response.status + ": " + text);
    }

    let finalUsage = null;
    await streamGeminiSse(response.body, {
      signal,
      onDelta: (textChunk) => {
        outputField.value += textChunk;
      },
      onDone: (usage) => {
        finalUsage = usage || null;
      },
      onError: (error) => {
        throw error;
      }
    });

    pushSecondaryUsage({
      providerKey: "gemini3",
      modelId,
      usage: finalUsage
    });
  } finally {
    clearTimeout(timeoutId);
  }

  return { ok: true };
}

async function generateVertex({ selections, sourceText, promptText, outputField, signal }) {
  const backendUrl = readSession("vertex_backend_url", "").trim();
  const backendSecret = readSession("vertex_backend_secret", "").trim();
  if (!backendUrl || !backendSecret) {
    alert("Vertex backend URL/secret is missing. Open the Vertex setup guide and configure both values first.");
    return { ok: false, silent: true };
  }

  const modelId = selections.vertexModel;

  const resp = await fetch(backendUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Proxy-Secret": backendSecret
    },
    body: JSON.stringify({
      transcription: sourceText,
      customPrompt: promptText,
      provider: "gemini",
      modelVariant: VERTEX_MODEL_VARIANTS[modelId] || "g25"
    }),
    signal
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`Vertex backend error ${resp.status}: ${text}`);
  }

  const data = await resp.json().catch(() => ({}));
  const noteText =
    (Array.isArray(data?.candidates) &&
      data.candidates
        .flatMap((candidate) =>
          Array.isArray(candidate?.content?.parts) ? candidate.content.parts : []
        )
        .map((part) => (typeof part?.text === "string" ? part.text : ""))
        .join("")
        .trim()) ||
    data?.noteText ||
    data?.text ||
    data?.output ||
    "";

  outputField.value = noteText || "[No text returned from Vertex backend]";

  pushSecondaryUsage({
    providerKey: "gemini3-vertex",
    modelId: data?.modelId || data?.model || modelId,
    usage: data?.usage || null
  });

  return { ok: true, noteText: outputField.value };
}

async function generateBedrock({ selections, sourceText, promptText, outputField, signal }) {
  const backendUrl = readSession("bedrock_backend_url", "").trim();
  const backendSecret = readSession("bedrock_backend_secret", "").trim();

  if (!backendUrl) {
    alert(
      "No Bedrock backend URL configured.\n\n" +
        "Please paste your Bedrock proxy URL on the start page before using AWS Bedrock."
    );
    return { ok: false, silent: true };
  }
  if (!backendSecret) {
    alert(
      "No Bedrock backend secret configured.\n\n" +
        "Please paste your backend secret (X-Proxy-Secret) on the start page before using AWS Bedrock."
    );
    return { ok: false, silent: true };
  }

  const modelKey = ALLOWED_BEDROCK_MODEL_KEYS.has(selections.bedrockModel)
    ? selections.bedrockModel
    : "";

  const resp = await fetch(backendUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Proxy-Secret": backendSecret
    },
    body: JSON.stringify({
      transcription: sourceText,
      customPrompt: promptText,
      modelKey: modelKey || undefined
    }),
    signal
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error("Bedrock backend HTTP " + resp.status + (text ? ": " + text : ""));
  }

  const data = await resp.json().catch(() => ({}));
  const noteText =
    (data && (data.noteText || data.text || data.output || data.note)) ||
    "[No text returned from Bedrock backend]";
  const effectiveModelKey =
    (data && (data.modelKey || data.model)) || modelKey || "backend_default";

  outputField.value = noteText;

  const usage = data && data.usage;
  if (usage) {
    pushSecondaryUsage({
      providerKey: "aws-bedrock",
      modelId: effectiveModelKey,
      usage: {
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens
      }
    });
  }

  return { ok: true, noteText };
}

async function generateRequesty({ selections, sourceText, promptText, outputField, signal }) {
  const apiKey = requireSecondarySessionKey(
    "requesty_api_key",
    "No Requesty API key available.\n\n" +
      "Please paste your Requesty API key on the start page before using the Requesty provider."
  );
  if (!apiKey) return { ok: false, silent: true };

  const variantConfig = REQUESTY_VARIANTS[selections.requestyModel] || REQUESTY_VARIANTS["claude-opus-4-8"];
  const streaming = selections.mode !== "non-streaming";

  const reasoningLevel =
    variantConfig.reasoningSelector === "nano"
      ? selections.requestyNanoReasoning
      : selections.openaiReasoning;

  const requestBody = {
    model: variantConfig.requestyModelId,
    messages: [
      { role: "system", content: buildStandardNotePrompt(promptText) },
      { role: "user", content: sourceText }
    ]
  };
  if (streaming) {
    requestBody.stream = true;
    requestBody.stream_options = { include_usage: true };
  }
  if (reasoningLevel && reasoningLevel !== "none") {
    requestBody.reasoning_effort = reasoningLevel;
  }

  const pushUsage = (usage) => {
    if (!usage) return;
    pushSecondaryUsage({
      providerKey: "requesty",
      modelId: variantConfig.pricingModelId,
      usage,
      meta: {
        reasoningTokens: usage?.completion_tokens_details?.reasoning_tokens ?? 0
      }
    });
  };

  const resp = await fetch(REQUESTY_EU_CHAT_COMPLETIONS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify(requestBody),
    signal
  });

  if (!streaming) {
    if (!resp.ok) {
      const errText = await resp.text().catch(() => "");
      throw new Error(`Requesty error ${resp.status}: ${errText}`);
    }
    const json = await resp.json();
    pushUsage(json?.usage ?? null);
    outputField.value = json?.choices?.[0]?.message?.content || "";
  } else {
    await streamChatCompletionsSse(resp, {
      signal,
      errorLabel: "Requesty",
      captureUsage: true,
      onDelta: (textChunk) => {
        outputField.value += textChunk;
      },
      onDone: (finalEvent) => {
        pushUsage(finalEvent?.usage ?? null);
      },
      onError: (error) => {
        throw error;
      }
    });
  }

  return { ok: true };
}

// -----------------------------------------------------------------------------
// Orchestration
// -----------------------------------------------------------------------------

async function generateSecondaryNote() {
  if (state.inFlight) return;

  const strings = i18n();
  const sourceField = el("secondarySourceText");
  const outputField = el("secondaryGeneratedNote");
  if (!sourceField || !outputField) return;

  const sourceText = String(sourceField.value || "").trim();
  if (!sourceText) {
    setStatus(strings.noSourceText, { isError: true });
    return;
  }

  const promptSelect = el("secondaryPromptSelect");
  const promptSlot = String(promptSelect?.value || "").trim();
  if (!promptSlot) {
    setStatus(strings.noPromptSelected, { isError: true });
    return;
  }

  // Always read the LATEST saved text for the selected slot from the shared
  // prompt storage — never a cached/duplicated copy.
  const promptText = String(PromptManager.getPrompt(promptSlot) || "");

  const selections = getSelections();
  const controller = new AbortController();
  state.abortController = controller;

  outputField.value = "";
  clearSecondaryUsageAndCost();
  setStatus(strings.statusGenerating);
  setBusy(true);
  startSecondaryTimer();

  const context = {
    selections,
    sourceText,
    promptText,
    outputField,
    signal: controller.signal,
    controller
  };

  try {
    let result;
    switch (selections.provider) {
      case "openai":
        result = await generateOpenAi(context);
        break;
      case "lemonfox":
        result = await generateLemonfox(context);
        break;
      case "mistral":
        result = await generateMistral(context);
        break;
      case "gemini3":
        result = await generateGeminiApi(context);
        break;
      case "gemini3-vertex":
        result = await generateVertex(context);
        break;
      case "aws-bedrock":
        result = await generateBedrock(context);
        break;
      case "requesty":
        result = await generateRequesty(context);
        break;
      default:
        result = await generateBedrock(context);
        break;
    }

    stopSecondaryTimer();

    if (!result || !result.ok) {
      // Missing key/config — alert already shown; reset quietly.
      renderTimerText(0);
      setStatus("");
      return;
    }

    setStatus(strings.statusCompleted);

    // Automatic transfer to Supplementary Information — ONLY after a
    // successful, non-empty generation, and only when the toggle is on.
    const autoTransferEnabled = !!el("secondaryAutoTransferToggle")?.checked;
    const generatedText = String(outputField.value || "");
    if (autoTransferEnabled && generatedText.trim()) {
      if (transferToSupplementary(generatedText)) {
        setStatus(`${strings.statusCompleted} ${strings.transferred}`);
      }
    }
  } catch (error) {
    stopSecondaryTimer();

    if (error?.name === "AbortError") {
      setStatus(strings.statusAborted);
      if (!outputField.value.trim()) {
        outputField.value = strings.statusAborted;
      }
      return;
    }

    console.error("[secondary-note] generation error:", error);
    setStatus(`${strings.statusFailed}: ${String(error?.message || error)}`, { isError: true });
    if (!outputField.value.trim()) {
      outputField.value = "Error generating note: " + String(error);
    }
  } finally {
    state.abortController = null;
    setBusy(false);
  }
}

function abortSecondaryNote() {
  const controller = state.abortController;
  if (controller) {
    try {
      controller.abort();
    } catch (_) {}
  }
}

// -----------------------------------------------------------------------------
// Copy button
// -----------------------------------------------------------------------------

async function copySecondaryNote() {
  const outputField = el("secondaryGeneratedNote");
  const button = el("secondaryCopyNoteButton");
  if (!outputField) return;

  const text = String(outputField.value || "");
  const flashCopied = () => {
    if (!button) return;
    const strings = i18n();
    button.textContent = strings.copiedButton;
    setTimeout(() => {
      button.textContent = i18n().copyButton;
    }, 1200);
  };

  try {
    await navigator.clipboard.writeText(text);
    flashCopied();
  } catch (_) {
    try {
      outputField.focus();
      outputField.select();
      document.execCommand("copy");
      outputField.setSelectionRange(0, 0);
      flashCopied();
    } catch (err) {
      console.warn("[secondary-note] copy failed:", err);
    }
  }
}

// -----------------------------------------------------------------------------
// Show / hide toggle (Redactor-style: hiding never clears any state)
// -----------------------------------------------------------------------------

function isSecondaryOpen() {
  const pane = el("secondaryNotePane");
  return !!pane && !pane.hidden;
}

function setSecondaryOpen(isOpen) {
  const layout = el("transcriptSecondaryLayout");
  const pane = el("secondaryNotePane");
  const button = el("toggleSecondaryNoteButton");
  if (!layout || !pane || !button) return;

  layout.classList.toggle("secondary-open", !!isOpen);
  pane.hidden = !isOpen;
  pane.setAttribute("aria-hidden", isOpen ? "false" : "true");
  button.setAttribute("aria-expanded", isOpen ? "true" : "false");
  refreshToggleButtonLabel();
}

function refreshToggleButtonLabel() {
  const button = el("toggleSecondaryNoteButton");
  if (!button) return;
  const strings = i18n();
  button.textContent = isSecondaryOpen() ? strings.hideButton : strings.showButton;
}

// -----------------------------------------------------------------------------
// Wiring
// -----------------------------------------------------------------------------

function bindPersistedSelect(id, storageKey, { normalize = (v) => v, onChange = null } = {}) {
  const select = el(id);
  if (!select) return;
  select.addEventListener("change", () => {
    const value = normalize(String(select.value || ""));
    writeSession(storageKey, value);
    if (select.value !== value) select.value = value;
    if (typeof onChange === "function") onChange(value);
  });
}

function initSecondaryNoteModule() {
  const pane = el("secondaryNotePane");
  const toggleButton = el("toggleSecondaryNoteButton");
  if (!pane || !toggleButton) return;

  hydrateSelectors();
  refreshToggleButtonLabel();
  renderTimerText(0);
  setBusy(false);

  toggleButton.addEventListener("click", () => {
    setSecondaryOpen(!isSecondaryOpen());
  });

  bindPersistedSelect("secondaryProvider", STORAGE_KEYS.provider, {
    normalize: normalizeNoteUiProvider,
    onChange: () => {
      clearSecondaryUsageAndCost();
      syncVisibility();
    }
  });
  bindPersistedSelect("secondaryOpenaiModel", STORAGE_KEYS.openaiModel, {
    normalize: (v) => (OPENAI_MODEL_IDS[v] ? v : DEFAULTS.openaiModel),
    onChange: () => {
      clearSecondaryUsageAndCost();
      syncVisibility();
    }
  });
  bindPersistedSelect("secondaryMode", STORAGE_KEYS.mode, {
    normalize: normalizeNoteMode,
    onChange: () => clearSecondaryUsageAndCost()
  });
  bindPersistedSelect("secondaryOpenaiReasoning", STORAGE_KEYS.openaiReasoning, {
    normalize: normalizeOpenAiReasoning
  });
  bindPersistedSelect("secondaryNanoReasoning", STORAGE_KEYS.requestyNanoReasoning, {
    normalize: normalizeRequestyNanoReasoning
  });
  bindPersistedSelect("secondaryGeminiModel", STORAGE_KEYS.geminiModel, {
    onChange: (modelId) => {
      clearSecondaryUsageAndCost();
      // Flash models support "minimal"; refresh the thinking-level options
      // for the newly selected model, keeping the value when still valid.
      const reasoningSelect = el("secondaryGeminiReasoning");
      const previous = String(reasoningSelect?.value || "");
      setSelectOptions(reasoningSelect, listGeminiReasoningOptions(modelId));
      const normalized = normalizeGeminiReasoning(previous, modelId);
      if (reasoningSelect) reasoningSelect.value = normalized;
      writeSession(STORAGE_KEYS.geminiReasoning, normalized);
    }
  });
  bindPersistedSelect("secondaryGeminiReasoning", STORAGE_KEYS.geminiReasoning, {
    normalize: (v) => normalizeGeminiReasoning(v, getSelections().geminiModel)
  });
  bindPersistedSelect("secondaryVertexModel", STORAGE_KEYS.vertexModel, {
    normalize: (v) => (VERTEX_MODEL_VARIANTS[v] ? v : DEFAULTS.vertexModel),
    onChange: () => clearSecondaryUsageAndCost()
  });
  bindPersistedSelect("secondaryBedrockModel", STORAGE_KEYS.bedrockModel, {
    normalize: (v) => (ALLOWED_BEDROCK_MODEL_KEYS.has(v) ? v : DEFAULTS.bedrockModel),
    onChange: () => clearSecondaryUsageAndCost()
  });
  bindPersistedSelect("secondaryRequestyModel", STORAGE_KEYS.requestyModel, {
    normalize: normalizeRequestyModel,
    onChange: () => {
      clearSecondaryUsageAndCost();
      syncVisibility();
    }
  });
  bindPersistedSelect("secondaryPromptSelect", STORAGE_KEYS.promptSlot);

  const autoTransfer = el("secondaryAutoTransferToggle");
  if (autoTransfer) {
    autoTransfer.addEventListener("change", () => {
      writeSession(STORAGE_KEYS.autoTransfer, autoTransfer.checked ? "1" : "0");
    });
  }

  const overwriteToggle = el("secondaryOverwriteToggle");
  if (overwriteToggle) {
    overwriteToggle.addEventListener("change", () => {
      writeSession(STORAGE_KEYS.overwrite, overwriteToggle.checked ? "1" : "0");
    });
  }

  const generateButton = el("secondaryGenerateButton");
  if (generateButton) generateButton.addEventListener("click", generateSecondaryNote);

  const abortButton = el("secondaryAbortButton");
  if (abortButton) abortButton.addEventListener("click", abortSecondaryNote);

  const copyButton = el("secondaryCopyNoteButton");
  if (copyButton) copyButton.addEventListener("click", copySecondaryNote);

  const pushButton = el("secondaryPushToSupplementaryButton");
  if (pushButton) pushButton.addEventListener("click", pushToSupplementary);

  // Shared prompt storage: refresh slot labels when names change; the prompt
  // TEXT is always read live at generation time, so value changes need no
  // action here — but keeping labels current avoids stale dropdown names.
  window.addEventListener("prompt-slot-names-changed", () => hydratePromptOptions());
  window.addEventListener("prompt-slots-reordered", () => hydratePromptOptions());
  window.addEventListener("prompt-slots-imported", () => hydratePromptOptions());
  window.addEventListener("prompt-profile-changed", () => hydratePromptOptions());

  // Language switches: refresh dynamic labels owned by this module.
  window.addEventListener("secondary-note-i18n-changed", () => {
    refreshToggleButtonLabel();
    if (!state.inFlight) renderTimerText(0);
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initSecondaryNoteModule, { once: true });
} else {
  initSecondaryNoteModule();
}
