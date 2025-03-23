// recording.js - Updated to use AudioWorklet for improved chunking and proper export

// Logging functions
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

// Global state variables
let audioContext = null;
let audioWorkletNode = null;
let mediaStream = null;
let recordingStartTime = 0;
let recordingTimerInterval = null;
let groupId = null;
let chunkNumber = 1;
let manualStop = false;
let recordingPaused = false;

// UI Elements
const startButton = document.getElementById("startButton");
const stopButton = document.getElementById("stopButton");
const pauseResumeButton = document.getElementById("pauseResumeButton");
const recordTimerElem = document.getElementById("recordTimer");
const statusElem = document.getElementById("statusMessage");
const transcriptionElem = document.getElementById("transcription");

// Helper function: format elapsed time
function formatTime(ms) {
  const totalSec = Math.floor(ms / 1000);
  if (totalSec < 60) return totalSec + " sec";
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  return minutes + " min" + (seconds > 0 ? " " + seconds + " sec" : "");
}

function updateRecordingTimer() {
  const elapsed = Date.now() - recordingStartTime;
  if (recordTimerElem) recordTimerElem.innerText = "Recording Timer: " + formatTime(elapsed);
}

function updateStatusMessage(message, color = "#333") {
  if (statusElem) {
    statusElem.innerText = message;
    statusElem.style.color = color;
  }
}

// Helper functions to convert Float32Array PCM to 16-bit PCM and encode as WAV
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

// Simplified uploadChunk function.
// (Integrate your encryption/signing logic as needed from your original script.)
async function uploadChunk(blob, currentChunkNumber, extension, mimeType, isLast = false) {
  // Assume getDecryptedAPIKey() returns your decrypted API key.
  const apiKey = await getDecryptedAPIKey();
  const backendUrl = "https://transcribe-notes-dnd6accbgwc9gdbz.norwayeast-01.azurewebsites.net/";
  const formData = new FormData();
  formData.append("file", blob, `chunk_${currentChunkNumber}.${extension}`);
  formData.append("group_id", groupId);
  formData.append("chunk_number", currentChunkNumber);
  formData.append("api_key", apiKey);
  // (Add additional fields: iv, salt, markers, device_token, signature, etc., as in your original upload endpoint.)
  if (isLast) {
    formData.append("last_chunk", "true");
  }
  try {
    const response = await fetch(`${backendUrl}/upload`, { method: "POST", body: formData });
    if (!response.ok) {
      throw new Error(`Upload failed with status ${response.status}`);
    }
    const result = await response.json();
    logInfo(`Upload successful for chunk ${currentChunkNumber}`, result);
    return result;
  } catch (err) {
    logError(`Upload error for chunk ${currentChunkNumber}:`, err);
  }
}

// Dummy getDecryptedAPIKey function (replace with your decryption logic)
async function getDecryptedAPIKey() {
  return sessionStorage.getItem("openai_api_key") || "";
}

// ------------------------------
// AudioWorklet Processor Code (inline)
// ------------------------------
const recorderProcessorCode = `
class RecorderProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffer = [];
    this.silenceCounter = 0;
    this.silenceThreshold = 0.01; // Adjust as needed for silence detection
    this.minimumChunkSamples = sampleRate * 3;  // Minimum 3 seconds of audio
    this.maximumChunkSamples = sampleRate * 40; // Maximum 40 seconds of audio
  }
  
  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (input.length > 0) {
      const channelData = input[0]; // assume mono channel
      // Store a copy of the current frame
      this.buffer.push(new Float32Array(channelData));
      
      // Calculate RMS of current frame
      let sum = 0;
      for (let i = 0; i < channelData.length; i++) {
        sum += channelData[i] * channelData[i];
      }
      const rms = Math.sqrt(sum / channelData.length);
      
      // Update silence counter if RMS is low
      if (rms < this.silenceThreshold) {
        this.silenceCounter += channelData.length;
      } else {
        this.silenceCounter = 0;
      }
      
      // Total samples in buffer
      const totalSamples = this.buffer.reduce((acc, curr) => acc + curr.length, 0);
      
      // Check if conditions to finalize chunk are met:
      // Either maximum chunk duration reached, or minimum duration met with at least 300ms of silence.
      if (totalSamples >= this.maximumChunkSamples || 
         (totalSamples >= this.minimumChunkSamples && this.silenceCounter >= 0.3 * sampleRate)) {
        // Flatten the buffer
        const combined = new Float32Array(totalSamples);
        let offset = 0;
        for (let chunk of this.buffer) {
          combined.set(chunk, offset);
          offset += chunk.length;
        }
        // Send the audio chunk (as ArrayBuffer) to the main thread
        this.port.postMessage({ audioChunk: combined.buffer }, [combined.buffer]);
        // Reset buffer and silence counter
        this.buffer = [];
        this.silenceCounter = 0;
      }
    }
    return true;
  }
}
registerProcessor('recorder-processor', RecorderProcessor);
`;

// Load the AudioWorklet module from the inline code
async function loadAudioWorkletModule(context) {
  const blob = new Blob([recorderProcessorCode], { type: 'application/javascript' });
  const url = URL.createObjectURL(blob);
  try {
    await context.audioWorklet.addModule(url);
    URL.revokeObjectURL(url);
  } catch (error) {
    logError("Failed to load AudioWorklet module", error);
  }
}

// ------------------------------
// Recording Control Functions
// ------------------------------
async function startRecording() {
  if (recordingPaused) {
    // Resume if paused
    if (mediaStream) {
      mediaStream.getAudioTracks()[0].enabled = true;
      recordingPaused = false;
      pauseResumeButton.innerText = "Pause Recording";
      updateStatusMessage("Recording resumed", "green");
      return;
    }
  }
  
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (error) {
    updateStatusMessage("Microphone access error: " + error, "red");
    logError("Microphone access error", error);
    return;
  }
  
  // Create a new AudioContext and load the AudioWorklet
  audioContext = new AudioContext();
  await loadAudioWorkletModule(audioContext);
  
  const source = audioContext.createMediaStreamSource(mediaStream);
  audioWorkletNode = new AudioWorkletNode(audioContext, 'recorder-processor');
  
  // Listen for audio chunks from the worklet
  audioWorkletNode.port.onmessage = async (event) => {
    const { audioChunk } = event.data;
    if (audioChunk) {
      const float32Array = new Float32Array(audioChunk);
      const int16Array = floatTo16BitPCM(float32Array);
      const wavBlob = encodeWAV(int16Array, audioContext.sampleRate, 1);
      logInfo(`Uploading chunk ${chunkNumber}`);
      await uploadChunk(wavBlob, chunkNumber, "wav", "audio/wav");
      chunkNumber++;
    }
  };
  
  // Connect the source to the worklet and to the destination (if you want to hear the audio)
  source.connect(audioWorkletNode).connect(audioContext.destination);
  
  // Initialize state and timers
  groupId = Date.now().toString();
  recordingStartTime = Date.now();
  recordingTimerInterval = setInterval(updateRecordingTimer, 1000);
  updateStatusMessage("Recording...", "green");
  logInfo("Recording started using AudioWorklet.");
  
  // Update UI button states
  if (startButton) startButton.disabled = true;
  if (stopButton) stopButton.disabled = false;
  if (pauseResumeButton) {
    pauseResumeButton.disabled = false;
    pauseResumeButton.innerText = "Pause Recording";
  }
}

async function stopRecording() {
  updateStatusMessage("Stopping recording...", "blue");
  manualStop = true;
  
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop());
    mediaStream = null;
  }
  if (audioContext) {
    await audioContext.close();
    audioContext = null;
  }
  clearInterval(recordingTimerInterval);
  updateStatusMessage("Recording stopped. Finalizing transcription.", "green");
  if (startButton) startButton.disabled = false;
  if (stopButton) stopButton.disabled = true;
  if (pauseResumeButton) pauseResumeButton.disabled = true;
  logInfo("Recording stopped.");
}

function togglePauseResume() {
  if (!mediaStream) return;
  const track = mediaStream.getAudioTracks()[0];
  if (track.enabled) {
    track.enabled = false;
    recordingPaused = true;
    if (pauseResumeButton) pauseResumeButton.innerText = "Resume Recording";
    updateStatusMessage("Recording paused", "orange");
    clearInterval(recordingTimerInterval);
    logInfo("Recording paused.");
  } else {
    track.enabled = true;
    recordingPaused = false;
    recordingStartTime = Date.now();
    recordingTimerInterval = setInterval(updateRecordingTimer, 1000);
    if (pauseResumeButton) pauseResumeButton.innerText = "Pause Recording";
    updateStatusMessage("Recording resumed", "green");
    logInfo("Recording resumed.");
  }
}

// Exported function to initialize recording functionality and attach UI event listeners
export function initRecording() {
  if (startButton) startButton.addEventListener("click", startRecording);
  if (stopButton) stopButton.addEventListener("click", stopRecording);
  if (pauseResumeButton) pauseResumeButton.addEventListener("click", togglePauseResume);
}
