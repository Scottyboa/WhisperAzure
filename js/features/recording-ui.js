(function initRecordingUiFeature() {
  if (window.__recordingUiFeatureInitialized) return;
  window.__recordingUiFeatureInitialized = true;

  initRecordingTimerUi();
  initProviderLockWhileRecording();
})();

function getRecordingUiApp() {
  return window.__app || null;
}

function getRecordingUiBusyState() {
  const app = getRecordingUiApp();
  if (app && typeof app.isTranscribeBusy === "function") {
    try {
      return !!app.isTranscribeBusy();
    } catch (_) {}
  }

  const stopBtn = document.getElementById("stopButton");
  if (stopBtn && stopBtn.disabled === false) return true;

  const status = (document.getElementById("statusMessage")?.innerText || "").trim();
  if (!status) return false;
  if (/finishing transcription/i.test(status)) return true;
  if (/(transcribing|processing|uploading)/i.test(status) && !/transcription finished/i.test(status)) {
    return true;
  }

  return false;
}

function initRecordingTimerUi() {
  // Prevent double-init (in case of soft reloads / hot switches)
  if (window.__recordTimerControllerInitialized) return;
  window.__recordTimerControllerInitialized = true;

  const PREFIX = "Recording Timer:";

  const timerEl = document.getElementById("recordTimer");
  const startBtn = document.getElementById("startButton");
  const stopBtn = document.getElementById("stopButton");
  const pauseBtn = document.getElementById("pauseResumeButton");
  const transcriptionEl = document.getElementById("transcription");

  if (!timerEl || !startBtn || !stopBtn || !pauseBtn) return;

  let elapsedMs = 0;
  let running = false;
  let startedAtMs = 0;
  let intervalId = null;
  let blockedUntilStart = true;
  let pendingStart = false;
  let pendingStartTimeoutId = null;
  let pendingStartPollId = null;

  function formatTime(ms) {
    const totalSec = Math.floor(ms / 1000);
    if (totalSec < 60) return `${totalSec} sec`;
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return s > 0 ? `${m} min ${s} sec` : `${m} min`;
  }

  function currentElapsedMs() {
    return running ? (elapsedMs + (Date.now() - startedAtMs)) : elapsedMs;
  }

  function render() {
    timerEl.textContent = `${PREFIX} ${formatTime(currentElapsedMs())}`;
  }

  function clearTick() {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  function startTicking() {
    clearTick();
    intervalId = setInterval(render, 1000);
  }

  function clearPendingStartTimeout() {
    if (pendingStartTimeoutId) {
      clearTimeout(pendingStartTimeoutId);
      pendingStartTimeoutId = null;
    }
  }

  function clearPendingStartPoll() {
    if (pendingStartPollId) {
      clearInterval(pendingStartPollId);
      pendingStartPollId = null;
    }
  }

  function armStart() {
    clearPendingStartTimeout();
    clearPendingStartPoll();

    pendingStart = true;
    blockedUntilStart = true;

    elapsedMs = 0;
    running = false;
    clearTick();
    render();

    // Poll for the current busy state so this survives main.js button cloning
    // and future controller-side changes to what counts as "actively transcribing".
    pendingStartPollId = setInterval(() => {
      if (!pendingStart) return;
      if (getRecordingUiBusyState()) {
        confirmStart();
      }
    }, 100);

    pendingStartTimeoutId = setTimeout(() => {
      if (!pendingStart) return;
      cancelStart();
    }, 60000);
  }

  function confirmStart() {
    if (!pendingStart) return;
    pendingStart = false;
    clearPendingStartTimeout();
    clearPendingStartPoll();

    blockedUntilStart = false;
    elapsedMs = 0;
    running = true;
    startedAtMs = Date.now();
    render();
    startTicking();
  }

  function cancelStart() {
    if (!pendingStart) return;
    pendingStart = false;
    clearPendingStartTimeout();
    clearPendingStartPoll();

    blockedUntilStart = true;
    running = false;
    elapsedMs = 0;
    clearTick();
    render();
  }

  function freeze() {
    if (!running) {
      render();
      return;
    }
    elapsedMs += Date.now() - startedAtMs;
    running = false;
    clearTick();
    render();
  }

  function resume() {
    if (blockedUntilStart) return;
    if (running) return;
    if (elapsedMs <= 0) return;
    running = true;
    startedAtMs = Date.now();
    render();
    startTicking();
  }

  function resetTranscriptionWindowSize() {
    if (!transcriptionEl) return;
    transcriptionEl.style.removeProperty("height");
  }

  render();

  document.addEventListener("click", (event) => {
    const id = event.target && event.target.id;
    if (id === "startButton") {
      resetTranscriptionWindowSize();
      armStart();
      return;
    }

    if (id === "stopButton" || id === "abortButton") {
      cancelStart();
      freeze();
      blockedUntilStart = true;
      return;
    }

    if (id === "pauseResumeButton") {
      if (running) freeze();
      else resume();
    }
  }, true);

  window.addEventListener("transcription:finished", () => {
    cancelStart();
    freeze();
    blockedUntilStart = true;
  });
}

function initProviderLockWhileRecording() {
  let lastLocked = null;

  function setLocked(locked) {
    const providerSel = document.getElementById("transcribeProvider");
    const speakerLabelSel = document.getElementById("sonioxSpeakerLabels");
    const regionSel = document.getElementById("sonioxRegion");

    if (providerSel) providerSel.disabled = !!locked;
    if (speakerLabelSel) speakerLabelSel.disabled = !!locked;
    if (regionSel) regionSel.disabled = !!locked;
  }

  function syncLockedState() {
    const locked = getRecordingUiBusyState();

    if (locked !== lastLocked) {
      setLocked(locked);
      lastLocked = locked;
    }
  }

  syncLockedState();

  document.addEventListener("click", (event) => {
    const id = event.target && event.target.id;
    if (
      id === "startButton" ||
      id === "stopButton" ||
      id === "pauseResumeButton" ||
      id === "abortButton"
    ) {
      setTimeout(syncLockedState, 0);
      setTimeout(syncLockedState, 150);
    }
  }, true);

  window.addEventListener("transcription:finished", syncLockedState);

  // Keep a light polling fallback because main.js can replace buttons and
  // provider engines can update busy state asynchronously.
  setInterval(syncLockedState, 200);
}
