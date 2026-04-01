// noteGeneration.js

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

function getReasoningLevel() {
  const reasoningSelect = document.getElementById("gpt5Reasoning");
  return reasoningSelect ? reasoningSelect.value : "low";
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
    provider: "openai",
    model: "gpt-5.1",
    mode: "non-streaming",
    aborted: true
  });
}

// Extract full text from a non-streaming Responses API payload.
// Works with current `output_text` and falls back to assembling from blocks.
function extractResponseText(json) {
  if (!json || typeof json !== "object") return "";
  // Preferred in Responses API
  if (typeof json.output_text === "string") return json.output_text;
  // Fallback: json.output -> [{ role, content: [ {type, text}, ... ] }, ...]
  if (Array.isArray(json.output)) {
    try {
      return json.output
        .flatMap(item => (Array.isArray(item.content) ? item.content : []))
        .filter(block => block && (block.type === "output_text" || block.type === "text"))
        .map(block => block.text || "")
        .join("");
    } catch (_) {}
  }
  // Older/alt shapes: json.content directly
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

// Handles the note generation process using the OpenAI API (non-streaming GPT-5.1)
async function generateNote() {
  // Clear previous token/cost display immediately on new run
  try { window.__app?.clearNoteUsageAndCost?.(); } catch (_) {}

  const app = getNoteCoordinator();
  const controller = app.beginNoteGeneration?.({
    provider: "openai",
    model: "gpt-5.1",
    mode: "non-streaming"
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

  // Optional supplementary info (prepended before transcription for the user message)
  const supplementaryElem = document.getElementById("supplementaryInfo");
  const supplementaryRaw = supplementaryElem ? supplementaryElem.value.trim() : "";
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
      noteTimerElement.innerText =
        "Note Generation Timer: " + formatTime(Date.now() - noteStartTime);
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

    // Determine reasoning level from dropdown (default: "low")
    const reasoningLevel = getReasoningLevel();

    // Build the request body for non-streaming Responses API
    const requestBody = {
      model: "gpt-5.1",
      input: messages.map(m => ({
        role: m.role,
        content: [{ type: "input_text", text: m.content }]
      }))
    };

    // Only add reasoning if the level is not "none"
    if (reasoningLevel && reasoningLevel !== "none") {
      requestBody.reasoning = { effort: reasoningLevel }; // "low" | "medium" | "high"
    }

    // Call the Responses API with GPT-5.1 (non-streaming)
    const resp = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: (() => {
        // Determine reasoning level from dropdown (default: "low")
        const sel = document.getElementById("gpt5Reasoning");
        const level = sel ? sel.value : "low";

        const req = {
          model: "gpt-5.1",
          input: [
            {
              role: "system",
              content: [{ type: "input_text", text: finalPromptText }]
            },
            {
              role: "user",
              content: [{
               type: "input_text",
                text: supplementaryWrapped + transcriptionText
              }]
            }
          ],
          text: { verbosity: "medium" }
        };

        if (level && level !== "none") {
          req.reasoning = { effort: level };
        }

        return JSON.stringify(req);
      })(),
      signal: controller.signal
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => "");
      throw new Error(`OpenAI error ${resp.status}: ${errText}`);
    }

    const json = await resp.json();
    generatedNoteField.value = extractResponseText(json);

    // Push usage to the shared UI for token/cost display
    try {
      const usage = json?.usage;
      if (usage && window.__app && typeof window.__app.setNoteUsageAndCost === "function") {
        window.__app.setNoteUsageAndCost(
          {
            providerKey: "openai",
            modelId: "gpt-5.1",
            inputTokens: usage.input_tokens ?? null,
            outputTokens: usage.output_tokens ?? null,
            totalTokens: usage.total_tokens ?? null,
            estimatedUsd: null,
            meta: {
              reasoningTokens: usage.output_tokens_details?.reasoning_tokens ?? 0
            }
          }
        );
      }
    } catch (_) {}

    clearInterval(noteTimerInterval);
    if (noteTimerElement) {
      noteTimerElement.innerText = "Text generation completed!";
    }
    app.emitNoteFinished?.({
      provider: "openai",
      model: "gpt-5.1",
      mode: "non-streaming"
    });
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
  onDelta = () => {},
  onDone = () => {},
  onError = (e) => { console.error(e); },
} = {}) {
  if (!resp.ok || !resp.body) {
    const text = await resp.text().catch(() => "");
    throw new Error(`OpenAI error ${resp.status}: ${text}`);
  }

// Safely extract text from non-streaming Responses API payloads
function extractResponseText(json) {
  // Preferred in new Responses API
  if (typeof json.output_text === "string") {
    return json.output_text;
  }
  // Fallback: assemble from content array(s)
  try {
    // Some responses: json.output -> array of items -> item.content -> array of blocks
    if (Array.isArray(json.output)) {
      return json.output
        .flatMap(item => (Array.isArray(item.content) ? item.content : []))
        .filter(block => block.type === "output_text" || block.type === "text")
        .map(block => block.text || "")
        .join("");
    }
    // Older shapes: json.content directly
   if (Array.isArray(json.content)) {
      return json.content
        .filter(block => block.type === "output_text" || block.type === "text")
        .map(block => block.text || "")
        .join("");
    }
  } catch (_) {}
  return "";
}

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n\n");
      buffer = parts.pop() ?? "";

      for (const part of parts) {
        const lines = part.split("\n");
        let event = null;
        let dataStr = null;
        for (const line of lines) {
          if (line.startsWith("event:")) event = line.slice(6).trim();
          if (line.startsWith("data:"))  dataStr = line.slice(5).trim();
        }
        if (!dataStr) continue;
        if (dataStr === "[DONE]") { onDone(); return; }

        let payload;
        try { payload = JSON.parse(dataStr); } catch { continue; }

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
    onDone();
  } catch (e) {
    onError(e);
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
