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

import {
  beginNoteRun,
  bindGenerateNoteButton,
  finishNoteAbort,
  getSessionStorageValue,
  pushNormalizedNoteUsage,
  resolveCommonNoteInputs,
  startNoteTimer
} from "./core/note-runner.js";

// Vertex AI pricing for Gemini 2.5 Pro (USD per 1M tokens)
// Source: Vertex AI Generative AI pricing page.
const GEMINI_25_PRO_VERTEX_PRICING_USD_PER_M = {
  thresholdInputTokens: 200_000,
  short: { input: 1.25, output: 10.0 }, // <= 200K input tokens
  long: { input: 2.5, output: 15.0 },   // > 200K input tokens
};

const DEFAULT_MODEL_ID = "gemini-2.5-pro";
const RUN_META = {
  provider: "gemini3-vertex",
  model: DEFAULT_MODEL_ID
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

function getVertexBackendConfig() {
  return {
    backendUrl: getSessionStorageValue("vertex_backend_url", "").trim(),
    backendSecret: getSessionStorageValue("vertex_backend_secret", "").trim()
  };
}

function pushVertexUsageToUi(modelId, usage) {
  if (!usage) {
    return;
  }

  pushNormalizedNoteUsage({
    providerKey: "gemini3-vertex",
    modelId,
    usage: {
      promptTokens: usage.promptTokens,
      outputTokens: usage.outputTokens,
      totalTokens: usage.totalTokens,
      raw: usage.raw || null,
    }
  });
}

function logVertexUsageAndCost({ modelId, usage, rawResponse }) {
  if (usage && (usage.promptTokens != null || usage.outputTokens != null || usage.totalTokens != null)) {
    console.log(
      "[Vertex usage]",
      "input:", usage.promptTokens ?? "?",
      "output:", usage.outputTokens ?? "?",
      "total:", usage.totalTokens ?? "?"
    );

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
    console.log("[Vertex usage] (missing in backend response)", rawResponse);
  }
}

function extractVertexNoteText(data) {
  if (!data || typeof data !== "object") {
    return "";
  }

  const directText = [
    data.text,
    data.noteText,
    data.output,
    data.note,
    data.generatedNote,
  ].find((value) => typeof value === "string" && value.trim());

  if (directText) {
    return directText;
  }

  if (Array.isArray(data.candidates)) {
    try {
      const candidateText = data.candidates
        .flatMap((candidate) =>
          Array.isArray(candidate?.content?.parts) ? candidate.content.parts : []
        )
        .map((part) => (typeof part?.text === "string" ? part.text : ""))
        .join("")
        .trim();

      if (candidateText) {
        return candidateText;
      }
    } catch (_) {}
  }

  if (Array.isArray(data.output)) {
    try {
      const outputText = data.output
        .flatMap((item) => (Array.isArray(item?.content) ? item.content : []))
        .filter((block) => block && (block.type === "output_text" || block.type === "text"))
        .map((block) => block.text || "")
        .join("")
        .trim();

      if (outputText) {
        return outputText;
      }
    } catch (_) {}
  }

  if (Array.isArray(data.content)) {
    try {
      const contentText = data.content
        .filter((block) => block && (block.type === "output_text" || block.type === "text"))
        .map((block) => block.text || "")
        .join("")
        .trim();

      if (contentText) {
        return contentText;
      }
    } catch (_) {}
  }

  return "";
}

async function generateNote() {
  const { app, controller } = beginNoteRun(RUN_META);
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

  const { backendUrl, backendSecret } = getVertexBackendConfig();
  if (!backendUrl || !backendSecret) {
    alert("Vertex backend URL/secret is missing. Open the Vertex setup guide and configure both values first.");
    noteTimer.stop("");
    app.finishNoteGeneration?.();
    return;
  }

  let modelId = DEFAULT_MODEL_ID;

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
    const noteText = extractVertexNoteText(data);
    const usage = data?.usage || null;
    modelId = data?.model || DEFAULT_MODEL_ID;

    pushVertexUsageToUi(modelId, usage);
    logVertexUsageAndCost({ modelId, usage, rawResponse: data });

    generatedNoteField.value = noteText || "[No text returned from Vertex backend]";
    noteTimer.stop("Text generation completed!");
    app.emitNoteFinished?.({
      provider: "gemini3-vertex",
      model: modelId || DEFAULT_MODEL_ID
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      finishNoteAbort({
        generatedNoteField,
        noteTimer,
        runMeta: {
          provider: "gemini3-vertex",
          model: modelId || DEFAULT_MODEL_ID
        }
      });
      return;
    }

    console.error("Vertex Gemini note error:", error);
    noteTimer.stop("");
    generatedNoteField.value =
      "Error generating note via Vertex backend: " + String(error);
    app.finishNoteGeneration?.();
  }
}

function initNoteGeneration() {
  bindGenerateNoteButton(generateNote);
}

export { initNoteGeneration };
