// Gemini3.js

import {
  beginNoteRun,
  bindGenerateNoteButton,
  finishNoteAbort,
  getSelectValue,
  pushNormalizedNoteUsage,
  requireSessionKey,
  resolveCommonNoteInputs,
  startNoteTimer,
  streamGeminiSse
} from "./core/note-runner.js";

const RUN_META = {
  provider: "gemini3",
  model: "gemini-3-pro-preview"
};

function buildGeminiPrompt({ promptText, supplementaryRaw, transcriptionText }) {
  const baseInstruction = [
    "Do not use bold text. Do not use asterisks (*) or Markdown formatting anywhere in the output.",
    "All headings should be plain text with a colon."
  ].join("\n");

  const sections = [
    promptText || "",
    baseInstruction
  ];

  if (supplementaryRaw) {
    sections.push(`Tilleggsopplysninger(brukes som kontekst):"${supplementaryRaw}"`);
  }

  sections.push(`TRANSCRIPTION:\n${transcriptionText}`);
  return sections.filter(Boolean).join("\n\n");
}

function makeGeminiUrl(apiVersion, apiKey) {
  return `https://generativelanguage.googleapis.com/${apiVersion}/models/${RUN_META.model}:streamGenerateContent?alt=sse&key=${encodeURIComponent(apiKey)}`;
}

function logGeminiUsage(usage) {
  if (!usage) {
    console.log("[Gemini] Token usage: (not provided in stream)");
    return;
  }

  const {
    promptTokenCount,
    candidatesTokenCount,
    thoughtsTokenCount,
    toolUsePromptTokenCount,
    cachedContentTokenCount,
    totalTokenCount
  } = usage;

  const inputTokens = Number(promptTokenCount ?? 0);
  const outputTokens = Number(candidatesTokenCount ?? 0);
  const reasoningTokens =
    typeof thoughtsTokenCount === "number" ? Number(thoughtsTokenCount) : 0;
  const toolTokens =
    typeof toolUsePromptTokenCount === "number"
      ? Number(toolUsePromptTokenCount)
      : 0;

  const outputIncludingReasoning =
    typeof thoughtsTokenCount === "number"
      ? outputTokens + reasoningTokens
      : null;

  const computedTotal = inputTokens + toolTokens + outputTokens + reasoningTokens;

  console.log("[Gemini] usageMetadata:", usage);
  console.log(
    `[Gemini] input(promptTokenCount)=${promptTokenCount ?? "?"}` +
      (typeof cachedContentTokenCount === "number"
        ? ` (cached=${cachedContentTokenCount})`
        : "") +
      ` | output(candidatesTokenCount)=${candidatesTokenCount ?? "?"}` +
      ` | reasoning(thoughtsTokenCount)=${typeof thoughtsTokenCount === "number" ? thoughtsTokenCount : "?"}` +
      (typeof toolUsePromptTokenCount === "number"
        ? ` | toolUsePromptTokenCount=${toolUsePromptTokenCount}`
        : "") +
      ` | output+reasoning=${outputIncludingReasoning !== null ? outputIncludingReasoning : "?"}` +
      ` | totalTokenCount=${totalTokenCount ?? "?"}` +
      (typeof totalTokenCount === "number" ? ` (computed=${computedTotal})` : "")
  );
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
    supplementaryRaw,
    generatedNoteField,
    noteTimerElement
  } = common;

  generatedNoteField.value = "";
  const noteTimer = startNoteTimer(noteTimerElement);

  const apiKey = requireSessionKey("gemini_api_key", {
    alertText: "No Gemini API key available for note generation.",
    onMissing: () => {
      noteTimer.stop("");
      app.finishNoteGeneration?.();
    }
  });

  if (!apiKey) {
    return;
  }

  const finalPromptText = buildGeminiPrompt({
    promptText,
    supplementaryRaw,
    transcriptionText
  });

  const geminiThinkingLevel = getSelectValue("geminiReasoning", "low");

  try {
    let response = await fetch(makeGeminiUrl("v1beta", apiKey), {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: finalPromptText
              }
            ]
          }
        ],
        generationConfig: {
          thinkingConfig: {
            thinkingLevel: geminiThinkingLevel
          }
        }
      }),
      signal: controller.signal
    });

    if (response.status === 404) {
      console.warn("v1beta streamGenerateContent returned 404, trying v1alpha");

      response = await fetch(makeGeminiUrl("v1alpha", apiKey), {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: finalPromptText
                }
              ]
            }
          ],
          generationConfig: {
            thinkingConfig: {
              thinkingLevel: geminiThinkingLevel
            }
          }
        }),
        signal: controller.signal
      });
    }

    if (!response.ok || !response.body) {
      const text = await response.text().catch(() => "");
      throw new Error("Gemini stream HTTP " + response.status + ": " + text);
    }

    let finalUsage = null;

    await streamGeminiSse(response.body, {
      signal: controller.signal,
      onDelta: (textChunk) => {
        generatedNoteField.value += textChunk;
      },
      onDone: (usage) => {
        finalUsage = usage || null;
      },
      onError: (error) => {
        throw error;
      }
    });

    noteTimer.stop("Text generation completed!");
    app.emitNoteFinished?.(RUN_META);

    logGeminiUsage(finalUsage);

    pushNormalizedNoteUsage({
      providerKey: RUN_META.provider,
      modelId: RUN_META.model,
      usage: finalUsage
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      finishNoteAbort({
        generatedNoteField,
        noteTimer,
        runMeta: RUN_META
      });
      return;
    }

    console.error("Gemini streaming error:", error);
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
