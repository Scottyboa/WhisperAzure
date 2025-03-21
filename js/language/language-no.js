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
  
  securityModalHeading: "Sikkerhetsinformasjon",
  securityModalText: `Ditt personvern og sikkerheten til pasientinformasjonen er vår høyeste prioritet. For å sikre at dataene forblir konfidensielle:
<div style="margin-left:20px;">
  <ul>
    <li><strong>Datakryptering:</strong> All data som behandles av systemet er sikret med industristandard krypteringsmetoder. Transkripsjoner og notater knyttes utelukkende til din krypterte personlige API-nøkkel og den enheten du bruker, slik at bare du har tilgang til de genererte innholdene.</li>
    <li><strong>Automatisk sletting:</strong> Så snart en transkripsjon eller et notat er generert og vist på skjermen, slettes det automatisk og permanent fra serverne innen 2 minutter.</li>
    <li><strong>Beskyttelse mot uautorisert tilgang:</strong> Selv om uautorisert tilgang til din API-nøkkel skulle inntreffe, forblir dataene kryptert og beskyttet med enhetsspesifikke markører, slik at informasjonen ikke er tilgjengelig.</li>
    <li><strong>GDPR-kompatibel hosting:</strong> Alle backend-prosesser kjøres på dedikerte Microsoft Azure-servere innenfor EU, i full overensstemmelse med GDPR.</li>
  </ul>
</div>
Vær trygg på at strenge sikkerhetstiltak sikrer at all pasientrelatert data forblir trygg, konfidensiell og helt under din kontroll.`,
  
  aboutModalHeading: "Om dette prosjektet",
  aboutModalText: `Jeg er en norsk fastlege med en langvarig interesse for teknologiske fremskritt, spesielt innen kunstig intelligens, og jeg har fulgt AI-utviklingen i helsesektoren tett.<br><br>
Da jeg først hørte om selskaper som tilbyr tale-til-tekst-tjenester for medisinske konsultasjoner i Norge, ble jeg svært entusiastisk. Både kollegaer og online anmeldelser roste disse tjenestene for de betydelige forbedringene i effektivitet og arbeidsflyt de medførte. Men etter nærmere undersøkelser ble jeg overrasket over hvor mye disse selskapene tar betalt – spesielt når den faktiske kostnaden for teknologien kun utgjør en liten brøkdel av prisene deres.<br><br>
Motivert av denne innsikten utviklet jeg min egen tale-til-tekst-løsning, opprinnelig for eget bruk. Etter å ha erfart hvor effektiv og kostnadseffektiv løsningen var, bestemte jeg meg for å gjøre den tilgjengelig på nettet. Jeg tilbyr samme hastighet, nøyaktighet og kvalitet som finnes hos premiumtjenester, men uten de høye avgiftene.<br><br>
I motsetning til kommersielle leverandører legger ikke denne plattformen på ekstra kostnader eller unødvendige gebyrer.<br>
• I stedet betaler du direkte til OpenAI – du går rett til kilden for teknologien, uten at mellomledd tar en ekstra andel.<br>
• Dermed er dette den mest kostnadseffektive løsningen som samtidig opprettholder førsteklasses kvalitet.<br><br>
Jeg mener at tjenestene som tilbys av enkelte av disse selskapene, selv om de er nyttige, er overpriset i forhold til det de faktisk leverer. Mange av mine kollegaer, som jobber hardt hver dag med pasientbehandling, ender opp med å betale betydelig mer enn nødvendig for å få tilgang til et verktøy som burde være rimelig for alle.<br><br>
Denne nettsiden er helt gratis å bruke – den eneste kostnaden du pådrar deg er den direkte bruksavgiften til OpenAI for transkripsjoner.<br>
• Ingen månedlige avgifter, ingen abonnementer, ingen forpliktelser – du betaler kun for oppgavene du utfører.<br>
• Du bestemmer selv hvor mye du vil bruke ved å avgjøre hvor mye du overfører til din OpenAI-lommebok.<br><br>
Det eneste jeg ber om, er at du aksepterer annonser, som bidrar til å dekke kostnadene for backend-servere.<br>
Etter hvert som flere benytter nettsiden, vil kostnadene til hosting og drift øke, og annonseinntektene sikrer at jeg kan holde tjenesten gratis og i drift uten å belaste brukerne.`,
  
  guideModalHeading: "Slik setter du opp din OpenAI API for Whisper Klinisk Transkripsjon",
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
</div>
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
  guideText: `Velkommen til Whisper Transkripsjonsverktøy. Denne applikasjonen gir medisinske fagpersoner, terapeuter og andre behandlere muligheten til å ta opp og transkribere konsultasjoner, samt generere profesjonelle notater ved hjelp av en AI-drevet notatgenerator.<br><br>
<strong>Slik bruker du funksjonene:</strong>
<ul>
  <li><strong>Opptak:</strong> Klikk på "Start opptak" for å begynne å ta opp lyd. Hvert 40. sekund vil et lydsegment automatisk bli sendt til OpenAI-serverne for transkripsjon. Transkripsjonene vil vises én etter én i tekstfeltet.</li>
  <li><strong>Fullføring:</strong> Etter at du klikker på "Stopp/Fullfør", stopper opptaket. Fullføringstimeren går deretter til den fullstendige transkripsjonen er mottatt. Dette tar vanligvis mellom 5 og 10 sekunder.</li>
  <li><strong>Notatgenerering:</strong> Etter transkripsjonen klikker du på "Generer notat" for å lage et notat basert på transkripsjonen din og din tilpassede prompt.</li>
  <li><strong>Tilpasset prompt:</strong> Til høyre, velg en prompt slot (1–10) og skriv inn din tilpassede prompt. Denne lagres automatisk og knyttes til din API-nøkkel.</li>
  <li><strong>Guide-bryter:</strong> Bruk knappene "Funksjoner" og "Guide" for å bytte mellom hovedvisningen og denne guiden.</li>
</ul>
Vennligst klikk på "Funksjoner" for å gå tilbake til hovedgrensesnittet.`,
};

export default { indexTranslations, transcribeTranslations };
