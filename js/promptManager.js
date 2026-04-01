// js/promptManager.js

export const PromptManager = (() => {
  const PROMPT_PROFILE_STORAGE_KEY = "prompt_profile_id";
  const PROMPT_SLOT_COUNT = 20;
  // Slot labels are stored per profile in localStorage under this key format:
  //   prompt_slot_names::<profileId>
  // (This matches transcribe.html's prompt label UI implementation.)
  function getSlotNamesStorageKey(profileId) {
    const pid = (profileId || "").trim() || "default";
    return `prompt_slot_names::${pid}`;
  }

  function loadSlotNames(profileId) {
    try {
      const raw = localStorage.getItem(getSlotNamesStorageKey(profileId));
      const parsed = raw ? JSON.parse(raw) : {};
      return (parsed && typeof parsed === "object") ? parsed : {};
    } catch {
      return {};
    }
  }

  function saveSlotNames(profileId, map) {
    try {
      localStorage.setItem(getSlotNamesStorageKey(profileId), JSON.stringify(map || {}));
    } catch {}
  }

  function clearSlotNames(profileId) {
    try {
      localStorage.removeItem(getSlotNamesStorageKey(profileId));
    } catch {}
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
    try {
      return (localStorage.getItem(PROMPT_PROFILE_STORAGE_KEY) || "").trim();
    } catch {
      return "";
    }
  }

  // Namespace helpers (needed for migration)
  function getLegacyNamespaceHash() {
    // IMPORTANT: legacy behavior is hash(raw openai_api_key)
    const apiKey = sessionStorage.getItem("openai_api_key") || "";
    return hashString(apiKey);
  }

  function getProfileNamespaceHash(profileId) {
    return hashString(`profile:${(profileId || "").trim()}`);
  }

  function migrateLegacyPromptsToProfileIfNeeded(profileId) {
    const pid = (profileId || "").trim();
    if (!pid) return;

    const newNs = getProfileNamespaceHash(pid);
    const migratedFlagKey = `prompt_migrated_${newNs}`;

    try {
      if (localStorage.getItem(migratedFlagKey) === "1") return;
    } catch {
      // If localStorage isn't available, do nothing.
      return;
    }

    const oldNs = getLegacyNamespaceHash();

    // Copy slot 1–10: legacy storage only ever had 10 slots.
    // Keep this at 10 so we don't accidentally pull unrelated keys.
    for (let i = 1; i <= 10; i++) {
      const slot = String(i);
      const oldKey = `customPrompt_${oldNs}_${slot}`;
      const newKey = `customPrompt_${newNs}_${slot}`;

      let newVal = "";
      let oldVal = "";
      try { newVal = (localStorage.getItem(newKey) || ""); } catch {}
      if (newVal && newVal.trim()) continue;

      try { oldVal = (localStorage.getItem(oldKey) || ""); } catch {}
      if (!oldVal) continue;

      try { localStorage.setItem(newKey, oldVal); } catch {}
    }

    // Mark migration as done for this profile namespace
    try { localStorage.setItem(migratedFlagKey, "1"); } catch {}
  }


  function setPromptProfileId(profileId) {
    const v = (profileId || "").trim();
    try {
      if (v) localStorage.setItem(PROMPT_PROFILE_STORAGE_KEY, v);
      else localStorage.removeItem(PROMPT_PROFILE_STORAGE_KEY);
    } catch {}
    // One-time migration: if a profile is being set, copy legacy prompts into it (non-destructive).
    if (v) {
      migrateLegacyPromptsToProfileIfNeeded(v);
    }
    return v;
  }

  // Centralized namespace logic:
  // - If profileId exists -> hash("profile:" + profileId)
  // - Else -> legacy hash(openai_api_key) (IMPORTANT: do not change legacy hashing)
  function getPromptNamespaceHash() {
    const profileId = getPromptProfileId();
    if (profileId) {
      return getProfileNamespaceHash(profileId);
    }
    // Legacy fallback (do NOT change): hash(raw openai_api_key)
    return getLegacyNamespaceHash();
  }



  function getPromptStorageKey(slot) {
    const ns = getPromptNamespaceHash();
    return `customPrompt_${ns}_${slot}`;
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
    // Prefer a "Save As…" dialog (lets user choose folder + name + overwrite),
    // but fall back to the legacy auto-download approach if unsupported.
    // Note: showSaveFilePicker generally requires a secure context (https/localhost).
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
        // User cancelled the dialog -> do nothing.
        if (err && (err.name === "AbortError" || err.code === 20)) return;
        console.warn("Save picker failed; falling back to auto-download:", err);
        // Continue to fallback below.
      }
    }
    downloadTextFile(filename, text, mime);
  }

  async function exportPromptsToFile() {
    // Behavior: export prompts for CURRENT profile namespace only.
    // UI should ensure a profile is set (Behavior 1 design).
    const profileId = getPromptProfileId();
    if (!profileId) {
      console.warn("Cannot export prompts: prompt profile id not set.");
      return;
    }

    const slots = {};
    for (let i = 1; i <= PROMPT_SLOT_COUNT; i++) {
      const key = getPromptStorageKey(String(i));
      const val = localStorage.getItem(key) || "";
      slots[String(i)] = val;
    }
    // NEW: include prompt slot labels (if any exist for this profile)
    const slotNames = loadSlotNames(profileId);
    const hasAnySlotNames = slotNames && Object.keys(slotNames).length > 0;


    const payload = {
      version: 2,
      exportedAt: new Date().toISOString(),
      // profileId included as metadata only (Behavior 1 import will ignore it)
      profileId,
      slots,
      ...(hasAnySlotNames ? { slotNames } : {})
    };

    const safe = sanitizeForFilename(profileId);
    const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    await saveTextFileWithPicker(
      `prompts-${safe}-${date}.json`,
      JSON.stringify(payload, null, 2),
      "application/json"
    );
  }
  async function importPromptsFromFile(file) {
    // Behavior 1: import into CURRENT profile namespace (ignores file.profileId).
    const profileId = getPromptProfileId();
    if (!profileId) {
      console.warn("Cannot import prompts: prompt profile id not set.");
      return;
    }

    if (!file) return;

    let text = "";
    try {
      text = await file.text();
    } catch (e) {
      console.warn("Failed to read import file:", e);
      return;
    }

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      window.alert("Import failed: file is not valid JSON.");
      return;
    }

    const slotsObj = parsed && parsed.slots;
    if (!slotsObj || typeof slotsObj !== "object") {
      window.alert("Import failed: missing 'slots' object.");
      return;
    }

    const ok = window.confirm("Replace existing prompts in this profile?");
    if (!ok) return;

    // Write slots 1–PROMPT_SLOT_COUNT into current namespace.
    // Back-compat: if the import JSON only contains 1–10, the missing 11–20 import as "".
    for (let i = 1; i <= PROMPT_SLOT_COUNT; i++) {
      const k = String(i);
      const v = (k in slotsObj) ? (slotsObj[k] ?? "") : "";
      try {
        localStorage.setItem(getPromptStorageKey(k), String(v));
      } catch {}
    }
    // NEW IMPORT RULE:
    // - If the import file includes slotNames: apply/overwrite labels
    // - If it does NOT include slotNames: clear any existing labels for this profile
    const importedSlotNames = parsed && parsed.slotNames;
    if (importedSlotNames && typeof importedSlotNames === "object") {
      // Only overwrite labels if the file explicitly contains them.
      saveSlotNames(profileId, importedSlotNames);
    } else {
      clearSlotNames(profileId);
    }
  }


  function normalizeSlotNumber(slot) {
    const n = Number.parseInt(String(slot), 10);
    if (!Number.isFinite(n) || n < 1 || n > PROMPT_SLOT_COUNT) return null;
    return n;
  }

  function getSlotPromptValue(slot) {
    try {
      return localStorage.getItem(getPromptStorageKey(String(slot))) || "";
    } catch {
      return "";
    }
  }

  function setSlotPromptValue(slot, value) {
    try {
      localStorage.setItem(getPromptStorageKey(String(slot)), String(value ?? ""));
    } catch {}
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
    return to;
  }

  function loadPrompt(slot) {
    const key = getPromptStorageKey(slot);
    const val = localStorage.getItem(key);
    const textarea = document.getElementById("customPrompt");
    if (textarea) {
      textarea.value = val || "";
      textarea.dispatchEvent(new Event("input"));
    }
  }

  function savePrompt(slot, value) {
    const key = getPromptStorageKey(slot);
    try { localStorage.setItem(key, value || ""); } catch {}
  }

  // Expose profile helpers for the UI (index.html / transcribe.html) to set and read.
  return {
    loadPrompt,
    savePrompt,
    getPromptProfileId,
    setPromptProfileId,
    reorderPromptSlots,
    exportPromptsToFile,
    importPromptsFromFile
  };
})();
