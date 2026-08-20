const STORAGE_KEY = "note_history_v1";
const COLLAPSED_STORAGE_KEY = "note_history_collapsed_v1";
const MAX_ENTRIES = 30;

const STRINGS = {
  en: {
    history: "History",
    clear: "Clear",
    helpLabel: "Note history help",
    tooltip:
      "Shows the 30 most recent generated notes in the active workspace. Select an item to view its transcript, supplementary information and note. Each workspace has its own history. History remains after refresh and is removed when the tab session ends.",
    empty: "No generated notes yet.",
    note: "Note",
    transcript: "Transcript",
    supplementary: "Supplementary Information",
    prompt: "Prompt",
    withoutPrompt: "No prompt",
    close: "Close",
    openEntry: "Open",
    collapse: "Collapse history column",
    expand: "Expand history column",
  },
  no: {
    history: "Historikk",
    clear: "Clear",
    helpLabel: "Hjelp for notathistorikk",
    tooltip:
      "Viser de 30 siste genererte notatene i aktivt Workspace. Klikk på et element for å vise transkripsjonen, supplerende informasjon og notatet. Hvert Workspace har sin egen historikk. Historikken beholdes ved oppdatering av siden og slettes når faneøkten avsluttes.",
    empty: "Ingen genererte notater ennå.",
    note: "Notat",
    transcript: "Transkripsjon",
    supplementary: "Supplerende informasjon",
    prompt: "Prompt",
    withoutPrompt: "Uten prompt",
    close: "Lukk",
    openEntry: "Åpne",
    collapse: "Minimer historikkolonnen",
    expand: "Åpne historikkolonnen",
  },
  sv: {
    history: "Historik",
    clear: "Rensa",
    helpLabel: "Hjälp för anteckningshistorik",
    tooltip:
      "Visar de 30 senast genererade anteckningarna i den aktiva arbetsytan. Välj ett objekt för att visa transkriptionen, kompletterande information och anteckningen. Varje arbetsyta har sin egen historik. Historiken finns kvar efter uppdatering och tas bort när fliksessionen avslutas.",
    empty: "Inga genererade anteckningar ännu.",
    note: "Anteckning",
    transcript: "Transkription",
    supplementary: "Kompletterande information",
    prompt: "Prompt",
    withoutPrompt: "Utan prompt",
    close: "Stäng",
    openEntry: "Öppna",
    collapse: "Minimera historikkolumnen",
    expand: "Öppna historikkolumnen",
  },
  de: {
    history: "Verlauf",
    clear: "Leeren",
    helpLabel: "Hilfe zum Notizverlauf",
    tooltip:
      "Zeigt die 30 zuletzt erstellten Notizen im aktiven Arbeitsbereich. Wählen Sie einen Eintrag, um Transkript, ergänzende Informationen und Notiz anzuzeigen. Jeder Arbeitsbereich hat einen eigenen Verlauf. Der Verlauf bleibt nach dem Aktualisieren erhalten und wird am Ende der Tabsitzung entfernt.",
    empty: "Noch keine Notizen erstellt.",
    note: "Notiz",
    transcript: "Transkript",
    supplementary: "Ergänzende Informationen",
    prompt: "Prompt",
    withoutPrompt: "Ohne Prompt",
    close: "Schließen",
    openEntry: "Öffnen",
    collapse: "Verlaufsspalte minimieren",
    expand: "Verlaufsspalte öffnen",
  },
  fr: {
    history: "Historique",
    clear: "Effacer",
    helpLabel: "Aide sur l’historique des notes",
    tooltip:
      "Affiche les 30 dernières notes générées dans l’espace de travail actif. Sélectionnez un élément pour afficher la transcription, les informations complémentaires et la note. Chaque espace de travail possède son propre historique. L’historique persiste après actualisation et disparaît à la fin de la session de l’onglet.",
    empty: "Aucune note générée.",
    note: "Note",
    transcript: "Transcription",
    supplementary: "Informations complémentaires",
    prompt: "Prompt",
    withoutPrompt: "Sans prompt",
    close: "Fermer",
    openEntry: "Ouvrir",
    collapse: "Réduire la colonne d’historique",
    expand: "Ouvrir la colonne d’historique",
  },
  it: {
    history: "Cronologia",
    clear: "Cancella",
    helpLabel: "Guida alla cronologia delle note",
    tooltip:
      "Mostra le 30 note generate più di recente nell’area di lavoro attiva. Seleziona un elemento per visualizzare trascrizione, informazioni supplementari e nota. Ogni area di lavoro ha una cronologia separata. La cronologia rimane dopo l’aggiornamento e viene rimossa al termine della sessione della scheda.",
    empty: "Nessuna nota generata.",
    note: "Nota",
    transcript: "Trascrizione",
    supplementary: "Informazioni supplementari",
    prompt: "Prompt",
    withoutPrompt: "Senza prompt",
    close: "Chiudi",
    openEntry: "Apri",
    collapse: "Riduci la colonna della cronologia",
    expand: "Apri la colonna della cronologia",
  },
};

const state = {
  entries: [],
  nextSequence: 1,
  pendingRun: null,
  activeEntryId: "",
  previousFocus: null,
  language: "en",
  collapsed: false,
};

function byId(id) {
  return document.getElementById(id);
}

function normalizeLanguage(value) {
  const language = String(value || "").trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(STRINGS, language) ? language : "en";
}

function strings() {
  return STRINGS[state.language] || STRINGS.en;
}

function createEntryId(sequence, createdAt) {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }
  return `note-${sequence}-${createdAt}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeStoredEntry(raw) {
  if (!raw || typeof raw !== "object") return null;

  const sequence = Number(raw.sequence);
  const createdAt = Number(raw.createdAt);
  const transcript = typeof raw.transcript === "string" ? raw.transcript : "";
  const supplementary =
    typeof raw.supplementary === "string" ? raw.supplementary : "";
  const note = typeof raw.note === "string" ? raw.note : "";

  if (
    !Number.isInteger(sequence) ||
    sequence < 1 ||
    !Number.isFinite(createdAt) ||
    createdAt < 1 ||
    !transcript.trim() ||
    !note.trim()
  ) {
    return null;
  }

  return {
    id: String(raw.id || `note-${sequence}-${createdAt}`),
    sequence,
    createdAt,
    transcript,
    supplementary,
    note,
    promptSlot: String(raw.promptSlot || ""),
    promptLabel: String(raw.promptLabel || ""),
    usedPrompt: raw.usedPrompt !== false,
  };
}

function normalizeHistorySnapshot(raw) {
  const entries = Array.isArray(raw?.entries)
    ? raw.entries.map(normalizeStoredEntry).filter(Boolean).slice(0, MAX_ENTRIES)
    : [];
  const highestSequence = entries.reduce(
    (highest, entry) => Math.max(highest, entry.sequence),
    0
  );
  const storedNext = Number(raw?.nextSequence);
  const nextSequence =
    Number.isInteger(storedNext) && storedNext > highestSequence
      ? storedNext
      : highestSequence + 1;

  return { entries, nextSequence };
}

function loadHistory() {
  let parsed = null;

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) parsed = JSON.parse(raw);
  } catch (_) {
    parsed = null;
  }

  const snapshot = normalizeHistorySnapshot(parsed);
  state.entries = snapshot.entries;
  state.nextSequence = snapshot.nextSequence;
}

function loadCollapsedState() {
  try {
    state.collapsed = sessionStorage.getItem(COLLAPSED_STORAGE_KEY) === "1";
  } catch (_) {
    state.collapsed = false;
  }
}

function persistCollapsedState() {
  try {
    sessionStorage.setItem(COLLAPSED_STORAGE_KEY, state.collapsed ? "1" : "0");
  } catch (_) {}
}

function syncCollapsedState() {
  const grid = document.querySelector(".grid-container");
  const sidebar = byId("noteHistorySidebar");
  const button = byId("noteHistoryCollapseButton");
  const copy = strings();

  grid?.classList.toggle("history-collapsed", state.collapsed);
  sidebar?.classList.toggle("is-collapsed", state.collapsed);

  if (button) {
    const label = state.collapsed ? copy.expand : copy.collapse;
    button.textContent = state.collapsed ? "›" : "‹";
    button.setAttribute("aria-expanded", state.collapsed ? "false" : "true");
    button.setAttribute("aria-label", label);
    button.title = label;
  }
}

function toggleCollapsedState() {
  state.collapsed = !state.collapsed;
  persistCollapsedState();
  syncCollapsedState();
}

function buildStoragePayload() {
  return JSON.stringify({
    version: 2,
    nextSequence: state.nextSequence,
    entries: state.entries,
  });
}

function persistHistory() {
  while (true) {
    try {
      sessionStorage.setItem(STORAGE_KEY, buildStoragePayload());
      return true;
    } catch (error) {
      if (!state.entries.length) {
        console.warn("[note-history] session storage is unavailable.");
        return false;
      }

      // Preserve the newest entries if this browser's session quota is unusually small.
      state.entries.pop();
    }
  }
}

function getLocalHistorySnapshot() {
  return {
    entries: state.entries.map((entry) => ({ ...entry })),
    nextSequence: state.nextSequence,
  };
}

function notifyLocalHistoryUpdated(reason = "updated") {
  try {
    window.dispatchEvent(
      new CustomEvent("note-history-updated", {
        detail: {
          reason,
          runtimeId: String(window.__workspacePresetRuntimeId || "primary"),
          count: state.entries.length,
        },
      })
    );
  } catch (_) {}
}

function replaceLocalHistorySnapshot(snapshot, { notify = true } = {}) {
  const normalized = normalizeHistorySnapshot(snapshot);
  state.entries = normalized.entries;
  state.nextSequence = normalized.nextSequence;
  state.pendingRun = null;

  try {
    if (state.entries.length) {
      persistHistory();
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  } catch (_) {}

  closeModal();
  renderHistory();
  if (notify) notifyLocalHistoryUpdated("replaced");
  return true;
}

function clearLocalHistory({ notify = true } = {}) {
  state.entries = [];
  state.nextSequence = 1;
  state.pendingRun = null;

  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch (_) {}

  closeModal();
  renderHistory();
  if (notify) notifyLocalHistoryUpdated("cleared");
  return true;
}

function getVisibleHistorySnapshot() {
  if (!window.__workspacePresetFrame) {
    try {
      const snapshot = window.__workspacePresets?.getHistorySnapshot?.();
      if (snapshot && Array.isArray(snapshot.entries)) {
        return normalizeHistorySnapshot(snapshot);
      }
    } catch (_) {}
  }
  return getLocalHistorySnapshot();
}

function getVisibleEntries() {
  return getVisibleHistorySnapshot().entries;
}

function findVisibleEntry(entryId) {
  return getVisibleEntries().find((item) => item.id === entryId) || null;
}

function getEntryPromptLabel(entry) {
  const copy = strings();
  if (entry.usedPrompt === false) return copy.withoutPrompt;
  if (entry.promptLabel) return entry.promptLabel;
  if (entry.promptSlot) return `${copy.prompt} ${entry.promptSlot}`;
  return copy.prompt;
}

function formatEntryTime(createdAt) {
  try {
    return new Intl.DateTimeFormat(state.language, {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(createdAt));
  } catch (_) {
    const date = new Date(createdAt);
    return `${String(date.getHours()).padStart(2, "0")}:${String(
      date.getMinutes()
    ).padStart(2, "0")}`;
  }
}

function formatEntryDateTime(createdAt) {
  try {
    return new Intl.DateTimeFormat(state.language, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(createdAt));
  } catch (_) {
    return new Date(createdAt).toLocaleString();
  }
}

function getEntryTitle(entry) {
  return `${strings().note} ${entry.sequence}`;
}

function getEntryMeta(entry) {
  return `${formatEntryTime(entry.createdAt)} · ${getEntryPromptLabel(entry)}`;
}

function renderHistory() {
  const list = byId("noteHistoryList");
  const empty = byId("noteHistoryEmpty");
  if (!list || !empty) return;
  const entries = getVisibleEntries();

  list.replaceChildren();
  empty.hidden = entries.length > 0;

  entries.forEach((entry) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "note-history-card";
    card.dataset.entryId = entry.id;

    const title = document.createElement("span");
    title.className = "note-history-card-title";
    title.textContent = getEntryTitle(entry);

    const meta = document.createElement("span");
    meta.className = "note-history-card-meta";
    meta.textContent = getEntryMeta(entry);

    const fullLabel = `${strings().openEntry} ${getEntryTitle(entry)}, ${formatEntryDateTime(
      entry.createdAt
    )}, ${getEntryPromptLabel(entry)}`;
    card.setAttribute("aria-label", fullLabel);
    card.title = `${getEntryTitle(entry)} · ${formatEntryDateTime(
      entry.createdAt
    )} · ${getEntryPromptLabel(entry)}`;

    card.append(title, meta);
    card.addEventListener("click", () => openEntry(entry.id));
    list.appendChild(card);
  });
}

function syncModalContent() {
  if (!state.activeEntryId) return;
  const entry = findVisibleEntry(state.activeEntryId);
  if (!entry) {
    closeModal();
    return;
  }

  const title = byId("noteHistoryModalTitle");
  const transcript = byId("noteHistoryTranscript");
  const supplementary = byId("noteHistorySupplementary");
  const note = byId("noteHistoryNote");

  if (title) {
    title.textContent = `${getEntryTitle(entry)} · ${formatEntryDateTime(
      entry.createdAt
    )} · ${getEntryPromptLabel(entry)}`;
  }
  if (transcript) {
    transcript.value = entry.transcript;
    transcript.scrollTop = 0;
  }
  if (supplementary) {
    supplementary.value = entry.supplementary || "";
    supplementary.scrollTop = 0;
  }
  if (note) {
    note.value = entry.note;
    note.scrollTop = 0;
  }
}

function openEntry(entryId) {
  const entry = findVisibleEntry(entryId);
  const modal = byId("noteHistoryModal");
  if (!entry || !modal) return;

  state.activeEntryId = entry.id;
  state.previousFocus = document.activeElement;
  syncModalContent();

  modal.classList.add("active");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("note-history-modal-open");
  byId("noteHistoryModalClose")?.focus();
}

function closeModal() {
  const modal = byId("noteHistoryModal");
  if (!modal || !modal.classList.contains("active")) {
    state.activeEntryId = "";
    return;
  }

  modal.classList.remove("active");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("note-history-modal-open");
  state.activeEntryId = "";

  const previousFocus = state.previousFocus;
  state.previousFocus = null;
  if (previousFocus && typeof previousFocus.focus === "function" && previousFocus.isConnected) {
    previousFocus.focus();
  }
}

function clearVisibleHistory() {
  if (!window.__workspacePresetFrame) {
    try {
      if (window.__workspacePresets?.clearHistory?.() === true) {
        closeModal();
        renderHistory();
        return true;
      }
    } catch (_) {}
  }
  return clearLocalHistory();
}

function capturePendingRun() {
  const app = window.__app || {};
  const transcript = String(byId("transcription")?.value || "").trim();
  const supplementary = String(byId("supplementaryInfo")?.value || "").trim();
  const promptSlot =
    typeof app.getSelectedPromptSlot === "function"
      ? String(app.getSelectedPromptSlot() || "").trim()
      : String(byId("promptSlot")?.value || "").trim();
  const promptLabel =
    typeof app.getCurrentPromptSlotTitle === "function"
      ? String(app.getCurrentPromptSlotTitle() || "").trim()
      : String(byId("promptSlotName")?.value || "").trim();
  const usedPrompt =
    typeof app.getUsePromptEnabled === "function"
      ? Boolean(app.getUsePromptEnabled())
      : Boolean(byId("includePromptToggle")?.checked);

  state.pendingRun = {
    transcript,
    supplementary,
    promptSlot,
    promptLabel,
    usedPrompt,
  };
}

function addFinishedNote(detail) {
  if (detail?.status === "aborted") return;

  const note = String(detail?.text ?? byId("generatedNote")?.value ?? "");
  const transcript = String(
    state.pendingRun?.transcript ?? byId("transcription")?.value ?? ""
  ).trim();
  const supplementary = String(
    state.pendingRun?.supplementary ?? byId("supplementaryInfo")?.value ?? ""
  ).trim();

  if (!note.trim() || !transcript) return;

  const createdAt = Date.now();
  const sequence = state.nextSequence;
  const entry = {
    id: createEntryId(sequence, createdAt),
    sequence,
    createdAt,
    transcript,
    supplementary,
    note,
    promptSlot: String(state.pendingRun?.promptSlot || ""),
    promptLabel: String(state.pendingRun?.promptLabel || ""),
    usedPrompt: state.pendingRun?.usedPrompt !== false,
  };

  state.nextSequence += 1;
  state.entries.unshift(entry);
  state.entries = state.entries.slice(0, MAX_ENTRIES);
  persistHistory();
  renderHistory();
  notifyLocalHistoryUpdated("entry-added");
}

function updateLanguage(language) {
  state.language = normalizeLanguage(language);
  const copy = strings();

  const title = byId("noteHistoryTitle");
  const clearButton = byId("noteHistoryClearButton");
  const help = byId("noteHistoryHelp");
  const tooltip = byId("noteHistoryTooltip");
  const empty = byId("noteHistoryEmpty");
  const close = byId("noteHistoryModalClose");
  const transcriptTitle = byId("noteHistoryTranscriptTitle");
  const supplementaryTitle = byId("noteHistorySupplementaryTitle");
  const noteTitle = byId("noteHistoryNoteTitle");

  if (title) title.textContent = copy.history;
  if (clearButton) clearButton.textContent = copy.clear;
  if (help) help.setAttribute("aria-label", copy.helpLabel);
  if (tooltip) tooltip.textContent = copy.tooltip;
  if (empty) empty.textContent = copy.empty;
  if (close) close.setAttribute("aria-label", copy.close);
  if (transcriptTitle) transcriptTitle.textContent = copy.transcript;
  if (supplementaryTitle) supplementaryTitle.textContent = copy.supplementary;
  if (noteTitle) noteTitle.textContent = copy.note;

  renderHistory();
  syncModalContent();
  syncCollapsedState();
}

function bindEvents() {
  byId("noteHistoryCollapseButton")?.addEventListener("click", toggleCollapsedState);
  byId("noteHistoryClearButton")?.addEventListener("click", clearVisibleHistory);
  byId("noteHistoryModalClose")?.addEventListener("click", closeModal);

  byId("noteHistoryModal")?.addEventListener("click", (event) => {
    if (event.target === event.currentTarget) closeModal();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && byId("noteHistoryModal")?.classList.contains("active")) {
      event.preventDefault();
      closeModal();
    }
  });

  window.addEventListener("app:state-changed", (event) => {
    const reason = String(event?.detail?.reason || "").trim();
    if (reason === "note-generation-begin") {
      capturePendingRun();
    } else if (reason === "note-generation-finish" || reason === "note-generation-reset") {
      state.pendingRun = null;
    }
  });

  // main.js emits both note-generation-finished and note:finished for the
  // same run. Listen to only one of them so every generated note is stored once.
  window.addEventListener("note-generation-finished", (event) => {
    addFinishedNote(event?.detail || {});
  });

  window.addEventListener("transcribe-language-updated", (event) => {
    updateLanguage(event?.detail?.lang || byId("lang-select-transcribe")?.value);
  });

  window.addEventListener("workspace-history-view-changed", () => {
    closeModal();
    renderHistory();
  });

  window.addEventListener("workspace-history-updated", () => {
    renderHistory();
    syncModalContent();
  });
}

function init() {
  loadHistory();
  loadCollapsedState();
  bindEvents();
  updateLanguage(
    byId("lang-select-transcribe")?.value ||
      localStorage.getItem("siteLanguage") ||
      "en"
  );
}

window.__noteHistory = Object.freeze({
  getSnapshot: getLocalHistorySnapshot,
  clearLocal: clearLocalHistory,
  replaceLocal: replaceLocalHistorySnapshot,
});

init();
