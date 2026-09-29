// History survives refresh in this tab's sessionStorage, never in persistent storage.
export const HISTORY_PREFIX = "whisper_workspace_history_group_v3::";
const MAX_ENTRIES = 30;

function normalizeEntry(raw) {
  if (!raw || typeof raw !== "object") return null;
  const sequence = Number(raw.sequence);
  const createdAt = Number(raw.createdAt);
  if (!Number.isInteger(sequence) || sequence < 1 || !Number.isFinite(createdAt) || createdAt < 1) return null;
  return {
    id: String(raw.id || `note-${sequence}-${createdAt}`),
    sequence,
    createdAt,
    kind: raw.kind === "transcript" ? "transcript" : "note",
    promptSlot: String(raw.promptSlot || ""),
    promptLabel: String(raw.promptLabel || ""),
    usedPrompt: raw.usedPrompt !== false,
    transcript: String(raw.transcript || ""),
    supplementary: String(raw.supplementary || ""),
    note: String(raw.note || ""),
  };
}

function normalizeSnapshot(snapshot) {
  const seen = new Set();
  const entries = [];
  for (const raw of Array.isArray(snapshot?.entries) ? snapshot.entries : []) {
    const entry = normalizeEntry(raw);
    if (!entry || !entry.transcript.trim() || seen.has(entry.id)) continue;
    seen.add(entry.id);
    entries.push(entry);
    if (entries.length === MAX_ENTRIES) break;
  }
  const highest = entries.reduce((value, entry) => Math.max(value, entry.sequence), 0);
  return {
    entries,
    nextSequence: Math.max(highest + 1, Number(snapshot?.nextSequence) || 1),
  };
}

export function createWorkspaceHistoryStore(storage) {
  const groups = new Map();
  const read = (key) => {
    try { return JSON.parse(storage.getItem(key) || "null"); } catch { return null; }
  };

  function ensure(groupId) {
    if (!groups.has(groupId)) {
      groups.set(groupId, normalizeSnapshot(read(HISTORY_PREFIX + groupId)));
    }
    return groups.get(groupId);
  }

  function persist(groupId) {
    const record = ensure(groupId);
    // Keep the newest entries when a browser has an unusually small session quota.
    // The in-memory record remains available even if storage is disabled.
    for (let count = record.entries.length; count >= 0; count -= 1) {
      try {
        storage.setItem(HISTORY_PREFIX + groupId, JSON.stringify({
          version: 3,
          nextSequence: record.nextSequence,
          entries: record.entries.slice(0, count),
        }));
        if (count < record.entries.length) {
          console.warn("[note-history] Some older entries cannot survive refresh: sessionStorage quota exceeded.");
        }
        return true;
      } catch {}
    }
    console.warn("[note-history] History cannot survive refresh: sessionStorage is unavailable.");
    return false;
  }

  return {
    ensure,
    persist,
    snapshot(groupId) {
      const record = ensure(groupId);
      return { entries: record.entries.map((entry) => ({ ...entry })), nextSequence: record.nextSequence };
    },
    async loadEntry(groupId, entryId) {
      const entry = ensure(groupId).entries.find((item) => item.id === String(entryId || ""));
      return entry ? { ...entry } : null;
    },
    replace(groupId, snapshot) {
      const record = ensure(groupId);
      Object.assign(record, normalizeSnapshot(snapshot));
      persist(groupId);
      return record;
    },
    retain(groupIds) {
      const keep = new Set(groupIds);
      for (const id of [...groups.keys()]) {
        if (keep.has(id)) continue;
        groups.delete(id);
        try { storage.removeItem(HISTORY_PREFIX + id); } catch {}
      }
    },
    release() { groups.clear(); },
  };
}
