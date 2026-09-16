NOTE AUTO-COPY FOR FIREFOX

Dette er Firefox-utvidelsen for WhisperAzure. Bruk den sammen med appens
Mini Panel / Firefox-oppdatering. Chrome-pakken autocopy.zip er separat.

INSTALLASJON FOR TESTING
1. Pakk ut Autocopy_ff.zip til en mappe du beholder på PC-en.
2. Åpne Firefox og skriv about:debugging#/runtime/this-firefox i adressefeltet.
3. Velg «Load Temporary Add-on» / «Last inn midlertidig utvidelse».
4. Velg manifest.json i den utpakkede mappen.
5. Oppdater appens åpne faner. Vent til alle Workspaces er lastet.
6. Velg Transkripsjon eller Notat i Auto-copy. Test med en kort testtekst.

Les dette: En midlertidig utvidelse fjernes når Firefox avsluttes.
Gjenta trinn 2–5 etter omstart. ZIP-filen er ikke en permanent installasjon.
Permanent installasjon i vanlig Firefox krever at utvikleren får pakken
signert av Mozilla og distribuerer den signerte XPI-filen. Ingen innstilling
for å slå av signaturkontroll er nødvendig eller anbefalt.

BRUK
- Transkripsjon: ferdig transkripsjon kopieres automatisk.
- Notat: ferdig hovednotat kopieres automatisk.
- Av: ingen automatisk kopiering fra disse to funksjonene.
- Redactor har sitt eget Auto-copy-valg.
- Pilen «Jump to selected tab» i Mini Panel aktiverer valgt nettleserfane.
- Varsler avhenger av Firefox og Windows/macOS/Linux sine innstillinger.
- Hvert Workspace har sitt eget Auto-copy-valg.

MIKROFON OG MINIPANEL
Gi nettstedet mikrofontillatelse i hovedfanen første gang. Hvis panelet
viser «Starter opptak» eller en tillatelsesfeil, åpne hovedfanen og kontroller
tillatelsen. Utvidelsen omgår ikke mikrofontillatelser. I nyere Firefox brukes
Document Picture-in-Picture hvis tilgjengelig; ellers åpnes et popup-vindu.
Tillat popup-vinduer for appen ved behov.
Et vanlig popup-vindu er ikke garantert å ligge over andre programmer.

FEILSØKING
Hvis Auto-copy er grått: sjekk at utvidelsen er lastet, at tilgang til appens
nettsted er gitt, og oppdater appfanen. Firefox 128 eller nyere kreves.
Utvidelsen virker på https://scottyboa.github.io/ og https://tn-beta.netlify.app/.
Det er ikke nødvendig å gi den tilgang til alle nettsteder.

DATA
Teksten behandles lokalt for å kopieres til utklippstavlen. Utvidelsen sender
ikke teksten til en server, lagrer ikke API-nøkler og leser ikke utklippstavlen.
Tekst som er kopiert, blir liggende på operativsystemets utklippstavle til den
erstattes eller slettes; eventuell utklippstavlehistorikk styres av systemet.

Offisiell installasjonsveiledning:
https://extensionworkshop.com/documentation/develop/temporary-installation-in-firefox/
https://extensionworkshop.com/documentation/publish/signing-and-distribution-overview/
