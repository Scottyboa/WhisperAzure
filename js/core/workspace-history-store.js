// One small in-memory metadata record and one small sessionStorage payload per
// clone family. Large transcript/supplementary/note bodies are delegated to the
// asynchronous body store and loaded only when a history item is opened.
export const HISTORY_PREFIX = "whisper_workspace_history_group_v2::";
export const LEGACY_HISTORY_PREFIX = "whisper_workspace_history_group_v1::";
const MAX_ENTRIES = 30;

function normalizeMetadataEntry(raw) {
  if (!raw || typeof raw !== "object") return null;
  const sequence = Number(raw.sequence);
  const createdAt = Number(raw.createdAt);
  if (!Number.isInteger(sequence) || sequence < 1 ||
      !Number.isFinite(createdAt) || createdAt < 1) return null;
  return {
    id: String(raw.id || `note-${sequence}-${createdAt}`),
    sequence,
    createdAt,
    promptSlot: String(raw.promptSlot || ""),
    promptLabel: String(raw.promptLabel || ""),
    usedPrompt: raw.usedPrompt !== false,
  };
}

function hasBody(entry) {
  return typeof entry?.transcript === "string" &&
    typeof entry?.note === "string" &&
    Boolean(entry.transcript.trim()) &&
    Boolean(entry.note.trim());
}

function toMetadataEntry(entry) {
  return normalizeMetadataEntry(entry);
}

function fullEntriesFromSnapshots(snapshots) {
  const byId = new Map();
  for (const snapshot of snapshots) {
    for (const raw of Array.isArray(snapshot?.entries) ? snapshot.entries : []) {
      const metadata = normalizeMetadataEntry(raw);
      if (!metadata || !hasBody(raw)) continue;
      const key = metadata.id;
      if (!byId.has(key)) {
        byId.set(key, {
          ...metadata,
          transcript: String(raw.transcript || ""),
          supplementary: String(raw.supplementary || ""),
          note: String(raw.note || ""),
        });
      }
    }
  }
  return [...byId.values()];
}

export function mergeHistorySnapshots(snapshots) {
  const entriesById = new Map();
  let nextSequence = 1;
  for (const snapshot of snapshots) {
    const requestedNext = Number(snapshot?.nextSequence);
    if (Number.isInteger(requestedNext) && requestedNext > 0) {
      nextSequence = Math.max(nextSequence, requestedNext);
    }
    for (const raw of Array.isArray(snapshot?.entries) ? snapshot.entries : []) {
      const entry = normalizeMetadataEntry(raw);
      if (!entry) continue;
      const key = entry.id;
      if (!entriesById.has(key)) entriesById.set(key, entry);
    }
  }

  const chronological = [...entriesById.values()].sort((a, b) =>
    Number(a.createdAt || 0) - Number(b.createdAt || 0) ||
    String(a.id || "").localeCompare(String(b.id || "")));

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

export function createWorkspaceHistoryStore(storage, bodyStore = null) {
  const groups = new Map();

  const read = (key) => {
    try { return JSON.parse(storage.getItem(key) || "null"); } catch { return null; }
  };

  function writeMetadata(groupId, record) {
    try {
      storage.setItem(
        HISTORY_PREFIX + groupId,
        JSON.stringify({ version: 2, entries: record.entries, nextSequence: record.nextSequence })
      );
      return true;
    } catch {
      return false;
    }
  }

  function removeStorageKey(key) {
    try { storage.removeItem(key); } catch {}
  }

  function commitMigratedMetadata(groupId, record, legacyKeys) {
    const obsoleteKeys = [LEGACY_HISTORY_PREFIX + groupId, ...legacyKeys];
    if (writeMetadata(groupId, record)) {
      obsoleteKeys.forEach(removeStorageKey);
      return true;
    }

    // If the old full-text history has filled sessionStorage, temporarily free
    // those exact keys, write the tiny metadata index, and roll back on failure.
    const backups = new Map();
    try {
      for (const key of obsoleteKeys) {
        const value = storage.getItem(key);
        if (value != null) backups.set(key, value);
      }
      obsoleteKeys.forEach(removeStorageKey);
      if (writeMetadata(groupId, record)) return true;
    } catch {}

    for (const [key, value] of backups) {
      try { storage.setItem(key, value); } catch {}
    }
    return false;
  }

  function queueBodies(groupId, entries, options = {}) {
    if (!bodyStore || !entries.length) return Promise.resolve([]);
    return bodyStore.putMany(groupId, entries, options);
  }

  function persist(groupId) {
    const record = groups.get(groupId);
    if (!record) return false;

    const fullEntries = record.entries.filter(hasBody);
    if (fullEntries.length) {
      // Capture the full strings for the async write, then immediately shrink the
      // active workspace record to metadata. The body store keeps a temporary
      // memory fallback until the IndexedDB write finishes.
      void queueBodies(groupId, fullEntries);
      record.entries = record.entries.map(toMetadataEntry).filter(Boolean).slice(0, MAX_ENTRIES);
    }

    const saved = writeMetadata(groupId, record);
    void bodyStore?.reconcile?.(groupId, record.entries.map((entry) => entry.id));
    return saved;
  }

  function ensure(groupId, legacyKeys = []) {
    if (groups.has(groupId)) return groups.get(groupId);

    const current = read(HISTORY_PREFIX + groupId);
    const previousShared = read(LEGACY_HISTORY_PREFIX + groupId);
    const sources = [];

    if (Array.isArray(current?.entries)) {
      sources.push(current);
    } else if (Array.isArray(previousShared?.entries)) {
      sources.push(previousShared);
    } else {
      legacyKeys.map(read).filter(Boolean).forEach((snapshot) => sources.push(snapshot));
    }

    const record = mergeHistorySnapshots(sources);
    groups.set(groupId, record);

    const fullEntries = fullEntriesFromSnapshots(sources);
    if (fullEntries.length && bodyStore) {
      // Keep the legacy full-text payload until migration succeeds. This protects
      // refresh-in-the-middle-of-migration, but the active JS record is already tiny.
      void queueBodies(groupId, fullEntries, { sessionFallback: false }).then((results) => {
        const storedAll = results.every(
          (result) => result.status === "fulfilled" && result.value === true
        );
        if (!storedAll) return;
        commitMigratedMetadata(groupId, record, legacyKeys);
      }).catch(() => {});
    } else {
      writeMetadata(groupId, record);
      removeStorageKey(LEGACY_HISTORY_PREFIX + groupId);
      legacyKeys.forEach(removeStorageKey);
    }

    return record;
  }

  return {
    ensure,
    persist,

    snapshot(groupId) {
      const record = ensure(groupId);
      return {
        entries: record.entries.map((entry) => ({ ...entry })),
        nextSequence: record.nextSequence,
      };
    },

    async loadEntry(groupId, entryId) {
      const record = ensure(groupId);
      const metadata = record.entries.find((entry) => entry.id === String(entryId || ""));
      if (!metadata) return null;

      // During the same synchronous turn in which a note was completed, the entry
      // can still contain its body. Normally persist() strips it immediately.
      if (hasBody(metadata)) return { ...metadata };

      const body = await bodyStore?.get?.(groupId, metadata.id);
      if (!body) return null;
      return { ...metadata, ...body };
    },

    replace(groupId, snapshot) {
      const record = ensure(groupId);
      const fullEntries = fullEntriesFromSnapshots([snapshot]);
      Object.assign(record, mergeHistorySnapshots([snapshot]));
      if (fullEntries.length) void queueBodies(groupId, fullEntries);
      if (!record.entries.length) void bodyStore?.clearGroup?.(groupId);
      persist(groupId);
      return record;
    },

    retain(groupIds) {
      const keep = new Set(groupIds);
      for (const id of [...groups.keys()]) {
        if (keep.has(id)) continue;
        groups.delete(id);
        removeStorageKey(HISTORY_PREFIX + id);
        removeStorageKey(LEGACY_HISTORY_PREFIX + id);
        void bodyStore?.clearGroup?.(id);
      }
      void bodyStore?.retainGroups?.(keep);
    },

    release() {
      groups.clear();
      bodyStore?.release?.();
    },
  };
}
