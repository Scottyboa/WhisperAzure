import { registerWorkspaceDisposer } from '../core/workspace-disposal.js';
import { analyzeTextForCounter } from '../core/text-performance.js';

const STORAGE_KEY = "note_history_v1";
const COLLAPSED_STORAGE_KEY = "note_history_collapsed_v1";
const MAX_ENTRIES = 30;
// Norges Bank indicative middle rate for 29 September 2026, rounded for a
// lightweight display-only estimate. USD remains the stored source amount.
const USD_TO_NOK_ESTIMATE = 9.58;

const STRINGS = {
  en: {
    history: "History",
    clear: "Clear",
    helpLabel: "Note history help",
    tooltip:
      "Shows the 30 most recent generated notes and manually saved transcripts in the active workspace. Select an item to view its contents. Cloned workspaces share history with their clone family; other workspaces have separate history. History remains after refresh and is removed when the tab session ends.",
    empty: "No history entries yet.",
    note: "Note",
    transcript: "Transcript",
    supplementary: "Supplementary Information",
    duration: "Duration",
    word: "word",
    words: "words",
    estimatedCost: "Est. cost",
    transcriptOnly: "Transcript only",
    addToLog: "Add to log",
    addToLogHelp:
      "Saves the current Transcript as a new history entry. Supplementary Information and Note are left empty.",
    addedToLog: "Added",
    prompt: "Prompt",
    withoutPrompt: "No prompt",
    close: "Close",
    openEntry: "Open",
    collapse: "Collapse history column",
    expand: "Expand history column",
    restore: "Restore to Workspace",
    replaceCurrent: "Replace current workspace",
    openNew: "Open in new workspace",
    confirmReplace:
      "Replace the Transcript, Supplementary Information and Note in the current workspace? Existing text in these fields will be overwritten.",
    restoreBusy:
      "Stop or cancel the active recording, transcription or note generation before replacing text in this workspace.",
    restoreMax: "You can have up to 12 open Workspaces.",
    restoreFailed: "The history entry could not be restored.",
  },
  no: {
    history: "Historikk",
    clear: "Clear",
    helpLabel: "Hjelp for notathistorikk",
    tooltip:
      "Viser de 30 siste genererte notatene og manuelt lagrede transkripsjonene i aktivt Workspace. Klikk på et element for å vise innholdet. Klonede Workspaces deler historikk med klonefamilien; andre Workspaces har separat historikk. Historikken beholdes ved oppdatering av siden og slettes når faneøkten avsluttes.",
    empty: "Ingen historikkinnlegg ennå.",
    note: "Notat",
    transcript: "Transkripsjon",
    supplementary: "Supplerende informasjon",
    duration: "Varighet",
    word: "ord",
    words: "ord",
    estimatedCost: "Est. kostnad",
    nokEstimateHelp: "NOK-estimat med 1 USD ≈ 9,58 NOK.",
    transcriptOnly: "Kun transkripsjon",
    addToLog: "Legg til i logg",
    addToLogHelp:
      "Lagrer innholdet i Transkripsjon som et nytt historikkinnlegg. Supplerende informasjon og Notat forblir tomme.",
    addedToLog: "Lagt til",
    prompt: "Prompt",
    withoutPrompt: "Uten prompt",
    close: "Lukk",
    openEntry: "Åpne",
    collapse: "Minimer historikkolonnen",
    expand: "Åpne historikkolonnen",
    restore: "Gjenopprett i Workspace",
    replaceCurrent: "Erstatt innhold i aktivt Workspace",
    openNew: "Åpne i nytt Workspace",
    confirmReplace:
      "Erstatt transkripsjon, supplerende informasjon og notat i aktivt Workspace? Eksisterende tekst i disse feltene blir overskrevet.",
    restoreBusy:
      "Stopp eller avbryt aktivt opptak, transkribering eller notatgenerering før teksten i dette Workspace-et erstattes.",
    restoreMax: "Du kan ha opptil 12 åpne Workspaces.",
    restoreFailed: "Historikkinnlegget kunne ikke gjenopprettes.",
  },
  sv: {
    history: "Historik",
    clear: "Rensa",
    helpLabel: "Hjälp för anteckningshistorik",
    tooltip:
      "Visar de 30 senast genererade anteckningarna och manuellt sparade transkriptionerna i den aktiva arbetsytan. Välj ett objekt för att visa innehållet. Klonade arbetsytor delar historik med sin klonfamilj; andra arbetsytor har separat historik. Historiken finns kvar efter uppdatering och tas bort när fliksessionen avslutas.",
    empty: "Inga historikposter ännu.",
    note: "Anteckning",
    transcript: "Transkription",
    supplementary: "Kompletterande information",
    duration: "Längd",
    word: "ord",
    words: "ord",
    estimatedCost: "Uppsk. kostnad",
    transcriptOnly: "Endast transkription",
    addToLog: "Lägg till i logg",
    addToLogHelp:
      "Sparar innehållet i Transkription som en ny historikpost. Kompletterande information och Anteckning lämnas tomma.",
    addedToLog: "Tillagd",
    prompt: "Prompt",
    withoutPrompt: "Utan prompt",
    close: "Stäng",
    openEntry: "Öppna",
    collapse: "Minimera historikkolumnen",
    expand: "Öppna historikkolumnen",
    restore: "Återställ till arbetsyta",
    replaceCurrent: "Ersätt innehållet i aktuell arbetsyta",
    openNew: "Öppna i ny arbetsyta",
    confirmReplace:
      "Ersätt transkriptionen, den kompletterande informationen och anteckningen i den aktuella arbetsytan? Befintlig text i dessa fält skrivs över.",
    restoreBusy:
      "Stoppa eller avbryt aktiv inspelning, transkribering eller anteckningsgenerering innan texten i den här arbetsytan ersätts.",
    restoreMax: "Du kan ha upp till 12 öppna arbetsytor.",
    restoreFailed: "Historikposten kunde inte återställas.",
  },
  de: {
    history: "Verlauf",
    clear: "Leeren",
    helpLabel: "Hilfe zum Notizverlauf",
    tooltip:
      "Zeigt die 30 zuletzt erstellten Notizen und manuell gespeicherten Transkripte im aktiven Arbeitsbereich. Wählen Sie einen Eintrag, um seinen Inhalt anzuzeigen. Geklonte Arbeitsbereiche teilen den Verlauf mit ihrer Klonfamilie; andere Arbeitsbereiche haben einen separaten Verlauf. Der Verlauf bleibt nach dem Aktualisieren erhalten und wird am Ende der Tabsitzung entfernt.",
    empty: "Noch keine Verlaufseinträge.",
    note: "Notiz",
    transcript: "Transkript",
    supplementary: "Ergänzende Informationen",
    duration: "Dauer",
    word: "Wort",
    words: "Wörter",
    estimatedCost: "Geschätzte Kosten",
    transcriptOnly: "Nur Transkript",
    addToLog: "Zum Verlauf",
    addToLogHelp:
      "Speichert den aktuellen Transkriptinhalt als neuen Verlaufseintrag. Ergänzende Informationen und Notiz bleiben leer.",
    addedToLog: "Hinzugefügt",
    prompt: "Prompt",
    withoutPrompt: "Ohne Prompt",
    close: "Schließen",
    openEntry: "Öffnen",
    collapse: "Verlaufsspalte minimieren",
    expand: "Verlaufsspalte öffnen",
    restore: "Im Arbeitsbereich wiederherstellen",
    replaceCurrent: "Aktuellen Arbeitsbereich ersetzen",
    openNew: "In neuem Arbeitsbereich öffnen",
    confirmReplace:
      "Transkript, ergänzende Informationen und Notiz im aktuellen Arbeitsbereich ersetzen? Der vorhandene Text in diesen Feldern wird überschrieben.",
    restoreBusy:
      "Beenden oder brechen Sie die aktive Aufnahme, Transkription oder Notizerstellung ab, bevor Sie den Text in diesem Arbeitsbereich ersetzen.",
    restoreMax: "Sie können bis zu 12 Arbeitsbereiche öffnen.",
    restoreFailed: "Der Verlaufseintrag konnte nicht wiederhergestellt werden.",
  },
  fr: {
    history: "Historique",
    clear: "Effacer",
    helpLabel: "Aide sur l’historique des notes",
    tooltip:
      "Affiche les 30 dernières notes générées et transcriptions enregistrées manuellement dans l’espace de travail actif. Sélectionnez un élément pour afficher son contenu. Les espaces de travail clonés partagent l’historique de leur famille de clones ; les autres ont un historique distinct. L’historique persiste après actualisation et disparaît à la fin de la session de l’onglet.",
    empty: "Aucune entrée dans l’historique.",
    note: "Note",
    transcript: "Transcription",
    supplementary: "Informations complémentaires",
    duration: "Durée",
    word: "mot",
    words: "mots",
    estimatedCost: "Coût estimé",
    transcriptOnly: "Transcription uniquement",
    addToLog: "Ajouter au journal",
    addToLogHelp:
      "Enregistre la transcription actuelle comme une nouvelle entrée d’historique. Les informations complémentaires et la note restent vides.",
    addedToLog: "Ajouté",
    prompt: "Prompt",
    withoutPrompt: "Sans prompt",
    close: "Fermer",
    openEntry: "Ouvrir",
    collapse: "Réduire la colonne d’historique",
    expand: "Ouvrir la colonne d’historique",
    restore: "Restaurer dans l’espace de travail",
    replaceCurrent: "Remplacer l’espace de travail actuel",
    openNew: "Ouvrir dans un nouvel espace de travail",
    confirmReplace:
      "Remplacer la transcription, les informations complémentaires et la note dans l’espace de travail actuel ? Le texte existant dans ces champs sera écrasé.",
    restoreBusy:
      "Arrêtez ou annulez l’enregistrement, la transcription ou la génération de note en cours avant de remplacer le texte de cet espace de travail.",
    restoreMax: "Vous pouvez ouvrir jusqu’à 12 espaces de travail.",
    restoreFailed: "L’entrée d’historique n’a pas pu être restaurée.",
  },
  it: {
    history: "Cronologia",
    clear: "Cancella",
    helpLabel: "Guida alla cronologia delle note",
    tooltip:
      "Mostra le 30 note generate e trascrizioni salvate manualmente più recenti nell’area di lavoro attiva. Seleziona un elemento per visualizzarne il contenuto. Le aree di lavoro clonate condividono la cronologia della loro famiglia di cloni; le altre hanno una cronologia separata. La cronologia rimane dopo l’aggiornamento e viene rimossa al termine della sessione della scheda.",
    empty: "Nessuna voce nella cronologia.",
    note: "Nota",
    transcript: "Trascrizione",
    supplementary: "Informazioni supplementari",
    duration: "Durata",
    word: "parola",
    words: "parole",
    estimatedCost: "Costo stimato",
    transcriptOnly: "Solo trascrizione",
    addToLog: "Aggiungi al registro",
    addToLogHelp:
      "Salva la trascrizione corrente come una nuova voce della cronologia. Le informazioni supplementari e la nota restano vuote.",
    addedToLog: "Aggiunto",
    prompt: "Prompt",
    withoutPrompt: "Senza prompt",
    close: "Chiudi",
    openEntry: "Apri",
    collapse: "Riduci la colonna della cronologia",
    expand: "Apri la colonna della cronologia",
    restore: "Ripristina nell’area di lavoro",
    replaceCurrent: "Sostituisci l’area di lavoro corrente",
    openNew: "Apri in una nuova area di lavoro",
    confirmReplace:
      "Sostituire trascrizione, informazioni supplementari e nota nell’area di lavoro corrente? Il testo esistente in questi campi verrà sovrascritto.",
    restoreBusy:
      "Interrompi o annulla la registrazione, la trascrizione o la generazione della nota prima di sostituire il testo in quest’area di lavoro.",
    restoreMax: "Puoi avere fino a 12 aree di lavoro aperte.",
    restoreFailed: "Non è stato possibile ripristinare la voce della cronologia.",
  },
};

let historyRecord = { entries: [], nextSequence: 1 };
let persistSharedHistory = null;
let loadSharedHistoryEntry = null;
let addToLogFeedbackTimer = 0;
const state = {
  get entries() { return historyRecord.entries; },
  set entries(value) { historyRecord.entries = value; },
  get nextSequence() { return historyRecord.nextSequence; },
  set nextSequence(value) { historyRecord.nextSequence = value; },
  pendingRun: null,
  activeEntryId: "",
  activeEntryBody: null,
  currentRecordingDurationMs: null,
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

function normalizeRecordingDurationMs(value) {
  if (value === null || value === undefined || value === "") return null;
  const duration = Number(value);
  return Number.isFinite(duration) && duration > 0 ? Math.round(duration) : null;
}

function normalizeNoteCostUsd(value) {
  if (value === null || value === undefined || value === "") return null;
  const cost = Number(value);
  return Number.isFinite(cost) && cost >= 0 ? cost : null;
}

function copyEntryMetrics(entry, raw) {
  const recordingDurationMs = normalizeRecordingDurationMs(raw?.recordingDurationMs);
  const noteCostUsd = normalizeNoteCostUsd(raw?.noteCostUsd);
  if (recordingDurationMs != null) entry.recordingDurationMs = recordingDurationMs;
  if (noteCostUsd != null) entry.noteCostUsd = noteCostUsd;
  return entry;
}

function normalizeStoredEntry(raw) {
  if (!raw || typeof raw !== "object") return null;

  const sequence = Number(raw.sequence);
  const createdAt = Number(raw.createdAt);
  if (
    !Number.isInteger(sequence) ||
    sequence < 1 ||
    !Number.isFinite(createdAt) ||
    createdAt < 1
  ) {
    return null;
  }

  const entry = copyEntryMetrics({
    id: String(raw.id || `note-${sequence}-${createdAt}`),
    sequence,
    createdAt,
    kind: raw.kind === "transcript" ? "transcript" : "note",
    promptSlot: String(raw.promptSlot || ""),
    promptLabel: String(raw.promptLabel || ""),
    usedPrompt: raw.usedPrompt !== false,
  }, raw);

  // The current session-only format keeps the complete entry together. Retain
  // this conditional so older metadata-only snapshots still fail safely.
  if (typeof raw.transcript === "string" && typeof raw.note === "string") {
    if (!raw.transcript.trim()) return null;
    entry.transcript = raw.transcript;
    entry.supplementary =
      typeof raw.supplementary === "string" ? raw.supplementary : "";
    entry.note = raw.note;
  }

  return entry;
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
  if (persistSharedHistory) return persistSharedHistory();
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

function replaceLocalHistorySnapshot(
  snapshot,
  { notify = true, preservePendingRun = false, preserveView = false } = {}
) {
  const normalized = normalizeHistorySnapshot(snapshot);
  state.entries = normalized.entries;
  state.nextSequence = normalized.nextSequence;
  if (!preservePendingRun) state.pendingRun = null;

  try {
    if (persistSharedHistory || state.entries.length) {
      persistHistory();
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  } catch (_) {}

  renderHistory();
  if (preserveView) syncModalContent();
  else closeModal();
  if (notify) notifyLocalHistoryUpdated("replaced");
  return true;
}

function clearLocalHistory({ notify = true } = {}) {
  state.entries = [];
  state.nextSequence = 1;
  state.pendingRun = null;

  try {
    if (persistSharedHistory) persistHistory();
    else sessionStorage.removeItem(STORAGE_KEY);
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

function hasEntryBody(entry) {
  return typeof entry?.transcript === "string" &&
    typeof entry?.note === "string" &&
    Boolean(entry.transcript.trim());
}

async function resolveVisibleEntry(entryId) {
  const entry = findVisibleEntry(entryId);
  if (!entry) return null;
  if (hasEntryBody(entry)) return entry;
  if (typeof loadSharedHistoryEntry !== "function") return null;

  try {
    const loaded = await loadSharedHistoryEntry(entry.id);
    return loaded && hasEntryBody(loaded) ? { ...entry, ...loaded } : null;
  } catch (error) {
    console.warn("[note-history] History entry could not be loaded.", error);
    return null;
  }
}

function getEntryPromptLabel(entry) {
  const copy = strings();
  if (entry.kind === "transcript") return copy.transcriptOnly;
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

function getIntlLocale() {
  return {
    en: "en-US",
    no: "nb-NO",
    sv: "sv-SE",
    de: "de-DE",
    fr: "fr-FR",
    it: "it-IT",
  }[state.language] || "en-US";
}

function formatWordCount(value) {
  const count = analyzeTextForCounter(value).words;
  const label = count === 1 ? strings().word : strings().words;
  try {
    return `${new Intl.NumberFormat(getIntlLocale(), { maximumFractionDigits: 0 }).format(count)} ${label}`;
  } catch (_) {
    return `${count} ${label}`;
  }
}

function formatRecordingDuration(durationMs) {
  const normalized = normalizeRecordingDurationMs(durationMs);
  if (normalized == null) return "";
  const totalSeconds = Math.floor(normalized / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
    : `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function formatUsdCost(value) {
  const amount = normalizeNoteCostUsd(value);
  if (amount == null) return "";
  const digits = Math.abs(amount) > 1 ? 2 : Math.abs(amount) > 0.1 ? 3 : 6;
  return `$${amount.toFixed(digits)}`;
}

function formatNokEstimate(value) {
  const amount = normalizeNoteCostUsd(value);
  if (amount == null) return "";
  const nok = amount * USD_TO_NOK_ESTIMATE;
  const abs = Math.abs(nok);
  const digits = abs > 1 ? 2 : abs > 0.1 ? 3 : abs > 0.01 ? 4 : 6;
  try {
    return `${new Intl.NumberFormat("nb-NO", {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(nok)} NOK`;
  } catch (_) {
    return `${nok.toFixed(digits).replace(".", ",")} NOK`;
  }
}

function syncModalEntryMetrics(entry) {
  const transcriptMeta = byId("noteHistoryTranscriptMeta");
  const supplementaryMeta = byId("noteHistorySupplementaryMeta");
  const noteMeta = byId("noteHistoryNoteMeta");
  const copy = strings();

  if (transcriptMeta) {
    const parts = [];
    const duration = formatRecordingDuration(entry?.recordingDurationMs);
    if (duration) parts.push(`${copy.duration}: ${duration}`);
    parts.push(formatWordCount(entry?.transcript || ""));
    transcriptMeta.textContent = parts.join(" · ");
  }

  if (supplementaryMeta) {
    supplementaryMeta.textContent = formatWordCount(entry?.supplementary || "");
  }

  if (noteMeta) {
    const parts = [formatWordCount(entry?.note || "")];
    const usd = formatUsdCost(entry?.noteCostUsd);
    if (usd) {
      let cost = `${copy.estimatedCost}: ${usd}`;
      if (state.language === "no") cost += ` ≈ ${formatNokEstimate(entry.noteCostUsd)}`;
      parts.push(cost);
    }
    noteMeta.textContent = parts.join(" · ");
    noteMeta.title = state.language === "no" && usd ? copy.nokEstimateHelp : "";
  }
}

function getEntryTitle(entry) {
  const label = entry.kind === "transcript" ? strings().transcript : strings().note;
  return `${label} ${entry.sequence}`;
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
    card.addEventListener("click", () => { void openEntry(entry.id); });
    list.appendChild(card);
  });
}

function syncModalContent() {
  if (!state.activeEntryId) return;
  const metadata = findVisibleEntry(state.activeEntryId);
  if (!metadata) {
    closeModal();
    return;
  }

  const body = state.activeEntryBody?.id === state.activeEntryId
    ? state.activeEntryBody
    : null;
  const entry = body ? { ...metadata, ...body } : metadata;

  const title = byId("noteHistoryModalTitle");
  const transcript = byId("noteHistoryTranscript");
  const supplementary = byId("noteHistorySupplementary");
  const note = byId("noteHistoryNote");

  if (title) {
    title.textContent = `${getEntryTitle(entry)} · ${formatEntryDateTime(
      entry.createdAt
    )} · ${getEntryPromptLabel(entry)}`;
  }
  if (!body && !hasEntryBody(entry)) return;

  if (transcript) {
    transcript.value = entry.transcript || "";
    transcript.scrollTop = 0;
  }
  if (supplementary) {
    supplementary.value = entry.supplementary || "";
    supplementary.scrollTop = 0;
  }
  if (note) {
    note.value = entry.note || "";
    note.scrollTop = 0;
  }
  syncModalEntryMetrics(entry);
}

function isRestoreMenuOpen() {
  return !byId("noteHistoryRestoreMenu")?.hidden;
}

function setRestoreMenuOpen(open, { focus = false } = {}) {
  const menu = byId("noteHistoryRestoreMenu");
  const button = byId("noteHistoryRestoreButton");
  if (!menu || !button) return;

  const shouldOpen = Boolean(open);
  menu.hidden = !shouldOpen;
  button.setAttribute("aria-expanded", shouldOpen ? "true" : "false");
  if (shouldOpen && focus) byId("noteHistoryRestoreCurrent")?.focus();
}

function toggleRestoreMenu() {
  setRestoreMenuOpen(!isRestoreMenuOpen(), { focus: !isRestoreMenuOpen() });
}

function historyEntryText(entry) {
  return {
    transcript: String(entry?.transcript || ""),
    supplementary: String(entry?.supplementary || ""),
    note: String(entry?.note || ""),
  };
}

function showRestoreError(reason) {
  const copy = strings();
  const message = reason === "busy"
    ? copy.restoreBusy
    : reason === "max"
      ? copy.restoreMax
      : copy.restoreFailed;
  window.alert(message);
}

async function restoreActiveEntry(target) {
  const entryId = state.activeEntryId;
  if (!entryId) return;

  if (target === "current" && !window.confirm(strings().confirmReplace)) return;

  const entry = state.activeEntryBody?.id === entryId
    ? { ...findVisibleEntry(entryId), ...state.activeEntryBody }
    : await resolveVisibleEntry(entryId);
  if (!entry || state.activeEntryId !== entryId) {
    showRestoreError();
    return;
  }

  let result = null;
  try {
    result = window.__workspacePresets?.restoreHistoryEntry?.(
      historyEntryText(entry),
      target
    );
  } catch (_) {
    result = null;
  }

  if (!result?.ok) {
    showRestoreError(result?.reason);
    return;
  }

  closeModal();
}

async function openEntry(entryId) {
  const metadata = findVisibleEntry(entryId);
  const modal = byId("noteHistoryModal");
  if (!metadata || !modal) return;

  const requestedId = metadata.id;
  state.activeEntryId = requestedId;
  state.activeEntryBody = null;
  state.previousFocus = document.activeElement;

  const entry = await resolveVisibleEntry(requestedId);
  if (state.activeEntryId !== requestedId) return;
  if (!entry) {
    state.activeEntryId = "";
    state.activeEntryBody = null;
    showRestoreError();
    return;
  }

  state.activeEntryBody = {
    id: entry.id,
    transcript: String(entry.transcript || ""),
    supplementary: String(entry.supplementary || ""),
    note: String(entry.note || ""),
  };
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
    state.activeEntryBody = null;
    return;
  }

  setRestoreMenuOpen(false);
  modal.classList.remove("active");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("note-history-modal-open");
  state.activeEntryId = "";
  state.activeEntryBody = null;

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

function getLiveRecordingDurationMs() {
  const app = window.__app || {};
  const accumulated = Number(app.miniPanelRecordingAccumulatedMs || 0);
  const startedAt = Number(app.miniPanelRecordingStartedAt || 0);
  const running = startedAt > 0 ? Math.max(0, Date.now() - startedAt) : 0;
  return normalizeRecordingDurationMs(Math.max(0, accumulated) + running);
}

function getLastNoteCostUsd() {
  try {
    const usage = window.__app?.getLastNoteUsageCostSnapshot?.();
    return normalizeNoteCostUsd(usage?.estimatedUsd);
  } catch (_) {
    return null;
  }
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
    recordingDurationMs: state.currentRecordingDurationMs,
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
  const entry = copyEntryMetrics({
    id: createEntryId(sequence, createdAt),
    sequence,
    createdAt,
    kind: "note",
    transcript,
    supplementary,
    note,
    promptSlot: String(state.pendingRun?.promptSlot || ""),
    promptLabel: String(state.pendingRun?.promptLabel || ""),
    usedPrompt: state.pendingRun?.usedPrompt !== false,
  }, {
    recordingDurationMs: state.pendingRun?.recordingDurationMs,
    noteCostUsd: getLastNoteCostUsd(),
  });

  state.nextSequence += 1;
  state.entries.unshift(entry);
  state.entries = state.entries.slice(0, MAX_ENTRIES);
  persistHistory();
  renderHistory();
  notifyLocalHistoryUpdated("entry-added");
}

function syncAddToLogButton() {
  const button = byId("addTranscriptToLogButton");
  if (!button) return;
  button.disabled = !String(byId("transcription")?.value || "").trim();
}

function flashAddToLogConfirmation() {
  const button = byId("addTranscriptToLogButton");
  if (!button) return;
  window.clearTimeout(addToLogFeedbackTimer);
  button.textContent = strings().addedToLog;
  addToLogFeedbackTimer = window.setTimeout(() => {
    button.textContent = strings().addToLog;
    addToLogFeedbackTimer = 0;
  }, 1200);
}

function addTranscriptToLog() {
  const transcript = String(byId("transcription")?.value || "").trim();
  if (!transcript) {
    syncAddToLogButton();
    return false;
  }

  const createdAt = Date.now();
  const sequence = state.nextSequence;
  const entry = copyEntryMetrics({
    id: createEntryId(sequence, createdAt),
    sequence,
    createdAt,
    kind: "transcript",
    transcript,
    supplementary: "",
    note: "",
    promptSlot: "",
    promptLabel: "",
    usedPrompt: false,
  }, {
    recordingDurationMs: state.currentRecordingDurationMs,
  });

  state.nextSequence += 1;
  state.entries.unshift(entry);
  state.entries = state.entries.slice(0, MAX_ENTRIES);
  persistHistory();
  renderHistory();
  notifyLocalHistoryUpdated("transcript-entry-added");
  flashAddToLogConfirmation();
  return true;
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
  const transcriptTitle = byId("noteHistoryTranscriptTitleLabel");
  const supplementaryTitle = byId("noteHistorySupplementaryTitleLabel");
  const noteTitle = byId("noteHistoryNoteTitleLabel");
  const restoreButton = byId("noteHistoryRestoreButton");
  const restoreCurrent = byId("noteHistoryRestoreCurrent");
  const restoreNew = byId("noteHistoryRestoreNew");
  const addToLogButton = byId("addTranscriptToLogButton");
  const addToLogTooltipContainer = byId("addTranscriptToLogTooltipContainer");
  const addToLogTooltipText = byId("addTranscriptToLogTooltipText");

  if (title) title.textContent = copy.history;
  if (clearButton) clearButton.textContent = copy.clear;
  if (help) help.setAttribute("aria-label", copy.helpLabel);
  if (tooltip) tooltip.textContent = copy.tooltip;
  if (empty) empty.textContent = copy.empty;
  if (close) close.setAttribute("aria-label", copy.close);
  if (transcriptTitle) transcriptTitle.textContent = copy.transcript;
  if (supplementaryTitle) supplementaryTitle.textContent = copy.supplementary;
  if (noteTitle) noteTitle.textContent = copy.note;
  if (restoreButton) {
    restoreButton.textContent = copy.restore;
    restoreButton.title = copy.restore;
  }
  if (restoreCurrent) restoreCurrent.textContent = copy.replaceCurrent;
  if (restoreNew) restoreNew.textContent = copy.openNew;
  if (addToLogButton) {
    addToLogButton.textContent = copy.addToLog;
    addToLogButton.setAttribute("aria-label", copy.addToLog);
  }
  if (addToLogTooltipContainer) {
    addToLogTooltipContainer.setAttribute("aria-label", copy.addToLogHelp);
  }
  if (addToLogTooltipText) addToLogTooltipText.textContent = copy.addToLogHelp;

  renderHistory();
  syncModalContent();
  syncCollapsedState();
  syncAddToLogButton();
}

function handleRecordingLifecycle(event) {
  const phase = String(event?.detail?.phase || "");
  if (phase === "starting") {
    state.currentRecordingDurationMs = null;
  } else if (phase === "stopping" || phase === "stopped") {
    state.currentRecordingDurationMs = getLiveRecordingDurationMs();
  } else if (phase === "aborted" || phase === "error" || phase === "idle") {
    state.currentRecordingDurationMs = null;
  }
}

function handleTranscriptionFinished(event) {
  if (event?.detail?.status !== "aborted") {
    state.currentRecordingDurationMs =
      getLiveRecordingDurationMs() || state.currentRecordingDurationMs;
  }
  syncAddToLogButton();
}

function handleTranscriptClear() {
  state.currentRecordingDurationMs = null;
  syncAddToLogButton();
}

function bindEvents() {
  byId("noteHistoryCollapseButton")?.addEventListener("click", toggleCollapsedState);
  byId("noteHistoryClearButton")?.addEventListener("click", clearVisibleHistory);
  byId("addTranscriptToLogButton")?.addEventListener("click", addTranscriptToLog);
  byId("transcription")?.addEventListener("input", syncAddToLogButton);
  byId("clearTranscriptionButton")?.addEventListener("click", handleTranscriptClear);
  byId("noteHistoryModalClose")?.addEventListener("click", closeModal);
  byId("noteHistoryRestoreButton")?.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleRestoreMenu();
  });
  byId("noteHistoryRestoreCurrent")?.addEventListener("click", () => {
    setRestoreMenuOpen(false);
    void restoreActiveEntry("current");
  });
  byId("noteHistoryRestoreNew")?.addEventListener("click", () => {
    setRestoreMenuOpen(false);
    void restoreActiveEntry("new");
  });

  byId("noteHistoryModal")?.addEventListener("click", (event) => {
    if (event.target === event.currentTarget) closeModal();
  });

  document.addEventListener("click", (event) => {
    if (!isRestoreMenuOpen()) return;
    const actions = event.target?.closest?.(".note-history-modal-actions");
    if (!actions) setRestoreMenuOpen(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && isRestoreMenuOpen()) {
      event.preventDefault();
      setRestoreMenuOpen(false);
      byId("noteHistoryRestoreButton")?.focus();
    } else if (event.key === "Escape" && byId("noteHistoryModal")?.classList.contains("active")) {
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

  window.addEventListener("recording:lifecycle", handleRecordingLifecycle);
  window.addEventListener("transcription:finished", handleTranscriptionFinished);

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
  addTranscriptToLog,
  getSnapshot: getLocalHistorySnapshot,
  clearLocal: clearLocalHistory,
  replaceLocal: replaceLocalHistorySnapshot,
  bindShared(record, persist, loadEntry) {
    historyRecord = record;
    persistSharedHistory = persist;
    loadSharedHistoryEntry = typeof loadEntry === "function" ? loadEntry : null;
    renderHistory();
    syncModalContent();
  },
});

init();
// Frames bind before the user can start a note; a delayed frame must not
// overwrite newer history generated in another clone while it was loading.
if (window.__workspacePresetFrame) {
  window.parent.__workspacePresets?.bindHistoryRuntime?.(window.__workspacePresetRuntimeId, window.__noteHistory);
}
registerWorkspaceDisposer(({ final }) => {
  window.clearTimeout(addToLogFeedbackTimer);
  addToLogFeedbackTimer = 0;
  state.pendingRun = null;
  state.activeEntryBody = null;
  state.previousFocus = null;
  if (final) {
    historyRecord = { entries: [], nextSequence: 1 };
    persistSharedHistory = null;
    loadSharedHistoryEntry = null;
  }
});
