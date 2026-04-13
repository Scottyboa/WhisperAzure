export const indexTranslations = {
  pageTitle: "Transcribe Notes",
  headerTitle: "Transcribe Notes",
  headerSubtitle: "Advanced AI-Powered Speech-to-Text and Clinical Note Generation for Healthcare Consultations",
  startText: "You can now also choose between different models from various providers. Read the info modules at the bottom of the frontpage, for instructions on how to use the app.",
  apiPlaceholder: "Enter OpenAI API Key here",
  promptProfileHint: "Used to save your custom prompts on this device independent of your API key.",
  keysIoHint: "Export keys to a file and store it securely. Next time, import the file to refill the fields, which saves time and avoids typing. The keys are deleted automatically when you close the webapp/tab, or manually by clicking Clear keys.",
  gdprColumnTitle: "GDPR compliant:",
  gdprColumnFootnote: "(EU data residency/processing + zero data retention + data not used for model traning - assuming correct configuration)",
  nonGdprColumnTitle: "Non-GDPR compliant:",
  nonGdprColumnFootnote: "(Varying degrees of data retention + data processing/residency in US)",
  enterButton: "Enter Transcription Tool",
  guideButton: "API guide - How to use",
  securityButton: "Security",
  aboutButton: "About",
  adRevenueMessage: "As this website is free to use and relies solely on ad revenue, please consent to ads to help support the service.",

  // Accordion tab #1 (left): AI models
  modelsModalHeading: "AI models",
  modelsModalText: `
  <div>
  <p><strong>Model selection in Transcribe Notes</strong></p>

  <p>
    This web app lets you choose different models from multiple providers – both for <strong>speech-to-text (STT)</strong>
    and for <strong>note/text generation</strong>. The result you get depends on both choices: first the quality of
    the transcription, and then how good the text model is at transforming the transcription (plus any prompt/additional info)
    into a structured note.
  </p>

  <hr><br>

  <p><strong>1) Speech-to-text (STT) – providers/models in the app</strong></p>
  <ul>
    <li><strong>Soniox</strong> (with optional speaker diarization)</li>
    <li><strong>OpenAI</strong> – gpt-4o-transcribe</li>
    <li><strong>Voxtral Mini</strong> (Mistral)</li>
    <li><strong>Deepgram</strong> – Nova-3</li>
    <li><strong>Lemonfox</strong> – Speech-to-Text (Whisper v3-based)</li>
  </ul>

  <br>
  <p><strong>2) Note/text generation – providers/models in the app</strong></p>
  <ul>
    <li><strong>AWS Bedrock (Claude)</strong> – Claude Haiku 4.5, Claude Sonnet 4.5, Claude Opus 4.5</li>
    <li><strong>OpenAI</strong> – GPT-5.4, GPT-5.2, GPT-5.1</li>
    <li><strong>Google Gemini (AI Studio)</strong> – Gemini 3</li>
    <li><strong>Google Vertex</strong> – Gemini 2.5 Pro</li>
    <li><strong>Mistral</strong> – Mistral Large (Large 3)</li>
    <li><strong>Lemonfox</strong> – Llama 3-based models</li>
  </ul>

  <hr><br>

  <p><strong>Quality</strong></p>
  <p>
    The models do <strong>not</strong> produce the same output. Some models are older/weaker, and quality often tracks both model generation
    and price level. In practice, note quality is almost always a product of two things:
  </p>
  <ul>
    <li><strong>1) How good the transcription is</strong> (STT quality, error rate, punctuation, and optional speaker labels)</li>
    <li><strong>2) How good the text model is</strong> at “understanding” the transcription and following the instruction/prompt</li>
  </ul>

  <p>
    That means: If you have a <strong>weak transcription</strong> but a <strong>very strong text model</strong>, the model will still be limited
    by missing/incorrect information in the transcription. And conversely: A <strong>very good transcription</strong> helps a lot, but a
    <strong>weak text model</strong> can still produce a worse note because it fails to structure, prioritize, and follow the instruction
    as precisely.
  </p>

  <br>
  <p><strong>Practical “ranking” of note generation (quality)</strong></p>
  <p>
    Below is a practical, somewhat opinionated overview based on typical note quality in clinical use:
  </p>
  <ul>
    <li>
      <strong>Top tier:</strong> <strong>Claude Opus 4.5</strong> (usually best for notes).
      In the same “top class” you will often find <strong>GPT-5.2</strong> and <strong>Gemini 3</strong> – but these can be more challenging in clinical use
      depending on data flow/region and GDPR setup.
    </li>
    <li>
      <strong>Tier 2 (strong quality + simpler GDPR setup):</strong>
      <strong>Claude Sonnet 4.5</strong> (AWS Bedrock) and <strong>Gemini 2.5 Pro</strong> (Google Vertex).
      These can be set up via EU regions and with stricter control of data processing (depending on your setup).
    </li>
    <li>
      <strong>Tier 3 (good value for money):</strong> <strong>Mistral Large</strong>.
      Often very inexpensive and good enough for a lot, but typically a notch below the top models on precision/structure in demanding notes.
    </li>
    <li>
      <strong>Last:</strong> <strong>Lemonfox (Llama 3)</strong>.
      Very cheap, but uses an older/weaker model for note generation and is primarily included for testing/experimentation.
      Generally not recommended for the best possible clinical note quality.
    </li>
  </ul>

  <br>
  <p><strong>Practical “ranking” of speech-to-text (quality)</strong></p>
  <ul>
    <li>
      <strong>1. Soniox</strong> – very high transcription quality. With <strong>speaker labels</strong> you often get a much better foundation
      for note generation (e.g., “Speaker 1”/“Speaker 2” in doctor–patient conversations). At the same time, Soniox is often among the cheapest STT options, with an easy option for an EU endpoint (see API guide for more info).
    </li>
    <li>
      <strong>2. OpenAI gpt-4o-transcribe</strong> – also very good, but often a slightly higher error rate than Soniox in practice.
      In clinical use you must also be extra mindful of GDPR/setup (region, retention, and agreements).
    </li>
    <li>
      <strong>Other alternatives:</strong> Deepgram Nova-3, Voxtral Mini, and Lemonfox Whisper v3 can work well for many cases,
      but often produce more variable results than the top choices above – especially in demanding medical conversations.
    </li>
  </ul>

  <hr><br>

  <p><strong>Price vs. quality</strong></p>
  <p>
    The best text models often cost more per token than simpler models. For example, <strong>Claude Opus 4.5</strong> is usually the most expensive
    text model in the app – but it often provides the best note quality. Even so, total monthly cost in normal use will often be
    surprisingly low when you compare it to subscription services on the market such as <strong>MedBric</strong>, <strong>Noteless</strong>,
    <strong>Stenoly</strong>, and <strong>Journalia</strong>.
  </p>
  <p>
    See the “Cost information” section for concrete pricing examples and usage.
  </p>

  <hr><br>

  <p><strong>Recommended setup for clinical use</strong></p>
  <p>
    If the goal is <strong>the best possible note quality</strong> and at the same time a setup that is GDPR-friendly, then
    the strongest combination is often:
    <strong>Soniox (EU endpoint) + AWS Bedrock (Claude Opus 4.5)</strong>.
    Alternatively <strong>Soniox + Google Vertex (Gemini 2.5 Pro)</strong>, <strong>Soniox + AWS Bedrock(Claude Sonnet 4.5)</strong> or <strong>Soniox + Mistral</strong> (EU setup).
  </p>
  <p>
    Remember: GDPR/compliance depends on your organization, agreements (DPA), risk assessments (DPIA/TIA), and the actual region/retention settings
    with the vendors. Read the “Privacy” section for more details.
  </p>
</div>
`,

  securityModalHeading: "Privacy",
securityModalText: `
<strong>Privacy and Data Processing</strong><br><br>
This web app is designed as a tool for speech-to-text and note generation. It is your full responsibility as a healthcare professional/data controller to ensure that all use complies with GDPR, the Health Personnel Act, and the Norwegian “Normen” for information security.<br><br>

You alone are responsible for ensuring that the use of this app meets all requirements under:<br>
- GDPR<br>
- The Health Personnel Act<br>
- The Norwegian Information Security Norm (“Normen”)<br><br>

This includes, among other things:<br>
- Entering necessary agreements (DPAs)<br>
- Performing thorough risk assessments (DPIA and TIA)<br><br>

– More information about this is found further down in this text.<br><br>

The developer of this web app assumes no responsibility for your use or lack of compliance. This is not legal advice; you must involve a data protection officer/legal advisor as needed.<br><br>

<hr><br>


<strong>1. Practical model recommendations in this app</strong><br><br>

This app exposes several different providers and models. Below is a practical, opinionated overview to make model choice easier. You must still do your own legal and technical assessment.<br><br>

<strong>Speech-to-text (STT)</strong><br>
- For raw transcription quality, the strongest STT models in this app are generally OpenAI gpt-4o-transcribe and Soniox.<br>
- For routine use with identifiable patient data, Soniox with an EU endpoint and zero data retention is the best aligned with strict GDPR and health-sector requirements. OpenAI typically uses global endpoints with temporary retention and will often end up in a legal “gray zone” unless you have special contracts and EU data residency explicitly in place.<br><br>

<strong>Note generation</strong><br>
- The best note-generation quality in this app typically comes from the ChatGPT models (GPT-5.1 / GPT-4o), Mistral (Mistral Large 3), the Claude models (via AWS Bedrock), and the Gemini models (Gemini 3 and Gemini 2.5 Pro).<br>
- From a GDPR standpoint, the recommended setup in this app is <strong>AWS Bedrock (Claude)</strong>, because it can be configured for strong data-residency controls (EU/EEA regions), zero data retention, and no-training reuse—making it a highly “GDPR-optimized” path for note generation when set up correctly.<br>
- A strong alternative is <strong>Google Vertex AI with Gemini 2.5 Pro</strong> in an EU region. This requires that you set up your own Google Cloud/Vertex project, deploy a backend, and paste the backend URL and secret into the “Google Vertex” fields on the front page.<br>
- <strong>Mistral (EU)</strong> can also be a GDPR-friendly option for note generation when you (1) use EU processing, (2) request <strong>Zero Data Retention</strong> from Mistral support (<a href="https://mistral.ai/contact" target="_blank" rel="noopener noreferrer">mistral.ai/contact</a>), and (3) <strong>opt out of model training</strong> in your Mistral account privacy settings (<a href="https://admin.mistral.ai/plateforme/privacy" target="_blank" rel="noopener noreferrer">admin.mistral.ai/plateforme/privacy</a>). If you have not activated these, treat Mistral as a “gray zone” for identifiable patient data.<br>
- For setup guidance related to Google Vertex and AWS Bedrock, click on the "Guide" hyperlink next to the input fields on the front page.<br>

<strong>Other providers in this app</strong><br>
- Lemonfox and Deepgram are included mainly for testing/experimentation and possible non-clinical use. For demanding clinical dictation and note generation, their quality is generally lower than Soniox/OpenAI/Gemini, and their GDPR status depends entirely on which endpoints (EU/global) and options (such as Zero Data Retention) you actually have activated with the provider.<br>
- The GPT models from OpenAI, Deepgram’s default/global endpoints, and Gemini 3 used via Google AI Studio typically involve global infrastructure and temporary data retention. These setups are not automatically GDPR-compliant for identifiable patient data and should be treated as “gray zones” unless you have explicit agreements and EU data residency/ZDR documented.<br>
- Likewise, any non-EU endpoint/region choice (for any provider) can move processing outside the EU/EEA, so make sure your endpoint/region choices match your compliance requirements.<br><br>

<strong>“Most GDPR-optimized” combination in this app</strong><br>
If you use Soniox with an EU endpoint for speech-to-text and Google Vertex og AWS Bedrock for note generation, the technical data flow in this app can be kept inside the EU with zero data retention and no training reuse at provider side.<br>
A strong alternative is Soniox (EU endpoint) + Mistral (EU processing + approved Zero Data Retention + training opt-out enabled).<br><br>

<hr><br>

<strong>2. How does the web app work?</strong><br>
- Records audio through the browser’s recording functionality.<br>
- Processes audio in the browser’s memory (RAM).<br>
- Uploads the audio file via secure HTTPS to the selected speech-to-text provider (e.g., OpenAI, Soniox, Lemonfox, Mistral/Voxtral, Deepgram) using your own API key from that provider.<br>
- Sends the transcription (and any additional prompt/text) to the selected text model (e.g., GPT-5.1, GPT-4o, Gemini 3, Mistral Large, Lemonfox LLM, Gemini 2.5 Pro via Vertex) via their API, also using your own API key or backend URL/secret.<br>
- Your browser receives the draft note directly from the provider through a secure/encrypted connection.<br><br>

Your API keys are stored only temporarily in the browser’s memory (SessionStorage). When you close the app or browser, the keys are deleted. To use the web app again, you must paste the keys again. This provides an additional layer of security against unauthorized access.<br><br>

The web app has no server that stores audio or text; all communication is directly between your browser and the services you choose (or, in the case of Google Vertex, via the backend URL you have configured in your own Google Cloud project).<br><br>

<hr><br>

<strong>3. Your own API keys are required</strong><br>
All communication with the model providers (OpenAI, Google Gemini, Soniox, Lemonfox, Deepgram, Mistral, etc.) happens directly from your browser using your personal API keys, or via your own Google Cloud backend URL/secret for Vertex.<br><br>

The developer of this web app has no access to your API keys, your backend URL/secret, or the content you send to the providers.<br><br>

<hr><br>

<strong>4. Data Processing Agreements (DPA) with providers</strong><br>
If you will use API services to process personal data (especially patient data), you are advised to enter a Data Processing Agreement (DPA) with each provider you actually use, for example:<br>
- OpenAI (speech-to-text and text generation)<br>
- Google (Gemini 3 via Google AI Studio, Gemini 2.5 Pro via Vertex AI)<br>
- Soniox (speech-to-text)<br>
- Deepgram (speech-to-text)<br>
- Mistral (Voxtral for speech-to-text, Mistral Large for text)<br>
- Lemonfox (Whisper v3 speech-to-text and Llama 3-based text models)<br><br>

OpenAI provides a standard DPA and an organization profile where company information is registered. Equivalent agreements and documents exist for other providers.<br><br>

Once DPAs are in place, you/your organization are the data controller, while the providers (OpenAI, Google, Soniox, Mistral, Deepgram, Lemonfox, etc.) are data processors. You must verify that the agreements adequately cover your specific use (healthcare, research, etc.).<br><br>

<hr><br>

<strong>5. DPIA and TIA – required risk assessments</strong><br><br>

<strong>DPIA (Data Protection Impact Assessment)</strong><br>
Required under GDPR Article 35 when new technology is used to process special-category data (such as health data). The purpose is to identify and reduce privacy risks related to the processing.<br><br>

You should, among other things:<br>
- Map which data are processed (audio, text, metadata).<br>
- Describe purpose (clinical documentation, quality, research, etc.).<br>
- Assess risks to patients’ rights and freedoms.<br>
- Decide on technical and organizational measures (encryption, access control, logging, training, etc.).<br><br>

<strong>TIA (Transfer Impact Assessment)</strong><br>
Required when personal data is transferred outside the EEA (e.g., to the USA). The purpose is to document that the transfer still provides a “essentially equivalent” level of protection (Schrems II, GDPR Art. 44–49).<br><br>

You should, among other things:<br>
- Assess relevant laws in the recipient country (e.g., FISA 702, CLOUD Act).<br>
- Compare this with the sensitivity of the data and the technical/contractual measures used (encryption, pseudonymization, SCC, ZDR, EU endpoints, etc.).<br>
- Conclude whether the transfer is acceptable and whether the residual risk is tolerable.<br><br>

Both DPIA and TIA should be completed, documented, and approved before using the web app with real patient data.<br><br>

<hr><br>

<strong>6. Data processing, storage, and “GDPR-friendliness” of different providers</strong><br><br>

Below is a rough overview of how services typically operate today. This may change. You must always check current documentation and agreements from each provider.<br><br>


<strong>Soniox (with EU endpoint)</strong><br>
Soniox offers data residency in both the US and EU.<br>
When a project is configured for the EU region, audio and transcripts are processed within that region; some system data (account/billing data) may still be handled globally.<br>
To use the EU endpoint clinically, you typically must contact Soniox and request EU-project access/API key and documentation. Access may take 1–2 days after contact.<br>
With the EU endpoint enabled, Soniox is a strong GDPR-aligned option for speech-to-text, though DPIA/TIA and DPAs remain required.<br><br>
<ul>
  <li><strong>EU region:</strong> Yes</li>
  <li><strong>Zero data retention:</strong> Yes – in this app, the audio is deleted immediately after the transcription is received back from Soniox.</li>
  <li><strong>Training:</strong> Not used</li>
</ul><br><br>

<strong>AWS Bedrock (Claude via EU backend)</strong><br>
In this app, AWS Bedrock is used only through your own backend URL and secret, entered under “AWS Bedrock” on the front page.<br>
If you follow the setup guide, your Bedrock deployment can be configured to an EU region with zero data retention and no training reuse. Requests and responses are processed within the EU, and request data is not retained longer than necessary to deliver the response, according to AWS documentation and your chosen configuration.<br>
For a practical walk-through of how to create the setup, choose region and deploy the backend used by this app, click the guide link next to the “AWS Bedrock” fields on the front page.<br><br>
<ul>
  <li><strong>EU region:</strong> Yes</li>
  <li><strong>Zero data retention:</strong> Yes</li>
  <li><strong>Training:</strong> Not used for training</li>
</ul><br><br>

<strong>Mistral (Voxtral for speech-to-text, Mistral Large for text)</strong><br>
EU-based. API data hosting in the EU by default unless explicitly using US endpoints.<br>
Mistral offers Zero Data Retention (ZDR) on request, meaning data is not retained beyond what is necessary to deliver the response. This may simplify GDPR justification but must be documented in DPIA/TIA.<br>
EU endpoint + ZDR (when granted and configured) makes Mistral one of the most GDPR-friendly options in this app.<br><br>
<ul>
  <li><strong>EU region:</strong> Yes</li>
  <li><strong>Zero data retention:</strong> No – default retention is typically ~30 days, but you can request Zero Data Retention by contacting Mistral support (Mistral Help Center).</li>
  <li><strong>Training:</strong> Opt-out available – by default data may be used for training, but you can disable this in your Mistral account privacy settings.</li>
</ul><br><br>

<strong>Google Vertex AI (Gemini 2.5 Pro via EU backend)</strong><br>
In this app, Google Vertex AI is used only through your own backend URL and secret, entered under “Google Vertex” on the front page.<br>
When your Vertex project is configured to use an EU region (for example europe-west1) and zero data retention/no training reuse, prompts and notes are processed within the EU, and request data is not kept longer than necessary to deliver the response, according to Google’s documentation.<br>
This setup can therefore be used as a fully EU-resident, zero-retention alternative for note generation, provided that you also have a valid DPA with Google and have completed DPIA/TIA that explicitly cover this use.<br>
For a practical walk-through of how to create the project, set the region, and deploy the backend used by this app, you can click the guide button in the “Google Vertex” header on the front page; this opens a dedicated ChatGPT guide where you can ask follow-up questions.<br><br>
<ul>
  <li><strong>EU region:</strong> Yes</li>
  <li><strong>Zero data retention:</strong> Yes</li>
  <li><strong>Training:</strong> Not used for training</li>
</ul><br><br>


<strong>Gemini 3 (Google AI Studio)</strong><br>
Gemini 3 used via Google AI Studio / Gemini API with a plain API key is normally processed on Google’s global infrastructure, which may involve transfers outside the EEA.<br>
Google may retain request data for a limited period for abuse detection, reliability and improvement, depending on your settings and agreement, and the endpoint is not by default explicitly EU-locked.<br>
Use of Gemini 3 via Google AI Studio will therefore often be a legal “gray zone” for identifiable patient data unless you have explicit contractual guarantees for EU data residency and retention, documented in your DPIA/TIA.<br><br>
<ul>
  <li><strong>EU region:</strong> No – global processing</li>
  <li><strong>Zero data retention:</strong> No – default is data retention (commonly cited around ~55 days) unless otherwise agreed/configured.</li>
  <li><strong>Training:</strong> Varies – depends on settings/agreements (treat as non-GDPR for identifiable patient data without explicit guarantees).</li>
</ul><br><br>

<strong>OpenAI</strong><br>
OpenAI states that API data is not used for training by default, but may be stored temporarily (typically up to ~30 days) for abuse detection and debugging.<br>
OpenAI has introduced data residency in Europe for certain API customers and products, but this requires specific agreements/configurations.<br>
With typical usage in this app, OpenAI calls often go to global (US) endpoints, meaning transfers outside the EEA.<br><br>
<ul>
  <li><strong>EU region:</strong> No (by default)</li>
  <li><strong>Zero data retention:</strong> No – default is temporary retention (typically up to ~30 days)</li>
  <li><strong>Training:</strong> Not used (API default)</li>
</ul><br><br>

Using OpenAI with patient data is often a legal gray zone unless you have:<br>
- a clear DPA,<br>
- documented DPIA/TIA covering the transfer,<br>
- any special arrangements for EU data residency/ZDR if available and activated.<br><br>

<strong>Deepgram (Nova-3)</strong><br>
Historically used global endpoints, but now offers dedicated and EU-specific endpoints.<br>
Using only the default/global endpoint typically means audio is processed outside the EEA.<br>
Deepgram also offers EU-hosted services and various compliance setups, but you must configure the correct endpoint (e.g., api.eu.deepgram.com) and have agreements covering data residency and retention.<br>
As commonly used today, Deepgram—like OpenAI—may involve data transfers outside the EU unless explicitly configured otherwise.<br><br>
<ul>
  <li><strong>EU region:</strong> No – default usage can be global (EU endpoint requires explicit selection/configuration)</li>
  <li><strong>Zero data retention:</strong> Depends – can be arranged by contacting Deepgram support</li>
  <li><strong>Training:</strong> Not used (by default)</li>
</ul><br><br>

<strong>Lemonfox (speech-to-text and text generation)</strong><br>
EU-based and markets itself as fully GDPR-compliant.<br>
Speech-to-text (Whisper v3) and Llama 3-based text models are processed in the EU, and they state that audio/text is deleted shortly after processing (no training reuse).<br>
This makes Lemonfox relatively GDPR-friendly for both speech-to-text and text generation, provided you still perform DPIA/TIA and have proper agreements.<br><br>

<strong>Summary of model options in this app:</strong><br><br>

Most GDPR-optimized path in this app (when correctly configured and with DPA + DPIA/TIA in place):<br>
- Soniox with EU endpoint for speech-to-text.<br>
- Google Vertex AI with Gemini 2.5 Pro in an EU region and zero data retention for note generation.<br><br>

Other relatively GDPR-friendly options (again assuming EU endpoints and any ZDR options are actually enabled and documented):<br>
- Lemonfox (EU STT + LLM, rapid deletion).<br>
- Mistral (Voxtral + Mistral Large) with EU hosting and optional ZDR.<br><br>

More demanding/“gray zones” for patient data (without special agreements/EU residency/ZDR):<br>
- OpenAI via global endpoints.<br>
- Deepgram via global endpoints.<br>
- Gemini 3 via global Google AI Studio/Gemini API without explicit EU lock.<br><br>

In all cases, you/your organization must document compliance with GDPR, the Health Personnel Act, and the Norwegian Information Security Norm.<br><br>

<hr><br>

<strong>7. Preconditions for possible clinical use</strong><br>
Your assessment is decisive: The legality of using this tool with patient data depends entirely on your own thorough assessment of both the app and every provider you connect to (OpenAI, Gemini, Soniox, Lemonfox, Mistral, Deepgram, etc.).<br><br>

Minimum requirements before using patient data:<br>
- Valid DPAs with every provider you use.<br>
- Organization-specific DPIA and TIA that are completed, approved, and conclude acceptable residual risk.<br>
- Clear decision on which models/endpoints may be used for patient data (for example, limiting patient-related use to Soniox with EU endpoint and Google Vertex AI with Gemini 2.5 Pro in an EU region and zero data retention, and possibly Lemonfox/Mistral if your assessments deem them adequate).<br>
- Responsibility for content: You are responsible for all data sent via your API keys/backends and for verifying the generated note before placing it in a patient record.<br><br>

<hr><br>

<strong>8. Overview of data storage</strong><br><br>

(This describes how the web app handles data; provider-side storage must be verified with each provider.)<br><br>

<strong>Your API keys (OpenAI, Soniox, Gemini, Lemonfox, Deepgram, Mistral, etc.) and Vertex backend credentials</strong><br>
- Where stored? SessionStorage in your browser.<br>
- For how long? Until you close the app or browser.<br>
- Who has access? Only you and your browser.<br><br>

<strong>Audio segments during recording</strong><br>
- Where stored? Browser memory (RAM).<br>
- For how long? Only during recording/processing. The app does not store audio permanently.<br>
- Who has access? Only you and your browser before the audio is sent to the selected STT API.<br><br>

<strong>Transcribed text/note drafts at providers</strong><br>
- Where stored? At the selected provider (OpenAI, Google, Soniox, Lemonfox, Mistral, Deepgram, etc.) in their cloud infrastructure, or in your own Google Cloud project when using your Vertex backend.<br>
- For how long? Varies—e.g., OpenAI states data may be stored up to ~30 days for abuse detection; some EU providers (Lemonfox/Mistral with ZDR, Soniox EU, Vertex with zero data retention) delete faster. You must verify each provider’s policy and your own Vertex configuration.<br>
- Who has access? You through the API/backend response, and the provider (or your own Google Cloud project) during the technical retention period.<br><br>

<strong>Instructions/Prompts inside the web app</strong><br>
- Where stored? Locally in your browser (LocalStorage/SessionStorage). If you use the same browser, PC, and API keys/backend values, prompts remain available next time.<br>
- For how long? Until you delete them or clear browser data.<br>
- Who has access? You and your browser.<br><br>

<hr><br>

<strong>9. Source code</strong><br>
The source code is open and runs locally in your browser. There are no hidden backdoors transmitting data to the developer’s servers, other than basic usage statistics like click counts, but no sensitive user information or data you send/receive.<br>
`,


  aboutModalHeading: "About",
  aboutModalText: `This website was created to give healthcare professionals and other users direct access to high-quality speech-to-text and clinical note generation — without unnecessary costs or intermediaries.<br><br>
By using your own API keys for speech-to-text and text-generation providers, you connect directly to the source of the technology. This means you only pay the actual usage cost set by each provider, with no markup or subscription fees from this website.<br><br>
Many existing providers offer similar services but charge significantly more — often many times the real cost of the underlying technology. This platform allows you to use the same models at essentially “wholesale price,” making the cost per consultation extremely low.<br><br>

<strong>Key points:</strong><br>
• No subscription, no account required on this website.<br>
• You pay only the providers directly for what you use (speech-to-text and text generation).<br>
• The website itself is completely free to use.<br><br>
`,

  guideModalHeading: "API key - How to Get",
guideModalText: `How to obtain API keys:<br><br>
To use the speech-to-text and note-generation models in this app, you must obtain one or more API keys (OpenAI, Soniox, Google Gemini, Lemonfox, Deepgram, Mistral).<br><br>

<strong>Speech-to-text models in the app:</strong><br>
- OpenAI: gpt-4o-transcribe<br>
- Soniox<br>
- Soniox (speaker labels)<br>
- Lemonfox Speech-to-Text (Whisper v3-based)<br>
- Voxtral Mini<br>
- Deepgram Nova-3<br><br>

<strong>Text generation models in the app:</strong><br>
- GPT-5.4<br>
- GPT-5.2<br>
- GPT-5.1<br>
- Claude sonnet 4, 4.5 and Claude Haiku 4.5(via AWS Bedrock)<br>
- Gemini 2.5 pro(via Google Vertex)<br>
- Lemonfox text generation (Llama 3-based models)<br>
- Mistral Large<br>
- Gemini 3<br><br>

<strong>Recommended use in relation to GDPR:</strong><br>
- Of the available models in this web app, Soniox for speech-to-text, as well as Google Vertex (Gemini 2.5 Pro) and AWS Bedrock (Claude) for text/note generation, are GDPR-compliant.<br>
- The other models may involve data processing outside the EU’s borders and temporary data retention, which makes them less suitable for use in a clinical setting with regard to GDPR and the Norwegian Data Protection Authority’s guidance/standards.<br>
- For use of this app in a clinical setting, it is therefore strongly recommended to use Soniox for speech-to-text, and Google Vertex and/or AWS Bedrock for note generation. Fortunately, these models are also very good and will provide high quality for both transcription and note generation.<br><br>

<strong>Soniox(full GDPR compliance)</strong><br>
– Create an account at Soniox:<br>
https://soniox.com<br><br>
– Generate a Soniox API key and purchase/upload credits (same principle as OpenAI)<br>
– Store the key securely and paste it into “Soniox API key (EU or US)” on the front page<br>
– You can now use Soniox speech-to-text (very high-quality and cost-effective, recommended)<br>
– For EU endpoint (GDPR-compliant): email sales@soniox.com and request an EU API key for clinical doctor–patient use.<br><br>
&nbsp;&nbsp;Example email:<br>
&nbsp;&nbsp;"Greetings!<br><br>
&nbsp;&nbsp;I work as a family doctor in Norway, and I wish to use the Soniox speech-to-text API to transcribe medical doctor-patient consultations in a clinical setting. In order for me to do this in a way that complies with my local GDPR regulations, I need to have access to a project/API-key with EU regional endpoint. I hope this is possible, as I am highly satisfied with the transcription quality of your speech-to-text model so far.<br><br>
&nbsp;&nbsp;Regards<br>
&nbsp;&nbsp;[Dr. "navn"]"<br><br>
– Usual response time is 1-2 days. When approved, you can create a "new project" on your soniox.com user, in which you may chose EU endpoint. You can then generate a new API key which is linked to this new project.<br>
– On the main page, you can choose between EU(GDPR compliant) and US endpoints in the dropdown when using Soniox. To use the the model with EU endpoint, simply paste your new EU API key in the Soniox API key infput field on the front page, before entering the main page.<br><br>


<strong>AWS Bedrock (full GDPR compliance)</strong><br>
– For note generation.<br>
– This is a more advanced setup than most options in the app, but it can be configured in a way that supports full GDPR compliance, with EU endpoint.<br>
– For step-by-step instructions, click the <a href="#" data-open-guide="bedrock"><strong>“Guide”</strong></a> link next to the <strong>AWS Bedrock</strong> header on the front page.<br>
– When the setup is complete, you will receive a <strong>backend URL</strong> and a <strong>secret key</strong>. You must paste these into the <strong>AWS Bedrock</strong> fields on the front page of the web app.<br><br>

<strong>Google Vertex (Gemini 2.5 Pro – full GDPR compliance)</strong><br>
– For note generation.<br>
– This is a more advanced setup designed for users who want to run Gemini through Google Cloud / Vertex AI using a regional EU endpoint (such as europe-west1 or europe-west4).<br>
– In short: you create your own Google Cloud project, activate Vertex AI, link it to a billing account, and deploy a small backend function (Cloud Run) which gives you a secure HTTPS URL (https://…run.app).<br>
– In this web app, you paste that URL into the field “Vertex backend URL (https://…run.app)” and your secret BACKEND_SECRET into the “Vertex backend secret” field on the front page.<br>
– All usage of Gemini 2.5 Pro then runs through *your* project; you control billing, quotas, and can select an EU region, which improves GDPR compliance.<br>
– The setup is slightly technical, so if you prefer a full step-by-step guide, click the <a href="#" data-open-guide="vertex"><strong>“Guide”</strong></a> link next to the “Google Vertex” header above the input fields on the front page.<br><br>

<strong>OpenAI</strong><br>
– Create an account at OpenAI:<br>
https://platform.openai.com<br><br>
– Generate an API key and add credit to your account<br>
– Store the key securely (locally on your PC, text file, password manager, Dropbox, etc.)<br>
– Paste the key into the field “OpenAI API key” on the front page<br>
– You can now use the OpenAI models in the app:<br>
• Speech-to-text: gpt-4o-transcribe (select “OpenAI” in the Recording Module dropdown on the main page)<br>
• Text generation: chatgpt-4-latest, GPT-5.1<br><br>

<strong>Google Gemini</strong><br>
– Create/log in to an account on Google AI Studio:<br>
https://aistudio.google.com<br><br>
– Generate a Gemini API key<br>
– You normally receive some free credits upon account creation (check inside AI Studio)<br>
– Store the key securely and paste it into “Google Gemini API key” on the front page<br>
– Text model: Gemini 3 (currently one of the best text-generation models available)<br><br>

<strong>Lemonfox</strong><br>
– Create an account on Lemonfox:<br>
https://www.lemonfox.ai<br><br>
– Generate an API key in the Lemonfox dashboard (for speech-to-text and/or text model depending on what you use)<br>
– Lemonfox offers a very inexpensive speech-to-text API, often with free usage for the first month — see the pricing/product page for details. EU endpoint (GDPR-friendly)<br>
– Store the key securely and paste it into “Lemonfox API key” on the front page<br>
– You can now use:<br>
• Speech-to-text: Lemonfox Speech-to-Text (Whisper v3-based, inexpensive and fast)<br>
• Text generation: Lemonfox LLM (Llama 3-based models)<br><br>

<strong>Deepgram</strong><br>
– Create an account at Deepgram:<br>
https://deepgram.com<br><br>
– Go to the developer/API pages (“Developers” / “Docs”) and generate an API key in the Deepgram console<br>
– Store the key securely and paste it into “Deepgram API key” on the front page<br>
– You can now use the Deepgram Nova-3 speech-to-text model in the app<br><br>

<strong>Mistral</strong><br>
– Create an account at Mistral AI and log in to the console:<br>
https://console.mistral.ai<br><br>
– Set up billing if needed, then go to “API keys” in the console and generate a Mistral API key<br>
– Store the key securely and paste it into “Mistral API key” on the front page<br>
– Text model: Mistral Large<br>
– EU endpoint / European data storage by default – well suited for GDPR-friendly use<br>
`,

  priceButton: "Price",
  priceModalHeading: "Price",
priceModalText: `
<div>
  <p><strong>Cost Information</strong></p>

  <p>
    You only pay for what you actually use, directly to each provider (OpenAI, Soniox, Google Gemini,
    Lemonfox, Deepgram, Mistral). There are no subscriptions or markups in this app. The prices below are
    approximate USD figures with conversion to NOK (using roughly 1 USD ≈ 11 NOK).
  </p>

  <p><strong>1. Speech-to-Text<br>(price per minute of audio)</strong></p>

  <p><strong>OpenAI – gpt-4o-transcribe</strong><br>
  Approx. 0.006 USD per minute (≈ 0.07 NOK/min).<br>
  15-minute consultation: approx. 0.09 USD ≈ 1.00 NOK.</p>

  <p><strong>Soniox (recommended – best quality and price)</strong><br>
  Approx. 0.0017 USD per minute.<br>
  15-minute consultation: approx. 0.025 USD ≈ 0.30 NOK.</p>

  <p><strong>Lemonfox – Whisper v3</strong><br>
  Approx. 0.50 USD for 3 hours of audio ≈ 0.17 USD per hour ≈ 0.0028 USD per minute.<br>
  15-minute consultation: approx. 0.042 USD ≈ 0.45 NOK.</p>

  <p><strong>Mistral</strong><br>
  API pricing starts around 0.001 USD per minute.<br>
  15-minute consultation: approx. 0.015 USD ≈ 0.17 NOK.</p>

  <p><strong>Deepgram – Nova-3</strong><br>
  Approx. 0.004 USD per minute.<br>
  15-minute consultation = approx. 0.60 NOK.</p>

  <p><strong>2. Text Generation – typical prices (per 1 million tokens)</strong></p>

  <p><strong>OpenAI – GPT-5.1</strong><br>
  Input: 1.25 USD (≈ 13.75 NOK)<br>
  Output: 10 USD (≈ 110 NOK)</p>

  <p><strong>OpenAI – chatgpt-4o-latest</strong><br>
  Input: 5 USD (≈ 55 NOK)<br>
  Output: 15 USD (≈ 165 NOK)</p>

  <p><strong>Google Gemini 3</strong><br>
  Input: approx. 2 USD (≈ 22 NOK)<br>
  Output: approx. 12 USD (≈ 132 NOK)</p>

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
  Approx. 2 USD per 1M input tokens and 6 USD per 1M output tokens (≈ 22 and 66 NOK).</p>

  <p><strong>Lemonfox – Llama 3-based models</strong><br>
  Typically around 0.50 USD per 1M LLM input and output tokens (≈ 5.50 NOK).</p>

  <p><strong>3. What are tokens – and how much does 1 consultation cost?</strong></p>

  <p>Models count text in tokens, not plain words.</p>

  <ul>
    <li>1 token ≈ 4 characters ≈ ¾ of a word</li>
    <li>100 tokens ≈ 75 words</li>
    <li>1,000 tokens ≈ 750 words</li>
  </ul>

  <p>
    A 15-minute consultation typically:<br>
    2,200 input tokens per 15-minute consultation (the full transcription + structured text sent in),<br>
    450 output tokens in the finished note,<br>
    total approx. 2,650 tokens per consultation.<br><br>
    This means 1 million tokens gives about 350–400 consultations in this usage
    (depending on length and detail).
  </p>

  <p><strong>4. Example: cost per 15-minute consultation</strong></p>

  <p><em>Speech-to-text (approximate prices per 15 min):</em></p>
  <ul>
    <li>OpenAI gpt-4o-transcribe: ≈ 1.00 NOK</li>
    <li>Soniox: ≈ 0.30 NOK</li>
    <li>Lemonfox (Whisper v3): ≈ 0.45 NOK</li>
    <li>Voxtral (Mistral): ≈ 0.17 NOK</li>
    <li>Deepgram Nova-3 (batch): ≈ 0.70 NOK</li>
  </ul>

  <p><em>Note generation (2,200 input + 450 output tokens):</em></p>
  <ul>
    <li>GPT-5.1: ≈ 0.08 NOK per note</li>
    <li>chatgpt-4o-latest: ≈ 0.20 NOK per note</li>
    <li>Gemini 3: ≈ 0.11 NOK per note</li>
    <li>Mistral Large: ≈ 0.08 NOK per note</li>
    <li>Lemonfox LLM: ≈ 0.02 NOK per note</li>
    <li>AWS Bedrock – Claude Sonnet 4 / 4.5: ≈ 0.15 NOK per note</li>
    <li>AWS Bedrock – Claude Haiku 4.5: ≈ 0.05 NOK per note</li>
  </ul>

  <p><em>Some typical combinations for one 15-minute consultation:</em></p>

  <ul>
    <li>OpenAI (gpt-4o-transcribe) + GPT-5.1<br>
      ≈ 1.00 NOK (STT) + 0.08 NOK (note) ≈ 1.10 NOK per consultation
    </li>
    <li>Soniox + GPT-5.1<br>
      ≈ 0.30 NOK (STT) + 0.08 NOK (note) ≈ 0.40 NOK per consultation
    </li>
    <li>Voxtral + Mistral Large<br>
      ≈ 0.17 NOK (STT) + 0.08 NOK (note) ≈ 0.25 NOK per consultation
    </li>
    <li>Soniox + Claude Sonnet 4 / 4.5<br>
      ≈ 0.30 NOK (STT) + 0.15 NOK (note) ≈ 0.45 NOK per consultation
    </li>
    <li>Soniox + Claude Haiku 4.5<br>
      ≈ 0.30 NOK (STT) + 0.05 NOK (note) ≈ 0.35 NOK per consultation
    </li>
  </ul>

  <p>
    In other words: the text model is extremely cheap — the speech-to-text portion dominates the total cost.
  </p>

  <p><strong>5. Example: monthly cost with steady use</strong></p>

  <p>
    Assume:<br>
    20 consultations per day<br>
    4 days per week<br>
    4 weeks per month<br>
    ⇒ approx. 320 consultations per month (≈ 80 hours of audio).
  </p>

  <p>This yields approximately:</p>

  <ul>
    <li>OpenAI gpt-4o-transcribe + GPT-5.1<br>
      ≈ 31 USD ≈ 340 NOK per month
    </li>
    <li>Soniox + GPT-5.1<br>
      ≈ 10 USD ≈ 110 NOK per month
    </li>
    <li>Voxtral + Mistral Large<br>
      ≈ 7 USD ≈ 80 NOK per month
    </li>
    <li>Lemonfox (Whisper v3 + Llama 3)<br>
      ≈ 14 USD ≈ 150 NOK per month
    </li>
    <li>Deepgram Nova-3 + GPT-5.1<br>
      ≈ 23 USD ≈ 250 NOK per month
    </li>
    <li>Soniox + Claude Sonnet 4 / 4.5<br>
      ≈ 12 USD ≈ 130 NOK per month
    </li>
    <li>Soniox + Claude Haiku 4.5<br>
      ≈ 9 USD ≈ 100 NOK per month
    </li>
  </ul>

  <p>
    If you don’t use the service (vacation, sick leave, parental leave), no fixed costs accrue;
    you only pay for actual usage with each provider.
  </p>
</div>
`,

};

export const transcribeTranslations = {
  pageTitle: "Transcription Tool with Ads and Guide Overlay",
  openaiUsageLinkText: "Cost Usage Overview",
  openaiWalletLinkText: "Wallet Balance",
  btnFunctions: "Functions",
  btnGuide: "Guide",
  btnNews: "Status & Updates",
  backToHome: "Back to frontpage",
  recordingAreaTitle: "Recording Area",
  recordTimer: "Recording Timer: 0 sec",
  transcribeTimer: "Completion Timer: 0 sec",
  transcriptionPlaceholder: "Transcription result will appear here...",
  supplementaryInfoPlaceholder: "Supplementary information (optional)",
  startButton: "Start Recording",
  readFirstText: "Read first! ➔",
  stopButton: "Stop/Complete",
  pauseButton: "Pause Recording",
  statusMessage: "Welcome! Click \"Start Recording\" to begin.",
  noteGenerationTitle: "Note Generation",
  generateNoteButton: "Generate Note",
  noteTimer: "Completion Timer: 0 sec",
  generatedNotePlaceholder: "Generated note will appear here...",
  customPromptTitle: "Custom Prompt",
  promptExportButton: "Export",
  promptImportButton: "Import",
  promptSlotLabel: "Prompt Slot:",
  customPromptPlaceholder: "Enter custom prompt here",
  adUnitText: "Your Ad Here",
  guideHeading: "Guide & Instructions",
guideText: `Welcome to the Transcribe Notes Transcription tool. This application allows medical professionals, therapists, and other practitioners to record and transcribe consultations, as well as generate professional notes using an AI-powered note generator.<br><br>

<strong>How to Use the Functions:</strong><br><br>

<ul>
  <li><strong>Recording:</strong> The patient’s consent must always be obtained before recording. Select desired transcription model from pulldown menu, then click “Start recording” to begin capturing audio.<br><br>
  
  <strong><u>Important:</u> The recording function does not work in all browsers. We therefore recommend using <strong>Google Chrome</strong> or <strong>Microsoft Edge</strong>.</strong></li><br>

  <li><strong>Pause and resume:</strong> You can use the “Pause” button to temporarily stop the recording, for example if the consultation is interrupted or you need to leave the office for a moment. When you press “Pause,” the current audio segment is uploaded and transcribed, and the recording is paused. When you are ready to continue, click “Resume,” and the recording will automatically continue with the next segment. The timer continues from where it left off, and the recording can ultimately be ended as usual with “Stop/Done.”</li><br>

  <li><strong>Completion:</strong> When you click “Stop/Done,” the recording stops. The completion timer counts the time until the full transcription has been received (usually within 5–10 seconds).</li><br>

  <li><strong>Custom prompt and prompt profiles:</strong> On the right side, choose a prompt slot (1–10) and enter your own prompt. The prompts are saved automatically on this device. To make the prompts independent of changes to the API key, you can set a <strong>Prompt profile ID</strong> (e.g., “David”, “David 1”, “Office-PC-2”). The active profile is shown above the prompt field. If no profile is set, the prompts may still be saved using the older method that was tied to the API key.</li><br>

  <li><strong>Export / import (move or share prompts):</strong> Click <strong>Export</strong> to download a small JSON file containing all 10 prompt slots for the current profile. On another PC, set the Prompt profile ID (the same one or a new one) and click <strong>Import</strong> to load the file. Import always places the prompts into the <strong>active</strong> profile on that device, which also makes it easy to share prompt “templates” with colleagues.</li><br>

  <li><strong>Switch profile:</strong> When you change the Prompt profile ID, the prompt slots will immediately show the prompts stored under that profile. This allows multiple people to use the same PC without mixing prompts, as long as each user has their own profile.</li><br>

  <li><strong>Note generation:</strong> Once the transcription is complete, click “Generate note” to create a note based on the transcription and the selected/custom prompt. Note generation is performed by the provider selected in the dropdown menu in the note generation module. Generated clinical notes must be reviewed and validated by healthcare personnel before use.</li><br>

  <li><strong>Cost overview:</strong> To see your current cost/usage for the different providers, click the cost overview link located at the top right of the main functions page.</li><br>

  <li><strong>Security:</strong> Your audio recording is sent directly to the selected provider’s servers (from the dropdown menu) for transcription, and is neither stored (applies only to AWS Bedrock, Google Vertex, and Soniox) nor used for machine learning. The transcribed text is only displayed in your browser and is deleted/disappears as soon as you close the browser or load new content.</li><br>

  <li><strong>Guide button:</strong> Click the “Guide” button again to return to the main view.</li>
</ul><br><br>

<strong>Prompt Examples:</strong><br><br>

<strong>Consultation:</strong><br>
"System prompt – Medical Note Generator

Write a medically accurate, journal-ready note based on a transcribed doctor-patient conversation. Use the following structure (unless otherwise specified in the dictation):
Background (only if relevant history), Presenting complaint/anamnesis, Examination (bullet points), Assessment, Plan.

Rules:
– Do not include information, investigations, or findings not explicitly mentioned.
– Negative findings only if stated.
– Blood tests: write “relevant blood tests are ordered”, do not list them.
– Correct obvious misspellings in medication names.
– Do not use special characters or line breaks before headings.
– Follow explicit instructions from the doctor regarding style, length, or specific wording.

If the doctor adds comments after the patient has left, these must be considered. The note should be well-written."

<br><br>

<strong>Letter to patient:</strong><br>
"Write a letter from the doctor to the patient. Start with Hi \\"name\\", and end with<br>
Regards<br>
\\"Your name\\"<br>
\\"Clinic name\\"<br>
The letter must have a professional and formal tone. You may improve the wording slightly for better flow."

<br><br>

These are examples that work well, but feel free to adapt them to your documentation style, specialty, and type of consultation. You can also create entirely custom prompts for any purpose you wish.
`,

  // Redactor
  showRedactor: "Show redactor",
  hideRedactor: "Hide redactor",
  redactorTitle: "Redactor",
  redactorHelp: "Add one term per line. Both General and Specific terms are used when you click Redact. General terms stay available while this tab is open, but are cleared when the tab is closed.",
  redactorGeneralTermsLabel: "General terms",
  redactorGeneralTermsPlaceholder: "General terms, 1 per line",
  redactorSpecificTermsLabel: "Specific terms",
  redactorSpecificTermsPlaceholder: "Specific terms, 1 per line",
  redactorButton: "Redact",
  redactorBirthdateHelperLabel: "Birthdate helper",
  redactorBirthdateHelperPlaceholder: "e.g. 01011990",
  redactorAddDatesButton: "Add dates",
  redactorClearGeneralButton: "Clear general",
  redactorClearSpecificButton: "Clear specific",
  redactorImportGeneralButton: "Import General.txt",
  redactorExportGeneralButton: "Export General.txt",
  redactorOcrTitle: "OCR helper (paste/upload image)",
  redactorOcrHelp: "Use Windows + Shift + S, then click Paste image. You can also press Ctrl + V while the image area is focused, or upload an image file.",
  redactorPasteImageButton: "Paste image",
  redactorUploadImageButton: "Upload image",
  redactorClearImageButton: "Clear image",
  redactorFetchOcrSpecificButton: "Fetch OCR → Specific",
  redactorFetchOcrRawButton: "Fetch OCR → Raw text",
  redactorImageAlt: "Pasted screenshot preview",
  redactorImagePlaceholder: "No image loaded yet. Paste a screenshot here or upload an image.",
  redactorRawTextLabel: "OCR raw text",
  redactorRawTextPlaceholder: "Raw OCR text will appear here…",
  redactorCopyRawButton: "Copy raw",
  redactorClearRawButton: "Clear raw",

  // Redactor runtime messages
  redactorStatusGeneralCleared: "General terms cleared.",
  redactorStatusSpecificCleared: "Specific terms and birthdate cleared.",
  redactorStatusAddTermsFirst: "Add at least one General or Specific term to redact.",
  redactorStatusRawCopied: "Raw text copied to clipboard.",
  redactorStatusNoImage: "No image to OCR. Paste or upload one first.",
  redactorStatusOcrRunning: "OCR running…",
  redactorStatusOcrLoading: "OCR is loading language data…",
  redactorStatusOcrStarting: "OCR is starting…",
};

export default { indexTranslations, transcribeTranslations };
