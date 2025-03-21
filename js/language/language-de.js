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
  securityModalHeading: "Sicherheitsinformationen",
  securityModalText: `Ihre Privatsphäre und die Sicherheit von Patientendaten haben höchste Priorität. Um die Vertraulichkeit der Daten zu gewährleisten:
- <strong>Datenverschlüsselung:</strong> Alle vom System verarbeiteten Daten werden mit branchenüblichen Verschlüsselungsmethoden gesichert. Transkripte und Notizen sind ausschließlich mit Ihrem verschlüsselten persönlichen API-Schlüssel und dem verwendeten Gerät verknüpft, sodass nur Sie Zugriff auf die generierten Inhalte haben.
- <strong>Automatische Löschung:</strong> Sobald ein Transkript oder eine Notiz erstellt und angezeigt wird, wird es innerhalb von 2 Minuten automatisch und unwiderruflich von den Servern gelöscht.
- <strong>Schutz vor unbefugtem Zugriff:</strong> Selbst bei unbefugtem Zugriff auf Ihren API-Schlüssel bleiben die Daten verschlüsselt und durch gerätespezifische Marker geschützt, sodass die Informationen unzugänglich bleiben.
- <strong>GDPR-konformes Hosting:</strong> Alle Backend-Prozesse laufen auf dedizierten Microsoft Azure-Servern in der EU, die vollständig den GDPR-Richtlinien entsprechen.`,
  aboutModalHeading: "Über dieses Projekt",
  aboutModalText: `Ich bin ein norwegischer Hausarzt mit großem Interesse an technologischen Fortschritten, insbesondere im Bereich der künstlichen Intelligenz. Ich habe die Entwicklungen der KI im Gesundheitswesen aufmerksam verfolgt.
Als ich von Unternehmen erfuhr, die Sprach-zu-Text-Dienste für medizinische Konsultationen in Norwegen anbieten, war ich begeistert. Kollegen und Online-Bewertungen lobten diese Dienste, wiesen aber auch auf hohe Kosten hin, obwohl die tatsächlichen Technologiekosten nur einen Bruchteil ausmachen.
Motiviert von dieser Erkenntnis entwickelte ich zunächst eine eigene Lösung für den persönlichen Gebrauch, bevor ich sie online zugänglich machte, um dieselbe Geschwindigkeit, Genauigkeit und Qualität zu bieten wie Premium-Dienste – jedoch ohne hohe Gebühren.
Diese Plattform berechnet keine zusätzlichen Gebühren oder Aufschläge.
• Sie zahlen direkt an OpenAI – Sie erhalten direkten Zugriff auf die Technologie ohne Zwischenhändler.
• Daher ist es die günstigste Option bei erstklassiger Qualität.
Ich bin überzeugt, dass die Dienste vieler Anbieter zwar nützlich, aber überteuert sind. Viele meiner Kollegen zahlen zu viel, um Zugang zu einem Werkzeug zu erhalten, das für alle erschwinglich sein sollte.
Diese Website ist völlig kostenlos – Ihre einzige Ausgabe ist die direkte Nutzungsgebühr von OpenAI für Transkriptionen.
• Keine monatlichen Gebühren, keine Abonnements, keine Verpflichtungen – Sie zahlen nur für die durchgeführten Aufgaben.
• Sie kontrollieren Ihre Ausgaben, indem Sie entscheiden, wie viel Sie auf Ihre OpenAI-Wallet überweisen.
Das Einzige, was ich bitte, ist die Zustimmung zu personalisierter Werbung, die zur Deckung der Serverkosten beiträgt.`,
  guideModalHeading: "Einrichtung Ihrer OpenAI API für Whisper Klinische Transkription",
  guideModalText: `Um diese Webapp zu nutzen, müssen Sie zunächst ein OpenAI API-Profil erstellen, einen API-Schlüssel generieren und Ihre OpenAI-Wallet aufladen. Kopieren Sie Ihren API-Schlüssel und fügen Sie ihn in das vorgesehene Feld ein. Nach dem Drücken der Eingabetaste wird der API-Schlüssel vorübergehend für Ihre Sitzung gespeichert – dieser Schlüssel verbindet Sie mit den OpenAI-Servern, sodass Sprach-zu-Text-Transkriptionen und die Notizenerstellung funktionieren. Bitte beachten Sie, dass für jede Aktion sofort Gebühren anfallen. Für weitere Informationen zu den Kosten lesen Sie bitte den Abschnitt „Kosten“ auf der Startseite.`,
  priceButton: "Preis",
  priceModalHeading: "Kosteninformationen",
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
    <h2>Alternative Option für Notizenerstellung</h2>
    <p>Wenn Sie bereits ein OpenAI-Konto haben, können Sie die Notizenerstellung über ChatGPT nutzen – was nahezu kostenlos ist. In diesem Fall fallen nur die Kosten für Sprach-zu-Text an, wenn Sie diese Webapp verwenden.</p>
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
  guideText: `Willkommen beim Whisper Transkriptionstool. Diese Anwendung ermöglicht es medizinischen Fachkräften, Therapeuten und anderen, Konsultationen aufzunehmen und zu transkribieren sowie professionelle Notizen mit Hilfe eines KI-gesteuerten Notizgenerators zu erstellen.<br><br>
<strong>So verwenden Sie die Funktionen:</strong>
<ul>
  <li><strong>Aufnahme:</strong> Klicken Sie auf "Aufnahme starten", um die Audioaufnahme zu beginnen. Alle 40 Sekunden wird ein Audioabschnitt automatisch zur Transkription an die OpenAI-Server gesendet. Die Transkriptionen erscheinen nacheinander im Textfeld.</li>
  <li><strong>Abschluss:</strong> Nach dem Klicken auf "Stoppen/Abschließen" wird die Aufnahme beendet. Der Abschlusstimer läuft, bis die vollständige Transkription empfangen wird. Dies dauert in der Regel 5 bis 10 Sekunden.</li>
  <li><strong>Notizenerstellung:</strong> Nach der Transkription klicken Sie auf "Notiz generieren", um eine Notiz basierend auf Ihrer Transkription und Ihrem benutzerdefinierten Prompt zu erstellen.</li>
  <li><strong>Benutzerdefinierter Prompt:</strong> Wählen Sie rechts einen Prompt-Slot (1–10) und geben Sie Ihren benutzerdefinierten Prompt ein. Dieser wird automatisch gespeichert und mit Ihrem API-Schlüssel verknüpft.</li>
  <li><strong>Anleitungswechsel:</strong> Verwenden Sie die Schaltflächen "Funktionen" und "Anleitung", um zwischen der Funktionsansicht und dieser Anleitung zu wechseln.</li>
</ul>
Bitte klicken Sie auf "Funktionen", um zur Hauptoberfläche zurückzukehren.`,
};
