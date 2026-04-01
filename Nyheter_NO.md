## 30. mars 2026

### Ny auto-copy funksjon lagt til for ferdige notater

Det er nå lagt til en ny **Auto-copy**-funksjon i appen.

Når denne funksjonen er aktivert, blir ferdige notater automatisk kopiert til utklippstavlen så snart notatgenereringen er fullført. Dette betyr at du kan trykke **Ctrl + V** og lime inn notatet med en gang, selv om Transcribe Notes-fanen ikke er i fokus.

Du kan derfor fortsette å jobbe i et annet program, en annen nettleserfane eller et annet vindu mens notatet genereres. Når notatet er ferdig og kopiert, kan det også vises et **skrivebordsvarsel / notification**, slik at du får beskjed med en gang om at notatet er klart.

### Slik bruker du auto-copy funksjonen

For å bruke denne funksjonen må du først installere Chrome-utvidelsen som er knyttet til auto-copy.

Utvidelsen kan lastes ned direkte fra **Auto-copy-tooltipen** i appen. Åpne tooltip-ikonet ved siden av Auto-copy-valget og klikk på nedlastingslenken der.

Etter nedlasting:
1. Pakk ut `.zip`-filen slik at du får en vanlig mappe
2. Åpne Chrome Extensions ved å gå til <a href="chrome://extensions" target="_blank" rel="noopener">chrome://extensions</a>
3. Slå på **Developer mode** øverst til høyre
4. Klikk **Load unpacked**
5. Velg den utpakkede mappen for utvidelsen
6. Oppdater / refresh Transcribe Notes-siden
7. Slå på **Auto-copy** i appen

Det ligger også en README-tekstfil inni den utpakkede mappen med installasjonsinstruksjoner. 

### Varsler i Windows

For å få Chrome-varslet når kopieringen er fullført, må varsler være tillatt både i **Windows** og i **Chrome**. Hvis én av dem blokkerer varsler, kan popup-varslet utebli. 

I Windows går du til:

**Innstillinger → System → Varsler**

Kontroller at:
- Varsler er slått på
- Google Chrome har tillatelse til å sende varsler

I Chrome må varsler også være tillatt for det aktuelle nettstedet under:

**Innstillinger → Personvern og sikkerhet → Nettstedsinnstillinger → Varsler** 

Kontroller også at **Ikke forstyrr / Fokusassistent** er slått av, eller at Chrome er tillatt.

### Viktig ved bruk i inkognitovindu

Hvis du bruker appen i et **inkognitovindu**, må du også tillate at utvidelsen kan brukes i inkognito.

Dette gjør du slik:
1. Åpne <a href="chrome://extensions" target="_blank" rel="noopener">chrome://extensions</a>
2. Finn den installerte auto-copy-utvidelsen
3. Klikk på **Details**
4. Slå på valget som tillater bruk i **Incognito**

Hvis dette ikke er aktivert, vil auto-copy-funksjonen ikke fungere i inkognitovinduer.

Denne nye funksjonen kan gjøre arbeidsflyten raskere og mer fleksibel, spesielt hvis du vil jobbe videre andre steder mens du venter på at et notat skal bli ferdig.

---

## 30. mars 2026

### Ny auto-copy funksjon lagt til for ferdige notater

Det er nå lagt til en ny **Auto-copy**-funksjon for notatgenerering.

Når denne funksjonen er slått på, blir ferdige notater automatisk kopiert til utklippstavlen straks notatet er klart. Dette gjør at du kan trykke **Ctrl + V** med en gang for å lime inn notatet, selv om du ikke har app-fanen i fokus.

Du kan derfor fortsette å jobbe i et annet program, et annet vindu eller en annen nettleserfane mens notatet genereres.

Når notatet er ferdig kopiert, vises det også et **skrivebordsvarsel/notification** slik at du får beskjed med en gang uten å måtte følge med på appen hele tiden.

Dette kan gjøre arbeidsflyten raskere og mer praktisk, spesielt hvis du venter på notatet mens du gjør andre oppgaver parallelt.

---

## 26. mars 2026

Det er nå lagt til en **Avbryt**-knapp for notatgenerering.

Hvis et notat er i ferd med å bli generert og du vil stoppe det, kan du nå klikke **Avbryt** for å avbryte den pågående genereringen og starte et nytt notat.

Det er også nå lagt til løpende **ordtelling** og **tokentelling** for transkripsjonsfeltet, feltet for tilleggsopplysninger og promptfeltet.

I tillegg er det lagt til visuelle signaler som gjør det enklere å se når transkribering og notatgenerering har startet eller er fullført.

---

## 16. mars 2026

### Ny abort-knapp lagt til under opptak

Det er nå lagt til en egen **Abort**-knapp under opptak. Denne kan brukes hvis du vil avbryte et pågående opptak uten å sende det til transkripsjon.

Tidligere var eneste måte å avbryte et opptak på å oppdatere/refresh(F5) siden. Hvis du i stedet trykket **Stop**, ble opptaket transkribert så langt det var kommet, noe som også kunne gi token-kostnad for et opptak du egentlig ikke ønsket å transkribere.

---

## 15. mars 2026

### Fikset: informasjonsknappene på forsiden fungerer igjen

Det ble nylig oppdaget at informasjonsmodulene/informasjonsknappene på forsiden ved en feil har vært deaktivert den siste uken eller to.

Dette er nå rettet, og informasjonsknappene kan igjen åpnes og vises som normalt.

---

## 11. mars 2026

### Viktig: oppdater nettsiden jevnlig for å få nyeste versjon

Denne appen er **100 % front-end**, noe som betyr at oppdateringer i appen først blir synlige når nettsiden oppdateres.

Hvis du lar appen stå åpen i en nettleserfane over lang tid, for eksempel i dager eller uker, kan du fortsatt se en eldre versjon av appen selv om nye oppdateringer allerede er lagt ut.

For å være sikker på at du bruker nyeste versjon, bør du refreshe/oppdatere siden jevnlig. På Windows kan du bruke **Ctrl + F5** for å gjøre en hard refresh.

Dette er spesielt viktig etter at nye oppdateringer eller endringer er gjort i appen.

---

## 9. mars 2026

### Ny Redactor-modul lagt til

En ny **Redactor**-modul er nå lagt til appen.

Dette verktøyet gjør det mulig å raskt sladde eller skjule sensitiv informasjon i diktat og supplerende informasjons-feltene ved behov, før videre bruk. Modulen støtter både **generelle begreper** og **spesifikke begreper**, som brukes når du klikker **Redact**. Det er også lagt til en innebygd **fødselsdatohjelper** for å gjøre det enklere å legge til datorelatert sensitiv informasjon.

### OCR-funksjon er nå inkludert i Redactor

Redactor-modulen inneholder også en innebygd **OCR**-funksjon.

Dette betyr at du kan lime inn et skjermbilde, trykke **Ctrl + V** mens bildefeltet er i fokus, eller laste opp en bildefil, og deretter hente ut tekst direkte fra bildet.

OCR-resultatet kan enten:
- settes inn som **råtekst**, eller
- sendes direkte til feltet for **spesifikke begreper** for raskere oppsett av sladding

Dette gjør det enklere å sladde sensitivt innhold både fra transkripsjoner og fra skjermbilder eller annet bildebasert materiale.

---

## 7. mars 2026

**GPT-5.4** er nå lagt til i OpenAI-modellmenyen for notatgenerering.

### Prising:
GPT-5.4 koster for øyeblikket **$2.50 per 1 million input-tokens** og **$15.00 per 1 million output-tokens**.

### Viktig om personvern / GDPR:
Vær oppmerksom på at bruk av **GPT-5.4** og de andre **OpenAI-modellene** i dagens standardoppsett **ikke er GDPR-kompatibelt for sensitive/pasientrelaterte data**, fordi data **ikke behandles i EU som standard**, og OpenAI opplyser at API-data kan **lagres i opptil 30 dager før sletting**.

For arbeidsflyter for notatgenerering som krever et **GDPR-kompatibelt oppsett**, anbefales **AWS Bedrock** i stedet.

### Oppdatering av promptmodulen:
Promptmodulen er nå oppdatert slik at prompt-slottene kan **omorganiseres med dra-og-slipp**.

Slik omorganiserer du slottene:
- Åpne prompt-slotmenyen
- Klikk og hold på drag-håndtaket ved siden av en slot
- Dra slotten opp eller ned til ønsket posisjon
- Slipp museknappen for å lagre den nye rekkefølgen

---

## 4. mars 2026

### Midlertidig kapasitetsproblem med Claude Opus 4.6 (AWS Bedrock)

Det er for øyeblikket rapportert perioder hvor **Claude Sonnet/Opus 4.6** via AWS Bedrock kan være overbelastet. Dette kan føre til at generering av notater noen ganger feiler og gir en feilmelding fra AWS.

Hvis dette skjer, anbefales det å **midlertidig bruke Claude Sonnet/Opus 4.5**, som fungerer stabilt og gir svært tilsvarende resultater.

Dette skyldes kapasitet hos AWS/Bedrock og ikke et problem i appen. Når belastningen på Opus 4.6 normaliserer seg vil modellen fungere som normalt igjen.

---

## 3. mars 2026

Claude Sonnet 4.6 og Claude Opus 4.6 er nå lagt til i AWS Bedrock-modellmenyen i appen.

Disse 4.6-modellene er nyeste generasjon og gir generelt bedre resonnering, bedre forståelse av instruksjoner, og høyere kvalitet på sammendrag/notater enn 4.5—spesielt for lengre eller mer komplekse transkripsjoner.

**Pris:** Claude Sonnet 4.6 koster det samme som Claude Sonnet 4.5, og Claude Opus 4.6 koster det samme som Claude Opus 4.5.

### Viktig (AWS-brukere): Oppdater stacken din

For å bruke Sonnet 4.6 / Opus 4.6 må du oppdatere den eksisterende AWS proxy-stacken din (CloudFormation). Oppdateringen aktiverer nødvendig Bedrock-oppsett for disse modellene.

**Slik oppdaterer du funksjonen:**  
Gå til forsiden, klikk på «AWS guide»-knappen ved siden av AWS Bedrock-feltene, scroll helt til bunnen, og følg instruksjonene under «SLIK OPPDATERER DU STACKEN (CLOUDFORMATION)». Når oppdateringen er fullført kan du velge og bruke Sonnet 4.6 / Opus 4.6 i appen.

<a href="index.html#bedrock-update-stack" target="_blank" rel="noopener">SLIK OPPDATERER DU STACKEN (CLOUDFORMATION)</a>

---

## 2.mars 2026

Denne nye info-knappen viser løpende statusmeldinger og endringer i webappen (som nye funksjoner, feilrettinger og viktige beskjeder).

### AWS time limit oppdatering:

Frem til nå har notater generert med AWS modellene hatt en tidsgrense på 45 sec, som gjør at hvis det tar mer en 45 sec å generere notatet så vil det resultere i en feilmelding. Dette problemet er nå løst ved at tidsgrensen er økt til 2,5 min, som vil være mer en nok for å generere et notat.

For å utføre denne oppdateringen så må du som bruker oppdatere AWS funksjonen som du allerede har laget hvis du har brukt AWS modellene så langt.

For å oppdatere din funksjon; Gå til forsiden, klikk “AWS guide”-knappen ved siden av feltene for AWS Bedrock key, scroll helt nederst på siden, og følg instrusjonene ved "SLIK OPPDATERER DU STACKEN (CLOUDFORMATION)". Når dette er gjort, vil problemet være løst.
