import { PromptManager } from "../promptManager.js";

const promptSlotSelect = document.getElementById("promptSlot");
const promptSlotPicker = document.getElementById("promptSlotPicker");
const promptSlotTrigger = document.getElementById("promptSlotTrigger");
const promptSlotTriggerSlot = document.getElementById("promptSlotTriggerSlot");
const promptSlotTriggerName = document.getElementById("promptSlotTriggerName");
const promptSlotPopover = document.getElementById("promptSlotPopover");
const promptSlotList = document.getElementById("promptSlotList");
const customPromptTextarea = document.getElementById("customPrompt");
const clearPromptButton = document.getElementById("clearPromptButton");
const copyPromptButton = document.getElementById("copyPromptButton");
const promptSlotNameInput = document.getElementById("promptSlotName");

const promptProfileValue = document.getElementById("promptProfileValue");
const promptExportBtn = document.getElementById("promptExportBtn");
const promptImportBtn = document.getElementById("promptImportBtn");
const promptImportFile = document.getElementById("promptImportFile");
const MINI_HUB_UI_REFRESH_EVENT = "mini-hub:prompt-ui-refresh";

function getPromptOptionsForMiniPanel() {
  const slots = getAvailableSlots();
  const names = getSlotNames();

  return slots.map((slot) => {
    const explicit = getSlotDisplayName(slot, names);
    return {
      id: String(slot),
      label: explicit ? `${slot}. ${explicit}` : `${slot}.`,
      title: explicit || "",
    };
  });
}

function getCurrentPromptTitleForMiniPanel() {
  const slot = getCurrentSlot();
  const direct = String(promptSlotTriggerName?.textContent || "").trim();
  if (direct) return direct;

  const fallback = getSlotDisplayName(slot);
  if (fallback) return fallback;

  return "";
}

function syncMiniPanelPromptApi() {
  const app = (window.__app = window.__app || {});
  app.getMiniPanelPromptOptionsRich = () => getPromptOptionsForMiniPanel();
  app.getSelectedPromptSlotRich = () => getCurrentSlot();
  app.getCurrentPromptSlotTitleRich = () => getCurrentPromptTitleForMiniPanel();
}

function getAvailableSlots() {
  if (!promptSlotSelect) return [];
  return Array.from(promptSlotSelect.options)
    .map((opt) => String(opt.value || "").trim())
    .filter(Boolean);
}

function getCurrentSlot() {
  return String(promptSlotSelect?.value || getAvailableSlots()[0] || "1");
}

function getCurrentProfileId() {
  const profileId = (typeof PromptManager.getPromptProfileId === "function")
    ? String(PromptManager.getPromptProfileId() || "").trim()
    : "";
  return profileId || "";
}

function getEffectiveProfileId() {
  return getCurrentProfileId() || "default";
}

function getSlotNames() {
  if (typeof PromptManager.getSlotNames === "function") {
    return PromptManager.getSlotNames(getCurrentProfileId());
  }
  return {};
}

function getSlotDisplayName(slot, names = getSlotNames()) {
  const key = String(slot || "").trim();
  if (!key) return "";
  const explicit = (names && typeof names === "object") ? String(names[key] || "").trim() : "";
  if (explicit) return explicit;
  if (typeof PromptManager.getSlotDisplayName === "function") {
    return String(PromptManager.getSlotDisplayName(key, getCurrentProfileId()) || "").trim();
  }
  return "";
}

function emitMiniHubPromptUiRefresh(reason, extra = {}) {
  try {
    window.dispatchEvent(new CustomEvent(MINI_HUB_UI_REFRESH_EVENT, {
      detail: {
        reason: String(reason || "prompt-ui").trim() || "prompt-ui",
        profileId: getEffectiveProfileId(),
        slot: getCurrentSlot(),
        ...extra,
      },
    }));
  } catch {}
}

function persistCurrentSelectedSlot() {
  const slot = getCurrentSlot();
  if (typeof PromptManager.setSelectedPromptSlot === "function") {
    PromptManager.setSelectedPromptSlot(slot, getCurrentProfileId());
  }
  return slot;
}

function restorePersistedSelectedSlot() {
  if (!promptSlotSelect) return;
  const allowed = new Set(getAvailableSlots());
  let persisted = "";

  if (typeof PromptManager.getSelectedPromptSlot === "function") {
    persisted = String(PromptManager.getSelectedPromptSlot(getCurrentProfileId()) || "").trim();
  }

  if (!persisted || !allowed.has(persisted)) return;
  promptSlotSelect.value = persisted;
}

function reloadCurrentPromptSlot() {
  if (!promptSlotSelect || !customPromptTextarea) return;
  if (typeof PromptManager.loadPrompt === "function") {
    PromptManager.loadPrompt(promptSlotSelect.value);
  }
}

function setCurrentSlotValue(slot, { reload = true, emitChange = true } = {}) {
  if (!promptSlotSelect) return;
  const next = String(slot || "").trim();
  if (!next) return;

  const allowed = new Set(getAvailableSlots());
  if (!allowed.has(next)) return;

  if (promptSlotSelect.value !== next) {
    promptSlotSelect.value = next;
  }

  persistCurrentSelectedSlot();

  if (reload) {
    reloadCurrentPromptSlot();
    syncNameInputForCurrentSlot();
    renderPromptSlotTrigger();
    renderPromptSlotPopover();
    syncMiniPanelPromptApi();
    emitMiniHubPromptUiRefresh("slot-value-set", { slot: next, reload: true });
  }

  if (emitChange) {
    promptSlotSelect.dispatchEvent(new Event("change", { bubbles: true }));
  }
}

function renderPromptSlotTrigger() {
  if (!promptSlotTrigger || !promptSlotTriggerSlot || !promptSlotTriggerName) return;
  const slot = getCurrentSlot();
  promptSlotTriggerSlot.textContent = `${slot}.`;

  const name = getSlotDisplayName(slot);
  if (name) {
    promptSlotTriggerName.textContent = name;
    promptSlotTrigger.title = `Slot ${slot}: ${name}`;
    syncMiniPanelPromptApi();
    return;
  }

  promptSlotTriggerName.textContent = "";
  promptSlotTrigger.title = `Slot ${slot}`;
  syncMiniPanelPromptApi();
}

function clearDragOverState() {
  if (!promptSlotList) return;
  promptSlotList.querySelectorAll(".prompt-slot-item.is-drag-over").forEach((el) => {
    el.classList.remove("is-drag-over");
  });
  promptSlotList.querySelectorAll(".prompt-slot-item.is-dragging").forEach((el) => {
    el.classList.remove("is-dragging");
  });
}

let dragIntentSlot = "";
let dragSourceSlot = "";

function buildPromptSlotItem(slot, names, activeSlot) {
  const isActive = String(slot) === String(activeSlot);
  const row = document.createElement("div");
  row.className = `prompt-slot-item${isActive ? " is-active" : ""}`;
  row.dataset.slot = String(slot);
  row.setAttribute("role", "option");
  row.setAttribute("aria-selected", isActive ? "true" : "false");
  row.draggable = true;

  const selectButton = document.createElement("button");
  selectButton.type = "button";
  selectButton.className = "prompt-slot-item-button";
  selectButton.dataset.slot = String(slot);
  selectButton.setAttribute("aria-label", `Select slot ${slot}`);

  const title = document.createElement("span");
  title.className = "prompt-slot-item-title";

  const badge = document.createElement("span");
  badge.className = "prompt-slot-badge";
  badge.textContent = `${slot}.`;

  const name = document.createElement("span");
  name.className = "prompt-slot-item-name";
  name.textContent = getSlotDisplayName(slot, names);

  title.appendChild(badge);
  title.appendChild(name);
  selectButton.appendChild(title);

  const dragHandle = document.createElement("button");
  dragHandle.type = "button";
  dragHandle.className = "prompt-slot-drag-handle";
  dragHandle.dataset.slot = String(slot);
  dragHandle.dataset.slotDragHandle = "true";
  dragHandle.setAttribute("aria-label", `Drag slot ${slot} to reorder`);
  dragHandle.title = "Drag to reorder";
  dragHandle.textContent = "⋮⋮";

  dragHandle.addEventListener("pointerdown", () => {
    dragIntentSlot = String(slot);
  });

  dragHandle.addEventListener("keydown", (e) => {
    if (e.key === " " || e.key === "Enter") {
      dragIntentSlot = String(slot);
    }
  });

  row.appendChild(selectButton);
  row.appendChild(dragHandle);

  selectButton.addEventListener("click", () => {
    setCurrentSlotValue(slot);
    closePromptSlotPopover();
    promptSlotTrigger?.focus();
  });

  row.addEventListener("dragstart", (e) => {
    if (dragIntentSlot !== String(slot)) {
      e.preventDefault();
      return;
    }
    dragSourceSlot = String(slot);
    row.classList.add("is-dragging");
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", String(slot));
    }
  });

  row.addEventListener("dragover", (e) => {
    if (!dragSourceSlot || dragSourceSlot === String(slot)) return;
    e.preventDefault();
    row.classList.add("is-drag-over");
  });

  row.addEventListener("dragleave", () => {
    row.classList.remove("is-drag-over");
  });

  row.addEventListener("drop", async (e) => {
    e.preventDefault();
    row.classList.remove("is-drag-over");

    const from = dragSourceSlot;
    const to = String(slot);
    dragSourceSlot = "";
    dragIntentSlot = "";
    clearDragOverState();

    if (!from || !to || from === to) return;

    try {
      let finalSlot = null;
      if (typeof PromptManager.reorderPromptSlots === "function") {
        finalSlot = PromptManager.reorderPromptSlots(from, to);
      }

      if (!finalSlot) {
        console.warn("Prompt slot reorder was not applied.");
        return;
      }

      const current = getCurrentSlot();
      if (String(current) === String(from)) {
        promptSlotSelect.value = String(finalSlot);
      } else if (String(current) === String(to)) {
        promptSlotSelect.value = String(from);
      }

      persistCurrentSelectedSlot();
      reloadCurrentPromptSlot();
      syncNameInputForCurrentSlot();
      renderPromptSlotTrigger();
      renderPromptSlotPopover();
      syncMiniPanelPromptApi();
    } catch (err) {
      console.warn("Prompt slot reorder failed:", err);
    }
  });

  row.addEventListener("dragend", () => {
    dragSourceSlot = "";
    dragIntentSlot = "";
    clearDragOverState();
  });

  return row;
}

function renderPromptSlotPopover() {
  if (!promptSlotList) return;
  const names = getSlotNames();
  const activeSlot = getCurrentSlot();

  promptSlotList.innerHTML = "";
  getAvailableSlots().forEach((slot) => {
    promptSlotList.appendChild(buildPromptSlotItem(slot, names, activeSlot));
  });
  syncMiniPanelPromptApi();
}

function updatePromptSlotPopoverPlacement() {
  if (!promptSlotPopover || !promptSlotTrigger || promptSlotPopover.hidden) return;

  promptSlotPopover.classList.remove("opens-up");

  const triggerRect = promptSlotTrigger.getBoundingClientRect();
  const popoverRect = promptSlotPopover.getBoundingClientRect();
  const margin = 12;
  const spaceBelow = window.innerHeight - triggerRect.bottom - margin;
  const spaceAbove = triggerRect.top - margin;
  const needsUpward = spaceBelow < popoverRect.height && spaceAbove > spaceBelow;

  promptSlotPopover.classList.toggle("opens-up", needsUpward);
}

function openPromptSlotPopover() {
  if (!promptSlotPopover || !promptSlotPicker || !promptSlotTrigger) return;
  renderPromptSlotPopover();
  renderPromptSlotTrigger();
  promptSlotPopover.hidden = false;
  promptSlotPicker.classList.add("is-open");
  promptSlotTrigger.setAttribute("aria-expanded", "true");
  updatePromptSlotPopoverPlacement();
}

function closePromptSlotPopover() {
  if (!promptSlotPopover || !promptSlotPicker || !promptSlotTrigger) return;
  promptSlotPopover.hidden = true;
  promptSlotPicker.classList.remove("is-open");
  promptSlotTrigger.setAttribute("aria-expanded", "false");
  clearDragOverState();
  dragIntentSlot = "";
  dragSourceSlot = "";
}

function togglePromptSlotPopover() {
  if (!promptSlotPopover) return;
  if (promptSlotPopover.hidden) openPromptSlotPopover();
  else closePromptSlotPopover();
}

function syncNameInputForCurrentSlot() {
  if (!promptSlotSelect || !promptSlotNameInput) return;
  const slot = String(promptSlotSelect.value || "");
  promptSlotNameInput.value = getSlotDisplayName(slot);
}

function renderPromptProfileLabel() {
  if (!promptProfileValue) return;
  const pid = getCurrentProfileId();
  promptProfileValue.textContent = pid ? pid : "(not set)";
}

function ensurePromptProfileId({ allowChange = false } = {}) {
  const existing = getCurrentProfileId();
  if (existing && !allowChange) return existing;

  const currentHint = existing ? `Current: ${existing}\n\n` : "";
  const entered = window.prompt(
    `${currentHint}Enter a prompt profile ID.\n\n` +
    `This lets you keep a separate set of custom prompts on this device.\n` +
    `Example: David1`,
    existing || ""
  );

  if (entered == null) return existing;

  const next = String(entered || "").trim();
  if (!next) {
    window.alert("Profile ID cannot be blank.");
    return existing;
  }

  const active = (typeof PromptManager.setPromptProfileId === "function")
    ? PromptManager.setPromptProfileId(next)
    : next;

  if (promptSlotSelect) {
    const restored = (typeof PromptManager.getSelectedPromptSlot === "function")
      ? String(PromptManager.getSelectedPromptSlot(active) || "").trim()
      : "";
    const allowed = new Set(getAvailableSlots());
    promptSlotSelect.value = (restored && allowed.has(restored)) ? restored : (getAvailableSlots()[0] || "1");
  }

  reloadCurrentPromptSlot();
  persistCurrentSelectedSlot();
  renderPromptProfileLabel();
  renderPromptSlotTrigger();
  renderPromptSlotPopover();
  syncNameInputForCurrentSlot();
  syncMiniPanelPromptApi();

  return active;
}

restorePersistedSelectedSlot();
renderPromptProfileLabel();
renderPromptSlotTrigger();
renderPromptSlotPopover();
syncNameInputForCurrentSlot();
closePromptSlotPopover();

if (promptSlotTrigger) {
  promptSlotTrigger.addEventListener("click", () => {
    togglePromptSlotPopover();
  });
}

document.addEventListener("pointerdown", (e) => {
  if (!promptSlotPicker || !promptSlotPopover || promptSlotPopover.hidden) return;
  if (promptSlotPicker.contains(e.target)) return;
  closePromptSlotPopover();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && promptSlotPopover && !promptSlotPopover.hidden) {
    closePromptSlotPopover();
    promptSlotTrigger?.focus();
  }
});

window.addEventListener("resize", () => {
  if (promptSlotPopover && !promptSlotPopover.hidden) {
    updatePromptSlotPopoverPlacement();
  }
});

window.addEventListener("scroll", () => {
  if (promptSlotPopover && !promptSlotPopover.hidden) {
    updatePromptSlotPopoverPlacement();
  }
}, true);

if (promptSlotSelect && customPromptTextarea) {
  let isLoadingPrompt = false;

  function loadCurrentSlot() {
    persistCurrentSelectedSlot();
    isLoadingPrompt = true;
    PromptManager.loadPrompt(promptSlotSelect.value);
    isLoadingPrompt = false;
    syncNameInputForCurrentSlot();
    renderPromptSlotTrigger();
    renderPromptSlotPopover();
    syncMiniPanelPromptApi();
  }

  loadCurrentSlot();

  customPromptTextarea.addEventListener("input", () => {
    if (isLoadingPrompt) return;
    const value = window.__getVisibleCustomPromptValue
      ? window.__getVisibleCustomPromptValue()
      : customPromptTextarea.value;
    PromptManager.savePrompt(promptSlotSelect.value, value);
    customPromptTextarea.style.height = "auto";
    customPromptTextarea.style.height = `${customPromptTextarea.scrollHeight}px`;
  });

  promptSlotSelect.addEventListener("change", loadCurrentSlot);
}

if (promptSlotNameInput && promptSlotSelect) {
  const commitName = () => {
    const slot = String(promptSlotSelect.value || "");
    const name = String(promptSlotNameInput.value || "").trim();
    if (typeof PromptManager.setSlotDisplayName === "function") {
      PromptManager.setSlotDisplayName(slot, name, getCurrentProfileId());
    }
    renderPromptSlotTrigger();
    renderPromptSlotPopover();
    syncMiniPanelPromptApi();
  };

  promptSlotNameInput.addEventListener("blur", commitName);
  promptSlotNameInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      promptSlotNameInput.blur();
    }
  });
}

if (clearPromptButton && promptSlotSelect && customPromptTextarea) {
  clearPromptButton.addEventListener("click", () => {
    customPromptTextarea.value = "";
    PromptManager.savePrompt(promptSlotSelect.value, "");
    customPromptTextarea.style.height = "auto";
    customPromptTextarea.style.height = `${customPromptTextarea.scrollHeight}px`;
  });
}

if (copyPromptButton && customPromptTextarea) {
  const originalLabel = copyPromptButton.textContent;
  copyPromptButton.addEventListener("click", async () => {
    const text = window.__getVisibleCustomPromptValue
      ? window.__getVisibleCustomPromptValue()
      : customPromptTextarea.value;

    try {
      await navigator.clipboard.writeText(text || "");
      copyPromptButton.textContent = "Copied";
      setTimeout(() => { copyPromptButton.textContent = originalLabel; }, 1200);
    } catch (err) {
      try {
        customPromptTextarea.focus();
        customPromptTextarea.select();
        document.execCommand("copy");
        copyPromptButton.textContent = "Copied";
        setTimeout(() => { copyPromptButton.textContent = originalLabel; }, 1200);
      } catch (_) {
        console.warn("Copy failed", err);
      } finally {
        try { window.getSelection()?.removeAllRanges?.(); } catch (_) {}
      }
    }
  });
}

if (promptProfileValue) {
  promptProfileValue.style.cursor = "pointer";
  promptProfileValue.title = "Click to set/change prompt profile";
  promptProfileValue.addEventListener("click", () => {
    ensurePromptProfileId({ allowChange: true });
  });
}

if (promptExportBtn) {
  promptExportBtn.addEventListener("click", () => {
    const pid = ensurePromptProfileId();
    if (!pid) return;
    if (typeof PromptManager.exportPromptsToFile === "function") {
      PromptManager.exportPromptsToFile();
    } else {
      console.warn("Export not implemented yet (PromptManager.exportPromptsToFile missing).");
    }
  });
}

if (promptImportBtn && promptImportFile) {
  promptImportBtn.addEventListener("click", () => {
    const pid = ensurePromptProfileId();
    if (!pid) return;
    promptImportFile.value = "";
    promptImportFile.click();
  });

  promptImportFile.addEventListener("change", async () => {
    const file = promptImportFile.files && promptImportFile.files[0];
    if (!file) return;
    if (typeof PromptManager.importPromptsFromFile === "function") {
      await PromptManager.importPromptsFromFile(file);
      reloadCurrentPromptSlot();
      renderPromptSlotTrigger();
      renderPromptSlotPopover();
      syncNameInputForCurrentSlot();
      syncMiniPanelPromptApi();
      emitMiniHubPromptUiRefresh("prompt-slots-imported", {
        imported: true,
      });
    } else {
      console.warn("Import not implemented yet (PromptManager.importPromptsFromFile missing).");
    }
  });
}

window.addEventListener("prompt-profile-changed", (event) => {
  const detail = event?.detail || {};
  const nextProfileId = String(detail.profileId || detail.effectiveProfileId || "").trim();
  const currentProfileId = getEffectiveProfileId();
  if (nextProfileId && nextProfileId !== currentProfileId) return;

  restorePersistedSelectedSlot();
  renderPromptProfileLabel();
  reloadCurrentPromptSlot();
  syncNameInputForCurrentSlot();
  renderPromptSlotTrigger();
  renderPromptSlotPopover();
  syncMiniPanelPromptApi();
  emitMiniHubPromptUiRefresh("prompt-profile-changed", {
    profileId: currentProfileId,
  });
});

window.addEventListener("prompt-slot-selection-changed", (event) => {
  if (!promptSlotSelect) return;
  const detail = event?.detail || {};
  const eventProfileId = String(detail.profileId || "").trim();
  if (eventProfileId && eventProfileId !== getEffectiveProfileId()) return;

  const slot = String(detail.slot || "").trim();
  const allowed = new Set(getAvailableSlots());
  if (!slot || !allowed.has(slot) || promptSlotSelect.value === slot) return;

  promptSlotSelect.value = slot;
  reloadCurrentPromptSlot();
  syncNameInputForCurrentSlot();
  renderPromptSlotTrigger();
  renderPromptSlotPopover();
  syncMiniPanelPromptApi();
  emitMiniHubPromptUiRefresh("prompt-slot-selection-changed", { slot });
});

window.addEventListener("prompt-slot-names-changed", (event) => {
  const detail = event?.detail || {};
  const eventProfileId = String(detail.profileId || "").trim();
  if (eventProfileId && eventProfileId !== getEffectiveProfileId()) return;

  syncNameInputForCurrentSlot();
  renderPromptSlotTrigger();
  renderPromptSlotPopover();
  syncMiniPanelPromptApi();
  emitMiniHubPromptUiRefresh("prompt-slot-names-changed");
});

window.addEventListener("prompt-slots-imported", (event) => {
  const detail = event?.detail || {};
  const eventProfileId = String(detail.profileId || "").trim();
  if (eventProfileId && eventProfileId !== getEffectiveProfileId()) return;

  reloadCurrentPromptSlot();
  syncNameInputForCurrentSlot();
  renderPromptSlotTrigger();
  renderPromptSlotPopover();
  syncMiniPanelPromptApi();
  emitMiniHubPromptUiRefresh("prompt-slots-imported");
});

window.addEventListener("prompt-slots-reordered", (event) => {
  const detail = event?.detail || {};
  const eventProfileId = String(detail.profileId || "").trim();
  if (eventProfileId && eventProfileId !== getEffectiveProfileId()) return;

  syncNameInputForCurrentSlot();
  renderPromptSlotTrigger();
  renderPromptSlotPopover();
  syncMiniPanelPromptApi();
  emitMiniHubPromptUiRefresh("prompt-slots-reordered");
});

syncMiniPanelPromptApi();
