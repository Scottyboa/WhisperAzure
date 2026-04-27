// soniox.js
//
// Unified Soniox speech-to-text recording module — replaces the three
// previous files (SONIOX_UPDATE.js, SONIOX_UPDATE_dia.js, SONIOX_UPDATE_rt.js).
//
// Three modes are supported, selected at initRecording() time from the
// current sessionStorage state:
//
//   * 'async-plain'    — REST upload + async transcription, plain text
//                        (transcribe_provider === 'soniox',
//                         soniox_speaker_labels !== 'on')
//
//   * 'async-diarized' — REST upload + async transcription, with speaker
//                        labels rendered as "Speaker 1: …" / "Speaker 2: …"
//                        (transcribe_provider === 'soniox',
//                         soniox_speaker_labels === 'on')
//
//   * 'realtime'       — WebSocket streaming, finals-only output
//                        (transcribe_provider === 'soniox_rt')
//
// Most state is shared: API key, region URL, completion timer, error
// flagging, transcript freezing rules, helpers, etc. Mode-specific behavior
// is concentrated in (a) the audio capture / sending pipeline and (b) the
// few API parameters that actually differ (speaker diarization, model
// choice, transport).
//
// Cross-version teardown is handled via a single window registry key
// (__sonioxUIAbort) so re-initialization (e.g. switching speaker labels
// off/on, or switching between async and realtime mid-session) cleanly
// disposes of the previous incarnation.

import {
  createRecordingUiHelpers,
  flushPendingVadSegmentsGuarded,
  installSafeRecordingLoadStop,
} from './core/recording-runner.js';

// ════════════════════════════════════════════════════════════════════════════
// SHARED — logging, constants, helpers
// ════════════════════════════════════════════════════════════════════════════

const DEBUG = true;
function logDebug(message, ...rest) {
  if (DEBUG) console.debug(new Date().toISOString(), '[DEBUG][Soniox]', message, ...rest);
}
function logInfo(message, ...rest) {
  console.info(new Date().toISOString(), '[INFO][Soniox]', message, ...rest);
}
function logError(message, ...rest) {
  console.error(new Date().toISOString(), '[ERROR][Soniox]', message, ...rest);
}

// Same medical/dictation context string used across all three modes so
// recognition behavior is consistent regardless of which transport is
// active.
const SONIOX_CONTEXT_TEXT =
  'Doctor-patient consultation. Mostly Norwegian; sometimes English. ' +
  'Transcribe clearly. Exclude filler words and false starts. Do not paraphrase or summarize.';

const DEFAULT_LANGUAGE_HINTS = ['no', 'en'];

// ── Realtime constants ──────────────────────────────────────────────────────
const SONIOX_RT_MODEL = 'stt-rt-v4';
const SONIOX_RT_SAMPLE_RATE = 16000;
const SONIOX_RT_NUM_CHANNELS = 1;

// ── Async constants ─────────────────────────────────────────────────────────
const SONIOX_ASYNC_MODEL = 'stt-async-v4';
// Plain mode flushes chunks every ~90s of accumulated speech. Diarized
// mode uses a deliberately huge value (~2h) so chunks are only ever
// flushed by Pause/Stop — speaker IDs are local to a chunk, so flushing
// mid-conversation would reshuffle "Speaker 1" / "Speaker 2" assignments.
const ASYNC_PLAIN_MIN_CHUNK_SEC = 90;
const ASYNC_DIARIZED_MIN_CHUNK_SEC = 7200;
const ASYNC_MIN_CHUNK_DURATION_MS = 120000; // 120s; legacy guard for scheduleChunk
const ASYNC_VAD_THRESHOLD = 0.005;          // RMS gate (legacy, unused but kept)
const ASYNC_SILENCE_DURATION_MS = 2000;     // ms of silence to close a chunk

// ── Optional Soniox-side cleanup on every Start (async only) ────────────────
// Deletes ALL transcriptions and files visible to the API key — not just
// ones from this page. This is intentional: it keeps the user's Soniox
// account from accumulating unused artifacts. Realtime sessions don't
// create REST resources, so this never runs in realtime mode.
const AUTO_CLEAN_ON_START = true;

// ── Region-aware endpoint helpers ───────────────────────────────────────────
function getAPIKey() {
  return sessionStorage.getItem('user_api_key');
}

function getSonioxRestBase() {
  const region = (sessionStorage.getItem('soniox_region') || 'eu').toLowerCase();
  return region === 'eu'
    ? 'https://api.eu.soniox.com/v1'
    : 'https://api.soniox.com/v1';
}

function getSonioxRealtimeUrl() {
  const region = (sessionStorage.getItem('soniox_region') || 'eu').toLowerCase();
  return region === 'eu'
    ? 'wss://stt-rt.eu.soniox.com/transcribe-websocket'
    : 'wss://stt-rt.soniox.com/transcribe-websocket';
}

// ── PCM / WAV helpers (used by async chunking AND realtime streaming) ──────
function floatTo16BitPCM(input) {
  const output = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    let s = Math.max(-1, Math.min(1, input[i]));
    output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return output;
}

function encodeWAV(samples, sampleRate, numChannels) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  function writeString(offset, string) {
    for (let i = 0; i < string.length; i++) view.setUint8(offset + i, string.charCodeAt(i));
  }
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * 2, true);
  view.setUint16(32, numChannels * 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, samples.length * 2, true);
  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    view.setInt16(offset, samples[i], true);
  }
  return new Blob([view], { type: 'audio/wav' });
}

function formatTime(ms) {
  const totalSec = Math.floor(ms / 1000);
  if (totalSec < 60) return totalSec + ' sec';
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  return minutes + ' min' + (seconds > 0 ? ' ' + seconds + ' sec' : '');
}

// fetchWithTimeout — adds a per-request timeout while still honoring an
// optional caller-supplied AbortSignal (e.g. a session abort controller).
async function fetchWithTimeout(resource, options = {}, timeoutMs = 30000) {
  const timeoutController = new AbortController();
  const id = setTimeout(() => timeoutController.abort(), timeoutMs);

  const callerSignal = options?.signal;
  let onAbort = null;
  if (callerSignal) {
    onAbort = () => { try { timeoutController.abort(); } catch (_) {} };
    if (callerSignal.aborted) onAbort();
    else callerSignal.addEventListener('abort', onAbort, { once: true });
  }

  try {
    const { signal: _ignored, ...rest } = options || {};
    const response = await fetch(resource, { ...rest, signal: timeoutController.signal });
    if (response.status === 401 || response.status === 403) {
      updateStatusMessage('Soniox: Unauthorized – check your API key or region.', 'red');
    }
    return response;
  } finally {
    clearTimeout(id);
    if (callerSignal && onAbort) {
      try { callerSignal.removeEventListener('abort', onAbort); } catch (_) {}
    }
  }
}

// ════════════════════════════════════════════════════════════════════════════
// SHARED — mutable state
// ════════════════════════════════════════════════════════════════════════════

// The mode chosen at the most recent initRecording() call. All handlers
// read this to branch their behavior.
let activeMode = 'async-plain'; // 'async-plain' | 'async-diarized' | 'realtime'

// ── Mic / audio graph (used by all modes; fields used vary) ─────────────────
let mediaStream = null;
let audioReader = null;

// Realtime-only audio graph
let audioContext = null;
let audioSourceNode = null;
let audioWorkletNode = null;

// ── Async-only state (Silero VAD pipeline + chunk queue) ────────────────────
let sileroVAD = null;
let pendingVADChunks = [];
let pendingVADLock = false;
let pendingVADLastFlushToken = 0;

let recordingActive = false;
let processedAnyAudioFrames = false;
let chunkNumber = 1;
let chunkStartTime = 0;
let lastSpeechTime = 0;
let chunkTimeoutId = null;

let chunkProcessingLock = false;
let pendingStop = false;
let finalChunkProcessed = false;
let audioFrames = [];

let transcriptChunks = {}; // { chunkNumber: text }
let transcriptionQueue = []; // [{ sessionId, signal, chunkNum, wavBlob }]
let isProcessingQueue = false;
let processingQueueSessionId = null;
let enqueuedChunks = 0;
let expectedChunks = 0;

// ── Realtime-only state (WebSocket pipeline) ────────────────────────────────
let ws = null;
let configSent = false;
let pendingAudioQueue = []; // ArrayBuffer[] chunks queued before WS open
let finalTranscriptRT = ''; // final-only running transcript for realtime
// True once the server has sent {"finished": true}, meaning all final tokens
// for the closed stream have been delivered. Used by the Stop handler to
// know when it's safe to finalize the UI without losing the tail.
let serverFinished = false;
// True once the server has emitted the "<fin>" marker token in response
// to our {"type":"finalize"} control message. Indicates that all
// previously-pending non-final tokens have been finalized and delivered.
let serverFinalized = false;

// ── Shared session/control state ────────────────────────────────────────────
let groupId = null;
let manualStop = false;
let recordingPaused = false;
let transcriptFrozen = false;
let transcriptionError = false;
let stopInProgress = false; // debounce guard for the Stop button

// Completion timer
let completionTimerInterval = null;
let completionTimerRunning = false;
let completionStartTime = 0;

// Per-session abort controller (covers REST fetches and realtime).
let sessionAbortController = new AbortController();

// ════════════════════════════════════════════════════════════════════════════
// SHARED — UI helpers
// ════════════════════════════════════════════════════════════════════════════

const {
  updateStatusMessage,
  setAbortButtonDisabled,
  setStopPauseDisabled,
  setRecordingControlsIdle,
  stopMicrophone,
} = createRecordingUiHelpers({
  logInfo,
  getMediaStream: () => mediaStream,
  setMediaStream: (value) => { mediaStream = value; },
  getAudioReader: () => audioReader,
  setAudioReader: (value) => { audioReader = value; },
});

// canShowRecordingStatus gates VAD callbacks so stale callbacks arriving
// after a terminal action don't buffer audio or update the UI. It does
// NOT check stopInProgress: during stop, sileroVAD.pause() fires one
// final onSpeechEnd (via submitUserSpeechOnPause) carrying the tail of
// the last utterance — rejecting it here would truncate the transcript
// by a sentence. The stop handler instead sets manualStop = true AFTER
// sileroVAD.pause() has resolved, which protects against any later
// callbacks while still preserving that single intentional one.
function canShowRecordingStatus() {
  return !manualStop && !transcriptFrozen && !recordingPaused;
}

// ── Completion timer ────────────────────────────────────────────────────────
function startCompletionTimer() {
  if (completionTimerInterval) return;
  completionStartTime = Date.now();
  completionTimerRunning = true;
  completionTimerInterval = setInterval(() => {
    const el = document.getElementById('transcribeTimer');
    if (el) el.innerText = 'Completion Timer: ' + formatTime(Date.now() - completionStartTime);
  }, 1000);
}

function freezeCompletionTimer() {
  if (completionTimerInterval) {
    clearInterval(completionTimerInterval);
    completionTimerInterval = null;
  }
  completionTimerRunning = false;
  // do NOT reset text — it should freeze on final value
}

function resetCompletionTimerDisplay() {
  freezeCompletionTimer();
  const el = document.getElementById('transcribeTimer');
  if (el) el.innerText = 'Completion Timer: 0 sec';
}

// Write to the transcription element. Use .value for textareas, fall back
// to .textContent for other element types so the merge stays robust if the
// markup ever changes.
function writeTranscriptionElement(text) {
  const el = document.getElementById('transcription');
  if (!el) return;
  if ('value' in el) el.value = text;
  else el.textContent = text;
}

// ════════════════════════════════════════════════════════════════════════════
// ASYNC MODE — Soniox REST helpers
// ════════════════════════════════════════════════════════════════════════════

// Best-effort cleanup of *all* transcriptions and files visible to the
// API key. Same behavior as the previous standalone modules.
async function cleanupSonioxAll() {
  if (!AUTO_CLEAN_ON_START) {
    logDebug('[SonioxCleanup] Skipped: AUTO_CLEAN_ON_START=false');
    return;
  }
  const apiKey = getAPIKey();
  if (!apiKey) {
    logDebug('[SonioxCleanup] Skipped: no API key present');
    return;
  }

  const hdrs = { Authorization: `Bearer ${apiKey}` };
  const base = getSonioxRestBase();

  logInfo('[SonioxCleanup] Starting full cleanup…');
  try {
    const tResp = await fetchWithTimeout(`${base}/transcriptions`, { headers: hdrs }, 30000);
    if (tResp.ok) {
      const tJson = await tResp.json().catch(() => ({}));
      const ts = Array.isArray(tJson?.transcriptions) ? tJson.transcriptions : [];
      logInfo(`[SonioxCleanup] Found ${ts.length} transcriptions`);
      for (const t of ts) {
        try {
          await fetchWithTimeout(`${base}/transcriptions/${t.id}`, { method: 'DELETE', headers: hdrs }, 30000);
          logDebug('[SonioxCleanup] deleted transcription:', t.id);
        } catch (e) {
          logDebug('[SonioxCleanup] failed deleting transcription', t?.id, e);
        }
      }
    } else {
      logDebug('[SonioxCleanup] Failed to list transcriptions:', await tResp.text().catch(() => ''));
    }

    const fResp = await fetchWithTimeout(`${base}/files`, { headers: hdrs }, 30000);
    if (fResp.ok) {
      const fJson = await fResp.json().catch(() => ({}));
      const fs = Array.isArray(fJson?.files) ? fJson.files : [];
      logInfo(`[SonioxCleanup] Found ${fs.length} files`);
      for (const f of fs) {
        try {
          await fetchWithTimeout(`${base}/files/${f.id}`, { method: 'DELETE', headers: hdrs }, 30000);
          logDebug('[SonioxCleanup] deleted file:', f.id);
        } catch (e) {
          logDebug('[SonioxCleanup] failed deleting file', f?.id, e);
        }
      }
    } else {
      logDebug('[SonioxCleanup] Failed to list files:', await fResp.text().catch(() => ''));
    }

    logInfo('✅ [SonioxCleanup] Finished cleanup on start.');
  } catch (e) {
    logDebug('[SonioxCleanup] Error during cleanup:', e);
  }
}

async function uploadToSonioxFile(wavBlob, filename, { signal } = {}, retries = 5, backoff = 2000) {
  const apiKey = getAPIKey();
  if (!apiKey) throw new Error('API key not available');
  const fd = new FormData();
  fd.append('file', wavBlob, filename);
  try {
    const rsp = await fetchWithTimeout(`${getSonioxRestBase()}/files`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: fd,
      signal,
    }, 30000);
    if (!rsp.ok) throw new Error(`Soniox file upload failed: ${await rsp.text()}`);
    const j = await rsp.json();
    return j.id;
  } catch (err) {
    if (signal?.aborted) throw err;
    if (retries > 0) {
      console.warn(`Upload failed, retrying in ${backoff}ms… (${retries} left)`);
      await new Promise(r => setTimeout(r, backoff));
      return uploadToSonioxFile(wavBlob, filename, { signal }, retries - 1, Math.floor(backoff * 1.5));
    }
    throw err;
  }
}

async function createSonioxTranscription(fileId, context, { signal, diarized } = {}, retries = 5, backoff = 2000) {
  const apiKey = getAPIKey();
  if (!apiKey) throw new Error('API key not available');
  const body = {
    model: SONIOX_ASYNC_MODEL,
    file_id: fileId,
    language_hints: DEFAULT_LANGUAGE_HINTS,
    enable_speaker_diarization: !!diarized,
    enable_language_identification: true,
    context,
  };
  try {
    const rsp = await fetchWithTimeout(`${getSonioxRestBase()}/transcriptions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal,
    }, 30000);
    if (!rsp.ok) throw new Error(`Create transcription failed: ${await rsp.text()}`);
    const j = await rsp.json();
    return j.id;
  } catch (err) {
    if (signal?.aborted) throw err;
    if (retries > 0) {
      console.warn(`Create failed, retrying in ${backoff}ms… (${retries} left)`);
      await new Promise(r => setTimeout(r, backoff));
      return createSonioxTranscription(fileId, context, { signal, diarized }, retries - 1, Math.floor(backoff * 1.5));
    }
    throw err;
  }
}

async function pollSonioxTranscription(transcriptionId, timeoutMs = 300000, intervalMs = 1500, { signal } = {}) {
  const apiKey = getAPIKey();
  const start = Date.now();
  while (true) {
    let rsp;
    try {
      rsp = await fetchWithTimeout(
        `${getSonioxRestBase()}/transcriptions/${transcriptionId}`,
        { headers: { Authorization: `Bearer ${apiKey}` }, signal },
        30000
      );
    } catch (err) {
      if (err && err.name === 'AbortError') {
        if (signal?.aborted) throw err;
        logDebug(`Poll ${transcriptionId} aborted after 30s; retrying…`);
        await new Promise(r => setTimeout(r, intervalMs));
        if (Date.now() - start > timeoutMs) throw new Error('Transcription timed out');
        continue;
      }
      throw err;
    }
    if (!rsp.ok) throw new Error(`Poll failed: ${await rsp.text()}`);
    const j = await rsp.json();
    if (j.status === 'completed') return;
    if (j.status === 'error') throw new Error(j.error_message || 'Transcription error');
    if (Date.now() - start > timeoutMs) throw new Error('Transcription timed out');
    await new Promise(r => setTimeout(r, intervalMs));
  }
}

async function fetchSonioxTranscriptText(
  transcriptionId,
  { signal, diarized } = {},
  retries = 5,
  delayMs = 2000,
  perAttemptTimeoutMs = 30000
) {
  const apiKey = getAPIKey();
  let attempt = 0;

  while (true) {
    try {
      const rsp = await fetchWithTimeout(
        `${getSonioxRestBase()}/transcriptions/${transcriptionId}/transcript`,
        { headers: { Authorization: `Bearer ${apiKey}` }, signal },
        perAttemptTimeoutMs
      );
      if (!rsp.ok) {
        const body = await rsp.text().catch(() => '');
        throw new Error(
          `Get transcript failed: ${rsp.status} ${rsp.statusText}` +
          (body ? ` — ${body}` : '')
        );
      }
      const j = await rsp.json();

      // Diarized mode prefers speaker-labeled rendering when available.
      if (diarized && Array.isArray(j.tokens) && j.tokens.some(t => t && typeof t.speaker !== 'undefined')) {
        return renderDiarizedTranscript(j.tokens);
      }
      return j.text || '';
    } catch (err) {
      if (signal?.aborted) throw err;
      attempt += 1;
      if (attempt > retries) {
        logError(`Get transcript failed after ${retries} retries:`, err);
        throw err;
      }
      logInfo(`Get transcript attempt ${attempt} failed; retrying in ${delayMs}ms…`);
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
}

function renderDiarizedTranscript(tokens) {
  const lines = [];
  let curSpk = null;
  let curText = '';

  const flush = () => {
    if (curSpk !== null && curText.trim()) {
      lines.push(`Speaker ${String(curSpk)}: ${curText.trim()}`);
    }
    curText = '';
  };

  for (const tok of tokens) {
    const spk = tok && typeof tok.speaker !== 'undefined' ? tok.speaker : curSpk;
    if (curSpk === null) curSpk = spk;
    if (spk !== curSpk) {
      flush();
      curSpk = spk;
    }
    curText += tok && typeof tok.text === 'string' ? tok.text : '';
  }
  flush();
  return lines.join('\n');
}

async function deleteSonioxTranscription(transcriptionId) {
  if (!transcriptionId) return;
  const apiKey = getAPIKey();
  try {
    const rsp = await fetch(`${getSonioxRestBase()}/transcriptions/${transcriptionId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!rsp.ok) {
      const msg = await rsp.text();
      logDebug(`Delete transcription ${transcriptionId} non-OK: ${msg}`);
    } else {
      logInfo(`Deleted transcription ${transcriptionId}`);
    }
  } catch (e) {
    logDebug(`Delete transcription ${transcriptionId} failed:`, e);
  }
}

async function deleteSonioxFile(fileId) {
  if (!fileId) return;
  const apiKey = getAPIKey();
  try {
    const rsp = await fetch(`${getSonioxRestBase()}/files/${fileId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!rsp.ok) {
      const msg = await rsp.text();
      logDebug(`Delete file ${fileId} non-OK: ${msg}`);
    } else {
      logInfo(`Deleted file ${fileId}`);
    }
  } catch (e) {
    logDebug(`Delete file ${fileId} failed:`, e);
  }
}

async function cleanupSonioxResources({ transcriptionId, fileId }) {
  await Promise.allSettled([
    deleteSonioxTranscription(transcriptionId),
    deleteSonioxFile(fileId),
  ]);
}

function estimateWavSeconds(wavBlob) {
  const BYTES_PER_SEC = 16000 * 2 * 1; // 16kHz, 16-bit, mono = 32000 B/s
  const payloadBytes = Math.max(0, wavBlob.size - 44);
  return payloadBytes / BYTES_PER_SEC;
}

// ════════════════════════════════════════════════════════════════════════════
// ASYNC MODE — audio chunking via OfflineAudioContext + Silero VAD
// ════════════════════════════════════════════════════════════════════════════

async function processAudioUsingOfflineContext(pcmFloat32, originalSampleRate, numChannels) {
  const targetSampleRate = 16000;
  const numFrames = pcmFloat32.length / numChannels;

  const tempCtx = new AudioContext();
  const originalBuffer = tempCtx.createBuffer(numChannels, numFrames, originalSampleRate);

  if (numChannels === 1) {
    originalBuffer.copyToChannel(pcmFloat32, 0);
  } else {
    for (let ch = 0; ch < numChannels; ch++) {
      const channelData = new Float32Array(numFrames);
      for (let i = 0; i < numFrames; i++) channelData[i] = pcmFloat32[i * numChannels + ch];
      originalBuffer.copyToChannel(channelData, ch);
    }
  }

  let monoBuffer;
  if (numChannels > 1) {
    const monoData = new Float32Array(numFrames);
    for (let i = 0; i < numFrames; i++) {
      let sum = 0;
      for (let ch = 0; ch < numChannels; ch++) sum += originalBuffer.getChannelData(ch)[i];
      monoData[i] = sum / numChannels;
    }
    monoBuffer = tempCtx.createBuffer(1, numFrames, originalSampleRate);
    monoBuffer.copyToChannel(monoData, 0);
  } else {
    monoBuffer = originalBuffer;
  }
  tempCtx.close();

  const duration = monoBuffer.duration;
  const offlineCtx = new OfflineAudioContext(1, targetSampleRate * duration, targetSampleRate);

  const source = offlineCtx.createBufferSource();
  source.buffer = monoBuffer;

  // Apply 0.3s fade-in/out to avoid edge clicks.
  const gainNode = offlineCtx.createGain();
  const fadeDuration = 0.3;
  gainNode.gain.setValueAtTime(0, 0);
  gainNode.gain.linearRampToValueAtTime(1, fadeDuration);

  const fadeOutStart = Math.max(0, duration - fadeDuration);
  if (duration < fadeDuration * 2) {
    console.warn(`[Audio] Short chunk (${duration.toFixed(2)}s) — fade-in/out may be squished`);
  }

  gainNode.gain.setValueAtTime(1, fadeOutStart);
  gainNode.gain.linearRampToValueAtTime(0, duration);

  source.connect(gainNode).connect(offlineCtx.destination);
  source.start(0);

  const renderedBuffer = await offlineCtx.startRendering();
  const processedData = renderedBuffer.getChannelData(0);
  const processedInt16 = floatTo16BitPCM(processedData);
  const wavBlob = encodeWAV(processedInt16, targetSampleRate, 1);
  await offlineCtx.close();
  return wavBlob;
}

// Minimum chunk duration depends on diarization: plain mode flushes every
// ~90s, diarized mode never auto-flushes (only Pause/Stop closes a chunk).
function getAsyncMinChunkSeconds() {
  return activeMode === 'async-diarized' ? ASYNC_DIARIZED_MIN_CHUNK_SEC : ASYNC_PLAIN_MIN_CHUNK_SEC;
}

const sileroVADOptions = {
  submitUserSpeechOnPause: true,
  positiveSpeechThreshold: 0.4,
  negativeSpeechThreshold: 0.35,
  redemptionFrames: 5,
  preSpeechPadFrames: 2,
  minSpeechFrames: 3,
  onSpeechStart: () => {
    if (!canShowRecordingStatus()) return;
    logInfo('Silero VAD: speech started');
    recordingActive = true;
    chunkStartTime = Date.now();
    if (canShowRecordingStatus()) {
      updateStatusMessage('Recording…', 'green');
      resetCompletionTimerDisplay();
    }
  },
  onSpeechEnd: (audioFloat32) => {
    if (!canShowRecordingStatus()) return;
    logInfo('Silero VAD: speech ended — buffering audio');
    pendingVADChunks.push(audioFloat32);

    const totalSamples = pendingVADChunks.reduce((sum, seg) => sum + seg.length, 0);
    const minSamples = getAsyncMinChunkSeconds() * 16000;
    if (totalSamples >= minSamples) {
      const combined = new Float32Array(totalSamples);
      let offset = 0;
      for (const seg of pendingVADChunks) {
        combined.set(seg, offset);
        offset += seg.length;
      }
      const wavBlob = encodeWAV(floatTo16BitPCM(combined), 16000, 1);
      enqueueAsyncTranscription(wavBlob, chunkNumber++);
      pendingVADChunks = [];
    }
  },
};

function flushPendingVADOnce(reason, extraAudioFloat32 = null) {
  const token = Date.now();
  if (token === pendingVADLastFlushToken) return;
  pendingVADLastFlushToken = token;

  if (extraAudioFloat32 && extraAudioFloat32.length) {
    const last = pendingVADChunks[pendingVADChunks.length - 1];
    const looksSame = last && last.length === extraAudioFloat32.length;
    if (!looksSame) pendingVADChunks.push(extraAudioFloat32);
  }

  const nextChunkNumber = flushPendingVadSegmentsGuarded({
    segments: pendingVADChunks,
    sampleRate: 16000,
    floatTo16BitPCM,
    encodeWAV,
    enqueueTranscription: enqueueAsyncTranscription,
    chunkNumber,
    isLocked: () => pendingVADLock,
    setLocked: (value) => { pendingVADLock = value; },
  });

  if (nextChunkNumber !== chunkNumber) {
    chunkNumber = nextChunkNumber;
    logInfo(`[VAD] Flushed pending segments (${reason}).`);
  }
}

// ── Async transcription queue ───────────────────────────────────────────────
async function transcribeChunkDirectly(wavBlob, chunkNum, { signal, sessionId } = {}) {
  const diarized = activeMode === 'async-diarized';
  let fileId = null;
  let txId = null;
  try {
    const filename = `chunk_${chunkNum}.wav`;
    fileId = await uploadToSonioxFile(wavBlob, filename, { signal });
    txId = await createSonioxTranscription(fileId, SONIOX_CONTEXT_TEXT, { signal, diarized });
    const secs = estimateWavSeconds(wavBlob);
    const timeoutMs = Math.max(300000, Math.ceil(secs * 4000));
    await pollSonioxTranscription(txId, timeoutMs, 1500, { signal });
    const text = await fetchSonioxTranscriptText(txId, { signal, diarized });
    await cleanupSonioxResources({ transcriptionId: txId, fileId });
    return text || '';
  } catch (error) {
    if (signal?.aborted || (sessionId && sessionId !== groupId)) {
      await cleanupSonioxResources({ transcriptionId: txId, fileId });
      return '';
    }
    logError(`Error transcribing chunk ${chunkNum}:`, error);
    await cleanupSonioxResources({ transcriptionId: txId, fileId });
    updateStatusMessage(
      'Transcription error with Soniox API. Check key/credits or try again.',
      'red'
    );
    transcriptionError = true;
    return `[Error transcribing chunk ${chunkNum}]`;
  }
}

function enqueueAsyncTranscription(wavBlob, chunkNum) {
  transcriptionQueue.push({
    sessionId: groupId,
    signal: sessionAbortController.signal,
    chunkNum,
    wavBlob,
  });
  enqueuedChunks += 1;

  // Microtask kick avoids races where isProcessingQueue flips after our check.
  queueMicrotask(() => { processTranscriptionQueue(); });
}

async function processTranscriptionQueue() {
  const mySessionId = groupId;
  const mySignal = sessionAbortController.signal;

  if (isProcessingQueue && processingQueueSessionId === mySessionId) return;

  isProcessingQueue = true;
  processingQueueSessionId = mySessionId;

  try {
    while (transcriptionQueue.length > 0) {
      if (groupId !== mySessionId || mySignal.aborted) break;

      const item = transcriptionQueue.shift();
      if (!item) continue;
      if (item.sessionId !== mySessionId) continue;

      let { chunkNum, wavBlob } = item;
      logInfo(`Transcribing chunk ${chunkNum}...`);

      const transcript = await transcribeChunkDirectly(wavBlob, chunkNum, {
        signal: item.signal || mySignal,
        sessionId: mySessionId,
      });

      if (groupId !== mySessionId || mySignal.aborted) break;

      transcriptChunks[chunkNum] = transcript;
      updateAsyncTranscriptionOutput();

      wavBlob = null;
    }
  } finally {
    if (processingQueueSessionId === mySessionId) {
      isProcessingQueue = false;
      processingQueueSessionId = null;
    }
    if (groupId === mySessionId && manualStop && transcriptionQueue.length === 0 && !transcriptFrozen) {
      updateAsyncTranscriptionOutput();
    }
  }
}

async function processAudioChunkInternal() {
  if (audioFrames.length === 0) {
    logDebug('No audio frames to process.');
    return;
  }
  processedAnyAudioFrames = true;

  logInfo(`Processing ${audioFrames.length} audio frames for chunk ${chunkNumber}.`);
  const framesToProcess = audioFrames;
  audioFrames = [];
  const sampleRate = framesToProcess[0].sampleRate;
  const numChannels = framesToProcess[0].numberOfChannels;
  const pcmDataArray = [];
  for (const frame of framesToProcess) {
    const numFrames = frame.numberOfFrames;
    if (numChannels === 1) {
      const channelData = new Float32Array(numFrames);
      frame.copyTo(channelData, { planeIndex: 0 });
      pcmDataArray.push(channelData);
    } else {
      const channelData = [];
      for (let c = 0; c < numChannels; c++) {
        const channelArray = new Float32Array(numFrames);
        frame.copyTo(channelArray, { planeIndex: c });
        channelData.push(channelArray);
      }
      const interleaved = new Float32Array(numFrames * numChannels);
      for (let i = 0; i < numFrames; i++) {
        for (let c = 0; c < numChannels; c++) {
          interleaved[i * numChannels + c] = channelData[c][i];
        }
      }
      pcmDataArray.push(interleaved);
    }
    frame.close();
  }
  const totalLength = pcmDataArray.reduce((sum, arr) => sum + arr.length, 0);
  const pcmFloat32 = new Float32Array(totalLength);
  let offset = 0;
  for (const arr of pcmDataArray) {
    pcmFloat32.set(arr, offset);
    offset += arr.length;
  }

  const wavBlob = await processAudioUsingOfflineContext(pcmFloat32, sampleRate, numChannels);
  enqueueAsyncTranscription(wavBlob, chunkNumber);
  chunkNumber++;
}

async function safeProcessAudioChunk() {
  if (manualStop && finalChunkProcessed) {
    logDebug('Final chunk already processed; skipping safeProcessAudioChunk.');
    return;
  }
  if (chunkProcessingLock) {
    logDebug('Chunk processing is locked; skipping safeProcessAudioChunk.');
    return;
  }
  chunkProcessingLock = true;
  await processAudioChunkInternal();
  chunkProcessingLock = false;
  if (pendingStop) {
    pendingStop = false;
    finalizeAsyncStop();
  }
}

function finalizeAsyncStop() {
  setRecordingControlsIdle();
  logInfo('Recording stopped by user. Finalizing transcription.');
}

function updateAsyncTranscriptionOutput() {
  if (transcriptFrozen) return;
  const sortedKeys = Object.keys(transcriptChunks).map(Number).sort((a, b) => a - b);
  let combined = '';
  for (const key of sortedKeys) combined += transcriptChunks[key] + ' ';
  const text = combined.trim();
  logDebug('UI write: combined text length=', text.length);
  writeTranscriptionElement(text);

  if (manualStop && transcriptionQueue.length === 0 && !isProcessingQueue) {
    freezeCompletionTimer();
    if (!transcriptionError) {
      updateStatusMessage('Transcription finished!', 'green');
      window.__app?.emitTranscriptionFinished?.({ provider: 'soniox', reason: 'queueDrained' });
      logInfo('Transcription complete.');
    } else {
      logInfo('Transcription complete with errors; keeping error message visible.');
    }
    transcriptFrozen = true;
    stopInProgress = false;
  }
}

// Schedule check used by the legacy RMS/scheduleChunk path. Silero VAD is
// the primary path now, but we keep this guard to short-circuit any
// lingering callers cleanly.
function scheduleAsyncChunk() {
  if (!recordingActive || manualStop || recordingPaused) return;
  const elapsed = Date.now() - chunkStartTime;
  const silenceFor = Date.now() - lastSpeechTime;
  if (elapsed >= ASYNC_MIN_CHUNK_DURATION_MS && silenceFor >= ASYNC_SILENCE_DURATION_MS) {
    logInfo('Silence detected after min-duration; closing chunk.');
    safeProcessAudioChunk();
    recordingActive = false;
    chunkStartTime = Date.now();
    lastSpeechTime = Date.now();
    logInfo('Listening for speech…');
  } else {
    chunkTimeoutId = setTimeout(scheduleAsyncChunk, 500);
  }
}

// ════════════════════════════════════════════════════════════════════════════
// REALTIME MODE — WebSocket session + AudioWorklet capture
// ════════════════════════════════════════════════════════════════════════════

// Inline AudioWorklet processor: runs on the audio render thread, receives
// 128-sample render quanta, and posts each Float32 block back to the main
// thread for PCM conversion. Defined as a string so the merged module
// remains a single file.
const RT_AUDIO_WORKLET_SRC = `
class SonioxRTCaptureProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const input = inputs[0];
    if (!input || input.length === 0) return true;
    const channel = input[0];
    if (!channel || channel.length === 0) return true;
    const copy = new Float32Array(channel.length);
    copy.set(channel);
    this.port.postMessage(copy, [copy.buffer]);
    return true;
  }
}
registerProcessor('soniox-rt-capture', SonioxRTCaptureProcessor);
`;

let rtAudioWorkletBlobUrl = null;
function getRtAudioWorkletBlobUrl() {
  if (!rtAudioWorkletBlobUrl) {
    const blob = new Blob([RT_AUDIO_WORKLET_SRC], { type: 'application/javascript' });
    rtAudioWorkletBlobUrl = URL.createObjectURL(blob);
  }
  return rtAudioWorkletBlobUrl;
}

function buildRealtimeSessionConfig(apiKey) {
  return {
    api_key: apiKey,
    model: SONIOX_RT_MODEL,
    audio_format: 'pcm_s16le',
    sample_rate: SONIOX_RT_SAMPLE_RATE,
    num_channels: SONIOX_RT_NUM_CHANNELS,
    language_hints: DEFAULT_LANGUAGE_HINTS,
    enable_language_identification: false,
    enable_speaker_diarization: false,
    // Server-side endpointing is the whole point of using realtime — let
    // Soniox decide when an utterance ends and finalize tokens promptly.
    enable_endpoint_detection: true,
    context: SONIOX_CONTEXT_TEXT,
  };
}

function rtAppendFinalTokens(tokens) {
  if (!Array.isArray(tokens) || tokens.length === 0) return;
  let appended = '';
  for (const t of tokens) {
    if (!t || typeof t.text !== 'string') continue;
    if (t.is_final !== true) continue; // strict: only final tokens

    // Skip Soniox control/marker tokens. Documented examples:
    //   - "<end>" — emitted when endpoint detection fires
    //     (https://soniox.com/docs/stt/rt/endpoint-detection)
    //   - "<fin>" — emitted in response to a manual finalize() request
    //     (https://soniox.com/docs/stt/rt/manual-finalization)
    // We accept any "<...>"-shaped token defensively, in case Soniox adds
    // more markers later. The .trim() handles leading/trailing whitespace
    // that some tokens carry (Soniox preserves spacing in regular tokens).
    const trimmed = t.text.trim();
    if (trimmed.length >= 2 && trimmed.startsWith('<') && trimmed.endsWith('>')) {
      // The <fin> marker is the signal that the server has completed
      // finalization in response to our {"type":"finalize"} request.
      // The Stop handler waits for this so it knows the tail of the
      // utterance has actually been delivered before closing the stream.
      if (trimmed === '<fin>') {
        serverFinalized = true;
        logInfo('Soniox emitted <fin> — server finalized pending tokens.');
      } else {
        logDebug('Skipping Soniox control token:', JSON.stringify(t.text));
      }
      continue;
    }

    appended += t.text;
  }
  if (appended) {
    finalTranscriptRT += appended;
    if (!transcriptFrozen) writeTranscriptionElement(finalTranscriptRT);
  }
}

function rtFlushQueuedAudio() {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  while (pendingAudioQueue.length > 0) {
    const chunk = pendingAudioQueue.shift();
    try { ws.send(chunk); }
    catch (err) {
      logError('Failed to flush queued audio chunk', err);
      break;
    }
  }
}

function rtSendAudioChunk(int16Buffer) {
  if (recordingPaused || manualStop || !recordingActive) return;
  if (ws && ws.readyState === WebSocket.OPEN && configSent) {
    try { ws.send(int16Buffer); }
    catch (err) { logError('ws.send failed', err); }
  } else if (pendingAudioQueue.length < 200) {
    pendingAudioQueue.push(int16Buffer);
  } else {
    logDebug('Audio queue full; dropping chunk pre-open');
  }
}

function rtHandleSocketMessage(event) {
  let res;
  try { res = JSON.parse(event.data); }
  catch (err) {
    logError('Could not parse WS message', err, event.data);
    return;
  }

  if (res.error_code) {
    logError(`Soniox WS error ${res.error_code}: ${res.error_message}`);
    transcriptionError = true;
    updateStatusMessage(
      `Soniox error ${res.error_code}: ${res.error_message || 'unknown'}`,
      'red'
    );
    return;
  }

  if (Array.isArray(res.tokens) && res.tokens.length) rtAppendFinalTokens(res.tokens);

  if (res.finished === true) {
    serverFinished = true;
    logInfo('Soniox WS session finished (server flushed all finals).');
    // Server will close the socket after this; the close handler finalizes.
  }
}

function rtHandleSocketClose(closeEvent) {
  configSent = false;
  ws = null;
  logInfo(
    'Soniox WS closed',
    closeEvent ? `code=${closeEvent.code} reason=${closeEvent.reason || ''}` : ''
  );
  // Only finalize the UI on a manual stop. Pause-triggered closes are
  // expected; provider-switch closes are handled by the teardown hook.
  if (manualStop) finalizeRealtimeTranscriptionUI();
}

function rtHandleSocketError(err) {
  logError('Soniox WS error event', err);
  if (!transcriptionError) {
    updateStatusMessage(
      'WebSocket error with Soniox real-time. Check key/credits or try again.',
      'red'
    );
  }
  transcriptionError = true;
}

async function rtOpenWebSocketSession() {
  const apiKey = getAPIKey();
  if (!apiKey) throw new Error('Missing Soniox API key');

  const url = getSonioxRealtimeUrl();
  logInfo('Opening Soniox WS session →', url);

  return new Promise((resolve, reject) => {
    let settled = false;
    let socket;
    try { socket = new WebSocket(url); }
    catch (err) { reject(err); return; }

    socket.binaryType = 'arraybuffer';

    socket.addEventListener('open', () => {
      try {
        const cfg = buildRealtimeSessionConfig(apiKey);
        socket.send(JSON.stringify(cfg));
        configSent = true;
        ws = socket;
        rtFlushQueuedAudio();
        if (!settled) { settled = true; resolve(socket); }
      } catch (err) {
        if (!settled) { settled = true; reject(err); }
      }
    });

    socket.addEventListener('message', rtHandleSocketMessage);
    socket.addEventListener('close', (ev) => {
      rtHandleSocketClose(ev);
      if (!settled) {
        settled = true;
        reject(new Error(`WebSocket closed before open: code=${ev.code}`));
      }
    });
    socket.addEventListener('error', (ev) => {
      rtHandleSocketError(ev);
      if (!settled) {
        settled = true;
        reject(new Error('WebSocket error before open'));
      }
    });
  });
}

// Send the empty-frame end-of-stream signal. Soniox flushes pending tokens
// then sends {"finished": true} before closing. Used on Pause and Stop.
function rtGracefullyCloseWebSocket() {
  if (!ws) return;
  try {
    if (ws.readyState === WebSocket.OPEN) {
      logInfo('Sending empty frame to end Soniox stream');
      ws.send(new ArrayBuffer(0));
    }
  } catch (err) {
    logDebug('rtGracefullyCloseWebSocket send failed', err);
  }
}

// Send the {"type":"finalize"} control message. Tells the server to
// finalize all currently pending non-final tokens and emit them as final.
// The server signals completion by returning a "<fin>" marker token.
//
// This is the right primitive to use BEFORE closing a stream — it forces
// Soniox to flush the recognizer's buffered tokens for the audio it has
// already received, so the tail of the user's last utterance isn't lost
// in the gap between "user clicked Stop" and "stream closed".
//
// Reference: https://soniox.com/docs/stt/rt/manual-finalization
function rtRequestFinalize() {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  try {
    serverFinalized = false; // arm for the next <fin>
    ws.send(JSON.stringify({ type: 'finalize' }));
    logInfo('Sent {"type":"finalize"} to Soniox.');
  } catch (err) {
    logDebug('rtRequestFinalize send failed', err);
  }
}

// Hard-close: used on Abort and provider switches. We don't wait for finish.
function rtHardCloseWebSocket(reason = 'closed') {
  if (!ws) return;
  try { ws.close(1000, reason); }
  catch (err) { logDebug('rtHardCloseWebSocket failed', err); }
  ws = null;
  configSent = false;
}

function rtWaitForWsCloseOrTimeout(timeoutMs) {
  return new Promise((resolve) => {
    if (!ws || ws.readyState === WebSocket.CLOSED) { resolve(true); return; }
    const start = Date.now();
    const interval = setInterval(() => {
      if (!ws || ws.readyState === WebSocket.CLOSED) {
        clearInterval(interval);
        resolve(true);
      } else if (Date.now() - start >= timeoutMs) {
        clearInterval(interval);
        resolve(false);
      }
    }, 50);
  });
}

// Resolves true when the server has emitted {"finished": true} (meaning
// all final tokens for the closed stream have been delivered), false on
// timeout. Used after sending the empty-frame EOS so we know it's safe
// to finalize the UI without losing the tail of the transcript.
function rtWaitForServerFinishedOrTimeout(timeoutMs) {
  return new Promise((resolve) => {
    if (serverFinished) { resolve(true); return; }
    const start = Date.now();
    const interval = setInterval(() => {
      if (serverFinished) {
        clearInterval(interval);
        resolve(true);
      } else if (Date.now() - start >= timeoutMs) {
        clearInterval(interval);
        resolve(false);
      } else if (!ws || ws.readyState === WebSocket.CLOSED) {
        // The socket closed without us seeing finished:true. That's
        // unexpected on a graceful EOS but possible on network errors.
        // Treat as "done" so we don't hang the UI; the caller can decide
        // what to do.
        clearInterval(interval);
        resolve(true);
      }
    }, 25);
  });
}

// Resolves true when the server has emitted the "<fin>" marker (meaning
// it has finished finalizing pending tokens in response to our
// {"type":"finalize"} request). Resolves false on timeout. Used by the
// Stop handler so we KNOW the tail tokens have arrived before we tear
// down the stream.
function rtWaitForServerFinalizedOrTimeout(timeoutMs) {
  return new Promise((resolve) => {
    if (serverFinalized) { resolve(true); return; }
    const start = Date.now();
    const interval = setInterval(() => {
      if (serverFinalized) {
        clearInterval(interval);
        resolve(true);
      } else if (Date.now() - start >= timeoutMs) {
        clearInterval(interval);
        resolve(false);
      } else if (!ws || ws.readyState === WebSocket.CLOSED) {
        // Socket died while we were waiting — give up.
        clearInterval(interval);
        resolve(false);
      }
    }, 25);
  });
}

async function rtStartAudioCapture() {
  // Note: getUserMedia({ sampleRate }) is a hint — many browsers ignore it.
  // The actual resampling happens via AudioContext at SONIOX_RT_SAMPLE_RATE.
  mediaStream = await navigator.mediaDevices.getUserMedia({
    audio: {
      channelCount: 1,
      sampleRate: SONIOX_RT_SAMPLE_RATE,
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
    video: false,
  });

  const Ctx = window.AudioContext || window.webkitAudioContext;
  audioContext = new Ctx({ sampleRate: SONIOX_RT_SAMPLE_RATE });

  if (audioContext.sampleRate !== SONIOX_RT_SAMPLE_RATE) {
    logInfo(
      `AudioContext landed at ${audioContext.sampleRate} Hz instead of ${SONIOX_RT_SAMPLE_RATE} Hz; ` +
      'Soniox will receive audio at the actual rate. Consider updating sample_rate in the config.'
    );
  }

  await audioContext.audioWorklet.addModule(getRtAudioWorkletBlobUrl());

  audioSourceNode = audioContext.createMediaStreamSource(mediaStream);
  audioWorkletNode = new AudioWorkletNode(audioContext, 'soniox-rt-capture');

  audioWorkletNode.port.onmessage = (event) => {
    const float32 = event.data;
    if (!(float32 instanceof Float32Array) || float32.length === 0) return;
    const int16 = floatTo16BitPCM(float32);
    rtSendAudioChunk(int16.buffer);
  };

  audioSourceNode.connect(audioWorkletNode);
  // We do NOT connect to destination — we only consume, no playback.

  if (audioContext.state === 'suspended') await audioContext.resume();
}

function rtTeardownAudioCapture() {
  try {
    if (audioWorkletNode) {
      audioWorkletNode.port.onmessage = null;
      try { audioWorkletNode.disconnect(); } catch (_) {}
      audioWorkletNode = null;
    }
    if (audioSourceNode) {
      try { audioSourceNode.disconnect(); } catch (_) {}
      audioSourceNode = null;
    }
    if (audioContext) {
      try { audioContext.close(); } catch (_) {}
      audioContext = null;
    }
    if (mediaStream) {
      mediaStream.getTracks().forEach((t) => { try { t.stop(); } catch (_) {} });
      mediaStream = null;
    }
  } catch (err) {
    logDebug('rtTeardownAudioCapture error', err);
  }
}

// Halt the OS-level mic capture WITHOUT tearing down the AudioContext or
// AudioWorklet. Used by the Stop handler to give any audio frames that
// were captured just before the click but haven't yet been posted from
// the worklet to the main thread (and from there to the WebSocket) a
// chance to flush. Without this, the user's last ~100-300ms of speech is
// dropped, because we'd kill the entire audio graph the instant Stop is
// pressed.
function rtStopMicInputOnly() {
  try {
    if (mediaStream) {
      mediaStream.getTracks().forEach((t) => { try { t.stop(); } catch (_) {} });
      mediaStream = null;
    }
  } catch (err) {
    logDebug('rtStopMicInputOnly error', err);
  }
}

function finalizeRealtimeTranscriptionUI() {
  if (transcriptFrozen) return;
  freezeCompletionTimer();
  if (!transcriptionError) {
    updateStatusMessage('Transcription finished!', 'green');
    window.__app?.emitTranscriptionFinished?.({ provider: 'soniox_rt', reason: 'wsClosed' });
    logInfo('Realtime transcription complete.');
  } else {
    logInfo('Realtime transcription complete with errors; keeping error message visible.');
  }
  transcriptFrozen = true;
  stopInProgress = false;
  setRecordingControlsIdle();
}

// ════════════════════════════════════════════════════════════════════════════
// SHARED — session lifecycle
// ════════════════════════════════════════════════════════════════════════════

function beginFreshSession() {
  try { sessionAbortController.abort('new session started'); } catch (_) {}
  sessionAbortController = new AbortController();

  // Async-side state
  transcriptionQueue = [];
  isProcessingQueue = false;
  processingQueueSessionId = null;
  pendingVADChunks = [];
  pendingVADLock = false;
  chunkProcessingLock = false;
  pendingStop = false;
  enqueuedChunks = 0;
  expectedChunks = 0;
  audioFrames = [];
  transcriptChunks = {};
  finalChunkProcessed = false;
  processedAnyAudioFrames = false;

  // Realtime-side state
  pendingAudioQueue = [];
  finalTranscriptRT = '';
  configSent = false;
  serverFinished = false;
  serverFinalized = false;

  // Shared
  transcriptionError = false;
  transcriptFrozen = false;
  manualStop = false;
  recordingPaused = false;
  recordingActive = false;
  stopInProgress = false;
  groupId = Date.now().toString();
  chunkNumber = 1;
  chunkStartTime = Date.now();
  lastSpeechTime = Date.now();

  if (chunkTimeoutId) {
    clearTimeout(chunkTimeoutId);
    chunkTimeoutId = null;
  }
}

// Fully tear down whichever pipeline was running. Used by the teardown
// hook (when the user switches providers mid-session) and on page load.
function teardownActivePipeline(reason = 'teardown') {
  try {
    manualStop = true;
    recordingActive = false;
    recordingPaused = false;
  } catch (_) {}

  // Realtime
  try { rtHardCloseWebSocket(reason); } catch (_) {}
  try { rtTeardownAudioCapture(); } catch (_) {}
  pendingAudioQueue = [];

  // Async / Silero VAD
  try {
    if (sileroVAD && typeof sileroVAD.pause === 'function') sileroVAD.pause().catch(() => {});
  } catch (_) {}
  try {
    if (sileroVAD?.stream) sileroVAD.stream.getTracks().forEach((t) => { try { t.stop(); } catch (_) {} });
  } catch (_) {}
  try {
    if (sileroVAD && !sileroVAD._destroyed) {
      sileroVAD._destroyed = true;
      try { sileroVAD.destroy?.(); } catch (_) {}
    }
  } catch (_) {}
  sileroVAD = null;

  try { stopMicrophone(); } catch (_) {}
}

// ════════════════════════════════════════════════════════════════════════════
// EXPORTED — initRecording (mode dispatch)
// ════════════════════════════════════════════════════════════════════════════

// Read the desired mode from current sessionStorage. Returns one of:
// 'async-plain' | 'async-diarized' | 'realtime'
function detectModeFromSession() {
  const provider = String(sessionStorage.getItem('transcribe_provider') || '').trim().toLowerCase();
  if (provider === 'soniox_rt') return 'realtime';
  const speakerLabels = String(sessionStorage.getItem('soniox_speaker_labels') || '').trim().toLowerCase();
  return speakerLabels === 'on' ? 'async-diarized' : 'async-plain';
}

function initRecording() {
  const startButton = document.getElementById('startButton');
  const stopButton = document.getElementById('stopButton');
  const pauseResumeButton = document.getElementById('pauseResumeButton');
  const abortButton = document.getElementById('abortButton');
  if (!startButton || !stopButton || !pauseResumeButton) return;

  // Self-idempotent + cross-mode teardown. Because all three modes now
  // live in this single module, one window key is enough — re-init kills
  // the previous incarnation regardless of what mode it was running.
  try { window.__sonioxUIAbort?.abort('re-init'); } catch (_) {}
  window.__sonioxUIAbort = new AbortController();
  const uiSignal = window.__sonioxUIAbort.signal;

  // Centralized teardown hook called by main.js when the user switches
  // providers mid-session. It releases the mic and closes the WS / VAD
  // regardless of which mode is active.
  window.__sonioxTeardown = () => teardownActivePipeline('provider-switch');

  activeMode = detectModeFromSession();
  logInfo('initRecording mode =', activeMode);

  if (activeMode === 'realtime') {
    bindRealtimeHandlers({ startButton, stopButton, pauseResumeButton, abortButton, uiSignal });
  } else {
    bindAsyncHandlers({ startButton, stopButton, pauseResumeButton, abortButton, uiSignal });
  }
}

// ════════════════════════════════════════════════════════════════════════════
// REALTIME — button bindings
// ════════════════════════════════════════════════════════════════════════════

function bindRealtimeHandlers({ startButton, stopButton, pauseResumeButton, abortButton, uiSignal }) {
  // ── Start ─────────────────────────────────────────────────────────────────
  startButton.addEventListener('click', async () => {
    const apiKey = getAPIKey();
    if (!apiKey) {
      alert('Please enter your Soniox API key first.');
      return;
    }
    startButton.disabled = true;

    beginFreshSession();
    resetCompletionTimerDisplay();
    writeTranscriptionElement('');

    updateStatusMessage('Connecting to Soniox real-time…', 'orange');

    try {
      // Open WS first so the config is queued before any audio arrives.
      await rtOpenWebSocketSession();
    } catch (err) {
      logError('Failed to open Soniox WS', err);
      updateStatusMessage('Could not connect to Soniox real-time. Check key/region.', 'red');
      startButton.disabled = false;
      return;
    }

    try {
      await rtStartAudioCapture();
    } catch (err) {
      logError('Failed to start audio capture', err);
      rtHardCloseWebSocket('mic-failed');
      updateStatusMessage('Microphone error: ' + (err?.message || err), 'red');
      startButton.disabled = false;
      return;
    }

    recordingActive = true;
    setStopPauseDisabled(false);
    setAbortButtonDisabled(false);
    pauseResumeButton.innerText = 'Pause Recording';
    updateStatusMessage('Recording…', 'green');
    logInfo('Soniox real-time session started.');
  }, { signal: uiSignal });

  // ── Pause / Resume ────────────────────────────────────────────────────────
  pauseResumeButton.addEventListener('click', async () => {
    if (pauseResumeButton.disabled) return;
    setStopPauseDisabled(true);
    setAbortButtonDisabled(true);

    if (recordingPaused) {
      // RESUME — close-and-reopen pattern: fresh WS + new mic.
      // finalTranscriptRT is preserved so text from before the pause stays
      // in the UI; new finals will append after it.
      updateStatusMessage('Resuming recording…', 'orange');
      try {
        rtTeardownAudioCapture();
        rtHardCloseWebSocket('resume-new-session');
        recordingPaused = false;
        manualStop = false;
        recordingActive = false;
        configSent = false;
        // Reset the finished/finalized flags — they're true from the
        // pause-triggered server response, but a subsequent Stop/Pause
        // needs to track the NEW session's signals, not the old ones.
        serverFinished = false;
        serverFinalized = false;
        pendingAudioQueue = [];

        await rtOpenWebSocketSession();
        await rtStartAudioCapture();
        recordingActive = true;

        pauseResumeButton.innerText = 'Pause Recording';
        updateStatusMessage('Recording…', 'green');
        logInfo('Soniox real-time session resumed (new WS).');
      } catch (err) {
        logError('Resume failed', err);
        updateStatusMessage('Error resuming Soniox real-time: ' + (err?.message || err), 'red');
      } finally {
        setStopPauseDisabled(false);
        setAbortButtonDisabled(false);
      }
    } else {
      // PAUSE — same finalize-first sequence as Stop, so the tail of the
      // last sentence the user spoke before pausing is preserved.
      updateStatusMessage('Pausing recording…', 'orange');

      // Halt OS-level mic, leave the worklet+WS alive long enough to
      // drain the in-flight audio to Soniox.
      rtStopMicInputOnly();
      await new Promise(r => setTimeout(r, 150));

      // Ask Soniox to finalize whatever it has, wait for <fin>.
      rtRequestFinalize();
      const finalizedSeen = await rtWaitForServerFinalizedOrTimeout(3000);
      if (!finalizedSeen) {
        logDebug('Pause: <fin> not seen within 3s; closing anyway.');
      }

      // Now mark paused so any straggler audio is dropped, and close.
      recordingActive = false;
      recordingPaused = true;
      try { rtGracefullyCloseWebSocket(); }
      catch (err) { logDebug('Pause: rtGracefullyCloseWebSocket failed', err); }

      const finishedSeen = await rtWaitForServerFinishedOrTimeout(2000);
      if (!finishedSeen) {
        logDebug('Pause: server did not send finished:true within 2s.');
      }

      // Wait briefly for the actual close, then force it if needed.
      const closedByServer = await rtWaitForWsCloseOrTimeout(1000);
      if (!closedByServer) rtHardCloseWebSocket('pause-timeout');
      rtTeardownAudioCapture();

      pauseResumeButton.innerText = 'Resume Recording';
      updateStatusMessage('Recording paused', 'orange');
      logInfo('Soniox real-time session paused (WS closed).');
      setStopPauseDisabled(false);
      setAbortButtonDisabled(true);
    }
  }, { signal: uiSignal });

  // ── Abort ─────────────────────────────────────────────────────────────────
  if (abortButton) {
    abortButton.addEventListener('click', async () => {
      if (abortButton.disabled) return;
      setAbortButtonDisabled(true);
      setStopPauseDisabled(true);

      transcriptFrozen = true;
      manualStop = true;
      recordingPaused = false;
      recordingActive = false;

      rtHardCloseWebSocket('user-abort');
      rtTeardownAudioCapture();
      pendingAudioQueue = [];

      try { sessionAbortController.abort('recording aborted'); } catch (_) {}
      sessionAbortController = new AbortController();

      freezeCompletionTimer();
      setRecordingControlsIdle();
      updateStatusMessage('Recording aborted.', 'orange');
      logInfo('Soniox real-time session aborted by user.');
    }, { signal: uiSignal });
  }

  // ── Stop ──────────────────────────────────────────────────────────────────
  // Realtime Stop sequence — designed to preserve the tail of the user's
  // speech, including the case where they click Stop mid-sentence or
  // immediately after finishing speaking.
  //
  // The naive "send empty frame EOS, wait for close" pattern drops the
  // tail because Soniox's recognizer holds tokens as non-final for a
  // short window after each utterance, waiting for endpoint detection
  // or more audio. Closing the stream doesn't reliably finalize those
  // tokens.
  //
  // The right primitive is the {"type":"finalize"} control message
  // (https://soniox.com/docs/stt/rt/manual-finalization), which forces
  // the server to finalize all currently-pending non-final tokens and
  // emit them as final. The server signals completion by emitting a
  // "<fin>" marker token, after which we know the tail has arrived.
  // Only THEN do we send the empty-frame EOS to close the stream.
  //
  // Sequence:
  //   1. Stop OS-level mic capture (no new audio enters the pipeline).
  //   2. Brief drain wait so the last ~100ms of captured audio reaches
  //      Soniox's servers before we ask them to finalize.
  //   3. Send {"type":"finalize"}. Server finalizes pending tokens and
  //      emits them via the result stream, plus a "<fin>" marker.
  //   4. Wait for serverFinalized=true (the "<fin>" marker arrives).
  //      During this window, our message handler keeps appending finals
  //      to the textarea so the user actually sees the tail.
  //   5. Send the empty-frame EOS to close the stream.
  //   6. Wait for serverFinished=true and socket close (cleanup).
  //   7. Tear down the audio graph and finalize the UI.
  stopButton.addEventListener('click', async () => {
    if (stopButton.disabled) return;
    if (stopInProgress) {
      logDebug('Stop already in progress; ignoring duplicate click.');
      return;
    }
    stopInProgress = true;
    setStopPauseDisabled(true);
    setAbortButtonDisabled(true);

    // Note: we deliberately do NOT set manualStop or recordingActive yet.
    // rtSendAudioChunk gates on those flags, and we still want it to send
    // the in-flight tail audio to Soniox before we tell Soniox to finalize.

    // If we were paused, no live WS to drain — just finalize.
    if (recordingPaused) {
      manualStop = true;
      recordingActive = false;
      rtTeardownAudioCapture();
      finalizeRealtimeTranscriptionUI();
      logInfo('Stop while paused; finalized immediately.');
      return;
    }

    updateStatusMessage('Finishing transcription...', 'blue');
    if (!completionTimerRunning) startCompletionTimer();

    // If the WS is already gone (rare race), finalize directly.
    if (!ws || ws.readyState === WebSocket.CLOSED) {
      manualStop = true;
      recordingActive = false;
      rtTeardownAudioCapture();
      finalizeRealtimeTranscriptionUI();
      return;
    }

    // Step 1: halt OS-level mic capture but keep the worklet+WS alive so
    // any audio frames captured just before the click can still flow out
    // to Soniox.
    rtStopMicInputOnly();

    // Step 2: brief drain. Lets the worklet flush its in-flight render
    // quanta to the main thread, our send loop forward them to Soniox,
    // and Soniox's network buffer accept them. Doesn't need to cover the
    // recognizer's processing time — the finalize control message
    // handles that next.
    await new Promise(r => setTimeout(r, 150));

    // Step 3: ask Soniox to finalize all currently-pending non-final
    // tokens. The server will respond with the finals (via our normal
    // result stream) plus a "<fin>" marker indicating completion.
    rtRequestFinalize();

    // Step 4: wait for "<fin>". This is the key step — when this
    // resolves, we KNOW the tail of the user's last sentence has been
    // delivered as final tokens and appended to the textarea.
    //
    // 4 seconds is generous; in practice <fin> arrives within ~350ms
    // (Pipecat's ttfs_p99_latency benchmark) but we don't want to truncate
    // long sentences on slow networks.
    const finalizedSeen = await rtWaitForServerFinalizedOrTimeout(4000);
    if (!finalizedSeen) {
      logInfo('Soniox did not emit <fin> within 4s; proceeding to close anyway.');
    }

    // Step 5: now block any new audio sends and close the stream.
    recordingActive = false;
    rtGracefullyCloseWebSocket();

    // Step 6: wait for {"finished": true} and the socket close. The
    // message handler may still append a few more finals during this
    // window — that's fine.
    const finishedSeen = await rtWaitForServerFinishedOrTimeout(3000);
    if (!finishedSeen) {
      logInfo('Server did not send finished:true within 3s; finalizing anyway.');
    }
    const closed = await rtWaitForWsCloseOrTimeout(1500);
    if (!closed) {
      logInfo('Server did not close socket within 1.5s; force-closing.');
      rtHardCloseWebSocket('stop-timeout');
    }

    // Step 7: NOW it's safe to mark manualStop and finalize the UI. The
    // close handler will also run when the socket actually closes; both
    // paths funnel through finalizeRealtimeTranscriptionUI which is
    // idempotent (returns early if transcriptFrozen is already set).
    manualStop = true;
    rtTeardownAudioCapture();
    finalizeRealtimeTranscriptionUI();
  }, { signal: uiSignal });
}

// ════════════════════════════════════════════════════════════════════════════
// ASYNC — button bindings (handles both 'async-plain' and 'async-diarized')
// ════════════════════════════════════════════════════════════════════════════

function bindAsyncHandlers({ startButton, stopButton, pauseResumeButton, abortButton, uiSignal }) {
  // Make sure we haven't left a Silero VAD running from a previous mode.
  // (No-op if one isn't there.)
  try {
    if (sileroVAD?.pause) sileroVAD.pause().catch(() => {});
    if (sileroVAD?.stream) sileroVAD.stream.getTracks().forEach(t => { try { t.stop(); } catch (_) {} });
    if (sileroVAD && !sileroVAD._destroyed) {
      sileroVAD._destroyed = true;
      try { sileroVAD.destroy?.(); } catch (_) {}
    }
  } catch (_) {}
  sileroVAD = null;

  // ── Start ─────────────────────────────────────────────────────────────────
  startButton.addEventListener('click', async () => {
    const apiKey = getAPIKey();
    if (!apiKey) {
      alert('Please enter your Soniox API key first.');
      return;
    }
    startButton.disabled = true;

    // Hard reset + abort any pending transcription work from a previous run.
    beginFreshSession();

    // Fire-and-forget cleanup of any leftover Soniox-side artifacts.
    cleanupSonioxAll().catch((err) => { logError('Soniox cleanup on start failed', err); });

    resetCompletionTimerDisplay();
    writeTranscriptionElement('');

    updateStatusMessage('Loading voice-activity model...', 'orange');
    try {
      if (!sileroVAD) sileroVAD = await vad.MicVAD.new(sileroVADOptions);
      await sileroVAD.start();
      updateStatusMessage('Listening for speech…', 'green');
      logInfo('Silero VAD started');
      setStopPauseDisabled(false);
      pauseResumeButton.innerText = 'Pause Recording';
      setAbortButtonDisabled(false);
    } catch (error) {
      updateStatusMessage('VAD initialization error: ' + error, 'red');
      logError('Silero VAD error', error);
      startButton.disabled = false;
      setAbortButtonDisabled(true);
    }
  }, { signal: uiSignal });

  // ── Pause / Resume ────────────────────────────────────────────────────────
  pauseResumeButton.addEventListener('click', async () => {
    if (pauseResumeButton.disabled) return;
    setStopPauseDisabled(true);
    setAbortButtonDisabled(true);

    if (recordingPaused) {
      // RESUME: destroy old VAD and start a fresh one (re-prompts the mic).
      updateStatusMessage('Resuming recording…', 'orange');
      try {
        if (sileroVAD && typeof sileroVAD.destroy === 'function') {
          await sileroVAD.destroy();
        }
        sileroVAD = await vad.MicVAD.new(sileroVADOptions);
        await sileroVAD.start();
        recordingPaused = false;

        pauseResumeButton.innerText = 'Pause Recording';
        updateStatusMessage('Listening for speech…', 'green');
        logInfo('Silero VAD resumed');
      } catch (err) {
        updateStatusMessage('Error resuming VAD: ' + err, 'red');
        logError('Error resuming Silero VAD:', err);
      } finally {
        setStopPauseDisabled(false);
        setAbortButtonDisabled(false);
      }
    } else {
      // PAUSE: do NOT flip recordingPaused yet — submitUserSpeechOnPause
      // fires a final onSpeechEnd inside sileroVAD.pause() with the tail
      // audio. onSpeechEnd guards on canShowRecordingStatus() which checks
      // recordingPaused, so flipping the flag too early would silently drop
      // the tail segment.
      recordingActive = false;
      if (chunkTimeoutId) { clearTimeout(chunkTimeoutId); chunkTimeoutId = null; }

      updateStatusMessage('Pausing recording…', 'orange');
      try {
        await sileroVAD.pause();
        logInfo('Silero VAD paused');
      } catch (err) {
        logError('Error pausing Silero VAD:', err);
      }
      // Let the final onSpeechEnd land before we set the guard flag.
      await Promise.resolve();
      recordingPaused = true;

      if (sileroVAD?.stream) sileroVAD.stream.getTracks().forEach(t => t.stop());
      stopMicrophone();

      // Flush the tail segment captured by the final onSpeechEnd.
      flushPendingVADOnce('pause');

      pauseResumeButton.innerText = 'Resume Recording';
      updateStatusMessage('Recording paused', 'orange');
      logInfo('Recording paused; buffered speech flushed');
      setStopPauseDisabled(false);
      setAbortButtonDisabled(true);
    }
  }, { signal: uiSignal });

  // ── Abort ─────────────────────────────────────────────────────────────────
  if (abortButton) {
    abortButton.addEventListener('click', async () => {
      if (abortButton.disabled) return;
      setAbortButtonDisabled(true);
      setStopPauseDisabled(true);

      transcriptFrozen = true;
      manualStop = true;
      recordingPaused = false;
      recordingActive = false;
      finalChunkProcessed = false;
      if (chunkTimeoutId) { clearTimeout(chunkTimeoutId); chunkTimeoutId = null; }

      try { if (sileroVAD?.pause) await sileroVAD.pause(); }
      catch (err) { logDebug('Silero VAD pause on abort failed:', err); }

      try { if (sileroVAD?.stream) sileroVAD.stream.getTracks().forEach(t => t.stop()); }
      catch (err) { logDebug('Silero VAD stream stop on abort failed:', err); }

      try {
        if (sileroVAD && !sileroVAD._destroyed) {
          sileroVAD._destroyed = true;
          await sileroVAD.destroy?.();
        }
      } catch (err) { logDebug('Silero VAD destroy on abort failed:', err); }
      finally { sileroVAD = null; }

      stopMicrophone();

      try { sessionAbortController.abort('recording aborted'); } catch (_) {}
      sessionAbortController = new AbortController();

      transcriptionQueue = [];
      isProcessingQueue = false;
      processingQueueSessionId = null;
      pendingVADChunks = [];
      pendingVADLock = false;
      chunkProcessingLock = false;
      pendingStop = false;
      stopInProgress = false;
      freezeCompletionTimer();
      setRecordingControlsIdle();
      updateStatusMessage('Recording aborted.', 'orange');
      logInfo('Recording aborted by user; discarded pending transcription work.');
    }, { signal: uiSignal });
  }

  // ── Stop ──────────────────────────────────────────────────────────────────
  stopButton.addEventListener('click', async () => {
    if (stopButton.disabled) return;
    if (stopInProgress) {
      logDebug('Stop already in progress; ignoring duplicate click.');
      return;
    }
    stopInProgress = true;
    setStopPauseDisabled(true);
    setAbortButtonDisabled(true);
    updateStatusMessage('Finishing transcription...', 'blue');

    // FORCE-FLUSH the in-flight VAD segment via the public API, if any.
    let forcedAudio = null;
    if (sileroVAD && typeof sileroVAD.endSegment === 'function') {
      const result = sileroVAD.endSegment();
      forcedAudio = result?.audio || null;
    }

    if (sileroVAD) {
      try { await sileroVAD.pause(); logInfo('Silero VAD paused on stop'); }
      catch (err) { logError('Error pausing Silero VAD on stop:', err); }

      if (sileroVAD.stream) sileroVAD.stream.getTracks().forEach(t => t.stop());

      if (sileroVAD && !sileroVAD._destroyed) {
        sileroVAD._destroyed = true;
        try { await sileroVAD.destroy?.(); }
        catch (err) { logDebug('sileroVAD destroy error:', err); }
        sileroVAD = null;
      }
    }
    stopMicrophone();

    // Let pause-triggered onSpeechEnd() land, then flush exactly once.
    await Promise.resolve();
    flushPendingVADOnce('stop', forcedAudio);
    await Promise.resolve(); // ensure flush enqueues are visible

    manualStop = true;
    if (chunkTimeoutId) { clearTimeout(chunkTimeoutId); chunkTimeoutId = null; }

    // If paused when Stop pressed, finalize immediately.
    if (recordingPaused) {
      finalChunkProcessed = true;
      updateAsyncTranscriptionOutput();
      setRecordingControlsIdle();
      logInfo('Recording paused and stop pressed; transcription complete without extra processing.');
      return;
    }

    if (audioFrames.length === 0 && !processedAnyAudioFrames) {
      // No speech was ever detected. Decide based on whether any work exists.
      const hasWork =
        transcriptionQueue.length > 0 || isProcessingQueue || pendingVADChunks.length > 0;
      if (hasWork) {
        updateStatusMessage('Finishing transcription...', 'blue');
        if (!completionTimerRunning) startCompletionTimer();
      } else {
        // Pure silence → finalize immediately; timer remains 0.
        updateAsyncTranscriptionOutput();
      }
      setRecordingControlsIdle();
      logInfo('No audio frames captured; instant transcription complete.');
      return;
    }

    if (chunkProcessingLock) {
      pendingStop = true;
      logDebug('Chunk processing locked at stop; setting pendingStop.');
      return;
    }

    await safeProcessAudioChunk();
    if (!processedAnyAudioFrames) {
      beginFreshSession();
      resetCompletionTimerDisplay();
      updateStatusMessage('Recording reset. Ready to start.', 'green');
      setRecordingControlsIdle();
      logInfo('No audio frames processed after safeProcessAudioChunk. Full reset performed.');
      return;
    }

    finalChunkProcessed = true;
    const hasWork =
      transcriptionQueue.length > 0 || isProcessingQueue || pendingVADChunks.length > 0;
    if (hasWork) {
      updateStatusMessage('Finishing transcription...', 'blue');
      if (!completionTimerRunning) startCompletionTimer();
    } else {
      updateAsyncTranscriptionOutput();
    }
    finalizeAsyncStop();
    logInfo('Stop button processed; final chunk handled.');
  }, { signal: uiSignal });
}

// ════════════════════════════════════════════════════════════════════════════
// MODULE EXPORTS + LOAD-TIME SAFETY
// ════════════════════════════════════════════════════════════════════════════

export { initRecording };

// On page load, ensure we don't have a hanging mic / WS / VAD from a
// previous tab state.
installSafeRecordingLoadStop({
  stopMicrophone: () => {
    teardownActivePipeline('page-load');
  },
  getSileroVAD: () => sileroVAD,
});
