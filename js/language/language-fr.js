// js/language-fr.js

export const indexTranslations = {
  pageTitle: "Transcribe Notes",
  headerTitle: "Transcribe Notes",
  headerSubtitle: "Transcription audio en texte et génération de notes avancées pour consultations médicales, propulsées par l'IA",
  startText: "Pour commencer, veuillez entrer votre clé API OpenAI :",
  apiPlaceholder: "Entrez la clé API ici",
  enterButton: "Accéder à l'outil de transcription",
  guideButton: "Guide API – Mode d'emploi",
  securityButton: "Sécurité",
  aboutButton: "À propos",
  adRevenueMessage: "Comme ce site est gratuit et financé uniquement par la publicité, veuillez accepter les publicités personnalisées afin de soutenir le service.",
  securityModalHeading: "Confidentialité",
securityModalText: 
`<strong>Confidentialité et Traitement des données</strong><br><br>
Cette application Web est conçue comme un outil de transcription vocale et de génération de notes. Il est de votre entière responsabilité, en tant que professionnel de santé / responsable du traitement, de vous assurer que toute utilisation est conforme au RGPD, à la loi norvégienne sur les professionnels de santé (Helsepersonelloven) et à la Norme de sécurité de l’information.<br><br>

Vous êtes seul responsable du respect des exigences suivantes :<br>
- RGPD<br>
- Loi sur les professionnels de santé<br>
- Norme de sécurité de l’information<br><br>

Cela implique notamment :<br>
- Conclure les accords nécessaires (DPA)<br>
- Réaliser des évaluations de risque approfondies (DPIA et TIA)<br><br>

– Plus d’informations à ce sujet plus bas dans ce texte.<br><br>

Le développeur de cette application Web décline toute responsabilité en cas de non-conformité de votre part.<br><br>
<hr><br>

<strong>1. Comment fonctionne l’application Web ?</strong><br>
- Enregistre l’audio via la fonction d’enregistrement du navigateur.<br>
- Traite l’audio dans la mémoire (RAM) du navigateur.<br>
- Transmet le fichier audio, via une connexion HTTPS sécurisée, à l’API OpenAI Whisper pour la transcription, en utilisant votre propre clé API.<br>
- Envoie la transcription (et tout texte/prompt supplémentaire) à l’API OpenAI, qui génère un brouillon de note, également avec votre clé API.<br>
- Le navigateur reçoit la note directement d’OpenAI via une connexion sécurisée/chiffrée.<br>
- Votre clé API n’est stockée que temporairement dans la mémoire du navigateur (SessionStorage). Lorsque vous fermez l’application Web ou quittez le navigateur, la clé API est supprimée de la mémoire. Pour réutiliser l’application, vous devrez à nouveau copier-coller votre clé. Cela constitue une couche de sécurité supplémentaire contre tout accès non autorisé à votre clé.<br><br>
<hr><br>

<strong>2. Votre propre clé API OpenAI est requise</strong><br>
Toutes les communications avec OpenAI se font directement depuis votre navigateur à l’aide de votre clé API personnelle. Le développeur de cette application Web n’a accès ni à votre clé ni à vos données.<br><br>
<hr><br>

<strong>3. Accord de sous-traitance des données (DPA) avec OpenAI</strong><br>
Si vous utilisez les services d’API pour traiter des données à caractère personnel, il est recommandé de conclure un accord de sous-traitance des données avec OpenAI. Vous trouverez l’accord standard d’OpenAI ici : <a href="https://ironcladapp.com/public-launch/63ffefa2bed6885f4536d0fe" style="color:blue;" target="_blank">Accord de sous-traitance des données OpenAI (DPA)</a>. Vous trouverez votre numéro d’organisation ici : <a href="https://platform.openai.com/settings/organization/general" style="color:blue;" target="_blank">votre profil d’organisation OpenAI</a>. Une fois l’accord signé, vous et OpenAI reconnaissez que vous, l’utilisateur, agissez en tant que responsable du traitement – et non OpenAI.<br><br>
<hr><br>

<strong>4. DPIA et TIA – Évaluations de risque nécessaires</strong><br><br>

<strong>DPIA (Analyse d’impact relative à la protection des données)</strong> : Obligatoire au titre de l’article 35 du RGPD lorsqu’une nouvelle technologie est utilisée pour traiter des catégories particulières de données. L’objectif est d’identifier et de réduire les risques liés à la vie privée découlant du traitement lui-même.<br>
Analysez ce qui est traité, pourquoi, et les mesures à mettre en œuvre pour protéger les droits des patients.<br>
Exemple de modèle : <a href="https://transcribe-notes.netlify.app/dpia" style="color:blue;" target="_blank">Proposition de DPIA (modèle)</a><br><br>

<strong>TIA (Transfer Impact Assessment)</strong> : Obligatoire depuis l’arrêt Schrems II et les articles 44-49 du RGPD lorsque des données à caractère personnel sont transférées vers un pays hors EEE (comme les États-Unis). L’objectif est de documenter que le transfert assure un niveau de protection « essentiellement équivalent ».<br>
Évaluez la législation américaine (FISA 702, CLOUD Act, etc.) au regard de la nature des données et de vos mesures techniques/contractuelles supplémentaires.<br>
Concluez si le transfert – associé aux Clauses Contractuelles Types et à la certification d’OpenAI au Data Privacy Framework UE-États-Unis – reste acceptable.<br>
Exemple de modèle : <a href="https://transcribe-notes.netlify.app/tia.html" style="color:blue;" target="_blank">Proposition de TIA (modèle)</a><br><br>

Les deux évaluations doivent être menées, documentées et approuvées par vos soins avant la mise en service de l’application.<br><br>
<hr><br>

<strong>5. Zero Data Retention (ZDR) et stockage des données chez OpenAI</strong><br><br>

<strong>Politique standard d’OpenAI</strong><br>
Conformément à la politique d’utilisation des données API d’OpenAI, les données envoyées à l’API ne sont pas utilisées pour entraîner les modèles. Cependant, elles peuvent être stockées temporairement (généralement jusqu’à 30 jours) à des fins de détection d’abus et de dépannage, puis supprimées.<br><br>

<strong>Zero Data Retention (ZDR)</strong><br>
OpenAI propose le ZDR à certains grands clients sur accord spécifique, mais ce n’est pas l’option standard pour un usage courant de l’API ; elle n’est donc pas active pour cette application.<br><br>

<strong>Perspectives</strong><br>
Les futures versions de l’application pourraient envisager la prise en charge d’autres fournisseurs d’IA offrant le ZDR par défaut (p. ex. certains services sur Microsoft Azure). Toute mise à jour à ce sujet sera communiquée via l’application.<br><br>
<hr><br>

<strong>6. Conditions préalables à une utilisation clinique potentielle</strong><br><br>
Votre évaluation est déterminante : la légalité de l’utilisation de cet outil avec des données patients dépend exclusivement de votre propre analyse approfondie. Vous devez conclure vous-même – sur la base du DPA avec OpenAI, de la DPIA et de la TIA – quant au caractère adéquat de l’usage et au niveau de risque résiduel acceptable pour votre pratique.<br><br>

<strong>Exigences minimales avant d’utiliser des données patients :</strong><br>
- Un DPA valide avec OpenAI est en place.<br>
- Une DPIA et une TIA propres à votre organisation ont été réalisées, approuvées et concluent à un risque résiduel acceptable.<br>
- Responsabilité du contenu : vous êtes responsable de tout contenu envoyé à OpenAI via votre clé API et de la validation du brouillon de note généré avant toute intégration éventuelle dans le dossier patient.<br><br>
<hr><br>

<strong>7. Aperçu du stockage des données</strong><br><br>
<table style="border-collapse:collapse;width:100%;">
  <thead>
    <tr>
      <th style="border:1px solid #ccc;padding:4px;">Type de données</th>
      <th style="border:1px solid #ccc;padding:4px;">Où est-elle stockée ?</th>
      <th style="border:1px solid #ccc;padding:4px;">Durée de conservation</th>
      <th style="border:1px solid #ccc;padding:4px;">Qui y a accès ?</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="border:1px solid #ccc;padding:4px;">Votre clé API OpenAI</td>
      <td style="border:1px solid #ccc;padding:4px;">Mémoire SessionStorage dans votre navigateur</td>
      <td style="border:1px solid #ccc;padding:4px;">Jusqu’à fermeture de l’application ou du navigateur</td>
      <td style="border:1px solid #ccc;padding:4px;">Vous seul et votre navigateur</td>
    </tr>
    <tr>
      <td style="border:1px solid #ccc;padding:4px;">Segments audio pendant l’enregistrement</td>
      <td style="border:1px solid #ccc;padding:4px;">Mémoire du navigateur (RAM)</td>
      <td style="border:1px solid #ccc;padding:4px;">Uniquement pendant l’enregistrement/le traitement. Non stockés chez OpenAI après traitement</td>
      <td style="border:1px solid #ccc;padding:4px;">Vous seul et votre navigateur</td>
    </tr>
    <tr>
      <td style="border:1px solid #ccc;padding:4px;">Texte/Brouillon de note</td>
      <td style="border:1px solid #ccc;padding:4px;">API OpenAI (temporaire)</td>
      <td style="border:1px solid #ccc;padding:4px;">Jusqu’à 30 jours chez OpenAI</td>
      <td style="border:1px solid #ccc;padding:4px;">Vous, OpenAI (temporairement)</td>
    </tr>
    <tr>
      <td style="border:1px solid #ccc;padding:4px;">Instructions / Prompts</td>
      <td style="border:1px solid #ccc;padding:4px;">Localement dans votre navigateur. Si vous vous reconnectez à l’application sur le même navigateur, ordinateur et avec la même clé API, vos prompts seront à nouveau disponibles</td>
      <td style="border:1px solid #ccc;padding:4px;">Jusqu’à ce que vous les supprimiez</td>
      <td style="border:1px solid #ccc;padding:4px;">Vous et votre navigateur</td>
    </tr>
  </tbody>
</table><br><br>
<hr><br>

<strong>8. Code source</strong><br><br>
- Le code source est ouvert et s’exécute localement dans votre navigateur.<br><br>
<hr><br>

<strong>9. Cookies et publicités</strong><br><br>
Nous utilisons des cookies exclusivement pour diffuser des publicités pertinentes via Google Ads, pour la sélection de la langue, la gestion du consentement et l’enregistrement de prompts personnalisés que vous avez créés. Les cookies ne stockent aucune donnée personnelle autre que ce qui est nécessaire au fonctionnement et à la personnalisation. Les cookies de Google n’ont aucun accès aux données liées à l’enregistrement audio et au texte généré (données patients).
`,

  aboutModalHeading: "À propos",
  aboutModalText: `Ce site a été créé pour offrir aux professionnels de santé et autres utilisateurs un accès direct à une transcription vocale de haute qualité et à la génération de notes cliniques—sans frais inutiles ni intermédiaires.<br><br>
En utilisant votre propre clé API OpenAI, vous vous connectez directement à la source de la technologie. Cela signifie que vous ne payez que le coût réel d’utilisation défini par OpenAI, sans majoration ni abonnement.<br><br>
De nombreux fournisseurs proposent des services similaires, mais à des tarifs bien plus élevés—souvent 8 à 10 fois plus que le coût réel de la technologie sous-jacente. Cette plateforme offre les mêmes fonctionnalités à une fraction du prix.<br><br>
<strong>Points clés :</strong><br>
• Aucun abonnement, aucun compte requis.<br>
• Vous payez uniquement OpenAI directement pour ce que vous utilisez.<br>
• Le site lui-même est entièrement gratuit.<br><br>
Pour continuer à offrir ce service gratuitement, nous vous serions très reconnaissants d’accepter l’affichage de publicités Google Ads. Les revenus publicitaires nous aident à couvrir les frais d’hébergement et de fonctionnement, afin que le service reste accessible à tous.`,
  guideModalHeading: "Comment utiliser",
guideModalText : `Pour utiliser cette application web, vous devez d’abord créer un profil OpenAI API, générer une clé API et vous assurer que votre porte-monnaie OpenAI dispose de fonds suffisants. Copiez ensuite la clé API et collez-la dans le champ prévu à cet effet. Lorsque vous appuyez sur « Entrée », l’application web enregistre temporairement la clé API pour la session – cette clé vous connecte aux serveurs OpenAI afin que la transcription vocale et la génération de notes puissent fonctionner. Veuillez noter que vous êtes facturé immédiatement pour chaque tâche effectuée (transcription vocale et/ou génération de notes). Pour plus d’informations sur les coûts, consultez la section « Informations sur les coûts » sur la page d’accueil. Nous vous recommandons de lire attentivement la politique de confidentialité et la notice d’information sur la page d’accueil avant d’utiliser l’application.
<br><br>
<strong>1. Créez votre profil OpenAI API</strong><br>
Pour commencer, vous devez créer un profil sur la plateforme OpenAI API. Ce profil sert de compte pour gérer vos clés API et la facturation. Pour démarrer, rendez-vous sur <a href="https://platform.openai.com/signup" style="color:blue;">Inscription à l’API OpenAI</a>. Suivez les instructions et créez un compte. Une fois inscrit, vous aurez accès à votre tableau de bord et pourrez générer une clé API personnelle ainsi qu’approvisionner votre porte-monnaie.
<br><br>
<strong>2. Générez une clé API</strong><br>
Après avoir créé votre profil, générez une clé API en vous rendant dans la <a href="https://platform.openai.com/account/api-keys" style="color:blue;">gestion des clés API</a>. Cliquez sur le bouton pour créer une nouvelle clé API. Important : vous ne verrez la clé qu’une seule fois. Copiez-la immédiatement et conservez-la en lieu sûr (par exemple dans un fichier texte). Si vous perdez la clé ou pensez qu’elle a été compromise, vous pouvez la désactiver ou la supprimer au même endroit et en créer une nouvelle.
<br><br>
<strong>3. Approvisionnez votre porte-monnaie OpenAI</strong><br>
Pour que l’application web fonctionne, votre porte-monnaie OpenAI doit disposer de fonds suffisants. Rendez-vous sur <a href="https://platform.openai.com/account/billing/overview" style="color:blue;">la page de facturation et paiements</a> pour ajouter des fonds. Vous pouvez transférer le montant de votre choix à tout moment. Tant que des fonds sont disponibles, vous pourrez utiliser toutes les fonctionnalités de cette application web – chaque tâche est facturée immédiatement. Pour un détail des tarifs, consultez la section « Informations sur les coûts ».
<br><br>
<strong>Note de sécurité pour la session</strong><br>
Lorsque vous vous connectez en saisissant la clé API dans le champ prévu à cet effet sur cette page et en appuyant sur Entrée, celle-ci n’est stockée que temporairement dans votre session de navigateur. Cela signifie que si vous quittez la page, fermez le navigateur ou éteignez l’ordinateur, la clé ne sera pas conservée. Vous devrez alors la coller à nouveau la prochaine fois que vous utiliserez l’application, ce qui garantit que votre clé reste sécurisée.`,

  priceButton: "Prix",
  priceModalHeading: "Prix",
priceModalText: `
<div>
  <p><strong>Informations sur les coûts</strong></p>
  <p>Vous ne payez que ce que vous utilisez — directement à la source, sans intermédiaires coûteux. Aucun abonnement. Aucun engagement.</p>

  <p><strong>Tarifs :</strong></p>
  <ul>
    <li>Transcription audio : $0.006 par minute</li>
    <li>Génération de notes : $5 pour 1 million de tokens (entrée) et $10 pour 1 million de tokens (sortie)</li>
  </ul>

  <p><strong>Exemple – Consultation de 15 minutes :</strong></p>
  <ul>
    <li>Transcription : 15 × $0.006 = $0.09</li>
    <li>Génération de note : généralement entre $0.005 et $0.01</li>
    <li>Total : environ $0.10 pour toute la consultation</li>
  </ul>

  <p><strong>Exemple de coût mensuel en utilisation régulière :</strong></p>
  <ul>
    <li>20 consultations par jour × 4 jours par semaine × 4 semaines = 320 consultations</li>
    <li>Coût mensuel total : environ $30–31</li>
  </ul>

  <p><strong>Vous ne payez qu’à l’usage :</strong><br>
  En cas de congés, maladie ou absence, vous ne payez rien.</p>
</div>
`,
};

export const transcribeTranslations = {
  pageTitle: "Outil de transcription avec publicités et superposition de guide",
  openaiUsageLinkText: "Aperçu des coûts d'utilisation",
  openaiWalletLinkText: "Solde du portefeuille",
  btnFunctions: "Fonctions",
  btnGuide: "Guide",
  btnNews: "Statut & mises à jour",
  backToHome: "Retour à la page d'accueil",
  recordingAreaTitle: "Zone d'enregistrement",
  recordTimer: "Chronomètre d'enregistrement : 0 sec",
  transcribeTimer: "Chronomètre d'achèvement : 0 sec",
  transcriptionPlaceholder: "Le résultat de la transcription apparaîtra ici…",
  startButton: "Commencer l'enregistrement",
  readFirstText: "À lire d'abord ! ➔",
  stopButton: "Arrêter/Terminer",
  pauseButton: "Mettre l'enregistrement en pause",
  statusMessage: "Bienvenue ! Cliquez sur « Commencer l'enregistrement » pour débuter.",
  noteGenerationTitle: "Génération de notes",
  generateNoteButton: "Générer une note",
  noteTimer: "Chronomètre d'achèvement : 0 sec",
  generatedNotePlaceholder: "La note générée apparaîtra ici…",
  customPromptTitle: "Invite personnalisée",
  promptSlotLabel: "Emplacement de l'invite :",
  customPromptPlaceholder: "Saisissez l'invite personnalisée ici",
  adUnitText: "Votre publicité ici",
  guideHeading: "Guide et instructions",
guideText: `Bienvenue dans <strong>Transcribe Notes</strong>. L'application peut enregistrer et transcrire des conversations, puis utiliser le texte obtenu pour générer une note. Obtenez toujours le consentement requis avant l'enregistrement et vérifiez tout contenu clinique avant de l'utiliser.<br><br>

<strong>Démarrage rapide</strong><br>
<ol>
  <li>Sélectionnez un Workspace, un fournisseur de transcription et les réglages nécessaires.</li>
  <li>Sélectionnez <strong>Démarrer l'enregistrement</strong>. Utilisez <strong>Pause</strong>, <strong>Reprendre</strong>, <strong>Arrêter/Terminer</strong> ou <strong>Abandonner</strong> selon les besoins.</li>
  <li>Sélectionnez le prompt, le fournisseur et le modèle de la note, puis <strong>Générer la note</strong>. Auto-generate peut également être activé.</li>
</ol>

<details open>
  <summary><strong>Enregistrement et transcription</strong></summary>
  <ul>
    <li>Sélectionnez le fournisseur de reconnaissance vocale avant l'enregistrement. Google Chrome ou Microsoft Edge est recommandé.</li>
    <li><strong>Pause</strong> termine le segment audio en cours et permet de reprendre plus tard. <strong>Arrêter/Terminer</strong> met fin à l'enregistrement et attend la transcription restante. <strong>Abandonner</strong> supprime l'enregistrement actif sans finalisation normale.</li>
    <li><strong>Speaker Labels</strong> est disponible uniquement avec Soniox et tente d'indiquer qui parle, par exemple Speaker 1 et Speaker 2.</li>
  </ul>
</details><br>

<details>
  <summary><strong>Workspaces et Workspace Sets</strong></summary>
  <ul>
    <li>Un <strong>Workspace</strong> est un espace de travail distinct dans l'onglet du navigateur. Chaque Workspace possède ses propres textes, prompts sélectionnés, fournisseurs, modèles, réglages, historique et processus actifs. Changer de Workspace n'arrête ni l'enregistrement ni la génération.</li>
    <li>Le nom reprend normalement le libellé de l'emplacement de prompt sélectionné. Utilisez <strong>+</strong> pour ajouter et <strong>×</strong> pour fermer un Workspace. Jusqu'à 12 Workspaces peuvent être ouverts.</li>
    <li>Tous les Workspaces ouverts forment un <strong>Workspace Set</strong>. L'importation et l'exportation sont possibles par fichier JSON local, Microsoft OneDrive ou Google Drive.</li>
    <li>Un Workspace Set enregistre le nombre et l'ordre, les noms, les emplacements de prompt sélectionnés avec leur texte et leur libellé, les fournisseurs, les modèles, les choix de raisonnement, les cases pertinentes et les modules ouverts. Il n'inclut pas les transcriptions, informations complémentaires, notes, historique, fichiers audio, clés API, mots de passe ni autres informations sur les patients.</li>
    <li>Les sauvegardes cloud sont chiffrées dans le navigateur avec le mot de passe choisi. Les fichiers JSON locaux sont lisibles et doivent être conservés en sécurité.</li>
  </ul>
</details><br>

<details>
  <summary><strong>Mini Panel</strong></summary>
  <ul>
    <li>Ouvrez-le avec le bouton <strong>Mini-panel</strong>. L'icône en haut à droite permet de passer d'une vue à l'autre.</li>
    <li><strong>Mini Panel — Browser Tabs</strong> contrôle des onglets Transcribe Notes séparés et convient à un Workspace par onglet.</li>
    <li><strong>Mini Panel — Workspaces</strong> affiche tous les Workspaces de l'onglet Transcribe Notes sélectionné et convient à plusieurs espaces dans un seul onglet.</li>
    <li>Les enregistrements et les générations continuent en arrière-plan lors du changement de vue ou de Workspace.</li>
  </ul>
</details><br>

<details>
  <summary><strong>Auto-generate, Auto-copy et génération principale</strong></summary>
  <ul>
    <li><strong>Auto-generate</strong> lance automatiquement la génération de la note à la fin de la transcription. Sinon, utilisez manuellement <strong>Générer la note</strong>.</li>
    <li><strong>Auto-copy</strong> peut copier automatiquement la transcription ou la note terminée et nécessite l'extension de navigateur associée. Les boutons de copie manuelle restent disponibles.</li>
    <li>La note principale utilise la transcription, le prompt éventuellement sélectionné et le texte du champ <strong>Informations complémentaires</strong>. Sélectionnez le fournisseur, le modèle et, si disponible, le niveau de raisonnement avant la génération.</li>
    <li>Les notes générées par l'IA peuvent contenir des erreurs ou omettre des éléments. Vérifiez et validez toujours une note avant de l'enregistrer ou de l'envoyer.</li>
  </ul>
</details><br>

<details>
  <summary><strong>Secondary Note Generation</strong></summary>
  <p>Ce module est utile lorsqu'un long document doit d'abord être raccourci. Collez le texte dans le champ source, choisissez un prompt et un modèle distincts, puis générez un résumé. Le résultat peut être copié automatiquement ou manuellement dans <strong>Informations complémentaires</strong>.</p>
  <p>Vous pouvez par exemple utiliser un modèle économique tel que GPT-5 Nano via Requesty pour résumer un document de 50 pages. Le modèle principal, par exemple GPT-5.6 Sol ou Claude Opus 5, reçoit alors le résumé court avec la transcription au lieu du document complet. Cela peut réduire nettement le nombre de tokens et le coût. Vérifiez le résumé avant de l'utiliser comme contexte clinique.</p>
</details><br>

<details>
  <summary><strong>Prix et utilisation des tokens</strong></summary>
  <ul>
    <li>Lorsque les données tarifaires sont disponibles, le modèle sélectionné affiche son prix en USD par million de tokens d'entrée et de sortie.</li>
    <li>Après la génération, l'utilisation des tokens et un prix estimé sont affichés si la réponse du fournisseur contient les données nécessaires. Certains fournisseurs peuvent communiquer un coût plus précis.</li>
    <li><strong>Aperçu des coûts</strong> ouvre les pages d'utilisation et de facturation des fournisseurs. Les prix de l'application sont indicatifs; la facturation du fournisseur fait foi.</li>
  </ul>
</details><br>

<details>
  <summary><strong>Emplacements de prompts, historique, Redactor et OCR</strong></summary>
  <ul>
    <li>Vingt emplacements de prompts sont disponibles. Prompt profile ID sépare les jeux de prompts sur un même appareil. Ils peuvent être importés ou exportés en JSON ou sous forme chiffrée via OneDrive et Google Drive.</li>
    <li>La colonne d'historique affiche les 30 dernières générations principales terminées du Workspace actif. Sélectionnez un élément pour voir la transcription, les informations complémentaires et la note générée. Chaque Workspace a son propre historique.</li>
    <li><strong>Redactor</strong> peut supprimer les termes généraux et spécifiques choisis de la transcription et des informations complémentaires. Vérifiez toujours le résultat avant envoi.</li>
    <li><strong>OCR</strong> peut extraire le texte d'une capture d'écran collée ou d'un fichier image et l'envoyer vers la liste des termes spécifiques ou le champ de texte brut.</li>
  </ul>
</details><br>

<details>
  <summary><strong>Stockage et confidentialité</strong></summary>
  <ul>
    <li>Le texte de travail et l'historique du Workspace restent dans la session de l'onglet actuel et sont supprimés à la fin de cette session. <strong>Clear</strong> permet d'effacer le contenu actif ou l'historique.</li>
    <li>Les clés API ne sont pas placées dans localStorage. Elles sont conservées uniquement pendant la session active du navigateur et peuvent être effacées manuellement depuis la page d'accueil.</li>
    <li>Les données sont envoyées au fournisseur et dans la région choisis. Le stockage et le traitement dépendent du fournisseur, du compte, de la configuration et des conditions en vigueur. Vérifiez que l'installation convient aux informations traitées.</li>
  </ul>
</details><br><br>

Sélectionnez de nouveau <strong>Guide</strong> ou utilisez le bouton de fermeture pour revenir à l'affichage principal.
`,

  // Générateur de notes secondaire
  secondaryNote: {
    showButton: "Afficher le générateur de notes secondaire",
    hideButton: "Masquer le générateur de notes secondaire",
    title: "Générateur de notes secondaire",
    sourceLabel: "Texte source",
    sourcePlaceholder: "Collez ou saisissez le texte source ici...",
    providerLabel: "Fournisseur :",
    modelLabel: "Modèle :",
    modeLabel: "Mode :",
    reasoningLabel: "Effort de raisonnement :",
    thinkingLabel: "Niveau de réflexion :",
    promptLabel: "Prompt :",
    generateButton: "Générer la note",
    abortButton: "Annuler",
    copyButton: "Copier",
    copiedButton: "Copié",
    pushButton: "Insérer",
    clearOnGenerateLabel: "Vider les Informations complémentaires lors de la génération",
    autoTransferLabel: "Copier automatiquement le résultat dans les Informations complémentaires",
    sourceDateLabel: "Date",
    sourceDateToggleAriaLabel: "Conserver la date du jour dans le texte source",
    sourceDateHelp: 'Lorsque cette option est activée : conserve la ligne "Dagens dato er DD.MM.YYYY" en haut du texte source et la restaure après l’actualisation de la page. Lorsqu’elle est désactivée : supprime cette ligne de date du texte source.',
    outputPlaceholder: "La note générée apparaîtra ici...",
    timerLabel: "Minuteur de génération de note",
    statusGenerating: "Génération en cours…",
    statusCompleted: "Génération du texte terminée !",
    statusFailed: "Échec de la génération",
    statusAborted: "Génération de la note annulée.",
    noSourceText: "Aucun texte source",
    noPromptSelected: "Aucun prompt sélectionné",
    noOutputToPush: "Aucune note à copier pour l’instant",
    transferred: "Résultat copié dans les Informations complémentaires."
  },
};
