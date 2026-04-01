// LemonfoxTXT.js

import {
  beginNoteRun,
  bindGenerateNoteButton,
  buildStandardNotePrompt,
  finishNoteAbort,
  requireSessionKey,
  resolveCommonNoteInputs,
  startNoteTimer,
  streamChatCompletionsSse
} from "./core/note-runner.js";

const RUN_META = {
  provider: "lemonfox",
  model: "chat-model"
};

const LEMONFOX_CHAT_MODEL = "llama-70b-chat";
const LEMONFOX_CHAT_URL = "https://eu-api.lemonfox.ai/v1/chat/completions";

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

  const apiKey = requireSessionKey("lemonfox_api_key", {
    onMissing: () => {
      noteTimer.stop("");
      app.finishNoteGeneration?.();
    }
  });

  if (!apiKey) {
    return;
  }

  const finalPromptText = buildStandardNotePrompt(promptText);

  try {
    const response = await fetch(LEMONFOX_CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: LEMONFOX_CHAT_MODEL,
        messages: [
          { role: "system", content: finalPromptText },
          { role: "user", content: `${supplementaryWrapped}${transcriptionText}` }
        ],
        stream: true
      }),
      signal: controller.signal
    });

    await streamChatCompletionsSse(response, {
      signal: controller.signal,
      errorLabel: "Lemonfox",
      onDelta: (textChunk) => {
        generatedNoteField.value += textChunk;
      },
      onDone: () => {},
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

    if (generatedNoteField) {
      generatedNoteField.value = "Error generating note: " + error;
    }

    app.finishNoteGeneration?.();
  }
}

function initNoteGeneration() {
  bindGenerateNoteButton(generateNote);
}

export { initNoteGeneration };
