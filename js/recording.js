// recording.js
// Updated recording module with API key validation, file encryption, request signing, and sending device_token.
// (Modifications: When the stop button is clicked, record the stop request (manualStop),
// then wait until no new frames are received for 1.5 seconds (or a max of 5 sec) before stopping the media stream.
// That final chunk is then processed just like an automatic 45‑sec slice.)

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // 32-bit signed integer
  }
  return (hash >>> 0).toString();
}

const DEBUG = true;
function logDebug(message, ...optionalParams) {
  if (DEBUG) console.debug(new Date().toISOString(), "[DEBUG]", message, ...optionalParams);
}
function logInfo(message, ...optionalParams) {
  console.info(new Date().toISOString(), "[INFO]", message, ...optionalParams);
}
function logError(message, ...optionalParams) {
  console.error(new Date().toISOString(), "[ERROR]", message, ...optionalParams);
}

const MIN_CHUNK_DURATION = 45000; // 45 sec
const MAX_CHUNK_DURATION = 45000; // 45 sec
const watchdogThreshold = 1500;   // 1.5 sec inactivity
const backendUrl = "https://transcribe-notes-dnd6accbgwc9gdbz.norwayeast-01.azurewebsites.net/";

let mediaStream = null;
let audioReader = null;
let recordingStartTime = 0; // for UI timer (Date.now())
let recordingTimerInterval;
let completionTimerInterval = null;
let completionStartTime = 0;
let groupId = null;
let chunkNumber = 1;
let manualStop = false;
let transcriptChunks = {};
let pollingIntervals = {};

let chunkStartTime = 0;
let lastFrameTime = 0;
let chunkTimeoutId = null;

let chunkProcessingLock = false;
let pendingStop = false;
let finalChunkProcessed = false;
let recordingPaused = false;
// Each audio frame is stored along with a timestamp (using performance.now())
// Each element: { frame: <AudioFrame>, ts: <timestamp> }
let audioFrames = [];

// We'll use a promise to track the read loop completion.
let readLoopPromise;

// --- Utility Functions ---
function updateStatusMessage(message, color = "#333") {
  const statusElem = document.getElementById("statusMessage");
  if (statusElem) {
    statusElem.innerText = message;
    statusElem.style.color = color;
  }
}

function formatTime(ms) {
  const totalSec = Math.floor(ms / 1000);
  if (totalSec < 60) return totalSec + " sec";
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  return minutes + " min" + (seconds > 0 ? " " + seconds + " sec" : "");
}

function updateRecordingTimer() {
  const elapsed = Date.now() - recordingStartTime;
  const timerElem = document.getElementById("recordTimer");
  if (timerElem) timerElem.innerText = "Recording Timer: " + formatTime(elapsed);
}

// In automatic slicing, we let the scheduler run. Here, in manual stop mode we want
// to wait until no new frames arrive for watchdogThreshold (1.5 sec) or until a max flush time.
async function waitForInactivity() {
  const maxFlushTime = 5000; // maximum 5 sec flush if noise persists
  const startFlush = performance.now();
  while ((performance.now() - lastFrameTime) < watchdogThreshold &&
         (performance.now() - startFlush) < maxFlushTime) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

// When stopping manually, we want to mimic the automatic slice—so we wait for inactivity before stopping the stream.
function stopMicrophone() {
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop());
    mediaStream = null;
    logInfo("Microphone stopped.");
  }
  // Do not cancel the audioReader immediately.
}

// --- Base64 Helper Functions ---
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
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
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

// --- API Key Encryption/Decryption Helpers ---
async function deriveKey(password, salt) {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );
}

async function decryptAPIKey(encryptedData) {
  const { ciphertext, iv, salt } = encryptedData;
  const deviceToken = getDeviceToken();
  const key = await deriveKey(deviceToken, base64ToArrayBuffer(salt));
  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64ToArrayBuffer(iv) },
    key,
    base64ToArrayBuffer(ciphertext)
  );
  return new TextDecoder().decode(decryptedBuffer);
}

async function getDecryptedAPIKey() {
  const encryptedStr = sessionStorage.getItem("encrypted_api_key");
  if (!encryptedStr) return null;
  return await decryptAPIKey(JSON.parse(encryptedStr));
}

// --- File Blob Encryption ---
async function encryptFileBlob(blob) {
  const apiKey = await getDecryptedAPIKey();
  if (!apiKey) throw new Error("API key not available for encryption");
  const deviceToken = getDeviceToken();
  const password = apiKey + ":" + deviceToken;
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveKey"]);
  const key = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const buffer = await blob.arrayBuffer();
  const encryptedBuffer = await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, key, buffer);
  const encryptedBlob = new Blob([encryptedBuffer], { type: blob.type });
  
  const apiKeyMarker = hashString(apiKey);
  const deviceMarker = hashString(deviceToken);

  return {
    encryptedBlob,
    iv: arrayBufferToBase64(iv),
    salt: arrayBufferToBase64(salt),
    apiKeyMarker,
    deviceMarker
  };
}

// --- HMAC and Request Signing ---
async function computeHMAC(message, secret) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return arrayBufferToBase64(signatureBuffer);
}

async function signUploadRequest(groupId, chunkNumber) {
  const apiKey = await getDecryptedAPIKey();
  const deviceToken = getDeviceToken();
  const secret = apiKey + ":" + deviceToken;
  const message = "upload:" + groupId + ":" + chunkNumber;
  return await computeHMAC(message, secret);
}

// --- Upload Chunk Function ---
async function uploadChunk(blob, currentChunkNumber, extension, mimeType, isLast = false, currentGroup) {
  let encryptionResult;
  try {
    encryptionResult = await encryptFileBlob(blob);
  } catch (err) {
    console.error("Error encrypting file blob:", err);
    throw err;
  }
  const encryptedBlob = encryptionResult.encryptedBlob;

  let signature;
  try {
    signature = await signUploadRequest(currentGroup, currentChunkNumber);
  } catch (err) {
    console.error("Error generating signature:", err);
    throw err;
  }

  const formData = new FormData();
  formData.append("file", encryptedBlob, `chunk_${currentChunkNumber}.${extension}`);
  formData.append("group_id", currentGroup);
  formData.append("chunk_number", currentChunkNumber);
  formData.append("api_key", await getDecryptedAPIKey());
  formData.append("iv", encryptionResult.iv);
  formData.append("salt", encryptionResult.salt);
  formData.append("api_key_marker", encryptionResult.apiKeyMarker);
  formData.append("device_marker", encryptionResult.deviceMarker);
  formData.append("device_token", getDeviceToken());
  formData.append("signature", signature);
  if (isLast) formData.append("last_chunk", "true");
  
  let attempts = 0;
  const retryDelay = 4000;
  const maxRetryTime = 60000;
  const startTime = Date.now();
  while (true) {
    try {
      const response = await fetch(`${backendUrl}/upload`, { method: "POST", body: formData });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server responded with status ${response.status}: ${errorText}`);
      }
      const result = await response.json();
      console.info(`Upload successful for chunk ${currentChunkNumber}`, { session_id: result.session_id });
      return result;
    } catch (error) {
      attempts++;
      console.error(`Upload error for chunk ${currentChunkNumber} on attempt ${attempts}:`, error);
      if (Date.now() - startTime >= maxRetryTime) {
        updateStatusMessage("Failed to upload chunk " + currentChunkNumber + " after maximum retry time", "red");
        throw new Error("Maximum retry time exceeded for chunk " + currentChunkNumber);
      }
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
}

// --- Overlap Handling ---
// For automatic chunk slicing, retain the most recent frames whose total duration is at least the desired overlap.
function getOverlapFrames() {
  let overlap = [];
  let totalDuration = 0;
  const desiredOverlap = 200; // in ms
  for (let i = audioFrames.length - 1; i >= 0; i--) {
    const item = audioFrames[i];
    const duration = (item.frame.numberOfFrames / item.frame.sampleRate) * 1000;
    overlap.unshift(item);
    totalDuration += duration;
    if (totalDuration >= desiredOverlap) break;
  }
  return overlap;
}

// --- Audio Chunk Processing ---
async function processAudioChunkInternal(force = false) {
  let framesToProcess;
  if (manualStop) {
    // For manual stop, process all frames currently in the buffer.
    framesToProcess = audioFrames.map(item => item.frame);
    audioFrames = [];
  } else {
    // Automatic chunk processing: retain overlap.
    let overlap = getOverlapFrames();
    framesToProcess = audioFrames.slice(0, audioFrames.length - overlap.length).map(item => item.frame);
    if (framesToProcess.length === 0) {
      framesToProcess = audioFrames.map(item => item.frame);
      overlap = [];
    }
    audioFrames = overlap;
  }
  if (framesToProcess.length === 0) {
    logDebug("No audio frames to process.");
    return;
  }
  logInfo(`Processing ${framesToProcess.length} audio frames for chunk ${chunkNumber}.`);
  
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
  const pcmInt16 = floatTo16BitPCM(pcmFloat32);
  const wavBlob = encodeWAV(pcmInt16, sampleRate, numChannels);
  const mimeType = "audio/wav";
  const extension = "wav";
  const currentChunk = chunkNumber;
  logInfo(`Uploading chunk ${currentChunk}`);
  uploadChunk(wavBlob, currentChunk, extension, mimeType, force, groupId)
    .then(result => {
      if (result && result.session_id) {
        logInfo(`Chunk ${currentChunk} uploaded successfully. Starting polling.`);
        pollChunkTranscript(currentChunk, groupId);
      } else {
        logInfo(`Chunk ${currentChunk} upload did not return a session ID; skipping polling.`);
      }
    })
    .catch(err => logError(`Upload error for chunk ${currentChunk}:`, err));
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
  completionStartTime = Date.now();
  completionTimerInterval = setInterval(() => {
    const timerElem = document.getElementById("transcribeTimer");
    if (timerElem) timerElem.innerText = "Completion Timer: " + formatTime(Date.now() - completionStartTime);
  }, 1000);
  const startButton = document.getElementById("startButton");
  const stopButton = document.getElementById("stopButton");
  const pauseResumeButton = document.getElementById("pauseResumeButton");
  if (startButton) startButton.disabled = false;
  if (stopButton) stopButton.disabled = true;
  if (pauseResumeButton) pauseResumeButton.disabled = true;
  logInfo("Recording stopped by user. Finalizing transcription.");
}

function pollChunkTranscript(chunkNum, currentGroup) {
  const pollStart = Date.now();
  pollingIntervals[chunkNum] = setInterval(async () => {
    if (groupId !== currentGroup) {
      clearInterval(pollingIntervals[chunkNum]);
      logDebug(`Polling stopped for chunk ${chunkNum} due to session change.`);
      return;
    }
    if (Date.now() - pollStart > 120000) {
      logInfo(`Polling timeout for chunk ${chunkNum}`);
      clearInterval(pollingIntervals[chunkNum]);
      return;
    }
    try {
      const response = await fetch(`${backendUrl}/fetch_chunk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: currentGroup, chunk_number: chunkNum })
      });
      if (response.status === 200) {
        const data = await response.json();
        transcriptChunks[chunkNum] = data.transcript;
        updateTranscriptionOutput();
        clearInterval(pollingIntervals[chunkNum]);
        logInfo(`Transcript received for chunk ${chunkNum}`);
      } else {
        logDebug(`Chunk ${chunkNum} transcript not ready yet.`);
      }
    } catch (err) {
      logError(`Error polling for chunk ${chunkNum}:`, err);
    }
  }, 3000);
}

function updateTranscriptionOutput() {
  const sortedKeys = Object.keys(transcriptChunks).map(Number).sort((a, b) => a - b);
  let combinedTranscript = "";
  sortedKeys.forEach(key => {
    combinedTranscript += transcriptChunks[key] + " ";
  });
  const transcriptionElem = document.getElementById("transcription");
  if (transcriptionElem) transcriptionElem.value = combinedTranscript.trim();
  if (manualStop && Object.keys(transcriptChunks).length >= (chunkNumber - 1)) {
    clearInterval(completionTimerInterval);
    updateStatusMessage("Transcription finished!", "green");
    logInfo("Transcription complete.");
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
  if (manualStop || recordingPaused) {
    logDebug("Scheduler suspended due to manual stop or pause.");
    return;
  }
  const elapsed = Date.now() - chunkStartTime;
  const timeSinceLast = Date.now() - lastFrameTime;
  if (elapsed >= MAX_CHUNK_DURATION || (elapsed >= MIN_CHUNK_DURATION && timeSinceLast >= watchdogThreshold)) {
    logInfo("Scheduling condition met; processing chunk.");
    safeProcessAudioChunk();
    chunkStartTime = Date.now();
    scheduleChunk();
  } else {
    chunkTimeoutId = setTimeout(scheduleChunk, 500);
  }
}

function resetRecordingState() {
  Object.values(pollingIntervals).forEach(interval => clearInterval(interval));
  pollingIntervals = {};
  clearTimeout(chunkTimeoutId);
  clearInterval(recordingTimerInterval);
  transcriptChunks = {};
  audioFrames = [];
  chunkStartTime = Date.now();
  lastFrameTime = Date.now();
  manualStop = false;
  finalChunkProcessed = false;
  recordingPaused = false;
  groupId = Date.now().toString();
  chunkNumber = 1;
}

// --- Modified Read Loop Implementation ---
// Each read frame is stored with a timestamp using performance.now()
async function readLoop() {
  try {
    while (true) {
      const { done, value } = await audioReader.read();
      if (done) {
        logInfo("Audio track reading complete.");
        break;
      }
      const now = performance.now();
      audioFrames.push({ frame: value, ts: now });
      lastFrameTime = now;
    }
  } catch (err) {
    logError("Error reading audio frames", err);
  }
}

function initRecording() {
  const startButton = document.getElementById("startButton");
  const stopButton = document.getElementById("stopButton");
  const pauseResumeButton = document.getElementById("pauseResumeButton");
  if (!startButton || !stopButton || !pauseResumeButton) return;

  startButton.addEventListener("click", async () => {
    const decryptedApiKey = await getDecryptedAPIKey();
    if (!decryptedApiKey || !decryptedApiKey.startsWith("sk-")) {
      alert("Please enter a valid OpenAI API key before starting the recording.");
      return;
    }
    resetRecordingState();
    const transcriptionElem = document.getElementById("transcription");
    if (transcriptionElem) transcriptionElem.value = "";
    
    updateStatusMessage("Recording...", "green");
    logInfo("Recording started.");
    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordingStartTime = Date.now();
      recordingTimerInterval = setInterval(updateRecordingTimer, 1000);
      
      const track = mediaStream.getAudioTracks()[0];
      const processor = new MediaStreamTrackProcessor({ track: track });
      audioReader = processor.readable.getReader();
      
      readLoopPromise = readLoop();
      
      scheduleChunk();
      logInfo("MediaStreamTrackProcessor started, reading audio frames.");
      startButton.disabled = true;
      stopButton.disabled = false;
      pauseResumeButton.disabled = false;
      pauseResumeButton.innerText = "Pause Recording";
    } catch (error) {
      updateStatusMessage("Microphone access error: " + error, "red");
      logError("Microphone access error", error);
    }
  });

  pauseResumeButton.addEventListener("click", () => {
    if (!mediaStream) return;
    const track = mediaStream.getAudioTracks()[0];
    if (track.enabled) {
      track.enabled = false;
      recordingPaused = true;
      clearInterval(recordingTimerInterval);
      clearTimeout(chunkTimeoutId);
      pauseResumeButton.innerText = "Resume Recording";
      updateStatusMessage("Recording paused", "orange");
      logInfo("Recording paused.");
    } else {
      track.enabled = true;
      recordingPaused = false;
      recordingStartTime = Date.now();
      recordingTimerInterval = setInterval(updateRecordingTimer, 1000);
      pauseResumeButton.innerText = "Pause Recording";
      updateStatusMessage("Recording...", "green");
      chunkStartTime = Date.now();
      scheduleChunk();
      logInfo("Recording resumed.");
    }
  });

  stopButton.addEventListener("click", async () => {
    updateStatusMessage("Finishing transcription...", "blue");
    manualStop = true;
    // Instead of stopping immediately, wait until no new frames arrive for watchdogThreshold (1.5 sec),
    // or a maximum of 5 seconds.
    const flushStart = performance.now();
    while ((performance.now() - lastFrameTime) < watchdogThreshold &&
           (performance.now() - flushStart) < 5000) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    // Now stop the media stream so no new frames are produced.
    stopMicrophone();
    // Wait for the read loop to finish.
    if (readLoopPromise) await readLoopPromise;
    // Extra flush delay (if needed).
    await new Promise(resolve => setTimeout(resolve, 500));
    // Cancel the reader to ensure no further frames are processed.
    if (audioReader) {
      try {
        await audioReader.cancel();
      } catch (e) {
        logError("Error canceling audio reader:", e);
      }
    }
    // Process the final chunk using all frames collected so far.
    await safeProcessAudioChunk(true);
    finalChunkProcessed = true;
    finalizeStop();
    logInfo("Stop button processed; final chunk handled and media stream stopped.");
  });
}

export { initRecording };
