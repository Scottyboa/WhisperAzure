// Extracted from transcribe.html inline ad-refresh helper.
// Keeps the same cooldown/trigger behavior, but uses event delegation so it
// survives button replacement/rebinding elsewhere in the app.

(function initAdRefreshFeature() {
  const BUTTON_IDS = new Set([
    "startButton",
    "stopButton",
    "abortButton",
    "generateNoteButton"
  ]);

  const MIN_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 min cooldown
  let lastRefresh = Date.now();

  function getRefreshSlots() {
    return [
      window.slotTopLeft,
      window.slotTopRight,
      window.slotBottomLeft,
      window.slotBottomRight
    ].filter(Boolean);
  }

  function refreshAds() {
    const now = Date.now();
    if (now - lastRefresh < MIN_REFRESH_INTERVAL) return;

    const slots = getRefreshSlots();
    if (!slots.length) return;
    if (!window.googletag || !googletag.pubads) return;

    // refresh without changing the correlator
    googletag.pubads().refresh(slots, { changeCorrelator: false });
    lastRefresh = now;
    console.log("Ads refreshed at", new Date().toLocaleTimeString());
  }

  function handleDocumentClick(event) {
    const button = event.target && event.target.closest
      ? event.target.closest("button")
      : null;
    if (!button) return;
    if (!BUTTON_IDS.has(button.id)) return;
    if (!window.googletag || !googletag.cmd) return;

    googletag.cmd.push(refreshAds);
  }

  function wireOnce() {
    if (window.__adRefreshFeatureWired) return;
    window.__adRefreshFeatureWired = true;
    document.addEventListener("click", handleDocumentClick, true);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wireOnce, { once: true });
  } else {
    wireOnce();
  }
})();
