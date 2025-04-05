// consentHandler.js

// Listen for TCF events using the __tcfapi event listener.
window.__tcfapi('addEventListener', 2, function(tcData, success) {
  if (success) {
    // The eventStatus indicates whether the user has completed a consent action.
    if (tcData.eventStatus === 'useractioncomplete' || tcData.eventStatus === 'tcloaded') {
      // If GDPR applies, check the consent for each purpose.
      if (tcData.gdprApplies) {
        let allRejected = true;
        if (tcData.purpose && tcData.purpose.consents) {
          // Loop over each purpose consent flag.
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
        } else {
          console.log("User granted some consent.");
          enableConsentDependentFeatures();
        }
      } else {
        console.log("GDPR does not apply; enabling all features.");
        enableConsentDependentFeatures();
      }
    }
  } else {
    console.error("Error listening for consent events.");
  }
});

// Function to disable features that depend on user consent.
// For example, disabling the note generation functionality.
function disableConsentDependentFeatures() {
  const generateNoteButton = document.getElementById("generateNoteButton");
  if (generateNoteButton) {
    generateNoteButton.disabled = true;
    generateNoteButton.title = "Note generation is disabled because you rejected consent.";
  }
  // Add further logic here to disable any other consent-dependent features.
}

// Function to re-enable features when consent is granted.
function enableConsentDependentFeatures() {
  const generateNoteButton = document.getElementById("generateNoteButton");
  if (generateNoteButton) {
    generateNoteButton.disabled = false;
    generateNoteButton.title = "";
  }
  // Add further logic here to re-enable any other features that were disabled.
}
