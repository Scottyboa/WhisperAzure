// js/language-no.js

export const indexTranslations = {
  pageTitle: "Whisper Klinisk Transkripsjon",
  headerTitle: "Whisper Klinisk Transkripsjon",
  headerSubtitle: "Avansert AI-drevet tale-til-tekst og notatgenerering for helsekonsultasjoner",
  startText: "For å komme i gang, vennligst skriv inn din OpenAI API-nøkkel:",
  apiPlaceholder: "Skriv inn API-nøkkel her",
  enterButton: "Gå til transkripsjonsverktøyet",
  guideButton: "API-guide – Slik bruker du den",
  securityButton: "Sikkerhet",
  aboutButton: "Om",
  adRevenueMessage: "Siden denne nettsiden er gratis å bruke og kun finansieres via annonseinntekter, vennligst godta personaliserte annonser for å støtte tjenesten.",
  
  securityModalHeading: "Personvern",
securityModalText: `Ditt personvern og sikkerheten til pasientinformasjon er våre høyeste prioriteringer. Vi bruker robuste tiltak for å sikre at dataene dine forblir konfidensielle og trygge:<br><br>
- <strong>Datakryptering:</strong> All data som behandles av systemet vårt – inkludert lydopptak, transkripsjoner og notater – er kryptert ved hjelp av metoder som oppfyller industristandarder. Transkripsjoner og notater er utelukkende knyttet til din krypterte personlige API-nøkkel og den enheten du benytter for tilgang, slik at bare du kan se det genererte innholdet.<br><br>
- <strong>Automatisk sletting:</strong> Så snart en transkripsjon eller et notat er generert og vist på skjermen din, slettes det automatisk og permanent fra våre servere innen 2 minutter. Lydfiler lagres kun midlertidig for behandling og beholdes ikke utover umiddelbar bruk.<br><br>
- <strong>Beskyttelse mot uautorisert tilgang:</strong> Selv om uautorisert tilgang til din API-nøkkel skulle inntreffe, forblir dataene dine kryptert og sikret med enhetsspesifikke markører, noe som gjør informasjonen utilgjengelig.<br><br>
- <strong>GDPR-kompatibel hosting:</strong> Alle backend-prosesser kjøres på dedikerte Microsoft Azure-servere lokalisert innenfor EU, fullt ut i samsvar med GDPR-forskriftene.<br><br>
<strong>Ytterligere personverntiltak:</strong><br><br>
- <strong>Minimal datainnsamling:</strong> Vi samler kun inn den nødvendige informasjonen som kreves for å levere tjenestene våre. Dette inkluderer din OpenAI API-nøkkel (lagret i kryptert form for varigheten av økten din), en enhetstoken som kun brukes til kryptering, og din språkpreferanse. Ingen ytterligere personlige data lagres.<br><br>
- <strong>Bruk av informasjonskapsler:</strong> Nettsiden vår benytter informasjonskapsler for å lagre brukerpreferanser og administrere samtykke for personaliserte annonser, noe som forbedrer opplevelsen din. Du kan administrere informasjonskapselinnstillingene via samtykkebanneret på nettstedet vårt.<br><br>
- <strong>Deling med tredjepart:</strong> Vi selger ikke og deler ikke dine personlige data med tredjepart. Data deles kun med betrodde eksterne tjenester (som OpenAI for transkripsjon og notatgenerering, samt Google AdSense for annonsepersonaliering) under strenge personvernstandarder.<br><br>
Vennligst merk at, på grunn av systemdesignet vårt, slettes alle data automatisk kort tid etter behandling og lagres ikke på lang sikt.`,
  
  aboutModalHeading: "Om",
  aboutModalText: `Denne nettsiden ble opprettet for å gi helsepersonell og andre brukere direkte tilgang til høykvalitets tale-til-tekst transkripsjon og klinisk notatgenerering – uten unødvendige kostnader eller mellomledd.<br><br>
Ved å bruke din egen OpenAI API-nøkkel kobler du deg direkte til kilden for teknologien. Dette betyr at du kun betaler den faktiske bruksprisen fastsatt av OpenAI, uten påslag eller abonnementsavgifter.<br><br>
Mange eksisterende leverandører tilbyr lignende tjenester, men tar betydelig mer – ofte 8 til 10 ganger den reelle kostnaden for den underliggende teknologien. Denne plattformen tilbyr samme funksjonalitet til en brøkdel av prisen.<br><br>
<strong>Nøkkelpunkter:</strong><br>
• Ingen abonnement, ingen konto kreves.<br>
• Du betaler kun OpenAI direkte for det du bruker.<br>
• Nettsiden i seg selv er helt gratis.<br><br>
For å opprettholde dette, kreves det at brukerne aksepterer reklame. Inntekter fra reklame hjelper med å dekke kostnader til hosting og drift, slik at tjenesten kan forbli tilgjengelig og gratis for alle.`,  
  guideModalHeading: "Hvordan bruke",
  guideModalText: `For å bruke denne webappen, må du først opprette en OpenAI API-profil, generere en API-nøkkel og sørge for at din OpenAI-lommebok har tilstrekkelige midler. API-nøkkelen kopieres deretter og limes inn i det angitte feltet. Når du trykker på "Enter", lagrer webappen API-nøkkelen midlertidig for økten – denne nøkkelen kobler deg til OpenAI-serverne slik at tale-til-tekst-transkripsjon og notatgenerering kan fungere. Vennligst merk at du belastes umiddelbart per utført oppgave. For mer informasjon om kostnader, se "Kostnad"-seksjonen på forsiden.
<br><br>
<strong>1. Opprett din OpenAI API-profil</strong><br>
For å komme i gang, må du opprette en profil på OpenAI API-plattformen. Denne profilen fungerer som din konto for administrasjon av API-nøkler og fakturering. For å starte, besøk <a href="https://platform.openai.com/signup" style="color:blue;">OpenAI API Registrering</a>. Følg instruksjonene ved å oppgi e-postadressen din, sette et passord og bekrefte kontoen din. Når du er registrert, får du tilgang til dashbordet ditt.
<br><br>
<strong>2. Generer en API-nøkkel</strong><br>
Etter at du har opprettet profilen din, generer en API-nøkkel ved å gå til <a href="https://platform.openai.com/account/api-keys" style="color:blue;">API-nøkkeladministrasjonen</a>. Klikk på knappen for å opprette en ny API-nøkkel. Viktig: Du vil kun se nøkkelen én gang. Kopier den umiddelbart og oppbevar den sikkert (f.eks. i en tekstfil). Hvis du mister nøkkelen eller mistenker at den har blitt kompromittert, slett den og opprett en ny.
<br><br>
<strong>3. Sett inn midler på din OpenAI-lommebok</strong><br>
For at webappen skal fungere, må din OpenAI-lommebok ha tilstrekkelige midler. Besøk <a href="https://platform.openai.com/account/billing/overview" style="color:blue;">Fakturerings- og betalingsside</a> for å sette inn midler. Du kan overføre hvilket som helst beløp når som helst. Så lenge midlene er tilgjengelige, vil du kunne bruke siden – hver oppgave belastes umiddelbart.
<br><br>
<strong>Sikkerhetsmerknad for økten</strong><br>
Når du logger inn ved å skrive inn API-nøkkelen, lagres den kun midlertidig i nettleserøkten din. Dette betyr at hvis du forlater nettsiden, lukker nettleseren eller slår av datamaskinen, vil ikke API-nøkkelen bli lagret. Du må skrive den inn på nytt neste gang du bruker webappen, noe som sikrer at nøkkelen din forblir sikker.`,
  
  priceButton: "Pris",
  priceModalHeading: "Kostnadsinformasjon",
  priceModalText: `
<div>
  <h1>Kostnadsinformasjon</h1>
  <h2>Tale-til-tekst-prising</h2>
  <ul>
    <li><strong>Kostnad:</strong> $0.006 per minutt. <em>Eksempel:</em> En 15-minutters konsultasjon vil koste 15 × $0.006 = <strong>$0.09</strong> per konsultasjon.</li>
  </ul>
  <h2>Notisgenereringsprising</h2>
  <ul>
    <li><strong>Token-basert prising:</strong></li>
    <ul>
      <li><strong>Input (transkripsjon + prompt):</strong> $10 per 1 000 000 tokens (dvs. $0.00001 per token).</li>
      <li><strong>Output (generert notat):</strong> $30 per 1 000 000 tokens (dvs. $0.00003 per token).</li>
    </ul>
  </ul>
  <h3>Eksempelberegning for konsultasjon (kun notisgenerering)</h3>
  <ol>
    <li>
      <strong>Inputberegning:</strong>
      <p>Anta at transkripsjonen av konsultasjonen er på omtrent <strong>700 ord</strong> og at du legger til en <strong>30-ords prompt</strong>.<br>
      Totalt antall ord = 700 + 30 = <strong>730 ord</strong>.<br>
      Estimert antall tokens = 730 × 0.75 ≈ <strong>547.5 tokens</strong>.<br>
      Inputkostnad = 547.5 tokens × $0.00001 ≈ <strong>$0.0055</strong>.</p>
    </li>
    <li>
      <strong>Outputberegning:</strong>
      <p>Anta at det genererte notatet er på omtrent <strong>250 ord</strong>.<br>
      Estimert antall tokens = 250 × 0.75 ≈ <strong>187.5 tokens</strong>.<br>
      Outputkostnad = 187.5 tokens × $0.00003 ≈ <strong>$0.0056</strong>.</p>
    </li>
    <li>
      <strong>Total notisgenereringskostnad:</strong>
      <p>Kombinert kostnad ≈ $0.0055 + $0.0056 = <strong>$0.0111</strong> per konsultasjon.</p>
    </li>
  </ol>
  <h2>Omtrentlig samlet kostnad per konsultasjon</h2>
  <p>(for en 15-minutters konsultasjon/opptak med begge funksjoner)</p>
  <ul>
    <li><strong>Tale-til-tekst:</strong> <strong>$0.09</strong></li>
    <li><strong>Notisgenerering:</strong> <strong>$0.0111</strong></li>
    <li><strong>Totalt:</strong> Omtrent <strong>$0.101</strong> per konsultasjon.</li>
  </ul>
  <h2>Månedlige kostnadsestimater</h2>
  <p>Dersom du gjennomfører 20 konsultasjoner per dag, 4 dager i uken, over 4 uker i måneden (20 × 4 × 4 = <strong>320 konsultasjoner</strong> per måned):</p>
  <ol>
    <li>
      <strong>Kun tale-til-tekst</strong> (med notisgenerering via din egen ChatGPT-konto, som i praksis er gratis):<br>
      Månedlig kostnad = 320 × $0.09 = <strong>$28.80</strong>.
    </li>
    <li>
      <strong>Bruk av både tale-til-tekst og notisgenerering:</strong><br>
      Månedlig kostnad = 320 × $0.101 ≈ <strong>$32.32</strong>.
    </li>
  </ol>
  <h2>Alternativ for notisgenerering</h2>
  <p>Hvis du allerede har en OpenAI-konto, kan du bruke notisgenerering via ChatGPT på din egen profil – som i praksis er gratis. I så fall påløper kun kostnaden for tale-til-tekst når du bruker denne webappen.</p>
  <h2>Fleksibilitet i bruken</h2>
  <p>I motsetning til leverandører som krever et månedlig abonnement, betaler du kun for faktisk bruk. Om du tar en fridag, drar på ferie eller har en periode uten aktivitet, vil kostnadene dine være null. Selv om du bruker tjenesten daglig for alle dine pasientkonsultasjoner, forblir kostnaden per oppgave betydelig lavere enn hos andre leverandører.</p>
  <hr>
  <h2>Fordel med direkte tilkobling</h2>
  <p>Vår webapp kobler deg direkte til OpenAI API – ingen mellomledd, ingen ekstra avgifter. Denne direkte tilkoblingen betyr at du kun betaler for den faktiske AI-behandlingskostnaden, noe som gjør vår tjeneste til en av de mest prisgunstige løsningene for tale-til-tekst og notisgenerering som er tilgjengelig i dag.</p>
  `,
};

export const transcribeTranslations = {
  pageTitle: "Transkripsjonsverktøy med annonser og guideoverlegg",
  openaiUsageLinkText: "Kostnadsoversikt",
  btnFunctions: "Funksjoner",
  btnGuide: "Guide",
  recordingAreaTitle: "Opptaksområde",
  recordTimer: "Opptakstimer: 0 sek",
  transcribeTimer: "Fullføringstimer: 0 sek",
  transcriptionPlaceholder: "Transkripsjonsresultatet vil vises her...",
  startButton: "Start opptak",
  stopButton: "Stopp/Fullfør",
  pauseButton: "Pause opptak",
  statusMessage: "Velkommen! Klikk på \"Start opptak\" for å begynne.",
  noteGenerationTitle: "Notatgenerering",
  generateNoteButton: "Generer notat",
  noteTimer: "Notatgenereringstimer: 0 sek",
  generatedNotePlaceholder: "Generert notat vil vises her...",
  customPromptTitle: "Tilpasset prompt",
  promptSlotLabel: "Prompt Slot:",
  customPromptPlaceholder: "Skriv inn tilpasset prompt her",
  adUnitText: "Din annonse her",
  guideHeading: "Guide & Instruksjoner",
guideText: `Velkommen til Whisper Transkripsjonsverktøyet. Denne applikasjonen gir medisinske fagpersoner, terapeuter og andre behandlere muligheten til å ta opp og transkribere konsultasjoner, samt generere profesjonelle notater ved hjelp av en AI-drevet notatgenerator.<br><br>
<strong>Slik bruker du funksjonene:</strong>
<ul>
  <li><strong>Opptak:</strong> Klikk på "Start opptak" for å begynne å fange opp lyd. Hvert 2. minutt blir en lydbit automatisk sendt til OpenAI-serverne for transkripsjon. Transkripsjonene vises sekvensielt i tekstfeltet for transkripsjon.</li>
  <li><strong>Fullføring:</strong> Etter at du har klikket på "Stopp/Fullfør", stoppes opptaket. Fullføringstimeren teller til hele transkripsjonen er mottatt (vanligvis innen 5–10 sekunder).</li>
  <li><strong>Notatgenerering:</strong> Når transkripsjonen er fullført, klikker du på "Generer notat" for å lage et notat basert på transkripsjonen din og din tilpassede prompt.</li>
  <li><strong>Tilpasset prompt:</strong> Til høyre, velg en prompt-slot (1–10) og skriv inn din tilpassede prompt. Din prompt lagres automatisk og knyttes til API-nøkkelen din.</li>
  <li><strong>Bruksoversikt:</strong> For å sjekke din nåværende bruk hos OpenAI, klikk på lenken for bruksovervåkning på hovedgrensesnittet.</li>
  <li><strong>Sikkerhet:</strong> Lydopptaket ditt blir kryptert og behandlet på sikre Microsoft Azure-servere. I tillegg slettes transkripsjoner og notater automatisk kort tid etter behandling for å beskytte ditt personvern.</li>
  <li><strong>Guide-bryter:</strong> Klikk på "Guide"-knappen igjen for å gå tilbake til hovedgrensesnittet.</li>
</ul>`
};

export default { indexTranslations, transcribeTranslations };
