export const indexTranslations = {
  pageTitle: "Transkribera anteckningar",
  headerTitle: "Transkribera anteckningar",
  headerSubtitle: "Avancerad AI-driven tal-till-text och anteckningsgenerering för vårdkonsultationer",
  startText: "Du kan nu också välja mellan olika modeller från olika leverantörer. Har du ingen API-nyckel ännu? Klicka på «API-nyckel – Hur du skapar» för enkel vägledning.",
  apiPlaceholder: "Skriv in OpenAI API-nyckel här",
  enterButton: "Gå till transkriberingsverktyget",
  guideButton: "API-guide – Så använder du den",
  securityButton: "Säkerhet",
  aboutButton: "Om",
  adRevenueMessage: "Eftersom denna webbplats är gratis att använda och uteslutande finansieras av annonsintäkter, uppskattar vi mycket om du godkänner annonser för att stödja tjänsten.",
  
  securityModalHeading: "Integritet",
  securityModalText: `
<strong>Integritet och databehandling</strong><br><br>
Denna webbapp är skapad som ett verktyg för tal-till-text och anteckningsgenerering. Det är ditt fulla ansvar som vårdpersonal/behandlingsansvarig att säkerställa att all användning sker i enlighet med GDPR, Helsepersonelloven och Normen för informationssäkerhet.<br><br>

Du är ensam ansvarig för att användningen av denna app uppfyller alla krav i:<br>
- GDPR<br>
- Helsepersonelloven<br>
- Normen för informationssäkerhet<br><br>

Detta innebär bland annat:<br>
- Ingå nödvändiga avtal (DPA)<br>
- Genomföra grundliga riskbedömningar (DPIA och TIA)<br><br>

– Mer information om detta längre ned i denna text.<br><br>

Utvecklaren av denna webbapp tar inget ansvar för din användning eller bristande efterlevnad. Detta är inte juridisk rådgivning; du måste själv involvera dataskyddsombud/juridisk rådgivare vid behov.<br><br>

<hr><br>

<strong>1. Praktiska rekommendationer för modellval i denna app</strong><br><br>

Webbappen ger tillgång till flera olika leverantörer och modeller. Nedan finns en praktisk, något normativ översikt som gör det enklare att välja. Du måste ändå göra din egen juridiska och tekniska bedömning.<br><br>

<strong>Tal-till-text (STT)</strong><br>
- Kvalitetsmässigt är de starkaste tal-till-text-modellerna i denna app som regel OpenAI gpt-4o-transcribe och Soniox.<br>
- För rutinmässig användning på identifierbara patientdata är <strong>Soniox med EU-endpunkt och noll datalagring</strong> det alternativ som passar bäst in i ett strikt GDPR-/hälso-regim. OpenAI använder typiskt globala endpunkter och har tillfällig lagring; detta hamnar ofta i en juridisk «gråzon» om du inte har särskilda avtal och explicit EU-dataresidens på plats.<br><br>

<strong>Anteckningsgenerering (LLM)</strong><br>
-Till själva anteckningsgenereringen är det ofta <strong>ChatGPT-modellerna (GPT-5.1 / GPT-5.2)</strong>, <strong>Claude-modellerna (via AWS Bedrock)</strong> och <strong>Gemini-modellerna (Gemini 3 och Gemini 2.5 Pro)</strong> som ger bäst kvalitet i denna app. <br>
-Sett ur ett GDPR-perspektiv är det <strong>AWS Bedrock (Claude)</strong> som ofta är den mest rekommenderade uppsättningen, eftersom den kan konfigureras med EU/EES-regionval, zero data retention och därmed ge en mycket GDPR-anpassad lösning. <br>
-En stark alternativ lösning är <strong>Google Vertex AI med Gemini 2.5 Pro</strong> i EU-region. Detta kräver att du skapar ett eget Google Cloud/Vertex-projekt, deployar en liten backend (Cloud Run) och klistrar in backend-URL + hemlig nyckel i fälten för «Google Vertex» på startsidan.<br>
-För instruktioner/guide för uppsättning av AWS Bedrock och Google Vertex, klicka på "Guide"-knappen bredvid nyckelfälten här på startsidan.<br>

<strong>Andra leverantörer i denna app</strong><br>
- <strong>Lemonfox</strong>, <strong>Mistral</strong> och <strong>Deepgram</strong> är i huvudsak inkluderade för test/experimentering och eventuell icke-klinisk användning. För krävande klinisk diktering och anteckningsskrivning är kvaliteten deras generellt lägre än Soniox/OpenAI/Gemini, och hur «GDPR-vänliga» de är beror helt på vilka endpunkter (EU/globalt) och eventuella ZDR-inställningar du faktiskt har aktiverat hos leverantören.<br>
- GPT-modellerna från <strong>OpenAI</strong>, <strong>Deepgram</strong> sina standard/globalt hostade STT-endpunkter och <strong>Gemini 3 via Google AI Studio</strong> kommer ofta att ha global infrastruktur och tillfällig datalagring. Dessa uppsättningar är inte automatiskt GDPR-kompatibla för identifierbara patientdata och bör betraktas som «gråzoner» om du inte har explicita avtal, EU-dataresidens och ZDR dokumenterat.<br><br>

<strong>Mest GDPR-optimal kombination i denna app</strong><br>
Om du använder <strong>Soniox med EU-endpunkt</strong> för tal-till-text, och <strong>Google Vertex AI (Gemini 2.5 Pro med EU-endpunkt) eller AWS Bedrock(Claude)</strong> för anteckningsgenerering, kan den tekniska dataflödet i denna app hållas inom EU utan återanvändning för träning hos leverantören. Laglighet och efterlevnad beror ändå på dina egna DPA:er, DPIA/TIA och lokala krav, men rent tekniskt är detta den mest GDPR-optimerade konfigurationen som appen stödjer per i dag.<br><br>

<hr><br>

<strong>2. Hur fungerar webbappen?</strong><br>
- Spelar in ljud via webbläsarens inspelningsfunktion.<br>
- Bearbetar ljud i webbläsarens minne (RAM).<br>
- Laddar upp ljudfil via säker HTTPS-anslutning till vald tal-till-text-leverantör (t.ex. OpenAI, Soniox, Lemonfox, Mistral/Voxtral, Deepgram) med hjälp av din egen API-nyckel från leverantören.<br>
- Skickar transkriptionen (och eventuell tilläggstext/prompt) vidare till vald textmodell (t.ex. GPT-5.1, GPT-4o, Gemini 3, Mistral Large, Lemonfox LLM eller Gemini 2.5 Pro via din egen Vertex-backend).<br>
- Webbläsaren tar emot anteckningsutkastet direkt från aktuell leverantör (eller via din Vertex-backend) via en säker/krypterad anslutning.<br><br>

Dina API-nycklar lagras endast tillfälligt i webbläsarens minne (SessionStorage). Stänger du av webbappen eller stänger webbläsaren raderas API-nycklarna från webbläsarens minne. För att använda webbappen igen måste du klistra in nycklarna på nytt. Detta ger ett extra säkerhetslager mot obehörig åtkomst till dina nycklar.<br><br>

Webbappen har ingen egen server som lagrar ljud eller text; all kommunikation går direkt mellan din webbläsare och de tjänster du själv har valt (eller, för Google Vertex, via backend-URL:en du själv har satt upp i ditt eget Google Cloud-projekt).<br><br>

<hr><br>

<strong>3. Dina egna API-nycklar krävs</strong><br>
All kommunikation med modell-leverantörerna (OpenAI, Google Gemini, Soniox, Lemonfox, Deepgram, Mistral m.fl.) sker direkt från din webbläsare med dina personliga API-nycklar, eller via din egen Google Cloud-backend (URL + hemlig nyckel) när du använder Vertex-integrationen.<br><br>

Utvecklaren av denna webbapp har ingen åtkomst till dina API-nycklar, din backend-URL/hemliga nyckel eller till innehållet du skickar till leverantörerna.<br><br>

<hr><br>

<strong>4. Personuppgiftsbiträdesavtal (DPA) med leverantörerna</strong><br>
Om du ska använda API-tjänsterna för behandling av personuppgifter (särskilt patientuppgifter) rekommenderas att du ingår personuppgiftsbiträdesavtal (DPA) med varje leverantör du faktiskt använder, till exempel:<br>
- OpenAI (tal-till-text och textgenerering)<br>
- Google (Gemini 3 via Google AI Studio, Gemini 2.5 Pro via Vertex AI)<br>
- Soniox (tal-till-text)<br>
- Deepgram (tal-till-text)<br>
- Mistral (Voxtral för tal-till-text, Mistral Large för text)<br>
- Lemonfox (Whisper v3 tal-till-text och Llama 3-baserade textmodeller)<br><br>

För OpenAI finns det ett standard personuppgiftsbiträdesavtal (DPA) och en egen organisationsprofil där verksamhetsinformation (t.ex. organisationsnummer) registreras. Motsvarande avtal och dokument finns hos de andra leverantörerna.<br><br>

När DPA:er är på plats är utgångspunkten att du/verksamheten är personuppgiftsansvarig, medan leverantörerna (OpenAI, Google, Soniox, Mistral, Deepgram, Lemonfox osv.) är personuppgiftsbiträden. Du måste själv kontrollera att avtalen faktiskt täcker din användning (hälso, forskning, etc.).<br><br>

<hr><br>

<strong>5. DPIA och TIA – nödvändiga riskbedömningar</strong><br><br>

<strong>DPIA (Data Protection Impact Assessment)</strong><br>
Krävs enligt GDPR artikel 35 när ny teknik används för att behandla särskilda kategorier av uppgifter (som hälsouppgifter). Syftet är att identifiera och minska integritetsrisker kopplade till själva behandlingen.<br><br>

Du bör bland annat:<br>
- Kartlägga vilka data som behandlas (ljud, text, metadata).<br>
- Beskriva syfte (klinisk dokumentation, kvalitet, forskning osv.).<br>
- Bedöma risk för patienternas rättigheter och friheter.<br>
- Besluta tekniska och organisatoriska åtgärder (kryptering, åtkomststyrning, loggning, utbildning osv.).<br><br>

<strong>TIA (Transfer Impact Assessment)</strong><br>
Krävs när personuppgifter överförs till länder utanför EES (till exempel USA). Syftet är att dokumentera att överföringen ändå ger ett «väsentligen likvärdigt» skydd som i EU/EES (Schrems II, GDPR artikel 44–49).<br><br>

Du bör bland annat:<br>
- Bedöma relevant lagstiftning i mottagarlandet (t.ex. FISA 702, CLOUD Act).<br>
- Ställa detta mot hur känsliga uppgifterna är och vilka tekniska/kontraktuella åtgärder du använder (kryptering, pseudonymisering, SCC, ZDR, EU-endpunkt osv.).<br>
- Explicit dra slutsats om överföringen är försvarlig och om restrisken är acceptabel.<br><br>

Både DPIA och TIA bör vara genomförda, dokumenterade och godkända av dig/verksamheten innan webbappen används på verkliga patientdata.<br><br>

<hr><br>

<strong>6. Databehandling, datalagring och «GDPR-vänlighet» hos olika leverantörer</strong><br><br>

Nedan finns en grov översikt över hur tjänsterna typiskt fungerar i dag. Detta kan förändras, och du måste alltid kontrollera uppdaterad dokumentation och avtalsverk hos leverantören innan du drar slutsatser.<br><br>

<strong>Lemonfox (tal-till-text och textgenerering)</strong><br>
Lemonfox är EU-baserat och marknadsför sig som fullt GDPR-kompatibelt.<br>
Tal-till-text (Whisper v3) och Llama 3-baserade textmodeller processas i EU, och de uppger att ljud/text raderas kort tid efter processering (ingen återanvändning för träning).<br>
Detta gör Lemonfox till ett relativt «GDPR-vänligt» alternativ för både tal-till-text och textgenerering, förutsatt att du ändå gör DPIA/TIA och har tillräckliga avtal.<br><br>

<strong>Soniox (med EU-endpunkt)</strong><br>
Soniox erbjuder dataresidens i både USA och EU.<br>
När ett projekt är konfigurerat med EU-region behandlas ljud och transkriptioner inom denna region; systemdata som kontodata och fakturadata kan ändå hanteras globalt.<br>
För att ta i bruk EU-endpunkten i klinisk miljö måste du typiskt kontakta Soniox (till exempel via e-post till <strong>sales@soniox.com</strong>) och be om tillgång till EU-projekt/API-nyckel och dokumentation på dataresidens. Tillgång till EU-endpunkt kan ta 1–2 dagar att få efter kontakt.<br>
Med EU-endpunkten aktiverad är Soniox ett bra alternativ för GDPR-anpassad tal-till-text, men du måste fortfarande göra DPIA/TIA och ingå nödvändigt DPA.<br><br>

<strong>Mistral (Voxtral för tal-till-text, Mistral Large för text)</strong><br>
Mistral är EU-baserat och standarduppsättningen deras är att API-data hostas i EU som utgångspunkt. Det finns egna USA-endpunkter om man explicit väljer det.<br>
Mistral erbjuder möjlighet till Zero Data Retention (ZDR) efter ansökan, dvs. att data inte lagras utöver det som är strikt nödvändigt för att leverera svaret. Detta kan göra det enklare att argumentera för användning på hälsodata, men måste dokumenteras i DPIA/TIA.<br>
Kombinationen EU-endpunkt + ZDR (där detta faktiskt är beviljat och konfigurerat) gör Mistral (Voxtral + Mistral Large) till ett av de mest «GDPR-vänliga» alternativen i denna app.<br><br>

<strong>Google Vertex AI (Gemini 2.5 Pro via EU-backend)</strong><br>
I denna app används Google Vertex AI endast via din egen backend-URL och hemliga nyckel, som du lägger in under «Google Vertex» på startsidan.<br>
När ditt Vertex-projekt är konfigurerat till en EU-region (till exempel europe-west1) och med zero data retention / ingen återanvändning av data för träning, kommer förfrågningar och svar att behandlas inom EU och förfrågningsdata lagras inte längre än nödvändigt för att leverera svaret, enligt Googles dokumentation.<br>
Denna uppsättning kan därmed användas som ett EU-resident, noll-retentionsalternativ för anteckningsgenerering, förutsatt att du också har giltigt DPA med Google och har genomfört DPIA/TIA som explicit täcker denna användning.<br>
För en praktisk genomgång av hur du skapar projektet, väljer region och deployar backend:en som används av denna app kan du klicka på guide-knappen i rubriken «Google Vertex» på startsidan; detta öppnar en egen ChatGPT-vägledning där du kan ställa följdfrågor.<br><br>

<strong>Gemini 3 (Google AI Studio)</strong><br>
Gemini 3 som används via Google AI Studio / Gemini API med ren API-nyckel behandlas normalt på Googles globala infrastruktur, vilket typiskt innebär att data kan överföras utanför EU/EES.<br>
Google kan lagra förfrågningsdata tillfälligt för missbruksdetektion, stabilitet och förbättring, beroende på inställningar och avtal, och endpunkten är som huvudregel inte explicit låst till EU-region.<br>
Användning av Gemini 3 via Google AI Studio kommer därför ofta att vara ett juridiskt «gråområde» för identifierbara patientdata, om du inte har explicita kontraktuella garantier om EU-dataresidens och lagringstid, dokumenterat i DPIA/TIA. Denna app erbjuder i stället en egen Google Vertex-integration för EU-region (se ovan).<br><br>

<strong>OpenAI</strong><br>
OpenAI uppger att API-data inte används för modellträning som standard, men kan lagras tillfälligt (typiskt upp till 30 dagar) för missbruksdetektion och felsökning.<br>
OpenAI har introducerat dataresidens i Europa för vissa API-kunder och produkter, men detta kräver specifika avtal/konfiguration.<br>
Så som denna webbapp normalt är uppsatt kommer anrop till OpenAI ofta att gå till globala endpunkter (typiskt USA), vilket innebär överföring utanför EU/EES.<br><br>

Användning av OpenAI med patientdata befinner sig därmed ofta i ett juridiskt «gråområde» om du inte har:<br>
- ett tydligt DPA,<br>
- dokumenterad DPIA/TIA som explicit täcker överföringen, och<br>
- eventuella specialordningar om EU-residens/ZDR om detta är tillgängligt och faktiskt aktiverat.<br><br>

<strong>Deepgram (Nova-3)</strong><br>
Deepgram har historiskt använt globala endpunkter, men erbjuder nu dedikerade och EU-specifika endpunkter.<br>
Om du endast använder standard/global endpunkt kommer ljuddata typiskt att processas utanför EU/EES.<br>
Deepgram har också EU-hostade tjänster och beskriver olika compliance-upplägg (inklusive för vård), men det kräver att du medvetet konfigurerar rätt endpunkt (t.ex. api.eu.deepgram.com) och har avtal som täcker dataresidens och eventuella lagringstider.<br>
Så som appen ofta används i dag kan Deepgram därför – på samma sätt som OpenAI – innebära att data skickas utanför EU om du inte explicit konfigurerar EU-endpunkt och har juridiska bedömningar på plats.<br><br>

<strong>Kort sammanfattat om modellerna i denna app:</strong><br><br>

Mest «GDPR-optimala» kombination i denna app (om korrekt konfigurerat och med DPA + DPIA/TIA på plats):<br>
- Soniox med EU-endpunkt för tal-till-text.<br>
- Google Vertex AI med Gemini 2.5 Pro i EU-region och zero data retention för anteckningsgenerering.<br><br>

Andra relativt «GDPR-vänliga» alternativ (förutsatt att EU-endpunkt och eventuella ZDR-inställningar faktiskt är aktiverade och dokumenterade):<br>
- Lemonfox (EU-baserad STT + LLM, snabb radering).<br>
- Mistral (Voxtral + Mistral Large) med standard EU-hosting och eventuellt ZDR.<br><br>

Mer krävande/«gråzoner» för patientdata (om du inte har specialavtal och EU-residens/ZDR på plats):<br>
- OpenAI via globala endpunkter.<br>
- Deepgram via globala endpunkter.<br>
- Gemini 3 via globalt Google AI Studio/Gemini API utan explicit EU-låsning.<br><br>

I alla fall är det du/verksamheten som måste dokumentera att lösning och leverantörsval är i linje med GDPR, Helsepersonelloven och Normen.<br><br>

<hr><br>

<strong>7. Förutsättningar för potentiell klinisk användning</strong><br>
Din bedömning är avgörande: Lagligheten av att använda detta verktyg med patientdata beror uteslutande på din egen grundliga bedömning av både appen och varje enskild leverantör du kopplar till (OpenAI, Gemini, Soniox, Lemonfox, Mistral, Deepgram osv.).<br><br>

Minimikrav före användning med patientdata bör vara:<br>
- Giltiga personuppgiftsbiträdesavtal (DPA) med alla leverantörer du faktiskt använder.<br>
- Verksamhetsspecifik DPIA och TIA som är genomförd, godkänd och som drar slutsatsen att restrisken är acceptabel.<br>
- Tydligt beslut om vilka modeller/endpunkter som kan användas för patientdata (till exempel att begränsa patientrelaterad användning till Soniox med EU-endpunkt för tal-till-text och Google Vertex AI med Gemini 2.5 Pro i EU-region och zero data retention för anteckningsgenerering, samt eventuellt Lemonfox/Mistral om detta enligt din bedömning är försvarligt).<br>
- Ansvar för innehåll: Du är ansvarig för allt innehåll du skickar till leverantörerna via dina API-nycklar/backend, och för att kvalitetssäkra anteckningsutkastet innan det eventuellt kopieras in i patientjournal.<br><br>

<hr><br>

<strong>8. Översikt över datalagring</strong><br><br>

(Detta gäller hur webbappen hanterar data; utöver detta tillkommer lagring hos varje API-leverantör, vilket du måste kontrollera själv.)<br><br>

<strong>Dina API-nycklar och Vertex-backend (OpenAI, Soniox, Gemini, Lemonfox, Deepgram, Mistral osv.)</strong><br>
- Var lagras de? I SessionStorage-minne i din webbläsare.<br>
- Hur länge? Tills du avslutar webbappen eller stänger webbläsaren.<br>
- Vem har åtkomst? Endast du och din webbläsare.<br><br>

<strong>Ljudsegment under inspelning</strong><br>
- Var lagras de? Webbläsarens minne (RAM).<br>
- Hur länge? Endast under inspelning/processering. Webbappen lagrar inte ljud permanent.<br>
- Vem har åtkomst? Endast du och din webbläsare innan de skickas till vald tal-till-text-API.<br><br>

<strong>Transkriberad text/anteckningsutkast hos leverantörerna</strong><br>
- Var lagras det? Hos vald API-leverantör (OpenAI, Google, Soniox, Lemonfox, Mistral, Deepgram osv.) i deras molninfrastruktur, eller i ditt eget Google Cloud-projekt när du använder Vertex-backend.<br>
- Hur länge? Varierar – t.ex. uppger OpenAI att data kan lagras upp till cirka 30 dagar för missbruksdetektion; vissa EU-baserade leverantörer (som Lemonfox/Mistral med ZDR, Soniox EU och Vertex med zero data retention) raderar snabbare. Du måste själv kontrollera gällande policy för varje leverantör och din egen Vertex-konfiguration.<br>
- Vem har åtkomst? Du via API-/backend-svaren, samt aktuell leverantör (eller ditt eget Google Cloud-projekt) under den period data tekniskt sett lagras.<br><br>

<strong>Instruktioner/prompter i själva webbappen</strong><br>
- Var lagras de? Lokalt i din webbläsare (typiskt LocalStorage/SessionStorage). Om du använder samma webbläsare, samma PC och samma nycklar/backend kommer prompterna fortfarande att vara tillgängliga för dig nästa gång.<br>
- Hur länge? Tills du raderar dem eller rensar webbläsardata.<br>
- Vem har åtkomst? Du och din webbläsare.<br><br>

<hr><br>

<strong>9. Källkod</strong><br>
Källkoden är öppen och körs lokalt i din webbläsare. Det finns inga dolda bakdörrar som skickar data till utvecklarens servrar, utöver statistik kring hur ofta appen används, via antal klick osv., men ingen känslig information om användare eller data som användaren skickar/tar emot.<br>
`,
  
  aboutModalHeading: "Om",
  aboutModalText: `Denna webbplats skapades för att ge vårdpersonal och andra användare direkt tillgång till tal-till-text av hög kvalitet och klinisk anteckningsgenerering – utan onödiga kostnader eller mellanhänder.<br><br>
Genom att använda dina egna API-nycklar till leverantörer av tal-till-text och textgenereringsmodeller kopplar du dig direkt till källan för tekniken. Detta innebär att du endast betalar det faktiska användningspriset som fastställs av varje leverantör, utan påslag eller abonnemangsavgifter från denna webbplats.<br><br>
Många befintliga leverantörer erbjuder liknande tjänster, men tar betydligt mer – ofta många gånger den verkliga kostnaden för den underliggande tekniken. Denna plattform låter dig använda samma modeller i princip till «inköpspris», så att kostnaden per konsultation blir mycket låg.<br><br>
<strong>Nyckelpunkter:</strong><br>
• Ingen prenumeration, inget konto krävs på denna webbplats.<br>
• Du betalar endast direkt till API-leverantörerna för det du använder (tal-till-text och textgenerering).<br>
• Själva webbplatsen är helt gratis att använda.<br><br>
`,
 
  guideModalHeading: "API-nyckel - Hur du skapar",
  guideModalText: `Hur man skaffar API-nycklar:<br><br>
För att använda tal-till-text och anteckningsgenereringsmodellerna i denna app måste du skaffa en eller flera API-nycklar (OpenAI, Soniox, Google Gemini, Lemonfox, Deepgram, Mistral).<br><br>

<strong>Tal-till-text-modeller i appen:</strong><br>
- OpenAI: gpt-4o-transcribe<br>
- Soniox<br>
- Soniox (speaker labels)<br>
- Lemonfox Speech-to-Text (Whisper v3-baserad)<br>
- Voxtral Mini<br>
- Deepgram Nova-3<br><br>

<strong>Textgenereringsmodeller i appen:</strong><br>
- GPT-5.1 (streaming)<br>
- GPT-5.1 (non-streaming)<br>
- GPT-4-latest<br>
- Lemonfox textgenerering (Llama 3-baserade modeller)<br>
- Mistral Large<br>
- Gemini 3<br><br>

<strong>OpenAI</strong><br>
– Skapa ett konto hos OpenAI:<br>
https://platform.openai.com<br><br>
– Generera en API-nyckel och sätt in kredit på ditt konto<br>
– Spara API-nyckeln på ett säkert ställe (lokalt på PC:n, textfil, lösenordshanterare, Dropbox osv.)<br>
– Klistra in nyckeln i fältet «OpenAI API key» på startsidan<br>
– Du kan nu använda OpenAI-modellerna i appen:<br>
• Tal-till-text: gpt-4o-transcribe (välj «OpenAI» i inspelningsmodulens rullgardinsmeny på huvudsidan)<br>
• Textgenerering: chatgpt-4-latest, GPT-5.1<br><br>

<strong>Soniox</strong><br>
– Skapa ett konto hos Soniox:<br>
https://soniox.com<br><br>
– Generera en Soniox API-nyckel och köp/ladda upp credits (samma princip som hos OpenAI)<br>
– Spara nyckeln säkert och klistra in den i fältet «Soniox API key (EU or US)» på startsidan<br>
– Du kan nu använda tal-till-text-modellen Soniox (mycket bra och billig tal-till-text-modell, rekommenderas)<br>
– För att få EU-endpunkt (GDPR-vänligt): skicka e-post till sales@soniox.com och be om EU API-nyckel för användning av tal-till-text i klinisk patient–läkar-sammanhang<br>
– På huvudsidan kan du välja mellan EU- och USA-endpunkt i rullgardinsmenyn när du använder Soniox<br><br>

<strong>Google Gemini</strong><br>
– Skapa konto / logga in i Google AI Studio:<br>
https://aistudio.google.com<br><br>
– Generera en Gemini API-nyckel<br>
– Du får normalt några gratis credits vid skapande av konto (se översikten inne i AI Studio)<br>
– Spara nyckeln säkert och klistra in den i fältet «Google Gemini API key» på startsidan<br>
– Textmodell: Gemini 3 (för närvarande en av de allra bästa textmodellerna för textgenerering)<br><br>

<strong>Google Vertex (Gemini 2.5 Pro – EU-endpunkt)</strong><br>
– Detta är en mer avancerad uppsättning för dig som vill använda Gemini via Google Cloud / Vertex AI med regional EU-endpunkt (t.ex. europe-west1 eller europe-west4).<br>
– Kort sagt: du skapar ett eget Google Cloud-projekt, aktiverar Vertex AI, kopplar det till ett faktureringskonto och deployar en liten backend-funktion (Cloud Run) som ger dig en HTTPS-adress (https://…run.app).<br>
– I denna webbapp klistrar du in denna adress i fältet «Vertex backend URL (https://…run.app)» och den hemliga nyckeln (BACKEND_SECRET) i fältet «Vertex backend secret» på startsidan.<br>
– All användning av Gemini 2.5 Pro går då via ditt eget projekt; både fakturering och databehandling styrs av dig, och du kan välja EU-region för bättre GDPR-anpassning.<br>
– Uppsättningen kan upplevas som lite teknisk, så för en detaljerad steg-för-steg-guide kan du klicka på «Guide»-länken bredvid «Google Vertex»-rubriken ovanför dessa fält på startsidan.<br><br>

<strong>AWS Bedrock (avancerad uppsättning – kan ge full GDPR-efterlevnad)</strong><br>
– Detta är en något mer avancerad uppsättning än de flesta andra alternativ i appen, men kan konfigureras så att det ger en fullt GDPR-anpassad lösning.<br>
– För komplett steg-för-steg-uppsättning: klicka på <strong>«Guide»</strong>-länken bredvid <strong>AWS Bedrock</strong>-rubriken på startsidan (index.html).<br>
– När uppsättningen är klar kommer du att få en <strong>backend URL</strong> och en <strong>secret key</strong>, som du måste klistra in i <strong>AWS Bedrock</strong>-fälten på startsidan av webbappen.<br><br>

<strong>Lemonfox</strong><br>
– Skapa ett konto hos Lemonfox:<br>
https://www.lemonfox.ai<br><br>
– Generera en API-nyckel i Lemonfox-dashboarden (för tal-till-text och/eller textmodell, beroende på vad du använder i appen)<br>
– Lemonfox erbjuder en mycket billig speech-to-text-API, ofta med gratis användning första månaden – se pris-/produktsidan för detaljer. EU-endpunkt (GDPR-vänligt)<br>
– Spara nyckeln säkert och klistra in den i «Lemonfox API key»-fältet på startsidan<br>
– Du kan nu använda:<br>
• Tal-till-text-modell: Lemonfox Speech-to-Text (Whisper v3-baserad, billig och snabb)<br>
• Textgenerering: Lemonfox LLM (Llama 3-baserade modeller)<br><br>

<strong>Deepgram</strong><br>
– Skapa ett konto hos Deepgram:<br>
https://deepgram.com<br><br>
– Gå till utvecklar-/API-sidorna («Developers» / «Docs») och generera en API-nyckel i Deepgram-konsolen<br>
– Spara nyckeln säkert och klistra in den i fältet «Deepgram API key» på startsidan<br>
– Du kan nu använda tal-till-text-modellen Deepgram Nova-3 i appen<br><br>

<strong>Mistral</strong><br>
– Skapa ett konto hos Mistral AI och logga in i konsolen:<br>
https://console.mistral.ai<br><br>
– Ställ in betalning vid behov och gå sedan till «API keys» i konsolen för att generera en Mistral API-nyckel<br>
– Spara nyckeln säkert och klistra in den i fältet «Mistral API key» på startsidan<br>
– Textmodell: Mistral Large<br>
– EU-endpunkt / europeisk datalagring som standard – väl lämpat för GDPR-vänlig användning<br>
`,  
  priceButton: "Pris",
  priceModalHeading: "Kostnadsinformation",
  priceModalText: `
<div>
  <p><strong>Kostnadsinformation</strong></p>

  <p>
    Du betalar endast för det du faktiskt använder, direkt till varje leverantör (OpenAI, Soniox, Google Gemini,
    Lemonfox, Deepgram, Mistral). Det finns inga abonnemang eller påslag i denna app. Priserna nedan är
    cirka-belopp i USD med omräkning till NOK (här används ungefär 1 USD ≈ 11 NOK).
  </p>

  <p><strong>1. Tal-till-text<br>(pris per minut ljud)</strong></p>

  <p><strong>OpenAI – gpt-4o-transcribe</strong><br>
  Ca. 0.006 USD per minut (≈ 0,07 NOK/min).<br>
  15 minuters konsultation: ca. 0.09 USD ≈ 1,00 NOK.</p>

  <p><strong>Soniox (rekommenderas – bäst kvalitet och pris)</strong><br>
  Ca 0.0017 USD per minut.<br>
  15 minuters konsultation: ca. 0.025 USD ≈ 0,30 NOK.</p>

  <p><strong>Lemonfox – Whisper v3</strong><br>
  Ca. 0.50 USD för 3 timmar ljud ≈ 0.17 USD per timme ≈ 0.0028 USD per minut.<br>
  15 minuters konsultation: ca. 0.042 USD ≈ 0,45 NOK.</p>

  <p><strong>Mistral</strong><br>
  API-prissättning börjar runt 0.001 USD per minut.<br>
  15 minuters konsultation: ca. 0.015 USD ≈ 0,17 NOK.</p>

  <p><strong>Deepgram – Nova-3</strong><br>
  Ca 0.004 USD per minut.<br>
  15 minuters konsultation = 0,60 NOK.</p>

  <p><strong>2. Textgenerering – typiska priser (per 1 miljon tokens)</strong></p>

  <p><strong>OpenAI – GPT-5.1</strong><br>
  Input: 1.25 USD (≈ 13,75 NOK)<br>
  Output: 10 USD (≈ 110 NOK)</p>

  <p><strong>OpenAI – chatgpt-4o-latest</strong><br>
  Input: 5 USD (≈ 55 NOK)<br>
  Output: 15 USD (≈ 165 NOK)</p>

  <p><strong>Google Gemini 3</strong><br>
  Input: ca. 2 USD (≈ 22 NOK)<br>
  Output: ca. 12 USD (≈ 132 NOK)</p>

  <p><strong>AWS Bedrock – Claude Sonnet 4</strong><br>
  Input: 3 USD (≈ 33 NOK)<br>
  Output: 15 USD (≈ 165 NOK)</p>

  <p><strong>AWS Bedrock – Claude Sonnet 4.5</strong><br>
  Input: 3 USD (≈ 33 NOK)<br>
  Output: 15 USD (≈ 165 NOK)</p>

  <p><strong>AWS Bedrock – Claude Haiku 4.5</strong><br>
  Input: 1 USD (≈ 11 NOK)<br>
  Output: 5 USD (≈ 55 NOK)</p>


  <p><strong>Mistral – Mistral Large</strong><br>
  Ca. 2 USD per 1M input-tokens och 6 USD per 1M output-tokens (≈ 22 och 66 NOK).</p>

  <p><strong>Lemonfox – Llama 3-baserade modeller</strong><br>
  Typiskt runt 0.50 USD per 1M LLM-tokens input och output (≈ 5,50 NOK).</p>

  <p><strong>3. Vad är tokens – och hur mycket kostar 1 konsultation?</strong></p>

  <p>Modellerna räknar text i tokens, inte i rena ord.</p>

  <ul>
    <li>1 token ≈ 4 tecken ≈ ¾ ord</li>
    <li>100 tokens ≈ 75 ord</li>
    <li>1 000 tokens ≈ 750 ord</li>
  </ul>

  <p>
    15 min konsultation ca:<br>
    2200 input-tokens per 15-minuters konsultation (hela transkriptionen + strukturerad text som skickas in),<br>
    450 output-tokens i den färdiga anteckningen,<br>
    totalt ca. 2650 tokens per konsultation.<br><br>
    Detta innebär att 1 miljon tokens ger ungefär 350–400 konsultationer i denna användning
    (beroende på längd och detaljer).
  </p>

  <p><strong>4. Exempel: kostnad per 15-minuters konsultation</strong></p>

  <p><em>Tal-till-text (ca.-priser per 15 min):</em></p>
  <ul>
    <li>OpenAI gpt-4o-transcribe: ≈ 1,00 NOK</li>
    <li>Soniox: ≈ 0,30 NOK</li>
    <li>Lemonfox (Whisper v3): ≈ 0,45 NOK</li>
    <li>Voxtral (Mistral): ≈ 0,17 NOK</li>
    <li>Deepgram Nova-3 (batch): ≈ 0,70 NOK</li>
  </ul>

  <p><em>Anteckningsgenerering (2200 input + 450 output tokens):</em></p>
  <ul>
    <li>GPT-5.1: ≈ 0,08 NOK per anteckning</li>
    <li>chatgpt-4o-latest: ≈ 0,20 NOK per anteckning</li>
    <li>Gemini 3: ≈ 0,11 NOK per anteckning</li>
    <li>Mistral Large: ≈ 0,08 NOK per anteckning</li>
    <li>Lemonfox LLM: ≈ 0,02 NOK per anteckning</li>
    <li>AWS Bedrock – Claude Sonnet 4 / 4.5: ≈ 0,15 NOK per anteckning</li>
    <li>AWS Bedrock – Claude Haiku 4.5: ≈ 0,05 NOK per anteckning</li>
  </ul>

  <p><em>Några typiska kombinationer för en 15-minuters konsultation:</em></p>

  <ul>
    <li>OpenAI (gpt-4o-transcribe) + GPT-5.1<br>
      ≈ 1,00 NOK (STT) + 0,08 NOK (anteckning) ≈ 1,10 NOK per konsultation
    </li>
    <li>Soniox + GPT-5.1<br>
      ≈ 0,30 NOK (STT) + 0,08 NOK (anteckning) ≈ 0,40 NOK per konsultation
    </li>
    <li>Voxtral + Mistral Large<br>
      ≈ 0,17 NOK (STT) + 0,08 NOK (anteckning) ≈ 0,25 NOK per konsultation
    </li>
    <li>Soniox + Claude Sonnet 4 / 4.5<br>
      ≈ 0,30 NOK (STT) + 0,15 NOK (anteckning) ≈ 0,45 NOK per konsultation
    </li>
    <li>Soniox + Claude Haiku 4.5<br>
      ≈ 0,30 NOK (STT) + 0,05 NOK (anteckning) ≈ 0,35 NOK per konsultation
    </li>
  </ul>

  <p>
    Med andra ord: textmodellen är extremt billig – det är tal-till-text-delen som dominerar kostnaden.
  </p>

  <p><strong>5. Exempel: månadskostnad vid jämn användning</strong></p>

  <p>
    Anta:<br>
    20 konsultationer per dag<br>
    4 dagar per vecka<br>
    4 veckor per månad<br>
    ⇒ ca. 320 konsultationer per månad (≈ 80 timmar ljud).
  </p>

  <p>Då får du ungefär:</p>

  <ul>
    <li>OpenAI gpt-4o-transcribe + GPT-5.1<br>
      ≈ 31 USD ≈ 340 NOK per månad
    </li>
    <li>Soniox + GPT-5.1<br>
      ≈ 10 USD ≈ 110 NOK per månad
    </li>
    <li>Voxtral + Mistral Large<br>
      ≈ 7 USD ≈ 80 NOK per månad
    </li>
    <li>Lemonfox (Whisper v3 + Llama 3)<br>
      ≈ 14 USD ≈ 150 NOK per månad
    </li>
    <li>Deepgram Nova-3 + GPT-5.1<br>
      ≈ 23 USD ≈ 250 NOK per månad
    </li>
    <li>Soniox + Claude Sonnet 4 / 4.5<br>
      ≈ 12 USD ≈ 130 NOK per månad
    </li>
    <li>Soniox + Claude Haiku 4.5<br>
      ≈ 9 USD ≈ 100 NOK per månad
    </li>
  </ul>

  <p>
    Om du inte använder tjänsten (semester, sjukdom, ledighet osv.) tillkommer inga fasta kostnader,
    du betalar endast för faktisk användning hos respektive leverantör.
  </p>
</div>
`,
};

export const transcribeTranslations = {
  pageTitle: "Transkriberingsverktyg med annonser och guideöverlägg",
  openaiUsageLinkText: "Kostnadsöversikt",
  openaiWalletLinkText: "Kredit",
  btnFunctions: "Funktioner",
  btnGuide: "Guide",
  btnNews: "Status & uppdateringar",
  backToHome: "Tillbaka till startsidan",
  recordingAreaTitle: "Inspelningsområde",
  recordTimer: "Inspelningstid: 0 sek",
  transcribeTimer: "Slutförandetid: 0 sek",
  transcriptionPlaceholder: "Transkriberingsresultatet kommer att visas här...",
  startButton: "Starta inspelning",
  readFirstText: "Läs först! ➔",
  stopButton: "Stopp/Slutför",
  pauseButton: "Pausa inspelning",
  statusMessage: "Välkommen! Klicka på \"Starta inspelning\" för att börja.",
  noteGenerationTitle: "Anteckningsgenerering",
  generateNoteButton: "Generera anteckning",
  noteTimer: "Slutförandetid: 0 sek",
  generatedNotePlaceholder: "Genererad anteckning kommer att visas här...",
  customPromptTitle: "Anpassad prompt",
  promptSlotLabel: "Promptplats:",
  customPromptPlaceholder: "Skriv in anpassad prompt här",
  adUnitText: "Din annons här",
  guideHeading: "Guide & instruktioner",
  guideText: `Välkommen till <strong>Transcribe Notes</strong>. Denna applikation låter vårdpersonal, terapeuter och andra yrkesutövare spela in och transkribera konsultationer samt generera professionella anteckningar med hjälp av en AI-baserad anteckningsgenerator.<br><br>

<strong>Så använder du funktionerna:</strong><br><br>

<ul>
  <li><strong>Inspelning:</strong> Patientens samtycke måste alltid inhämtas före inspelning. Välj önskad tal-till-text-modell från rullgardinsmenyn, klicka sedan på "Starta inspelning" för att börja inspelningen..<br><br>
  
  <strong><u>Viktigt:</u> Inspelningsfunktionen fungerar inte i alla webbläsare. Vi rekommenderar därför att använda <strong>Google Chrome</strong> eller <strong>Microsoft Edge</strong>.</strong></li><br>

  <li><strong>Pausa och återuppta:</strong> Du kan använda "Pausa"-knappen för att tillfälligt stoppa inspelningen, till exempel om konsultationen avbryts eller om du behöver lämna kontoret en stund. När du trycker på "Pausa" laddas det aktuella ljudsegmentet upp och transkriberas och inspelningen pausas. När du är redo att fortsätta klickar du på "Fortsätt", och inspelningen återupptas automatiskt med nästa segment. Tidtagaren fortsätter där den slutade, och inspelningen kan till slut avslutas som vanligt med "Stopp/Klar".</li><br>

  <li><strong>Slutförande:</strong> När du klickar på "Stopp/Klar" stoppas inspelningen. Slutförandetimern räknar tiden tills hela transkriptionen har tagits emot (vanligtvis inom 5–10 sekunder).</li><br>

  <li><strong>Anpassad prompt och promptprofiler:</strong> På höger sida väljer du en promptplats (1–10) och skriver in din egen prompt. Prompterna sparas automatiskt på denna enhet. För att göra prompterna oberoende av ändringar i API-nyckel kan du ange ett <strong>Prompt profile ID</strong> (t.ex. “David”, “David 1”, “Office-PC-2”). Aktiv profil visas ovanför promptfältet. Om ingen profil är angiven kan prompterna fortfarande vara sparade med den äldre metoden som var kopplad till API-nyckel.</li><br>

  <li><strong>Export / import (flytta eller dela prompts):</strong> Klicka <strong>Export</strong> för att ladda ned en liten JSON-fil som innehåller alla 10 promptplatser för den aktuella profilen. På en annan PC anger du Prompt profile ID (samma eller ett nytt) och klickar <strong>Import</strong> för att läsa in filen. Import lägger alltid in prompterna i den <strong>aktiva</strong> profilen på den enheten, vilket också gör det enkelt att dela prompt-«mallar» med kollegor.</li><br>

  <li><strong>Byta profil:</strong> När du ändrar Prompt profile ID kommer promptplatserna omedelbart att visa de prompts som är sparade under den profilen. Detta gör att flera kan använda samma PC utan att blanda prompts, så länge varje användare har sin egen profil.</li><br>

  <li><strong>Anteckningsgenerering:</strong> När transkriptionen är slutförd klickar du på "Generera anteckning" för att skapa en anteckning baserad på transkriptionen och den valda/anpassade prompten. Anteckningsgenereringen sker då hos vald leverantör i rullgardinsmenyn i anteckningsgenereringsmodulen. Genererade journalanteckningar måste granskas och valideras av vårdpersonal innan de tas i bruk.</li><br>

  <li><strong>Kostnadsöversikt:</strong> För att se din nuvarande förbrukning hos de olika leverantörerna klickar du på länken för kostnadsöversikt som finns uppe till höger på huvudsidan.</li><br>

  <li><strong>Säkerhet:</strong> Din ljudinspelning skickas direkt till vald leverantör (från rullgardinsmenyn) sina servrar för transkribering, och varken lagras(gäller bara för AWS Bedrock, Google Vertex och Soniox) eller används för maskininlärning. Den transkriberade texten visas endast i din webbläsare och raderas/försvinner så snart du stänger webbläsaren eller laddar in nytt innehåll.</li><br>

  <li><strong>Guide-knapp:</strong> Klicka på "Guide"-knappen igen för att gå tillbaka till huvudvyn.</li>
</ul><br><br>

<strong>Exempel på prompts:</strong><br><br>

<strong>Konsultation:</strong><br>
"Systemprompt – Medicinsk anteckningsgenerator
Syfte: Generera en medicinskt korrekt, journalfärdig anteckning baserad på en transkriberad läkar–patient-samtal.

Struktur (om inget annat anges i diktatet):
Bakgrund (endast vid relevant historik)
Aktuellt/anamnes
Undersökning (punktvis)
Bedömning
Plan

Regler:
– Inkludera endast uppgifter, undersökningar och fynd som explicit framgår i samtalet.
– Ta med negativa fynd endast om de nämns.
– Om blodprover beställs utan specifikation: skriv “relevanta blodprover beställs”. Om blodprover inte nämns som beställda, nämn då ingenting om blodprover.
– Rätta uppenbara felstavningar i läkemedelsnamn.
– Använd inte specialtecken, fetstil eller extra radbrytningar i rubriker.
– Om ett avsnitt ska listas punktvis, använd “-” framför varje punkt.
– Följ explicita instruktioner från läkaren om stil, längd eller ordalydelse.
– Ta med eventuella läkartillägg efter att patienten har lämnat rummet.
– Använd ett precist och flytande journalspråk utan onödiga utfyllnadsord eller repetitioner.
– Språket ska vara medicinskt korrekt, klart och koncist.
– Använd inte ";" eller "-" för att binda ihop meningar. Kan eventuellt använda "," eller bara ha separata meningar.
– Om det läggs till kompletterande information i "[kompletterande information]" ovanför diktatet kan denna information användas som kontext när anteckningen skrivs.
– Du behöver inte skriva "här är den färdiga anteckningen.. etc" före anteckningen. Det räcker att bara skicka anteckningen.
– Dubbelkolla läkemedelsnamn så att de stavas/skrivs korrekt.
– All text ska vara helt oformaterad: ingen användning av fetstil, kursiv, markdown-symboler (som # eller **) eller ändrad textstorlek i varken rubriker eller brödtext.


Syftet är att producera en färdig, journalgod anteckning som kan användas direkt i patientjournal utan vidare redigering."<br><br>

<strong>Brev till patient:</strong><br>
"Skriv brev. Börja brevet med «Hej [namn],(sedan dubbel radbrytning)»(om namn inte nämns säg bara "Hej"). Avsluta alltid med:
«Med vänliga hälsningar
<LEGENS NAMN>
<MOTTAGNINGENS NAMN>».

Lägg inte till information eller artighetsfraser som inte nämns. Du kan ändra meningsstruktur/grammatik/språk/ordning vid behov så att texten blir bättre, eventuellt rätta språket. Om jag säger "hör bara av dig om du undrar något mer," så skriv inget annat än detta på slutet. 
"<br><br>

Detta är exempel som fungerar bra, men du står fritt att anpassa dem så att de passar din dokumentationsstil, specialitet och typ av konsultation. Du kan också skapa helt egna prompts för vilket syfte du vill.  
`,
};

export default { indexTranslations, transcribeTranslations };
