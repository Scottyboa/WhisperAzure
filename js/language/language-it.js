// js/language-it.js

export const indexTranslations = {
  pageTitle: "Trascrizione Clinica Whisper",
  headerTitle: "Trascrizione Clinica Whisper",
  headerSubtitle: "Trascrizioni e generazione di note per consultazioni sanitarie avanzate, alimentate da intelligenza artificiale",
  startText: "Per iniziare, inserisci la tua chiave API di OpenAI:",
  apiPlaceholder: "Inserisci qui la chiave API",
  enterButton: "Accedi allo strumento di trascrizione",
  guideButton: "Guida API - Come utilizzare",
  securityButton: "Sicurezza",
  aboutButton: "Informazioni",
  adRevenueMessage: "Poiché questo sito è gratuito e si basa esclusivamente sui ricavi pubblicitari, ti preghiamo di acconsentire alla visualizzazione di annunci personalizzati per sostenere il servizio.",
  securityModalHeading: "Privacy",
securityModalText: `La tua privacy e la sicurezza delle informazioni dei pazienti sono le nostre massime priorità. Usiamo misure robuste per garantire che i tuoi dati rimangano confidenziali e sicuri:<br><br>
- <strong>Crittografia dei Dati:</strong> Tutti i dati elaborati dal nostro sistema—including registrazioni audio, trascrizioni e note—sono crittografati utilizzando metodi conformi agli standard del settore. Le trascrizioni e le note sono collegate esclusivamente alla tua chiave API personale crittografata e al dispositivo utilizzato per l'accesso, garantendo che solo tu possa visualizzare il contenuto generato.<br><br>
- <strong>Cancellazione Automatica:</strong> Una volta che una trascrizione o una nota viene generata e visualizzata sul tuo schermo, essa viene automaticamente e irreversibilmente eliminata dai nostri server entro 2 minuti. I file audio vengono conservati solo temporaneamente per l'elaborazione e non vengono trattenuti oltre il loro uso immediato.<br><br>
- <strong>Protezione da Accessi Non Autorizzati:</strong> Anche se dovesse verificarsi un accesso non autorizzato alla tua chiave API, i tuoi dati rimangono crittografati e protetti da marcatori specifici del dispositivo, rendendo le informazioni inaccessibili.<br><br>
- <strong>Hosting Conforme al GDPR:</strong> Tutti i processi di backend vengono eseguiti su server dedicati Microsoft Azure situati all'interno dell'UE, pienamente conformi alle normative GDPR.<br><br>
<strong>Pratiche Aggiuntive sulla Privacy:</strong><br><br>
- <strong>Raccolta Minima di Dati:</strong> Raccogliamo solo le informazioni essenziali necessarie per fornire i nostri servizi. Questo include la tua chiave API OpenAI (conservata in forma crittografata per tutta la durata della sessione), un token del dispositivo usato esclusivamente per la crittografia e la tua preferenza linguistica. Nessun ulteriore dato personale viene memorizzato.<br><br>
- <strong>Utilizzo dei Cookie:</strong> I cookie su questo sito vengono utilizzati esclusivamente per fornire annunci personalizzati e migliorare la tua esperienza. Non utilizziamo questi cookie per raccogliere o memorizzare dati personali oltre quanto richiesto a questo scopo. Inoltre, il nostro sito utilizza i cookie per memorizzare le preferenze degli utenti e gestire il consenso.<br><br>
- <strong>Elaborazione e Conservazione dei Dati:</strong> Tutti i dati elaborati dal nostro sistema—including registrazioni audio, trascrizioni e note generate—vengono conservati solo per la durata necessaria a completare il processo di trascrizione e generazione delle note e vengono eliminati automaticamente subito dopo il completamento dell'elaborazione. Non memorizziamo né condividiamo informazioni personali identificabili oltre quanto necessario per il corretto funzionamento del nostro servizio.<br><br>
- <strong>Condivisione di Dati con Terzi e Conformità Regolamentare:</strong> Non vendiamo né condividiamo i tuoi dati personali con terzi. Qualsiasi dato condiviso con servizi esterni—come OpenAI per la trascrizione e la generazione delle note o Google AdSense per annunci personalizzati—è limitato a informazioni anonime relative esclusivamente alla personalizzazione degli annunci e alle preferenze degli utenti, e non include le tue registrazioni, trascrizioni o note generate. Tutta la condivisione dei dati viene effettuata secondo rigorosi standard di riservatezza e in piena conformità con le normative sulla privacy applicabili.<br><br>
Si prega di notare che, a causa del design del nostro sistema, tutti i dati vengono eliminati automaticamente poco dopo l'elaborazione e non vengono conservati a lungo termine.`,
  aboutModalHeading: "Informazioni",
  aboutModalText: `Questo sito è stato creato per offrire a professionisti sanitari e altri utenti un accesso diretto a trascrizioni vocali e generazione di note cliniche di alta qualità—senza costi inutili o intermediari.<br><br>
Utilizzando la tua chiave API OpenAI personale, ti connetti direttamente alla fonte della tecnologia. Questo significa che paghi solo il costo effettivo stabilito da OpenAI, senza sovrapprezzi né abbonamenti.<br><br>
Molti fornitori offrono servizi simili ma applicano tariffe molto più alte—spesso da 8 a 10 volte superiori al costo reale della tecnologia sottostante. Questa piattaforma offre la stessa funzionalità a una frazione del prezzo.<br><br>
<strong>Punti chiave:</strong><br>
• Nessun abbonamento, nessun account richiesto.<br>
• Paghi solo direttamente a OpenAI per ciò che utilizzi.<br>
• Il sito web è completamente gratuito.<br><br>
Per mantenerlo tale, è necessario accettare la visualizzazione di annunci pubblicitari. Le entrate pubblicitarie aiutano a coprire i costi di hosting e gestione, permettendo al servizio di rimanere accessibile e gratuito per tutti.`,
  guideModalHeading: "Come si usa",
  guideModalText: `Per utilizzare questa webapp, devi prima creare un profilo API su OpenAI, generare una chiave API e ricaricare il tuo portafoglio OpenAI. La tua chiave API viene quindi copiata e incollata nel campo apposito. Una volta premuto Invio, la webapp salva temporaneamente la chiave API per la tua sessione — questa chiave ti collega ai server di OpenAI, permettendo la trascrizione da voce a testo e la generazione delle note. Nota bene: ti viene addebitato immediatamente per ogni attività svolta. Per ulteriori informazioni sui costi, consulta la sezione "Cost" nella pagina principale.<br><br>
<strong>1. Crea il tuo profilo API OpenAI</strong><br>
Per iniziare, crea un profilo sulla piattaforma API di OpenAI. Questo profilo funge da account per la gestione delle chiavi API e della fatturazione. Visita la pagina <a href="https://platform.openai.com/signup" style="color:blue;">Registrazione API di OpenAI</a> e segui le istruzioni per registrarti inserendo il tuo indirizzo email, impostando una password e verificando il tuo account. Una volta registrato, avrai accesso al tuo dashboard.<br><br>
<strong>2. Genera una chiave API</strong><br>
Dopo aver creato il profilo, genera una chiave API andando sulla pagina <a href="https://platform.openai.com/account/api-keys" style="color:blue;">Gestione Chiavi API</a>. Clicca sul pulsante per creare una nuova chiave API. Importante: vedrai la chiave solo una volta. Copiala immediatamente e conservala in modo sicuro (ad esempio, in un file di testo) per usi futuri. Se perdi la chiave o sospetti che sia stata compromessa, eliminala e creane una nuova.<br><br>
<strong>3. Ricarica il tuo portafoglio OpenAI</strong><br>
Per far funzionare la webapp, il tuo portafoglio OpenAI deve avere fondi sufficienti. Visita la pagina <a href="https://platform.openai.com/account/billing/overview" style="color:blue;">Fatturazione & Pagamenti</a> per aggiungere fondi. Puoi trasferire qualsiasi importo in qualsiasi momento. Finché ci sono fondi disponibili, potrai utilizzare il sito — ogni attività viene addebitata immediatamente.`,
  priceButton: "Prezzo",
  priceModalHeading: "Prezzo",
  priceModalText: `<h1>Informazioni sui Costi</h1>
<h2>Prezzi per la Trascrizione da Voce a Testo</h2>
<ul>
  <li><strong>Costo:</strong> $0.006 al minuto. <em>Esempio:</em> Una consultazione di 15 minuti costerà 15 × $0.006 = <strong>$0.09</strong> per consultazione.</li>
</ul>
<h2>Prezzi per la Generazione delle Note</h2>
<ul>
  <li><strong>Prezzo Basato sui Token:</strong>
    <ul>
      <li><strong>Input (trascrizione + prompt):</strong> $10 per 1.000.000 di token (cioè $0.00001 per token).</li>
      <li><strong>Output (nota generata):</strong> $30 per 1.000.000 di token (cioè $0.00003 per token).</li>
    </ul>
  </li>
</ul>
<h3>Calcolo Esemplificativo per Consultazione (Solo Generazione Note)</h3>
<ol>
  <li>
    <strong>Calcolo dell'Input:</strong>
    <ul>
      <li>Supponiamo che la trascrizione della consultazione sia di circa <strong>700 parole</strong> e che venga aggiunto un <strong>prompt di 30 parole</strong>.</li>
      <li>Totale parole = 700 + 30 = <strong>730 parole</strong>.</li>
      <li>Token stimati = 730 × 0.75 ≈ <strong>547,5 token</strong>.</li>
      <li>Costo per l'input = 547,5 token × $0.00001 ≈ <strong>$0.0055</strong>.</li>
    </ul>
  </li>
  <li>
    <strong>Calcolo dell'Output:</strong>
    <ul>
      <li>Supponiamo che la nota generata contenga circa <strong>250 parole</strong>.</li>
      <li>Token stimati = 250 × 0.75 ≈ <strong>187,5 token</strong>.</li>
      <li>Costo per l'output = 187,5 token × $0.00003 ≈ <strong>$0.0056</strong>.</li>
    </ul>
  </li>
  <li>
    <strong>Costo Totale per la Generazione delle Note:</strong> ≈ $0.0055 + $0.0056 = <strong>$0.0111</strong> per consultazione.
  </li>
</ol>
<h2>Costo Combinato Approssimativo per Consultazione</h2>
<p>(per una consultazione/registrazione di 15 minuti, utilizzando entrambe le funzioni)</p>
<ul>
  <li><strong>Trascrizione da Voce a Testo:</strong> <strong>$0.09</strong></li>
  <li><strong>Generazione delle Note:</strong> <strong>$0.0111</strong></li>
  <li><strong>Totale:</strong> Circa <strong>$0.101</strong> per consultazione.</li>
</ul>
<h2>Stime dei Costi Mensili</h2>
<p>Supponendo di effettuare 20 consultazioni al giorno, 4 giorni alla settimana, per 4 settimane al mese (20 × 4 × 4 = <strong>320 consultazioni</strong> al mese):</p>
<ol>
  <li>
    <strong>Utilizzando Solo la Trascrizione da Voce a Testo</strong> (con generazione note tramite il tuo account ChatGPT, che è praticamente gratuito):
    <ul>
      <li>Costo mensile = 320 × $0.09 = <strong>$28.80</strong>.</li>
    </ul>
  </li>
  <li>
    <strong>Utilizzando sia la Trascrizione da Voce a Testo che la Generazione delle Note:</strong>
    <ul>
      <li>Costo mensile = 320 × $0.101 ≈ <strong>$32.32</strong>.</li>
    </ul>
  </li>
</ol>
<h2>Flessibilità d'Uso</h2>
<p>A differenza dei fornitori che richiedono un abbonamento mensile, paghi solo per l'utilizzo. Se prendi una giornata libera, vai in vacanza o se non utilizzi il servizio, il costo è zero. Anche se usi il servizio ogni giorno per tutte le consultazioni con i pazienti, il costo per ogni consultazione rimane notevolmente inferiore rispetto ad altri fornitori.</p>
<hr>
<h2>Vantaggio della Connessione Diretta</h2>
<p>La nostra webapp ti connette direttamente con l'API di OpenAI — senza intermediari e senza costi aggiuntivi. Ciò significa che paghi solo per il costo effettivo di elaborazione dell'IA, rendendo il nostro servizio una delle soluzioni più convenienti per la trascrizione da voce a Testo e la generazione di note disponibili oggi.</p>`,
};

export const transcribeTranslations = {
  pageTitle: "Strumento di Trascrizione con Annunci e Sovrapposizione della Guida",
  openaiUsageLinkText: "Riepilogo dei costi",
  btnFunctions: "Funzioni",
  btnGuide: "Guida",
  recordingAreaTitle: "Area di Registrazione",
  recordTimer: "Timer di Registrazione: 0 sec",
  transcribeTimer: "Timer di Completamento: 0 sec",
  transcriptionPlaceholder: "Il risultato della trascrizione apparirà qui...",
  startButton: "Avvia Registrazione",
  stopButton: "Ferma/Completa",
  pauseButton: "Pausa Registrazione",
  statusMessage: "Benvenuto! Clicca su \"Avvia Registrazione\" per iniziare.",
  noteGenerationTitle: "Generazione delle Note",
  generateNoteButton: "Genera Nota",
  noteTimer: "Timer per la Generazione della Nota: 0 sec",
  generatedNotePlaceholder: "La nota generata apparirà qui...",
  customPromptTitle: "Prompt Personalizzato",
  promptSlotLabel: "Slot del Prompt:",
  customPromptPlaceholder: "Inserisci qui il prompt personalizzato",
  adUnitText: "Il tuo annuncio qui",
  guideHeading: "Guida e Istruzioni",
guideText: `Benvenuto allo strumento di trascrizione Whisper. Questa applicazione consente ai professionisti sanitari, ai terapisti e ad altri operatori di registrare e trascrivere le consultazioni, oltre a generare note professionali utilizzando un generatore di note basato su intelligenza artificiale.<br><br>
<strong>Come utilizzare le funzioni:</strong>
<ul>
  <li><strong>Registrazione:</strong> Clicca su "Avvia Registrazione" per iniziare a catturare l'audio. Ogni 2 minuti, un segmento audio viene automaticamente inviato ai server di OpenAI per la trascrizione. I trascritti appariranno in sequenza nel campo di output della trascrizione.</li>
  <li><strong>Completamento:</strong> Dopo aver cliccato su "Ferma/Completa", la registrazione si interrompe. Il timer di completamento continua a contare fino a quando il trascritto completo non viene ricevuto (solitamente entro 5–10 secondi).</li>
  <li><strong>Generazione della Nota:</strong> Una volta completata la trascrizione, clicca su "Genera Nota" per creare una nota basata sul tuo trascritto e sul prompt personalizzato.</li>
  <li><strong>Prompt Personalizzato:</strong> A destra, seleziona uno slot per il prompt (1–10) ed inserisci il tuo prompt personalizzato. Il tuo prompt viene salvato automaticamente e collegato alla tua chiave API.</li>
  <li><strong>Panoramica dell'Uso:</strong> Per verificare il tuo utilizzo attuale presso OpenAI, clicca sul collegamento per la panoramica dell'uso presente nell'interfaccia principale.</li>
  <li><strong>Sicurezza:</strong> Il tuo audio viene criptato e processato su server Microsoft Azure sicuri. Inoltre, trascrizioni e note vengono eliminate automaticamente poco dopo la lavorazione per proteggere la tua privacy.</li>
  <li><strong>Interruttore Guida:</strong> Clicca nuovamente sul pulsante "Guida" per tornare all'interfaccia principale.</li>
</ul>`
};

export default { indexTranslations, transcribeTranslations };
