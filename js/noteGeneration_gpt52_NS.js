// noteGeneration_gpt52_NS.js

import {
  beginNoteRun,
  bindGenerateNoteButton,
  buildStandardNotePrompt,
  extractResponsesOutputText,
  finishNoteAbort,
  getSelectValue,
  requireSessionKey,
  resolveCommonNoteInputs,
  startNoteTimer,
  pushNormalizedNoteUsage
} from "./core/note-runner.js";
import { normalizeOpenAiReasoning } from "./core/provider-registry.js";

const RUN_META = {
  provider: "openai",
  model: "gpt-5.2",
  mode: "non-streaming"
};

function buildRequestBody({ finalPromptText, supplementaryWrapped, transcriptionText, reasoningLevel }) {
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
  const reasoningLevel = normalizeOpenAiReasoning(
    getSelectValue("gpt5Reasoning", "none")
  );
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
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => "");
      throw new Error(`OpenAI error ${resp.status}: ${errText}`);
    }

    const json = await resp.json();
    const usage = json?.usage ?? null;

    pushNormalizedNoteUsage({
      providerKey: "openai",
      modelId: RUN_META.model,
      usage,
      meta: {
        reasoningTokens: usage?.output_tokens_details?.reasoning_tokens ?? 0
      }
    });

    generatedNoteField.value = extractResponsesOutputText(json) || "";
    noteTimer.stop("Text generation completed!");
    app.emitNoteFinished?.(RUN_META);
  } catch (error) {
    if (error?.name === "AbortError") {
      finishNoteAbort({
        runMeta: { ...RUN_META, aborted: true },
        generatedNoteField,
        noteTimerElement,
        noteTimer
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
