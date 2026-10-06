import { registerWorkspaceDisposer } from './workspace-disposal.js';

// Per-Workspace, per-recording accounting. Word/token counters are unrelated.
// Soniox: https://soniox.com/docs/api-reference/other/get_usage_logs
// OpenAI: https://developers.openai.com/api/docs/models/gpt-transcribe
// Prices checked 6 October 2026. No extra transcription request is made.
const OPENAI_TRANSCRIBE_USD_PER_MINUTE = 0.0045;
const TEXT = {
  en: { estimated: 'Est. transcription cost', reported: 'Transcription cost', total: 'Total cost transcription + note' },
  no: { estimated: 'Estimert transkripsjonskostnad', reported: 'Transkripsjonskostnad', total: 'Total kostnad transkripsjon + notat' },
  sv: { estimated: 'Uppskattad transkriptionskostnad', reported: 'Transkriptionskostnad', total: 'Total kostnad transkription + anteckning' },
  de: { estimated: 'Geschätzte Transkriptionskosten', reported: 'Transkriptionskosten', total: 'Gesamtkosten Transkription + Notiz' },
  fr: { estimated: 'Coût estimé de transcription', reported: 'Coût de transcription', total: 'Coût total transcription + note' },
  it: { estimated: 'Costo stimato trascrizione', reported: 'Costo trascrizione', total: 'Costo totale trascrizione + nota' },
};

function amount(value) {
  if (!['number', 'string'].includes(typeof value) || (typeof value === 'string' && !value.trim())) return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function initRecordingCost() {
  if (window.__recordingCost) return window.__recordingCost;
  let recording = null;
  let note = null;
  let lookup = null;
  let disposed = false;
  const events = new window.AbortController();
  const uid = () => window.crypto.randomUUID();
  const words = () => TEXT[localStorage.getItem('siteLanguage') || document.getElementById('lang-select-transcribe')?.value] || TEXT.en;
  const dollars = n => '$' + n.toFixed(6);

  function render() {
    const t = words();
    // Keep the original UI until a complete recording has a usable cost.
    // Missing permission, pending logs and failed lookups add no visible row.
    const transcriptionUsd = recording?.complete && !recording.translator &&
      ['reported', 'estimated'].includes(recording.status) ? amount(recording.usd) : null;
    const cost = document.getElementById('transcriptionCost');
    if (cost) {
      cost.textContent = transcriptionUsd == null ? ''
        : ` · ${recording.status === 'reported' ? t.reported : t.estimated}: ${dollars(transcriptionUsd)} USD`;
    }
    const total = document.getElementById('totalRecordingNoteCost');
    if (total) {
      total.textContent = '';
      const noteUsd = amount(note?.usd);
      if (note?.finished && note.recordingId === recording?.id && transcriptionUsd != null && noteUsd != null) {
        total.textContent = `${t.total}: ${dollars(transcriptionUsd)} + ${dollars(noteUsd)} = ${dollars(transcriptionUsd + noteUsd)} USD`;
      }
    }
  }

  function changed() {
    render();
    window.dispatchEvent(new window.CustomEvent('recording-cost:changed'));
  }
  function cancelLookup() { lookup?.abort(); lookup = null; }
  function clear() {
    cancelLookup();
    recording = null;
    note = null;
    changed();
  }
  function start() {
    cancelLookup();
    note = null;
    recording = { id: uid(), startedAt: Date.now(), translator: window.__translator?.isEnabled?.() === true, complete: false, status: 'hidden', usd: null, requests: new Map() };
    changed();
  }
  function register({ sessionId, provider, model, baseUrl, apiKey }) {
    if (disposed || !recording || recording.id !== sessionId) return null;
    const reference = 'tn-' + uid(); // Opaque: never text, filenames, patient names or Workspace titles.
    recording.requests.set(reference, { provider, model, baseUrl, apiKey, succeeded: false, usd: null });
    return reference;
  }
  function update(sessionId, reference, data) {
    if (recording?.id !== sessionId) return;
    const request = recording.requests.get(reference);
    if (!request) return;
    if (data.succeeded != null) request.succeeded = data.succeeded === true;
    if ('usd' in data) request.usd = amount(data.usd);
  }
  function delay(ms, signal) {
    return new Promise((resolve, reject) => {
      const cancelled = () => { clearTimeout(timer); reject(new window.DOMException('Cancelled', 'AbortError')); };
      const timer = setTimeout(() => { signal.removeEventListener('abort', cancelled); resolve(); }, ms);
      signal.addEventListener('abort', cancelled, { once: true });
      if (signal.aborted) cancelled();
    });
  }
  async function fetchLogs(group, state, signal) {
    const found = new Map();
    let cursor = null;
    const endTime = new Date().toISOString();
    const startTime = new Date(state.startedAt - 60000).toISOString();
    if (Date.now() - state.startedAt >= 31 * 86400000) throw new Error('Usage window too long');
    // A fixed window and sort order are essential when paging this endpoint.
    for (let page = 0; page < 20; page++) {
      const url = new URL(group.baseUrl + '/usage-logs');
      url.searchParams.set('start_time', startTime);
      url.searchParams.set('end_time', endTime);
      url.searchParams.set('sort', 'end_time_desc');
      url.searchParams.set('limit', '1000');
      if (cursor) url.searchParams.set('cursor', cursor);
      const controller = new window.AbortController();
      const abort = () => controller.abort();
      signal.addEventListener('abort', abort, { once: true });
      const timeout = setTimeout(abort, 6000);
      try {
        if (signal.aborted) abort();
        const response = await window.fetch(url.href, {
          headers: { Authorization: `Bearer ${group.apiKey}` }, signal: controller.signal,
        });
        if (!response.ok) {
          const error = new Error('Usage logs unavailable');
          error.permanent = response.status === 401 || response.status === 403;
          throw error;
        }
        const result = await response.json();
        if (!Array.isArray(result.usage_logs)) throw new Error('Usage logs missing');
        for (const log of result.usage_logs) {
          if (!group.references.has(log.client_reference_id)) continue;
          if (!log.uuid || amount(log.cost_usd) == null) throw new Error('Incomplete usage cost');
          found.set(log.uuid, { reference: log.client_reference_id, usd: amount(log.cost_usd) });
        }
        cursor = result.next_page_cursor;
        if (!cursor) return found;
      } finally {
        clearTimeout(timeout);
        signal.removeEventListener('abort', abort);
      }
    }
    // Never report a partial page set as the total.
    throw new Error('Usage pagination limit reached');
  }
  async function finish() {
    const state = recording;
    if (!state || state.complete || disposed) return;
    state.complete = true;
    const requests = [...state.requests.values()];
    if (!requests.length || requests.some(r => !r.succeeded)) {
      state.status = 'unavailable';
      state.requests.forEach(r => { r.apiKey = null; });
      changed();
      return;
    }
    if (requests.every(r => r.provider === 'openai')) {
      state.status = requests.every(r => amount(r.usd) != null) ? 'estimated' : 'unavailable';
      state.usd = state.status === 'estimated' ? requests.reduce((sum, r) => sum + r.usd, 0) : null;
      changed();
      return;
    }
    state.status = 'pending';
    changed();
    const controller = new window.AbortController();
    const budget = setTimeout(() => controller.abort(), 25000);
    lookup = controller;
    const groups = [];
    for (const [reference, request] of state.requests) {
      if (request.provider !== 'soniox') continue;
      let group = groups.find(g => g.apiKey === request.apiKey && g.baseUrl === request.baseUrl);
      if (!group) { group = { apiKey: request.apiKey, baseUrl: request.baseUrl, references: new Set() }; groups.push(group); }
      group.references.add(reference);
    }
    try {
      for (const wait of [0, 1000, 2500, 5000]) {
        if (wait) await delay(wait, controller.signal);
        if (controller.signal.aborted) return;
        let sum = 0;
        let complete = groups.length > 0 && requests.every(r => r.provider === 'soniox');
        try {
          for (const group of groups) {
            const logs = await fetchLogs(group, state, controller.signal);
            const matched = new Set([...logs.values()].map(log => log.reference));
            if ([...group.references].some(ref => !matched.has(ref))) complete = false;
            sum += [...logs.values()].reduce((n, log) => n + log.usd, 0);
          }
          if (complete && Number.isFinite(sum)) { state.usd = sum; state.status = 'reported'; break; }
        } catch (error) {
          if (controller.signal.aborted) return;
          if (error.permanent) break; // Key needs Soniox "Usage and limits" permission.
        }
      }
      if (state.status !== 'reported') state.status = 'unavailable';
    } catch (_) {
      if (state.status !== 'reported') state.status = 'unavailable';
    } finally {
      clearTimeout(budget);
      state.requests.forEach(r => { r.apiKey = null; });
      groups.forEach(g => { g.apiKey = null; });
      if (lookup === controller) lookup = null;
      if (state.status === 'pending') state.status = 'unavailable';
      if (!disposed && recording === state) changed();
    }
  }
  function noteStarted() {
    note = recording && !recording.translator ? { recordingId: recording.id, usd: null, finished: false } : null;
    changed();
  }
  function noteFinished(event) {
    if (!note || note.recordingId !== recording?.id) return;
    if (event.detail?.aborted || event.detail?.status === 'aborted' || event.detail?.status === 'error') { note = null; changed(); return; }
    note.usd = amount(window.__app?.getLastNoteUsageCostSnapshot?.()?.estimatedUsd);
    note.finished = true;
    changed();
  }
  function captureDraft() {
    if (!recording?.complete) return null;
    // Session draft only: no API keys, request references, audio or text.
    return { status: recording.status, usd: amount(recording.usd), translator: recording.translator === true, note: note?.finished && note.recordingId === recording.id ? { usd: amount(note.usd) } : null };
  }
  function restoreDraft(value) {
    cancelLookup();
    note = null;
    recording = null;
    if (value && ['reported', 'estimated', 'unavailable', 'pending'].includes(value.status)) {
      const usd = amount(value.usd);
      const known = usd != null && ['reported', 'estimated'].includes(value.status);
      recording = { id: uid(), translator: value.translator === true, complete: true, requests: new Map(), status: known ? value.status : 'unavailable', usd: known ? usd : null };
      if (value.note) note = { recordingId: recording.id, finished: true, usd: amount(value.note.usd) };
    }
    changed();
  }
  const api = { getSessionId: () => recording?.id, register, update, finish, noteStarted, captureDraft, restoreDraft, clear };
  window.__recordingCost = api;
  window.addEventListener('recording:lifecycle', ({ detail }) => {
    if (detail.phase === 'starting') start();
    if (detail.phase === 'aborted' || detail.phase === 'aborting' || (detail.phase === 'error' && detail.action === 'start')) clear();
  }, { signal: events.signal });
  for (const name of ['transcription:finished', 'translation:finished']) {
    window.addEventListener(name, () => { void finish(); }, { signal: events.signal });
  }
  window.addEventListener('note-generation-finished', noteFinished, { signal: events.signal });
  window.addEventListener('note:finished', noteFinished, { signal: events.signal });
  document.getElementById('transcription')?.addEventListener('input', () => {
    if (recording?.complete && !document.getElementById('transcription').value.trim() && !window.__translator?.isEnabled?.()) clear();
  }, { signal: events.signal });
  document.getElementById('clearTranscriptionButton')?.addEventListener('click', () => {
    if (recording?.complete) clear();
  }, { signal: events.signal });
  document.getElementById('transcription')?.addEventListener('paste', event => {
    const field = event.currentTarget;
    if (recording?.complete && field.selectionStart === 0 && field.selectionEnd === field.value.length) clear();
  }, { signal: events.signal });
  document.getElementById('generatedNote')?.addEventListener('input', event => {
    if (note?.finished && !event.currentTarget.value.trim()) { note = null; changed(); }
  }, { signal: events.signal });
  document.getElementById('lang-select-transcribe')?.addEventListener('change', render, { signal: events.signal });
  window.addEventListener('transcribe-language-updated', render, { signal: events.signal });
  window.addEventListener('storage', event => { if (event.key === 'siteLanguage') render(); }, { signal: events.signal });
  registerWorkspaceDisposer(() => { disposed = true; cancelLookup(); events.abort(); recording?.requests.forEach(r => { r.apiKey = null; }); }, { scope: 'window' });
  render();
  return api;
}

export function getRecordingCostSessionId() { return initRecordingCost().getSessionId(); }
export function registerRecordingCostRequest(options) { return initRecordingCost().register(options); }
export function updateRecordingCostRequest(sessionId, reference, data) { initRecordingCost().update(sessionId, reference, data); }
export function recordOpenAiTranscriptionCost(sessionId, reference, model, result, wavSeconds) {
  // gpt-transcribe is duration-billed. usage.seconds takes precedence over
  // response.duration or the actual uploaded WAV duration; never use wall time.
  let seconds = amount(result?.usage?.type === 'duration' ? result.usage.seconds : null);
  if (seconds == null) seconds = amount(result?.duration);
  if (seconds == null) seconds = amount(wavSeconds);
  const usd = model === 'gpt-transcribe' && seconds != null ? seconds / 60 * OPENAI_TRANSCRIBE_USD_PER_MINUTE : null;
  updateRecordingCostRequest(sessionId, reference, { succeeded: true, usd });
}
