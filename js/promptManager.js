// js/promptManager.js

export const PromptManager = (() => {
  const PROMPT_PROFILE_STORAGE_KEY = "prompt_profile_id";
  const DEFAULT_PROFILE_ID = "default";
  const PROMPT_SLOT_COUNT = 20;

  function readLocalStorage(key, fallback = "") {
    try {
      const value = localStorage.getItem(key);
      return value == null ? fallback : value;
    } catch {
      return fallback;
    }
  }

  function writeLocalStorage(key, value) {
    try {
      localStorage.setItem(key, String(value ?? ""));
      return true;
    } catch {
      return false;
    }
  }

  function removeLocalStorage(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }

  function emitPromptManagerEvent(name, detail = {}) {
    try {
      window.dispatchEvent(new CustomEvent(name, { detail }));
    } catch {}
  }

  function normalizeProfileId(profileId) {
    return String(profileId || "").trim();
  }

  function getEffectiveProfileId(profileId) {
    return normalizeProfileId(profileId) || DEFAULT_PROFILE_ID;
  }

  function getSlotNamesStorageKey(profileId) {
    return `prompt_slot_names::${getEffectiveProfileId(profileId)}`;
  }

  function getSelectedSlotStorageKey(profileId) {
    return `prompt_selected_slot::${getEffectiveProfileId(profileId)}`;
  }

  function loadSlotNames(profileId) {
    try {
      const raw = readLocalStorage(getSlotNamesStorageKey(profileId), "");
      const parsed = raw ? JSON.parse(raw) : {};
      return (parsed && typeof parsed === "object") ? parsed : {};
    } catch {
      return {};
    }
  }

  function saveSlotNames(profileId, map) {
    const safeMap = (map && typeof map === "object") ? map : {};
    writeLocalStorage(getSlotNamesStorageKey(profileId), JSON.stringify(safeMap));
    emitPromptManagerEvent("prompt-slot-names-changed", {
      profileId: getEffectiveProfileId(profileId),
      slotNames: safeMap,
    });
  }

  function clearSlotNames(profileId) {
    removeLocalStorage(getSlotNamesStorageKey(profileId));
    emitPromptManagerEvent("prompt-slot-names-changed", {
      profileId: getEffectiveProfileId(profileId),
      slotNames: {},
    });
  }

  function getSlotNames(profileId) {
    return loadSlotNames(profileId);
  }

  function getSlotDisplayName(slot, profileId) {
    const names = loadSlotNames(profileId);
    return String(names[String(slot)] || "").trim();
  }

  function setSlotDisplayName(slot, name, profileId) {
    const key = String(slot || "").trim();
    if (!key) return false;

    const names = loadSlotNames(profileId);
    const nextName = String(name || "").trim();

    if (nextName) {
      names[key] = nextName;
    } else {
      delete names[key];
    }

    saveSlotNames(profileId, names);
    return true;
  }

  function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return hash.toString();
  }

  function getPromptProfileId() {
    return normalizeProfileId(readLocalStorage(PROMPT_PROFILE_STORAGE_KEY, ""));
  }

  function getLegacyNamespaceHash() {
    const apiKey = sessionStorage.getItem("openai_api_key") || "";
    return hashString(apiKey);
  }

  function getProfileNamespaceHash(profileId) {
    return hashString(`profile:${normalizeProfileId(profileId)}`);
  }

  function migrateLegacyPromptsToProfileIfNeeded(profileId) {
    const pid = normalizeProfileId(profileId);
    if (!pid) return false;

    const newNs = getProfileNamespaceHash(pid);
    const migratedFlagKey = `prompt_migrated_v2_${newNs}`;

    if (readLocalStorage(migratedFlagKey, "") === "1") {
      return false;
    }

    const oldNs = getLegacyNamespaceHash();
    let copiedAny = false;

    for (let i = 1; i <= PROMPT_SLOT_COUNT; i++) {
      const slot = String(i);
      const oldKey = `customPrompt_${oldNs}_${slot}`;
      const newKey = `customPrompt_${newNs}_${slot}`;

      const newVal = readLocalStorage(newKey, "");
      if (newVal && newVal.trim()) continue;

      const oldVal = readLocalStorage(oldKey, "");
      if (!oldVal) continue;

      if (writeLocalStorage(newKey, oldVal)) {
        copiedAny = true;
      }
    }

    writeLocalStorage(migratedFlagKey, "1");

    if (copiedAny) {
      emitPromptManagerEvent("prompt-profile-migrated", {
        profileId: pid,
        namespaceHash: newNs,
      });
    }

    return copiedAny;
  }

  function setPromptProfileId(profileId) {
    const next = normalizeProfileId(profileId);
    const previous = getPromptProfileId();

    if (next) {
      writeLocalStorage(PROMPT_PROFILE_STORAGE_KEY, next);
      migrateLegacyPromptsToProfileIfNeeded(next);
    } else {
      removeLocalStorage(PROMPT_PROFILE_STORAGE_KEY);
    }

    const active = next || "";
    emitPromptManagerEvent("prompt-profile-changed", {
      previousProfileId: previous,
      profileId: active,
      effectiveProfileId: getEffectiveProfileId(active),
    });

    return active;
  }

  function resolveInputElement(inputOrSelector) {
    if (!inputOrSelector) return null;
    if (typeof inputOrSelector === "string") {
      try {
        return document.querySelector(inputOrSelector);
      } catch {
        return null;
      }
    }
    if (typeof inputOrSelector === "object" && "value" in inputOrSelector) {
      return inputOrSelector;
    }
    return null;
  }

  function hydratePromptProfileInput(inputOrSelector) {
    const input = resolveInputElement(inputOrSelector);
    if (!input) return "";

    const value = getPromptProfileId();
    if (typeof input.value === "string" && input.value !== value) {
      input.value = value;
    }
    return value;
  }

  function commitPromptProfileInput(inputOrValue) {
    if (typeof inputOrValue === "string") {
      return setPromptProfileId(inputOrValue);
    }

    const input = resolveInputElement(inputOrValue);
    const value = input && typeof input.value === "string" ? input.value : "";
    return setPromptProfileId(value);
  }

  function getPromptNamespaceHash(profileId) {
    const pid = normalizeProfileId(profileId) || getPromptProfileId();
    if (pid) {
      return getProfileNamespaceHash(pid);
    }
    return getLegacyNamespaceHash();
  }

  function getPromptStorageKey(slot, profileId) {
    const ns = getPromptNamespaceHash(profileId);
    return `customPrompt_${ns}_${slot}`;
  }

  function getSelectedPromptSlot(profileId) {
    const raw = readLocalStorage(getSelectedSlotStorageKey(profileId), "");
    const normalized = normalizeSlotNumber(raw);
    return String(normalized || 1);
  }

  function setSelectedPromptSlot(slot, profileId) {
    const normalized = normalizeSlotNumber(slot);
    if (!normalized) return null;

    const key = getSelectedSlotStorageKey(profileId);
    writeLocalStorage(key, String(normalized));
    emitPromptManagerEvent("prompt-slot-selection-changed", {
      profileId: getEffectiveProfileId(profileId),
      slot: String(normalized),
    });
    return String(normalized);
  }

  function sanitizeForFilename(s) {
    return (s || "")
      .toString()
      .trim()
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9_\-]+/g, "")
      .slice(0, 50) || "profile";
  }

  function downloadTextFile(filename, text, mime = "application/json") {
    const blob = new Blob([text], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function saveTextFileWithPicker(filename, text, mime = "application/json") {
    if (typeof window.showSaveFilePicker === "function") {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: filename,
          types: [
            {
              description: "JSON",
              accept: { "application/json": [".json"] }
            }
          ]
        });
        const writable = await handle.createWritable();
        await writable.write(new Blob([text], { type: mime }));
        await writable.close();
        return;
      } catch (err) {
        if (err && (err.name === "AbortError" || err.code === 20)) return;
        console.warn("Save picker failed; falling back to auto-download:", err);
      }
    }

    downloadTextFile(filename, text, mime);
  }

  async function exportPromptsToFile() {
    const profileId = getPromptProfileId();
    if (!profileId) {
      console.warn("Cannot export prompts: prompt profile id not set.");
      return false;
    }

    const slots = {};
    for (let i = 1; i <= PROMPT_SLOT_COUNT; i++) {
      const key = getPromptStorageKey(String(i));
      slots[String(i)] = readLocalStorage(key, "");
    }

    const slotNames = loadSlotNames(profileId);
    const hasAnySlotNames = slotNames && Object.keys(slotNames).length > 0;

    const payload = {
      version: 2,
      exportedAt: new Date().toISOString(),
      profileId,
      slots,
      ...(hasAnySlotNames ? { slotNames } : {})
    };

    const safe = sanitizeForFilename(profileId);
    const date = new Date().toISOString().slice(0, 10);

    await saveTextFileWithPicker(
      `prompts-${safe}-${date}.json`,
      JSON.stringify(payload, null, 2),
      "application/json"
    );

    emitPromptManagerEvent("prompt-slots-exported", {
      profileId,
      slotCount: PROMPT_SLOT_COUNT,
    });

    return true;
  }

  async function importPromptsFromFile(file) {
    const profileId = getPromptProfileId();
    if (!profileId) {
      console.warn("Cannot import prompts: prompt profile id not set.");
      return false;
    }

    if (!file) return false;

    let text = "";
    try {
      text = await file.text();
    } catch (e) {
      console.warn("Failed to read import file:", e);
      return false;
    }

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      window.alert("Import failed: file is not valid JSON.");
      return false;
    }

    const slotsObj = parsed && parsed.slots;
    if (!slotsObj || typeof slotsObj !== "object") {
      window.alert("Import failed: missing 'slots' object.");
      return false;
    }

    const ok = window.confirm("Replace existing prompts in this profile?");
    if (!ok) return false;

    for (let i = 1; i <= PROMPT_SLOT_COUNT; i++) {
      const k = String(i);
      const v = (k in slotsObj) ? (slotsObj[k] ?? "") : "";
      writeLocalStorage(getPromptStorageKey(k), String(v));
    }

    const importedSlotNames = parsed && parsed.slotNames;
    if (importedSlotNames && typeof importedSlotNames === "object") {
      saveSlotNames(profileId, importedSlotNames);
    } else {
      clearSlotNames(profileId);
    }

    emitPromptManagerEvent("prompt-slots-imported", {
      profileId,
      slotCount: PROMPT_SLOT_COUNT,
      hasSlotNames: !!(importedSlotNames && typeof importedSlotNames === "object"),
    });

    return true;
  }

  function normalizeSlotNumber(slot) {
    const n = Number.parseInt(String(slot), 10);
    if (!Number.isFinite(n) || n < 1 || n > PROMPT_SLOT_COUNT) return null;
    return n;
  }

  function getSlotPromptValue(slot, profileId) {
    return readLocalStorage(getPromptStorageKey(String(slot), profileId), "");
  }

  function setSlotPromptValue(slot, value, profileId) {
    writeLocalStorage(getPromptStorageKey(String(slot), profileId), String(value ?? ""));
    emitPromptManagerEvent("prompt-slot-value-changed", {
      profileId: getEffectiveProfileId(profileId || getPromptProfileId()),
      slot: String(slot),
    });
  }

  function reorderPromptSlots(fromSlot, toSlot) {
    const from = normalizeSlotNumber(fromSlot);
    const to = normalizeSlotNumber(toSlot);
    const profileId = getPromptProfileId();

    if (!from || !to) {
      console.warn("Cannot reorder prompt slots: invalid slot.", { fromSlot, toSlot });
      return null;
    }
    if (!profileId) {
      console.warn("Cannot reorder prompt slots: prompt profile id not set.");
      return null;
    }
    if (from === to) return to;

    const movedPrompt = getSlotPromptValue(from);
    const slotNames = loadSlotNames(profileId);
    const movedName = Object.prototype.hasOwnProperty.call(slotNames, String(from))
      ? slotNames[String(from)]
      : "";

    if (from < to) {
      for (let i = from; i < to; i++) {
        setSlotPromptValue(i, getSlotPromptValue(i + 1));
        const nextKey = String(i + 1);
        const currKey = String(i);
        if (Object.prototype.hasOwnProperty.call(slotNames, nextKey)) {
          slotNames[currKey] = slotNames[nextKey];
        } else {
          delete slotNames[currKey];
        }
      }
    } else {
      for (let i = from; i > to; i--) {
        setSlotPromptValue(i, getSlotPromptValue(i - 1));
        const prevKey = String(i - 1);
        const currKey = String(i);
        if (Object.prototype.hasOwnProperty.call(slotNames, prevKey)) {
          slotNames[currKey] = slotNames[prevKey];
        } else {
          delete slotNames[currKey];
        }
      }
    }

    setSlotPromptValue(to, movedPrompt);
    if (movedName && String(movedName).trim()) {
      slotNames[String(to)] = String(movedName);
    } else {
      delete slotNames[String(to)];
    }

    saveSlotNames(profileId, slotNames);
    emitPromptManagerEvent("prompt-slots-reordered", {
      profileId,
      from: String(from),
      to: String(to),
    });
    return to;
  }

  function getPrompt(slot) {
    return getSlotPromptValue(slot);
  }

  function loadPrompt(slot) {
    const val = getPrompt(slot);
    const textarea = document.getElementById("customPrompt");
    if (textarea) {
      textarea.value = val || "";
      textarea.dispatchEvent(new Event("input"));
    }
    return val;
  }

  function savePrompt(slot, value) {
    setSlotPromptValue(slot, value);
  }

  return {
    PROMPT_SLOT_COUNT,
    getPrompt,
    loadPrompt,
    savePrompt,
    getPromptProfileId,
    setPromptProfileId,
    hydratePromptProfileInput,
    commitPromptProfileInput,
    getPromptNamespaceHash,
    getPromptStorageKey,
    getSelectedPromptSlot,
    setSelectedPromptSlot,
    getSlotNames,
    getSlotDisplayName,
    setSlotDisplayName,
    reorderPromptSlots,
    exportPromptsToFile,
    importPromptsFromFile,
  };
})();
