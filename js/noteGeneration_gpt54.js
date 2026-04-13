// noteGeneration_gpt54.js
// Combined GPT-5.4 note generation module supporting both streaming and non-streaming
// via the existing #noteProviderMode dropdown.

import {
  beginNoteRun,
  bindGenerateNoteButton,
  buildStandardNotePrompt,
  extractResponsesOutputText,
  finishNoteAbort,
  getSelectValue,
  pushNormalizedNoteUsage,
  requireSessionKey,
  resolveCommonNoteInputs,
  startNoteTimer,
  streamResponsesSse
} from "./core/note-runner.js";
import { normalizeOpenAiReasoning } from "./core/provider-registry.js";

const MODEL_ID = "gpt-5.4";

function getSelectedMode() {
  return getSelectValue("noteProviderMode", "streaming").toLowerCase();
}

function buildRequestBody({
  finalPromptText,
  supplementaryWrapped,
  transcriptionText,
  streaming,
  reasoningLevel
}) {
  const requestBody = {
    model: MODEL_ID,
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

function pushOpenAiUsageToUi(usage) {
  if (!usage) {
    return;
  }

  pushNormalizedNoteUsage({
    providerKey: "openai",
    modelId: MODEL_ID,
    usage,
    meta: {
      reasoningTokens: usage.output_tokens_details?.reasoning_tokens ?? 0
    }
  });
}

async function generateNote() {
  const mode = getSelectedMode();
  const runMeta = {
    provider: "openai",
    model: MODEL_ID,
    mode
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
  const reasoningLevel = normalizeOpenAiReasoning(
    getSelectValue("gpt5Reasoning", "none")
  );
  const requestBody = buildRequestBody({
    finalPromptText,
    supplementaryWrapped,
    transcriptionText,
    streaming: mode !== "non-streaming",
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

    if (mode === "non-streaming") {
      if (!resp.ok) {
        const errText = await resp.text().catch(() => "");
        throw new Error(`OpenAI error ${resp.status}: ${errText}`);
      }

      const json = await resp.json();
      generatedNoteField.value = extractResponsesOutputText(json);
      pushOpenAiUsageToUi(json?.usage);
    } else {
      await streamResponsesSse(resp, {
        signal: controller.signal,
        errorLabel: "OpenAI",
        onDelta: (textChunk) => {
          generatedNoteField.value += textChunk;
        },
        onDone: (finalEvent) => {
          const usage = finalEvent?.response?.usage ?? finalEvent?.usage;
          pushOpenAiUsageToUi(usage);
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
    generatedNoteField.value = "Error generating note: " + error;
    app.finishNoteGeneration?.();
  }
}

function initNoteGeneration() {
  bindGenerateNoteButton(generateNote);
}

export { initNoteGeneration };
