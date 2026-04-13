// js/language-no.js

export const indexTranslations = {
  pageTitle: "Transcribe Notes",
  headerTitle: "Transcribe Notes",
  headerSubtitle: "Avansert AI-drevet tale-til-tekst og notatgenerering for helsekonsultasjoner",
  startText: "Du kan nå også velge mellom ulike modeller fra forskjellige leverandører. For instruksjoner om hvordan å bruke denne webappen, les info-modulene nederst på forsiden.",
  apiPlaceholder: "Skriv inn OpenAI API-nøkkel her",
  promptProfileHint: "Brukes til å lagre dine egendefinerte prompts på denne enheten uavhengig av API-nøkkelen din.",
  keysIoHint: "Eksporter nøklene til en fil og oppbevar den sikkert. Neste gang kan du importere filen for å fylle inn feltene på nytt, noe som sparer tid og gjør at du slipper å skrive dem inn. Nøklene slettes automatisk når du lukker webappen/nettleser-fanen, eller manuelt med Clear keys.",
  gdprColumnTitle: "GDPR-kompatibel:",
  gdprColumnFootnote: "(EU data-residens/databehandling + ingen datalagring + data brukes ikke for modelltrening – forutsatt korrekt oppsett)",
  nonGdprColumnTitle: "Ikke GDPR-kompatibel:",
  nonGdprColumnFootnote: "(Typisk global databehandling + kan ha midlertidig datalagring)",
  enterButton: "Gå til transkripsjonsverktøyet",
  guideButton: "API-guide – Slik bruker du den",
  securityButton: "Sikkerhet",
  aboutButton: "Om",
  adRevenueMessage: "Siden dette nettstedet er gratis å bruke og utelukkende finansieres av annonseinntekter, setter vi stor pris på om du godtar annonser for å støtte tjenesten.",
  modelsModalHeading: "AI-modeller",
  modelsModalText: `
  <div>
  <p><strong>Modellvalg i Transcribe Notes</strong></p>

  <p>
    Denne webappen lar deg velge ulike modeller fra flere leverandører – både for <strong>tale-til-tekst (STT)</strong>
    og for <strong>notat-/tekstgenerering</strong>. Resultatet du får avhenger av begge valgene: først kvaliteten på
    transkripsjonen, og deretter hvor god tekstmodellen er til å omforme transkripsjonen (pluss eventuell prompt/tilleggsinfo)
    til et strukturert notat.
  </p>

  <hr><br>

  <p><strong>1) Tale-til-tekst (STT) – leverandører/modeller i appen</strong></p>
  <ul>
    <li><strong>Soniox</strong> (med valgfri talegjennkjenning/speaker diarization)</li>
    <li><strong>OpenAI</strong> – gpt-4o-transcribe</li>
    <li><strong>Voxtral Mini</strong> (Mistral)</li>
    <li><strong>Deepgram</strong> – Nova-3</li>
    <li><strong>Lemonfox</strong> – Speech-to-Text (Whisper v3-basert)</li>
  </ul>

  <br>
  <p><strong>2) Notat-/tekstgenerering – leverandører/modeller i appen</strong></p>
  <ul>
    <li><strong>AWS Bedrock (Claude)</strong> – Claude Haiku 4.5, Claude Sonnet 4.5, Claude Opus 4.5</li>
    <li><strong>OpenAI</strong> – GPT-5.4, GPT-5.2, GPT-5.1</li>
    <li><strong>Google Gemini (AI Studio)</strong> – Gemini 3</li>
    <li><strong>Google Vertex</strong> – Gemini 2.5 Pro</li>
    <li><strong>Mistral</strong> – Mistral Large (Large 3)</li>
    <li><strong>Lemonfox</strong> – Llama 3-baserte modeller</li>
  </ul>

  <hr><br>

  <p><strong>Kvalitet</strong></p>
  <p>
    Modellene gir <strong>ikke</strong> samme output. Noen modeller er eldre/svakere, og kvaliteten følger ofte både modellgenerasjon
    og prisnivå. I praksis er notatkvaliteten nesten alltid et produkt av to ting:
  </p>
  <ul>
    <li><strong>1) Hvor god transkripsjonen er</strong> (STT-kvalitet, feilrate, tegnsetting, og evt. speaker-labels)</li>
    <li><strong>2) Hvor god tekstmodellen er</strong> til å “forstå” transkripsjonen og følge instruksjonen/prompten</li>
  </ul>

  <p>
    Det betyr: Hvis du har <strong>svak transkripsjon</strong> men en <strong>veldig god tekstmodell</strong>, så blir modellen likevel begrenset
    av manglende/feil informasjon i transkripsjonen. Og motsatt: En <strong>svært god transkripsjon</strong> hjelper mye, men en
    <strong>svak tekstmodell</strong> kan fortsatt gi et dårligere notat fordi den ikke klarer å strukturere, prioritere og følge instruksjonen
    like presist.
  </p>

  <br>
  <p><strong>Praktisk “rangering” av notatgenerering (kvalitet)</strong></p>
  <p>
    Under er en praktisk, litt normativ oversikt basert på typisk notatkvalitet i klinisk bruk:
  </p>
  <ul>
    <li>
      <strong>Toppnivå:</strong> <strong>Claude Opus 4.5</strong> (oftest best til notater).
      I samme “toppklasse” ligger ofte <strong>GPT-5.2</strong> og <strong>Gemini 3</strong> – men disse kan være mer utfordrende i klinisk bruk
      avhengig av dataflyt/region og GDPR-oppsett.
    </li>
    <li>
      <strong>Nivå 2 (sterk kvalitet + enklere GDPR-oppsett):</strong>
      <strong>Claude Sonnet 4.5</strong> (AWS Bedrock) og <strong>Gemini 2.5 Pro</strong> (Google Vertex).
      Disse kan settes opp via EU-regioner og med strengere kontroll på databehandling (avhengig av ditt oppsett).
    </li>
    <li>
      <strong>Nivå 3 (bra “value for money”):</strong> <strong>Mistral Large</strong>.
      Ofte svært rimelig og god nok til mye, men typisk et hakk under toppmodellene på presisjon/struktur i krevende notater.
    </li>
    <li>
      <strong>Sist:</strong> <strong>Lemonfox (Llama 3)</strong>.
      Veldig billig, men bruker eldre/svakere modell for notatgenerering og er primært inkludert for testing/eksperimentering.
      Anbefales normalt ikke for best mulig klinisk notatkvalitet.
    </li>
  </ul>

  <br>
  <p><strong>Praktisk “rangering” av tale-til-tekst (kvalitet)</strong></p>
  <ul>
    <li>
      <strong>1. Soniox</strong> – svært høy transkripsjonskvalitet. Med <strong>speaker-labels</strong> får du ofte et mye bedre grunnlag
      for notatgenerering (f.eks. “Speaker 1”/“Speaker 2” i lege–pasient-samtaler). Samtidig er Soniox ofte blant de rimeligste STT-valgene, med enkel mulighet for EU-endepunkt(se API guide for mer info).
    </li>
    <li>
      <strong>2. OpenAI gpt-4o-transcribe</strong> – også veldig bra, men ofte litt høyere feilrate enn Soniox i praksis.
      I klinisk bruk må man i tillegg være ekstra bevisst på GDPR/oppsett (region, retention og avtaler).
    </li>
    <li>
      <strong>Øvrige alternativer:</strong> Deepgram Nova-3, Voxtral Mini og Lemonfox Whisper v3 kan fungere fint til mye,
      men gir ofte mer varierende resultater enn toppvalgene over – spesielt i krevende medisinske samtaler.
    </li>
  </ul>

  <hr><br>

  <p><strong>Pris vs. kvalitet</strong></p>
  <p>
    De beste tekstmodellene koster ofte mer per token enn enklere modeller. For eksempel er <strong>Claude Opus 4.5</strong> gjerne den dyreste
    tekstmodellen i appen – men den gir ofte best notatkvalitet. Likevel vil total månedskostnad i vanlig bruk ofte være
    overraskende lav når du sammenligner med abonnementstjenester i markedet som f.eks. <strong>MedBric</strong>, <strong>Noteless</strong>,
    <strong>Stenoly</strong> og <strong>Journalia</strong>.
  </p>
  <p>
    Se “Kostnadsinformasjon”-seksjonen for konkrete priseksempler og forbruk.
  </p>

  <hr><br>

  <p><strong>Anbefalt oppsett for klinisk bruk</strong></p>
  <p>
    Hvis målet er <strong>best mulig notatkvalitet</strong> og samtidig et oppsett som er GDPR-vennlig, så
    er den sterkste kombinasjon ofte:
    <strong>Soniox (EU-endepunkt) + AWS Bedrock (Claude Opus 4.5)</strong>.
    Alternativt <strong>Soniox + Google Vertex (Gemini 2.5 Pro)</strong>, <strong>Soniox + AWS Bedrock(Claude Sonnet 4.5)</strong> eller <strong>Soniox + Mistral</strong> (EU-oppsett).
  </p>
  <p>
    Husk: GDPR/etterlevelse avhenger av din virksomhet, avtaler (DPA), risikovurderinger (DPIA/TIA), samt faktiske region-/retention-innstillinger
    hos leverandørene. Les “Personvern”-seksjonen for mer detaljer.
  </p>
</div>
`,
  
  securityModalHeading: "Personvern",
securityModalText: `
<strong>Personvern og Databehandling</strong><br><br>
Denne webappen er laget som et verktøy for bruk av tale-til-tekst og notatgenerering. Det er ditt fulle ansvar som helsepersonell/behandlingsansvarlig å sikre at all bruk er i samsvar med GDPR, helsepersonelloven og Normen for informasjonssikkerhet.<br><br>

Du er eneansvarlig for at bruken av denne appen oppfyller alle krav i:<br>
- GDPR<br>
- Helsepersonelloven<br>
- Normen for informasjonssikkerhet<br><br>

Dette innebærer blant annet:<br>
- Inngå nødvendige avtaler (DPA)<br>
- Utføre grundige risikovurderinger (DPIA og TIA)<br><br>

– Mer informasjon om dette lengre ned i denne teksten.<br><br>

Utvikler av denne webappen påtar seg intet ansvar for din bruk eller manglende etterlevelse. Dette er ikke juridisk rådgivning; du må selv involvere personvernombud/juridisk rådgiver ved behov.<br><br>

<hr><br>

<strong>1. Praktiske anbefalinger for modellvalg i denne appen</strong><br><br>

Webappen gir tilgang til flere ulike leverandører og modeller. Nedenfor er en praktisk, litt normativ oversikt som gjør det enklere å velge. Du må likevel gjøre din egen juridiske og tekniske vurdering.<br><br>

<strong>Tale-til-tekst (STT)</strong><br>
- Kvalitetsmessig er de sterkeste tale-til-tekst-modellene i denne appen som regel OpenAI gpt-4o-transcribe og Soniox.<br>
- Til rutinemessig bruk på identifiserbare pasientdata er <strong>Soniox med EU-endepunkt og null datalagring</strong> det alternativet som passer best inn i et strengt GDPR-/helse-regime. OpenAI bruker typisk globale endepunkter og har midlertidig lagring; dette havner ofte i en juridisk «gråsone» med mindre du har særskilte avtaler og eksplisitt EU-dataresidens på plass.<br><br>

<strong>Notatgenerering</strong><br>
- Den beste kvaliteten på notatgenerering i denne appen kommer vanligvis fra ChatGPT-modellene (GPT-5.1 / GPT-4o), Mistral (Mistral Large 3), Claude-modellene (via AWS Bedrock) og Gemini-modellene (Gemini 3 og Gemini 2.5 Pro).<br>
- Fra et GDPR-perspektiv er anbefalt oppsett i denne appen <strong>AWS Bedrock (Claude)</strong>, fordi det kan konfigureres med sterke kontroller for dataresidens (EU/EØS-regioner), null datalagring (Zero Data Retention) og ingen gjenbruk til trening — noe som gjør dette til en svært «GDPR-optimalisert» løsning for notatgenerering når det settes opp riktig.<br>
- Et sterkt alternativ er <strong>Google Vertex AI med Gemini 2.5 Pro</strong> i en EU-region. Dette krever at du setter opp ditt eget Google Cloud/Vertex-prosjekt, deployer en backend og limer inn backend-URL og hemmelig nøkkel i «Google Vertex»-feltene på forsiden.<br>
- <strong>Mistral (EU)</strong> kan også være et GDPR-vennlig alternativ for notatgenerering når du (1) bruker EU-prosessering, (2) ber om <strong>Zero Data Retention</strong> fra Mistral support (<a href="https://mistral.ai/contact" target="_blank" rel="noopener noreferrer">mistral.ai/contact</a>), og (3) <strong>reserverer deg mot modelltrening</strong> i personverninnstillingene i Mistral-kontoen din (<a href="https://admin.mistral.ai/plateforme/privacy" target="_blank" rel="noopener noreferrer">admin.mistral.ai/plateforme/privacy</a>). Hvis du ikke har aktivert dette, bør du behandle Mistral som en «gråsone» for identifiserbare pasientdata.<br>
- For veiledning om oppsett relatert til Google Vertex og AWS Bedrock, klikk på «Guide»-hyperlenken ved siden av inntastingsfeltene på forsiden.<br><br>

<strong>Andre leverandører i denne appen</strong><br>
- Lemonfox og Deepgram er inkludert hovedsakelig for testing/eksperimentering og mulig ikke-klinisk bruk. For krevende klinisk diktering og notatgenerering er kvaliteten deres generelt lavere enn Soniox/OpenAI/Gemini, og GDPR-statusen deres avhenger helt av hvilke endepunkter (EU/globalt) og valg (som Zero Data Retention) du faktisk har aktivert hos leverandøren.<br>
- GPT-modellene fra OpenAI, Deepgrams standard-/globale endepunkter og Gemini 3 brukt via Google AI Studio innebærer typisk global infrastruktur og midlertidig datalagring. Disse oppsettene er ikke automatisk GDPR-kompatible for identifiserbare pasientdata og bør behandles som «gråsoner» med mindre du har eksplisitte avtaler og EU-dataresidens/ZDR dokumentert.<br>
- Tilsvarende kan ethvert valg av ikke-EU-endepunkt/-region (for hvilken som helst leverandør) flytte prosessering utenfor EU/EØS, så sørg for at endepunkt-/regionvalgene dine samsvarer med etterlevelseskravene dine.<br><br>

<strong>«Mest GDPR-optimaliserte» kombinasjon i denne appen</strong><br>
Hvis du bruker Soniox med et EU-endepunkt for tale-til-tekst og Google Vertex eller AWS Bedrock for notatgenerering, kan den tekniske dataflyten i denne appen holdes innenfor EU med null datalagring og ingen gjenbruk til trening på leverandørsiden.<br>
Et sterkt alternativ er Soniox (EU-endepunkt) + Mistral (EU-prosessering + godkjent Zero Data Retention + reservasjon mot modell-trening aktivert).<br><br>

<hr><br>

<strong>2. Hvordan fungerer webappen?</strong><br>
- Tar opp lyd via nettleserens opptaksfunksjon.<br>
- Behandler lyd i nettleserens minne (RAM).<br>
- Laster opp lydfil via sikker HTTPS-forbindelse til valgt tale-til-tekst-leverandør (f.eks. OpenAI, Soniox, Lemonfox, Mistral/Voxtral, Deepgram) ved bruk av din egen API-nøkkel fra leverandør.<br>
- Sender transkripsjonen (og eventuell tilleggstekst/prompt) videre til valgt tekstmodell (f.eks. GPT-5.1, GPT-4o, Gemini 3, Mistral Large, Lemonfox LLM eller Gemini 2.5 Pro via din egen Vertex-backend).<br>
- Nettleseren mottar notatutkastet direkte fra den aktuelle leverandøren (eller via din Vertex- eller AWS-backend) via en sikker/kryptert tilkobling.<br><br>

API-nøklene dine lagres bare midlertidig i nettleserens minne (SessionStorage). Skrur du av webappen eller lukker nettleseren, slettes API-nøklene fra nettleserens minne. For å bruke webappen igjen må du lime inn nøklene på nytt. Dette gir et ekstra sikkerhetslag mot uautorisert tilgang til nøklene dine.<br><br>

Webappen har ingen egen server som lagrer lyd eller tekst; all kommunikasjon går direkte mellom din nettleser og de tjenestene du selv har valgt (eller, for Google Vertex, via backend-URL-en du selv har satt opp i ditt eget Google Cloud-prosjekt).<br><br>

<hr><br>

<strong>3. Dine egne API-nøkler er påkrevd</strong><br>
All kommunikasjon med modell-leverandørene (OpenAI, Google Gemini, Soniox, Lemonfox, Deepgram, Mistral m.fl.) skjer direkte fra din nettleser ved bruk av dine personlige API-nøkler, eller via din egen Google Cloud- eller AWS backend (URL + hemmelig nøkkel) når du bruker Vertex-integrasjonen.<br><br>

Utvikleren av denne webappen har ingen tilgang til dine API-nøkler, din backend-URL/hemmelige nøkkel eller til innholdet du sender til leverandørene.<br><br>

<hr><br>

<strong>4. Databehandleravtaler (DPA) med leverandørene</strong><br>
Hvis du skal bruke API-tjenestene til behandling av personopplysninger (særlig pasientopplysninger), anbefales det at du inngår databehandleravtale (DPA) med hver leverandør du faktisk bruker, for eksempel:<br>
- OpenAI (tale-til-tekst og tekstgenerering)<br>
- Google (Gemini 3 via Google AI Studio, Gemini 2.5 Pro via Vertex AI)<br>
- Soniox (tale-til-tekst)<br>
- Deepgram (tale-til-tekst)<br>
- Mistral (Voxtral for tale-til-tekst, Mistral Large for tekst)<br>
- Lemonfox (Whisper v3 tale-til-tekst og Llama 3-baserte tekstmodeller)<br>

- Ved flere av disse så er DPA avtale allerede integrert i oppretting av bruker på deres plattformer.<br><br>

Når DPAs er på plass er utgangspunktet at du/virksomheten er behandlingsansvarlig, mens leverandørene (OpenAI, Google, Soniox, Mistral, Deepgram, Lemonfox osv.) er databehandlere. Du må selv kontrollere at avtalene faktisk dekker din bruk (helse, forskning, etc.).<br><br>

<hr><br>

<strong>5. DPIA og TIA – nødvendige risikovurderinger</strong><br><br>

<strong>DPIA (Data Protection Impact Assessment)</strong><br>
Påkrevd etter GDPR artikkel 35 når ny teknologi brukes til å behandle særlige kategorier opplysninger (som helseopplysninger). Formålet er å identifisere og redusere personvernrisikoer knyttet til selve behandlingen.<br><br>

Du bør blant annet:<br>
- Kartlegge hvilke data som behandles (lyd, tekst, metadata).<br>
- Beskrive formål (klinisk dokumentasjon, kvalitet, forskning osv.).<br>
- Vurdere risiko for pasientenes rettigheter og friheter.<br>
- Beslutte tekniske og organisatoriske tiltak (kryptering, tilgangsstyring, logging, opplæring osv.).<br><br>

<strong>TIA (Transfer Impact Assessment)</strong><br>
Påkrevd når personopplysninger overføres til land utenfor EØS (for eksempel USA). Formålet er å dokumentere at overføringen likevel gir et «vesentlig tilsvarende» vern som i EU/EØS (Schrems II, GDPR art. 44–49).<br><br>

Du bør blant annet:<br>
- Vurdere relevant lovgivning i mottakerland (f.eks. FISA 702, CLOUD Act).<br>
- Se dette opp mot hvor sensitive dataene er, og hvilke tekniske/kontraktuelle tiltak du bruker (kryptering, pseudonymisering, SCC, ZDR, EU-endepunkt osv.).<br>
- Konkludere eksplisitt på om overføringen er forsvarlig og om restrisikoen er akseptabel.<br><br>

Både DPIA og TIA bør være gjennomført, dokumentert og godkjent av deg/virksomheten før webappen brukes på reelle pasientdata.<br><br>

<hr><br>

<strong>6. Databehandling, datalagring og «GDPR-vennlighet» hos ulike leverandører</strong><br><br>

Nedenfor er en grov oversikt slik tjenestene typisk fungerer i dag. Dette kan endre seg, og du må alltid kontrollere oppdatert dokumentasjon og avtaleverk hos leverandøren før du konkluderer.<br><br>

<strong>Soniox (med EU-endepunkt)</strong><br>
Soniox tilbyr dataresidens i både USA og EU.<br>
Når et prosjekt er konfigurert med EU-region, behandles lyd og transkripsjoner innenfor denne regionen; systemdata som kontodata og fakturadata kan likevel håndteres globalt.<br>
For å ta i bruk EU-endepunktet i klinisk setting må du typisk kontakte Soniox (for eksempel via e-post til <strong>sales@soniox.com</strong>) og be om tilgang til EU-prosjekt/API-nøkkel og dokumentasjon på dataresidens. Tilgang på EU-endepunkt kan ta 1–2 dager å oppnå etter kontakt.<br>
Med EU-endepunktet aktivert er Soniox et godt alternativ for GDPR-tilpasset tale-til-tekst, men du må fortsatt gjøre DPIA/TIA og inngå nødvendig DPA.<br>
<ul>
  <li><strong>EU-region:</strong> Ja</li>
  <li><strong>Null data retention:</strong> Ja – i denne appen slettes lydopptaket umiddelbart etter at transkripsjonen er mottatt fra Soniox.</li>
  <li><strong>Trening:</strong> Ikke brukt</li>
</ul><br><br>

<strong>AWS Bedrock(Claude Sonnet 4.5 + Claude Haiku 4.5 + Claude Opus 4.5 via EU-backend)</strong><br>
I denne appen brukes AWS Bedrock kun via din egen backend-URL og hemmelige nøkkel, som du legger inn under «AWS Bedrock» på forsiden.<br>
Hvis man følger setup-guiden forsiden, så vil AWS Bedrock-prosjektet ditt konfigureres til en EU-region (europe-west4) og med zero data retention / ingen gjenbruk av data til trening. Forespørsler og svar behandles derfor innenfor EU, og forespørselsdata vil ikke lagres lenger enn nødvendig for å levere svaret, jf. AWS sin dokumentasjon.<br>
Dette oppsettet kan dermed brukes som et EU-resident, null-retensjonsalternativ for notatgenerering.<br>
For en praktisk gjennomgang av hvordan du oppretter prosjektet, velger region og deployer backend-en som brukes av denne appen, kan du klikke på guide-knappen i «AWS Bedrock»-overskriften på forsiden.<br>
<ul>
  <li><strong>EU-region:</strong> Ja</li>
  <li><strong>Null data retention:</strong> Ja</li>
  <li><strong>Trening:</strong> Ikke brukt for trening</li>
</ul><br><br>

<strong>Google Vertex AI (Gemini 2.5 Pro via EU-backend)</strong><br>
I denne appen brukes Google Vertex AI kun via din egen backend-URL og hemmelige nøkkel, som du legger inn under «Google Vertex» på forsiden.<br>
Hvis man følger setup-guiden til Google Vertex, så vil vertex-prosjektet ditt konfigureres til en EU-region (europe-west1) og med zero data retention / ingen gjenbruk av data til trening. Forespørsler og svar behandles derfor innenfor EU, og forespørselsdata vil ikke lagres lenger enn nødvendig for å levere svaret, jf. Googles dokumentasjon.<br>
Dette oppsettet kan dermed brukes som et EU-resident, null-retensjonsalternativ for notatgenerering.<br>
For en praktisk gjennomgang av hvordan du oppretter prosjektet, velger region og deployer backend-en som brukes av denne appen, kan du klikke på guide-knappen i «Google Vertex»-overskriften på forsiden.<br>
<ul>
  <li><strong>EU-region:</strong> Ja</li>
  <li><strong>Null data retention:</strong> Ja</li>
  <li><strong>Trening:</strong> Ikke brukt for trening</li>
</ul><br><br>

<strong>Mistral (Voxtral for tale-til-tekst, Mistral Large 3 for tekst-generering)</strong><br>
Mistral er et EU-basert selskap i Frankrike, og standardoppsettet deres er at API-data behandles/hostes i EU som utgangspunkt (med egne US-endepunkter dersom man eksplisitt velger det).<br>
For høyere GDPR-samsvar kan du be Mistral om <strong>Zero Data Retention (ZDR)</strong> via support: <a href="https://mistral.ai/contact" target="_blank" rel="noopener noreferrer">mistral.ai/contact</a>. Når dette er innvilget, lagres ikke API-data utover det som er strengt nødvendig for å levere svaret.<br>
Du bør også <strong>reservere deg mot modelltrening</strong> i personverninnstillingene i Mistral-kontoen din: <a href="https://admin.mistral.ai/plateforme/privacy" target="_blank" rel="noopener noreferrer">admin.mistral.ai/plateforme/privacy</a>.<br>
Kombinasjonen <strong>EU-behandling + innvilget ZDR + opt-out av modelltrening</strong> gjør Mistral (Voxtral + Mistral Large 3) til et av de mest «GDPR-vennlige» alternativene i denne appen.<br>
<ul>
  <li><strong>EU-region:</strong> Ja</li>
  <li><strong>Null data retention:</strong> Nei – standard er 30 dager, men du kan få aktivert Zero Data Retention ved å kontakte Mistral support (Mistral Help Center).</li>
  <li><strong>Trening:</strong> Opt-out tilgjengelig – standard er at data kan brukes til modelltrening, men du kan skru dette av i Mistral-kontoen din (personverninnstillinger).</li>
</ul><br><br>

<strong>Gemini 3 (Google AI Studio)</strong><br>
Gemini 3 brukt via Google AI Studio / Gemini API med ren API-nøkkel behandles normalt på Googles globale infrastruktur, noe som typisk innebærer at data kan overføres utenfor EU/EØS.<br>
Google kan lagre forespørselsdata midlertidig for misbruksdeteksjon, stabilitet og forbedring, avhengig av innstillinger og avtale, og endepunktet er som hovedregel ikke eksplisitt låst til EU-region.<br>
Bruk av Gemini 3 via Google AI Studio vil derfor ofte være et juridisk «gråområde» for identifiserbare pasientdata, med mindre du har eksplisitte kontraktsmessige garantier om EU-dataresidens og lagringstid, dokumentert i DPIA/TIA. Denne appen tilbyr i stedet en egen Google Vertex-integrasjon for EU-region (se over).<br>
<ul>
  <li><strong>EU-region:</strong> Nei – global databehandling</li>
  <li><strong>Null data retention:</strong> Nei – standard er datalagring (oppgitt rundt 55 dager) med mindre annet er avtalt/konfigurert.</li>
  <li><strong>Trening:</strong> Varierer – avhenger av innstillinger/avtale (vurder som ikke-GDPR-kompatibelt uten eksplisitte garantier).</li>
</ul><br><br>

<strong>OpenAI</strong><br>
OpenAI oppgir at API-data ikke brukes til modelltrening som standard, men kan lagres midlertidig (typisk opptil 30 dager) for misbruksdeteksjon og feilsøking.<br>
OpenAI har introdusert dataresidens i Europa for enkelte API-kunder og produkter, men dette krever spesifikke avtaler/konfigurasjon.<br>
Slik denne webappen normalt er satt opp, vil kall til OpenAI ofte gå til globale endepunkter (typisk US), noe som innebærer overføring utenfor EU/EØS.<br><br>

Bruk av OpenAI med pasientdata befinner seg dermed ofte i et juridisk «gråområde» med mindre du har:<br>
- en tydelig DPA,<br>
- dokumentert DPIA/TIA som eksplisitt dekker overføringen, og<br>
- eventuelle særordninger om EU-dataresidens/ZDR dersom dette er tilgjengelig og faktisk aktivert. Dette kan dog være utfordrende å få godkjenning for.<br>
<ul>
  <li><strong>EU-region:</strong> Nei – standardoppsett er globale endepunkter</li>
  <li><strong>Null data retention:</strong> Nei – standard er midlertidig lagring (typisk opptil 30 dager)</li>
  <li><strong>Trening:</strong> Ikke brukt (standard for API)</li>
</ul><br><br>

<strong>Deepgram (Nova-3)</strong><br>
Deepgram har historisk brukt globale endepunkter, men tilbyr nå dedikerte og EU-spesifikke endepunkter.<br>
Hvis du kun bruker standard/globalt endepunkt, vil lyddata typisk prosesseres utenfor EU/EØS.<br>
Deepgram har også EU-hostede tjenester og beskriver ulike compliance-oppsett (inkludert for helse), men det krever at du bevisst konfigurerer riktig endepunkt (f.eks. api.eu.deepgram.com) og har avtaler som dekker dataresidens og eventuelle lagringstider.<br>
Slik appen ofte brukes i dag, kan Deepgram derfor – på samme måte som OpenAI – innebære at data sendes ut av EU hvis du ikke eksplisitt konfigurerer EU-endepunkt og har juridiske vurderinger på plass.<br>
<ul>
  <li><strong>EU-region:</strong> Nei – standardoppsett kan være globalt (EU-endepunkt krever bevisst valg)</li>
  <li><strong>Null data retention:</strong> Avhenger – kan avtales ved å kontakte Deepgram support</li>
  <li><strong>Trening:</strong> Ikke brukt (standard)</li>
</ul><br><br>

<strong>Lemonfox (tale-til-tekst og tekstgenerering)</strong><br>
Lemonfox er EU-basert og markedsfører seg som fullt GDPR-kompatibel.<br>
Tale-til-tekst (Whisper v3) og Llama 3-baserte tekstmodeller prosesseres i EU, og de oppgir at lyd/tekst slettes kort tid etter prosessering (ingen gjenbruk til trening).<br>
Dette gjør Lemonfox til et relativt «GDPR-vennlig» alternativ for både tale-til-tekst og tekstgenerering, forutsatt at du likevel gjør DPIA/TIA og har tilstrekkelige avtaler.<br>
Modellene fra Lemonfox er noe eldre og utdaterte sammenliknet med andre alternative modeller, og er lagt til i denne webappen av testformål.<br><br>

<strong>Kort oppsummert om modellene i denne appen:</strong><br><br>

Mest «GDPR-optimal» kombinasjon i denne appen:<br>
- Soniox med EU-endepunkt til tale-til-tekst.<br>
- Mistral Large 3, Google Vertex (Gemini 2.5 Pro) eller AWS Bedrock(Claude modellene) til notatgenerering.<br><br>

Mer krevende/«gråsoner» for pasientdata (med mindre du har særskilte avtaler og EU-residens/ZDR på plass):<br>
- OpenAI via globale endepunkter.<br>
- Deepgram via globale endepunkter.<br>
- Gemini 3 via globalt Google AI Studio/Gemini API uten eksplisitt EU-lock.<br><br>

I alle tilfeller er det du/virksomheten som må dokumentere at løsning og leverandørvalg er i tråd med GDPR, helsepersonelloven og Normen.<br><br>

<hr><br>

<strong>7. Forutsetninger for potensiell klinisk bruk</strong><br>
Din vurdering er avgjørende: Lovligheten av å bruke dette verktøyet med pasientdata avhenger utelukkende av din egen grundige vurdering av både appen og hver enkelt leverandør du kobler til (OpenAI, Google AI studio, AWS Bedrock, Google Vertex, Soniox, Lemonfox, Mistral, Deepgram osv.).<br><br>

Minimumskrav før bruk med pasientdata bør være:<br>
- Gyldige databehandleravtaler (DPA) med alle leverandører du faktisk bruker.<br>
- Virksomhetsspesifikk DPIA og TIA som er gjennomført, godkjent og konkluderer med akseptabel restrisiko.<br>
- Tydelig beslutning om hvilke modeller/endepunkter som kan brukes til pasientdata (for eksempel å begrense pasientrelatert bruk til Soniox med EU-endepunkt for tale-til-tekst og Mistral Large 3, Google Vertex(Gemini 2.5 Pro) eller AWS Bedrock(Claude modellene) til notatgenerering.<br>
- Ansvar for innhold: Du er ansvarlig for alt innhold du sender til leverandørene via dine API-nøkler/backend, og for å kvalitetssikre notatutkastet før det eventuelt kopieres inn i pasientjournal.<br><br>

<hr><br>

<strong>8. Oversikt over datalagring</strong><br><br>

(Dette gjelder hvordan webappen håndterer data; i tillegg kommer lagring hos hver API-leverandør, som du må kontrollere selv.)<br><br>

<strong>Dine API-nøkler og Vertex-backend (OpenAI, Soniox, Gemini, Lemonfox, Deepgram, Mistral osv.)</strong><br>
- Hvor lagres de? I SessionStorage-minne i din nettleser.<br>
- Hvor lenge? Til du avslutter webappen eller lukker nettleseren.<br>
- Hvem har tilgang? Kun deg og din nettleser.<br><br>

<strong>Lydsegmenter under opptak</strong><br>
- Hvor lagres de? Nettleserens minne (RAM).<br>
- Hvor lenge? Kun under opptak/prosessering. Webappen lagrer ikke lyd permanent.<br>
- Hvem har tilgang? Kun deg og din nettleser før de sendes til valgt tale-til-tekst-API.<br><br>

<strong>Transkribert tekst/notatutkast hos leverandørene</strong><br>
- Hvor lagres det? Hos valgt API-leverandør (OpenAI, Google, Soniox, Lemonfox, Mistral, Deepgram osv.) i deres skyinfrastruktur, eller i ditt eget Google Cloud eller AWS Bedrock-prosjekt.<br>
- Hvor lenge? Varierer – f.eks. oppgir OpenAI at data kan lagres inntil ca. 30 dager for misbruksdeteksjon; enkelte EU-baserte leverandører (som Lemonfox/Mistral med ZDR, Soniox EU og Vertex med zero data retention) sletter raskere. Du må selv sjekke gjeldende policy for hver leverandør og din egen Vertex-konfigurasjon.<br>
- Hvem har tilgang? Deg via API-/backend-svarene, og den aktuelle leverandøren i den perioden data teknisk sett lagres.<br><br>

<strong>Instruksjoner/Prompter i selve webappen</strong><br>
- Hvor lagres de? Lokalt i din nettleser (typisk LocalStorage/SessionStorage). Hvis du bruker samme nettleser, samme PC og samme nøkler/backend, vil promptene fortsatt være tilgjengelige for deg neste gang.<br>
- Hvor lenge? Til du sletter dem eller rydder nettleserdata.<br>
- Hvem har tilgang? Du og nettleseren din.<br><br>

<hr><br>

<strong>9. Kildekode</strong><br>
Kildekoden er åpen og kjører lokalt i din nettleser. Det finnes ingen skjulte bakdører som sender data til utviklerens servere, ut over statistikk i forhold til hvor ofte appen brukes, via antall klikk osv., men ingen sensitiv informasjon om bruker eller data bruker sender/mottar.<br>
`,

  
  aboutModalHeading: "Om",
aboutModalText: `Denne nettsiden ble opprettet for å gi helsepersonell og andre brukere direkte tilgang til høykvalitets tale-til-tekst og klinisk notatgenerering – uten unødvendige kostnader eller mellomledd.<br><br>
Ved å bruke dine egne API-nøkler til leverandører av tale-til-tekst og tekstgenereringsmodeller kobler du deg direkte til kilden for teknologien. Dette betyr at du kun betaler den faktiske bruksprisen fastsatt av hver enkelt leverandør, uten påslag eller abonnementsavgifter fra denne nettsiden.<br><br>
Mange eksisterende leverandører tilbyr lignende tjenester, men tar betydelig mer – ofte mange ganger den reelle kostnaden for den underliggende teknologien. Denne plattformen lar deg bruke de samme modellene tilnærmet til «innkjøpspris», slik at kostnaden per konsultasjon blir svært lav.<br><br>
<strong>Nøkkelpunkter:</strong><br>
• Ingen abonnement, ingen konto kreves på denne nettsiden.<br>
• Du betaler kun direkte til API-leverandørene for det du bruker (tale-til-tekst og tekstgenerering).<br>
• Nettsiden i seg selv er helt gratis å bruke.<br><br>
`,
 
  guideModalHeading: "API nøkkel - Hvordan lage",
guideModalText: `Hvordan skaffe API-nøkler:<br><br>
For å bruke tale-til-tekst og notatgenereringsmodellene i denne appen, må du anskaffe tilgang til minst èn tale-til-tekst, og èn tekst-modell.<br><br>

<strong>Tale-til-tekst-modeller i appen:</strong><br>
- OpenAI: gpt-4o-transcribe<br>
- Soniox v4<br>
- Lemonfox Speech-to-Text (Whisper v3-basert)<br>
- Voxtral Mini<br>
- Deepgram Nova-3<br><br>

<strong>Tekst/notat-genereringp:</strong><br>
- GPT-5.4<br>
- GPT-5.2<br>
- GPT-5.1<br>
- Claude sonnet 4.5, Claude Opus 4.5 og Claude Haiku 4.5(via AWS Bedrock)<br>
- Gemini 2.5 pro(via Google Vertex)<br>
- Lemonfox text generation (Llama 3-based models)<br>
- Mistral Large<br>
- Gemini 3 (via Google AI studio)<br><br>

<strong>Anbefalte modeller i forhold til GDPR:</strong><br>
- Av de tilgjengelige modellene i denne webappen, så er det Soniox for tale-til-tekst, samt Mistral Large 3(Via Mistral), Google Vertex(Gemini 2.5 pro) og AWS Bedrock(Claude) for tekst/notat-generering som vil være GDPR godkjente.<br>
- De andre modellene kan ha data prosessering utenfor EUs grenser og midlertidig data-retention, som gjør de ugunstige for bruk i klinisk setting med tanke på GDPR og datatilsynets norm.<br>
- For bruk av denne app i klinisk setting er det derfor sterkt anbefalt å bruke Soniox for tale-til-tekst, og AWS Bedrock, Google Vertex eller Mistral for notatgenerering. Av tekstmodellene, så er Claude Opus 4.5 desidert best, etterfulgt av Gemini 2.5 pro og Claude Sonnet 4.5 på delt 2. plass, med Mistral på 3. plass.<br><br>

<strong>Soniox</strong><br>
– For tale til tekst.<br>
– Lag en bruker på Soniox:<br>
https://soniox.com<br><br>
– Generer en Soniox API-nøkkel og kjøp/last opp credits (samme prinsipp som hos OpenAI)<br>
– Lagre nøkkelen trygt og lim den inn i feltet «Soniox API key» på forsiden<br>
– Du kan nå bruke tale-til-tekst-modellen Soniox (svært god og rimelig tale-til-tekst-modell, anbefales)<br>
– For å få tilgang til API nøkkel med EU-endepunkt (GDPR-vennlig): send e-post til sales@soniox.com og be om EU API-nøkkel for å kunne oppfylle GDPR krav med tanke på bruk av tale-til-tekst i klinisk pasient–lege-setting.<br><br>
&nbsp;&nbsp;Eksempel email:<br>
&nbsp;&nbsp;"Greetings!<br><br>
&nbsp;&nbsp;I work as a family doctor in Norway, and I wish to use the Soniox speech-to-text API to transcribe medical doctor-patient consultations in a clinical setting. In order for me to do this in a way that complies with my local GDPR regulations, I need to have access to a project/API-key with EU regional endpoint. I hope this is possible, as I am highly satisfied with the transcription quality of your speech-to-text model so far.<br><br>
&nbsp;&nbsp;Regards<br>
&nbsp;&nbsp;[Dr. "navn"]"<br><br>
– På hovedsiden kan du velge mellom EU- og US-endepunkt i nedtrekksmenyen når du bruker Soniox<br>
- Bruk av Soniox i denne webappen vil ha zero data retention. Dette sammen med API nøkkel med EU endepunkt, gjør Soniox optimal i forhold til GDPR-krav. Samtidig er Soniox også den klart beste og billigste av alle tale-til-tekst modellene som finnes per i dag, noe som gjør den til et klart førstevalg ved bruk av tale-til-tekst i denne appen.<br><br>

<strong>AWS Bedrock (Claude modeller - Zero data retention + EU-endepunkt)</strong><br>
– For notatgenerering.<br>
– Dette er et noe mer avansert oppsett enn de fleste andre alternativene i appen, men kan konfigureres slik at det gir et fullt GDPR-tilpasset oppsett.<br>
– For komplett steg-for-steg-oppsett: klikk på <a href="#" data-open-guide="bedrock"><strong>«Guide»</strong></a>-lenken ved siden av <strong>AWS Bedrock</strong>-overskriften på forsiden.<br>
– Når oppsettet er ferdig, vil du få en <strong>backend URL</strong> og en <strong>secret key</strong>, som du må lime inn i <strong>AWS Bedrock</strong>-feltene på forsiden av webappen.<br><br>

<strong>Google Vertex (Gemini 2.5 Pro – Zero data retention + EU-endepunkt)</strong><br>
– For notatgenerering.<br>
– Dette er et mer avansert oppsett for deg som vil bruke Gemini via Google Cloud / Vertex AI med regionalt EU-endepunkt (f.eks. europe-west1 eller europe-west4).<br>
– Kort fortalt: Du oppretter et eget Google Cloud-prosjekt, aktiverer Vertex AI, kobler det til en faktureringskonto og deployer en liten backend-funksjon (Cloud Run) som gir deg en HTTPS-adresse (https://…run.app).<br>
– I denne webappen limer du inn denne adressen i feltet «Vertex backend URL (https://…run.app)» og den hemmelige nøkkelen (BACKEND_SECRET) i feltet «Vertex backend secret» på forsiden.<br>
– All bruk av Gemini 2.5 Pro går da via ditt eget prosjekt; både fakturering og databehandling styres av deg, og du kan velge EU-region for bedre GDPR-tilpasning.<br>
– Oppsettet kan oppleves litt teknisk, så for en detaljert steg-for-steg-veiledning kan du klikke på <a href="#" data-open-guide="vertex"><strong>«Guide»</strong></a>-lenken ved siden av «Google Vertex»-overskriften over disse feltene på forsiden.<br><br>

<strong>Mistral</strong><br>
- Anbefalt for notatgenerering.<br>
– Lag en bruker på Mistral AI og logg inn på konsollen:<br>
https://console.mistral.ai<br><br>
– Sett opp betaling om nødvendig, og gå deretter til «API keys» i konsollen for å generere en Mistral API-nøkkel<br>
– Lagre nøkkelen trygt og lim den inn i feltet «Mistral API key» på forsiden<br>
– Tekstmodell: <strong>Mistral Large 3 (mistral-large-2512)</strong><br>
– EU-behandling / europeisk databehandling er standard hos Mistral (du trenger ikke å søke om EU-endepunkt).<br>
– <strong>Viktig for GDPR ved klinisk bruk (identifiserbare pasientdata):</strong> For å bruke Mistral på en måte som er mest mulig i tråd med GDPR i en pasient–lege-setting, bør du ha <strong>Zero Data Retention (ZDR)</strong> aktivert for kontoen din, og du bør <strong>reservere deg mot modelltrening</strong>.<br>
– For å få <strong>ZDR(zero data retention)</strong> aktivert: bruk Mistral sitt kontaktskjema: <a href="https://mistral.ai/contact" target="_blank" rel="noopener noreferrer">mistral.ai/contact</a><br>
&nbsp;&nbsp;• I skjemaet holder det som regel å skrive en kort begrunnelse. Forslag (engelsk):<br>
&nbsp;&nbsp;&nbsp;&nbsp;“I wish to use your API for medical journal note generation in a patient–doctor setting, and wish to comply with my local GDPR regulations. I therefore wish to have Zero Data Retention enabled for my account.”<br>
&nbsp;&nbsp;• De svarer ofte innen 1–2 dager (varierer).<br>
– For å <strong>opt-out av modelltrening</strong>: gå til personverninnstillingene i Mistral-kontoen: <a href="https://admin.mistral.ai/plateforme/privacy" target="_blank" rel="noopener noreferrer">admin.mistral.ai/plateforme/privacy</a><br>
– Når du har <strong>EU-behandling (default) + innvilget ZDR + opt-out av modelltrening</strong>, vil bruk av Mistral sin API/modell ha en høy grad av GDPR-tilpasning (må likevel dokumenteres i DPIA/TIA der dette kreves).<br><br>


<strong>OpenAI</strong><br>
- For tale-til-tekst og notatgenerering.<br>
– Lag en bruker på OpenAI:<br>
https://platform.openai.com<br><br>
– Generer en API-nøkkel og sett inn kreditt på kontoen din<br>
– Lagre API-nøkkelen trygt et sted (lokalt på PC-en, tekstfil, passordmanager, Dropbox osv.)<br>
– Lim inn nøkkelen i feltet «OpenAI API key» på forsiden<br>
– Du kan nå bruke OpenAI-modellene i appen:<br>
• Tale-til-tekst: gpt-4o-transcribe (velg «OpenAI» i Opptaksmodul-nedtrekksmeny på hovedsiden)<br>
• Tekstgenerering: chatgpt-4-latest, GPT-5.1<br><br>


<strong>Google Gemini 3 pro</strong><br>
. For notatgenerering.<br>
– Lag bruker / logg inn på Google AI Studio:<br>
https://aistudio.google.com<br><br>
– Generer en Gemini API-nøkkel<br>
– Du får normalt noen gratis credits ved opprettelse av bruker (se oversikt inne i AI Studio)<br>
– Lagre nøkkelen trygt og lim den inn i feltet «Google Gemini API key» på forsiden<br>
– Tekstmodell: Gemini 3 (per nå en av de aller beste tekstmodellene for tekstgenerering)<br><br>


<strong>Lemonfox</strong><br>
– Lag en bruker på Lemonfox:<br>
https://www.lemonfox.ai<br><br>
– Generer en API-nøkkel i Lemonfox-dashbordet (for tale-til-tekst og/eller tekstmodell, avhengig av hva du bruker i appen)<br>
– Lemonfox tilbyr en svært rimelig speech-to-text-API, ofte med gratis bruk første måned – se pris-/produktsiden for detaljer. EU-endepunkt (GDPR-vennlig)<br>
– Lagre nøkkelen trygt og lim den inn i «Lemonfox API key»-feltet på forsiden<br>
– Du kan nå bruke:<br>
• Tale-til-tekst-modell: Lemonfox Speech-to-Text (Whisper v3-basert, billig og rask)<br>
• Tekstgenerering: Lemonfox LLM (Llama 3-baserte modeller)<br><br>

<strong>Deepgram</strong><br>
– Lag en bruker på Deepgram:<br>
https://deepgram.com<br><br>
– Gå til utvikler-/API-sidene («Developers» / «Docs») og generer en API-nøkkel i Deepgram-konsollen<br>
– Lagre nøkkelen trygt og lim den inn i feltet «Deepgram API key» på forsiden<br>
– Du kan nå bruke tale-til-tekst-modellen Deepgram Nova-3 i appen<br><br>
`,  
  priceButton: "Pris",
  priceModalHeading: "Kostnadsinformasjon",
  priceModalText: `
<div>
  <p><strong>Kostnadsinformasjon</strong></p>

  <p>
    Du betaler kun for det du faktisk bruker, direkte til hver leverandør (OpenAI, Soniox, Google Gemini,
    Lemonfox, Deepgram, Mistral). Det er ingen abonnement eller påslag i denne appen. Prisene under er
    ca.-tall i USD med omregning til NOK (her er det brukt omtrent 1 USD ≈ 11 NOK).
  </p>

  <p><strong>1. Tale-til-tekst<br>(pris per minutt lyd)</strong></p>

  <p><strong>OpenAI – gpt-4o-transcribe</strong><br>
  Ca. 0.006 USD per minutt (≈ 0,07 NOK/min).<br>
  15 minutters konsultasjon: ca. 0.09 USD ≈ 1,00 NOK.</p>

  <p><strong>Soniox (anbefales – best kvalitet og pris)</strong><br>
  Ca 0.0017 USD per minutt.<br>
  15 minutters konsultasjon: ca. 0.025 USD ≈ 0,30 NOK.</p>

  <p><strong>Lemonfox – Whisper v3</strong><br>
  Ca. 0.50 USD for 3 timer lyd ≈ 0.17 USD per time ≈ 0.0028 USD per minutt.<br>
  15 minutters konsultasjon: ca. 0.042 USD ≈ 0,45 NOK.</p>

  <p><strong>Mistral</strong><br>
  API-prising starter rundt 0.001 USD per minutt.<br>
  15 minutters konsultasjon: ca. 0.015 USD ≈ 0,17 NOK.</p>

  <p><strong>Deepgram – Nova-3</strong><br>
  Ca 0.004 USD per minutt.<br>
  15 minutters konsultasjon = 0,60 NOK.</p>

  <p><strong>2. Tekstgenerering – typiske priser (per 1 million tokens)</strong></p>
  
  <p><strong>AWS Bedrock – Claude Opus 4.5</strong><br>
  Input: 5 USD (≈ 55 NOK)<br>
  Output: 25 USD (≈ 275 NOK)</p>

  <p><strong>AWS Bedrock – Claude Sonnet 4.5</strong><br>
  Input: 3 USD (≈ 33 NOK)<br>
  Output: 15 USD (≈ 165 NOK)</p>

  <p><strong>AWS Bedrock – Claude Haiku 4.5</strong><br>
  Input: 1 USD (≈ 11 NOK)<br>
  Output: 5 USD (≈ 55 NOK)</p>

  <p><strong>Google Vertex – Gemini 2.5 Pro</strong><br>
  Input: 1.25 USD (≈ 13,75 NOK)<br>
  Output: 10 USD (≈ 110 NOK)</p>

  <p><strong>Mistral – Mistral Large 3 (mistral-large-2512)</strong><br>
  Input: 0.5 USD (≈ 5,50 NOK)<br>
  Output: 1.5 USD (≈ 16,50 NOK)</p>

  <p><strong>OpenAI – GPT-5.2</strong><br>
  Input: 1.75 USD (≈ 19,25 NOK)<br>
  Output: 14 USD (≈ 154 NOK)</p>

  <p><strong>OpenAI – GPT-5.1</strong><br>
  Input: 1.25 USD (≈ 13,75 NOK)<br>
  Output: 10 USD (≈ 110 NOK)</p>

  <p><strong>OpenAI – chatgpt-4o-latest</strong><br>
  Input: 5 USD (≈ 55 NOK)<br>
  Output: 15 USD (≈ 165 NOK)</p>

  <p><strong>Google Gemini 3</strong><br>
  Input: ca. 2 USD (≈ 22 NOK)<br>
  Output: ca. 12 USD (≈ 132 NOK)</p>

  <p><strong>Lemonfox – Llama 3-baserte modeller</strong><br>
  Typisk rundt 0.50 USD per 1M LLM-tokens input og output (≈ 5,50 NOK).</p>

  <p><strong>3. Hva er tokens – og hvor mye koster 1 konsultasjon?</strong></p>

  <p>Modellene regner tekst i tokens, ikke i rene ord.</p>

  <ul>
    <li>1 token ≈ 4 tegn ≈ ¾ ord</li>
    <li>100 tokens ≈ 75 ord</li>
    <li>1 000 tokens ≈ 750 ord</li>
  </ul>

  <p>
    15 min konsultasjon ca:<br>
    2200 input-tokens per 15-minutters konsultasjon (hele transkripsjonen + instruksjon/prompt-tekst som sendes inn),<br>
    450 output-tokens i det ferdige notatet,<br>
    totalt ca. 2650 tokens per konsultasjon.<br><br>
    Dette betyr at 1 million tokens gir omtrent 350–400 konsultasjoner i denne bruken
    (avhengig av lengde og detaljer).
  </p>

  <p><strong>4. Eksempel: kostnad per 15-minutters konsultasjon</strong></p>

  <p><em>Tale-til-tekst (ca.-priser per 15 min):</em></p>
  <ul>
    <li>OpenAI gpt-4o-transcribe: ≈ 1,00 NOK</li>
    <li>Soniox: ≈ 0,30 NOK</li>
    <li>Lemonfox (Whisper v3): ≈ 0,45 NOK</li>
    <li>Voxtral (Mistral): ≈ 0,17 NOK</li>
    <li>Deepgram Nova-3 (batch): ≈ 0,70 NOK</li>
  </ul>

  <p><em>Notatgenerering (2200 input + 450 output tokens):</em></p>
  <ul>
    <li>Mistral Large 3: ≈ 0,02 NOK per notat</li>
    <li>AWS Bedrock – Claude Opus 4.5: ≈ 0,24 NOK per notat</li>
    <li>AWS Bedrock – Claude Sonnet 4 / 4.5: ≈ 0,15 NOK per notat</li>
    <li>AWS Bedrock – Claude Haiku 4.5: ≈ 0,05 NOK per notat</li>
    <li>Google Vertex – Gemini 2.5 Pro: ≈ 0,08 NOK per notat</li>
    <li>GPT-5.2: ≈ 0,11 NOK per notat</li>
    <li>GPT-5.1: ≈ 0,08 NOK per notat</li>
    <li>Lemonfox LLM: ≈ 0,02 NOK per notat</li>
    <li>chatgpt-4o-latest: ≈ 0,20 NOK per notat</li>
    <li>Gemini 3: ≈ 0,11 NOK per notat</li>
  </ul>

  <p><em>Noen typiske kombinasjoner for én 15-minutters konsultasjon:</em></p>

  <ul>
    <li>Soniox + Mistral Large 3<br>
      ≈ 0,30 NOK (STT) + 0,02 NOK (notat) ≈ 0,32 NOK per konsultasjon
    </li>
    <li>Soniox + Claude Sonnet 4.5<br>
      ≈ 0,30 NOK (STT) + 0,15 NOK (notat) ≈ 0,45 NOK per konsultasjon
    </li>
    <li>Soniox + Claude Opus 4.5<br>
    ≈ 0,30 NOK (STT) + 0,24 NOK (notat) ≈ 0,54 NOK per konsultasjon
    </li>
    <li>Soniox + Google Vertex (Gemini 2.5 Pro)<br>
      ≈ 0,30 NOK (STT) + 0,08 NOK (notat) ≈ 0,38 NOK per konsultasjon
    </li>
    <li>OpenAI (gpt-4o-transcribe) + GPT-5.1<br>
      ≈ 1,00 NOK (STT) + 0,08 NOK (notat) ≈ 1,08 NOK per konsultasjon
    </li>
    <li>OpenAI (gpt-4o-transcribe) + GPT-5.2<br>
      ≈ 1,00 NOK (STT) + 0,11 NOK (notat) ≈ 1,11 NOK per konsultasjon
    </li>
  </ul>

  <p>
    Med andre ord: tekstmodellen er ekstremt billig – det er tale-til-tekst-delen som dominerer kostnaden.
  </p>

  <p><strong>5. Eksempel: månedskostnad ved jevn bruk</strong></p>

  <p>
    Anta:<br>
    20 konsultasjoner per dag<br>
    4 dager per uke<br>
    4 uker per måned<br>
    ⇒ ca. 320 konsultasjoner per måned (≈ 80 timer lyd).
  </p>

  <p>Da får du omtrent:</p>

  <ul>
    <li>Soniox + Mistral Large 3<br>
      ≈ 9 USD ≈ 95 NOK per måned
    </li>
    <li>Soniox + Claude Sonnet 4.5<br>
      ≈ 12 USD ≈ 135 NOK per måned
    </li>
    <li>Soniox + Claude Opus 4.5<br>
      ≈ 16 USD ≈ 173 NOK per måned
    </li>
    <li>Soniox + Google Vertex (Gemini 2.5 Pro)<br>
      ≈ 10 USD ≈ 115 NOK per måned
    </li>
    <li>OpenAI gpt-4o-transcribe + GPT-5.1<br>
      ≈ 31 USD ≈ 340 NOK per måned
    </li>
    <li>OpenAI gpt-4o-transcribe + GPT-5.2<br>
      ≈ 32 USD ≈ 355 NOK per måned
    </li>
  </ul>

  <p>
    Hvis du ikke bruker tjenesten (ferie, sykdom, permisjon osv.) påløper ingen faste kostnader,
    du betaler kun for faktisk forbruk hos den enkelte leverandør.
  </p>
</div>
`,

};

export const transcribeTranslations = {
  pageTitle: "Transkripsjonsverktøy med annonser og guideoverlegg",
  openaiUsageLinkText: "Kostnadsoversikt",
  openaiWalletLinkText: "Kreditt",
  btnFunctions: "Funksjoner",
  btnGuide: "Guide",
  btnNews: "Status/Oppdateringer",
  backToHome: "Tilbake til forsiden",
  recordingAreaTitle: "Opptaksområde",
  recordTimer: "Opptakstimer: 0 sek",
  transcribeTimer: "Fullføringstimer: 0 sek",
  transcriptionPlaceholder: "Transkripsjonsresultatet vil vises her...",
  supplementaryInfoPlaceholder: "Supplerende informasjon (valgfritt)",
  startButton: "Start opptak",
  readFirstText: "Les først! ➔",
  stopButton: "Stopp/Fullfør",
  pauseButton: "Pause opptak",
  statusMessage: "Velkommen! Klikk på \"Start opptak\" for å begynne.",
  noteGenerationTitle: "Notatgenerering",
  generateNoteButton: "Generer notat",
  noteTimer: "Fullføringstimer: 0 sek",
  generatedNotePlaceholder: "Generert notat vil vises her...",
  customPromptTitle: "Tilpasset prompt",
  promptExportButton: "Eksporter",
  promptImportButton: "Importer",
  promptSlotLabel: "Prompt Slot:",
  customPromptPlaceholder: "Skriv inn tilpasset prompt her",
  adUnitText: "Din annonse her",
  guideHeading: "Guide & Instruksjoner",
guideText: `Velkommen til <strong>Transcribe Notes</strong>. Denne applikasjonen lar helsepersonell, terapeuter og andre fagpersoner ta opp og transkribere konsultasjoner, samt generere profesjonelle notater ved hjelp av en AI-basert notatgenerator.<br><br>

<strong>Slik bruker du funksjonene:</strong><br><br>

<ul>
  <li><strong>Opptak:</strong> Pasientens samtykke må alltid innhentes før opptak. Velg ønsket tale-til-tekst modell fra nedtrekksmenu, deretter klikk på "Start opptak" for å begynne opptak..<br><br>
  
  <strong><u>Viktig:</u> Opptaksfunksjonen fungerer ikke i alle nettlesere. Vi anbefaler derfor å bruke <strong>Google Chrome</strong> eller <strong>Microsoft Edge</strong>.</strong></li><br>

  <li><strong>Pause og gjenoppta:</strong> Du kan bruke "Pause"-knappen til midlertidig å stoppe opptaket, for eksempel dersom konsultasjonen blir avbrutt eller du trenger å forlate kontoret et øyeblikk. Når du trykker på "Pause", lastes det aktuelle lydsegmentet opp og transkriberes, og opptaket settes på pause. Når du er klar til å fortsette, klikker du på "Fortsett", og opptaket gjenopptas automatisk med neste segment. Tidtakeren fortsetter der den slapp, og opptaket kan til slutt avsluttes som vanlig med "Stopp/Ferdig".</li><br>

  <li><strong>Fullføring:</strong> Når du klikker på "Stopp/Ferdig", stopper opptaket. Fullføringstimeren teller tiden til hele transkripsjonen er mottatt (vanligvis innen 5-10 sekunder).</li><br>

  <li><strong>Tilpasset prompt og promptprofiler:</strong> På høyre side velger du en prompt-plass (1–10) og skriver inn din egen prompt. Promptene lagres automatisk på denne enheten. For å gjøre promptene uavhengige av endringer i API-nøkkel kan du sette en <strong>Prompt profile ID</strong> (f.eks. “David”, “David 1”, “Office-PC-2”). Aktiv profil vises over prompt-feltet. Hvis ingen profil er satt, kan promptene fortsatt være lagret med den eldre metoden som var knyttet til API-nøkkel.</li><br>

  <li><strong>Eksport / import (flytt eller del prompts):</strong> Klikk <strong>Export</strong> for å laste ned en liten JSON-fil som inneholder alle 10 prompt-plassene for gjeldende profil. På en annen PC setter du Prompt profile ID (samme eller en ny) og klikker <strong>Import</strong> for å lese inn filen. Import legger alltid promptene inn i den <strong>aktive</strong> profilen på den enheten, noe som også gjør det enkelt å dele prompt-“maler” med kolleger.</li><br>

  <li><strong>Bytte profil:</strong> Når du endrer Prompt profile ID, vil prompt-plassene umiddelbart vise promptene som er lagret under den profilen. Dette gjør at flere kan bruke samme PC uten å blande prompts, så lenge hver bruker har sin egen profil.</li><br>

  <li><strong>Notatgenerering:</strong> Når transkripsjonen er fullført, klikker du på "Generer notat" for å lage et notat basert på transkripsjonen og den valgte/tilpassede prompten. Notatgenerering skjer da hos valgte tilbyder i nedtrekksmenyen i notatgenereringsmodulen. Genererte journalnotater må gjennomgås og valideres av helsepersonell før de tas i bruk.</li><br>

  <li><strong>Kostnadsoversikt:</strong> For å se ditt nåværende forbruk hos de ulike tilbyderne, klikk på lenken for kostnadsoversikt som er plassert oppe til høyre på hovedsiden.</li><br>

  <li><strong>Sikkerhet:</strong> Lydopptaket ditt sendes direkte til valgte tilbyder (fra nedtrekksmenuen) sine servere for transkribering, og hverken lagres(dette gjelder bare for Mistral(*se personvern info på forsiden)AWS Bedrock, Google Vertex og Soniox) eller brukes for maskinlæring. Den transkriberte teksten vises kun i nettleseren din, og slettes/forsvinner så snart du lukker nettleseren eller laster inn nytt innhold.</li><br>

  <li><strong>Guide-knapp:</strong> Klikk på "Guide"-knappen igjen for å gå tilbake til hovedvisningen.</li>
</ul><br><br>

<strong>Eksempler på prompts:</strong><br><br>

<strong>Konsultasjon:</strong><br>
"Systemprompt – Medisinsk notatgenerator
Formål: Generere et medisinsk presist, journalklart notat basert på en transkribert lege-pasient-samtale.

Struktur (med mindre annet er spesifisert i diktatet):
Bakgrunn (kun ved relevant historikk)
Aktuelt/anamnese
Undersøkelse (punktvis)
Vurdering
Plan

Regler:
– Inkluder kun opplysninger, undersøkelser og funn som eksplisitt fremkommer i samtalen.
– Ta med negative funn kun dersom de er nevnt.
– Dersom blodprøver rekvireres uten spesifikasjon: skriv “relevante blodprøver rekvireres”. Hvis blodprøver ikke er nevnt bestilt, så ikke nevn noe om blodprøver.
– Rett åpenbare feilstavinger i medikamentnavn.
– Ikke bruk spesialtegn, fet skrift eller ekstra linjeskift i overskrifter.
– Dersom et avsnitt skal listes punktvis, bruk “-” foran hvert punkt.
– Følg eksplisitte instruksjoner fra legen om stil, lengde eller ordlyd.
– Ta med eventuelle legetillegg etter at pasienten har forlatt rommet.
– Bruk presist og flytende journalspråk uten unødvendige fyllord eller repetisjoner.
– Språket skal være medisinsk korrekt, klart og konsist.
– Ikke bruk ";" eller "-" for å binde setninger. Kan evt bruke "," eller bare ha separate setninger.
– Hvis det legges til supplerende informasjon i "[supplerende informasjon]" over diktatet, så kan denne info brukes som kontekst når notatet skrives.
– Du trenger ikke å skrive "her er det ferdige notatet.. etc" i forkant av notatet. Tilstrekkelig å bare sende notatet.
– Dobbeltsjekk medisinnavn, slik at de staves/skrives riktig.
– All tekst skal være fullstendig uformatert: ingen bruk av fet skrift, kursiv, markdown-symboler (som # eller **) eller endret skriftstørrelse i verken overskrifter eller brødtekst.


Formålet er å produsere et ferdig, journalgodt notat som kan brukes direkte i pasientjournal uten videre redigering."<br><br>

<strong>Brev til pasient:</strong><br>
"Skriv brev. Start brevet med «Hei [navn],(så dobbel linje)»(hvis navn ikke nevnes bare si "Hei"). Avslutt alltid med:
«Mvh
<LEGENS NAVN>
<LEGESENTER NAVN>».

Ikke legg til informasjon eller høflighetsfraser som ikke nevnes. Du kan endre setningsstruktur/gramatikk/språk/rekkefølge ved behov, slik at teksten blir bedre, evt rette på språket. Hvis jeg sier "bare ta kontakt hvis du lurer på noe mer," så ikke skriv noe annet en dette på slutten. 
"<br><br>

Dette er eksempler som fungerer godt, men du står fritt til å tilpasse dem slik at de passer din dokumentasjonsstil, spesialitet og type konsultasjon. Du kan også lage helt egne prompts til hvilket formål du måtte ønske.  
`,

  redactorToggleShow: "Vis redactor",
  redactorToggleHide: "Skjul redactor",
  redactorTitle: "Redactor",
  redactorHelp: "Legg til ett begrep per linje. Både generelle og spesifikke begreper brukes når du klikker Redact, som da vil fjerne disse begrepene fra diktat- og supplerende informasjon- innholded. Generelle begreper beholdes så lenge denne fanen er åpen, men tømmes når fanen lukkes.",
  redactorOcrSectionTitle: "Skjermbilde → OCR",
  redactorOcrMiniHelp: "Bruk Windows + Shift + S, og klikk deretter Paste image. Du kan også trykke Ctrl + V mens bildefeltet er fokusert, eller laste opp en bildefil.",
  redactorPasteImageButton: "Paste image",
  redactorUploadImageButton: "Last opp bilde",
  redactorClearImageButton: "Tøm bilde",
  redactorFetchSpecificButton: "Fetch OCR → Specific",
  redactorFetchRawButton: "Fetch OCR → Raw text",
  redactorImageFrameAriaLabel: "OCR-bildeforhåndsvisning. Lim inn et bilde her med Ctrl pluss V.",
  redactorImagePreviewAlt: "OCR-skjermbilde forhåndsvisning",
  redactorImagePlaceholder: "Intet bilde lastet inn ennå. Lim inn et skjermbilde her eller last opp et bilde.",
  redactorGeneralTermsLabel: "Generelle begreper",
  redactorGeneralTermsPlaceholder: "Generelle begreper (ett per linje)\nf.eks. sykehus\nNavn",
  redactorImportGeneralButton: "Importer General.txt",
  redactorExportGeneralButton: "Eksporter General.txt",
  redactorClearGeneralButton: "Tøm generelle",
  redactorSpecificTermsLabel: "Spesifikke begreper",
  redactorSpecificTermsPlaceholder: "Spesifikke begreper (ett per linje)\nOla Nordmann\n12345678",
  redactorClearSpecificButton: "Tøm spesifikke",
  redactorApplyButton: "Redact",
  redactorRawOutputLabel: "OCR-råtekst",
  redactorRawOutputPlaceholder: "Rå OCR-tekst vises her uten formatering eller opprydding. Nyttig når du bare vil kopiere transkripsjonen.",
  redactorCopyRawButton: "Kopier råtekst",
  redactorClearRawButton: "Tøm råtekst",
  redactorBirthdateLabel: "Fødselsdatohjelper",
  redactorBirthdatePlaceholder: "DDMMYY, f.eks. 180289",
  redactorAddBirthdateButton: "Legg til datoer",
  redactorStatusGeneralCleared: "Generelle begreper tømt.",
  redactorStatusSpecificCleared: "Spesifikke begreper og fødselsdato tømt.",
  redactorStatusSpecificNormalized: "Spesifikke begreper ryddet og normalisert.",
  redactorStatusNeedTerms: "Legg til minst ett generelt eller spesifikt begrep som skal sladdes.",
  redactorStatusRawEmpty: "Råtekst er tom.",
  redactorStatusRawCopied: "Råtekst kopiert til utklippstavlen.",
  redactorStatusRawCopyError: "Kunne ikke kopiere råtekst i denne nettleserfanen.",
  redactorStatusRawCleared: "Råtekst tømt.",
  redactorStatusNoClipboardImage: "Fant ikke noe bilde i utklippstavlen. Bruk Windows + Shift + S først, og prøv igjen.",
  redactorStatusClipboardReadError: "Kunne ikke lese et bilde fra utklippstavlen.",
  redactorStatusImageReady: "Bilde limt inn og klart for OCR.",
  redactorStatusImageCleared: "Bilde tømt.",
  redactorStatusLoadedImagePrefix: "Lastet bilde:",
  redactorStatusPasteHint: "Lim inn fra utklippstavlen med Ctrl + V, eller bruk knappen Paste image.",
  redactorStatusNoImageForOcr: "Ingen bilde å kjøre OCR på. Lim inn eller last opp et bilde først.",
  redactorStatusOcrRunningPrefix: "OCR kjører…",
  redactorStatusOcrLoadingLanguage: "OCR laster språkdata…",
  redactorStatusOcrStarting: "OCR starter…",
  redactorStatusOcrNoText: "Ingen tekst ble oppdaget i bildet.",
  redactorStatusOcrNoUsableSpecific: "OCR ble fullført, men ga ingen brukbare spesifikke begreper.",
  redactorStatusOcrNoNewTerms: "OCR ble fullført ({lang}), men ingen nye unike begreper ble lagt til.",
  redactorStatusOcrComplete: "OCR fullført ({lang}) → la til {count} {termLabel} i Specific.",
  redactorStatusOcrCompleteWithBirthdate: "OCR fullført ({lang}) → la til {count} {termLabel} i Specific. Fødselsdatofeltet ble autofylt med {birthdate}.",
  redactorStatusOcrErrorPrefix: "OCR-feil:",
  redactorStatusBirthdateInvalid: "Skriv inn en gyldig 6-sifret fødselsdato i DDMMYY-format, for eksempel 180289.",
  redactorStatusBirthdateAlreadyPresent: "Disse fødselsdatoformatene finnes allerede i Specific terms.",
  redactorStatusBirthdateAdded: "La til {count} fødselsdatoformat {targetLabel}.",
  redactorStatusRedacted: "Sladdet {count} {termLabel} i Transcript og Supplementary information.",
  redactorStatusNoMatch: "Fant ingen matchende tekst i Transcript eller Supplementary information.",
  redactorStatusLoadedGeneralFile: "Lastet {fileName} inn i General terms.",
  redactorStatusReadGeneralFileError: "Kunne ikke lese {fileName}: {error}",
  redactorStatusSavedGeneralPicker: "Lagret General.txt til valgt plassering.",
  redactorStatusSavedGeneralDownload: "Lagret General.txt med nettleserens nedlastingsflyt.",
  redactorStatusSaveCanceled: "Lagring avbrutt.",
  redactorStatusExportGeneralError: "Kunne ikke eksportere General.txt: {error}",
  redactorOneTerm: "begrep",
  redactorManyTerms: "begreper"

};

export default { indexTranslations, transcribeTranslations };
