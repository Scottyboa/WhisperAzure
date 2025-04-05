import { initTranscribeLanguage } from './languageLoaderUsage.js';
import { initRecording } from './recording.js';
import { initNoteGeneration } from './noteGeneration.js';

document.addEventListener('DOMContentLoaded', () => {
  // Initialize language support for the transcribe page.
  initTranscribeLanguage();

  // Initialize the recording functionality.
  initRecording();

  // Initialize note generation and custom prompt handling.
  initNoteGeneration();

  // Add hotkey for the "r" key to trigger the "Start Recording" button,
  // but only when not inside an editable text field.
  document.addEventListener('keydown', (event) => {
    const activeElement = document.activeElement;
    if (
      activeElement &&
      (activeElement.tagName === 'INPUT' ||
       activeElement.tagName === 'TEXTAREA' ||
       activeElement.isContentEditable)
    ) {
      return;
    }
    if (event.key.toLowerCase() === 'r') {
      const startButton = document.getElementById('startButton');
      if (startButton) {
        startButton.click();
      }
    }
  });

  // (Optional) Existing __tcfapi consent listener code can remain here if you use it.

  // Now, check for an "ad signal" cookie after a short delay.
  // This cookie (e.g. "adsActive") should be set to "true" when ads are successfully loaded.
  setTimeout(checkAdSignal, 5000);
});

// Helper function to retrieve a cookie value by name.
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

// Function to check the ad signal cookie and enable/disable site functions accordingly.
function checkAdSignal() {
  const adSignal = getCookie("adsActive"); // Expect "true" if ads are active.
  console.log("Ad signal cookie value:", adSignal);
  if (adSignal === "true") {
    enableTranscribeFunctions();
  } else {
    disableTranscribeFunctions();
  }
}

// Function to disable functions on the transcribe page.
function disableTranscribeFunctions() {
  const startButton = document.getElementById("startButton");
  if (startButton) {
    startButton.disabled = true;
    startButton.title = "Start Recording is disabled because ads are not active.";
  }
  const generateNoteButton = document.getElementById("generateNoteButton");
  if (generateNoteButton) {
    generateNoteButton.disabled = true;
    generateNoteButton.title = "Generate Note is disabled because ads are not active.";
  }
  console.log("Transcribe page functions disabled due to missing ad signal.");
}

// Function to enable functions on the transcribe page.
function enableTranscribeFunctions() {
  const startButton = document.getElementById("startButton");
  if (startButton) {
    startButton.disabled = false;
    startButton.title = "";
  }
  const generateNoteButton = document.getElementById("generateNoteButton");
  if (generateNoteButton) {
    generateNoteButton.disabled = false;
    generateNoteButton.title = "";
  }
  console.log("Transcribe page functions enabled because ad signal is active.");
}
