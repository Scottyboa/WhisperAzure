// MistralTXT.js

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
  getNoteCoordinator().emitNoteFinished?.({
    provider: "mistral",
    model: "mistral-large-latest",
    aborted: true
  });
}

// Handles the note generation process using the OpenAI API
async function generateNote() {
  // Clear previous token/cost display immediately on new run
  try { window.__app?.clearNoteUsageAndCost?.(); } catch (_) {}

  const app = getNoteCoordinator();
  const controller = app.beginNoteGeneration?.({
    provider: "mistral",
    model: "mistral-large-latest"
  });
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

  // Optional supplementary info (prepended before transcription in the user message)
  const supplementaryElem = document.getElementById("supplementaryInfo");
  const supplementaryRaw = supplementaryElem ? supplementaryElem.value.trim() : "";
  // Standard label:
  // Tilleggsopplysninger(brukes som kontekst):"[content]"
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
  const apiKey = sessionStorage.getItem("mistral_api_key");
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
    // Prepare OpenAI-compatible chat messages
    const messages = [
      { role: "system", content: finalPromptText },
      {
        role: "user",
        content: supplementaryWrapped + transcriptionText
      }
    ];
    // Call Mistral's OpenAI-compatible Chat Completions API with streaming
    const resp = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "mistral-large-latest",
        messages,
        stream: true
      }),
      signal: controller.signal
    });

    await streamMistralChat(resp, {
      signal: controller.signal,
      onDelta: (textChunk) => {
        generatedNoteField.value += textChunk;
      },
      onDone: (finalEvent) => {
        // Best-effort: Mistral streaming often omits usage, but log it if it appears.
        const usage = finalEvent?.usage;
        if (usage) {
          console.log(
            "[Mistral token usage]",
            "input=", usage.prompt_tokens,
            "output=", usage.completion_tokens,
            "total=", usage.total_tokens
          );

          // Send usage to Transcribe UI (token+cost line)
          try {
            if (window.__app && typeof window.__app.setNoteUsageAndCost === "function") {
              window.__app.setNoteUsageAndCost({
                providerKey: "mistral",
                modelId: "mistral-large-latest",
                usage
              });
            }
          } catch (e) {
            console.warn("[Mistral] setNoteUsageAndCost failed:", e);
          }
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
    app.emitNoteFinished?.({ provider: "mistral", model: "mistral-large-latest" });
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

async function streamMistralChat(resp, {
  signal,
  onDelta = () => {},
  onDone = () => {},
  onError = (e) => { console.error(e); },
} = {}) {
  if (!resp.ok || !resp.body) {
    const text = await resp.text().catch(() => "");
    throw new Error(`Mistral error ${resp.status}: ${text}`);
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let finalUsage = null;

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
      // SSE frames separated by a blank line
      const frames = buffer.split("\n\n");
      buffer = frames.pop() ?? "";

      for (const frame of frames) {
        if (signal?.aborted) {
          throw new DOMException("Aborted", "AbortError");
        }

        // Only process "data:" lines
        const lines = frame.split("\n");
        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          const dataStr = line.slice(5).trim();
            if (dataStr === "[DONE]") { onDone({ usage: finalUsage }); return; }
          try {
            const payload = JSON.parse(dataStr);
            if (payload?.usage) finalUsage = payload.usage;
            const choice = payload?.choices?.[0];
            const deltaText =
              choice?.delta?.content ??
              choice?.message?.content ??
              "";
            if (deltaText) onDelta(deltaText);
          } catch {
            // ignore keep-alives / non-JSON
          }
        }
      }
    }
    onDone({ usage: finalUsage });
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
