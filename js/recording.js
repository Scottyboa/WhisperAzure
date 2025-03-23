// recorder.js
// Self-contained version using an inlined AudioWorklet processor

// --- Inlined AudioWorklet Processor Code ---
const audioProcessorCode = `
class ChunkProcessor extends AudioWorkletProcessor {
  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (input && input.length > 0) {
      // Copy each channel's data (usually 128 samples per block)
      const channelData = input.map(channel => channel.slice(0));
      // Post message with the channel data, sample rate, and number of channels.
      this.port.postMessage({
        channelData,
        sampleRate: sampleRate,
        numberOfChannels: input.length
      });
    }
    return true;
  }
}
registerProcessor('chunk-processor', ChunkProcessor);
`;

// --- Utility Logging Functions ---
const DEBUG = true;
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

// --- Constants ---
const CHUNK_DURATION = 45000; // 45 seconds per chunk
const watchdogThreshold = 1500; // 1.5 seconds with no frame triggers a slice
const backendUrl = "https://transcribe-notes-dnd6accbgwc9gdbz.norwayeast-01.azurewebsites.net/";

// --- Global Variables ---
let audioContext = null;
let workletNode = null;
let mediaStream = null;
let recordingTimerInterval;
let groupId = null;
let chunkNumber = 1;
let manualStop = false;
let transcriptChunks = {};
let pollingIntervals = {};
let chunkStartTime = 0;
let lastFrameTime = 0;
let chunkTimeoutId;
let audioFrames = []; // Array to collect frames posted from the AudioWorklet
let recordingPaused = false;

// --- UI Helper Functions ---
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
  const elapsed = Date.now() - chunkStartTime;
  const timerElem = document.getElementById("recordTimer");
  if (timerElem) {
    timerElem.innerText = "Recording Timer: " + formatTime(elapsed);
  }
}

// --- Stop Audio (close stream, node, context) ---
function stopAudio() {
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop());
    mediaStream = null;
    logInfo("Media stream stopped.");
  }
  if (workletNode) {
    workletNode.port.close();
    workletNode.disconnect();
    workletNode = null;
    logInfo("AudioWorkletNode stopped.");
  }
  if (audioContext) {
    audioContext.close();
    audioContext = null;
    logInfo("AudioContext closed.");
  }
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
  const decryptedBuffer = await crypto.subtle.decrypt({ name: "AES-GCM", iv: base64ToArrayBuffer(iv) }, key, base64ToArrayBuffer(ciphertext));
  const decoder = new TextDecoder();
  return decoder.decode(decryptedBuffer);
}
async function getDecryptedAPIKey() {
  const encryptedStr = sessionStorage.getItem("encrypted_api_key");
  if (!encryptedStr) return null;
  const encryptedData = JSON.parse(encryptedStr);
  return await decryptAPIKey(encryptedData);
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
  const key = await crypto.subtle.deriveKey({ name: "PBKDF2", salt: salt, iterations: 100000, hash: "SHA-256" }, keyMaterial, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const buffer = await blob.arrayBuffer();
  const encryptedBuffer = await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, key, buffer);
  const encryptedBlob = new Blob([encryptedBuffer], { type: blob.type });
  const apiKeyMarker = hashString(apiKey);
  const deviceMarker = hashString(deviceToken);
  return { encryptedBlob, iv: arrayBufferToBase64(iv), salt: arrayBufferToBase64(salt), apiKeyMarker, deviceMarker };
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

// --- Robust Conversion Process from Frames to WAV ---
function framesToWav(frames) {
  if (frames.length === 0) return null;
  const sampleRate = frames[0].sampleRate;
  const numChannels = frames[0].numberOfChannels;
  for (let i = 1; i < frames.length; i++) {
    if (frames[i].sampleRate !== sampleRate) {
      logError(`Frame ${i} has different sampleRate: ${frames[i].sampleRate} vs ${sampleRate}`);
    }
    if (frames[i].numberOfChannels !== numChannels) {
      logError(`Frame ${i} has different channel count: ${frames[i].numberOfChannels} vs ${numChannels}`);
    }
  }
  let totalSamples = 0;
  for (const frame of frames) {
    totalSamples += frame.numberOfFrames;
  }
  logInfo(`Total samples per channel: ${totalSamples}`);
  let channelData = [];
  for (let c = 0; c < numChannels; c++) {
    channelData[c] = new Float32Array(totalSamples);
  }
  let offset = 0;
  for (const frame of frames) {
    const num = frame.numberOfFrames;
    for (let c = 0; c < numChannels; c++) {
      const temp = new Float32Array(num);
      frame.copyTo(temp, { planeIndex: c });
      channelData[c].set(temp, offset);
    }
    offset += frame.numberOfFrames;
  }
  let interleaved;
  if (numChannels === 1) {
    interleaved = channelData[0];
  } else {
    interleaved = new Float32Array(totalSamples * numChannels);
    for (let i = 0; i < totalSamples; i++) {
      for (let c = 0; c < numChannels; c++) {
        interleaved[i * numChannels + c] = channelData[c][i];
      }
    }
  }
  const pcmInt16 = floatTo16BitPCM(interleaved);
  const wavBlob = encodeWAV(pcmInt16, sampleRate, numChannels);
  return wavBlob;
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

// --- AudioWorklet Integration (Inlined Processor) ---
async function initAudioWorklet() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  // Create a Blob URL for the inlined processor code.
  const blob = new Blob([audioProcessorCode], { type: "application/javascript" });
  const moduleURL = URL.createObjectURL(blob);
  try {
    await audioContext.audioWorklet.addModule(moduleURL);
    workletNode = new AudioWorkletNode(audioContext, 'chunk-processor');
    workletNode.port.onmessage = (event) => {
      const data = event.data;
      // Create a frame-like object to mimic the previous frame structure.
      const frame = {
        numberOfFrames: data.channelData[0].length,
        sampleRate: data.sampleRate,
        numberOfChannels: data.numberOfChannels,
        copyTo: (destination, options) => {
          const plane = options.planeIndex || 0;
          destination.set(data.channelData[plane]);
        },
        close: () => {}
      };
      audioFrames.push(frame);
      lastFrameTime = Date.now();
    };
    logInfo("AudioWorklet initialized.");
  } catch (error) {
    logError("Error initializing AudioWorklet:", error);
  }
}

// --- Schedule Chunk ---
function scheduleChunk() {
  if (manualStop || recordingPaused) {
    logDebug("Scheduler suspended due to manual stop or pause.");
    return;
  }
  const elapsed = Date.now() - chunkStartTime;
  const timeSinceLast = Date.now() - lastFrameTime;
  if (elapsed >= CHUNK_DURATION || (elapsed >= CHUNK_DURATION && timeSinceLast >= watchdogThreshold)) {
    logInfo("Chunk boundary reached; processing current chunk.");
    safeProcessAudioChunk().then(() => {
      if (!manualStop) {
        restartAudioStream().then(() => {
          chunkStartTime = Date.now();
          scheduleChunk();
        });
      }
    });
  } else {
    chunkTimeoutId = setTimeout(scheduleChunk, 500);
  }
}

// --- Process Audio Chunk ---
async function processAudioChunkInternal(force = false) {
  if (audioFrames.length === 0) {
    logDebug("No audio frames to process.");
    return;
  }
  logInfo(`Processing ${audioFrames.length} audio frames for chunk ${chunkNumber}.`);
  const framesToProcess = audioFrames;
  audioFrames = [];
  const wavBlob = framesToWav(framesToProcess);
  if (!wavBlob) {
    logError("Failed to convert frames to WAV blob.");
    return;
  }
  logInfo(`Generated WAV blob size: ${wavBlob.size} bytes`);
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
  await processAudioChunkInternal(force);
}
async function restartAudioStream() {
  logInfo("Restarting audio stream for next chunk...");
  stopAudio();
  audioFrames = [];
  await initAudioWorklet();
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const sourceNode = audioContext.createMediaStreamSource(mediaStream);
    sourceNode.connect(workletNode);
    logInfo("Audio stream restarted successfully.");
  } catch (error) {
    logError("Error restarting audio stream:", error);
  }
}
function finalizeStop() {
  logInfo("Finalizing transcription...");
  clearTimeout(chunkTimeoutId);
  clearInterval(recordingTimerInterval);
  stopAudio();
  finalChunkProcessed = true;
  const startButton = document.getElementById("startButton");
  const stopButton = document.getElementById("stopButton");
  const pauseResumeButton = document.getElementById("pauseResumeButton");
  if (startButton) startButton.disabled = false;
  if (stopButton) stopButton.disabled = true;
  if (pauseResumeButton) pauseResumeButton.disabled = true;
  logInfo("Recording stopped and finalized.");
  updateStatusMessage("Transcription finished!", "green");
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
  if (transcriptionElem) {
    transcriptionElem.value = combinedTranscript.trim();
  }
  if (manualStop && Object.keys(transcriptChunks).length >= (chunkNumber - 1)) {
    updateStatusMessage("Transcription finished!", "green");
    logInfo("Transcription complete.");
  }
}
function initRecording() {
  const startButton = document.getElementById("startButton");
  const stopButton = document.getElementById("stopButton");
  const pauseResumeButton = document.getElementById("pauseResumeButton");
  if (!startButton || !stopButton || !pauseResumeButton) return;
  startButton.addEventListener("click", async () => {
    try {
      const decryptedApiKey = await getDecryptedAPIKey();
      if (!decryptedApiKey || !decryptedApiKey.startsWith("sk-")) {
        alert("Please enter a valid OpenAI API key before starting the recording.");
        return;
      }
      groupId = Date.now().toString();
      chunkNumber = 1;
      manualStop = false;
      transcriptChunks = {};
      audioFrames = [];
      clearTimeout(chunkTimeoutId);
      clearInterval(recordingTimerInterval);
      const transcriptionElem = document.getElementById("transcription");
      if (transcriptionElem) transcriptionElem.value = "";
      updateStatusMessage("Recording...", "green");
      logInfo("Recording started.");
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      await initAudioWorklet();
      mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordingTimerInterval = setInterval(updateRecordingTimer, 1000);
      chunkStartTime = Date.now();
      const sourceNode = audioContext.createMediaStreamSource(mediaStream);
      sourceNode.connect(workletNode);
      scheduleChunk();
      logInfo("AudioWorklet processing started, collecting audio frames.");
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
      recordingTimerInterval = setInterval(updateRecordingTimer, 1000);
      pauseResumeButton.innerText = "Pause Recording";
      updateStatusMessage("Recording...", "green");
      chunkStartTime = Date.now();
      scheduleChunk();
      logInfo("Recording resumed.");
    }
  });
  stopButton.addEventListener("click", async () => {
    try {
      updateStatusMessage("Finishing transcription...", "blue");
      manualStop = true;
      clearTimeout(chunkTimeoutId);
      clearInterval(recordingTimerInterval);
      logInfo("Stop button clicked; processing final chunk.");
      await safeProcessAudioChunk(true);
      finalChunkProcessed = true;
      stopAudio();
      audioFrames = [];
      finalizeStop();
      logInfo("Stop button processed; final chunk handled and stream shut down.");
    } catch (err) {
      logError("Error in stop event listener:", err);
    }
  });
}
export { initRecording };
