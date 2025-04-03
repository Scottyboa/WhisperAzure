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
securityModalText: `La tua privacy e la sicurezza delle informazioni dei pazienti sono le nostre massime priorità. Utilizziamo misure robuste per garantire che i tuoi dati rimangano riservati e sicuri:<br><br>
- <strong>Crittografia dei Dati:</strong> Tutti i dati elaborati dal nostro sistema – incluse registrazioni audio, trascrizioni e note – sono crittografati utilizzando metodi standard del settore. Le trascrizioni e le note sono collegate esclusivamente alla tua chiave API personale crittografata e al dispositivo utilizzato per l'accesso, assicurando che solo tu possa visualizzare il contenuto generato.<br><br>
- <strong>Cancellazione Automatica:</strong> Una volta che una trascrizione o una nota viene generata e visualizzata sul tuo schermo, essa viene cancellata automaticamente e in maniera irreversibile dai nostri server entro 2 minuti. I file audio vengono memorizzati solo temporaneamente per l'elaborazione e non vengono conservati oltre l'uso immediato.<br><br>
- <strong>Protezione contro Accessi Non Autorizzati:</strong> Anche se dovesse verificarsi un accesso non autorizzato alla tua chiave API, i tuoi dati rimangono crittografati e protetti da marcatori specifici del dispositivo, rendendo le informazioni inaccessibili.<br><br>
- <strong>Hosting Conforme al GDPR:</strong> Tutti i processi backend vengono eseguiti su server dedicati Microsoft Azure situati all'interno dell'UE, pienamente conformi alle normative GDPR.<br><br>
<strong>Pratiche Aggiuntive sulla Privacy:</strong><br><br>
- <strong>Raccolta Minima dei Dati:</strong> Raccogliamo solo le informazioni essenziali necessarie per fornire i nostri servizi. Questo include la tua chiave API OpenAI (memorizzata in forma crittografata per la durata della tua sessione), un token del dispositivo utilizzato esclusivamente per la crittografia e la tua preferenza linguistica. Non vengono memorizzati ulteriori dati personali.<br><br>
- <strong>Utilizzo dei Cookie:</strong> Il nostro sito web utilizza i cookie per memorizzare le preferenze degli utenti e gestire il consenso per annunci personalizzati, migliorando la tua esperienza. Puoi gestire le impostazioni dei cookie tramite il banner del consenso sul nostro sito.<br><br>
- <strong>Condivisione con Terze Parti:</strong> Non vendiamo né condividiamo i tuoi dati personali con terze parti. I dati vengono condivisi solo con servizi esterni di fiducia (come OpenAI per la trascrizione e la generazione di note, e Google AdSense per la personalizzazione degli annunci) secondo rigorosi standard di privacy.<br><br>
Si prega di notare che, a causa del design del nostro sistema, tutti i dati vengono cancellati automaticamente poco dopo l'elaborazione e non vengono conservati a lungo termine.`, 
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
Man mano che sempre più persone utilizzeranno il sito, le spese di hosting e operative aumenteranno, e i ricavi pubblicitari garantiranno che il servizio rimanga gratuito e operativo senza addebitare costi agli utenti.`,
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
