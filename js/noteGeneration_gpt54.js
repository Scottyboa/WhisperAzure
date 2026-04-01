// noteGeneration_gpt54.js
// Combined GPT-5.4 note generation module supporting both streaming and non-streaming
// via the existing #noteProviderMode dropdown.

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
  } else {
    const minutes = Math.floor(totalSec / 60);
    const seconds = totalSec % 60;
    return minutes + " min" + (seconds > 0 ? " " + seconds + " sec" : "");
  }
}

function getNoteCoordinator() {
  return window.__app || {};
}

function extractResponseText(json) {
  if (!json || typeof json !== "object") return "";

  if (typeof json.output_text === "string") return json.output_text;

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

function getSelectedMode() {
  const modeSelect = document.getElementById("noteProviderMode");
  return (modeSelect?.value || "streaming").toLowerCase();
}

function getReasoningLevel() {
  const reasoningSelect = document.getElementById("gpt5Reasoning");
  return reasoningSelect ? reasoningSelect.value : "low";
}

function buildMessages(finalPromptText, supplementaryWrapped, transcriptionText) {
  return [
    { role: "system", content: finalPromptText },
    { role: "user", content: supplementaryWrapped + transcriptionText }
  ];
}

function buildGpt54Request({ messages, streaming, reasoningLevel }) {
  const requestBody = {
    model: "gpt-5.4",
    input: messages.map(m => ({
      role: m.role,
      content: [{ type: "input_text", text: m.content }]
    })),
    text: {
      verbosity: "medium"
    }
  };

  if (streaming) {
    requestBody.stream = true;
  }

  if (reasoningLevel && reasoningLevel !== "none") {
    requestBody.reasoning = {
      effort: reasoningLevel
    };
  }

  return requestBody;
}

function pushOpenAiUsageToUi(usage, modelId = "gpt-5.4") {
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

    const providerKey = "openai";
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

function buildSharedNoteContext() {
  const app = getNoteCoordinator();
  const mode = getSelectedMode();
  const controller = app.beginNoteGeneration?.({
    provider: "openai",
    model: "gpt-5.4",
    mode
  });
  if (!controller) return null;

  // Clear previous token/cost display immediately on new run
  try { window.__app?.clearNoteUsageAndCost?.(); } catch (_) {}

  const transcriptionElem = document.getElementById("transcription");
  if (!transcriptionElem) {
    app.finishNoteGeneration?.();
    alert("No transcription text available.");
    return null;
  }

  const transcriptionText = transcriptionElem.value.trim();
  if (!transcriptionText) {
    app.finishNoteGeneration?.();
    alert("No transcription text available.");
    return null;
  }

  const customPromptTextarea = document.getElementById("customPrompt");
  const promptText = customPromptTextarea ? customPromptTextarea.value : "";

  const supplementaryElem = document.getElementById("supplementaryInfo");
  const supplementaryRaw = supplementaryElem ? supplementaryElem.value.trim() : "";
  const supplementaryWrapped = supplementaryRaw
    ? `Tilleggsopplysninger(brukes som kontekst):"${supplementaryRaw}"\n\n`
    : "";

  const generatedNoteField = document.getElementById("generatedNote");
  if (!generatedNoteField) {
    app.finishNoteGeneration?.();
    return null;
  }

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
    app.finishNoteGeneration?.();
    return null;
  }

  const baseInstruction = `
Do not use bold text. Do not use asterisks (*) or Markdown formatting anywhere in the output.
All headings should be plain text with a colon.`.trim();

  const finalPromptText = promptText + "\n\n" + baseInstruction;
  const messages = buildMessages(finalPromptText, supplementaryWrapped, transcriptionText);
  const reasoningLevel = getReasoningLevel();

  return {
    app,
    controller,
    mode,
    apiKey,
    messages,
    generatedNoteField,
    noteTimerElement,
    noteTimerInterval,
    reasoningLevel
  };
}

function finishSuccess(noteTimerInterval, noteTimerElement, meta = {}) {
  clearInterval(noteTimerInterval);
  if (noteTimerElement) {
    noteTimerElement.innerText = "Text generation completed!";
  }
  getNoteCoordinator().emitNoteFinished?.({
    provider: "openai",
    model: "gpt-5.4",
    ...meta
  });
}

function finishAbort(generatedNoteField, noteTimerInterval, noteTimerElement, meta = {}) {
  clearInterval(noteTimerInterval);
  if (generatedNoteField && !generatedNoteField.value.trim()) {
    generatedNoteField.value = "Note generation aborted.";
  }
  if (noteTimerElement) {
    noteTimerElement.innerText = "Text generation aborted.";
  }
  getNoteCoordinator().emitNoteFinished?.({
    provider: "openai",
    model: "gpt-5.4",
    aborted: true,
    ...meta
  });
}

function finishError(error, generatedNoteField, noteTimerInterval, noteTimerElement) {
  clearInterval(noteTimerInterval);
  if (generatedNoteField) {
    generatedNoteField.value = "Error generating note: " + error;
  }
  if (noteTimerElement) {
    noteTimerElement.innerText = "";
  }
  getNoteCoordinator().finishNoteGeneration?.();
}

async function generateNoteStreaming(ctx) {
  const {
    controller,
    apiKey,
    messages,
    generatedNoteField,
    noteTimerElement,
    noteTimerInterval,
    reasoningLevel,
    mode
  } = ctx;

  try {
    const requestBody = buildGpt54Request({
      messages,
      streaming: true,
      reasoningLevel
    });

    const resp = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });

    await streamOpenAIResponse(resp, {
      signal: controller.signal,
      onDelta: (textChunk) => {
        generatedNoteField.value += textChunk;
      },
      onDone: (finalEvent) => {
        const usage = finalEvent?.response?.usage ?? finalEvent?.usage;
        pushOpenAiUsageToUi(usage, "gpt-5.4");
      },
      onError: (err) => {
        console.error("Streaming error:", err);
        throw err;
      }
    });

    finishSuccess(noteTimerInterval, noteTimerElement, { mode });
  } catch (error) {
    if (error?.name === "AbortError") {
      finishAbort(generatedNoteField, noteTimerInterval, noteTimerElement, { mode });
      return;
    }
    finishError(error, generatedNoteField, noteTimerInterval, noteTimerElement);
  }
}

async function generateNoteNonStreaming(ctx) {
  const {
    controller,
    apiKey,
    messages,
    generatedNoteField,
    noteTimerElement,
    noteTimerInterval,
    reasoningLevel,
    mode
  } = ctx;

  try {
    const requestBody = buildGpt54Request({
      messages,
      streaming: false,
      reasoningLevel
    });

    const resp = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => "");
      throw new Error(`OpenAI error ${resp.status}: ${errText}`);
    }

    const json = await resp.json();
    generatedNoteField.value = extractResponseText(json);

    pushOpenAiUsageToUi(json?.usage, "gpt-5.4");
    finishSuccess(noteTimerInterval, noteTimerElement, { mode });
  } catch (error) {
    if (error?.name === "AbortError") {
      finishAbort(generatedNoteField, noteTimerInterval, noteTimerElement, { mode });
      return;
    }
    finishError(error, generatedNoteField, noteTimerInterval, noteTimerElement);
  }
}

async function generateNote() {
  const ctx = buildSharedNoteContext();
  if (!ctx) return;

  const mode = getSelectedMode();
  if (mode === "non-streaming") {
    await generateNoteNonStreaming(ctx);
    return;
  }

  await generateNoteStreaming(ctx);
}

async function streamOpenAIResponse(resp, {
  signal,
  onDelta = () => {},
  onDone = () => {},
  onError = (e) => { console.error(e); },
} = {}) {
  if (!resp.ok || !resp.body) {
    const text = await resp.text().catch(() => "");
    throw new Error(`OpenAI error ${resp.status}: ${text}`);
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let lastEventPayload = null;

  const abortReader = () => {
    try { reader.cancel(); } catch (_) {}
  };

  if (signal) {
    if (signal.aborted) {
      abortReader();
      throw new DOMException("Aborted", "AbortError");
    }
    signal.addEventListener("abort", abortReader, { once: true });
  }

  try {
    while (true) {
      if (signal?.aborted) {
        throw new DOMException("Aborted", "AbortError");
      }

      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n\n");
      buffer = parts.pop() ?? "";

      for (const part of parts) {
        if (signal?.aborted) {
          throw new DOMException("Aborted", "AbortError");
        }

        const lines = part.split("\n");
        let event = null;
        let dataStr = null;

        for (const line of lines) {
          if (line.startsWith("event:")) event = line.slice(6).trim();
          if (line.startsWith("data:")) dataStr = line.slice(5).trim();
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
  } finally {
    if (signal) {
      try { signal.removeEventListener("abort", abortReader); } catch (_) {}
    }
  }
}

function initNoteGeneration() {
  const generateNoteButton = document.getElementById("generateNoteButton");
  if (!generateNoteButton) return;

  generateNoteButton.addEventListener("click", generateNote);
}

export { initNoteGeneration };
