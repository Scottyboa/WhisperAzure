// js/language-fr.js

export const indexTranslations = {
  pageTitle: "Transcription Clinique Whisper",
  headerTitle: "Transcription Clinique Whisper",
  headerSubtitle: "Transcription audio en texte et génération de notes avancées pour consultations médicales, propulsées par l'IA",
  startText: "Pour commencer, veuillez entrer votre clé API OpenAI :",
  apiPlaceholder: "Entrez la clé API ici",
  enterButton: "Accéder à l'outil de transcription",
  guideButton: "Guide API – Mode d'emploi",
  securityButton: "Sécurité",
  aboutButton: "À propos",
  adRevenueMessage: "Comme ce site est gratuit et financé uniquement par la publicité, veuillez accepter les publicités personnalisées afin de soutenir le service.",
  securityModalHeading: "Confidentialité",
  securityModalText: "Votre vie privée et la sécurité des informations patient sont nos priorités absolues. Pour garantir la confidentialité des données:<br><br>- <strong>Chiffrement des données :</strong> Toutes les données traitées par le système sont sécurisées grâce à des méthodes de chiffrement conformes aux normes de l'industrie. Les transcriptions et les notes sont exclusivement associées à votre clé API personnelle chiffrée et à l'appareil utilisé, garantissant ainsi que seul vous pouvez accéder au contenu généré.<br><br>- <strong>Suppression automatique :</strong> Une fois qu'une transcription ou une note est générée et affichée à l'écran, elle est automatiquement et irréversiblement supprimée des serveurs dans les 2 minutes qui suivent.<br><br>- <strong>Protection contre les accès non autorisés :</strong> Même en cas d'accès non autorisé à votre clé API, les données restent chiffrées et sécurisées par des marqueurs spécifiques à l'appareil, rendant ainsi l'information inaccessible.<br><br>- <strong>Hébergement conforme au RGPD :</strong> Tous les processus backend s'exécutent sur des serveurs dédiés Microsoft Azure situés au sein de l'UE, en totale conformité avec le RGPD.<br><br>Soyez assuré que des mesures de sécurité strictes garantissent que toutes les données relatives aux patients demeurent sûres, confidentielles et entièrement sous votre contrôle.",
  aboutModalHeading: "À propos",
  aboutModalText: `Questo sito è stato creato per offrire ai professionisti della salute e ad altri utenti un accesso diretto a trascrizioni vocali di alta qualità e alla generazione di note cliniche — senza costi superflui o intermediari.<br><br>
Utilizzando la tua chiave API OpenAI personale, ti connetti direttamente alla fonte della tecnologia. Ciò significa che paghi solo il costo effettivo d'uso stabilito da OpenAI, senza maggiorazioni o tariffe di abbonamento.<br><br>
Molti fornitori esistenti offrono servizi simili, ma addebitano costi significativamente più elevati — spesso 8-10 volte il costo reale della tecnologia sottostante. Questa piattaforma offre la stessa funzionalità a una frazione del prezzo.<br><br>
<strong>Punti chiave:</strong><br>
• Nessun abbonamento, nessun account richiesto.<br>
• Paghi direttamente OpenAI solo per ciò che utilizzi.<br>
• Il sito stesso è completamente gratuito.<br><br>
Per mantenere questo modello, gli utenti sono tenuti ad accettare la pubblicità. I ricavi pubblicitari aiutano a coprire i costi di hosting e gestione, permettendo al servizio di rimanere accessibile e gratuito per tutti.`,
  guideModalHeading: "Comment utiliser",
  guideModalText: `Pour utiliser cette application web, vous devez d'abord créer un profil API OpenAI, générer une clé API et approvisionner votre portefeuille OpenAI. Votre clé API est ensuite copiée et collée dans le champ dédié. Une fois que vous appuyez sur Entrée, l'application web enregistre temporairement la clé pour votre session — cette clé vous connecte aux serveurs d'OpenAI, permettant ainsi la transcription de la parole en texte et la génération de notes. Veuillez noter que chaque tâche effectuée vous est facturée immédiatement. Pour plus d'informations sur les coûts, veuillez consulter la section "Coûts" sur la page d'accueil.
<br><br>
<strong>1. Créez votre profil API OpenAI</strong><br>
Pour commencer, vous devez créer un profil sur la plateforme API d'OpenAI. Ce profil sert de compte pour gérer vos clés API et la facturation. Pour débuter, rendez-vous sur la page <a href="https://platform.openai.com/signup" style="color:blue;">Inscription à l'API OpenAI</a>. Suivez les instructions pour vous inscrire en fournissant votre adresse e-mail, en créant un mot de passe et en vérifiant votre compte. Une fois enregistré, vous aurez accès à votre tableau de bord.
<br><br>
<strong>2. Générez une clé API</strong><br>
Après avoir créé votre profil, générez une clé API en vous rendant sur la page <a href="https://platform.openai.com/account/api-keys" style="color:blue;">Gestion des clés API</a>. Cliquez sur le bouton pour créer une nouvelle clé API. Important : vous ne verrez votre clé API qu'une seule fois. Copiez-la immédiatement et conservez-la en lieu sûr (par exemple, dans un fichier texte) pour une utilisation future. Si vous perdez la clé ou pensez qu'elle a été compromise, supprimez-la de votre compte et créez-en une nouvelle.
<br><br>
<strong>3. Approvisionnez votre portefeuille OpenAI</strong><br>
Pour que l'application web fonctionne, votre portefeuille OpenAI doit disposer de fonds suffisants. Rendez-vous sur la page <a href="https://platform.openai.com/account/billing/overview" style="color:blue;">Facturation & Paiement</a> pour ajouter des fonds. Vous pouvez transférer n'importe quel montant à tout moment. Tant que des fonds sont disponibles, vous pourrez utiliser le site — chaque tâche est facturée immédiatement.
<br><br>
<strong>Rappel sur la sécurité de la session</strong><br>
Lorsque vous vous connectez en saisissant votre clé API, celle-ci est stockée uniquement temporairement dans votre session de navigateur. Cela signifie que si vous quittez le site, fermez votre navigateur ou éteignez votre ordinateur, la clé API ne sera pas sauvegardée. Vous devrez la ressaisir lors de votre prochaine utilisation de l'application web, garantissant ainsi la sécurité de votre clé.`,
  priceButton: "Prix",
  priceModalHeading: "Prix",
  priceModalText: `
    <h1>Informations sur les coûts</h1>
    <h2>Tarification de la transcription audio en texte</h2>
    <ul>
      <li><strong>Coût :</strong> 0,006 $ par minute.</li>
      <li><em>Exemple :</em> Une consultation de 15 minutes coûtera 15 × 0,006 $ = <strong>0,09 $</strong> par consultation.</li>
    </ul>

    <h2>Tarification de la génération de notes</h2>
    <ul>
      <li><strong>Tarification basée sur les tokens :</strong></li>
      <ul>
        <li><strong>Entrée (transcription + prompt) :</strong> 10 $ par 1 000 000 tokens (soit 0,00001 $ par token).</li>
        <li><strong>Sortie (note générée) :</strong> 30 $ par 1 000 000 tokens (soit 0,00003 $ par token).</li>
      </ul>
    </ul>

    <h3>Exemple de calcul pour une consultation (génération de note uniquement)</h3>
    <ol>
      <li>
        <strong>Calcul pour l'entrée :</strong>
        <ul>
          <li>Supposons que la transcription de la consultation comporte environ <strong>700 mots</strong> et que vous ajoutiez un prompt de <strong>30 mots</strong>.</li>
          <li>Total de mots = 700 + 30 = <strong>730 mots</strong>.</li>
          <li>Tokens estimés = 730 × 0,75 ≈ <strong>547,5 tokens</strong>.</li>
          <li>Coût de l'entrée = 547,5 tokens × 0,00001 $ ≈ <strong>0,0055 $</strong>.</li>
        </ul>
      </li>
      <li>
        <strong>Calcul pour la sortie :</strong>
        <ul>
          <li>Supposons que la note générée fasse environ <strong>250 mots</strong>.</li>
          <li>Tokens estimés = 250 × 0,75 ≈ <strong>187,5 tokens</strong>.</li>
          <li>Coût de la sortie = 187,5 tokens × 0,00003 $ ≈ <strong>0,0056 $</strong>.</li>
        </ul>
      </li>
      <li>
        <strong>Coût total de la génération de note :</strong> Coût combiné ≈ 0,0055 $ + 0,0056 $ = <strong>0,0111 $</strong> par consultation.
      </li>
    </ol>

    <h2>Coût combiné approximatif par consultation</h2>
    <p>(pour une consultation/enregistrement de 15 minutes, utilisant les deux fonctions)</p>
    <ul>
      <li><strong>Transcription audio en texte :</strong> <strong>0,09 $</strong></li>
      <li><strong>Génération de notes :</strong> <strong>0,0111 $</strong></li>
      <li><strong>Total :</strong> Environ <strong>0,101 $</strong> par consultation.</li>
    </ul>

    <h2>Estimations mensuelles</h2>
    <p>En supposant que vous effectuiez 20 consultations par jour, 4 jours par semaine, pendant 4 semaines par mois (20 × 4 × 4 = <strong>320 consultations</strong> par mois) :</p>
    <ul>
      <li>
        <strong>Utilisation de la transcription audio en texte uniquement</strong> (avec génération de notes via votre propre compte ChatGPT, qui est pratiquement gratuit) :<br>
        Coût mensuel = 320 × 0,09 $ = <strong>28,80 $</strong>.
      </li>
      <li>
        <strong>Utilisation de la transcription audio en texte et de la génération de notes :</strong><br>
        Coût mensuel = 320 × 0,101 $ ≈ <strong>32,32 $</strong>.
      </li>
    </ul>

    <h2>Option alternative pour la génération de notes</h2>
    <p>
      Si vous possédez déjà un compte OpenAI, vous pouvez utiliser la génération de notes via ChatGPT sur votre propre profil — ce qui est pratiquement gratuit. Dans ce cas, vous n'encourez que le coût de la transcription audio en texte lors de l'utilisation de cette application.
    </p>

    <h2>Flexibilité d'utilisation</h2>
    <p>
      Contrairement aux fournisseurs qui exigent un abonnement mensuel, vous ne payez que par utilisation. Si vous prenez une journée de repos, partez en vacances ou si vous ne faites aucune activité, vos coûts seront nuls. Même si vous utilisez le service chaque jour pour toutes vos consultations, le coût par utilisation reste nettement inférieur à celui des autres fournisseurs.
    </p>

    <hr>

    <h2>Avantage de la connexion directe</h2>
    <p>
      Notre application web vous connecte directement à l'API OpenAI — sans intermédiaire, sans frais supplémentaires. Ce lien direct signifie que vous ne payez que pour le coût réel de traitement par l'IA, faisant de notre service l'une des solutions de transcription audio en texte et de génération de notes les plus abordables disponibles à ce jour.
    </p>
  `,
};

export const transcribeTranslations = {
  pageTitle: "Outil de transcription avec publicités et superposition de guide",
  openaiUsageLinkText: "Aperçu des coûts d'utilisation",
  btnFunctions: "Fonctions",
  btnGuide: "Guide",
  recordingAreaTitle: "Zone d'enregistrement",
  recordTimer: "Chronomètre d'enregistrement : 0 sec",
  transcribeTimer: "Chronomètre d'achèvement : 0 sec",
  transcriptionPlaceholder: "Le résultat de la transcription apparaîtra ici…",
  startButton: "Commencer l'enregistrement",
  stopButton: "Arrêter/Terminer",
  pauseButton: "Mettre l'enregistrement en pause",
  statusMessage: "Bienvenue ! Cliquez sur « Commencer l'enregistrement » pour débuter.",
  noteGenerationTitle: "Génération de notes",
  generateNoteButton: "Générer une note",
  noteTimer: "Chronomètre de génération de notes : 0 sec",
  generatedNotePlaceholder: "La note générée apparaîtra ici…",
  customPromptTitle: "Invite personnalisée",
  promptSlotLabel: "Emplacement de l'invite :",
  customPromptPlaceholder: "Saisissez l'invite personnalisée ici",
  adUnitText: "Votre publicité ici",
  guideHeading: "Guide et instructions",
  guideText: "Bienvenue dans l'outil de transcription Whisper. Cette application permet aux professionnels de santé, aux thérapeutes et à d'autres praticiens d'enregistrer et de transcrire des consultations, ainsi que de générer des notes professionnelles grâce à un générateur de notes alimenté par l'IA.<br><br><strong>Comment utiliser les fonctions :</strong><ul><li><strong>Enregistrement :</strong> Cliquez sur « Commencer l'enregistrement » pour démarrer la capture audio. Toutes les 40 secondes, un segment de l'audio sera automatiquement envoyé pour transcription sur les serveurs d'OpenAI. Les transcriptions seront affichées une par une dans le champ de texte de transcription.</li><li><strong>Achèvement :</strong> Après avoir cliqué sur « Arrêter/Terminer », l'enregistrement s'arrête. Le chronomètre d'achèvement se déclenche ensuite jusqu'à ce que la transcription complète soit reçue. Cela prend généralement entre 5 et 10 secondes.</li><li><strong>Génération de notes :</strong> Après la transcription, cliquez sur « Générer une note » pour produire une note basée sur votre transcription et votre invite personnalisée.</li><li><strong>Invite personnalisée :</strong> À droite, sélectionnez un emplacement d'invite (1 à 10) et saisissez votre invite personnalisée. Celle-ci est sauvegardée automatiquement et liée à votre clé API.</li><li><strong>Basculer le guide :</strong> Utilisez les boutons « Fonctions » et « Guide » pour alterner entre la vue fonctionnelle et ce guide.</li></ul>Veuillez cliquer sur « Fonctions » pour revenir à l'interface principale.",
};
