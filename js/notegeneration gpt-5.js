// notegeneration gpt-5.js

import {
  beginNoteRun,
  bindGenerateNoteButton,
  buildStandardNotePrompt,
  finishNoteAbort,
  getSelectValue,
  getSessionStorageValue,
  pushNormalizedNoteUsage,
  requireSessionKey,
  resolveCommonNoteInputs,
  startNoteTimer,
  streamResponsesSse
} from "./core/note-runner.js";

const RUN_META = {
  provider: "openai",
  model: "gpt-5.1"
};

function buildRequestBody({
  finalPromptText,
  supplementaryWrapped,
  transcriptionText,
  reasoningLevel
}) {
  const requestBody = {
    model: RUN_META.model,
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
    stream: true,
    text: {
      verbosity: "medium"
    }
  };

  if (reasoningLevel && reasoningLevel !== "none") {
    requestBody.reasoning = {
      effort: reasoningLevel
    };
  }

  return requestBody;
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
  const reasoningLevel = getSelectValue("gpt5Reasoning", "low");
  const requestBody = buildRequestBody({
    finalPromptText,
    supplementaryWrapped,
    transcriptionText,
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

    await streamResponsesSse(resp, {
      signal: controller.signal,
      errorLabel: "OpenAI",
      onDelta: (textChunk) => {
        generatedNoteField.value += textChunk;
      },
      onDone: (finalEvent) => {
        const usage = finalEvent?.response?.usage ?? finalEvent?.usage ?? null;
        const reasoningTokens = usage?.output_tokens_details?.reasoning_tokens ?? 0;

        if (usage) {
          pushNormalizedNoteUsage({
            providerKey: (getSessionStorageValue("note_provider", "gpt5") || "gpt5").trim(),
            modelId: RUN_META.model,
            usage,
            meta: { reasoningTokens }
          });
        }
      },
      onError: (error) => {
        throw error;
      }
    });

    noteTimer.stop("Text generation completed!");
    app.emitNoteFinished?.(RUN_META);
  } catch (error) {
    if (error?.name === "AbortError") {
      finishNoteAbort({
        generatedNoteField,
        noteTimer,
        runMeta: RUN_META
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
