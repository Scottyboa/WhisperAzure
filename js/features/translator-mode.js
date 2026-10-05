import { getRecordingLifecycle } from '../core/recording-lifecycle.js';
import { registerWorkspaceDisposer } from '../core/workspace-disposal.js';
import { normalizeTranscribeProvider } from '../core/provider-registry.js';

// Soniox's documented speech-translation language set, checked 5 October 2026.
// https://soniox.com/docs/translation/supported-languages
const LANGUAGES = [
  ['af','Afrikaans'],['sq','Albanian'],['ar','Arabic'],['az','Azerbaijani'],['eu','Basque'],
  ['be','Belarusian'],['bn','Bengali'],['bs','Bosnian'],['bg','Bulgarian'],['ca','Catalan'],
  ['zh','Chinese'],['hr','Croatian'],['cs','Czech'],['da','Danish'],['nl','Dutch'],
  ['en','English'],['et','Estonian'],['fi','Finnish'],['fr','French'],['gl','Galician'],
  ['de','German'],['el','Greek'],['gu','Gujarati'],['he','Hebrew'],['hi','Hindi'],
  ['hu','Hungarian'],['id','Indonesian'],['it','Italian'],['ja','Japanese'],['kn','Kannada'],
  ['kk','Kazakh'],['ko','Korean'],['lv','Latvian'],['lt','Lithuanian'],['mk','Macedonian'],
  ['ms','Malay'],['ml','Malayalam'],['mr','Marathi'],['no','Norwegian'],['fa','Persian'],
  ['pl','Polish'],['pt','Portuguese'],['pa','Punjabi'],['ro','Romanian'],['ru','Russian'],
  ['sr','Serbian'],['sk','Slovak'],['sl','Slovenian'],['es','Spanish'],['sw','Swahili'],
  ['sv','Swedish'],['tl','Tagalog'],['ta','Tamil'],['te','Telugu'],['th','Thai'],
  ['tr','Turkish'],['uk','Ukrainian'],['ur','Urdu'],['vi','Vietnamese'],['cy','Welsh'],
];
const LANGUAGE_CODES = new Set(LANGUAGES.map(([code]) => code));
const TEXT = {
  en: { tooltip:"Switch this workspace to translator mode for conversations in two languages. Choose your languages and press Start once. Soniox realtime displays speech and translations in two panels. The workspace remembers its mode and language choices. Stop recording and click “Back to notes” to switch back.", title:'Translator', back:'Back to notes', your:'Your language', patient:'Patient’s language', search:'Search languages…', clear:'Clear conversation', context:'Terminology / context', contextHint:'Optional background or medication names. Used for this conversation only; not included in workspace exports.', hint:'Press Start once and take turns speaking. Each panel shows original speech and translations in its selected language.', original:'Original', translation:'Translation', empty:'The conversation will appear here.', noMatch:'No matching languages', choose:'Select two different languages from the suggestions.', busy:'Stop or abort recording and generation before changing mode.', starting:'Connecting…', recording:'Listening…', paused:'Paused', stopping:'Finishing translation…', stopped:'Translation finished.', aborted:'Recording aborted.', idle:'Ready. Choose two languages and press Start.', start:'Start', pause:'Pause', resume:'Resume', stop:'Stop', abort:'Abort', timer:'Recording', loading:'Loading Soniox realtime…' },
  no: { tooltip:"Bytt dette Workspace-et til oversettermodus for samtaler på to språk. Velg språkene deres og trykk Start én gang. Soniox realtime viser tale og oversettelser i to felt. Workspace-et husker modus og språkvalg. Stopp opptaket og klikk «Tilbake til notater» for å bytte tilbake.", title:'Oversetter', back:'Tilbake til notater', your:'Ditt språk', patient:'Pasientens språk', search:'Søk etter språk…', clear:'Tøm samtalen', context:'Terminologi / kontekst', contextHint:'Valgfri bakgrunn eller legemiddelnavn. Brukes bare i denne samtalen og tas ikke med i Workspace-eksport.', hint:'Trykk Start én gang og snakk etter tur. Hvert felt viser original tale og oversettelser på valgt språk.', original:'Original', translation:'Oversettelse', empty:'Samtalen vises her.', noMatch:'Ingen språk funnet', choose:'Velg to forskjellige språk fra forslagene.', busy:'Stopp eller avbryt opptak og generering før du bytter modus.', starting:'Kobler til…', recording:'Lytter…', paused:'Pauset', stopping:'Fullfører oversettelsen…', stopped:'Oversettelsen er ferdig.', aborted:'Opptaket er avbrutt.', idle:'Klar. Velg to språk og trykk Start.', start:'Start', pause:'Pause', resume:'Fortsett', stop:'Stopp', abort:'Avbryt', timer:'Opptak', loading:'Laster Soniox realtime…' },
  sv: { tooltip:"Byt detta Workspace till översättarläge för samtal på två språk. Välj era språk och tryck Start en gång. Soniox realtime visar tal och översättningar i två paneler. Workspace kommer ihåg läget och språkvalen. Stoppa inspelningen och klicka på ”Tillbaka till anteckningar” för att byta tillbaka.", title:'Översättare', back:'Tillbaka till anteckningar', your:'Ditt språk', patient:'Patientens språk', search:'Sök språk…', clear:'Rensa samtalet', context:'Terminologi / kontext', contextHint:'Valfri bakgrund eller läkemedelsnamn. Används endast i samtalet; ingår inte i Workspace-export.', hint:'Tryck Start en gång och turas om att tala. Varje panel visar original och översättningar på valt språk.', original:'Original', translation:'Översättning', empty:'Samtalet visas här.', noMatch:'Inga matchande språk', choose:'Välj två olika språk från förslagen.', busy:'Stoppa eller avbryt inspelning och generering innan du byter läge.', starting:'Ansluter…', recording:'Lyssnar…', paused:'Pausad', stopping:'Slutför översättningen…', stopped:'Översättningen är klar.', aborted:'Inspelningen avbröts.', idle:'Redo. Välj två språk och tryck Start.', start:'Start', pause:'Paus', resume:'Fortsätt', stop:'Stopp', abort:'Avbryt', timer:'Inspelning', loading:'Laddar Soniox realtime…' },
  de: { tooltip:"Wechseln Sie diesen Workspace in den Übersetzermodus für Gespräche in zwei Sprachen. Wählen Sie Ihre Sprachen und drücken Sie einmal Start. Soniox realtime zeigt Gesprochenes und Übersetzungen in zwei Feldern. Der Workspace merkt sich den Modus und die Sprachauswahl. Stoppen Sie die Aufnahme und klicken Sie auf „Zurück zu Notizen“, um zurückzuwechseln.", title:'Übersetzer', back:'Zurück zu Notizen', your:'Ihre Sprache', patient:'Sprache des Patienten', search:'Sprachen suchen…', clear:'Gespräch leeren', context:'Terminologie / Kontext', contextHint:'Optionaler Hintergrund oder Medikamentennamen. Nur für dieses Gespräch; nicht im Workspace-Export enthalten.', hint:'Einmal Start drücken und abwechselnd sprechen. Jedes Feld zeigt Originaltext und Übersetzungen in der gewählten Sprache.', original:'Original', translation:'Übersetzung', empty:'Das Gespräch erscheint hier.', noMatch:'Keine passenden Sprachen', choose:'Wählen Sie zwei verschiedene Sprachen aus den Vorschlägen.', busy:'Aufnahme und Generierung vor dem Moduswechsel stoppen oder abbrechen.', starting:'Verbindung wird hergestellt…', recording:'Hört zu…', paused:'Pausiert', stopping:'Übersetzung wird abgeschlossen…', stopped:'Übersetzung abgeschlossen.', aborted:'Aufnahme abgebrochen.', idle:'Bereit. Zwei Sprachen wählen und Start drücken.', start:'Start', pause:'Pause', resume:'Fortsetzen', stop:'Stopp', abort:'Abbrechen', timer:'Aufnahme', loading:'Soniox realtime wird geladen…' },
  fr: { tooltip:"Passez ce Workspace en mode traduction pour les conversations en deux langues. Choisissez vos langues et appuyez une fois sur Démarrer. Soniox realtime affiche les paroles et les traductions dans deux panneaux. Le Workspace mémorise le mode et les langues choisies. Arrêtez l’enregistrement et cliquez sur « Retour aux notes » pour revenir au mode habituel.", title:'Traducteur', back:'Retour aux notes', your:'Votre langue', patient:'Langue du patient', search:'Rechercher une langue…', clear:'Effacer la conversation', context:'Terminologie / contexte', contextHint:'Contexte ou noms de médicaments facultatifs. Utilisés uniquement pour cette conversation ; exclus des exports Workspace.', hint:'Appuyez une fois sur Démarrer et parlez à tour de rôle. Chaque panneau affiche les paroles originales et les traductions dans sa langue.', original:'Original', translation:'Traduction', empty:'La conversation apparaîtra ici.', noMatch:'Aucune langue correspondante', choose:'Sélectionnez deux langues différentes dans les suggestions.', busy:'Arrêtez ou annulez l’enregistrement et la génération avant de changer de mode.', starting:'Connexion…', recording:'Écoute…', paused:'En pause', stopping:'Finalisation de la traduction…', stopped:'Traduction terminée.', aborted:'Enregistrement annulé.', idle:'Prêt. Choisissez deux langues et appuyez sur Démarrer.', start:'Démarrer', pause:'Pause', resume:'Reprendre', stop:'Arrêter', abort:'Annuler', timer:'Enregistrement', loading:'Chargement de Soniox realtime…' },
  it: { tooltip:"Passa questo Workspace alla modalità traduttore per conversazioni in due lingue. Scegliete le vostre lingue e premi Avvia una volta. Soniox realtime mostra il parlato e le traduzioni in due pannelli. Il Workspace ricorda la modalità e le lingue scelte. Interrompi la registrazione e fai clic su “Torna alle note” per tornare alla modalità normale.", title:'Traduttore', back:'Torna alle note', your:'La tua lingua', patient:'Lingua del paziente', search:'Cerca lingue…', clear:'Cancella conversazione', context:'Terminologia / contesto', contextHint:'Contesto o nomi di farmaci facoltativi. Usati solo per questa conversazione; esclusi dalle esportazioni Workspace.', hint:'Premi Avvia una volta e parlate a turno. Ogni pannello mostra il testo originale e le traduzioni nella lingua scelta.', original:'Originale', translation:'Traduzione', empty:'La conversazione apparirà qui.', noMatch:'Nessuna lingua trovata', choose:'Seleziona due lingue diverse dai suggerimenti.', busy:'Interrompi o annulla registrazione e generazione prima di cambiare modalità.', starting:'Connessione…', recording:'In ascolto…', paused:'In pausa', stopping:'Completamento traduzione…', stopped:'Traduzione completata.', aborted:'Registrazione annullata.', idle:'Pronto. Scegli due lingue e premi Avvia.', start:'Avvia', pause:'Pausa', resume:'Riprendi', stop:'Interrompi', abort:'Annulla', timer:'Registrazione', loading:'Caricamento di Soniox realtime…' },
};

export function sanitizeTranslatorConfig(value) {
  return {
    enabled: value?.enabled === true,
    languageA: LANGUAGE_CODES.has(value?.languageA) ? value.languageA : 'no',
    languageB: LANGUAGE_CODES.has(value?.languageB) ? value.languageB : 'pl',
    regularProvider: normalizeTranscribeProvider(value?.regularProvider || 'openai'),
  };
}

function initTranslatorMode() {
  if (window.__translator) return;
  const area = document.querySelector('.recording-area');
  const view = document.getElementById('translatorView');
  const toggle = document.getElementById('translatorModeButton');
  const controls = document.getElementById('recordingControls');
  if (!area || !view || !toggle || !controls) return;
  const home = document.createComment('Regular recording controls');
  controls.before(home);
  let settings = sanitizeTranslatorConfig();
  let switching = false, disposed = false, renderFrame = 0, draftTimer = 0;
  let rows = [], interim = [], currentSegments = new Map();
  let phase = 'idle', elapsed = 0, started = 0, runtimeError = '';
  function reportError(message) {
    runtimeError = String(message || 'Soniox connection failed.');
    document.getElementById('statusMessage').textContent = runtimeError;
    // End capture through the ordinary Abort lifecycle, retaining final text.
    void window.__app?.abortRecording?.();
  }
  let displayNames;
  let regularLabels = {};
  const regularIds = ['startButton','stopButton','pauseResumeButton','abortButton','recordingAreaTitle'];
  function rememberRegularLabels() { regularLabels = Object.fromEntries(regularIds.map(id => [id,document.getElementById(id)?.textContent || ''])); }
  rememberRegularLabels();
  const inputs = ['translatorLanguageA','translatorLanguageB'].map(id => document.getElementById(id));
  const logs = ['translatorLogA','translatorLogB'].map(id => document.getElementById(id));
  const context = document.getElementById('translatorContext');
  const lists = inputs.map(input => document.getElementById(input.getAttribute('aria-controls')));
  const matches = [[],[]], highlighted = [-1,-1];
  const language = () => localStorage.getItem('siteLanguage') || document.getElementById('lang-select-transcribe')?.value || 'en';
  const text = () => TEXT[language()] || TEXT.en;
  const name = code => {
    try { return displayNames?.of(code) || LANGUAGES.find(([id]) => id === code)?.[1] || code; } catch { return code; }
  };
  const normalize = value => String(value).normalize('NFD').replace(/\p{M}/gu,'').toLowerCase().trim();
  function busy() {
    const capture = getRecordingLifecycle();
    return capture.pending || ['recording','paused','pausing','resuming','stopping'].includes(capture.phase)
      || !!window.__app?.isTranscribeBusy?.() || !!window.__app?.isNoteGenerationBusy?.()
      || document.getElementById('secondaryAbortButton')?.disabled === false;
  }
  function changed() {
    // Config events save only settings. Conversation/context use session drafts.
    toggle.dispatchEvent(new window.Event('change', { bubbles:true }));
  }
  function draftChanged() {
    window.clearTimeout(draftTimer);
    draftTimer = window.setTimeout(() => {
      draftTimer = 0;
      window.dispatchEvent(new window.Event('translator:draft-changed'));
    }, 500);
  }
  function closeList(index) {
    lists[index].hidden = true;
    inputs[index].setAttribute('aria-expanded','false');
    inputs[index].removeAttribute('aria-activedescendant');
    highlighted[index] = -1;
  }
  function selectLanguage(index, code) {
    settings[index === 0 ? 'languageA' : 'languageB'] = code;
    inputs[index].value = name(code);
    inputs[index].dataset.languageCode = code;
    inputs[index].setCustomValidity('');
    closeList(index); changed(); scheduleRender();
  }
  function showList(index) {
    if (inputs[index].disabled) return;
    const query = normalize(inputs[index].value);
    matches[index] = LANGUAGES.filter(([code,english]) => !query || [name(code),english,code].some(value => normalize(value).startsWith(query)))
      .sort((a,b) => name(a[0]).localeCompare(name(b[0]), language()));
    lists[index].replaceChildren(); highlighted[index] = -1;
    for (const [code] of matches[index]) {
      const option = document.createElement('li');
      option.id = `${inputs[index].id}-${code}`;
      option.setAttribute('role','option'); option.setAttribute('aria-selected','false');
      option.textContent = name(code); option.dataset.languageCode = code;
      option.addEventListener('pointerdown', event => { event.preventDefault(); selectLanguage(index,code); });
      lists[index].append(option);
    }
    if (!matches[index].length) {
      const empty = document.createElement('li'); empty.textContent = text().noMatch; lists[index].append(empty);
    }
    lists[index].hidden = false; inputs[index].setAttribute('aria-expanded','true');
  }
  inputs.forEach((input,index) => {
    input.addEventListener('focus', () => { input.select(); showList(index); });
    input.addEventListener('input', () => { delete input.dataset.languageCode; showList(index); });
    input.addEventListener('blur', () => {
      // Commit an exact name/code only; a partial query is never sent to Soniox.
      const query = normalize(input.value);
      const exact = LANGUAGES.find(([code,english]) => [name(code),english,code].some(value => normalize(value) === query));
      if (exact) selectLanguage(index,exact[0]);
      closeList(index);
    });
    input.addEventListener('keydown', event => {
      if (event.key === 'Escape') { closeList(index); event.preventDefault(); return; }
      if (['ArrowDown','ArrowUp'].includes(event.key)) {
        event.preventDefault(); if (lists[index].hidden) showList(index);
        const count = matches[index].length; if (!count) return;
        highlighted[index] = (highlighted[index] + (event.key === 'ArrowDown' ? 1 : -1) + count) % count;
        [...lists[index].children].forEach((option,i) => option.setAttribute('aria-selected',String(i === highlighted[index])));
        const option = lists[index].children[highlighted[index]];
        input.setAttribute('aria-activedescendant',option.id); option.scrollIntoView({ block:'nearest' });
      } else if (event.key === 'Enter' && !lists[index].hidden) {
        event.preventDefault(); const match = matches[index][highlighted[index] >= 0 ? highlighted[index] : 0];
        if (match) selectLanguage(index,match[0]);
      }
    });
  });

  // Retain completed row nodes: streaming updates must not rebuild the
  // entire conversation DOM every time a provisional word changes.
  const rowNodes = logs.map(() => new Map());
  function renderLog(log, index, segments, pending) {
    const nodes = rowNodes[index];
    const wanted = new Set([...segments,...pending]);
    for (const [segment,node] of nodes) if (!wanted.has(segment)) { node.remove(); nodes.delete(segment); }
    const ordered = [];
    for (const segment of [...segments,...pending]) {
      if (!segment.text.trim()) continue;
      let row = nodes.get(segment);
      if (!row) {
        row = document.createElement('div'); row.className = 'translator-entry';
        const label = document.createElement('div'); label.className = 'translator-entry-label';
        const body = document.createElement('div'); body.className = 'translator-entry-text'; body.lang = segment.language; body.dir = 'auto';
        row.append(label,body); nodes.set(segment,row);
      }
      row.classList.toggle('is-provisional',pending.includes(segment));
      const label = `${segment.kind === 'translation' ? text().translation : text().original} · ${name(segment.language)}`;
      if (row.firstChild.textContent !== label) row.firstChild.textContent = label;
      const content = segment.text.trim();
      if (row.lastChild.textContent !== content) row.lastChild.textContent = content;
      ordered.push(row);
    }
    log.querySelector('.translator-empty')?.remove();
    ordered.forEach((node,i) => { if (log.children[i] !== node) log.insertBefore(node,log.children[i] || null); });
    if (!ordered.length) {
      const empty = document.createElement('p'); empty.className = 'translator-empty'; empty.textContent = text().empty; log.append(empty);
    }
  }
  function render() {
    renderFrame = 0;
    logs.forEach((log,index) => {
      const code = settings[index === 0 ? 'languageA' : 'languageB'];
      const atBottom = log.scrollHeight - log.clientHeight - log.scrollTop < 70;
      const visible = rows.filter(row => row.language === code || ![settings.languageA,settings.languageB].includes(row.language));
      const pending = interim.filter(row => row.language === code || ![settings.languageA,settings.languageB].includes(row.language));
      renderLog(log,index,visible,pending);
      if (atBottom) log.scrollTop = log.scrollHeight;
    });
  }
  function scheduleRender() { if (!renderFrame && !disposed) renderFrame = window.requestAnimationFrame(render); }
  function sessionEnded() { interim = []; currentSegments.clear(); scheduleRender(); draftChanged(); }
  function receive(result) {
    if (!settings.enabled || disposed) return;
    interim = [];
    const pending = new Map();
    for (const token of result.tokens || []) {
      if (typeof token?.text !== 'string') continue;
      if (/^<[^>]+>$/.test(token.text.trim())) {
        if (token.is_final && ['<end>','<fin>'].includes(token.text.trim())) currentSegments.clear();
        continue;
      }
      const kind = token.translation_status === 'translation' ? 'translation' : 'original';
      const languageCode = LANGUAGE_CODES.has(token.language) ? token.language : 'und';
      const key = `${languageCode}:${kind}:${token.source_language || ''}:${token.speaker || ''}`;
      if (token.is_final === true) {
        let row = currentSegments.get(key);
        if (!row) { row = { language:languageCode,kind,text:'' }; rows.push(row); currentSegments.set(key,row); }
        row.text += token.text;
      } else {
        let row = pending.get(key);
        if (!row) { row = { language:languageCode,kind,text:'' }; pending.set(key,row); }
        row.text += token.text;
      }
    }
    interim = [...pending.values()];
    if (result.finished) sessionEnded();
    scheduleRender(); draftChanged();
  }
  function captureDraft() { return { rows:rows.map(row => ({...row})), context:context.value }; }
  function restoreDraft(draft) {
    rows = (Array.isArray(draft?.rows) ? draft.rows : [])
      .filter(row => typeof row?.text === 'string' && ['original','translation'].includes(row.kind))
      .map(row => ({ kind:row.kind, language:LANGUAGE_CODES.has(row.language) ? row.language : 'und', text:row.text.slice(0,100000) }));
    context.value = String(draft?.context || '').slice(0,8000); interim = []; currentSegments.clear(); scheduleRender();
  }
  function updateStatus() {
    if (!settings.enabled) return;
    const t = text();
    const status = document.getElementById('statusMessage');
    if (runtimeError) status.textContent = runtimeError;
    else if (phase !== 'error') status.textContent = switching ? t.loading : t[phase] || t.idle;
    status.style.color = runtimeError || phase === 'error' ? '#b00020' : phase === 'recording' ? '#207344' : '#666';
    const seconds = Math.floor((elapsed + (started ? Date.now()-started : 0))/1000);
    document.getElementById('recordTimer').textContent = `${t.timer}: ${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;
    const lock = busy() || switching;
    toggle.disabled = lock;
    inputs.forEach(input => { input.disabled = lock; });
    context.disabled = lock;
    document.getElementById('translatorClearButton').disabled = lock;
    const labels = { startButton:t.start, stopButton:t.stop, pauseResumeButton:phase === 'paused' ? t.resume : t.pause, abortButton:t.abort };
    for (const [id,label] of Object.entries(labels)) document.getElementById(id).textContent = label;
  }
  function localize() {
    try { displayNames = new Intl.DisplayNames([language()], { type:'language' }); } catch { displayNames = null; }
    const t = text();
    if (settings.enabled) document.getElementById('recordingAreaTitle').textContent = t.title;
    toggle.textContent = settings.enabled ? t.back : t.title;
    const tooltip = document.getElementById('translatorModeTooltipText');
    const help = document.getElementById('translatorModeTooltipContainer');
    if (tooltip) tooltip.textContent = t.tooltip;
    if (help) help.setAttribute('aria-label', t.tooltip);
    for (const [id,key] of Object.entries({translatorLanguageALabel:'your',translatorLanguageBLabel:'patient',translatorClearButton:'clear',translatorContextSummary:'context',translatorContextHint:'contextHint',translatorHint:'hint'})) document.getElementById(id).textContent = t[key];
    inputs.forEach((input,index) => {
      input.placeholder = t.search;
      input.value = name(settings[index === 0 ? 'languageA' : 'languageB']);
      input.dataset.languageCode = settings[index === 0 ? 'languageA' : 'languageB'];
      closeList(index);
    });
    scheduleRender(); updateStatus();
  }
  async function setMode(enabled, options = {}) {
    if (switching || (!options.restoring && busy())) {
      document.getElementById('statusMessage').textContent = text().busy; return false;
    }
    const changedMode = settings.enabled !== Boolean(enabled);
    if (enabled && changedMode) rememberRegularLabels();
    if (enabled && changedMode) settings.regularProvider = normalizeTranscribeProvider(options.regularProvider || document.getElementById('transcribeProvider').value);
    settings.enabled = Boolean(enabled);
    area.classList.toggle('translator-mode',settings.enabled);
    document.querySelector('.bottom-half').classList.toggle('translator-hidden',settings.enabled);
    view.hidden = !settings.enabled;
    toggle.setAttribute('aria-pressed',String(settings.enabled));
    if (settings.enabled) view.before(controls); else home.after(controls);
    localize();
    if (changedMode && options.switchProvider !== false) {
      switching = true; updateStatus();
      document.getElementById('startButton').disabled = true;
      // The selector dispatch performs async engine initialization. main.js's
      // awaitable setter waits for it, so Start never uses the previous engine.
      try { await window.__app?.switchTranscribeProvider?.(settings.enabled ? 'soniox_rt' : settings.regularProvider); }
      finally { switching = false; document.getElementById('startButton').disabled = false; localize(); }
    }
    if (!settings.enabled && changedMode) {
      // Restore regular recording labels through the existing language system.
      for (const [id,label] of Object.entries(regularLabels)) document.getElementById(id).textContent = label;
    }
    if (!options.restoring) changed();
    return true;
  }
  async function restoreConfig(value) {
    const safe = sanitizeTranslatorConfig(value);
    settings.languageA = safe.languageA; settings.languageB = safe.languageB;
    settings.regularProvider = safe.regularProvider;
    await setMode(safe.enabled,{ restoring:true,regularProvider:safe.regularProvider });
    if (safe.enabled && document.getElementById('transcribeProvider').value !== 'soniox_rt') await window.__app?.switchTranscribeProvider?.('soniox_rt');
    localize();
  }
  function getSessionConfig() {
    if (!settings.enabled) return null;
    const codes = inputs.map(input => input.dataset.languageCode);
    if (codes.some(code => !LANGUAGE_CODES.has(code)) || codes[0] === codes[1]) throw new Error(text().choose);
    return {
      language_hints:codes, enable_language_identification:true,
      translation:{ type:'two_way',language_a:codes[0],language_b:codes[1] },
      context:{ general:[{ key:'domain',value:'Healthcare' },{ key:'setting',value:'Medical consultation between a clinician and a patient' }], ...(context.value.trim() ? { text:context.value.trim() } : {}) },
    };
  }
  window.__translator = Object.freeze({
    isEnabled:() => settings.enabled, captureConfig:() => ({...settings}), restoreConfig, setMode,
    captureDraft, restoreDraft, getSessionConfig, receive, reportError,
    beginSession() { currentSegments.clear(); interim = []; scheduleRender(); }, sessionEnded,
  });
  toggle.addEventListener('click', () => { void setMode(!settings.enabled); });
  document.getElementById('translatorClearButton').addEventListener('click', () => {
    if (busy()) return; rows = []; interim = []; currentSegments.clear(); context.value = ''; render(); draftChanged();
  });
  context.addEventListener('input',draftChanged);
  // Validate before recording handlers or auto-clear handlers run.
  document.addEventListener('click', event => {
    if (!settings.enabled || event.target?.id !== 'startButton') return;
    try { getSessionConfig(); } catch (error) {
      event.preventDefault(); event.stopImmediatePropagation();
      document.getElementById('statusMessage').textContent = error.message;
      inputs.find(input => !input.dataset.languageCode)?.focus();
    }
  },true);
  window.addEventListener('recording:lifecycle', event => {
    phase = event.detail.phase;
    if (phase === 'starting') {
      elapsed = 0; started = 0; runtimeError = '';
      if (settings.enabled) {
        // Clear before connecting or asking for conference audio. Resume
        // publishes 'resuming', so it retains the current conversation.
        rows = []; interim = []; currentSegments.clear(); render(); draftChanged();
      }
    }
    if (phase === 'recording' && !started) started = Date.now();
    if (['paused','stopping','stopped','aborted','error'].includes(phase)) {
      if (started) elapsed += Date.now()-started; started = 0;
    }
    if (['paused','stopped','aborted','error'].includes(phase)) sessionEnded();
    updateStatus();
  });
  window.addEventListener('transcribe-language-updated', event => {
    const trans = event.detail?.translations;
    if (trans) regularLabels = { startButton:trans.startButton, stopButton:trans.stopButton, pauseResumeButton:trans.pauseButton, abortButton:document.getElementById('abortButton').textContent, recordingAreaTitle:trans.recordingAreaTitle };
    localize();
  });
  window.addEventListener('storage', event => { if (event.key === 'siteLanguage') localize(); });
  const timer = window.setInterval(() => {
    if (settings.enabled) updateStatus();
    else toggle.disabled = busy() || switching;
  },500);
  registerWorkspaceDisposer(({final}) => {
    if (!final) { sessionEnded(); return; }
    disposed = true; window.clearInterval(timer); window.clearTimeout(draftTimer);
    window.cancelAnimationFrame(renderFrame); rowNodes.forEach(nodes => nodes.clear()); interim = []; currentSegments.clear();
    // Retain final text until the frame's pagehide draft saver has run. The
    // closed frame then releases this data with the rest of its DOM.
  },{scope:'window'});
  localize();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',initTranslatorMode,{once:true});
else initTranslatorMode();
