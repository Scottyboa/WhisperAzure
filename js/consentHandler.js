// consentHandler.js

// Global flag to indicate if the user has rejected all consent options.
window.consentRejected = false;

// Listen for TCF events using the __tcfapi event listener.
window.__tcfapi('addEventListener', 2, function(tcData, success) {
  if (success) {
    // Check if the user has completed the consent action or the consent data has been loaded.
    if (tcData.eventStatus === 'useractioncomplete' || tcData.eventStatus === 'tcloaded') {
      if (tcData.gdprApplies) {
        let allRejected = true;
        if (tcData.purpose && tcData.purpose.consents) {
          // Loop through each consent purpose to check if any are granted.
          for (let purpose in tcData.purpose.consents) {
            if (tcData.purpose.consents[purpose] === true) {
              allRejected = false;
              break;
            }
          }
        }
        if (allRejected) {
          console.log("User rejected all consent options.");
          disableConsentDependentFeatures();
          window.consentRejected = true;
        } else {
          console.log("User granted some consent.");
          enableConsentDependentFeatures();
          window.consentRejected = false;
        }
      } else {
        console.log("GDPR does not apply; enabling all features.");
        enableConsentDependentFeatures();
        window.consentRejected = false;
      }
    }
  } else {
    console.error("Error listening for consent events.");
  }
});

// Function to disable features that depend on user consent.
// For example, disable the note generation feature.
function disableConsentDependentFeatures() {
  const generateNoteButton = document.getElementById("generateNoteButton");
  if (generateNoteButton) {
    generateNoteButton.disabled = true;
    generateNoteButton.title = "Note generation is disabled because you rejected consent.";
  }
  // Add further logic here to disable any other consent-dependent features.
}

// Function to enable features that depend on user consent.
function enableConsentDependentFeatures() {
  const generateNoteButton = document.getElementById("generateNoteButton");
  if (generateNoteButton) {
    generateNoteButton.disabled = false;
    generateNoteButton.title = "";
  }
  // Add further logic here to re-enable any other features that were disabled.
}
