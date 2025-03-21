// js/language-sv.js

export const indexTranslations = {
  pageTitle: "Whisper Klinisk Transkription",
  headerTitle: "Whisper Klinisk Transkription",
  headerSubtitle: "Avancerad AI-driven tal-till-text och notisgenerering för vårdkonsultationer",
  startText: "För att komma igång, vänligen ange din OpenAI API-nyckel:",
  apiPlaceholder: "Ange API-nyckel här",
  enterButton: "Gå till transkriptionsverktyget",
  guideButton: "API-guide – Hur du använder",
  securityButton: "Säkerhet",
  aboutButton: "Om",
  adRevenueMessage: "Eftersom denna webbplats är gratis att använda och enbart finansieras genom annonsintäkter, vänligen godkänn personliga annonser för att stödja tjänsten.",

  securityModalHeading: "Säkerhetsinformation",
  securityModalText: `Din integritet och säkerheten för patientinformation är vår högsta prioritet. För att säkerställa att data förblir konfidentiell:
<div style="margin-left:20px;">
  <ul>
    <li><strong>Datakryptering:</strong> All data som behandlas av systemet skyddas med industristandard krypteringsmetoder. Transkriptioner och notiser är exklusivt kopplade till din krypterade personliga API-nyckel och den enhet du använder, vilket garanterar att endast du har åtkomst till det genererade innehållet.</li>
    <li><strong>Automatisk radering:</strong> Så fort en transkription eller notis genereras och visas, raderas den automatiskt och permanent från servrarna inom 2 minuter.</li>
    <li><strong>Skydd mot obehörig åtkomst:</strong> Även om obehörig åtkomst till din API-nyckel skulle inträffa, förblir data krypterad och skyddad med enhetsspecifika markörer, så att informationen inte blir åtkomlig.</li>
    <li><strong>GDPR-kompatibel hosting:</strong> Alla backend-processer körs på dedikerade Microsoft Azure-servrar inom EU, helt i enlighet med GDPR.</li>
  </ul>
</div>
Var säker på att strikta säkerhetsåtgärder garanterar att all patientrelaterad data förblir säker, konfidentiell och helt under din kontroll.`,
  
  aboutModalHeading: "Om detta projekt",
  aboutModalText: `Jag är en norsk allmänläkare med ett stort intresse för teknologiska framsteg, särskilt inom artificiell intelligens, och jag har noga följt AI-utvecklingen inom vården.<br><br>
När jag först hörde om tjänster för tal-till-text vid medicinska konsultationer i Norge blev jag optimistisk. Kollegor och användarrecensioner betonade hur dessa lösningar kunde förbättra effektiviteten och arbetsflödet avsevärt. Men efter en närmare undersökning blev jag förvånad över hur höga priserna var – särskilt med tanke på att den underliggande teknologin endast står för en bråkdel av kostnaderna som företagen kräver.<br><br>
Motiverad av denna insikt utvecklade jag min egen tal-till-text-lösning, ursprungligen för personligt bruk. När jag insåg hur effektiv och kostnadseffektiv den var, bestämde jag mig för att göra den tillgänglig online. Målet var att erbjuda samma hastighet, noggrannhet och kvalitet som premiumtjänster – men utan de oproportionerliga avgifterna.<br><br>
Även om många etablerade lösningar är användbara, anser jag att de är prissatta långt över vad som är rimligt. Varje dag ser jag kollegor som kämpar för sina patienter, men som tvingas betala mycket mer än nödvändigt för ett verktyg som borde vara tillgängligt för alla.<br><br>
Därför är denna webbplats helt gratis att använda – den enda kostnaden du får är OpenAIs direkta användningsavgift för transkriptioner.`,
  
  guideModalHeading: "API-guide – Hur du använder",
  guideModalText: `För att använda denna webbapp måste du först skapa en API-profil hos OpenAI, generera en API-nyckel och ladda ditt OpenAI-konto med medel. API-nyckeln kopieras och klistras in i det angivna fältet. När du trycker på Enter sparas API-nyckeln temporärt för din session – denna nyckel kopplar dig till OpenAI:s servrar så att tal-till-text-transkription och notisgenerering fungerar. Observera att du debiteras direkt per utförd uppgift. För mer information om kostnader, se avsnittet "Kostnadsinformation" på startsidan.`,
  
  priceButton: "Pris",
  priceModalHeading: "Kostnadsinformation",
  priceModalText: `<h1>Kostnadsinformation</h1>
<h2>Speech-to-text prissättning</h2>
<ul>
  <li><strong>Kostnad:</strong> $0.006 per minut.<br>
      <em>Exempel:</em> En 15-minuters konsultation kostar 15 × $0.006 = <strong>$0.09</strong> per konsultation.
  </li>
</ul>
<h2>Notisgenereringsprissättning</h2>
<ul>
  <li><strong>Tokenbaserad prissättning:</strong>
    <ul>
      <li><strong>Input (transkription + prompt):</strong> $10 per 1 000 000 tokens (d.v.s. $0.00001 per token).</li>
      <li><strong>Output (genererad notis):</strong> $30 per 1 000 000 tokens (d.v.s. $0.00003 per token).</li>
    </ul>
  </li>
</ul>
<h3>Exempelkalkyl (endast notisgenerering)</h3>
<ol>
  <li>
    <strong>Inputkalkyl:</strong>
    <ul>
      <li>Anta att transkriptionen av konsultationen är ca. <strong>700 ord</strong> och att du lägger till en <strong>30-ords prompt</strong>.</li>
      <li>Totalt antal ord = 700 + 30 = <strong>730 ord</strong>.</li>
      <li>Uppskattade tokens = 730 × 0.75 ≈ <strong>547,5 tokens</strong>.</li>
      <li>Inputkostnad = 547,5 tokens × $0.00001 ≈ <strong>$0.0055</strong>.</li>
    </ul>
  </li>
  <li>
    <strong>Outputkalkyl:</strong>
    <ul>
      <li>Anta att den genererade notisen är ca. <strong>250 ord</strong>.</li>
      <li>Uppskattade tokens = 250 × 0.75 ≈ <strong>187,5 tokens</strong>.</li>
      <li>Outputkostnad = 187,5 tokens × $0.00003 ≈ <strong>$0.0056</strong>.</li>
    </ul>
  </li>
  <li>
    <strong>Total kostnad för notisgenerering:</strong><br>
    Sammanlagd kostnad ≈ $0.0055 + $0.0056 = <strong>$0.0111</strong> per konsultation.
  </li>
</ol>
<h2>Ungefärliga totala kostnader per konsultation</h2>
<p>(för en 15-minuters konsultation/inspelning med båda funktionerna)</p>
<ul>
  <li><strong>Speech-to-text:</strong> <strong>$0.09</strong></li>
  <li><strong>Notisgenerering:</strong> <strong>$0.0111</strong></li>
  <li><strong>Total:</strong> Ungefär <strong>$0.101</strong> per konsultation.</li>
</ul>
<h2>Månatliga kostnadsuppskattningar</h2>
<p>Om du genomför 20 konsultationer per dag, 4 dagar i veckan, under 4 veckor per månad (20 × 4 × 4 = <strong>320 konsultationer</strong> per månad):</p>
<ol>
  <li>
    <strong>Endast speech-to-text</strong> (med notisgenerering via ditt eget ChatGPT-konto, vilket i praktiken är gratis):<br>
    Månadskostnad = 320 × $0.09 = <strong>$28.80</strong>.
  </li>
  <li>
    <strong>Både speech-to-text och notisgenerering:</strong><br>
    Månadskostnad = 320 × $0.101 ≈ <strong>$32.32</strong>.
  </li>
</ol>
<h2>Alternativ för notisgenerering</h2>
<p>Om du redan har ett OpenAI-konto kan du använda notisgenerering via ChatGPT på ditt eget konto – i princip gratis. I så fall uppstår endast kostnaden för speech-to-text när du använder denna webbapp.</p>
<h2>Användarvänlighet</h2>
<p>Till skillnad från leverantörer som kräver ett månatligt abonnemang betalar du endast för faktiskt bruk. Om du tar en ledig dag, är på semester eller har en period utan aktivitet blir dina kostnader noll. Även om du använder tjänsten dagligen för alla dina patientkonsultationer, förblir kostnaden per konsultation avsevärt lägre jämfört med andra leverantörer.</p>
<hr>
<h2>Direktanslutningsfördel</h2>
<p>Vår webbapp kopplar dig direkt till OpenAI API – utan mellanhänder, utan extra avgifter. Denna direkta anslutning innebär att du endast betalar för den faktiska AI-behandlingskostnaden, vilket gör vår tjänst till en av de mest prisvärda lösningarna för speech-to-text och notisgenerering som finns tillgängliga idag.</p>
</div>`,
};

export const transcribeTranslations = {
  pageTitle: "Transkriptionstjänst med annonser och guideöverlägg",
  openaiUsageLinkText: "Översikt över kostnader",
  btnFunctions: "Funktioner",
  btnGuide: "Guide",
  recordingAreaTitle: "Inspelningsområde",
  recordTimer: "Inspelningstimer: 0 sek",
  transcribeTimer: "Fullföljandetimer: 0 sek",
  transcriptionPlaceholder: "Transkriptionsresultatet visas här...",
  startButton: "Starta inspelning",
  stopButton: "Stoppa/Avsluta",
  pauseButton: "Pausa inspelning",
  statusMessage: "Välkommen! Klicka på 'Starta inspelning' för att börja.",
  noteGenerationTitle: "Notisgenerering",
  generateNoteButton: "Generera notis",
  noteTimer: "Notisgenereringstimer: 0 sek",
  generatedNotePlaceholder: "Den genererade notisen visas här...",
  customPromptTitle: "Anpassad prompt",
  promptSlotLabel: "Promptplats:",
  customPromptPlaceholder: "Ange anpassad prompt här",
  adUnitText: "Din annons här",
  guideHeading: "Guide & Instruktioner",
  guideText: `Välkommen till Whisper Transkriptionstjänst. Denna applikation låter medicinska experter, terapeuter och andra utövare spela in och transkribera konsultationer samt generera professionella notiser med hjälp av en AI-driven notisgenerator.<br><br>
<strong>Så här använder du funktionerna:</strong>
<ul>
  <li><strong>Inspelning:</strong> Klicka på "Starta inspelning" för att börja fånga upp ljud. Var 40:e sekund skickas en ljudsekvens automatiskt för transkription till OpenAI-servrarna. Transkriptionerna visas en efter en i textfältet för transkription.</li>
  <li><strong>Fullföljande:</strong> Efter att du klickat på "Stoppa/Avsluta" stoppas inspelningen. Fullföljandetimern börjar sedan ticka tills hela transkriptionen är mottagen – detta tar vanligtvis mellan 5 och 10 sekunder.</li>
  <li><strong>Notisgenerering:</strong> När transkriptionen är klar, klicka på "Generera notis" för att skapa en notis baserad på transkriptionen och din anpassade prompt.</li>
  <li><strong>Anpassad prompt:</strong> Välj en promptplats (1–10) och ange din anpassade prompt. Prompten sparas automatiskt och kopplas till din API-nyckel.</li>
  <li><strong>Guideväxling:</strong> Använd knapparna "Funktioner" och "Guide" för att växla mellan funktionsvyn och denna guide.</li>
</ul>
Vänligen klicka på "Funktioner" för att återgå till huvudgränssnittet.`,
};
