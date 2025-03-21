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
  securityModalHeading: "Informations de sécurité",
  securityModalText: "Votre vie privée et la sécurité des informations patient sont nos priorités absolues. Pour garantir la confidentialité des données:<br><br>- <strong>Chiffrement des données :</strong> Toutes les données traitées par le système sont sécurisées grâce à des méthodes de chiffrement conformes aux normes de l'industrie. Les transcriptions et les notes sont exclusivement associées à votre clé API personnelle chiffrée et à l'appareil utilisé, garantissant ainsi que seul vous pouvez accéder au contenu généré.<br><br>- <strong>Suppression automatique :</strong> Une fois qu'une transcription ou une note est générée et affichée à l'écran, elle est automatiquement et irréversiblement supprimée des serveurs dans les 2 minutes qui suivent.<br><br>- <strong>Protection contre les accès non autorisés :</strong> Même en cas d'accès non autorisé à votre clé API, les données restent chiffrées et sécurisées par des marqueurs spécifiques à l'appareil, rendant ainsi l'information inaccessible.<br><br>- <strong>Hébergement conforme au RGPD :</strong> Tous les processus backend s'exécutent sur des serveurs dédiés Microsoft Azure situés au sein de l'UE, en totale conformité avec le RGPD.<br><br>Soyez assuré que des mesures de sécurité strictes garantissent que toutes les données relatives aux patients demeurent sûres, confidentielles et entièrement sous votre contrôle.",
  aboutModalHeading: "À propos de ce projet",
  aboutModalText: "Je suis un médecin généraliste norvégien passionné par les avancées technologiques, en particulier dans le domaine de l'intelligence artificielle, et je suis de près les développements de l'IA dans le secteur de la santé.<br><br>Lorsque j'ai découvert pour la première fois des entreprises proposant des services de transcription audio en texte pour les consultations médicales en Norvège, j'ai été enthousiasmé. Des collègues et des avis en ligne louaient ces services, soulignant une amélioration significative de leur efficacité et de leur organisation. Cependant, en approfondissant mes recherches, j'ai été surpris par les tarifs pratiqués par ces entreprises — surtout quand on considère que le coût réel de la technologie n'est qu'une fraction de leurs prix.<br><br>Motivé par cette constatation, j'ai développé ma propre solution de transcription audio en texte, initialement pour un usage personnel. Constatant son efficacité et sa rentabilité, j'ai décidé de rendre ma solution accessible en ligne, offrant la même rapidité, précision et qualité que les services premium, mais sans les frais élevés.<br><br>Contrairement aux fournisseurs commerciaux, cette plateforme n'applique pas de majoration ou de frais superflus.<br>• Vous payez directement OpenAI — ce qui signifie que vous accédez directement à la source de la technologie, sans intermédiaires prélevant une commission supplémentaire.<br>• Cela en fait l'option la moins chère disponible tout en maintenant une qualité de premier ordre.<br><br>Je suis convaincu que, bien que certains de ces services soient utiles, ils sont souvent trop chers par rapport à ce qu'ils offrent réellement. Nombre de mes collègues — qui travaillent quotidiennement en soins aux patients — se retrouvent à payer bien plus que nécessaire pour accéder à un outil qui devrait être abordable pour tous.<br><br>Ce site est entièrement gratuit — le seul coût que vous avez à supporter est le tarif d'utilisation direct d'OpenAI pour les transcriptions.<br>• Pas de frais mensuels, d'abonnements ou d'engagements — vous payez uniquement pour les tâches effectuées.<br>• Vous contrôlez vos dépenses en décidant du montant à transférer vers votre portefeuille OpenAI.<br><br>La seule chose que je vous demande est d'accepter les publicités, qui aident à couvrir les coûts des serveurs backend.<br>Au fur et à mesure que le nombre d'utilisateurs augmente, les frais d'hébergement et d'exploitation augmenteront, et les revenus publicitaires permettront de maintenir le service gratuit et opérationnel sans facturer les utilisateurs.",
  guideModalHeading: "Comment configurer votre API OpenAI pour la transcription clinique Whisper",
  guideModalText: "Pour utiliser cette application web, vous devez d'abord créer un profil API OpenAI, générer une clé API et approvisionner votre portefeuille OpenAI. Votre clé API est ensuite copiée et collée dans le champ prévu à cet effet. Une fois que vous appuyez sur Entrée, l'application enregistre temporairement la clé API pour votre session — cette clé vous relie aux serveurs d'OpenAI afin de permettre la transcription audio en texte et la génération de notes. Veuillez noter que chaque tâche effectuée vous est facturée immédiatement. Pour plus d'informations sur les coûts, veuillez consulter la section « Tarifs » sur la page d'accueil.",
  priceButton: "Prix",
  priceModalHeading: "Informations sur les coûts",
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
