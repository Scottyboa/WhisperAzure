const STORAGE_KEY = "note_history_v1";
const MAX_ENTRIES = 30;

const STRINGS = {
  en: {
    history: "History",
    clear: "Clear",
    helpLabel: "Note history help",
    tooltip:
      "Shows the 30 most recent generated notes in this tab. Select an item to view its transcript and note. History remains after refresh and is removed when the tab session ends.",
    empty: "No generated notes yet.",
    note: "Note",
    transcript: "Transcript",
    prompt: "Prompt",
    withoutPrompt: "No prompt",
    close: "Close",
    openEntry: "Open",
  },
  no: {
    history: "Historikk",
    clear: "Clear",
    helpLabel: "Hjelp for notathistorikk",
    tooltip:
      "Viser de 30 siste genererte notatene i denne fanen. Klikk på et element for å vise transkripsjonen og notatet. Historikken beholdes ved oppdatering av siden og slettes når faneøkten avsluttes.",
    empty: "Ingen genererte notater ennå.",
    note: "Notat",
    transcript: "Transkripsjon",
    prompt: "Prompt",
    withoutPrompt: "Uten prompt",
    close: "Lukk",
    openEntry: "Åpne",
  },
  sv: {
    history: "Historik",
    clear: "Rensa",
    helpLabel: "Hjälp för anteckningshistorik",
    tooltip:
      "Visar de 30 senast genererade anteckningarna i den här fliken. Välj ett objekt för att visa transkriptionen och anteckningen. Historiken finns kvar efter uppdatering och tas bort när fliksessionen avslutas.",
    empty: "Inga genererade anteckningar ännu.",
    note: "Anteckning",
    transcript: "Transkription",
    prompt: "Prompt",
    withoutPrompt: "Utan prompt",
    close: "Stäng",
    openEntry: "Öppna",
  },
  de: {
    history: "Verlauf",
    clear: "Leeren",
    helpLabel: "Hilfe zum Notizverlauf",
    tooltip:
      "Zeigt die 30 zuletzt erstellten Notizen in diesem Tab. Wählen Sie einen Eintrag, um Transkript und Notiz anzuzeigen. Der Verlauf bleibt nach dem Aktualisieren erhalten und wird am Ende der Tabsitzung entfernt.",
    empty: "Noch keine Notizen erstellt.",
    note: "Notiz",
    transcript: "Transkript",
    prompt: "Prompt",
    withoutPrompt: "Ohne Prompt",
    close: "Schließen",
    openEntry: "Öffnen",
  },
  fr: {
    history: "Historique",
    clear: "Effacer",
    helpLabel: "Aide sur l’historique des notes",
    tooltip:
      "Affiche les 30 dernières notes générées dans cet onglet. Sélectionnez un élément pour afficher la transcription et la note. L’historique persiste après actualisation et disparaît à la fin de la session de l’onglet.",
    empty: "Aucune note générée.",
    note: "Note",
    transcript: "Transcription",
    prompt: "Prompt",
    withoutPrompt: "Sans prompt",
    close: "Fermer",
    openEntry: "Ouvrir",
  },
  it: {
    history: "Cronologia",
    clear: "Cancella",
    helpLabel: "Guida alla cronologia delle note",
    tooltip:
      "Mostra le 30 note generate più di recente in questa scheda. Seleziona un elemento per visualizzare trascrizione e nota. La cronologia rimane dopo l’aggiornamento e viene rimossa al termine della sessione della scheda.",
    empty: "Nessuna nota generata.",
    note: "Nota",
    transcript: "Trascrizione",
    prompt: "Prompt",
    withoutPrompt: "Senza prompt",
    close: "Chiudi",
    openEntry: "Apri",
  },
};

const state = {
  entries: [],
  nextSequence: 1,
  pendingRun: null,
  activeEntryId: "",
  previousFocus: null,
  language: "en",
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
    note,
    promptSlot: String(raw.promptSlot || ""),
    promptLabel: String(raw.promptLabel || ""),
    usedPrompt: raw.usedPrompt !== false,
  };
}

function loadHistory() {
  let parsed = null;

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) parsed = JSON.parse(raw);
  } catch (_) {
    parsed = null;
  }

  const entries = Array.isArray(parsed?.entries)
    ? parsed.entries.map(normalizeStoredEntry).filter(Boolean).slice(0, MAX_ENTRIES)
    : [];

  const highestSequence = entries.reduce(
    (highest, entry) => Math.max(highest, entry.sequence),
    0
  );
  const storedNext = Number(parsed?.nextSequence);

  state.entries = entries;
  state.nextSequence =
    Number.isInteger(storedNext) && storedNext > highestSequence
      ? storedNext
      : highestSequence + 1;
}

function buildStoragePayload() {
  return JSON.stringify({
    version: 1,
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

  list.replaceChildren();
  empty.hidden = state.entries.length > 0;

  state.entries.forEach((entry) => {
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
  const entry = state.entries.find((item) => item.id === state.activeEntryId);
  if (!entry) {
    closeModal();
    return;
  }

  const title = byId("noteHistoryModalTitle");
  const transcript = byId("noteHistoryTranscript");
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
  if (note) {
    note.value = entry.note;
    note.scrollTop = 0;
  }
}

function openEntry(entryId) {
  const entry = state.entries.find((item) => item.id === entryId);
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

function clearHistory() {
  state.entries = [];
  state.nextSequence = 1;

  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch (_) {}

  closeModal();
  renderHistory();
}

function capturePendingRun() {
  const app = window.__app || {};
  const transcript = String(byId("transcription")?.value || "").trim();
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

  if (!note.trim() || !transcript) return;

  const createdAt = Date.now();
  const sequence = state.nextSequence;
  const entry = {
    id: createEntryId(sequence, createdAt),
    sequence,
    createdAt,
    transcript,
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
  const noteTitle = byId("noteHistoryNoteTitle");

  if (title) title.textContent = copy.history;
  if (clearButton) clearButton.textContent = copy.clear;
  if (help) help.setAttribute("aria-label", copy.helpLabel);
  if (tooltip) tooltip.textContent = copy.tooltip;
  if (empty) empty.textContent = copy.empty;
  if (close) close.setAttribute("aria-label", copy.close);
  if (transcriptTitle) transcriptTitle.textContent = copy.transcript;
  if (noteTitle) noteTitle.textContent = copy.note;

  renderHistory();
  syncModalContent();
}

function bindEvents() {
  byId("noteHistoryClearButton")?.addEventListener("click", clearHistory);
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
}

function init() {
  loadHistory();
  bindEvents();
  updateLanguage(
    byId("lang-select-transcribe")?.value ||
      localStorage.getItem("siteLanguage") ||
      "en"
  );
}

init();
