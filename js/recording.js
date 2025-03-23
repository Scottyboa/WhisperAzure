// recording.js

// Debug and logging functions
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

// Chunk duration constants (45 seconds)
const MIN_CHUNK_DURATION = 45000; // 45 sec
const MAX_CHUNK_DURATION = 45000; // 45 sec
const watchdogThreshold = 1500;   // 1.5 sec with no new frame

// Backend URL for uploading chunks
const backendUrl = "https://your-backend-url.com";

// Global variables for audio capture and chunking
let mediaStream = null;
let audioContext = null;
let workletNode = null;
let recordingStartTime = 0;
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
let chunkTimeoutId;
let chunkProcessingLock = false;
let pendingStop = false;
let finalChunkProcessed = false;
let recordingPaused = false;
let audioFrames = []; // Buffer for audio data (as Float32Array or similar)

// UI update functions
function updateStatusMessage(message, color = "#333") {
  const statusElem = document.getElementById("statusMessage");
  if (statusElem) {
    statusElem.innerText = message;
    statusElem.style.color = color;
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

function updateRecordingTimer() {
  const elapsed = Date.now() - recordingStartTime;
  const timerElem = document.getElementById("recordTimer");
  if (timerElem) {
    timerElem.innerText = "Recording Timer: " + formatTime(elapsed);
  }
}

function stopMicrophone() {
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop());
    mediaStream = null;
    logInfo("Microphone stopped.");
  }
  if (audioContext) {
    audioContext.close();
    audioContext = null;
    workletNode = null;
  }
}

// Functions to convert raw audio data into WAV format
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

// Chunk scheduling and processing
function scheduleChunk() {
  if (manualStop || recordingPaused) {
    logDebug("Scheduler suspended due to manual stop or pause.");
    return;
  }
  const elapsed = Date.now() - chunkStartTime;
  const timeSinceLast = Date.now() - lastFrameTime;
  if (elapsed >= MAX_CHUNK_DURATION || (elapsed >= MIN_CHUNK_DURATION && timeSinceLast >= watchdogThreshold)) {
    logInfo("Chunk scheduling condition met; processing current chunk.");
    safeProcessAudioChunk();
    chunkStartTime = Date.now();
    scheduleChunk();
  } else {
    chunkTimeoutId = setTimeout(scheduleChunk, 500);
  }
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
    if (timerElem) {
      timerElem.innerText = "Completion Timer: " + formatTime(Date.now() - completionStartTime);
    }
  }, 1000);
  document.getElementById("startButton").disabled = false;
  document.getElementById("stopButton").disabled = true;
  document.getElementById("pauseResumeButton").disabled = true;
  logInfo("Recording stopped by user. Finalizing transcription.");
}

// This function processes the buffered audio frames into a WAV blob and triggers the upload.
async function processAudioChunkInternal(force = false) {
  if (audioFrames.length === 0) {
    logDebug("No audio frames to process.");
    return;
  }
  logInfo(`Processing ${audioFrames.length} audio frames for chunk ${chunkNumber}.`);
  let totalLength = 0;
  audioFrames.forEach(frame => totalLength += frame.length);
  const pcmFloat32 = new Float32Array(totalLength);
  let offset = 0;
  audioFrames.forEach(frame => {
    pcmFloat32.set(frame, offset);
    offset += frame.length;
  });
  const pcmInt16 = floatTo16BitPCM(pcmFloat32);
  const wavBlob = encodeWAV(pcmInt16, 16000, 1);
  audioFrames = [];
  logInfo(`Uploading chunk ${chunkNumber}`);
  uploadChunk(wavBlob, chunkNumber, "wav", "audio/wav", force, groupId)
    .then(result => {
      if (result && result.session_id) {
        logInfo(`Chunk ${chunkNumber} uploaded successfully. Starting polling.`);
        pollChunkTranscript(chunkNumber, groupId);
      } else {
        logInfo(`Chunk ${chunkNumber} upload did not return a session ID; skipping polling.`);
      }
    })
    .catch(err => logError(`Upload error for chunk ${chunkNumber}:`, err));
  chunkNumber++;
}

// (Placeholder) Function to poll the backend for the transcript of a chunk
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
    clearInterval(completionTimerInterval);
    updateStatusMessage("Transcription finished!", "green");
    logInfo("Transcription complete.");
  }
}

// ------------------------------
// Inline AudioWorklet Processor
// ------------------------------
const audioProcessorCode = `
class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
  }
  process(inputs, outputs, parameters) {
    if (inputs.length > 0 && inputs[0].length > 0) {
      // Send the first channel's data as a Float32Array
      this.port.postMessage(inputs[0][0]);
    }
    return true;
  }
}
registerProcessor('audio-processor', AudioProcessor);
`;

// ------------------------------
// AudioWorklet-Based Recording Initialization
// ------------------------------
async function initAudioWorkletCapture() {
  try {
    audioContext = new AudioContext();
    // Create a blob URL from the inline processor code
    const blob = new Blob([audioProcessorCode], { type: 'application/javascript' });
    const blobURL = URL.createObjectURL(blob);
    await audioContext.audioWorklet.addModule(blobURL);
    workletNode = new AudioWorkletNode(audioContext, 'audio-processor');
    workletNode.port.onmessage = (event) => {
      lastFrameTime = Date.now();
      // Assume event.data is a Float32Array of audio samples.
      audioFrames.push(event.data);
    };
    const source = audioContext.createMediaStreamSource(mediaStream);
    source.connect(workletNode);
    logInfo("AudioWorklet initialized and connected.");
  } catch (error) {
    logError("Error initializing AudioWorklet:", error);
  }
}

// ------------------------------
// Initialization of Recording
// ------------------------------
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

async function initRecording() {
  const startButton = document.getElementById("startButton");
  const stopButton = document.getElementById("stopButton");
  const pauseResumeButton = document.getElementById("pauseResumeButton");
  if (!startButton || !stopButton || !pauseResumeButton) return;

  startButton.addEventListener("click", async () => {
    const decryptedApiKey = sessionStorage.getItem("openai_api_key");
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
      
      // Initialize AudioWorklet for capturing audio frames.
      await initAudioWorkletCapture();
      
      // Start scheduling chunks.
      chunkStartTime = Date.now();
      scheduleChunk();
      
      startButton.disabled = true;
      stopButton.disabled = false;
      pauseResumeButton.disabled = false;
      pauseResumeButton.innerText = "Pause Recording";
    } catch (error) {
      updateStatusMessage("Microphone access error: " + error, "red");
      logError("Microphone access error", error);
    }
  });

  pauseResumeButton.addEventListener("click", async () => {
    if (!audioContext) return;
    if (audioContext.state === "running") {
      await audioContext.suspend();
      recordingPaused = true;
      clearInterval(recordingTimerInterval);
      clearTimeout(chunkTimeoutId);
      pauseResumeButton.innerText = "Resume Recording";
      updateStatusMessage("Recording paused", "orange");
      logInfo("Recording paused.");
    } else {
      await audioContext.resume();
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
    clearTimeout(chunkTimeoutId);
    clearInterval(recordingTimerInterval);
    stopMicrophone();
    chunkStartTime = 0;
    lastFrameTime = 0;
    await new Promise(resolve => setTimeout(resolve, 200));
    if (chunkProcessingLock) {
      pendingStop = true;
      logDebug("Chunk processing locked at stop; setting pendingStop.");
    } else {
      await safeProcessAudioChunk(true);
      finalChunkProcessed = true;
      finalizeStop();
      logInfo("Stop button processed; final chunk handled.");
    }
  });
}

export { initRecording };
