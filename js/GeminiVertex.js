// GeminiVertex.js
// Note generation via a user-configured Vertex AI backend (Cloud Run) using Gemini 2.5 Pro (EU).
//
// IMPORTANT:
// - There is NO hardcoded backend URL here.
// - The module ONLY uses values from sessionStorage:
//     vertex_backend_url    → Cloud Run URL (e.g. https://...run.app)
//     vertex_backend_secret → X-Proxy-Secret for that backend
//     vertex_project_id     → optional, informational only
//
// Backend contract (your Cloud Run index.js):
//   POST JSON:
//     {
//       transcription: string,
//       customPrompt: string,
//       provider: "gemini",
//       modelVariant: "g25"
//     }
// -----------------------------------------------------------
// Vertex "note" generator (Cloud Run backend)
// -----------------------------------------------------------

// Vertex AI pricing for Gemini 2.5 Pro (USD per 1M tokens)
// Source: Vertex AI Generative AI pricing page.
const GEMINI_25_PRO_VERTEX_PRICING_USD_PER_M = {
  thresholdInputTokens: 200_000,
  short: { input: 1.25, output: 10.0 }, // <= 200K input tokens
  long: { input: 2.5, output: 15.0 },   // > 200K input tokens
};

function estimateGemini25ProVertexCostUSD({ modelId, usage }) {
  if (!usage) return null;
  if (!modelId || typeof modelId !== "string") return null;
  if (!modelId.startsWith("gemini-2.5-pro")) return null;

  const promptTokens = typeof usage.promptTokens === "number" ? usage.promptTokens : null;
  const outputTokens = typeof usage.outputTokens === "number" ? usage.outputTokens : null;
  if (promptTokens == null || outputTokens == null) return null;

  // Extra breakdown is available on Vertex as usage.raw (usageMetadata)
  const raw = usage.raw || {};
  const toolUsePromptTokens =
    typeof raw.toolUsePromptTokenCount === "number" ? raw.toolUsePromptTokenCount : 0;
  const thoughtsTokens =
    typeof raw.thoughtsTokenCount === "number" ? raw.thoughtsTokenCount : 0;

  // Billing aligns with "Text output (response and reasoning)" for output.
  const billableInputTokens = promptTokens + toolUsePromptTokens;
  const billableOutputTokens = outputTokens + thoughtsTokens;

  const tier =
    promptTokens > GEMINI_25_PRO_VERTEX_PRICING_USD_PER_M.thresholdInputTokens ? "long" : "short";
  const rates = GEMINI_25_PRO_VERTEX_PRICING_USD_PER_M[tier];

  const inputUsd = (billableInputTokens / 1_000_000) * rates.input;
  const outputUsd = (billableOutputTokens / 1_000_000) * rates.output;
  const totalUsd = inputUsd + outputUsd;

  return {
    tier,
    ratesUsdPerMTokens: { input: rates.input, output: rates.output },
    billableInputTokens,
    billableOutputTokens,
    thoughtsTokens,
    toolUsePromptTokens,
    inputUsd,
    outputUsd,
    totalUsd,
  };
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

function handleNoteAbort(generatedNoteField, noteTimerElement, noteTimerInterval, modelId) {
  clearInterval(noteTimerInterval);
  if (noteTimerElement) {
    noteTimerElement.innerText = "Text generation aborted.";
  }
  if (generatedNoteField && !generatedNoteField.value.trim()) {
    generatedNoteField.value = "Note generation aborted.";
  }
  getNoteCoordinator().emitNoteFinished?.({
    provider: "gemini3-vertex",
    model: modelId || "gemini-2.5-pro",
    aborted: true
  });
}

async function generateNote() {
  // Clear previous token/cost display immediately on new run
  try { window.__app?.clearNoteUsageAndCost?.(); } catch (_) {}

  const app = getNoteCoordinator();
  const controller = app.beginNoteGeneration?.({
    provider: "gemini3-vertex",
    model: "gemini-2.5-pro"
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

  // Supplementary info (prepended before transcription, same style as Gemini3)
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

  // Reset note field and start timer
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

  // --- Read Vertex config from sessionStorage (NO DEFAULTS) ---
  const backendUrl = (sessionStorage.getItem("vertex_backend_url") || "").trim();
  const backendSecret = (sessionStorage.getItem("vertex_backend_secret") || "").trim();

  if (!backendUrl || !backendSecret) {
    alert("Vertex backend URL/secret is missing. Open the Vertex setup guide and configure both values first.");
    clearInterval(noteTimerInterval);
    app.finishNoteGeneration?.();
    return;
  }

  // For now we always target Gemini 2.5 Pro in the backend:
  //   modelVariant: "g25"
  // If you later add more options, read sessionStorage.vertex_model or #vertexModel here.
  const combinedPrompt =
    (promptText || "") +
    (supplementaryWrapped ? "\n\n" + supplementaryWrapped : "");

  let modelId = "gemini-2.5-pro";
  try {
    const resp = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Proxy-Secret": backendSecret,
      },
      body: JSON.stringify({
        transcription: `${supplementaryWrapped}${transcriptionText}`,
        customPrompt: promptText,
        provider: "gemini",
        modelVariant: "g25"
      }),
      signal: controller.signal
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      throw new Error(`Vertex backend error ${resp.status}: ${text}`);
    }

    const data = await resp.json().catch(() => ({}));
    const noteText = typeof data?.text === "string" ? data.text : "";
    const usage = data?.usage || null;
    modelId = data?.model || "gemini-2.5-pro";

    // Report token usage to UI (USD is calculated centrally in transcribe.html)
    if (usage) {
      try {
        window.__app?.setNoteUsageAndCost?.({
          providerKey: "gemini3-vertex",
          modelId: modelId,
          // Pass Vertex-style usage object. transcribe.html can normalize or directly use it.
          usage: {
            promptTokens: usage.promptTokens,
            outputTokens: usage.outputTokens,
            totalTokens: usage.totalTokens,
            raw: usage.raw || null,
          },
        });
      } catch (_) {}
    }

    // Log token usage (and optional cost) in the browser console
    if (usage && (usage.promptTokens != null || usage.outputTokens != null || usage.totalTokens != null)) {
      console.log(
        "[Vertex usage]",
        "input:", usage.promptTokens ?? "?",
        "output:", usage.outputTokens ?? "?",
        "total:", usage.totalTokens ?? "?"
      );

      // USD estimate (browser-side) for Gemini 2.5 Pro on Vertex AI
      const cost = estimateGemini25ProVertexCostUSD({ modelId, usage });
      if (cost) {
        console.log(
          "[Vertex cost]",
          `model=${modelId}`,
          `tier=${cost.tier}`,
          `inputBillable=${cost.billableInputTokens}`,
          `outputBillable=${cost.billableOutputTokens}`,
          `($${cost.totalUsd.toFixed(6)} total)`
        );
      }
    } else {
      console.log("[Vertex usage] (missing in backend response)", data);
    }

    clearInterval(noteTimerInterval);
    if (noteTimerElement) {
      noteTimerElement.innerText =
        "Text generation completed!";
    }

    generatedNoteField.value = noteText;
    app.emitNoteFinished?.({ provider: "gemini3-vertex", model: modelId || "gemini-2.5-pro" });
  } catch (err) {
    if (err?.name === "AbortError") {
      handleNoteAbort(generatedNoteField, noteTimerElement, noteTimerInterval, modelId);
      return;
    }

    console.error("Vertex Gemini note error:", err);
    clearInterval(noteTimerInterval);
    if (noteTimerElement) {
      noteTimerElement.innerText = "";
    }
    generatedNoteField.value =
      "Error generating note via Vertex backend: " + String(err);
    app.finishNoteGeneration?.();
  }

     
}

function initNoteGeneration() {
  const generateNoteButton = document.getElementById("generateNoteButton");
  if (!generateNoteButton) return;

  generateNoteButton.addEventListener("click", generateNote);
}

export { initNoteGeneration };
