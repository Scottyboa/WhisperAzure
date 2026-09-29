// Remove history left by older builds. The current history format is session-only.
const OLD_SESSION_PREFIXES = [
  "whisper_workspace_history_group_v1::",
  "whisper_workspace_history_group_v2::",
  "whisper_workspace_history_body_pending_v1::",
];
const OLD_SESSION_KEYS = new Set([
  "note_history_v1",
  "whisper_workspace_history_body_session_v1",
  "whisper_workspace_history_body_secret_v1",
]);
const CURRENT_PREFIX = "whisper_workspace_history_group_v3::";
const TAB_MARKER = "whisper_workspace_history_tab_v3";
const OLD_DB_NAME = "whisper_workspace_history_bodies_v1";

function removeMatching(storage, predicate) {
  try {
    for (let index = storage.length - 1; index >= 0; index -= 1) {
      const key = storage.key(index);
      if (key && predicate(key)) storage.removeItem(key);
    }
  } catch (error) {
    console.warn("[note-history] Could not clear old browser storage.", error);
  }
}

export function clearPreviousHistoryStorage({
  session = globalThis.sessionStorage,
  local = globalThis.localStorage,
  indexedDb = globalThis.indexedDB,
  navigationType = globalThis.performance?.getEntriesByType?.("navigation")?.[0]?.type ||
    (globalThis.performance?.navigation?.type === 1 ? "reload" : "navigate"),
} = {}) {
  // A restored browser tab may resurrect sessionStorage. Keep history only on
  // an actual page refresh, never on a new navigation into the app.
  let hadTabMarker = false;
  try { hadTabMarker = session.getItem(TAB_MARKER) === "1"; } catch {}
  if (navigationType !== "reload" || !hadTabMarker) {
    removeMatching(session, (key) => key.startsWith(CURRENT_PREFIX));
  }
  removeMatching(session, (key) =>
    OLD_SESSION_KEYS.has(key) ||
    OLD_SESSION_PREFIXES.some((prefix) => key.startsWith(prefix)) ||
    /^whisper_workspace_runtime::[^:]+::note_history_v1$/.test(key)
  );
  // Earlier versions could leave scoped history in localStorage.
  removeMatching(local, (key) =>
    OLD_SESSION_KEYS.has(key) ||
    OLD_SESSION_PREFIXES.some((prefix) => key.startsWith(prefix)) ||
    /^whisper_workspace_runtime::[^:]+::note_history_v1$/.test(key)
  );
  try { session.setItem(TAB_MARKER, "1"); } catch {}

  // Old encrypted bodies are not needed by the session-only history format.
  // Deletion may be blocked by another tab still running an older version.
  try {
    const request = indexedDb?.deleteDatabase?.(OLD_DB_NAME);
    if (request) {
      request.onerror = () => console.warn("[note-history] Could not delete the old IndexedDB history database.", request.error);
      request.onblocked = () => console.warn("[note-history] Close other old app tabs to finish deleting the old IndexedDB history database.");
    }
  } catch (error) {
    console.warn("[note-history] Could not delete the old IndexedDB history database.", error);
  }
}
