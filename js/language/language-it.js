// js/language-it.js

export const indexTranslations = {
  pageTitle: "Transcribe Notes",
  headerTitle: "Transcribe Notes",
  headerSubtitle: "Trascrizioni e generazione di note per consultazioni sanitarie avanzate, alimentate da intelligenza artificiale",
  startText: "Per iniziare, inserisci la tua chiave API di OpenAI:",
  apiPlaceholder: "Inserisci qui la chiave API",
  enterButton: "Accedi allo strumento di trascrizione",
  guideButton: "Guida API - Come utilizzare",
  securityButton: "Sicurezza",
  aboutButton: "Informazioni",
  adRevenueMessage: "Poiché questo sito è gratuito e si basa esclusivamente sui ricavi pubblicitari, ti preghiamo di acconsentire alla visualizzazione di annunci personalizzati per sostenere il servizio.",
  securityModalHeading: "Privacy",
securityModalText: 
`<strong>Privacy e Trattamento dei Dati</strong><br><br>
Questa web-app è uno strumento per la trascrizione vocale e la generazione di appunti. Come professionista sanitario / titolare del trattamento, è tua piena responsabilità garantire che ogni utilizzo sia conforme al GDPR, alla Helsepersonelloven e alla Norma norvegese per la sicurezza delle informazioni.<br><br>

Sei l’unico responsabile del rispetto di:<br>
- GDPR<br>
- Helsepersonelloven<br>
- Norma per la sicurezza delle informazioni<br><br>

Ciò implica, tra l’altro:<br>
- Stipulare gli accordi necessari (DPA)<br>
- Eseguire approfondite valutazioni dei rischi (DPIA e TIA)<br><br>

- Maggiori informazioni più avanti in questo testo.<br><br>

Lo sviluppatore di questa web-app declina ogni responsabilità per il tuo utilizzo o per l’eventuale mancata conformità.<br><br>
<hr><br>

<strong>1. Come funziona la web-app?</strong><br>
- Registra l’audio tramite la funzione di registrazione del browser.<br>
- Elabora l’audio nella memoria (RAM) del browser.<br>
- Carica il file audio, tramite connessione sicura HTTPS, all’API Whisper di OpenAI per la trascrizione, utilizzando la tua chiave API personale.<br>
- Invia la trascrizione (ed eventuale testo aggiuntivo / prompt) all’API di OpenAI che genera una bozza di appunto, sempre con la tua chiave API.<br>
- Il browser riceve l’appunto direttamente da OpenAI tramite connessione sicura/crittografata.<br>
- La tua chiave API viene conservata solo temporaneamente nella memoria del browser (SessionStorage). Quando chiudi la web-app o il browser, la chiave viene cancellata dalla memoria. Per riutilizzare la web-app dovrai incollare di nuovo la tua chiave API. Ciò aggiunge un ulteriore livello di sicurezza alla chiave e previene accessi non autorizzati.<br><br>
<hr><br>

<strong>2. È richiesta la tua chiave API di OpenAI</strong><br>
Tutta la comunicazione con OpenAI avviene direttamente dal tuo browser usando la tua chiave API personale. Lo sviluppatore non ha accesso alla tua chiave né ai tuoi dati.<br><br>
<hr><br>

<strong>3. Accordo sul trattamento dei dati (DPA) con OpenAI</strong><br>
Se utilizzi i servizi API per trattare dati personali, si raccomanda di stipulare un DPA con OpenAI. Il modello standard è disponibile qui: <a href="https://ironcladapp.com/public-launch/63ffefa2bed6885f4536d0fe" style="color:blue;" target="_blank">Accordo sul trattamento dei dati di OpenAI (DPA)</a>. Trova il tuo numero di organizzazione qui: <a href="https://platform.openai.com/settings/organization/general" style="color:blue;" target="_blank">profilo organizzazione OpenAI</a>. Una volta firmato, tu e OpenAI riconoscete che sei tu, in qualità di utente, a rivestire il ruolo di responsabile del trattamento – non OpenAI.<br><br>
<hr><br>

<strong>4. DPIA e TIA – Valutazioni dei rischi necessarie</strong><br><br>

<strong>DPIA (Data Protection Impact Assessment):</strong> Obbligatoria ai sensi dell’art. 35 GDPR quando si utilizza nuova tecnologia per trattare categorie particolari di dati. L’obiettivo è identificare e ridurre i rischi per la privacy connessi al trattamento.<br>
Analizza cosa viene trattato, perché e quali misure sono necessarie per tutelare i diritti dei pazienti.<br>
Modello di esempio disponibile qui: <a href="https://transcribe-notes.netlify.app/dpia" style="color:blue;" target="_blank">Esempio di DPIA</a><br><br>

<strong>TIA (Transfer Impact Assessment):</strong> Richiesta dopo la sentenza Schrems II e gli art. 44–49 GDPR per i trasferimenti di dati personali verso Paesi extra SEE (come gli USA). Serve a documentare che il trasferimento garantisca un livello di tutela «essenzialmente equivalente».<br>
Valuta la normativa statunitense (FISA 702, CLOUD Act ecc.) rispetto alla natura dei dati e alle tue misure tecniche/contrattuali supplementari.<br>
Concludi se il trasferimento – insieme alle Clausole Contrattuali Standard e alla certificazione di OpenAI al Data Privacy Framework UE-USA – rimanga comunque lecito.<br>
Modello di esempio disponibile qui: <a href="https://transcribe-notes.netlify.app/tia.html" style="color:blue;" target="_blank">Esempio di TIA</a><br><br>

Entrambe le valutazioni devono essere completate, documentate e approvate da te prima di utilizzare la web-app.<br><br>
<hr><br>

<strong>5. Conservazione zero dei dati (ZDR) e archiviazione presso OpenAI</strong><br><br>

<strong>Policy standard di OpenAI</strong><br>
Secondo la API Data Usage Policy di OpenAI, i dati inviati non vengono usati per addestrare i modelli. Tuttavia possono essere conservati temporaneamente (fino a 30 giorni) per monitoraggio abusi e debug, quindi eliminati.<br><br>

<strong>Zero Data Retention (ZDR)</strong><br>
OpenAI offre ZDR solo ad alcuni clienti enterprise su accordo specifico; non è prevista per l’uso API ordinario e quindi non è attiva in questa app.<br><br>

<strong>Prospettive future</strong><br>
Versioni future dell’app potrebbero supportare provider di IA alternativi che offrano ZDR di default (ad es. alcuni servizi di Microsoft Azure). Eventuali aggiornamenti verranno comunicati tramite la web-app.<br><br>
<hr><br>

<strong>6. Prerequisiti per un potenziale uso clinico</strong><br><br>
La tua valutazione è determinante: la liceità di usare questo strumento con dati dei pazienti dipende esclusivamente dalla tua analisi approfondita. Devi concludere – sulla base del DPA con OpenAI, DPIA e TIA – se l’uso sia adeguato e se il rischio residuo sia accettabile per la tua pratica.<br><br>

<strong>Requisiti minimi prima di usare dati di pazienti:</strong><br>
- DPA valido con OpenAI.<br>
- DPIA e TIA specifiche per l’organizzazione completate, approvate e concludenti per un rischio residuo accettabile.<br>
- Responsabilità sul contenuto: sei responsabile di tutte le informazioni inviate a OpenAI tramite la tua chiave API e della verifica della bozza di appunto generata, prima di eventuale inserimento nella cartella clinica.<br><br>
<hr><br>

<strong>7. Panoramica sulla conservazione dei dati</strong><br><br>
<table style="border-collapse:collapse;width:100%;">
  <thead>
    <tr>
      <th style="border:1px solid #ccc;padding:4px;">Tipo di dato</th>
      <th style="border:1px solid #ccc;padding:4px;">Dove viene conservato?</th>
      <th style="border:1px solid #ccc;padding:4px;">Per quanto tempo?</th>
      <th style="border:1px solid #ccc;padding:4px;">Chi ha accesso?</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="border:1px solid #ccc;padding:4px;">La tua chiave API di OpenAI</td>
      <td style="border:1px solid #ccc;padding:4px;">Memoria SessionStorage del tuo browser</td>
      <td style="border:1px solid #ccc;padding:4px;">Fino a quando chiudi la web-app o il browser</td>
      <td style="border:1px solid #ccc;padding:4px;">Solo tu e il tuo browser</td>
    </tr>
    <tr>
      <td style="border:1px solid #ccc;padding:4px;">Segmenti audio durante la registrazione</td>
      <td style="border:1px solid #ccc;padding:4px;">RAM del browser</td>
      <td style="border:1px solid #ccc;padding:4px;">Solo durante registrazione/elaborazione. Non archiviati da OpenAI dopo la fine del processo</td>
      <td style="border:1px solid #ccc;padding:4px;">Solo tu e il tuo browser</td>
    </tr>
    <tr>
      <td style="border:1px solid #ccc;padding:4px;">Testo / bozza di appunto</td>
      <td style="border:1px solid #ccc;padding:4px;">API di OpenAI (temporaneamente)</td>
      <td style="border:1px solid #ccc;padding:4px;">Max 30 giorni da OpenAI</td>
      <td style="border:1px solid #ccc;padding:4px;">Tu, OpenAI (temporaneamente)</td>
    </tr>
    <tr>
      <td style="border:1px solid #ccc;padding:4px;">Istruzioni / prompt</td>
      <td style="border:1px solid #ccc;padding:4px;">Localmente nel tuo browser. Se effettui di nuovo l’accesso con lo stesso browser, computer e chiave API, i tuoi prompt personalizzati saranno nuovamente disponibili</td>
      <td style="border:1px solid #ccc;padding:4px;">Finché non li elimini</td>
      <td style="border:1px solid #ccc;padding:4px;">Tu e il tuo browser</td>
    </tr>
  </tbody>
</table><br><br>
<hr><br>

<strong>8. Codice sorgente</strong><br><br>
- Il codice sorgente è aperto e gira localmente nel tuo browser.<br><br>
<hr><br>

<strong>9. Cookie e annunci</strong><br><br>
Utilizziamo cookie esclusivamente per mostrare annunci pertinenti tramite Google Ads e per le preferenze linguistiche, il consenso e la memorizzazione dei prompt personalizzati che hai creato. I cookie non memorizzano dati personali oltre quanto necessario per funzionalità e personalizzazione. I cookie di Google non hanno accesso ai dati relativi a registrazioni audio e testo generato (dati dei pazienti).
`,

  aboutModalHeading: "Informazioni",
aboutModalText: `Questo sito è stato creato per offrire ai professionisti sanitari e ad altri utenti un accesso diretto a trascrizioni vocali di alta qualità e alla generazione di note cliniche—senza costi superflui o intermediari.<br><br>
Utilizzando la tua chiave API OpenAI personale, ti connetti direttamente alla fonte della tecnologia. Ciò significa che paghi soltanto il costo effettivo stabilito da OpenAI, senza maggiorazioni o tariffe di abbonamento.<br><br>
Molti fornitori offrono servizi simili, ma applicano prezzi significativamente più elevati—spesso da 8 a 10 volte il costo reale della tecnologia sottostante. Questa piattaforma offre le stesse funzionalità a una frazione del prezzo.<br><br>
<strong>Punti chiave:</strong><br>
• Nessun abbonamento, nessun account richiesto.<br>
• Paghi solo OpenAI per ciò che utilizzi.<br>
• Il sito stesso è completamente gratuito.<br><br>
Per continuare a offrire questo servizio gratuito, ti saremmo molto grati se accettassi la visualizzazione degli annunci Google Ads. I ricavi pubblicitari ci aiutano a coprire i costi di hosting e gestione, permettendo al servizio di rimanere accessibile a tutti.`,
  guideModalHeading: "Come si usa",
guideModalText: `Per utilizzare questa webapp, devi prima creare un profilo OpenAI API, generare una chiave API e assicurarti che il tuo portafoglio OpenAI abbia fondi sufficienti. Copia quindi la chiave API e incollala nel campo designato. Quando premi "Invio", la webapp salva temporaneamente la chiave API per la sessione: questa chiave ti connette ai server OpenAI affinché la trascrizione vocale e la generazione di note possano funzionare. Si prega di notare che verrai addebitato immediatamente per ogni operazione effettuata (trascrizione vocale e/o generazione di note). Per ulteriori informazioni sui costi, consulta la sezione "Informazioni sui costi" nella pagina iniziale. Ti consigliamo di leggere l’informativa sulla privacy e sulle informazioni riportata nella pagina iniziale prima di utilizzare l’app.
<br><br>
<strong>1. Crea il tuo profilo OpenAI API</strong><br>
Per iniziare, devi creare un profilo sulla piattaforma OpenAI API. Questo profilo fungerà da account per la gestione delle chiavi API e della fatturazione. Per avviare la registrazione, visita <a href="https://platform.openai.com/signup" style="color:blue;">Registrazione OpenAI API</a>. Segui le istruzioni e crea il tuo utente. Una volta registrato, potrai accedere alla tua dashboard, generare una chiave API personale e caricare credito nel tuo portafoglio OpenAI.
<br><br>
<strong>2. Genera una chiave API</strong><br>
Dopo aver creato il tuo profilo, genera una chiave API accedendo a <a href="https://platform.openai.com/account/api-keys" style="color:blue;">Gestione chiavi API</a>. Clicca sul pulsante per creare una nuova chiave API. Importante: vedrai la chiave una sola volta. Copiala immediatamente e conservala in un luogo sicuro (ad esempio in un file di testo). Se perdi la chiave o sospetti che sia stata compromessa, potrai disattivarla o eliminarla dallo stesso pannello e crearne una nuova.
<br><br>
<strong>3. Carica fondi nel tuo portafoglio OpenAI</strong><br>
Per utilizzare la webapp, il tuo portafoglio OpenAI deve contenere fondi sufficienti. Visita <a href="https://platform.openai.com/account/billing/overview" style="color:blue;">Pagina di fatturazione e pagamenti</a> per aggiungere credito. Puoi trasferire qualsiasi importo in qualsiasi momento. Finché il tuo saldo è positivo, potrai usufruire delle funzionalità della webapp: ogni operazione verrà addebitata immediatamente. Per una panoramica dettagliata dei prezzi, consulta la sezione "Informazioni sui costi".
<br><br>
<strong>Avvertenza sulla sicurezza della sessione</strong><br>
Quando inserisci la chiave API nel campo sulla pagina iniziale e premi Invio, essa viene salvata solo temporaneamente nella sessione del browser. Questo significa che se lasci la pagina, chiudi il browser o spegni il computer, la chiave non verrà memorizzata. Dovrai quindi incollarla nuovamente alla prossima visita, garantendo così la sicurezza della tua chiave.`,

  priceButton: "Prezzo",
  priceModalHeading: "Prezzo",
priceModalText: `
<div>
  <p><strong>Informazioni sui costi</strong></p>
  <p>Paghi solo per ciò che usi – direttamente alla fonte, senza intermediari costosi. Nessun abbonamento. Nessun vincolo.</p>

  <p><strong>Prezzi:</strong></p>
  <ul>
    <li>Trascrizione audio: $0.006 al minuto</li>
    <li>Generazione note: $5 per 1 milione di token (input) e $10 per 1 milione di token (output)</li>
  </ul>

  <p><strong>Esempio – Consulto di 15 minuti:</strong></p>
  <ul>
    <li>Trascrizione: 15 × $0.006 = $0.09</li>
    <li>Generazione nota: solitamente tra $0.005 e $0.01</li>
    <li>Totale: circa $0.10 per l’intero consulto</li>
  </ul>

  <p><strong>Esempio di costo mensile con uso regolare:</strong></p>
  <ul>
    <li>20 consulti al giorno × 4 giorni a settimana × 4 settimane = 320 consulti</li>
    <li>Costo mensile totale: circa $30–31</li>
  </ul>

  <p><strong>Paghi solo in base all'utilizzo:</strong><br>
  Se non utilizzi il servizio per ferie, malattia o congedo, non paghi nulla.</p>
</div>
`,
};

export const transcribeTranslations = {
  pageTitle: "Strumento di Trascrizione con Annunci e Sovrapposizione della Guida",
  openaiUsageLinkText: "Riepilogo dei costi",
  openaiWalletLinkText: "Saldo Portafoglio",
  btnFunctions: "Funzioni",
  btnGuide: "Guida",
  btnNews: "Stato e aggiornamenti",
  backToHome: "Torna alla pagina iniziale",
  recordingAreaTitle: "Area di Registrazione",
  recordTimer: "Timer di Registrazione: 0 sec",
  transcribeTimer: "Timer di Completamento: 0 sec",
  transcriptionPlaceholder: "Il risultato della trascrizione apparirà qui...",
  startButton: "Avvia Registrazione",
  readFirstText: "Leggi prima! ➔",
  stopButton: "Ferma/Completa",
  pauseButton: "Pausa Registrazione",
  statusMessage: "Benvenuto! Clicca su \"Avvia Registrazione\" per iniziare.",
  noteGenerationTitle: "Generazione delle Note",
  generateNoteButton: "Genera Nota",
  noteTimer: "Timer di Completamento: 0 sec",
  generatedNotePlaceholder: "La nota generata apparirà qui...",
  customPromptTitle: "Prompt Personalizzato",
  promptSlotLabel: "Slot del Prompt:",
  customPromptPlaceholder: "Inserisci qui il prompt personalizzato",
  adUnitText: "Il tuo annuncio qui",
  guideHeading: "Guida e Istruzioni",
guideText: `Benvenuto in <strong>Transcribe Notes</strong>. L'app può registrare e trascrivere conversazioni e usare il testo finale per generare una nota. Ottieni sempre il consenso necessario prima della registrazione e controlla sempre il contenuto clinico prima dell'uso.<br><br>

<strong>Avvio rapido</strong><br>
<ol>
  <li>Seleziona un Workspace, il fornitore di trascrizione e le impostazioni necessarie.</li>
  <li>Seleziona <strong>Avvia registrazione</strong>. Usa <strong>Pausa</strong>, <strong>Riprendi</strong>, <strong>Stop/Completa</strong> o <strong>Interrompi</strong> secondo necessità.</li>
  <li>Seleziona prompt, fornitore e modello per la nota, quindi <strong>Genera nota</strong>. Puoi anche attivare Auto-generate.</li>
</ol>

<details open>
  <summary><strong>Registrazione e trascrizione</strong></summary>
  <ul>
    <li>Seleziona il fornitore speech-to-text prima della registrazione. Si consiglia Google Chrome o Microsoft Edge.</li>
    <li><strong>Pausa</strong> completa il segmento audio corrente e permette di riprendere in seguito. <strong>Stop/Completa</strong> termina la registrazione e attende la trascrizione restante. <strong>Interrompi</strong> scarta la registrazione attiva senza il normale completamento.</li>
    <li><strong>Speaker Labels</strong> è disponibile solo con Soniox e prova a indicare chi sta parlando, ad esempio Speaker 1 e Speaker 2.</li>
  </ul>
</details><br>

<details>
  <summary><strong>Workspaces e Workspace Sets</strong></summary>
  <ul>
    <li>Un <strong>Workspace</strong> è un'area di lavoro separata nella scheda del browser. Ogni Workspace ha testi, prompt selezionati, fornitori, modelli, impostazioni, cronologia e processi attivi propri. Cambiare Workspace non interrompe registrazioni o generazioni.</li>
    <li>Il nome segue normalmente l'etichetta dello slot prompt selezionato. Usa <strong>+</strong> per aggiungere e <strong>×</strong> per chiudere un Workspace. Possono essere aperti fino a 12 Workspaces.</li>
    <li>Tutti i Workspaces aperti formano un <strong>Workspace Set</strong>. Importazione ed esportazione sono disponibili tramite file JSON locale, Microsoft OneDrive o Google Drive.</li>
    <li>Un Workspace Set salva numero e ordine, nomi, slot prompt selezionati con testo ed etichette, fornitori, modelli, scelte di reasoning, caselle pertinenti e moduli aperti. Non include trascrizioni, informazioni supplementari, note, cronologia, audio, chiavi API, password o altre informazioni sui pazienti.</li>
    <li>I backup cloud sono crittografati nel browser con la password scelta. I file JSON locali sono leggibili e devono essere conservati in modo sicuro.</li>
  </ul>
</details><br>

<details>
  <summary><strong>Mini Panel</strong></summary>
  <ul>
    <li>Aprilo con il pulsante <strong>Mini-panel</strong>. L'icona in alto a destra passa da una visualizzazione all'altra.</li>
    <li><strong>Mini Panel — Browser Tabs</strong> controlla schede Transcribe Notes separate ed è adatto a un Workspace per scheda.</li>
    <li><strong>Mini Panel — Workspaces</strong> mostra tutti i Workspaces nella scheda Transcribe Notes selezionata ed è adatto a più aree di lavoro nella stessa scheda.</li>
    <li>Registrazioni e generazioni continuano in background quando cambi visualizzazione o Workspace.</li>
  </ul>
</details><br>

<details>
  <summary><strong>Auto-generate, Auto-copy e generazione primaria</strong></summary>
  <ul>
    <li><strong>Auto-generate</strong> avvia automaticamente la generazione della nota al termine della trascrizione. Quando è disattivato, usa manualmente <strong>Genera nota</strong>.</li>
    <li><strong>Auto-copy</strong> può copiare automaticamente la trascrizione o la nota completata e richiede l'estensione del browser associata. I pulsanti di copia manuale funzionano comunque.</li>
    <li>La nota primaria usa la trascrizione, l'eventuale prompt selezionato e il testo in <strong>Informazioni supplementari</strong>. Prima della generazione seleziona fornitore, modello e, se disponibile, livello di reasoning.</li>
    <li>Le note generate dall'IA possono contenere errori o omettere informazioni. Controlla e convalida sempre una nota prima di salvarla o inviarla.</li>
  </ul>
</details><br>

<details>
  <summary><strong>Secondary Note Generation</strong></summary>
  <p>Questo modulo è utile quando un documento lungo deve essere prima abbreviato. Incolla il testo nel campo sorgente, seleziona un prompt e un modello separati e genera un riassunto. Il risultato può essere copiato automaticamente o manualmente in <strong>Informazioni supplementari</strong>.</p>
  <p>Ad esempio, puoi usare un modello economico come GPT-5 Nano tramite Requesty per riassumere un documento di 50 pagine. Il modello principale, come GPT-5.6 Sol o Claude Opus 5, riceve quindi il breve riassunto insieme alla trascrizione invece dell'intero documento. Ciò può ridurre notevolmente token e costi. Controlla il riassunto prima di usarlo come contesto clinico.</p>
</details><br>

<details>
  <summary><strong>Prezzi e utilizzo dei token</strong></summary>
  <ul>
    <li>Quando i dati sui prezzi sono disponibili, il modello selezionato mostra il prezzo in USD per un milione di token di input e output.</li>
    <li>Dopo la generazione vengono mostrati l'uso dei token e un prezzo stimato se la risposta del fornitore contiene i dati necessari. Alcuni fornitori possono comunicare un costo più preciso.</li>
    <li><strong>Riepilogo dei costi</strong> apre i collegamenti alle pagine di utilizzo e fatturazione dei fornitori. I prezzi nell'app sono indicativi; fa fede la fatturazione del fornitore.</li>
  </ul>
</details><br>

<details>
  <summary><strong>Slot prompt, cronologia, Redactor e OCR</strong></summary>
  <ul>
    <li>Sono disponibili 20 slot prompt. Prompt profile ID separa i set di prompt sullo stesso dispositivo. I set possono essere importati o esportati in JSON o crittografati tramite OneDrive e Google Drive.</li>
    <li>La colonna della cronologia mostra le 30 generazioni primarie completate più recenti del Workspace attivo. Seleziona un elemento per vedere trascrizione, informazioni supplementari e nota generata. Ogni Workspace ha la propria cronologia.</li>
    <li><strong>Redactor</strong> può rimuovere termini generali e specifici selezionati dalla trascrizione e dalle informazioni supplementari. Controlla sempre il risultato prima dell'invio.</li>
    <li><strong>OCR</strong> può estrarre testo da uno screenshot incollato o da un file immagine e inviarlo all'elenco dei termini specifici o al campo di testo grezzo.</li>
  </ul>
</details><br>

<details>
  <summary><strong>Archiviazione e privacy</strong></summary>
  <ul>
    <li>Il testo di lavoro e la cronologia del Workspace rimangono nella sessione della scheda corrente e vengono rimossi al termine della sessione. <strong>Clear</strong> può eliminare contenuto attivo o cronologia.</li>
    <li>Le chiavi API non vengono inserite in localStorage. Restano solo per la sessione attiva del browser e possono essere cancellate manualmente dalla pagina iniziale.</li>
    <li>I dati vengono inviati al fornitore e alla regione selezionati. Archiviazione e trattamento dipendono da fornitore, account, configurazione e condizioni correnti. Verifica che la configurazione sia adatta alle informazioni trattate.</li>
  </ul>
</details><br><br>

Seleziona nuovamente <strong>Guida</strong> o usa il pulsante di chiusura per tornare alla vista principale.
`,

  // Generatore di note secondario
  secondaryNote: {
    showButton: "Mostra generatore di note secondario",
    hideButton: "Nascondi generatore di note secondario",
    title: "Generatore di note secondario",
    sourceLabel: "Testo sorgente",
    sourcePlaceholder: "Incolla o digita qui il testo sorgente...",
    providerLabel: "Fornitore:",
    modelLabel: "Modello:",
    modeLabel: "Modalità:",
    reasoningLabel: "Livello di ragionamento:",
    thinkingLabel: "Livello di riflessione:",
    promptLabel: "Prompt:",
    generateButton: "Genera nota",
    abortButton: "Annulla",
    copyButton: "Copia",
    copiedButton: "Copiato",
    pushButton: "Inserisci",
    clearOnGenerateLabel: "Svuota Informazioni supplementari alla generazione",
    autoTransferLabel: "Copia automaticamente il risultato nelle Informazioni supplementari",
    sourceDateLabel: "Data",
    sourceDateToggleAriaLabel: "Mantieni la data odierna nel testo sorgente",
    sourceDateHelp: 'Quando è attiva: mantiene la riga "Dagens dato er DD.MM.YYYY" all’inizio del testo sorgente e la ripristina dopo l’aggiornamento della pagina. Quando è disattivata: rimuove questa riga della data dal testo sorgente.',
    outputPlaceholder: "La nota generata apparirà qui...",
    timerLabel: "Timer di generazione della nota",
    statusGenerating: "Generazione in corso…",
    statusCompleted: "Generazione del testo completata!",
    statusFailed: "Generazione non riuscita",
    statusAborted: "Generazione della nota annullata.",
    noSourceText: "Nessun testo sorgente",
    noPromptSelected: "Nessun prompt selezionato",
    noOutputToPush: "Nessuna nota da copiare ancora",
    transferred: "Risultato copiato nelle Informazioni supplementari."
  },
};

export default { indexTranslations, transcribeTranslations };
