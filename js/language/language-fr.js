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
  // Accordion tab #1 (left): AI models
  modelsModalHeading: "Modèles d’IA",
  modelsModalText: `
<div>
  <p><strong>Choix des modèles dans Transcribe Notes</strong></p>
  <p>L’application permet de choisir séparément le modèle de <strong>reconnaissance vocale (STT)</strong> et celui de <strong>génération de note</strong>. Une transcription précise fournit une meilleure base ; un modèle de note performant structure mieux le contenu et suit mieux le prompt choisi.</p>

  <hr><br>
  <p><strong>1) Modèles de reconnaissance vocale</strong></p>
  <ul>
    <li><strong>Soniox</strong> – transcription par lots ou en temps réel, avec identification facultative des locuteurs</li>
    <li><strong>OpenAI</strong> – gpt-4o-transcribe</li>
    <li><strong>Mistral</strong> – Voxtral Mini Transcribe</li>
  </ul>
  <p><strong>Classement STT pratique</strong></p>
  <ol>
    <li><strong>Soniox</strong> – recommandé : excellente qualité, identification des locuteurs et point de terminaison régional UE.</li>
    <li><strong>OpenAI gpt-4o-transcribe</strong> – excellente alternative, mais la configuration standard n’offre pas le même parcours simple pour la résidence des données dans l’UE.</li>
    <li><strong>Mistral Voxtral Mini</strong> – alternative européenne économique lorsque le coût est prioritaire.</li>
  </ol>
  <p>Pour conserver le contenu audio et la transcription dans l’UE avec Soniox, utilisez une clé appartenant à un projet Soniox de région UE et sélectionnez le point de terminaison UE dans l’application. L’identification des locuteurs aide le modèle de note à distinguer les participants.</p>

  <hr><br>
  <p><strong>2) Fournisseurs et modèles de génération de note</strong></p>
  <p><strong>Requesty — recommandé aux nouveaux utilisateurs</strong></p>
  <p>Requesty donne accès aux modèles de plusieurs développeurs avec une seule clé API. L’application limite volontairement les choix à des déploiements prévus pour un traitement dans l’UE, sans réutilisation pour l’entraînement et avec des contrôles de conservation adaptés.</p>
  <ul>
    <li>Claude Opus 5</li><li>Claude Sonnet 5</li><li>GPT-5.6 Sol</li><li>GPT-5.6 Terra</li><li>GPT-5.6 Luna</li><li>GPT-5.5</li><li>GPT-5 Nano</li><li>Gemini 3.7 Flash</li><li>Kimi K3</li>
  </ul>
  <p><strong>Autres fournisseurs pris en charge</strong></p>
  <ul>
    <li><strong>OpenAI</strong> – GPT-5.1, GPT-5.2, GPT-5.4 et GPT-5.5</li>
    <li><strong>AWS Bedrock</strong> – Claude Haiku 4.5, Claude Sonnet 4.5/4.6 et Claude Opus 4.5/4.6/4.7</li>
    <li><strong>Mistral</strong> – Mistral Large</li>
  </ul>
  <p>AWS Bedrock reste disponible pour les utilisateurs disposant déjà d’un accès AWS ou souhaitant gérer leur propre infrastructure. Sa mise en place est plus complexe et les derniers modèles peuvent y arriver plus tard. Ce n’est donc <strong>pas le point de départ recommandé aux nouveaux utilisateurs</strong>.</p>

  <p><strong>Guide pratique des modèles Requesty</strong></p>
  <ul>
    <li><strong>Qualité maximale :</strong> Claude Opus 5 et GPT-5.6 Sol</li>
    <li><strong>Excellents choix polyvalents :</strong> Claude Sonnet 5, GPT-5.6 Terra et GPT-5.5</li>
    <li><strong>Rapidité et rapport qualité-prix :</strong> GPT-5.6 Luna et Gemini 3.7 Flash</li>
    <li><strong>Résumé/prétraitement au coût minimal :</strong> GPT-5 Nano</li>
    <li><strong>Autre possibilité :</strong> Kimi K3</li>
  </ul>
  <p>Pour un long document, un modèle économique comme GPT-5 Nano peut d’abord produire un résumé destiné aux Informations supplémentaires. Le modèle principal plus puissant crée ensuite la note sans recevoir tout le document, ce qui peut fortement réduire le coût.</p>

  <hr><br>
  <p><strong>Prix et qualité</strong></p>
  <p>Les modèles les plus puissants coûtent généralement plus cher par token. L’application affiche le prix USD approximatif par million de tokens d’entrée/sortie près du modèle sélectionné et, si les données d’usage sont disponibles, une estimation après génération.</p>

  <hr><br>
  <p><strong>Configuration recommandée aux nouveaux utilisateurs cliniques</strong></p>
  <p>Commencez par <strong>Soniox avec projet UE, clé API UE et point de terminaison UE</strong> pour le STT, associé à <strong>Requesty</strong> pour les notes.</p>
  <p>Aucun fournisseur ne rend automatiquement un flux conforme au RGPD. L’organisation doit vérifier le DPA, le point de terminaison et la conservation, effectuer les DPIA/TIA nécessaires et relire chaque note avant utilisation clinique.</p>
</div>
`,

  securityModalHeading: "Confidentialité",
  securityModalText: `
<strong>Confidentialité et traitement des données</strong><br><br>
Cette application web est un outil de reconnaissance vocale et de génération de notes. En tant que professionnel de santé et responsable du traitement, vous devez garantir que son utilisation respecte le droit applicable, notamment le RGPD et les exigences de sécurité de votre organisation.<br><br>

Cela comprend notamment :<br>
- les accords de traitement des données (DPA) nécessaires ;<br>
- une DPIA/AIPD documentée et, le cas échéant, une TIA ;<br>
- le choix des bons points de terminaison régionaux et réglages de conservation ;<br>
- une base légale, des contrôles d’accès et l’information/le consentement requis du patient ;<br>
- la vérification de chaque transcription et note avant usage clinique.<br><br>

Le développeur ne peut pas déterminer la légalité de l’usage d’une organisation. Ceci ne constitue pas un avis juridique ; consultez votre DPO ou conseiller juridique si nécessaire.<br><br>

<hr><br>
<strong>1. Configuration recommandée aux nouveaux utilisateurs</strong><br><br>
<strong>Reconnaissance vocale :</strong> <strong>Soniox avec projet UE, clé UE et point de terminaison UE</strong>. Soniox indique que le contenu audio et textuel reste dans la région choisie lorsque la clé régionale et le domaine API correspondant sont utilisés, et qu’il ne sert pas à entraîner les modèles. Les métadonnées de compte, facturation et utilisation peuvent toutefois être traitées hors région.<br><br>

<strong>Génération de note :</strong> <strong>Requesty</strong>. L’application utilise la passerelle UE et une sélection organisée de déploiements nommés, prévus pour un traitement dans l’UE, sans réutilisation pour l’entraînement et avec des contrôles de conservation adaptés.<br><br>

Le choix d’un modèle dans l’application n’active pas automatiquement Zero Data Retention sur votre compte Requesty. Requesty documente que, pour les offres en libre-service, la journalisation des prompts/réponses est activée par défaut pendant 30 jours. Elle peut être désactivée par clé et un ZDR au niveau de l’organisation peut être demandé. Avant toute donnée patient identifiable, vérifiez ce réglage, le déploiement, les sous-traitants et le DPA.<br><br>

Aucune configuration technique n’est automatiquement « conforme au RGPD ». Les contrats, réglages, finalités, évaluations des risques et procédures restent déterminants.<br><br>

<hr><br>
<strong>2. Flux de données de l’application</strong><br><br>
- L’audio est enregistré et traité temporairement dans la mémoire du navigateur.<br>
- Il est envoyé par HTTPS chiffré au fournisseur STT choisi : Soniox, OpenAI ou Mistral/Voxtral.<br>
- La transcription reste visible dans le Workspace sélectionné.<br>
- Pour générer une note, transcription, prompt et Informations supplémentaires sont envoyés au fournisseur choisi.<br>
- Les requêtes Requesty passent par sa passerelle UE puis par le déploiement précis sélectionné.<br>
- Le brouillon revient au navigateur par connexion chiffrée.<br><br>

L’application ne possède pas de serveur applicatif stockant l’audio, les transcriptions ou les notes. AWS Bedrock est utilisé via le backend AWS configuré séparément par l’utilisateur.<br><br>

<hr><br>
<strong>3. Clés API et identifiants</strong><br><br>
Vous utilisez vos propres clés ou, pour Bedrock, votre propre URL backend et secret. Le développeur ne reçoit ni ces identifiants ni le contenu clinique.<br><br>

Les clés saisies sur la page d’accueil sont conservées temporairement dans SessionStorage et supprimées à la fermeture de l’onglet/session ou via Effacer les clés. Pour une sauvegarde chiffrée, le mot de passe chiffre localement le fichier dans le navigateur avant enregistrement ou téléversement.<br><br>

Traitez clés, sauvegardes et mots de passe comme confidentiels. Utilisez des clés distinctes, limites de dépenses et restrictions d’accès, et révoquez immédiatement toute clé exposée.<br><br>

<hr><br>
<strong>4. Accords de traitement des données</strong><br><br>
Évaluez et signez les DPA adaptés avec les services réellement utilisés : Soniox, Requesty et ses sous-traitants/déploiements documentés, OpenAI, Mistral et éventuellement AWS. Vérifiez que les accords couvrent l’organisation, la santé, la sécurité, la conservation, la suppression, les sous-traitants et transferts internationaux. Réévaluez régulièrement les conditions et réglages.<br><br>

<hr><br>
<strong>5. DPIA et TIA</strong><br><br>
<strong>DPIA/AIPD :</strong> généralement requise par l’article 35 du RGPD lorsque de nouvelles technologies traitent des données sensibles telles que la santé. Cartographiez audio, texte et métadonnées, documentez la finalité, les risques et les mesures techniques/organisationnelles.<br><br>

<strong>TIA :</strong> peut être requise pour un transfert hors EEE. Évaluez destination, droit applicable, garanties contractuelles et mesures complémentaires : chiffrement, pseudonymisation, points de terminaison UE et conservation. Si tout le trajet documenté reste dans l’UE/EEE, documentez également cette conclusion.<br><br>

Ces évaluations doivent être terminées et approuvées avant des données patient réelles.<br><br>

<hr><br>
<strong>6. Points propres aux fournisseurs</strong><br><br>
<strong>Soniox UE :</strong> exige un projet de région UE, sa clé et le domaine API UE correspondant. Vérifiez la conservation/suppression et l’accord nécessaire.<br><br>

<strong>Requesty :</strong> l’application utilise la passerelle UE et des routes de modèles fixes et sélectionnées. Requesty indique ne pas entraîner ses modèles sur les prompts/réponses. La résidence UE complète dépend aussi d’un déploiement amont hébergé dans l’UE. Vérifiez les détails actuels et désactivez la journalisation par clé ou obtenez un ZDR organisationnel.<br><br>

<strong>AWS Bedrock :</strong> conservé pour les utilisateurs AWS existants. Il nécessite un backend séparé et une configuration régionale rigoureuse. Plus complexe, il n’est plus le point de départ recommandé.<br><br>

<strong>Mistral :</strong> fournit Voxtral pour le STT et Mistral Large pour les notes. Vérifiez région, DPA, conservation, entraînement et ZDR si nécessaire.<br><br>

<strong>OpenAI :</strong> reste disponible en accès direct. Par défaut, les données API ne servent pas à entraîner les modèles, mais région et conservation dépendent du produit, du compte et du contrat. Une clé standard ne signifie pas automatiquement UE uniquement ou ZDR.<br><br>

<hr><br>
<strong>7. Conditions minimales avant usage clinique</strong><br><br>
- Utiliser uniquement fournisseurs et points de terminaison approuvés.<br>
- Disposer de DPA valides et d’une liste à jour des sous-traitants.<br>
- Réaliser et approuver DPIA/TIA.<br>
- Configurer correctement routage UE et conservation/ZDR.<br>
- Minimiser et, si possible, pseudonymiser les données patient.<br>
- Protéger clés API et fichiers exportés.<br>
- Vérifier chaque transcription et note avant le dossier patient.<br><br>

<hr><br>
<strong>8. Stockage local et externe</strong><br><br>
<strong>Clés API/identifiants backend :</strong> SessionStorage jusqu’à fermeture ou effacement.<br><br>
<strong>Audio :</strong> temporairement en mémoire puis envoyé au STT choisi ; aucune archive audio locale permanente.<br><br>
<strong>Transcriptions, Informations supplémentaires et notes :</strong> dans la session d’onglet active et ses fonctions Workspace/historique, normalement jusqu’à fermeture ou effacement. Le texte pertinent est envoyé au fournisseur de notes lors d’une génération.<br><br>
<strong>Prompts et paramètres de Workspace Set :</strong> peuvent être stockés localement. Un export contient ordre, prompts, fournisseurs/modèles et options, mais pas les transcriptions, Informations supplémentaires, notes, historique, audio, clés API ou mots de passe. Les exports cloud sont chiffrés dans le navigateur ; le JSON local est lisible et doit être protégé.<br><br>

Le traitement et la conservation chez chaque fournisseur doivent être vérifiés séparément.<br><br>

<hr><br>
<strong>9. Code source et responsabilité</strong><br><br>
Le code source est ouvert et l’application principale s’exécute dans le navigateur. Le développeur ne reçoit pas le texte clinique via un backend applicatif. Des statistiques d’usage élémentaires et non cliniques peuvent être collectées comme indiqué sur le site.<br><br>

La sortie est un brouillon. Le professionnel de santé reste responsable de la vérification médicale, des corrections et de la décision de l’ajouter au dossier patient.
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
  guideModalHeading: "Clés API – démarrage",
  guideModalText: `
<strong>Clés API — premiers pas</strong><br><br>
Configuration recommandée la plus simple :<br>
1. <strong>Soniox avec clé de région UE</strong> pour la reconnaissance vocale.<br>
2. <strong>Requesty</strong> pour les notes.<br><br>

<strong>Options STT :</strong> Soniox par lots, par lots avec identification des locuteurs, temps réel, OpenAI gpt-4o-transcribe et Mistral Voxtral Mini.<br><br>
<strong>Fournisseurs de notes :</strong> Requesty (Claude Opus 5, Claude Sonnet 5, GPT-5.6 Sol/Terra/Luna, GPT-5.5, GPT-5 Nano, Gemini 3.7 Flash, Kimi K3), OpenAI (GPT-5.1/5.2/5.4/5.5), AWS Bedrock (Claude Haiku/Sonnet/Opus) et Mistral Large.<br><br>

<hr><br>
<strong>Soniox — configuration STT recommandée</strong><br>
1. Créez un compte sur <a href="https://soniox.com" target="_blank" rel="noopener noreferrer">soniox.com</a> et ajoutez facturation/crédits.<br>
2. Demandez l’accès régional à <a href="mailto:support@soniox.com">support@soniox.com</a>.<br>
3. Créez/sélectionnez un projet <strong>European Union</strong> et copiez sa clé régionale.<br>
4. Collez-la dans <strong>Soniox API key</strong> et choisissez le point de terminaison <strong>EU</strong>. La clé UE et le point UE sont tous deux nécessaires.<br><br>
Le lien <strong>Guide</strong> près du champ Soniox ouvre les instructions détaillées.<br><br>

<hr><br>
<strong>Requesty — configuration de notes recommandée</strong><br>
1. Créez un compte sur <a href="https://requesty.ai" target="_blank" rel="noopener noreferrer">requesty.ai</a> et configurez crédits/facturation.<br>
2. Dans <strong>API Keys</strong>, créez une clé et limitez-la si possible aux modèles/Access Lists approuvés.<br>
3. Copiez-la en lieu sûr et collez-la dans <strong>Requesty API key</strong>.<br>
4. Désactivez la journalisation prompt/réponse ou demandez le ZDR organisationnel ; vérifiez DPA et routes avant des données identifiables.<br><br>
Le lien <strong>Guide</strong> près de Requesty explique compte, crédits, clé, accès aux modèles, routage UE et confidentialité.<br><br>

<hr><br>
<strong>OpenAI :</strong> créez un compte sur <a href="https://platform.openai.com" target="_blank" rel="noopener noreferrer">platform.openai.com</a>, configurez la facturation et une clé. Vérifiez DPA, conservation et région ; une clé standard n’est pas automatiquement UE uniquement ou ZDR.<br><br>

<strong>Mistral :</strong> créez un compte sur <a href="https://console.mistral.ai" target="_blank" rel="noopener noreferrer">console.mistral.ai</a>, la facturation et une clé utilisable avec Voxtral Mini et Mistral Large. Vérifiez hébergement UE, DPA, conservation et ZDR.<br><br>

<strong>AWS Bedrock — facultatif pour utilisateurs AWS existants :</strong> nécessite compte AWS, accès régional et backend séparé. Plus complexe, il n’est pas recommandé comme point de départ. Utilisez le lien <a href="#" data-open-guide="bedrock"><strong>Guide</strong></a> près des champs AWS.<br><br>

<hr><br>
<strong>Avant de saisir des données patient</strong><br>
Une clé API ne rend pas un service automatiquement conforme au RGPD. Vérifiez DPA, sous-traitants, point de terminaison, résidence, conservation/ZDR et entraînement ; réalisez DPIA/TIA, protégez les identifiants, minimisez les données et contrôlez chaque note.
`,

  priceButton: "Prix",
  priceModalHeading: "Informations sur les coûts",
  priceModalText: `
<div>
  <p><strong>Informations sur les coûts</strong></p>
  <p>L’application ne facture ni abonnement ni marge. Vous payez directement le fournisseur pour l’usage réel de l’API. Les prix peuvent changer ; le tableau de bord et la facture du fournisseur font foi.</p>
  <p><strong>Affichage dans l’application</strong></p>
  <ul>
    <li>Le prix USD approximatif par million de tokens d’entrée/sortie apparaît près du modèle choisi.</li>
    <li>Après génération, l’usage et un coût estimé apparaissent si le fournisseur renvoie assez de données.</li>
    <li>Tokens de raisonnement, cache, remises, frais de passerelle, change et règles de facturation peuvent modifier le total.</li>
  </ul>

  <hr><br>
  <p><strong>1. Reconnaissance vocale</strong> (prix approximatif par minute)</p>
  <p><strong>Soniox — recommandé :</strong> env. 0,0017 USD/minute ; 15 minutes env. 0,026 USD.</p>
  <p><strong>OpenAI gpt-4o-transcribe :</strong> env. 0,006 USD/minute ; 15 minutes env. 0,09 USD.</p>
  <p><strong>Mistral Voxtral Mini :</strong> consultez le tarif officiel Mistral actuel.</p>

  <hr><br>
  <p><strong>2. Génération de note</strong> (USD par million de tokens entrée/sortie)</p>
  <ul>
    <li>Claude Opus 5 : env. 5,50 / 27,50 USD</li><li>Claude Sonnet 5 : env. 2,20 / 11,00 USD</li>
    <li>GPT-5.6 Sol : env. 5,50 / 33,00 USD</li><li>GPT-5.6 Terra : env. 2,20 / 13,20 USD</li>
    <li>GPT-5.6 Luna : env. 0,22 / 1,32 USD</li><li>GPT-5.5 : env. 5,00 / 30,00 USD</li>
    <li>GPT-5 Nano : env. 0,05 / 0,40 USD</li><li>Gemini 3.7 Flash : env. 0,66 / 3,30 USD</li><li>Kimi K3 : env. 3,00 / 15,00 USD</li>
  </ul>
  <p>Ces valeurs reflètent les estimations de l’application et peuvent changer avec Requesty ou le déploiement amont. Consultez le prix près du modèle et le rapport d’utilisation Requesty.</p>
  <p>Autres fournisseurs : OpenAI direct (GPT-5.1/5.2/5.4/5.5), AWS Bedrock (Claude Haiku/Sonnet/Opus, surtout pour utilisateurs AWS existants) et Mistral Large. Les prix actuels apparaissent dans l’application.</p>

  <hr><br>
  <p><strong>3. Que sont les tokens ?</strong></p>
  <p>À titre indicatif, 1 token vaut environ 4 caractères ou trois quarts d’un mot anglais ; 1 000 tokens environ 750 mots anglais. Terminologie médicale, français, mise en forme et longs prompts modifient ce rapport. L’entrée inclut prompt, transcription, Informations supplémentaires et contexte ; la sortie inclut la note et le raisonnement/la sortie facturables.</p>

  <hr><br>
  <p><strong>4. Exemple : consultation de 15 minutes</strong></p>
  <p>Pour environ 2 200 tokens d’entrée et 450 de sortie :</p>
  <ul>
    <li>Transcription Soniox : env. 0,026 USD</li><li>GPT-5 Nano : env. 0,0003 USD</li>
    <li>Gemini 3.7 Flash : env. 0,003 USD</li><li>Claude Sonnet 5 : env. 0,010 USD</li>
    <li>Claude Opus 5 : env. 0,025 USD</li><li>GPT-5.6 Sol : env. 0,027 USD</li>
  </ul>
  <p>Le coût réel dépend de la longueur, du prompt, des Informations supplémentaires et du niveau de raisonnement.</p>

  <hr><br>
  <p><strong>5. Réduire le coût des longs documents</strong></p>
  <p>Secondary Note Generation peut résumer un long document avec un modèle économique tel que GPT-5 Nano. Le résumé est ajouté aux Informations supplémentaires avant que le modèle principal crée la note finale. Cela peut coûter bien moins cher que d’envoyer, par exemple, 50 pages directement à un modèle coûteux.</p>

  <hr><br>
  <p><strong>6. Exemple mensuel</strong></p>
  <p>20 consultations par jour, 4 jours par semaine et 4 semaines donnent environ 320 consultations, soit 80 heures audio. À 0,0017 USD/minute, la transcription Soniox représente environ 8,16 USD avant taxes et changements de prix. La génération de notes s’ajoute selon le modèle et les tokens réels.</p>
  <p>Sans usage des API, l’application ne génère aucun coût d’utilisation. Minimums, crédits prépayés, taxes ou autres conditions fournisseur peuvent néanmoins s’appliquer.</p>
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
