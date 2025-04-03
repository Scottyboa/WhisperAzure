// js/language-de.js

export const indexTranslations = {
  pageTitle: "Whisper Klinische Transkription",
  headerTitle: "Whisper Klinische Transkription",
  headerSubtitle: "Fortschrittliche KI-gestützte Sprach-zu-Text-Transkription und Notizenerstellung für medizinische Konsultationen",
  startText: "Um zu beginnen, geben Sie bitte Ihren OpenAI API-Schlüssel ein:",
  apiPlaceholder: "Geben Sie hier den API-Schlüssel ein",
  enterButton: "Transkriptionstool öffnen",
  guideButton: "API-Anleitung – So nutzen Sie es",
  securityButton: "Sicherheit",
  aboutButton: "Über",
  adRevenueMessage: "Da diese Website kostenlos genutzt werden kann und ausschließlich auf Werbeeinnahmen angewiesen ist, stimmen Sie bitte personalisierter Werbung zu, um den Dienst zu unterstützen.",
  securityModalHeading: "Datenschutz",
securityModalText: `Ihre Privatsphäre und die Sicherheit der Patientendaten haben oberste Priorität. Wir setzen robuste Maßnahmen ein, um sicherzustellen, dass Ihre Daten vertraulich und sicher bleiben:<br><br>
- <strong>Datenverschlüsselung:</strong> Alle von unserem System verarbeiteten Daten – einschließlich Audioaufnahmen, Transkriptionen und Notizen – werden mit branchenüblichen Methoden verschlüsselt. Transkriptionen und Notizen sind ausschließlich mit Ihrem verschlüsselten persönlichen API-Schlüssel und dem für den Zugriff verwendeten Gerät verknüpft, sodass nur Sie den generierten Inhalt einsehen können.<br><br>
- <strong>Automatische Löschung:</strong> Sobald eine Transkription oder ein Notiz erstellt und auf Ihrem Bildschirm angezeigt wird, wird sie automatisch und unwiderruflich innerhalb von 2 Minuten von unseren Servern gelöscht. Audiodateien werden nur temporär zur Verarbeitung gespeichert und nicht über den unmittelbaren Gebrauch hinaus aufbewahrt.<br><br>
- <strong>Schutz vor unbefugtem Zugriff:</strong> Selbst wenn unbefugter Zugriff auf Ihren API-Schlüssel erfolgen sollte, bleiben Ihre Daten verschlüsselt und durch gerätespezifische Marker gesichert, wodurch die Informationen unzugänglich werden.<br><br>
- <strong>DSGVO-konformes Hosting:</strong> Alle Backend-Prozesse laufen auf dedizierten Microsoft Azure-Servern innerhalb der EU und entsprechen vollständig den DSGVO-Vorschriften.<br><br>
<strong>Zusätzliche Datenschutzpraktiken:</strong><br><br>
- <strong>Minimale Datenerfassung:</strong> Wir erheben nur die wesentlichen Informationen, die zur Bereitstellung unserer Dienste erforderlich sind. Dazu gehören Ihr OpenAI API-Schlüssel (während Ihrer Sitzung in verschlüsselter Form gespeichert), ein ausschließlich für die Verschlüsselung verwendeter Gerätetoken sowie Ihre Spracheinstellung. Es werden keine weiteren persönlichen Daten gespeichert.<br><br>
- <strong>Verwendung von Cookies:</strong> Unsere Webseite nutzt Cookies, um Benutzerpräferenzen zu speichern und das Einverständnis für personalisierte Werbung zu verwalten, was Ihre Nutzererfahrung verbessert. Sie können Ihre Cookie-Einstellungen über das Einverständnisbanner auf unserer Seite verwalten.<br><br>
- <strong>Weitergabe an Dritte:</strong> Wir verkaufen oder teilen Ihre persönlichen Daten nicht mit Dritten. Daten werden nur an vertrauenswürdige externe Dienste weitergegeben (wie OpenAI für Transkription und Notizgenerierung sowie Google AdSense für die Anpassung von Werbung) und dies unter strengen Datenschutzstandards.<br><br>
Bitte beachten Sie, dass aufgrund unseres Systemdesigns alle Daten kurz nach der Verarbeitung automatisch gelöscht werden und nicht langfristig gespeichert werden.`,
  aboutModalHeading: "Über uns",
  aboutModalText: `Diese Website wurde entwickelt, um Gesundheitsfachkräfte und andere Nutzer mit direktem Zugang zu hochwertiger Spracherkennung und klinischer Notizgenerierung zu versorgen – ohne unnötige Kosten oder Zwischenhändler.<br><br>
Durch die Verwendung Ihres eigenen OpenAI API-Schlüssels verbinden Sie sich direkt mit der Quelle der Technologie. Das bedeutet, dass Sie nur die tatsächlichen Nutzungskosten zahlen, die von OpenAI festgelegt werden, ohne Aufschläge oder Abonnementgebühren.<br><br>
Viele bestehende Anbieter offerieren ähnliche Dienste, verlangen jedoch deutlich mehr – oftmals 8 bis 10 Mal die tatsächlichen Kosten der zugrunde liegenden Technologie. Diese Plattform bietet dieselbe Funktionalität zu einem Bruchteil des Preises.<br><br>
<strong>Wichtige Punkte:</strong><br>
• Kein Abonnement, kein Konto erforderlich.<br>
• Sie zahlen nur OpenAI direkt für die tatsächlich genutzte Leistung.<br>
• Die Website selbst ist völlig kostenlos.<br><br>
Damit es so bleibt, müssen Nutzer Werbung akzeptieren. Werbeeinnahmen helfen dabei, Hosting- und Betriebskosten zu decken, sodass der Dienst für alle zugänglich und kostenlos bleibt.`,
  guideModalHeading: "Anleitung",
 guideModalText: `Um diese Web-App zu nutzen, müssen Sie zunächst ein OpenAI API-Profil erstellen, einen API-Schlüssel generieren und Ihre OpenAI-Brieftasche aufladen. Anschließend kopieren Sie Ihren API-Schlüssel und fügen ihn in das bereitgestellte API-Schlüsselfeld ein. Sobald Sie die Eingabetaste drücken, wird der API-Schlüssel temporär für Ihre Sitzung gespeichert – dieser Schlüssel verbindet Sie mit den OpenAI-Servern, sodass die Sprach-zu-Text-Transkription und die Notizgenerierung funktionieren. Bitte beachten Sie, dass Ihnen pro ausgeführter Aufgabe sofort Kosten in Rechnung gestellt werden. Für weitere Informationen zu den Kosten lesen Sie bitte den Abschnitt "Kosten" auf der Startseite.
<br><br>
<strong>1. Erstellen Sie Ihr OpenAI API-Profil</strong><br>
Zu Beginn müssen Sie ein Profil auf der OpenAI API-Plattform erstellen. Dieses Profil dient als Ihr Konto zur Verwaltung von API-Schlüsseln und zur Abrechnung. Um loszulegen, besuchen Sie die <a href="https://platform.openai.com/signup" style="color:blue;">OpenAI API-Anmeldung</a>. Befolgen Sie die Anweisungen zur Registrierung, indem Sie Ihre E-Mail-Adresse angeben, ein Passwort festlegen und Ihr Konto verifizieren. Nach der Registrierung haben Sie Zugriff auf Ihr Dashboard.
<br><br>
<strong>2. Generieren Sie einen API-Schlüssel</strong><br>
Nachdem Sie Ihr Profil erstellt haben, generieren Sie einen API-Schlüssel, indem Sie zur <a href="https://platform.openai.com/account/api-keys" style="color:blue;">API-Schlüsselverwaltung</a> navigieren. Klicken Sie auf die Schaltfläche, um einen neuen API-Schlüssel zu erstellen. Wichtig: Sie sehen Ihren API-Schlüssel nur einmal. Kopieren Sie ihn sofort und speichern Sie ihn sicher (z. B. in einer Textdatei) für die zukünftige Verwendung. Wenn Sie den Schlüssel verlieren oder vermuten, dass er kompromittiert wurde, löschen Sie ihn aus Ihrem Konto und erstellen einen neuen.
<br><br>
<strong>3. Laden Sie Ihre OpenAI-Brieftasche auf</strong><br>
Damit die Web-App funktioniert, muss Ihre OpenAI-Brieftasche über ausreichende Mittel verfügen. Besuchen Sie die <a href="https://platform.openai.com/account/billing/overview" style="color:blue;">Abrechnungs- und Zahlungsseite</a>, um Mittel hinzuzufügen. Sie können jederzeit jeden Betrag überweisen. Solange ausreichende Mittel vorhanden sind, können Sie die Seite nutzen – jede Aufgabe wird sofort berechnet.
<br><br>
<strong>Hinweis zur Sitzungs-Sicherheit</strong><br>
Wenn Sie sich anmelden, indem Sie Ihren API-Schlüssel eingeben, wird dieser nur temporär in Ihrer Browsersitzung gespeichert. Das bedeutet, dass der API-Schlüssel nicht gespeichert wird, wenn Sie die Website verlassen, Ihren Browser schließen oder Ihren Computer ausschalten. Beim nächsten Besuch der Web-App müssen Sie Ihren API-Schlüssel erneut eingeben, um die Sicherheit Ihres Schlüssels zu gewährleisten.`,
  priceButton: "Preis",
  priceModalHeading: "Preis",
  priceModalText: `
    <h1>Kosteninformationen</h1>
    <h2>Preisgestaltung für Sprach-zu-Text</h2>
    <ul>
      <li><strong>Kosten:</strong> $0.006 pro Minute. <em>Beispiel:</em> Eine 15-minütige Konsultation kostet 15 × $0.006 = <strong>$0.09</strong> pro Konsultation.</li>
    </ul>
    <h2>Preisgestaltung für Notizenerstellung</h2>
    <ul>
      <li><strong>Token-basierte Preisgestaltung:</strong></li>
      <ul>
        <li><strong>Input (Transkription + Prompt):</strong> $10 pro 1.000.000 Tokens (d.h. $0.00001 pro Token).</li>
        <li><strong>Output (generierte Notiz):</strong> $30 pro 1.000.000 Tokens (d.h. $0.00003 pro Token).</li>
      </ul>
    </ul>
    <h3>Beispielrechnung (nur Notizenerstellung)</h3>
    <ol>
      <li>
        <strong>Berechnung der Eingabe:</strong><br>
        Angenommen, die Transkription umfasst etwa <strong>700 Wörter</strong> und Sie fügen einen <strong>30-Wörter-Prompt</strong> hinzu.<br>
        Gesamtwörter = 700 + 30 = <strong>730 Wörter</strong>.<br>
        Geschätzte Tokens = 730 × 0.75 ≈ <strong>547,5 Tokens</strong>.<br>
        Eingabekosten = 547,5 Tokens × $0.00001 ≈ <strong>$0.0055</strong>.
      </li>
      <li>
        <strong>Berechnung der Ausgabe:</strong><br>
        Angenommen, die generierte Notiz umfasst etwa <strong>250 Wörter</strong>.<br>
        Geschätzte Tokens = 250 × 0.75 ≈ <strong>187,5 Tokens</strong>.<br>
        Ausgabekosten = 187,5 Tokens × $0.00003 ≈ <strong>$0.0056</strong>.
      </li>
      <li>
        <strong>Gesamtkosten der Notizenerstellung:</strong><br>
        Ungefähr $0.0055 + $0.0056 = <strong>$0.0111</strong> pro Konsultation.
      </li>
    </ol>
    <h2>Ungefähre Gesamtkosten pro Konsultation</h2>
    <p>(für eine 15-minütige Konsultation mit beiden Funktionen)</p>
    <ul>
      <li><strong>Sprach-zu-Text:</strong> <strong>$0.09</strong></li>
      <li><strong>Notizenerstellung:</strong> <strong>$0.0111</strong></li>
      <li><strong>Gesamt:</strong> Etwa <strong>$0.101</strong> pro Konsultation.</li>
    </ul>
    <h2>Monatliche Kostenschätzungen</h2>
    <p>Bei 20 Konsultationen pro Tag, 4 Tage die Woche, über 4 Wochen im Monat (20 × 4 × 4 = <strong>320 Konsultationen</strong> pro Monat):</p>
    <ol>
      <li>
        <strong>Nur Sprach-zu-Text:</strong><br>
        Monatliche Kosten = 320 × $0.09 = <strong>$28.80</strong>.
      </li>
      <li>
        <strong>Sprach-zu-Text und Notizenerstellung:</strong><br>
        Monatliche Kosten = 320 × $0.101 ≈ <strong>$32.32</strong>.
      </li>
    </ol>
    <h2>Flexibilität in der Nutzung</h2>
    <p>Im Gegensatz zu Anbietern mit monatlichen Abonnements zahlen Sie nur pro Nutzung. Sollten Sie einen Tag aussetzen oder weniger aktiv sein, entstehen keine Kosten. Selbst bei täglicher Nutzung bleiben die Kosten pro Konsultation deutlich geringer als bei anderen Anbietern.</p>
    <hr>
    <h2>Vorteil der direkten Verbindung</h2>
    <p>Unsere Webapp verbindet Sie direkt mit der OpenAI API – ohne Zwischenhändler und zusätzliche Gebühren. Das bedeutet, Sie zahlen nur für die tatsächlichen KI-Verarbeitungskosten, was unseren Service zu einer der preiswertesten Lösungen für Sprach-zu-Text und Notizenerstellung macht.</p>
  `,
};

export const transcribeTranslations = {
  pageTitle: "Transkriptionstool mit Werbung und Anleitung",
  openaiUsageLinkText: "Kostenübersicht",
  btnFunctions: "Funktionen",
  btnGuide: "Anleitung",
  recordingAreaTitle: "Aufnahmebereich",
  recordTimer: "Aufnahmetimer: 0 sek",
  transcribeTimer: "Abschlusstimer: 0 sek",
  transcriptionPlaceholder: "Transkriptionsergebnis wird hier angezeigt...",
  startButton: "Aufnahme starten",
  stopButton: "Stoppen/Abschließen",
  pauseButton: "Aufnahme pausieren",
  statusMessage: "Willkommen! Klicken Sie auf 'Aufnahme starten', um zu beginnen.",
  noteGenerationTitle: "Notizenerstellung",
  generateNoteButton: "Notiz generieren",
  noteTimer: "Notiz-Timer: 0 sek",
  generatedNotePlaceholder: "Generierte Notiz erscheint hier...",
  customPromptTitle: "Benutzerdefinierter Prompt",
  promptSlotLabel: "Prompt-Slot:",
  customPromptPlaceholder: "Benutzerdefinierten Prompt hier eingeben",
  adUnitText: "Ihre Anzeige hier",
  guideHeading: "Anleitung & Instruktionen",
guideText: `Willkommen beim Whisper Transkriptionstool. Diese Anwendung ermöglicht es medizinischen Fachkräften, Therapeuten und anderen Anwendern, Konsultationen aufzunehmen und zu transkribieren sowie professionelle Notizen mithilfe eines KI-gestützten Notizgenerators zu erstellen.<br><br>
<strong>So nutzen Sie die Funktionen:</strong>
<ul>
  <li><strong>Aufnahme:</strong> Klicken Sie auf "Aufnahme starten", um die Audioaufnahme zu beginnen. Alle 2 Minuten wird ein Abschnitt der Aufnahme automatisch an die OpenAI-Server zur Transkription gesendet. Die Transkripte werden der Reihe nach im Transkriptions-Ausgabefeld angezeigt.</li>
  <li><strong>Vollständigkeit:</strong> Nach dem Klick auf "Stoppen/Abschließen" wird die Aufnahme beendet. Der Abschlusstimer zählt, bis das vollständige Transkript empfangen wurde (in der Regel innerhalb von 5–10 Sekunden).</li>
  <li><strong>Notizgenerierung:</strong> Sobald die Transkription abgeschlossen ist, klicken Sie auf "Notiz generieren", um eine Notiz basierend auf Ihrem Transkript und Ihrem benutzerdefinierten Prompt zu erstellen.</li>
  <li><strong>Benutzerdefinierter Prompt:</strong> Wählen Sie rechts einen Prompt-Slot (1–10) und geben Sie Ihren benutzerdefinierten Prompt ein. Ihr Prompt wird automatisch gespeichert und mit Ihrem API-Schlüssel verknüpft.</li>
  <li><strong>Nutzungsübersicht:</strong> Um Ihre aktuelle Nutzung bei OpenAI zu überprüfen, klicken Sie auf den Link zur Nutzungsübersicht im Hauptinterface.</li>
  <li><strong>Sicherheit:</strong> Ihre Audiodaten werden verschlüsselt und auf sicheren Microsoft Azure-Servern verarbeitet. Außerdem werden Transkripte und Notizen kurz nach der Verarbeitung automatisch gelöscht, um Ihre Privatsphäre zu schützen.</li>
  <li><strong>Guide-Umschaltung:</strong> Klicken Sie erneut auf die "Guide"-Schaltfläche, um zum Hauptinterface zurückzukehren.</li>
</ul>`
};
