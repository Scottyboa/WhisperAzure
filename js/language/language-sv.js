// js/language-sv.js

export const indexTranslations = {
  pageTitle: "Whisper Klinisk Transkription",
  headerTitle: "Whisper Klinisk Transkription",
  headerSubtitle: "Avancerad AI-driven tal-till-text och notisgenerering för vårdkonsultationer",
  startText: "För att komma igång, vänligen ange din OpenAI API-nyckel:",
  apiPlaceholder: "Ange API-nyckel här",
  enterButton: "Gå till transkriptionsverktyget",
  guideButton: "Hur du använder",
  securityButton: "Säkerhet",
  aboutButton: "Om",
  adRevenueMessage: "Eftersom denna webbplats är gratis att använda och enbart finansieras genom annonsintäkter, vänligen godkänn personliga annonser för att stödja tjänsten.",

  securityModalHeading: "Integritet",
securityModalText: `Din integritet och säkerheten för patientinformation är vår högsta prioritet. Vi använder robusta åtgärder för att säkerställa att dina uppgifter förblir konfidentiella och skyddade:<br><br>
- <strong>Datakryptering:</strong> All data som behandlas av vårt system – inklusive ljudinspelningar, transkriptioner och anteckningar – är krypterad med branschstandardmetoder. Transkriptioner och anteckningar är uteslutande kopplade till din krypterade personliga API-nyckel och den enhet som används för åtkomst, vilket garanterar att endast du kan se det genererade innehållet.<br><br>
- <strong>Automatisk radering:</strong> När en transkription eller anteckning har genererats och visats på din skärm, raderas den automatiskt och oåterkalleligt från våra servrar inom 2 minuter. Ljudfiler lagras endast tillfälligt för bearbetning och sparas inte efter att de använts.<br><br>
- <strong>Skydd mot obehörig åtkomst:</strong> Även om obehörig åtkomst till din API-nyckel skulle inträffa, förblir dina data krypterade och skyddade av enhetsspecifika markörer, vilket gör informationen oåtkomlig.<br><br>
- <strong>GDPR-kompatibel hosting:</strong> Alla backend-processer körs på dedikerade Microsoft Azure-servrar inom EU och är fullt kompatibla med GDPR-förordningen.<br><br>
<strong>Ytterligare integritetspraxis:</strong><br><br>
- <strong>Minimal datainsamling:</strong> Vi samlar endast in den information som är nödvändig för att tillhandahålla våra tjänster. Detta inkluderar din OpenAI API-nyckel (lagras i krypterad form under sessionens varaktighet), enhetstoken som endast används för kryptering, samt ditt språkval. Ingen ytterligare personlig information lagras.<br><br>
- <strong>Användning av cookies:</strong> Cookies på denna webbplats används uteslutande för att visa personligt anpassade annonser och förbättra din upplevelse. Vi använder inte cookies för att samla in eller lagra personlig information utöver det som krävs för detta ändamål. Vår webbplats använder även cookies för att spara användarinställningar och hantera samtycke.<br><br>
- <strong>Databearbetning och lagring:</strong> All data som behandlas av vårt system – inklusive ljudinspelningar, transkriptioner och genererade anteckningar – lagras endast så länge det är nödvändigt för att slutföra transkription- och anteckningsprocessen, och raderas automatiskt kort därefter. Vi lagrar eller delar inte någon personligt identifierbar information utöver vad som krävs för att tjänsten ska fungera korrekt.<br><br>
- <strong>Tredjepartsdelning och efterlevnad av regler:</strong> Vi säljer eller delar inte din personliga information med tredje part. All data som delas med externa tjänster – såsom OpenAI för transkription och anteckningsgenerering eller Google AdSense för personligt anpassade annonser – är begränsad till anonymiserad information som enbart rör annonsanpassning och användarinställningar, och inkluderar inte dina inspelningar, transkriptioner eller genererade anteckningar. All datadelning sker under strikt sekretess och i full överensstämmelse med gällande integritetsregler.<br><br>
Observera att all data automatiskt raderas kort efter bearbetning och inte lagras långsiktigt på grund av hur vårt system är utformat.`,


  aboutModalHeading: "Om",
aboutModalText: `Denna webbplats skapades för att ge vårdpersonal och andra användare direkt tillgång till högkvalitativ tal-till-text-transkription och generering av kliniska notat – utan onödiga kostnader eller mellanhänder.<br><br>
Genom att använda din egen OpenAI API-nyckel kopplar du dig direkt till källan för teknologin. Det innebär att du endast betalar den faktiska användningskostnaden som sätts av OpenAI, utan påslag eller prenumerationsavgifter.<br><br>
Många befintliga leverantörer erbjuder liknande tjänster men tar betydligt mer betalt – ofta 8 till 10 gånger den verkliga kostnaden för den underliggande tekniken. Denna plattform erbjuder samma funktionalitet till en bråkdel av priset.<br><br>
<strong>Viktiga punkter:</strong><br>
• Ingen prenumeration, inget konto krävs.<br>
• Du betalar endast direkt till OpenAI för det du använder.<br>
• Webbplatsen i sig är helt gratis.<br><br>
För att hålla det så krävs att användare godkänner annonser. Annonsintäkter hjälper till att täcka kostnader för drift och hosting, så att tjänsten kan förbli tillgänglig och gratis för alla.`,
  
  guideModalHeading: "API-guide – Hur du använder",
  guideModalText: `För att använda denna webbapp måste du först skapa en OpenAI API-profil, generera en API-nyckel och ladda ditt OpenAI-konto med pengar. Din API-nyckel kopieras och klistras sedan in i det angivna fältet. När du klickar på Enter sparas nyckeln tillfälligt för din session – denna nyckel kopplar dig till OpenAI:s servrar så att tal-till-text-transkription och notatgenerering kan fungera. Observera att du debiteras direkt per utfört uppdrag. För mer information om kostnader, se avsnittet "Pris" på startsidan.
<br><br>
<strong>1. Skapa din OpenAI API-profil</strong><br>
För att börja måste du skapa en profil på OpenAIs API-plattform. Denna profil fungerar som ditt konto för att hantera API-nycklar och fakturering. För att komma igång, besök <a href="https://platform.openai.com/signup" style="color:blue;">OpenAI API Registrering</a>. Följ instruktionerna för att registrera dig genom att ange din e-postadress, skapa ett lösenord och verifiera ditt konto. När du är registrerad får du tillgång till din kontrollpanel.
<br><br>
<strong>2. Generera en API-nyckel</strong><br>
När du har skapat din profil, generera en API-nyckel genom att gå till sidan <a href="https://platform.openai.com/account/api-keys" style="color:blue;">Hantera API-nycklar</a>. Klicka på knappen för att skapa en ny API-nyckel. Viktigt: Du kommer endast att se nyckeln en gång. Kopiera den direkt och spara den säkert (t.ex. i en textfil) för framtida användning. Om du förlorar nyckeln eller misstänker att den har blivit komprometterad, ta bort den från ditt konto och skapa en ny.
<br><br>
<strong>3. Ladda ditt OpenAI-konto</strong><br>
För att webbappen ska fungera måste ditt OpenAI-konto ha tillräckligt med pengar. Besök <a href="https://platform.openai.com/account/billing/overview" style="color:blue;">Fakturering & betalning</a> för att lägga till medel. Du kan överföra valfritt belopp när som helst. Så länge det finns pengar på kontot kan du använda webbappen – varje uppgift debiteras omedelbart.
<br><br>
<strong>Påminnelse om sessionsäkerhet</strong><br>
När du loggar in genom att ange din API-nyckel lagras den endast tillfälligt i din webbläsarsession. Det innebär att om du lämnar webbplatsen, stänger webbläsaren eller stänger av datorn så sparas inte nyckeln. Du måste ange nyckeln på nytt nästa gång du använder webbappen, vilket säkerställer att din nyckel förblir skyddad.`,  
  priceButton: "Pris",
  priceModalHeading: "Pris",
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
      <li><strong>Input (transkription + prompt):</strong> $2.50 per 1 000 000 tokens (d.v.s. $0.0000025 per token).</li>
      <li><strong>Output (genererad notis):</strong> $10.00 per 1 000 000 tokens (d.v.s. $0.00001 per token).</li>
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
      <li>Inputkostnad = 547,5 tokens × $0.0000025 ≈ <strong>$0.0014</strong>.</li>
    </ul>
  </li>
  <li>
    <strong>Outputkalkyl:</strong>
    <ul>
      <li>Anta att den genererade notisen är ca. <strong>250 ord</strong>.</li>
      <li>Uppskattade tokens = 250 × 0.75 ≈ <strong>187,5 tokens</strong>.</li>
      <li>Outputkostnad = 187,5 tokens × $0.00001 ≈ <strong>$0.0019</strong>.</li>
    </ul>
  </li>
  <li>
    <strong>Total kostnad för notisgenerering:</strong><br>
    Sammanlagd kostnad ≈ $0.0014 + $0.0019 = <strong>$0.0033</strong> per konsultation.
  </li>
</ol>
<h2>Ungefärliga totala kostnader per konsultation</h2>
<p>(för en 15-minuters konsultation/inspelning med båda funktionerna)</p>
<ul>
  <li><strong>Speech-to-text:</strong> <strong>$0.09</strong></li>
  <li><strong>Notisgenerering:</strong> <strong>$0.0033</strong></li>
  <li><strong>Total:</strong> Ungefär <strong>$0.0933</strong> per konsultation.</li>
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
    Månadskostnad = 320 × $0.0933 ≈ <strong>$29.86</strong>.
  </li>
</ol>
<h2>Användarvänlighet</h2>
<p>Till skillnad från leverantörer som kräver ett månatligt abonnemang betalar du endast för faktiskt bruk. Om du tar en ledig dag, är på semester eller har en period utan aktivitet blir dina kostnader noll. Även om du använder tjänsten dagligen för alla dina patientkonsultationer, förblir kostnaden per konsultation avsevärt lägre jämfört med andra leverantörer.</p>
<hr>
<h2>Direktanslutningsfördel</h2>
<p>Vår webbapp kopplar dig direkt till OpenAI API – utan mellanhänder, utan extra avgifter. Denna direkta anslutning innebär att du endast betalar för den faktiska AI-behandlingskostnaden, vilket gör vår tjänst till en av de mest prisvärda lösningarna för speech-to-text och notisgenerering som finns tillgängliga idag.</p>
`,
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
  readFirstText: "Läs först! ➔",
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
guideText: `Välkommen till Whisper Transkriptionstjänst. Denna applikation låter medicinska experter, terapeuter och andra praktiker spela in och transkribera konsultationer, samt generera professionella notiser med hjälp av en AI-driven notisgenerator.<br><br>
<strong>Så här använder du funktionerna:</strong>
<ul>
  <li><strong>Inspelning:</strong> Klicka på "Starta Inspelning" för att börja spela in ljud. Varje 2:a minut skickas en ljudbit automatiskt till OpenAI-servrarna för transkription. Transkriptionerna visas sekventiellt i fältet för transkription.</li>
  <li><strong>Fullbordan:</strong> Efter att du har klickat på "Stoppa/Avsluta" stoppas inspelningen. Fullbordningstimern räknar tills hela transkriptionen har mottagits (vanligtvis inom 5–10 sekunder).</li>
  <li><strong>Notisgenerering:</strong> När transkriptionen är klar klickar du på "Generera Notis" för att skapa en notis baserad på din transkription och ditt anpassade prompt.</li>
  <li><strong>Anpassat Prompt:</strong> Till höger, välj en prompt-slot (1–10) och skriv in ditt anpassade prompt. Ditt prompt sparas automatiskt och länkas till din API-nyckel.</li>
  <li><strong>Översikt över användning:</strong> För att se din aktuella användning hos OpenAI, klicka på länken för användningsöversikt på huvudsidan.</li>
  <li><strong>Säkerhet:</strong> Din ljudinspelning skickas direkt till OpenAIs API-servrar, som varken sparar datan eller använder den till något annat än själva transkriberingen. Den transkriberade texten som visas i webbläsaren sparas inte någonstans och försvinner så fort du stänger webbläsaren eller ny text laddas in.</li>
  <li><strong>Guideväxling:</strong> Klicka på "Guide"-knappen igen för att återgå till huvudsidan.</li>
</ul>`
};
