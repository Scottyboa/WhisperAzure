// OpenAINoteModels.js
// Consolidated OpenAI note-generation module for GPT-4-latest, GPT-5.1, GPT-5.2, and GPT-5.4.
// Public contract intentionally stays the same: export { initNoteGeneration }.
//
// Assumptions carried forward from the existing modules:
// - Uses sessionStorage.note_provider as the canonical OpenAI note-provider key.
// - Supports both legacy dual-file keys (gpt5 / gpt5-ns / gpt52 / gpt52-ns)
//   and the combined gpt54 + note_mode pattern.
// - Reads the same DOM ids already used by the current note-generation modules.

const MODEL_CONFIGS = {
  gpt4: {
    providerKey: "gpt4",
    modelId: "chatgpt-4o-latest",
    defaultMode: "streaming",
    supportsReasoning: false,
    supplementaryPrefix: 'Tilleggsopplysninger(kun som kontekst)"',
    supplementarySuffix: '"\n\n',
    baseInstruction: `
Do not use bold text. Do not use asterisks (*) or Markdown formatting anywhere in the output.
All headings should be plain text with a colon, like 'Bakgrunn:'.`.trim(),
  },
  gpt5: {
    providerKey: "gpt5",
    modelId: "gpt-5.1",
    defaultMode: "streaming",
    supportsReasoning: true,
    supplementaryPrefix: 'Tilleggsopplysninger(brukes som kontekst):"',
    supplementarySuffix: '"\n\n',
    baseInstruction: `
Do not use bold text. Do not use asterisks (*) or Markdown formatting anywhere in the output.
All headings should be plain text with a colon.`.trim(),
  },
  gpt52: {
    providerKey: "gpt52",
    modelId: "gpt-5.2",
    defaultMode: "streaming",
    supportsReasoning: true,
    supplementaryPrefix: 'Tilleggsopplysninger(brukes som kontekst):"',
    supplementarySuffix: '"\n\n',
    baseInstruction: `
Do not use bold text. Do not use asterisks (*) or Markdown formatting anywhere in the output.
All headings should be plain text with a colon.`.trim(),
  },
  gpt54: {
    providerKey: "gpt54",
    modelId: "gpt-5.4",
    defaultMode: "streaming",
    supportsReasoning: true,
    supplementaryPrefix: 'Tilleggsopplysninger(brukes som kontekst):"',
    supplementarySuffix: '"\n\n',
    baseInstruction: `
Do not use bold text. Do not use asterisks (*) or Markdown formatting anywhere in the output.
All headings should be plain text with a colon.`.trim(),
  },
};

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash.toString();
}

function arrayBufferToBase64(buffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToArrayBuffer(base64) {
  const binary = window.atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function autoResize(textarea) {
  textarea.style.height = "auto";
  textarea.style.height = textarea.scrollHeight + "px";
}

function formatTime(ms) {
  const totalSec = Math.floor(ms / 1000);
  if (totalSec < 60) {
    return totalSec + " sec";
  }
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  return minutes + " min" + (seconds > 0 ? " " + seconds + " sec" : "");
}

function extractResponseText(json) {
  if (!json || typeof json !== "object") return "";

  if (typeof json.output_text === "string") {
    return json.output_text;
  }

  if (Array.isArray(json.output)) {
    try {
      return json.output
        .flatMap(item => (Array.isArray(item.content) ? item.content : []))
        .filter(block => block && (block.type === "output_text" || block.type === "text"))
        .map(block => block.text || "")
        .join("");
    } catch (_) {}
  }

  if (Array.isArray(json.content)) {
    try {
      return json.content
        .filter(block => block && (block.type === "output_text" || block.type === "text"))
        .map(block => block.text || "")
        .join("");
    } catch (_) {}
  }

  return "";
}

function getRawProviderKey() {
  const stored = (sessionStorage.getItem("note_provider") || "").trim().toLowerCase();
  if (stored) return stored;

  const openAiModel = (document.getElementById("openaiModel")?.value || "").trim().toLowerCase();
  if (openAiModel && MODEL_CONFIGS[openAiModel]) return openAiModel;

  return "gpt5";
}

function resolveModelConfig() {
  const rawProviderKey = getRawProviderKey();
  const baseKey = rawProviderKey.replace(/-ns$/, "");
  const selectedOpenAiModel = (document.getElementById("openaiModel")?.value || "").trim().toLowerCase();

  let resolvedKey = baseKey;
  if (!MODEL_CONFIGS[resolvedKey] && MODEL_CONFIGS[selectedOpenAiModel]) {
    resolvedKey = selectedOpenAiModel;
  }
  if (!MODEL_CONFIGS[resolvedKey]) {
    resolvedKey = "gpt5";
  }

  return {
    rawProviderKey,
    baseProviderKey: baseKey,
    config: MODEL_CONFIGS[resolvedKey],
  };
}

function getSelectedMode(rawProviderKey, config) {
  if (!config) return "streaming";
  if (config.providerKey === "gpt4") return "streaming";

  if (rawProviderKey.endsWith("-ns")) {
    return "non-streaming";
  }

  const modeSelect = document.getElementById("noteProviderMode");
  const uiMode = (modeSelect?.value || sessionStorage.getItem("note_mode") || config.defaultMode || "streaming")
    .toLowerCase();

  return uiMode === "non-streaming" ? "non-streaming" : "streaming";
}

function getReasoningLevel(config) {
  if (!config?.supportsReasoning) return null;
  const reasoningSelect = document.getElementById("gpt5Reasoning");
  return reasoningSelect ? reasoningSelect.value : "low";
}

function buildMessages(finalPromptText, supplementaryWrapped, transcriptionText) {
  return [
    { role: "system", content: finalPromptText },
    { role: "user", content: supplementaryWrapped + transcriptionText },
  ];
}

function buildOpenAiRequest({ config, messages, mode, reasoningLevel }) {
  const requestBody = {
    model: config.modelId,
    input: messages.map(m => ({
      role: m.role,
      content: [{ type: "input_text", text: m.content }],
    })),
    text: {
      verbosity: "medium",
    },
  };

  if (mode === "streaming") {
    requestBody.stream = true;
  }

  if (config.supportsReasoning && reasoningLevel && reasoningLevel !== "none") {
    requestBody.reasoning = {
      effort: reasoningLevel,
    };
  }

  return requestBody;
}

function pushOpenAiUsageToUi(usage, { modelId, providerKey }) {
  if (!usage) return;

  try {
    console.log(
      "[OpenAI token usage]",
      "model=", modelId,
      "input=", usage.input_tokens,
      "output=", usage.output_tokens,
      "total=", usage.total_tokens,
      "reasoning=", usage.output_tokens_details?.reasoning_tokens ?? 0
    );

    const payload = (typeof window.__app?.normalizeNoteUsage === "function")
      ? window.__app.normalizeNoteUsage({
          providerKey,
          modelId,
          usage,
          meta: { reasoningTokens: usage.output_tokens_details?.reasoning_tokens ?? 0 },
        })
      : {
          providerKey,
          modelId,
          inputTokens: usage.input_tokens ?? null,
          outputTokens: usage.output_tokens ?? null,
          totalTokens: usage.total_tokens ?? null,
          estimatedUsd: null,
          meta: { reasoningTokens: usage.output_tokens_details?.reasoning_tokens ?? 0 },
        };

    window.__app?.setNoteUsageAndCost?.(payload);
  } catch (_) {}
}

function buildSharedNoteContext({ rawProviderKey, config }) {
  try {
    window.__app?.clearNoteUsageAndCost?.();
  } catch (_) {}

  const transcriptionElem = document.getElementById("transcription");
  if (!transcriptionElem) {
    alert("No transcription text available.");
    return null;
  }

  const transcriptionText = transcriptionElem.value.trim();
  if (!transcriptionText) {
    alert("No transcription text available.");
    return null;
  }

  const customPromptTextarea = document.getElementById("customPrompt");
  const promptText = customPromptTextarea ? customPromptTextarea.value : "";

  const supplementaryElem = document.getElementById("supplementaryInfo");
  const supplementaryRaw = supplementaryElem ? supplementaryElem.value.trim() : "";
  const supplementaryWrapped = supplementaryRaw
    ? `${config.supplementaryPrefix}${supplementaryRaw}${config.supplementarySuffix}`
    : "";

  const generatedNoteField = document.getElementById("generatedNote");
  if (!generatedNoteField) return null;

  generatedNoteField.value = "";

  const noteTimerElement = document.getElementById("noteTimer");
  const noteStartTime = Date.now();
  if (noteTimerElement) {
    noteTimerElement.innerText = "Note Generation Timer: 0 sec";
  }

  const noteTimerInterval = setInterval(() => {
    if (noteTimerElement) {
      noteTimerElement.innerText = "Note Generation Timer: " + formatTime(Date.now() - noteStartTime);
    }
  }, 1000);

  const apiKey = sessionStorage.getItem("openai_api_key");
  if (!apiKey) {
    alert("No API key available for note generation.");
    clearInterval(noteTimerInterval);
    return null;
  }

  const finalPromptText = promptText + "\n\n" + config.baseInstruction;
  const messages = buildMessages(finalPromptText, supplementaryWrapped, transcriptionText);
  const reasoningLevel = getReasoningLevel(config);
  const mode = getSelectedMode(rawProviderKey, config);

  return {
    apiKey,
    generatedNoteField,
    messages,
    mode,
    noteTimerElement,
    noteTimerInterval,
    providerKey: rawProviderKey || config.providerKey,
    reasoningLevel,
  };
}

function finishSuccess(noteTimerInterval, noteTimerElement) {
  clearInterval(noteTimerInterval);
  if (noteTimerElement) {
    noteTimerElement.innerText = "Text generation completed!";
  }
}

function finishError(error, generatedNoteField, noteTimerInterval, noteTimerElement) {
  clearInterval(noteTimerInterval);
  if (generatedNoteField) {
    generatedNoteField.value = "Error generating note: " + error;
  }
  if (noteTimerElement) {
    noteTimerElement.innerText = "";
  }
}

async function generateNoteStreaming(ctx, config) {
  const {
    apiKey,
    generatedNoteField,
    messages,
    noteTimerElement,
    noteTimerInterval,
    providerKey,
    reasoningLevel,
  } = ctx;

  try {
    const requestBody = buildOpenAiRequest({
      config,
      messages,
      mode: "streaming",
      reasoningLevel,
    });

    const resp = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    await streamOpenAIResponse(resp, {
      onDelta: (textChunk) => {
        generatedNoteField.value += textChunk;
      },
      onDone: (finalEvent) => {
        const usage = finalEvent?.response?.usage ?? finalEvent?.usage;
        pushOpenAiUsageToUi(usage, {
          modelId: config.modelId,
          providerKey,
        });
      },
    });

    finishSuccess(noteTimerInterval, noteTimerElement);
  } catch (error) {
    finishError(error, generatedNoteField, noteTimerInterval, noteTimerElement);
  }
}

async function generateNoteNonStreaming(ctx, config) {
  const {
    apiKey,
    generatedNoteField,
    messages,
    noteTimerElement,
    noteTimerInterval,
    providerKey,
    reasoningLevel,
  } = ctx;

  try {
    const requestBody = buildOpenAiRequest({
      config,
      messages,
      mode: "non-streaming",
      reasoningLevel,
    });

    const resp = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => "");
      throw new Error(`OpenAI error ${resp.status}: ${errText}`);
    }

    const json = await resp.json();
    generatedNoteField.value = extractResponseText(json);

    pushOpenAiUsageToUi(json?.usage, {
      modelId: config.modelId,
      providerKey,
    });

    finishSuccess(noteTimerInterval, noteTimerElement);
  } catch (error) {
    finishError(error, generatedNoteField, noteTimerInterval, noteTimerElement);
  }
}

async function generateNote() {
  const resolved = resolveModelConfig();
  const ctx = buildSharedNoteContext(resolved);
  if (!ctx) return;

  if (ctx.mode === "non-streaming") {
    await generateNoteNonStreaming(ctx, resolved.config);
    return;
  }

  await generateNoteStreaming(ctx, resolved.config);
}

async function streamOpenAIResponse(resp, {
  onDelta = () => {},
  onDone = () => {},
  onError = (e) => { throw e; },
} = {}) {
  if (!resp.ok || !resp.body) {
    const text = await resp.text().catch(() => "");
    throw new Error(`OpenAI error ${resp.status}: ${text}`);
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let lastEventPayload = null;

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n\n");
      buffer = parts.pop() ?? "";

      for (const part of parts) {
        const lines = part.split("\n");
        let dataStr = null;

        for (const line of lines) {
          if (line.startsWith("data:")) {
            dataStr = line.slice(5).trim();
          }
        }

        if (!dataStr) continue;

        if (dataStr === "[DONE]") {
          onDone(lastEventPayload);
          return;
        }

        let payload;
        try {
          payload = JSON.parse(dataStr);
        } catch {
          continue;
        }

        if (payload && typeof payload === "object") {
          if (payload.response && typeof payload.response === "object") {
            lastEventPayload = payload;
          } else if (payload.type === "response.completed") {
            lastEventPayload = payload;
          }
        }

        if (payload.type === "response.output_text.delta" && typeof payload.delta === "string") {
          onDelta(payload.delta);
        }

        if (payload.type === "response.completed") {
          onDone(payload);
          return;
        }

        if (payload.type === "response.error") {
          onError(new Error(payload.error?.message || "Unknown streaming error"));
          return;
        }
      }
    }

    onDone(lastEventPayload);
  } catch (e) {
    onError(e);
  }
}

function initNoteGeneration() {
  const generateNoteButton = document.getElementById("generateNoteButton");
  if (!generateNoteButton) return;

  if (generateNoteButton.__openAiNoteHandler) {
    generateNoteButton.removeEventListener("click", generateNoteButton.__openAiNoteHandler);
  }

  generateNoteButton.__openAiNoteHandler = generateNote;
  generateNoteButton.addEventListener("click", generateNoteButton.__openAiNoteHandler);
}

export { initNoteGeneration };
