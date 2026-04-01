** File: js/transcribeSession.js
// One shared transcribe-session controller for the entire page.
// Any "new session" should abort the old one and replace the controller.

let _sessionId = 0;
let _controller = new AbortController();

/**
 * Returns the current session snapshot (stable id + signal).
 * Providers should capture this at the start of a recording/transcription flow.
 */
export function currentTranscribeSession() {
  return { id: _sessionId, signal: _controller.signal };
}

/**
 * Aborts any previous session and starts a fresh session.
 * Call this on every "Start" click (and optionally on provider switch).
 */
export function beginNewTranscribeSession(reason = "new-session") {
  try {
    // Abort old work. Some browsers ignore the reason argument; that's fine.
    _controller.abort(reason);
  } catch (_) {}

  _sessionId += 1;
  _controller = new AbortController();
  return { id: _sessionId, signal: _controller.signal };
}

/**
 * Abort without incrementing the session id (rarely needed).
 * Typically you'll call beginNewTranscribeSession() instead.
 */
export function abortCurrentTranscribeSession(reason = "abort") {
  try { _controller.abort(reason); } catch (_) {}
}

export function getTranscribeSessionId() {
  return _sessionId;
}

export function isCurrentTranscribeSession(id) {
  return id === _sessionId;
}
