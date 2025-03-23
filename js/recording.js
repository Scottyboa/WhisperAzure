// ... [all code remains the same up to the event listeners] ...

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
      // Directly process remaining frames, ignoring safeProcessAudioChunk guard.
      await processAudioChunkInternal(true);
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
