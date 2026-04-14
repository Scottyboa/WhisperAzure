import {
  createRecordingUiBindingScope,
  createRecordingUiHelpers,
  flushPendingVadSegmentsGuarded,
  installSafeRecordingLoadStop,
} from './core/recording-runner.js';

// SONIOX_UPDATE_dia.js

let transcriptionError = false;

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32-bit signed integer
  }
  // Convert to an unsigned 32-bit integer and return as string.
  return (hash >>> 0).toString();
}

const DEBUG = true;
 // — Silero VAD initialization —
 // Holds the loaded VAD instance
 let sileroVAD = null;
 // Buffer for accumulating VAD-detected speech segments
  let pendingVADChunks = [];
 let pendingVADLock = false;  // mutex for pause/stop flushes
let pendingVADLastFlushToken = 0;

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
    enqueueTranscription,
    chunkNumber,
    isLocked: () => pendingVADLock,
    setLocked: (value) => { pendingVADLock = value; },
  });

  if (nextChunkNumber !== chunkNumber) {
    chunkNumber = nextChunkNumber;
    logInfo(`[VAD] Flushed pending segments (${reason}).`);
  }
}
// Minimum total speech duration before sending (in seconds)
 const MIN_CHUNK_DURATION_SECONDS = 7200;
 // Configure callbacks for speech start/end
 const sileroVADOptions = {
  // Force a final speech-end event when pause/stop is called, even mid-speech
  submitUserSpeechOnPause: true,
  // ─── MODEL THRESHOLDS & SILENCE PARAMETERS ───────────────
  // confidence ≥ 0.5 → speech
  positiveSpeechThreshold: 0.4,
  // confidence ≤ 0.35 → silence
  negativeSpeechThreshold: 0.35,
  // allow up to 3 “false-silence” frames before firing onSpeechEnd
  redemptionFrames: 5,
  // prepend 1 frame of audio before onSpeechStart
  preSpeechPadFrames: 2,
  // require at least 3 consecutive speech frames to declare onSpeechStart
  minSpeechFrames: 3,
   onSpeechStart: () => {
     // Prevent VAD callbacks after stop
     if (!canShowRecordingStatus()) return;
     logInfo("Silero VAD: speech started");
     recordingActive = true;
     chunkStartTime = Date.now();
     // Always show “Recording…” when speech starts, even on Resume
     updateStatusMessage("Recording…", "green");
     resetCompletionTimerDisplay();
    
   },
   onSpeechEnd: (audioFloat32) => {
     // Prevent late VAD callbacks after pause/stop from buffering or enqueueing more audio.
     if (!canShowRecordingStatus()) return;
     logInfo("Silero VAD: speech ended — buffering audio");
     // Accumulate this segment
     pendingVADChunks.push(audioFloat32);
     // Check if we've buffered enough total duration
     const totalSamples = pendingVADChunks.reduce((sum, seg) => sum + seg.length, 0);
     if (totalSamples >= MIN_CHUNK_DURATION_SECONDS * 16000) {
       // Concatenate into one Float32Array
       const combined = new Float32Array(totalSamples);
       let offset = 0;
       for (const seg of pendingVADChunks) {
         combined.set(seg, offset);
         offset += seg.length;
       }
       // Encode and send for transcription
       const wavBlob = encodeWAV(floatTo16BitPCM(combined), 16000, 1);
       enqueueTranscription(wavBlob, chunkNumber++);
       // Reset buffer
       pendingVADChunks = [];
     }
   }
 };

function logDebug(message, ...optionalParams) {
  if (DEBUG) {
    console.debug(new Date().toISOString(), "[DEBUG]", message, ...optionalParams);
  }
}
function logInfo(message, ...optionalParams) {
  console.info(new Date().toISOString(), "[INFO]", message, ...optionalParams);
}
function logError(message, ...optionalParams) {
  console.error(new Date().toISOString(), "[ERROR]", message, ...optionalParams);
}

const MIN_CHUNK_DURATION = 120000; // 120 seconds
 let recordingActive    = false;   // only true after first speech detected
 let mediaStream = null;
let processedAnyAudioFrames = false;
let audioReader = null;

let completionTimerInterval = null;
let completionStartTime = 0;
let completionTimerRunning = false;
let groupId = null;
let chunkNumber = 1;
let manualStop = false;
let transcriptChunks = {};
let transcriptFrozen = false;
let stopInProgress = false;
let abortRequested = false;
let pollingIntervals = {};  // (removed polling functions, kept for legacy structure)

let chunkStartTime = 0;
let lastFrameTime = 0;
let lastSpeechTime = 0;       // used by readLoop/scheduleChunk
const VAD_THRESHOLD = 0.005;  // RMS gate for speech detection
const SILENCE_DURATION = 2000; // ms of silence to close a chunk
let chunkTimeoutId;
let expectedChunks = 0;

let chunkProcessingLock = false;
let pendingStop = false;
let finalChunkProcessed = false;
let recordingPaused = false;
let audioFrames = []; // Buffer for audio frames

// --- New Transcription Queue Variables ---
let transcriptionQueue = [];  // Queue of { chunkNumber, blob }
let isProcessingQueue = false;
let enqueuedChunks = 0;  



// --- NEW: Session cancel / abort plumbing ---
// Each time Start is clicked, we create a fresh session + abort controller.
// Anything still running from the previous session gets aborted and/or ignored.
let transcriptionSessionAbortController = new AbortController();
let processingQueueSessionId = null; // tracks which session currently owns the queue worker

function beginFreshTranscriptionSession() {
  // Abort any in-flight network requests/polls for the previous session.
  try { transcriptionSessionAbortController.abort("new session started"); } catch (_) {}
  transcriptionSessionAbortController = new AbortController();

  // Hard-clear any pending work so Start always begins clean.
  transcriptionQueue = [];
  isProcessingQueue = false;
  processingQueueSessionId = null;

  // Also clear any buffered VAD segments so we don't accidentally flush old audio.
  pendingVADChunks = [];
  pendingVADLock = false;

  // Release chunk stop/flush locks if they were left set by an earlier run.
  chunkProcessingLock = false;
  pendingStop = false;
  manualStop = false;
  stopInProgress = false;

  // Ensure UI writes are allowed again for the new session.
  transcriptFrozen = false;
}
// --- Utility Functions ---
const {
  updateStatusMessage,
  setAbortButtonDisabled,
  setRecordingControlsIdle,
  stopMicrophone,
} = createRecordingUiHelpers({
  logInfo,
  getMediaStream: () => mediaStream,
  setMediaStream: (value) => { mediaStream = value; },
  getAudioReader: () => audioReader,
  setAudioReader: (value) => { audioReader = value; },
});

function canShowRecordingStatus() {
  return !manualStop && !stopInProgress && !transcriptFrozen && !recordingPaused;
}

// ───── Completion timer helpers ───────────────────────────────────────────────
function startCompletionTimer() {
  if (completionTimerInterval) return; // already running
  completionStartTime = Date.now();
  completionTimerInterval = setInterval(() => {
    const timerElem = document.getElementById("transcribeTimer");
    if (timerElem) {
      timerElem.innerText =
        "Completion Timer: " + formatTime(Date.now() - completionStartTime);
    }
  }, 1000);
  completionTimerRunning = true;
}

function freezeCompletionTimer() {
  if (completionTimerInterval) {
    clearInterval(completionTimerInterval);
    completionTimerInterval = null;
  }
  completionTimerRunning = false;
  // do NOT reset text — it should freeze on final time
}

function resetCompletionTimerDisplay() {
  if (completionTimerInterval) {
    clearInterval(completionTimerInterval);
    completionTimerInterval = null;
  }
  completionTimerRunning = false;
  const timerElem = document.getElementById("transcribeTimer");
  if (timerElem) timerElem.innerText = "Completion Timer: 0 sec";
}


// ────────────────────────────────
// ADD THIS HELPER JUST BELOW updateStatusMessage()

async function fetchWithTimeout(resource, options = {}, timeoutMs = 30000) {
  const timeoutController = new AbortController();
  const id = setTimeout(() => timeoutController.abort(), timeoutMs);

  // Optional: also abort this request if the caller's signal aborts (e.g. Start clicked → session reset).
  const callerSignal = options?.signal;
  let onAbort = null;
  if (callerSignal) {
    onAbort = () => {
      try { timeoutController.abort(); } catch (_) {}
    };
    if (callerSignal.aborted) {
      onAbort();
    } else {
      callerSignal.addEventListener("abort", onAbort, { once: true });
    }
  }

  try {
    // Remove any caller-provided signal and replace with our controller's signal.
    const { signal: _ignored, ...rest } = options || {};
    const response = await fetch(resource, { ...rest, signal: timeoutController.signal });
    if (response.status === 401 || response.status === 403) {
      updateStatusMessage("Soniox: Unauthorized – check your API key or region.", "red");
    }
    return response;
  } finally {
    clearTimeout(id);
    if (callerSignal && onAbort) {
      try { callerSignal.removeEventListener("abort", onAbort); } catch (_) {}
    }
  }
}



function formatTime(ms) {
  const totalSec = Math.floor(ms / 1000);
  if (totalSec < 60) {
    return totalSec + " sec";
  } else {
    const minutes = Math.floor(totalSec / 60);
    const seconds = totalSec % 60;
    return minutes + " min" + (seconds > 0 ? " " + seconds + " sec" : "");
  }
}



// --- Base64 Helper Functions (kept for legacy) ---
function arrayBufferToBase64(buffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}
function base64ToArrayBuffer(base64) {
  const binary = window.atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// --- Device Token Management ---
function getDeviceToken() {
  let token = localStorage.getItem("device_token");
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem("device_token", token);
  }
  return token;
}

// --- API Key Retrieval ---
// With encryption removed, we now simply get the API key from sessionStorage.
function getAPIKey() {
  return sessionStorage.getItem("user_api_key");
}

// Region-aware base: reads sessionStorage on every call
function getSonioxBase() {
  const region = (sessionStorage.getItem("soniox_region") || "eu").toLowerCase();
  return region === "eu"
    ? "https://api.eu.soniox.com/v1"
    : "https://api.soniox.com/v1";
}
const AUTO_CLEAN_ON_LOAD = true;

async function uploadToSonioxFile(wavBlob, filename, { signal } = {}, retries = 5, backoff = 2000) {
  const apiKey = getAPIKey();
  if (!apiKey) throw new Error("API key not available");
  const fd = new FormData();
  fd.append("file", wavBlob, filename);
  try {
    const rsp = await fetchWithTimeout(`${getSonioxBase()}/files`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
     body: fd,      signal,
    }, 30000);
    if (!rsp.ok) throw new Error(`Soniox file upload failed: ${await rsp.text()}`);
    const j = await rsp.json();
    return j.id; // file_id
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

async function createSonioxTranscription(fileId, context, { signal } = {}, retries = 5, backoff = 2000) {
  const apiKey = getAPIKey();
  if (!apiKey) throw new Error("API key not available");
  const body = {
    model: "stt-async-v4",
    file_id: fileId,
    // Norwegian first, then English, but Soniox auto-detects if omitted:
    language_hints: ["no", "en"],
    // ── Enable diarization so tokens include a "speaker" field ──
    enable_speaker_diarization: true,
    // keep language ID as before (useful in mixed NO/EN consults)
    enable_language_identification: true,
    context, // optional domain/context string
  };
  try {
    const rsp = await fetchWithTimeout(`${getSonioxBase()}/transcriptions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),      signal,
    }, 30000);
    if (!rsp.ok) throw new Error(`Create transcription failed: ${await rsp.text()}`);
    const j = await rsp.json();
    return j.id; // transcription_id
  } catch (err) {
    if (signal?.aborted) throw err;
    if (retries > 0) {
      console.warn(`Create failed, retrying in ${backoff}ms… (${retries} left)`);
      await new Promise(r => setTimeout(r, backoff));
      return createSonioxTranscription(fileId, context, { signal }, retries - 1, Math.floor(backoff * 1.5));
    }
    throw err;
  }
}

async function pollSonioxTranscription(transcriptionId, timeoutMs = 300000, intervalMs = 1500, { signal } = {}) {
  const apiKey = getAPIKey();
  const start = Date.now();
  while (true) {
    // Use timeout wrapper so a single stalled poll request doesn't hang indefinitely.
    let rsp;
    try {
      rsp = await fetchWithTimeout(
        `${getSonioxBase()}/transcriptions/${transcriptionId}`,
        { headers: { Authorization: `Bearer ${apiKey}` }, signal },
        30000 // 30 s per poll attempt
      );
    } catch (err) {
      // If a single poll request times out/aborts, retry this same job ID
      if (err && err.name === "AbortError") {
        // If this session was explicitly aborted (e.g. user clicked Start again), stop immediately.
        if (signal?.aborted) throw err;
        logDebug(`Poll ${transcriptionId} aborted after 30s; retrying…`);
        // optional small delay to avoid hot-looping
        await new Promise(r => setTimeout(r, intervalMs));
        // check overall timeout before next iteration
        if (Date.now() - start > timeoutMs) throw new Error("Transcription timed out");
        continue;
      }
      throw err; // real error → surface it
    }
    if (!rsp.ok) throw new Error(`Poll failed: ${await rsp.text()}`);
    const j = await rsp.json();
    if (j.status === "completed") return;
    if (j.status === "error") throw new Error(j.error_message || "Transcription error");
    if (Date.now() - start > timeoutMs) throw new Error("Transcription timed out");
    await new Promise(r => setTimeout(r, intervalMs));
  }
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function fetchSonioxTranscriptText(transcriptionId, { signal } = {}, retries = 5, delayMs = 2000, perAttemptTimeoutMs = 30000) {
  const apiKey = getAPIKey();
  let attempt = 0;

  while (true) {
    try {
      const rsp = await fetchWithTimeout(
        `${getSonioxBase()}/transcriptions/${transcriptionId}/transcript`,
        { headers: { Authorization: `Bearer ${apiKey}` }, signal },
        perAttemptTimeoutMs
      );

      if (!rsp.ok) {
        const body = await rsp.text().catch(() => "");
       throw new Error(
         `Get transcript failed: ${rsp.status} ${rsp.statusText}` +
         (body ? ` — ${body}` : "")
        );
      }

      const j = await rsp.json();
      // If diarization is enabled, Soniox returns tokens with a `speaker` field.
      // Prefer a speaker-labeled rendering when available.
      if (Array.isArray(j.tokens) && j.tokens.some(t => t && typeof t.speaker !== "undefined")) {
        return renderDiarizedTranscript(j.tokens);
      }
      // Fallback: plain text
      return j.text || "";
    } catch (err) {
      if (signal?.aborted) throw err;
      attempt += 1;
      if (attempt > retries) {
        logError(`Get transcript failed after ${retries} retries:`, err);
        throw err;
      }
      logInfo(`Get transcript attempt ${attempt} failed; retrying in ${delayMs}ms…`);
      await sleep(delayMs);
    }
  }
}

// + Estimate WAV duration (mono, 16-bit, 16 kHz)
function estimateWavSeconds(wavBlob) {
  const BYTES_PER_SEC = 16000 /* Hz */ * 2 /* bytes/sample */ * 1 /* channel */; // 32000
  const payloadBytes = Math.max(0, wavBlob.size - 44); // strip 44-byte WAV header
  return payloadBytes / BYTES_PER_SEC;
}


// ─────────────────── Diarized transcript rendering ───────────────────
// Groups consecutive tokens by speaker and creates readable "Speaker N: ..." lines.
// Assumes tokens like: { text: " hello", speaker: "1", start_ms, end_ms, confidence }
function renderDiarizedTranscript(tokens) {
  const lines = [];
  let curSpk = null;
  let curText = "";

  const flush = () => {
    if (curSpk !== null && curText.trim()) {
      lines.push(`Speaker ${String(curSpk)}: ${curText.trim()}`);
    }
    curText = "";
  };

  for (const tok of tokens) {
    const spk = tok && typeof tok.speaker !== "undefined" ? tok.speaker : curSpk;
    if (curSpk === null) curSpk = spk;
    if (spk !== curSpk) {
      flush();
      curSpk = spk;
    }
    // Preserve Soniox token spacing as provided (tokens may include leading spaces)
    curText += tok && typeof tok.text === "string" ? tok.text : "";
  }
  flush();
  return lines.join("\n");
}

// ─────────────────── One-shot cleanup (runs once per session) ───────────────────
// ─────────────────── Cleanup on every page load ───────────────────
async function cleanupSonioxAll() {
  if (!AUTO_CLEAN_ON_LOAD) {
    console.log("[SonioxCleanup] Skipped: AUTO_CLEAN_ON_LOAD=false");
    return;
  }
  const apiKey = getAPIKey();
  if (!apiKey) {
    console.log("[SonioxCleanup] Skipped: no API key present");
    return;
  }
  const hdrs = { Authorization: `Bearer ${apiKey}` };
  const base = getSonioxBase();
  console.group("[SonioxCleanup] Starting full cleanup…");
  console.time("[SonioxCleanup] total");
  try {
    // 1) Delete transcriptions
    const tResp = await fetchWithTimeout(`${base}/transcriptions`, { headers: hdrs }, 30000);
    if (tResp.ok) {
      const tJson = await tResp.json().catch(() => ({}));
      const ts = Array.isArray(tJson?.transcriptions) ? tJson.transcriptions : [];
      console.log(`[SonioxCleanup] Found ${ts.length} transcriptions`);
      for (const t of ts) {
        try {
          await fetchWithTimeout(`${base}/transcriptions/${t.id}`, { method: "DELETE", headers: hdrs }, 30000);
          console.log("  ↳ deleted transcription:", t.id);
        } catch (e) {
          console.warn("  ! failed deleting transcription", t?.id, e);
        }
      }
    } else {
      console.warn("[SonioxCleanup] Failed to list transcriptions:", await tResp.text());
    }

    // 2) Delete files
    const fResp = await fetchWithTimeout(`${base}/files`, { headers: hdrs }, 30000);
    if (fResp.ok) {
      const fJson = await fResp.json().catch(() => ({}));
      const fs = Array.isArray(fJson?.files) ? fJson.files : [];
      console.log(`[SonioxCleanup] Found ${fs.length} files`);
      for (const f of fs) {
        try {
          await fetchWithTimeout(`${base}/files/${f.id}`, { method: "DELETE", headers: hdrs }, 30000);
          console.log("  ↳ deleted file:", f.id);
        } catch (e) {
          console.warn("  ! failed deleting file", f?.id, e);
        }
      }
    } else {
      console.warn("[SonioxCleanup] Failed to list files:", await fResp.text());
    }
    console.timeEnd("[SonioxCleanup] total");
    console.groupEnd();
    console.log("✅ [SonioxCleanup] Finished cleanup on page load.");
  } catch (e) {
    console.error("[SonioxCleanup] Error during cleanup:", e);
  }
}



// ─────────────────── Deletion helpers (place right after fetchSonioxTranscriptText) ───────────────────
async function deleteSonioxTranscription(transcriptionId) {
  if (!transcriptionId) return;
  const apiKey = getAPIKey();
  try {
    const rsp = await fetch(`${getSonioxBase()}/transcriptions/${transcriptionId}`, {
      method: "DELETE",
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
    const rsp = await fetch(`${getSonioxBase()}/files/${fileId}`, {
      method: "DELETE",
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
  // Best-effort cleanup; do not throw.
  await Promise.allSettled([
    deleteSonioxTranscription(transcriptionId),
    deleteSonioxFile(fileId),
  ]);
}

// --- OfflineAudioContext Processing ---
// This function takes interleaved PCM samples (Float32Array), the original sample rate, and the number of channels,
// converts the audio to mono (averaging channels if needed), resamples to 16kHz, and applies 0.3s fade-in/out.
// It returns a 16-bit PCM WAV Blob.
async function processAudioUsingOfflineContext(pcmFloat32, originalSampleRate, numChannels) {
  const targetSampleRate = 16000;
  
  // Calculate the number of frames
  const numFrames = pcmFloat32.length / numChannels;
  
  // Create an AudioBuffer in a temporary AudioContext
  let tempCtx = new AudioContext();
  let originalBuffer = tempCtx.createBuffer(numChannels, numFrames, originalSampleRate);
  
  if (numChannels === 1) {
    originalBuffer.copyToChannel(pcmFloat32, 0);
  } else {
    // Deinterleave and copy each channel
    for (let ch = 0; ch < numChannels; ch++) {
      let channelData = new Float32Array(numFrames);
      for (let i = 0; i < numFrames; i++) {
        channelData[i] = pcmFloat32[i * numChannels + ch];
      }
      originalBuffer.copyToChannel(channelData, ch);
    }
  }
  // Convert to mono by averaging channels if necessary
  let monoBuffer;
  if (numChannels > 1) {
    let monoData = new Float32Array(numFrames);
    for (let i = 0; i < numFrames; i++) {
      let sum = 0;
      for (let ch = 0; ch < numChannels; ch++) {
        sum += originalBuffer.getChannelData(ch)[i];
      }
      monoData[i] = sum / numChannels;
    }
    monoBuffer = tempCtx.createBuffer(1, numFrames, originalSampleRate);
    monoBuffer.copyToChannel(monoData, 0);
  } else {
    monoBuffer = originalBuffer;
  }
  tempCtx.close();
  
  // Set up OfflineAudioContext for resampling
  const duration = monoBuffer.duration;
  const offlineCtx = new OfflineAudioContext(1, targetSampleRate * duration, targetSampleRate);
  
  const source = offlineCtx.createBufferSource();
  source.buffer = monoBuffer;
  
// Modified code snippet to fix the negative time error:
const gainNode = offlineCtx.createGain();
const fadeDuration = 0.3;
gainNode.gain.setValueAtTime(0, 0);
gainNode.gain.linearRampToValueAtTime(1, fadeDuration);

// Compute fade-out start time, ensuring it's non-negative
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

 // --- New: Transcribe Chunk Directly ---

// Sends the WAV blob to Soniox and returns the transcript text; cleans up after.
 async function transcribeChunkDirectly(wavBlob, chunkNum, { signal, sessionId } = {}) {
   // Build a domain/context string like your old prompt, but Soniox expects 'context'
  const context =
    "Doctor-patient consultation. Mostly Norwegian; sometimes English. " +
    "Transcribe clearly. Exclude filler words and false starts. Do not paraphrase or summarize.";
  let fileId = null;
  let txId = null;
  try {
    const filename = `chunk_${chunkNum}.wav`;
    // 1) upload the WAV
    fileId = await uploadToSonioxFile(wavBlob, filename, { signal });
    // 2) create a transcription job on Soniox async model
    txId = await createSonioxTranscription(fileId, context, { signal });
    // 3) poll until done, timeout scales with audio length
    const secs = estimateWavSeconds(wavBlob);
    const timeoutMs = Math.max(300000, Math.ceil(secs * 4000)); // >=5 min, ~4× audio length
    await pollSonioxTranscription(txId, timeoutMs, 1500, { signal });
    // 4) fetch final text
    const text = await fetchSonioxTranscriptText(txId, { signal });
    // 5) best-effort cleanup
    await cleanupSonioxResources({ transcriptionId: txId, fileId });
    return text || "";
  } catch (error) {
    // If user started a new session, treat this as a silent cancel.
    if (signal?.aborted || (sessionId && sessionId !== groupId)) {
      await cleanupSonioxResources({ transcriptionId: txId, fileId });
      return "";
    }
    logError(`Error transcribing chunk ${chunkNum}:`, error);
    // try to clean up anything we created
    await cleanupSonioxResources({ transcriptionId: txId, fileId });
     updateStatusMessage(
       "Transcription error with Soniox API. Check key/credits or try again.",
       "red"
     );
     transcriptionError = true;
     return `[Error transcribing chunk ${chunkNum}]`;
   }
 }


// --- Transcription Queue Processing ---
// Adds a processed chunk to the queue and processes chunks sequentially.
function enqueueTranscription(wavBlob, chunkNum) {
  transcriptionQueue.push({ sessionId: groupId, signal: transcriptionSessionAbortController.signal, chunkNum, wavBlob });
  enqueuedChunks += 1;

    // Always schedule a kick; the worker will no-op if already running.
  // Using a microtask avoids races where isProcessingQueue flips after we check it.
  queueMicrotask(() => {
    processTranscriptionQueue();
  });
}


async function processTranscriptionQueue() {
  const mySessionId = groupId;
  const mySignal = transcriptionSessionAbortController.signal;

  // If a worker is already running for THIS SAME session, just let it drain.
  if (isProcessingQueue && processingQueueSessionId === mySessionId) return;

  // If a worker is running for an OLD session, do NOT wait for it.
  // Start a fresh worker for the current session (the old one will become a no-op once aborted).
  isProcessingQueue = true;
  processingQueueSessionId = mySessionId;

  try {
    while (transcriptionQueue.length > 0) {
      // If a new session started, abandon this worker immediately.
      if (groupId !== mySessionId || mySignal.aborted) break;

      const item = transcriptionQueue.shift();
      if (!item) continue;

      // Skip anything not belonging to this session.
      if (item.sessionId !== mySessionId) continue;

      let { chunkNum, wavBlob } = item;
      logInfo(`Transcribing chunk ${chunkNum}...`);

      const transcript = await transcribeChunkDirectly(wavBlob, chunkNum, {
        signal: item.signal || mySignal,
        sessionId: mySessionId,
      });

      // If a new session started while we were transcribing, ignore the result.
      if (groupId !== mySessionId || mySignal.aborted) break;

      // Only write results for the active session.
      transcriptChunks[chunkNum] = transcript;
      updateTranscriptionOutput();

      // free this chunk’s audio immediately
      wavBlob = null;
    }
  } finally {
    // Only the owning worker may clear the flag.
    if (processingQueueSessionId === mySessionId) {
      isProcessingQueue = false;
      processingQueueSessionId = null;
    }

    // If we stopped and nothing remains, do one last write only if not frozen and still same session.
    if (groupId === mySessionId && manualStop && transcriptionQueue.length === 0 && !transcriptFrozen) {
      updateTranscriptionOutput();
    }
  }
}


// --- Removed: Polling functions (pollChunkTranscript) since we now transcribe directly ---

// --- Audio Chunk Processing ---
async function processAudioChunkInternal(force = false) {
  if (audioFrames.length === 0) {
    logDebug("No audio frames to process.");
    return;
  }
  // Mark that we have processed at least one frame set.
  processedAnyAudioFrames = true;
  
  logInfo(`Processing ${audioFrames.length} audio frames for chunk ${chunkNumber}.`);
  const framesToProcess = audioFrames;
  audioFrames = []; // Clear the buffer
  const sampleRate = framesToProcess[0].sampleRate;
  const numChannels = framesToProcess[0].numberOfChannels;
  let pcmDataArray = [];
  for (const frame of framesToProcess) {
    const numFrames = frame.numberOfFrames;
    if (numChannels === 1) {
      const channelData = new Float32Array(numFrames);
      frame.copyTo(channelData, { planeIndex: 0 });
      pcmDataArray.push(channelData);
    } else {
      let channelData = [];
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
  
  // Process the raw audio samples using OfflineAudioContext:
  // Convert to mono, resample to 16kHz, and apply 0.3s fade-in/out.
  // No extra silence padding—just resample & fade the raw PCM
  const wavBlob = await processAudioUsingOfflineContext(
    pcmFloat32,
    sampleRate,
    numChannels
  );
  
  // Instead of uploading to a backend, enqueue this processed chunk for direct transcription.
  enqueueTranscription(wavBlob, chunkNumber);
  
  chunkNumber++;
}

async function safeProcessAudioChunk(force = false) {
  if (manualStop && finalChunkProcessed) {
    logDebug("Final chunk already processed; skipping safeProcessAudioChunk.");
    return;
  }
  if (chunkProcessingLock) {
    logDebug("Chunk processing is locked; skipping safeProcessAudioChunk.");
    return;
  }
  chunkProcessingLock = true;
  await processAudioChunkInternal(force);
  chunkProcessingLock = false;
  if (pendingStop) {
    pendingStop = false;
    finalizeStop();
  }
}

function finalizeStop() {
  const startButton = document.getElementById("startButton");
  const stopButton = document.getElementById("stopButton");
  const pauseResumeButton = document.getElementById("pauseResumeButton");
  if (startButton) startButton.disabled = true;
  if (stopButton) stopButton.disabled = true;
  if (pauseResumeButton) pauseResumeButton.disabled = true;
  logInfo("Recording stopped by user. Finalizing transcription.");
  // Optionally, you could wait here for the queue to empty before declaring completion.
}

function updateTranscriptionOutput() {
  // Prevent any post-finish writes from wiping the UI
  if (transcriptFrozen) return;

  const sortedKeys = Object.keys(transcriptChunks).map(Number).sort((a, b) => a - b);
  let combinedTranscript = "";
  for (const key of sortedKeys) {
    combinedTranscript += transcriptChunks[key] + " ";
  }
  const text = combinedTranscript.trim();
  logDebug("UI write: combinedTranscript.length=", text.length);

  const transcriptionElem = document.getElementById("transcription");
  if (transcriptionElem) {
    // Write safely regardless of element type
    if ("value" in transcriptionElem) {
      transcriptionElem.value = text;
    } else {
      transcriptionElem.textContent = text;
    }
  }

  // When all work is done, freeze to avoid late wipes
  if (manualStop && transcriptionQueue.length === 0 && !isProcessingQueue) {
    freezeCompletionTimer();
    if (!transcriptionError) {
      updateStatusMessage("Transcription finished!", "green");
      window.__app?.emitTranscriptionFinished?.({ provider: "soniox", reason: "queueDrained" });
      logInfo("Transcription complete.");
    } else {
      logInfo("Transcription complete with errors; keeping error message visible.");
    }
    stopInProgress = false;
    transcriptFrozen = true;
  }
}

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
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
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

function scheduleChunk() {
  // bail out immediately if we’ve stopped or paused
  if (!recordingActive || manualStop || recordingPaused) return;

  const elapsed     = Date.now() - chunkStartTime;
  const silenceFor  = Date.now() - lastSpeechTime;

  if (elapsed >= MIN_CHUNK_DURATION && silenceFor >= SILENCE_DURATION) {
    logInfo("Silence detected after min-duration; closing chunk.");
    safeProcessAudioChunk();
    recordingActive  = false;
    chunkStartTime   = Date.now();
    lastSpeechTime   = Date.now();
    logInfo("Listening for speech…");

    // after closing a chunk we do NOT immediately re-arm the timer;
    // we’ll wait for next `onSpeechStart` to call scheduleChunk again
  } else {
    // only re-schedule while still in the middle of a potential chunk
    chunkTimeoutId = setTimeout(scheduleChunk, 500);
  }
}

function resetRecordingState() {
  // ─── Clear our quota-error flag for this session ───
  transcriptionError = false;
  // ─── Clear any old completion timer (we’re starting fresh) ───
  resetCompletionTimerDisplay();
  enqueuedChunks = 0;
  expectedChunks = 0;
  Object.values(pollingIntervals).forEach(interval => clearInterval(interval));
  pollingIntervals = {};
  clearTimeout(chunkTimeoutId);
  

  transcriptChunks = {};
  transcriptFrozen = false;
  audioFrames = [];
  chunkStartTime = Date.now();
  lastFrameTime = Date.now();
  lastSpeechTime = Date.now();
  manualStop = false;
  finalChunkProcessed = false;
  recordingPaused = false;
  groupId = Date.now().toString();
  chunkNumber = 1;
  
   processedAnyAudioFrames = false;
  // reset VAD state
  recordingActive    = false;
  // lastSpeechTime removed (legacy)
  
}

function initRecording() {
  const startButton       = document.getElementById("startButton");
  const stopButton        = document.getElementById("stopButton");
  const pauseResumeButton = document.getElementById("pauseResumeButton");
  const abortButton       = document.getElementById("abortButton");
  if (!startButton || !stopButton || !pauseResumeButton) return;

  // Cross-abort: kill the OTHER Soniox module's listeners and
  // destroy its VAD instance if it's live. Without this, toggling
  // speaker labels leaves both SONIOX_UPDATE.js and
  // SONIOX_UPDATE_dia.js loaded with both sets of click listeners
  // and both Silero VAD pipelines running in parallel — producing
  // duplicate VAD logs, dual transcription chunks, and incoherent
  // button states.
  try { window.__sonioxUIAbort_soniox?.abort("switched-to-dia"); } catch (_) {}
  try { window.__sonioxTeardownVAD_soniox?.(); } catch (_) {}

  // Make self init idempotent: if initRecording() is called again, kill old listeners.
  window.__sonioxUIAbort_soniox_dia?.abort("re-init");
  window.__sonioxUIAbort_soniox_dia = new AbortController();
  const uiSignal = window.__sonioxUIAbort_soniox_dia.signal;

  // Expose a teardown hook so the non-dia module can stop our VAD
  // cleanly if the user toggles speaker labels off. This mirrors the
  // teardown logic in the stopButton/abortButton handlers but runs
  // on demand rather than on user action.
  window.__sonioxTeardownVAD_soniox_dia = () => {
    try {
      if (sileroVAD && typeof sileroVAD.pause === "function") {
        sileroVAD.pause().catch(() => {});
      }
      if (sileroVAD && sileroVAD.stream) {
        sileroVAD.stream.getTracks().forEach((t) => {
          try { t.stop(); } catch (_) {}
        });
      }
      if (sileroVAD && !sileroVAD._destroyed) {
        sileroVAD._destroyed = true;
        try { sileroVAD.destroy?.(); } catch (_) {}
      }
    } catch (_) {}
    sileroVAD = null;
  };


  // --- PULL readLoop INTO SHARED SCOPE ---
  async function readLoop() {
    try {
      const { done, value } = await audioReader.read();
      if (done) {
        logInfo("Audio track reading complete.");
        return;
      }
      // VAD computation
      const numSamples = value.numberOfFrames * value.numberOfChannels;
      const buf = new Float32Array(numSamples);
      value.copyTo(buf, { planeIndex: 0 });
      let sumSq = 0;
      for (let i = 0; i < buf.length; i++) sumSq += buf[i] * buf[i];
      const rms = Math.sqrt(sumSq / buf.length);
      logDebug(`RMS=${rms.toFixed(5)}`);

      if (rms > VAD_THRESHOLD) {
        lastSpeechTime = Date.now();
        if (!recordingActive) {
          // — NEW: log whenever speech is detected
          logInfo("Speech detected… recording");
          recordingActive = true;
          chunkStartTime  = Date.now();

          // First-chunk UX tweaks (recording timer is centralized in transcribe.html)
          if (chunkNumber === 1) {
            
            pauseResumeButton.innerText = "Pause Recording";
            if (canShowRecordingStatus()) {
              updateStatusMessage("Recording…", "green");
              resetCompletionTimerDisplay();
            }
          }

          scheduleChunk();
        }
      }

      if (recordingActive) {
        audioFrames.push(value);
      }
      readLoop();
    } catch (err) {
      logError("Error reading audio frames", err);
    }
  }

  startButton.addEventListener("click", async () => {
    // Retrieve the API key before starting.
    const apiKey = getAPIKey();
  if (!apiKey) {
    alert("Please enter your Soniox API key first.");
    return;
  }
    startButton.disabled = true;


    // NEW: Start is a hard reset: abort/clear any pending transcription work.
    beginFreshTranscriptionSession();
    // NEW: Purge Soniox-side data immediately when a new recording session starts.
    // Fire-and-forget so the UI doesn't stall if Soniox is slow.
    cleanupSonioxAll().catch((err) => {
      logError("Soniox cleanup on start failed", err);
    });

    abortRequested = false;
    resetRecordingState();
    const transcriptionElem = document.getElementById("transcription");
    if (transcriptionElem) {
      // Clear the visible field at the start of a new session
      if ("value" in transcriptionElem) {
        transcriptionElem.value = "";
      } else {
        transcriptionElem.textContent = "";
      }
    }
    
    // initialize and start Silero VAD
    updateStatusMessage("Loading voice-activity model...", "orange");
    try {
      if (!sileroVAD) {
        sileroVAD = await vad.MicVAD.new(sileroVADOptions);
      } 
      await sileroVAD.start();
      updateStatusMessage("Listening for speech…", "green");
      logInfo("Silero VAD started");
      stopButton.disabled = false;
      pauseResumeButton.disabled = false;
      pauseResumeButton.innerText = "Pause Recording";
      setAbortButtonDisabled(false);
    } catch (error) {
      updateStatusMessage("VAD initialization error: " + error, "red");
      logError("Silero VAD error", error);
      startButton.disabled = false;
      setAbortButtonDisabled(true);
    }
  }, { signal: uiSignal });

pauseResumeButton.addEventListener("click", async () => {
  if (recordingPaused) {
    // RESUME: destroy old VAD and start a fresh one
    updateStatusMessage("Resuming recording…", "orange");
    try {
      // ── destroy previous VAD instance to free WASM and buffers ──
      if (sileroVAD && typeof sileroVAD.destroy === "function") {
        await sileroVAD.destroy();
      }
      // re-create the VAD (this will re-prompt/open the mic)
      sileroVAD = await vad.MicVAD.new(sileroVADOptions);
      await sileroVAD.start();
      recordingPaused = false;
      
      pauseResumeButton.innerText = "Pause Recording";
      setAbortButtonDisabled(false);
      updateStatusMessage("Listening for speech…", "green");
      logInfo("Silero VAD resumed");
    } catch (err) {
      updateStatusMessage("Error resuming VAD: " + err, "red");
      logError("Error resuming Silero VAD:", err);
    }
  } else {
    // Do NOT set recordingPaused yet — submitUserSpeechOnPause fires
    // a final onSpeechEnd inside sileroVAD.pause() with the tail audio.
    // onSpeechEnd guards on recordingPaused, so flipping the flag
    // before pause() silently drops the tail segment.
    recordingActive = false;
    clearTimeout(chunkTimeoutId);

    // PAUSE: stop VAD (fires final onSpeechEnd with tail audio)
    updateStatusMessage("Pausing recording…", "orange");
    try {
      await sileroVAD.pause();
      logInfo("Silero VAD paused");
    } catch (err) {
      logError("Error pausing Silero VAD:", err);
    }
    // Let the final onSpeechEnd land before we set the guard flag.
    await Promise.resolve();
    recordingPaused = true;

    // Actually stop the mic that Silero opened:
    if (sileroVAD.stream) {
      sileroVAD.stream.getTracks().forEach(t => t.stop());
    }
    stopMicrophone();

    // Flush the tail segment captured by the final onSpeechEnd.
    flushPendingVADOnce("pause");

    pauseResumeButton.innerText = "Resume Recording";
    setAbortButtonDisabled(true);
    updateStatusMessage("Recording paused", "orange");
    logInfo("Recording paused; buffered speech flushed");
  }
}, { signal: uiSignal });


if (abortButton) {
  abortButton.addEventListener("click", async () => {
    if (abortButton.disabled) return;

    abortRequested = true;
    transcriptFrozen = true;
    manualStop = true;
    recordingPaused = false;
    recordingActive = false;
    finalChunkProcessed = false;
    clearTimeout(chunkTimeoutId);

    try {
      if (sileroVAD && typeof sileroVAD.pause === "function") {
        await sileroVAD.pause();
      }
    } catch (err) {
      logDebug("Silero VAD pause on abort failed:", err);
    }

    try {
      if (sileroVAD?.stream) {
        sileroVAD.stream.getTracks().forEach(t => t.stop());
      }
    } catch (err) {
      logDebug("Silero VAD stream stop on abort failed:", err);
    }

    try {
      if (sileroVAD && !sileroVAD._destroyed) {
        sileroVAD._destroyed = true;
        await sileroVAD.destroy?.();
      }
    } catch (err) {
      logDebug("Silero VAD destroy on abort failed:", err);
    } finally {
      sileroVAD = null;
    }

    stopMicrophone();

    try {
      transcriptionSessionAbortController.abort("recording aborted");
    } catch (_) {}
    transcriptionSessionAbortController = new AbortController();

    transcriptionQueue = [];
    isProcessingQueue = false;
    processingQueueSessionId = null;
    pendingVADChunks = [];
    pendingVADLock = false;
    chunkProcessingLock = false;
    pendingStop = false;
    freezeCompletionTimer();
    setRecordingControlsIdle();
    updateStatusMessage("Recording aborted.", "orange");
    logInfo("Recording aborted by user; discarded pending transcription work.");
  }, { signal: uiSignal });
}

stopButton.addEventListener("click", async () => {
  if (stopInProgress) {
    logDebug("Stop already in progress; ignoring duplicate click.");
    return;
  }
  stopInProgress = true;
  stopButton.disabled = true;
  pauseResumeButton.disabled = true;
  updateStatusMessage("Finishing transcription...", "blue");
  setAbortButtonDisabled(true);
  // --- FORCE-FLUSH the in-flight VAD segment via the public API ---
  // If MicVAD supports endSegment(), use it to emit the last audio
  let forcedAudio = null;
  if (sileroVAD && typeof sileroVAD.endSegment === "function") {
    const result = sileroVAD.endSegment();
    forcedAudio = result?.audio || null;
  }
  // First pause VAD to emit final onSpeechEnd
  if (sileroVAD) {
    try {
      await sileroVAD.pause();     // pause VAD to emit final onSpeechEnd
      logInfo("Silero VAD paused on stop");
    } catch (err) {
      logError("Error pausing Silero VAD on stop:", err);
    }
    // stop the mic Silero opened
    if (sileroVAD.stream) {
      sileroVAD.stream.getTracks().forEach(t => t.stop());
    }
    // destroy the VAD instance to free WASM/model memory
    if (sileroVAD && !sileroVAD._destroyed) {
  sileroVAD._destroyed = true;
  try {
    await sileroVAD.destroy?.();
  } catch (err) {
    logDebug("sileroVAD destroy error:", err);
  }
  sileroVAD = null;
}

  }
  // **new**: absolutely kill the media tracks
  stopMicrophone();

  await Promise.resolve();
  flushPendingVADOnce("stop", forcedAudio);
  await Promise.resolve(); // ensure any flush enqueues are visible

    manualStop = true;
    clearTimeout(chunkTimeoutId);
    
    // keep existing stopMicrophone, timers and flush logic intac

  // NEW: If the recording is paused, finalize immediately.
  if (recordingPaused) {
    finalChunkProcessed = true;
    updateTranscriptionOutput();
    const startButton = document.getElementById("startButton");
    if (startButton) startButton.disabled = false;
    stopButton.disabled = true;
    const pauseResumeButton = document.getElementById("pauseResumeButton");
    if (pauseResumeButton) pauseResumeButton.disabled = true;
    logInfo("Recording paused and stop pressed; transcription complete without extra processing.");
    return;
  }

  // Continue with the existing logic if not paused:
  if (audioFrames.length === 0 && !processedAnyAudioFrames) {
    // Reset buttons
    // Determine if any work actually exists (defensive check)
    const hasWork =
      transcriptionQueue.length > 0 || isProcessingQueue || pendingVADChunks.length > 0;
    if (hasWork) {
      // Real work exists (rare in this branch). Start single-signal flow.
      updateStatusMessage("Finishing transcription...", "blue");
      if (!completionTimerRunning) startCompletionTimer();
    } else {
      // Pure silence case: finalize immediately; timer remains 0.
      updateTranscriptionOutput();
    }
    const startButton = document.getElementById("startButton");
    if (startButton) startButton.disabled = false;
    // Keep Start disabled until updateTranscriptionOutput() confirms final completion.
    stopButton.disabled = true;
    const pauseResumeButton = document.getElementById("pauseResumeButton");
    if (pauseResumeButton) pauseResumeButton.disabled = true;
    logInfo("No audio frames captured; instant transcription complete.");
    return;
  } else {
    if (chunkProcessingLock) {
      pendingStop = true;
      logDebug("Chunk processing locked at stop; setting pendingStop.");
    } else {
      await safeProcessAudioChunk(true);
      if (!processedAnyAudioFrames) {
        resetRecordingState();
        
        updateStatusMessage("Recording reset. Ready to start.", "green");
        const startButton = document.getElementById("startButton");
        if (startButton) startButton.disabled = false;
        stopInProgress = false;
        stopButton.disabled = true;
        const pauseResumeButton = document.getElementById("pauseResumeButton");
        if (pauseResumeButton) pauseResumeButton.disabled = true;
        logInfo("No audio frames processed after safeProcessAudioChunk. Full reset performed.");
        processedAnyAudioFrames = false;
        return;
      } else {
        finalChunkProcessed = true;
        // There was speech/processing. Decide if work remains now.
        const hasWork =
          transcriptionQueue.length > 0 || isProcessingQueue || pendingVADChunks.length > 0;
        if (hasWork) {
          updateStatusMessage("Finishing transcription...", "blue");
          if (!completionTimerRunning) startCompletionTimer();
        } else {
          // Nothing left to do; finalize right away (freeze timer at current value)
          updateTranscriptionOutput();
        }
        finalizeStop();
        logInfo("Stop button processed; final chunk handled.");
      }
    }
  }
}, { signal: uiSignal });

}

export { initRecording };

// As soon as the page loads, ensure we never auto-open the mic:
installSafeRecordingLoadStop({
  stopMicrophone,
  getSileroVAD: () => sileroVAD,
});
