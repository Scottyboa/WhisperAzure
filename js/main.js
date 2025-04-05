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

  // Check the initial consent state immediately.
  if (typeof window.__tcfapi === 'function') {
    window.__tcfapi('getTCData', 2, function(tcData, success) {
      if (success && tcData) {
        console.log("Initial consent data on transcribe page:", tcData);
        let consentGiven = false;
        for (let purpose in tcData.purpose.consents) {
          if (tcData.purpose.consents[purpose] === true) {
            consentGiven = true;
            break;
          }
        }
        if (consentGiven) {
          enableTranscribeFunctions();
        } else {
          disableTranscribeFunctions();
        }
      }
    });

    // Active event listener for future consent changes.
    window.__tcfapi('addEventListener', 2, function(tcData, success) {
      if (success && tcData) {
        console.log("Consent updated on transcribe page:", tcData);
        let consentGiven = false;
        for (let purpose in tcData.purpose.consents) {
          if (tcData.purpose.consents[purpose] === true) {
            consentGiven = true;
            break;
          }
        }
        if (consentGiven) {
          enableTranscribeFunctions();
        } else {
          disableTranscribeFunctions();
        }
      }
    });
  }
});

// Function to disable functions on the transcribe page.
function disableTranscribeFunctions() {
  const startButton = document.getElementById("startButton");
  if (startButton) {
    startButton.disabled = true;
    startButton.title = "Start Recording is disabled because you rejected consent.";
  }
  const generateNoteButton = document.getElementById("generateNoteButton");
  if (generateNoteButton) {
    generateNoteButton.disabled = true;
    generateNoteButton.title = "Generate Note is disabled because you rejected consent.";
  }
  console.log("Transcribe page functions disabled due to lack of consent.");
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
  console.log("Transcribe page functions enabled.");
}
