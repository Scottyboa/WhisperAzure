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
  aboutModalText: `Sono un medico di famiglia norvegese con una profonda passione per i progressi tecnologici, in particolare per l'intelligenza artificiale, e ho seguito da vicino gli sviluppi dell'IA in ambito sanitario.<br><br>
Quando ho appreso per la prima volta dell'esistenza di aziende che offrono servizi di trascrizione da voce a testo per consultazioni mediche in Norvegia, ne sono rimasto entusiasta. Colleghi e recensioni online hanno elogiato questi servizi, evidenziando miglioramenti significativi in termini di efficienza e flusso di lavoro. Tuttavia, approfondendo la questione, sono rimasto sorpreso dai costi elevati richiesti, considerando che il costo reale della tecnologia è solo una frazione di tali prezzi.<br><br>
Motivato da questa constatazione, ho sviluppato personalmente una soluzione di trascrizione da voce a testo, inizialmente per uso personale. Vedendo quanto fosse efficace ed economica, ho deciso di rendere la mia soluzione accessibile online, offrendo la stessa velocità, precisione e qualità dei servizi premium, ma senza le tariffe elevate.<br><br>
A differenza dei fornitori commerciali, questa piattaforma non applica maggiorazioni o commissioni inutili.<br>
• Paghi direttamente a OpenAI — ciò significa che accedi direttamente alla fonte della tecnologia, senza intermediari che aggiungono costi extra.<br>
• Per questo motivo, è l'opzione più economica disponibile, pur mantenendo una qualità di alto livello.<br><br>
Ritengo che i servizi offerti da alcune aziende, pur essendo utili, siano sopravvalutati rispetto a quanto effettivamente forniscono. Molti dei miei colleghi, che lavorano duramente ogni giorno in assistenza ai pazienti, finiscono per pagare molto di più di quanto necessario per accedere a uno strumento che dovrebbe essere alla portata di tutti.<br><br>
Questo sito è completamente gratuito da utilizzare: il tuo unico costo è la tariffa diretta di utilizzo di OpenAI per le trascrizioni.<br>
• Nessun abbonamento mensile, nessun impegno; paghi solo per le attività svolte.<br>
• Controlli quanto spendere decidendo quanto trasferire nel tuo portafoglio OpenAI.<br><br>
L'unica cosa che chiedo è che accetti la visualizzazione degli annunci, che aiutano a coprire i costi dei server di backend.<br>
Per poter continuare a offrire questo servizio gratuito, ti saremmo molto grati se accettassi la visualizzazione degli annunci di Google Ads. I ricavi pubblicitari ci aiutano a coprire i costi di hosting e gestione, così il servizio può rimanere accessibile a tutti.`,
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
priceModalText: `
<div>
  <h1>Informazioni sui Costi</h1>
  <h2>Prezzi per la Trascrizione da Voce a Testo</h2>
  <ul>
    <li><strong>Costo:</strong> 0,006 $ al minuto. <em>Esempio:</em> Una consulenza di 15 minuti costerà 15 × 0,006 $ = <strong>0,09 $</strong> per consulenza.</li>
  </ul>
  <h2>Prezzi per la Generazione delle Note</h2>
  <ul>
    <li><strong>Prezzi basati sui Token:</strong></li>
    <ul>
      <li><strong>Input (trascrizione + prompt):</strong> 2,50 $ per 1.000.000 di token (cioè 0,0000025 $ per token).</li>
      <li><strong>Output (nota generata):</strong> 10,00 $ per 1.000.000 di token (cioè 0,00001 $ per token).</li>
    </ul>
  </ul>
  <h3>Calcolo Esemplificativo per una Consulenza (Solo Generazione della Nota)</h3>
  <ol>
    <li>
      <strong>Calcolo dell'Input:</strong>
      <p>Si supponga che la trascrizione della consulenza contenga circa <strong>700 parole</strong> e che venga aggiunto un prompt di <strong>30 parole</strong>.<br>
      Totale parole = 700 + 30 = <strong>730 parole</strong>.<br>
      Token stimati = 730 × 0,75 ≈ <strong>547,5 token</strong>.<br>
      Costo dell'input = 547,5 token × 0,0000025 $ ≈ <strong>0,0014 $</strong>.</p>
    </li>
    <li>
      <strong>Calcolo dell'Output:</strong>
      <p>Si supponga che la nota generata contenga circa <strong>250 parole</strong>.<br>
      Token stimati = 250 × 0,75 ≈ <strong>187,5 token</strong>.<br>
      Costo dell'output = 187,5 token × 0,00001 $ ≈ <strong>0,0019 $</strong>.</p>
    </li>
    <li>
      <strong>Costo Totale per la Generazione della Nota:</strong>
      <p>Costo combinato ≈ 0,0014 $ + 0,0019 $ = <strong>0,0033 $</strong> per consulenza.</p>
    </li>
  </ol>
  <h2>Costo Totale Approssimativo per Consulenza</h2>
  <p>(per una consulenza/registrazione di 15 minuti, utilizzando entrambe le funzioni)</p>
  <ul>
    <li><strong>Trascrizione da Voce a Testo:</strong> <strong>0,09 $</strong></li>
    <li><strong>Generazione della Nota:</strong> <strong>0,0033 $</strong></li>
    <li><strong>Totale:</strong> Circa <strong>0,0933 $</strong> per consulenza.</li>
  </ul>
  <h2>Stime Mensili dei Costi</h2>
  <p>Supponendo di effettuare 20 consulenze al giorno, 4 giorni a settimana, per 4 settimane al mese (20 × 4 × 4 = <strong>320 consulenze</strong> al mese):</p>
  <ol>
    <li>
      <strong>Utilizzo Solo della Trascrizione da Voce a Testo</strong> (con generazione della nota tramite il tuo account ChatGPT, che è essenzialmente gratuito):<br>
      Costo mensile = 320 × 0,09 $ = <strong>28,80 $</strong>.
    </li>
    <li>
      <strong>Utilizzo di Entrambe le Funzioni (Trascrizione e Generazione della Nota):</strong><br>
      Costo mensile = 320 × 0,0933 $ ≈ <strong>29,86 $</strong>.
    </li>
  </ol>
  <h2>Flessibilità d'Uso</h2>
  <p>A differenza dei fornitori che richiedono un abbonamento mensile, paghi solo per ciò che usi. Se prendi un giorno di pausa, vai in vacanza o hai un periodo senza attività, i costi saranno zero. Anche se utilizzi il servizio quotidianamente per tutte le tue consulenze, il costo per utilizzo rimane significativamente inferiore rispetto ad altri fornitori.</p>
  <hr>
  <h2>Vantaggio della Connessione Diretta</h2>
  <p>La nostra webapp ti connette direttamente con l'API di OpenAI—senza intermediari e senza costi aggiuntivi. Questo collegamento diretto significa che paghi solo per il costo effettivo di elaborazione dell'IA, rendendo il nostro servizio una delle soluzioni più convenienti per la trascrizione da voce a testo e la generazione di note attualmente disponibili.</p>
</div>
`
};

export const transcribeTranslations = {
  pageTitle: "Strumento di Trascrizione con Annunci e Sovrapposizione della Guida",
  openaiUsageLinkText: "Riepilogo dei costi",
  openaiWalletLinkText: "Saldo Portafoglio",
  btnFunctions: "Funzioni",
  btnGuide: "Guida",
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
  noteTimer: "Timer per la Generazione della Nota: 0 sec",
  generatedNotePlaceholder: "La nota generata apparirà qui...",
  customPromptTitle: "Prompt Personalizzato",
  promptSlotLabel: "Slot del Prompt:",
  customPromptPlaceholder: "Inserisci qui il prompt personalizzato",
  adUnitText: "Il tuo annuncio qui",
  guideHeading: "Guida e Istruzioni",
guideText: `Benvenuto in <strong>Whisper Trascrizione Clinica</strong>. Questa applicazione consente a professionisti sanitari, terapisti e altri operatori di registrare e trascrivere consulti, nonché di generare note professionali utilizzando un generatore di testi basato su intelligenza artificiale.<br><br>

<strong>Come utilizzare le funzionalità:</strong><br><br>

<ul>
  <li><strong>Registrazione:</strong> Clicca su "Avvia registrazione" per iniziare a catturare l’audio. Ogni 2 minuti, un segmento audio viene inviato automaticamente ai server di OpenAI per la trascrizione. Le trascrizioni appariranno in sequenza nel campo di output.<br><br>
  <strong><u>Importante:</u> Il registratore non funziona su tutti i browser. Si consiglia di utilizzare <strong>Google Chrome</strong> o <strong>Microsoft Edge</strong>.</strong></li><br>

  <li><strong>Pausa e ripresa:</strong> Puoi usare il pulsante "Pausa" per interrompere temporaneamente la registrazione, ad esempio se la consultazione viene interrotta o se devi uscire dall’ambulatorio per un momento. Quando fai clic su "Pausa", il segmento audio corrente viene caricato e trascritto, e la registrazione viene messa in pausa. Quando sei pronto a continuare, clicca su "Riprendi" e la registrazione riprenderà automaticamente con il segmento successivo. Il timer continuerà da dove si era interrotto e la sessione potrà essere conclusa normalmente con "Stop/Completa".</li><br>

  <li><strong>Completamento:</strong> Dopo aver cliccato su "Stop/Completa", la registrazione si interrompe. Il timer di completamento calcola il tempo necessario per ricevere l’intera trascrizione (solitamente entro 5–10 secondi).</li><br>

  <li><strong>Prompt personalizzato:</strong> Sulla destra, seleziona uno slot prompt (1–10) e inserisci il tuo prompt personalizzato. Il prompt viene salvato automaticamente e associato alla tua chiave API. Puoi creare qualsiasi prompt adatto al tuo stile di documentazione, tono e area clinica. Hai piena libertà nel modo in cui vengono generate le note.</li><br>

  <li><strong>Generazione della nota:</strong> Una volta completata la trascrizione, clicca su "Genera nota" per creare una nota basata sulla trascrizione e sul prompt selezionato/personalizzato.</li><br>

  <li><strong>Panoramica dei costi:</strong> Per verificare il tuo attuale utilizzo su OpenAI, clicca sul link alla panoramica dei costi situato in alto a destra di questa pagina.</li><br>

  <li><strong>Sicurezza:</strong> La registrazione audio viene inviata direttamente ai server API di OpenAI, che non memorizzano i dati e li usano solo per la trascrizione. Il testo trascritto è visibile solo nel tuo browser e <strong>viene eliminato/scompare non appena chiudi il browser o carichi nuovi contenuti.</strong></li><br>

  <li><strong>Pulsante "Guida":</strong> Clicca di nuovo sul pulsante "Guida" per tornare all'interfaccia principale.</li>
</ul><br><br>

<strong>Esempio di prompt:</strong><br>
Genera una nota medica basata sulla trascrizione di una conversazione tra medico e paziente. Deve includere: Contesto, Problema attuale, Reperti clinici, Valutazione e Piano.  
La nota deve essere scritta in linguaggio professionale e con terminologia medica adeguata.<br><br>

Puoi personalizzare questo prompt come preferisci, in base al tuo stile di documentazione, alla tua specializzazione o al tipo di consulto.`,
};

export default { indexTranslations, transcribeTranslations };
