// Utility function to hash a string (used for storing prompts keyed by API key)
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  return hash.toString();
}

// Helper functions for base64 conversions (kept in case they're used elsewhere)
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

// Since encryption is no longer needed, the decryption functions are removed.
// We now assume that the plain API key is stored in sessionStorage under "user_api_key".


// Auto-resizes a textarea based on its content
function autoResize(textarea) {
  textarea.style.height = "auto";
  textarea.style.height = textarea.scrollHeight + "px";
}

// Formats milliseconds into a human-readable string
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

function handleNoteAbort(generatedNoteField, noteTimerElement, noteTimerInterval) {
  clearInterval(noteTimerInterval);
  if (generatedNoteField && !generatedNoteField.value.trim()) {
    generatedNoteField.value = "Note generation aborted.";
  }
  if (noteTimerElement) {
    noteTimerElement.innerText = "Text generation aborted.";
  }
  getNoteCoordinator().emitNoteFinished?.({ provider: "openai", model: "gpt-5.2", aborted: true });
}

// Handles the note generation process using the OpenAI API
async function generateNote() {
  // Clear previous token/cost display immediately on new run
  try { window.__app?.clearNoteUsageAndCost?.(); } catch (_) {}

  const app = getNoteCoordinator();
  const controller = app.beginNoteGeneration?.({ provider: "openai", model: "gpt-5.2" });
  if (!controller) {
    return;
  }

  const transcriptionElem = document.getElementById("transcription");
  if (!transcriptionElem) {
    app.finishNoteGeneration?.();
    alert("No transcription text available.");
    return;
  }
  const transcriptionText = transcriptionElem.value.trim();
  if (!transcriptionText) {
    app.finishNoteGeneration?.();
    alert("No transcription text available.");
    return;
  }
  
  const customPromptTextarea = document.getElementById("customPrompt");
  const promptText = customPromptTextarea ? customPromptTextarea.value : "";
  // Optional supplementary info (prepended before transcription for the user message)
  const supplementaryElem = document.getElementById("supplementaryInfo");
  const supplementaryRaw = supplementaryElem ? supplementaryElem.value.trim() : "";
  // EXACT required format:
  // Supplerende informasjon:"[exact content of the supplementary field]"
  const supplementaryWrapped = supplementaryRaw
    ? `Tilleggsopplysninger(brukes som kontekst):"${supplementaryRaw}"\n\n`
    : "";

  const generatedNoteField = document.getElementById("generatedNote");
  if (!generatedNoteField) {
    app.finishNoteGeneration?.();
    return;
  }
  
  // Reset generated note field and start timer
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
  
  // Phase 3: Always use the OpenAI key for note generation (independent of transcription provider)
  const apiKey = sessionStorage.getItem("openai_api_key");
  if (!apiKey) {
    alert("No API key available for note generation.");
    clearInterval(noteTimerInterval);
    app.finishNoteGeneration?.();
    return;
  }
  
  // Add the fixed formatting instruction as a hidden prompt component.
  const baseInstruction = `
Do not use bold text. Do not use asterisks (*) or Markdown formatting anywhere in the output.
All headings should be plain text with a colon.`.trim();

  // Append the hidden instruction to the user's prompt so it is always included.
  const finalPromptText = promptText + "\n\n" + baseInstruction;
  
  try {
  // Prepare the messages array for the Responses API
  const messages = [
    { role: "system", content: finalPromptText },
    { role: "user",   content: supplementaryWrapped + transcriptionText }
  ];
 
  // Call the Responses API with GPT-5.2 and streaming

  // Determine reasoning level from the dropdown (defaults to "low" if missing)
  const reasoningSelect = document.getElementById("gpt5Reasoning");
  const reasoningLevel = reasoningSelect ? reasoningSelect.value : "low";

  // Build the base request body
  const requestBody = {
    model: "gpt-5.2",
    input: messages.map(m => ({
      role: m.role,
      content: [{ type: "input_text", text: m.content }]
    })),
    stream: true,
    // —— OPTIONAL TUNING PARAMS —— 
    text: {
      verbosity: "medium"    // try "low" (faster/terse) or "high" (more detail)
    }
  };

  // Add reasoning only if the level is not "none"
  if (reasoningLevel && reasoningLevel !== "none") {
    requestBody.reasoning = {
      effort: reasoningLevel   // "low" | "medium" | "high"
    };
  }

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
      onDone: (payload) => {
        const usage =
          payload?.response?.usage ?? payload?.usage ?? null;
        if (usage) {
          console.log(
            "[OpenAI token usage]",
            "input=", usage.input_tokens,
            "output=", usage.output_tokens,
            "total=", usage.total_tokens,
            "reasoning=", usage.output_tokens_details?.reasoning_tokens ?? 0
          );

          // Step 3: push token usage to UI (cost comes later)
          try {
            const providerKey = (sessionStorage.getItem("note_provider") || "openai").trim();
            const modelId = "gpt-5.2";
            if (window.__app?.setNoteUsageAndCost) {
              const payload = window.__app.normalizeNoteUsage
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
              window.__app.setNoteUsageAndCost(payload);
            }
          } catch (_) {}
        }
      },
      onError: (err) => {
        throw err;
      }
    });

    clearInterval(noteTimerInterval);
    if (noteTimerElement) {
      noteTimerElement.innerText = "Text generation completed!";
    }
    app.emitNoteFinished?.({ provider: "openai", model: "gpt-5.2" });
  } catch (error) {
    if (error?.name === "AbortError") {
      handleNoteAbort(generatedNoteField, noteTimerElement, noteTimerInterval);
      return;
    }

    clearInterval(noteTimerInterval);
    if (generatedNoteField) {
      generatedNoteField.value = "Error generating note: " + error;
    }
    if (noteTimerElement) {
      noteTimerElement.innerText = "";
    }
    app.finishNoteGeneration?.();
  }
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
          if (line.startsWith("data:"))  dataStr = line.slice(5).trim();
        }
        if (!dataStr) continue;
        if (dataStr === "[DONE]") { onDone(lastEventPayload); return; }

        let payload;
        try { payload = JSON.parse(dataStr); } catch { continue; }

        if (payload.type === "response.output_text.delta" && typeof payload.delta === "string") {
          onDelta(payload.delta);
        }
        if (payload.type === "response.completed") {
          lastEventPayload = payload;
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

// Initializes note generation functionality, including prompt slot handling and event listeners.
function initNoteGeneration() {
  const generateNoteButton = document.getElementById("generateNoteButton");
  if (!generateNoteButton) return;

  // Attach click handler only
  generateNoteButton.addEventListener("click", generateNote);
}
 
export { initNoteGeneration };
