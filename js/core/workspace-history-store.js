// One in-memory record and one sessionStorage payload per clone family.
// The UI and each Workspace's pending generation remain independently owned.
export const HISTORY_PREFIX = 'whisper_workspace_history_group_v1::';
const MAX_ENTRIES = 30;

export function mergeHistorySnapshots(snapshots) {
  const entriesById = new Map();
  let nextSequence = 1;
  for (const snapshot of snapshots) {
    const requestedNext = Number(snapshot?.nextSequence);
    if (Number.isInteger(requestedNext) && requestedNext > 0) nextSequence = Math.max(nextSequence, requestedNext);
    for (const raw of Array.isArray(snapshot?.entries) ? snapshot.entries : []) {
      if (!raw || typeof raw !== 'object' || typeof raw.transcript !== 'string' || !raw.transcript.trim() ||
          typeof raw.note !== 'string' || !raw.note.trim() || !Number.isFinite(Number(raw.createdAt)) || Number(raw.createdAt) < 1) continue;
      const entry = { ...raw };
      const key = String(entry.id || `${entry.sequence}-${entry.createdAt}`);
      if (!entriesById.has(key)) entriesById.set(key, entry);
    }
  }
  const chronological = [...entriesById.values()].sort((a, b) =>
    Number(a.createdAt || 0) - Number(b.createdAt || 0) || String(a.id || '').localeCompare(String(b.id || '')));
  const used = new Set();
  let highest = 0;
  for (const entry of chronological) {
    let sequence = Number(entry.sequence);
    if (!Number.isInteger(sequence) || sequence < 1 || used.has(sequence)) sequence = highest + 1;
    entry.sequence = sequence;
    used.add(sequence);
    highest = Math.max(highest, sequence);
  }
  return {
    entries: chronological.reverse().slice(0, MAX_ENTRIES),
    nextSequence: Math.max(nextSequence, highest + 1),
  };
}

export function createWorkspaceHistoryStore(storage) {
  const groups = new Map();
  const read = (key) => {
    try { return JSON.parse(storage.getItem(key) || 'null'); } catch { return null; }
  };
  function persist(groupId) {
    const record = groups.get(groupId);
    if (!record) return false;
    // Match the old history quota behavior: retain the newest entries first.
    for (;;) {
      try {
        storage.setItem(HISTORY_PREFIX + groupId, JSON.stringify({ version: 1, ...record }));
        return true;
      } catch {
        if (!record.entries.length) return false;
        record.entries.pop();
      }
    }
  }
  function ensure(groupId, legacyKeys = []) {
    if (groups.has(groupId)) return groups.get(groupId);
    const stored = read(HISTORY_PREFIX + groupId);
    const existing = Array.isArray(stored?.entries) ? stored : null;
    // An empty current record is authoritative: never resurrect cleared history
    // from an old clone whose runtime has not loaded yet.
    const record = mergeHistorySnapshots(existing ? [existing] : legacyKeys.map(read));
    groups.set(groupId, record);
    let saved = Boolean(existing);
    if (!saved) {
      const payload = JSON.stringify({ version: 1, ...record });
      const backups = new Map();
      try {
        storage.setItem(HISTORY_PREFIX + groupId, payload);
        saved = true;
      } catch {
        // A full session may have room for one shared payload, but not for
        // that payload AND all the old per-clone copies. Free only those
        // exact old keys, with rollback if the new write still fails.
        try {
          for (const key of legacyKeys) {
            const value = storage.getItem(key);
            if (value != null) backups.set(key, value);
          }
          for (const key of backups.keys()) storage.removeItem(key);
          storage.setItem(HISTORY_PREFIX + groupId, payload);
          saved = true;
        } catch {
          for (const [key, value] of backups) {
            try { storage.setItem(key, value); } catch {}
          }
          console.warn('[note-history] Shared history could not be persisted; keeping it in memory.');
        }
      }
    }
    if (saved) {
      legacyKeys.forEach((key) => { try { storage.removeItem(key); } catch {} });
    }
    return record;
  }
  return {
    ensure, persist,
    snapshot(groupId) {
      const record = ensure(groupId);
      return { entries: record.entries.map((entry) => ({ ...entry })), nextSequence: record.nextSequence };
    },
    replace(groupId, snapshot) {
      const record = ensure(groupId);
      Object.assign(record, mergeHistorySnapshots([snapshot]));
      persist(groupId);
      return record;
    },
    retain(groupIds) {
      const keep = new Set(groupIds);
      for (const id of groups.keys()) {
        if (keep.has(id)) continue;
        groups.delete(id);
        try { storage.removeItem(HISTORY_PREFIX + id); } catch {}
      }
    },
    release() { groups.clear(); },
  };
}
