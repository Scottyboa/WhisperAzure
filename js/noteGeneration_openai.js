// noteGeneration_openai.js
//
// Consolidated OpenAI note-generation module.
//
// This file replaces the per-model OpenAI note-generation files that
// previously existed:
//
//     - notegeneration gpt-5.js     (gpt-5.1 streaming)
//     - noteGeneration_gpt5_NS.js   (gpt-5.1 non-streaming)
//     - noteGeneration_gpt52.js     (gpt-5.2 streaming)
//     - noteGeneration_gpt52_NS.js  (gpt-5.2 non-streaming)
//     - noteGeneration_gpt54.js     (gpt-5.4, mode-driven)
//
// Each of those files is now a thin shim that re-exports the matching
// init function from this file, so the existing
// provider-registry.js modulePath entries continue to resolve, and so
// any external code that imports the old files still works. No
// behaviour changes are intended; every per-variant quirk in the
// original files is preserved here exactly.

import {
  beginNoteRun,
  bindGenerateNoteButton,
  buildStandardNotePrompt,
  extractResponsesOutputText,
  finishNoteAbort,
  getSelectValue,
  getSessionStorageValue,
  pushNormalizedNoteUsage,
  requireSessionKey,
  resolveCommonNoteInputs,
  startNoteTimer,
  streamResponsesSse
} from "./core/note-runner.js";
import { normalizeOpenAiReasoning } from "./core/provider-registry.js";

// -----------------------------------------------------------------------------
// Variant configuration table
// -----------------------------------------------------------------------------
//
// Each entry describes one OpenAI note-generation variant. The values
// here are exactly what each pre-existing file used to hard-code, so
// behaviour is preserved 1:1.
//
//   model                   : OpenAI model id sent in the request body
//   modeMode                : 'streaming' | 'non-streaming' | 'dynamic'
//                             ('dynamic' = read #noteProviderMode at run time, gpt-5.4 style)
//   normalizeReasoning      : whether to run the reasoning level through
//                             normalizeOpenAiReasoning(); the original
//                             gpt-5.1 streaming file did NOT do this
//   reasoningDefault        : default value if the dropdown is empty
//   streamingProviderKey    : value passed as `providerKey` to
//                             pushNormalizedNoteUsage in streaming onDone.
//                             For gpt-5.1/5.2 streaming this was a
//                             session-storage lookup; for gpt-5.4 it
//                             was the literal "openai".
//   streamingProviderKeyFallback : fallback used by the session-storage variants
//   nonStreamingProviderKey : provider key used in the non-streaming branch
//   abortPayload            : how to call finishNoteAbort. The original
//                             gpt-5.2 NS file used a slightly different
//                             shape than the others; keep the per-variant
//                             behaviour exactly.
//
// To preserve every original quirk, each variant references this table
// rather than sharing one "best" implementation.

const VARIANTS = Object.freeze({
  "gpt5-streaming": {
    model: "gpt-5.1",
    runMode: "streaming",
    normalizeReasoning: false,
    reasoningDefault: "low",
    streamingProviderKey: { kind: "session", key: "note_provider", fallback: "gpt5" },
    abortShape: "standard"
  },
  "gpt5-non-streaming": {
    model: "gpt-5.1",
    runMode: "non-streaming",
    normalizeReasoning: true,
    reasoningDefault: "none",
    nonStreamingProviderKey: "openai",
    abortShape: "standard"
  },
  "gpt52-streaming": {
    model: "gpt-5.2",
    runMode: "streaming",
    normalizeReasoning: true,
    reasoningDefault: "none",
    streamingProviderKey: { kind: "session", key: "note_provider", fallback: "gpt52" },
    abortShape: "standard"
  },
  "gpt52-non-streaming": {
    model: "gpt-5.2",
    runMode: "non-streaming",
    normalizeReasoning: true,
    reasoningDefault: "none",
    nonStreamingProviderKey: "openai",
    abortShape: "gpt52-ns"
  },
  "gpt54": {
    model: "gpt-5.4",
    runMode: "dynamic",
    normalizeReasoning: true,
    reasoningDefault: "none",
    streamingProviderKey: { kind: "literal", value: "openai" },
    nonStreamingProviderKey: "openai",
    abortShape: "standard"
  },
  "gpt55-streaming": {
    model: "gpt-5.5",
    runMode: "streaming",
    normalizeReasoning: true,
    reasoningDefault: "low",
    streamingProviderKey: { kind: "literal", value: "openai" },
    abortShape: "standard"
  },
  "gpt55-non-streaming": {
    model: "gpt-5.5",
    runMode: "non-streaming",
    normalizeReasoning: true,
    reasoningDefault: "low",
    nonStreamingProviderKey: "openai",
    abortShape: "standard"
  }
});

// -----------------------------------------------------------------------------
// Shared helpers
// -----------------------------------------------------------------------------

function buildRequestBody({
  model,
  finalPromptText,
  supplementaryWrapped,
  transcriptionText,
  streaming,
  reasoningLevel
}) {
  const requestBody = {
    model,
    input: [
      {
        role: "system",
        content: [{ type: "input_text", text: finalPromptText }]
      },
      {
        role: "user",
        content: [{ type: "input_text", text: `${supplementaryWrapped}${transcriptionText}` }]
      }
    ],
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

function resolveReasoningLevel(variantConfig) {
  const raw = getSelectValue("gpt5Reasoning", variantConfig.reasoningDefault);
  return variantConfig.normalizeReasoning
    ? normalizeOpenAiReasoning(raw)
    : raw;
}

function resolveStreamingProviderKey(variantConfig) {
  const spec = variantConfig.streamingProviderKey;
  if (!spec) return "openai";
  if (spec.kind === "literal") return spec.value;
  if (spec.kind === "session") {
    const fromSession = getSessionStorageValue(spec.key, spec.fallback);
    return (fromSession || spec.fallback || "openai").trim();
  }
  return "openai";
}

function pushUsageFromStreamingDone(variantConfig, finalEvent) {
  const usage = finalEvent?.response?.usage ?? finalEvent?.usage ?? null;
  if (!usage) return;

  pushNormalizedNoteUsage({
    providerKey: resolveStreamingProviderKey(variantConfig),
    modelId: variantConfig.model,
    usage,
    meta: {
      reasoningTokens: usage?.output_tokens_details?.reasoning_tokens ?? 0
    }
  });
}

function pushUsageFromNonStreaming(variantConfig, json) {
  const usage = json?.usage ?? null;

  pushNormalizedNoteUsage({
    providerKey: variantConfig.nonStreamingProviderKey || "openai",
    modelId: variantConfig.model,
    usage,
    meta: {
      reasoningTokens: usage?.output_tokens_details?.reasoning_tokens ?? 0
    }
  });
}

function callFinishNoteAbort(variantConfig, runMeta, generatedNoteField, noteTimer, noteTimerElement) {
  // The original gpt-5.2 NS file passed { ...runMeta, aborted: true }
  // and an extra noteTimerElement field. Preserved exactly to avoid
  // any subtle behaviour change.
  if (variantConfig.abortShape === "gpt52-ns") {
    finishNoteAbort({
      runMeta: { ...runMeta, aborted: true },
      generatedNoteField,
      noteTimerElement,
      noteTimer
    });
    return;
  }

  finishNoteAbort({
    generatedNoteField,
    noteTimer,
    runMeta
  });
}

// -----------------------------------------------------------------------------
// Core engine
// -----------------------------------------------------------------------------

function buildRunMeta(variantConfig, effectiveMode) {
  const meta = {
    provider: "openai",
    model: variantConfig.model
  };
  // Match original files: streaming-only variants did not set `mode`,
  // non-streaming-only variants set mode: "non-streaming", and gpt-5.4
  // (dynamic) set whatever mode was selected. We replicate that here.
  if (variantConfig.runMode === "non-streaming") {
    meta.mode = "non-streaming";
  } else if (variantConfig.runMode === "dynamic") {
    meta.mode = effectiveMode;
  }
  return meta;
}

function resolveEffectiveMode(variantConfig) {
  if (variantConfig.runMode === "streaming") return "streaming";
  if (variantConfig.runMode === "non-streaming") return "non-streaming";
  // dynamic: read the dropdown at run time, like the original gpt-5.4 file.
  return getSelectValue("noteProviderMode", "streaming").toLowerCase();
}

function makeGenerateNoteFn(variantKey) {
  const variantConfig = VARIANTS[variantKey];
  if (!variantConfig) {
    throw new Error(`Unknown OpenAI note generation variant: ${variantKey}`);
  }

  return async function generateNote() {
    const effectiveMode = resolveEffectiveMode(variantConfig);
    const streaming = effectiveMode !== "non-streaming";
    const runMeta = buildRunMeta(variantConfig, effectiveMode);

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

    const apiKey = requireSessionKey("openai_api_key", {
      onMissing: () => {
        noteTimer.stop("");
        app.finishNoteGeneration?.();
      }
    });

    if (!apiKey) {
      return;
    }

    const finalPromptText = buildStandardNotePrompt(promptText);
    const reasoningLevel = resolveReasoningLevel(variantConfig);
    const requestBody = buildRequestBody({
      model: variantConfig.model,
      finalPromptText,
      supplementaryWrapped,
      transcriptionText,
      streaming,
      reasoningLevel
    });

    try {
      const resp = await fetch("https://api.openai.com/v1/responses", {
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
          throw new Error(`OpenAI error ${resp.status}: ${errText}`);
        }

        const json = await resp.json();
        pushUsageFromNonStreaming(variantConfig, json);
        generatedNoteField.value = extractResponsesOutputText(json) || "";
      } else {
        await streamResponsesSse(resp, {
          signal: controller.signal,
          errorLabel: "OpenAI",
          onDelta: (textChunk) => {
            generatedNoteField.value += textChunk;
          },
          onDone: (finalEvent) => {
            pushUsageFromStreamingDone(variantConfig, finalEvent);
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
        callFinishNoteAbort(variantConfig, runMeta, generatedNoteField, noteTimer, noteTimerElement);
        return;
      }

      noteTimer.stop("");
      generatedNoteField.value = "Error generating note: " + error;
      app.finishNoteGeneration?.();
    }
  };
}

// -----------------------------------------------------------------------------
// Public init functions — one per pre-existing file
// -----------------------------------------------------------------------------
//
// Each of these mirrors what the corresponding old file's
// initNoteGeneration() did: bind the page's "Generate note" button to
// the variant-specific generate function. The thin shim files
// (notegeneration gpt-5.js, noteGeneration_gpt5_NS.js, etc.) re-export
// these under the legacy name `initNoteGeneration`.

function initGpt5Streaming() {
  bindGenerateNoteButton(makeGenerateNoteFn("gpt5-streaming"));
}

function initGpt5NonStreaming() {
  bindGenerateNoteButton(makeGenerateNoteFn("gpt5-non-streaming"));
}

function initGpt52Streaming() {
  bindGenerateNoteButton(makeGenerateNoteFn("gpt52-streaming"));
}

function initGpt52NonStreaming() {
  bindGenerateNoteButton(makeGenerateNoteFn("gpt52-non-streaming"));
}

function initGpt54() {
  bindGenerateNoteButton(makeGenerateNoteFn("gpt54"));
}

function initGpt55Streaming() {
  bindGenerateNoteButton(makeGenerateNoteFn("gpt55-streaming"));
}

function initGpt55NonStreaming() {
  bindGenerateNoteButton(makeGenerateNoteFn("gpt55-non-streaming"));
}

export {
  initGpt5Streaming,
  initGpt5NonStreaming,
  initGpt52Streaming,
  initGpt52NonStreaming,
  initGpt54,
  initGpt55Streaming,
  initGpt55NonStreaming
};
