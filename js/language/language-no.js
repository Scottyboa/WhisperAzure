// js/language-no.js

export const indexTranslations = {
  pageTitle: "Whisper Klinisk Transkripsjon",
  headerTitle: "Whisper Klinisk Transkripsjon",
  headerSubtitle: "Avansert AI-drevet tale-til-tekst og notatgenerering for helsekonsultasjoner",
  startText: "Har du ikke en API-nøkkel ennå? Klikk på «API nøkkel – Hvordan lage» for enkel veiledning.",
  apiPlaceholder: "Skriv inn API-nøkkel her",
  enterButton: "Gå til transkripsjonsverktøyet",
  guideButton: "API-guide – Slik bruker du den",
  securityButton: "Sikkerhet",
  aboutButton: "Om",
  adRevenueMessage: "Siden dette nettstedet er gratis å bruke og utelukkende finansieres av annonseinntekter, setter vi stor pris på om du godtar annonser for å støtte tjenesten.",
  
  securityModalHeading: "Personvern",
securityModalText: `Personvernet ditt og sikkerheten til pasientinformasjon er vår høyeste prioritet. Vi benytter robuste tiltak for å sikre at dine data forblir konfidensielle og trygge:<br><br>
- <strong>Direkte og lokal behandling:</strong> All data som behandles av vårt system – inkludert lydopptak, transkripsjoner og notater – sendes direkte til OpenAI via deres sikre API. Ingen data prosesseres eller lagres på egne servere. Transkripsjoner og notater vises og lagres midlertidig kun i nettleseren din, og slettes automatisk når de erstattes eller når nettleseren lukkes.<br><br>
- <strong>Automatisk sletting:</strong> Så snart en transkripsjon eller et notat er generert og vist på skjermen din, slettes det automatisk fra nettleserens minne når det erstattes av nytt innhold eller når du forlater siden. Lydfiler behandles kun midlertidig i nettleseren for å muliggjøre opplasting til OpenAI, og beholdes ikke etter bruk.<br><br>
- <strong>Beskyttelse mot uautorisert tilgang:</strong> Dine data prosesseres direkte av OpenAI og vises kun lokalt i din nettleser. Det lagres ingenting på våre servere. Selv om noen skulle få tilgang til API-nøkkelen din, vil ingen data kunne hentes fra vår tjeneste.<br><br>
- <strong>GDPR-kompatibel databehandling:</strong> All databehandling skjer gjennom OpenAI sine API-er og vises kun i din nettleser. OpenAI tilbyr databehandling i henhold til GDPR-regelverket, og benytter ikke innholdet ditt til modelltrening eller videreutvikling.<br><br>
<strong>Ytterligere personvernpraksis:</strong><br><br>
- <strong>Minimal datainnsamling:</strong> Vi samler kun inn den informasjonen som er nødvendig for å levere våre tjenester. Dette inkluderer ditt språkvalg og en enhetstoken som kun brukes for å lagre brukerpreferanser lokalt i nettleseren. Din OpenAI API-nøkkel lagres aldri av oss, men holdes midlertidig i din nettleser under økten. Ingen ytterligere personopplysninger lagres eller behandles.<br><br>
- <strong>Bruk av informasjonskapsler:</strong> Informasjonskapsler på dette nettstedet brukes utelukkende til å vise personlige annonser og forbedre din brukeropplevelse. Vi bruker ikke disse informasjonskapslene til å samle inn eller lagre personopplysninger utover det som kreves for dette formålet. I tillegg benytter nettstedet informasjonskapsler for å lagre brukerpreferanser – som språkvalg og tilpassede prompts – samt for å håndtere samtykke.<br><br>
- <strong>Databehandling og lagring:</strong> All data – inkludert lydopptak, transkripsjoner og genererte notater – behandles utelukkende i nettleseren og via OpenAI. Det lagres ingenting permanent, og alt slettes automatisk så snart prosessen er fullført eller siden lukkes. Vi lagrer eller deler ikke personlig identifiserbar informasjon.<br><br>
- <strong>Deling av data med tredjepart og regulatorisk etterlevelse:</strong> Vi selger eller deler ikke dine personopplysninger med tredjeparter. Eventuelle data som deles med eksterne tjenester – som OpenAI for transkripsjon og notatgenerering eller Google AdSense for personaliserte annonser – er begrenset til anonymisert informasjon knyttet utelukkende til annonsetilpasning og brukerpreferanser, og inkluderer ikke dine opptak, transkripsjoner eller genererte notater. All datadeling skjer under strenge konfidensialitetsstandarder og i full overensstemmelse med gjeldende personvernregler.<br><br>
Vennligst merk at på grunn av systemets utforming slettes all data automatisk kort tid etter behandling, og lagres ikke permanent noe sted, med mindre du som bruker selv velger å lagre informasjonen lokalt.`,

  
  aboutModalHeading: "Om",
  aboutModalText: `Denne nettsiden ble opprettet for å gi helsepersonell og andre brukere direkte tilgang til høykvalitets tale-til-tekst transkripsjon og klinisk notatgenerering – uten unødvendige kostnader eller mellomledd.<br><br>
Ved å bruke din egen OpenAI API-nøkkel kobler du deg direkte til kilden for teknologien. Dette betyr at du kun betaler den faktiske bruksprisen fastsatt av OpenAI, uten påslag eller abonnementsavgifter.<br><br>
Mange eksisterende leverandører tilbyr lignende tjenester, men tar betydelig mer – ofte 8 til 10 ganger den reelle kostnaden for den underliggende teknologien. Denne plattformen tilbyr samme funksjonalitet til en brøkdel av prisen.<br><br>
<strong>Nøkkelpunkter:</strong><br>
• Ingen abonnement, ingen konto kreves.<br>
• Du betaler kun OpenAI direkte for det du bruker.<br>
• Nettsiden i seg selv er helt gratis.<br><br>
For at vi skal kunne fortsette å tilby denne gratis tjenesten, så hadde vi satt stor pris på om du godtar at det vises reklame fra Google Ads. Reklameinntektene hjelper oss å dekke kostnader til hosting og drift, slik at tjenesten kan forbli tilgjengelig for alle.`,  
  guideModalHeading: "API nøkkel - Hvordan lage",
  guideModalText: `For å bruke denne webappen, må du først opprette en OpenAI API-profil, generere en API-nøkkel og sørge for at din OpenAI-lommebok har tilstrekkelige midler. API-nøkkelen kopieres deretter og limes inn i det angitte feltet. Når du trykker på "Enter", lagrer webappen API-nøkkelen midlertidig for økten – denne nøkkelen kobler deg til OpenAI-serverne slik at tale-til-tekst-transkripsjon og notatgenerering kan fungere. Vennligst merk at du belastes umiddelbart per utførte oppgave(tale-til-tekst og/eller) notatgenerering. For mer informasjon om kostnader, se "Kostnadsinformasjon"-seksjonen på forsiden.
<br><br>
<strong>1. Opprett din OpenAI API-profil</strong><br>
For å komme i gang, må du opprette en profil på OpenAI API-plattformen. Denne profilen fungerer som din konto for administrasjon av API-nøkler og fakturering. For å starte, besøk <a href="https://platform.openai.com/signup" style="color:blue;">OpenAI API Registrering</a>. Følg instruksjonene og opprett en bruker. Når du er registrert, får du tilgang til dashbordet ditt. Du vil da ha mulighet til å generere en personlig API-nøkkel, samt laste opp kreditt til din OpenAI lommebok.
<br><br>
<strong>2. Generer en API-nøkkel</strong><br>
Etter at du har opprettet profilen din, generer en API-nøkkel ved å gå til <a href="https://platform.openai.com/account/api-keys" style="color:blue;">API-nøkkeladministrasjonen</a>. Klikk på knappen for å opprette en ny API-nøkkel. Viktig: Du vil kun se nøkkelen én gang. Kopier den umiddelbart og oppbevar den sikkert (f.eks. i en tekstfil). Hvis du mister nøkkelen eller mistenker at den har blitt kompromittert, kan du enkelt deaktivere/slette den på samme sted som du genererte den og samtidig opprette en ny.
<br><br>
<strong>3. Sett inn midler på din OpenAI-lommebok</strong><br>
For at webappen skal fungere, må din OpenAI-lommebok ha tilstrekkelige midler. Besøk <a href="https://platform.openai.com/account/billing/overview" style="color:blue;">Fakturerings- og betalingsside</a> for å sette inn midler. Du kan overføre hvilket som helst beløp når som helst. Så lenge midlene er tilgjengelige, vil du kunne bruke funksjonene i denne webapp – hver oppgave belastes umiddelbart. For detaljert prisoversikt, se "Kostnadsinformasjon".
<br><br>
<strong>Sikkerhetsmerknad for økten</strong><br>
Når du logger inn ved å skrive inn API-nøkkelen i feltet på denne forsiden og klikker på enter, så lagres denne kun midlertidig i nettleserøkten din. Dette betyr at hvis du forlater nettsiden, lukker nettleseren eller slår av datamaskinen, vil ikke API-nøkkelen bli lagret. Du må da klippe og lime den inn på nytt neste gang du bruker webappen, noe som sikrer at nøkkelen din forblir sikker.`,
  
  priceButton: "Pris",
  priceModalHeading: "Kostnadsinformasjon",
priceModalText: `
<div>
  <h1>Kostnadsinformasjon</h1>
  <h2>Tale-til-tekst-prising</h2>
  <ul>
    <li><strong>Kostnad:</strong> $0.006 per minutt. <em>Eksempel:</em> En 15-minutters konsultasjon vil koste 15 × $0.006 = <strong>$0.09</strong> per konsultasjon.</li>
  </ul>
  <h2>Notatgenereringsprising</h2>
  <ul>
    <li><strong>Token-basert prising:</strong></li>
    <ul>
      <li><strong>Input (transkripsjon + prompt):</strong> $2.50 per 1 000 000 tokens (dvs. $0.0000025 per token).</li>
      <li><strong>Output (generert notat):</strong> $10.00 per 1 000 000 tokens (dvs. $0.00001 per token).</li>
    </ul>
  </ul>
  <h3>Eksempelberegning for konsultasjon (kun notatgenerering)</h3>
  <ol>
    <li>
      <strong>Inputberegning:</strong>
      <p>Anta at transkripsjonen av konsultasjonen er på omtrent <strong>700 ord</strong> og at du legger til en <strong>30-ords prompt</strong>.<br>
      Totalt antall ord = 700 + 30 = <strong>730 ord</strong>.<br>
      Estimert antall tokens = 730 × 0.75 ≈ <strong>547.5 tokens</strong>.<br>
      Inputkostnad = 547.5 tokens × $0.0000025 ≈ <strong>$0.0014</strong>.</p>
    </li>
    <li>
      <strong>Outputberegning:</strong>
      <p>Anta at det genererte notatet er på omtrent <strong>250 ord</strong>.<br>
      Estimert antall tokens = 250 × 0.75 ≈ <strong>187.5 tokens</strong>.<br>
      Outputkostnad = 187.5 tokens × $0.00001 ≈ <strong>$0.0019</strong>.</p>
    </li>
    <li>
      <strong>Total notatgenereringskostnad:</strong>
      <p>Kombinert kostnad ≈ $0.0014 + $0.0019 = <strong>$0.0033</strong> per konsultasjon.</p>
    </li>
  </ol>
  <h2>Omtrentlig samlet kostnad per konsultasjon</h2>
  <p>(for en 15-minutters konsultasjon/opptak med begge funksjoner)</p>
  <ul>
    <li><strong>Tale-til-tekst:</strong> <strong>$0.09</strong></li>
    <li><strong>Notatgenerering:</strong> <strong>$0.0033</strong></li>
    <li><strong>Totalt:</strong> Omtrent <strong>$0.0933</strong> per konsultasjon.</li>
  </ul>
  <h2>Månedlige kostnadsestimater</h2>
  <p>Dersom du gjennomfører 20 konsultasjoner per dag, 4 dager i uken, over 4 uker i måneden (20 × 4 × 4 = <strong>320 konsultasjoner</strong> per måned):</p>
  <ol>
    <li>
      <strong>Kun tale-til-tekst</strong>:<br>
      Månedlig kostnad = 320 × $0.09 = <strong>$28.80</strong>.
    </li>
    <li>
      <strong>Bruk av både tale-til-tekst og notatgenerering:</strong><br>
      Månedlig kostnad = 320 × $0.0933 ≈ <strong>$29.86</strong>.
    </li>
  </ol>
  <h2>Fleksibilitet i bruken</h2>
  <p>I motsetning til leverandører som krever et månedlig abonnement, betaler du kun for faktisk bruk. Om du tar en fridag, drar på ferie eller har en periode uten aktivitet, vil kostnadene dine være null. Selv om du bruker tjenesten daglig for alle dine pasientkonsultasjoner, forblir kostnaden per oppgave betydelig lavere enn hos andre leverandører.</p>
  <hr>
  <h2>Fordel med direkte tilkobling</h2>
  <p>Vår webapp kobler deg direkte til OpenAI API – ingen mellomledd, ingen ekstra avgifter. Denne direkte tilkoblingen betyr at du kun betaler for den faktiske AI-behandlingskostnaden, noe som gjør vår tjeneste til en av de mest prisgunstige løsningene for tale-til-tekst og notatgenerering som er tilgjengelig i dag.</p>
`,
};

export const transcribeTranslations = {
  pageTitle: "Transkripsjonsverktøy med annonser og guideoverlegg",
  openaiUsageLinkText: "Kostnadsoversikt",
  openaiWalletLinkText: "OpenAI-kreditt",
  btnFunctions: "Funksjoner",
  btnGuide: "Guide",
  backToHome: "Tilbake til forsiden",
  recordingAreaTitle: "Opptaksområde",
  recordTimer: "Opptakstimer: 0 sek",
  transcribeTimer: "Fullføringstimer: 0 sek",
  transcriptionPlaceholder: "Transkripsjonsresultatet vil vises her...",
  startButton: "Start opptak",
  readFirstText: "Les først! ➔",
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
guideText: `Velkommen til <strong>Whisper Klinisk Transkripsjon</strong>. Denne applikasjonen lar helsepersonell, terapeuter og andre fagpersoner ta opp og transkribere konsultasjoner, samt generere profesjonelle notater ved hjelp av en AI-basert notatgenerator.<br><br>

<strong>Slik bruker du funksjonene:</strong><br><br>

<ul>
  <li><strong>Opptak:</strong> Klikk på "Start opptak" for å begynne å ta opp lyd. Hvert 2. minutt sendes en lydsekvens automatisk til OpenAI sine servere for transkribering. Transkriberingen vises fortløpende i tekstfeltet for transkripsjon.<br><br>
  <strong><u>Viktig:</u> Opptaksfunksjonen fungerer ikke i alle nettlesere. Vi anbefaler derfor å bruke <strong>Google Chrome</strong> eller <strong>Microsoft Edge</strong>.</strong></li><br>

  <li><strong>Pause og gjenoppta:</strong> Du kan bruke "Pause"-knappen til midlertidig å stoppe opptaket, for eksempel dersom konsultasjonen blir avbrutt eller du trenger å forlate kontoret et øyeblikk. Når du trykker på "Pause", lastes det aktuelle lydsegmentet opp og transkriberes, og opptaket settes på pause. Når du er klar til å fortsette, klikker du på "Fortsett", og opptaket gjenopptas automatisk med neste segment. Tidtakeren fortsetter der den slapp, og opptaket kan til slutt avsluttes som vanlig med "Stopp/Ferdig".</li><br>

  <li><strong>Fullføring:</strong> Når du klikker på "Stopp/Ferdig", stopper opptaket. Fullføringstimeren teller tiden til hele transkripsjonen er mottatt (vanligvis innen 3-7 sekunder).</li><br>

  <li><strong>Tilpasset prompt:</strong> På høyre side kan du velge en promptplass (1–10) og skrive inn din egen prompt. Prompten lagres automatisk og knyttes til din API-nøkkel. Du kan lage hvilken som helst prompt som passer din dokumentasjonsstil, tone og faglige fokus. Dette gir deg full fleksibilitet i hvordan notatene dine genereres.</li><br>

  <li><strong>Notatgenerering:</strong> Når transkripsjonen er fullført, klikker du på "Generer notat" for å lage et notat basert på transkripsjonen og den valgte/tilpassede prompten.</li><br>

  <li><strong>Kostnadsoversikt:</strong> For å se ditt nåværende forbruk hos OpenAI, klikk på lenken for kostnadsoversikt som er plassert oppe til høyre på denne siden.</li><br>

  <li><strong>Sikkerhet:</strong> Lydopptaket ditt sendes direkte til OpenAI sine API-servere, som ikke lagrer dataene og kun bruker dem til transkribering. Den transkriberte teksten vises kun i nettleseren din, og <strong>den slettes/forsvinner så snart du lukker nettleseren eller laster inn nytt innhold.</strong></li><br>

  <li><strong>Guide-knapp:</strong> Klikk på "Guide"-knappen igjen for å gå tilbake til hovedvisningen.</li>
</ul><br><br>

<strong>Eksempel på prompt:</strong><br>
"Systemprompt – Medisinsk notatgenerator

Skriv et medisinsk presist, journalklart notat basert på en transkribert lege-pasient-samtale. Bruk følgende struktur (med mindre annet er spesifisert i diktatet):
Bakgrunn (kun ved relevant historikk), Aktuelt/anamnese, Undersøkelse (punktvis), Vurdering, Plan.

Regler:
– Ikke inkluder opplysninger, undersøkelser eller funn som ikke er eksplisitt nevnt.
– Negative funn kun hvis nevnt.
– Blodprøver: skriv “relevante blodprøver rekvireres”, ikke list opp prøver.
– Rett åpenbare feilstavinger i medikamentnavn.
– Ikke bruk spesialtegn eller linjeskift før overskrifter.
– Følg eksplisitte instruksjoner fra legen om stil, lengde eller spesifikke formuleringer.

Dersom legen legger til kommentarer etter at pasienten har gått, skal disse hensyntas."<br><br>

Du kan tilpasse denne prompten slik du selv ønsker, slik at den passer din dokumentasjonsstil, spesialitet eller type konsultasjon.`,
};

export default { indexTranslations, transcribeTranslations };
