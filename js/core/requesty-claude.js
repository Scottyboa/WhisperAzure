// Native Claude Messages through Requesty EU. This preserves Haiku 5.5's
// adaptive thinking / effort controls instead of the legacy budget mapping
// used by Requesty's OpenAI-compatible Chat Completions endpoint.
// https://docs.requesty.ai/api-reference/endpoint/messages-create
// https://platform.claude.com/docs/en/models/haiku-5-5/whats-new-haiku-5-5
const REQUESTY_EU_MESSAGES_URL = 'https://router.eu.requesty.ai/v1/messages';

function throwIfAborted(signal) {
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
}

function extractText(content) {
  return (Array.isArray(content) ? content : [])
    .filter((block) => block?.type === 'text')
    .map((block) => block.text || '').join('');
}

function mergeUsage(previous, next) {
  if (!next || typeof next !== 'object') return previous;
  // message_delta counters are cumulative, not increments. Keep the input
  // count from message_start when the final event contains only output/cost.
  const merged = { ...previous, ...next };
  for (const field of ['input_tokens_details', 'output_tokens_details', 'completion_tokens_details']) {
    if (previous?.[field] || next[field]) {
      merged[field] = { ...previous?.[field], ...next[field] };
    }
  }
  return merged;
}

async function readMessageStream(response, { signal, onDelta }) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '', text = '', usage = null, stopped = false;
  const cancelReader = () => { void reader.cancel().catch(() => {}); };
  signal?.addEventListener('abort', cancelReader, { once: true });

  const consumeFrame = (frame) => {
    throwIfAborted(signal);
    const data = frame.split(/\r?\n/)
      .filter((line) => line.startsWith('data:'))
      .map((line) => line.slice(5).trimStart()).join('\n');
    if (!data) return;
    const event = JSON.parse(data);
    if (event.type === 'error') {
      throw new Error(`Requesty: ${event.error?.message || 'Claude streaming error'}`);
    }
    if (event.type === 'message_start') usage = mergeUsage(usage, event.message?.usage);
    else if (event.type === 'message_delta') usage = mergeUsage(usage, event.usage);
    else if (event.type === 'message_stop') {
      usage = mergeUsage(usage, event.usage);
      stopped = true;
    }
    const delta = event.type === 'content_block_delta' && event.delta?.type === 'text_delta'
      ? event.delta.text
      : event.type === 'content_block_start' && event.content_block?.type === 'text'
        ? event.content_block.text : '';
    // Thinking/signature blocks must never become part of the clinical note.
    if (delta) { text += delta; onDelta(delta); }
  };

  try {
    throwIfAborted(signal);
    while (!stopped) {
      throwIfAborted(signal);
      const { value, done } = await reader.read();
      throwIfAborted(signal);
      buffer += done ? decoder.decode() : decoder.decode(value, { stream: true });
      let separator;
      while (!stopped && (separator = /\r?\n\r?\n/.exec(buffer))) {
        const frame = buffer.slice(0, separator.index);
        buffer = buffer.slice(separator.index + separator[0].length);
        consumeFrame(frame);
      }
      if (done) {
        if (!stopped && buffer.trim()) consumeFrame(buffer);
        break;
      }
    }
    if (!stopped) throw new Error('Requesty: Claude stream ended before completion. Please retry.');
    return { text, usage };
  } finally {
    signal?.removeEventListener('abort', cancelReader);
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

export async function generateRequestyClaudeMessage({
  apiKey, model, system, userText, reasoningLevel = 'medium',
  streaming = true, signal, onDelta = () => {}
}) {
  const effort = ['low', 'medium', 'high'].includes(reasoningLevel) ? reasoningLevel : 'medium';
  const body = {
    model,
    system,
    messages: [{ role: 'user', content: userText }],
    // Haiku's published output limit includes thinking; no small fixed budget
    // that could consume the entire response before the note is produced.
    max_tokens: 128_000,
    stream: streaming,
    thinking: { type: reasoningLevel === 'off' ? 'disabled' : 'adaptive' },
    output_config: { effort }
  };
  throwIfAborted(signal);
  const response = await fetch(REQUESTY_EU_MESSAGES_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify(body), signal
  });
  if (!response.ok || (streaming && !response.body)) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`Requesty error ${response.status}: ${errorText}`);
  }
  if (streaming) return readMessageStream(response, { signal, onDelta });
  const result = await response.json();
  throwIfAborted(signal);
  if (result.error) throw new Error(`Requesty: ${result.error.message || 'Claude response error'}`);
  return { text: extractText(result.content), usage: result.usage ?? null };
}
