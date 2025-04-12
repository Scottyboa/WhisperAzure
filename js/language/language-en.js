export const indexTranslations = {
  pageTitle: "Whisper Clinical Transcription",
  headerTitle: "Whisper Clinical Transcription",
  headerSubtitle: "Advanced AI-Powered Speech-to-Text and Clinical Note Generation for Healthcare Consultations",
  startText: "To get started, please enter your OpenAI API key:",
  apiPlaceholder: "Enter API Key here",
  enterButton: "Enter Transcription Tool",
  guideButton: "API guide - How to use",
  securityButton: "Security",
  aboutButton: "About",
  adRevenueMessage: "As this website is free to use and relies solely on ad revenue, please consent to ads to help support the service.",
  securityModalHeading: "Privacy",
securityModalText: `Your privacy and the security of patient information are our highest priority. We implement robust measures to ensure your data remains confidential and secure:<br><br>
- <strong>Direct and local processing:</strong> All data processed by our system – including audio recordings, transcripts, and notes – is sent directly to OpenAI via their secure API. No data is processed or stored on our own servers. Transcripts and notes are only displayed and temporarily stored in your browser and are automatically deleted when replaced or when the browser is closed.<br><br>
- <strong>Automatic deletion:</strong> As soon as a transcript or note is generated and displayed on your screen, it is automatically removed from your browser's memory when replaced with new content or when you leave the page. Audio files are processed only temporarily in the browser to enable upload to OpenAI and are not retained after use.<br><br>
- <strong>Protection against unauthorized access:</strong> Your data is processed directly by OpenAI and is only visible locally in your browser. Nothing is stored on our servers. Even if someone gains access to your API key, no data can be retrieved from our service.<br><br>
- <strong>GDPR-compliant data processing:</strong> All data processing is handled through OpenAI’s APIs and displayed only in your browser. OpenAI provides GDPR-compliant data handling and does not use your content for model training or further development.<br><br>
<strong>Additional privacy practices:</strong><br><br>
- <strong>Minimal data collection:</strong> We collect only the information necessary to deliver our services. This includes your language preference and a device token used solely to store user preferences locally in your browser. Your OpenAI API key is never stored by us but is temporarily held in your browser during the session. No additional personal information is collected or processed.<br><br>
- <strong>Use of cookies:</strong> Cookies on this site are used exclusively to display personalized ads and improve your user experience. We do not use these cookies to collect or store personal data beyond what is required for this purpose. In addition, the site uses cookies to store user preferences – such as language selection and custom prompts – and to manage consent.<br><br>
- <strong>Data processing and retention:</strong> All data – including audio recordings, transcripts, and generated notes – is processed solely in the browser and via OpenAI. Nothing is stored permanently, and all content is automatically deleted once the process is complete or when the page is closed. We do not store or share any personally identifiable information.<br><br>
- <strong>Third-party data sharing and regulatory compliance:</strong> We do not sell or share your personal data with third parties. Any data shared with external services – such as OpenAI for transcription and note generation or Google AdSense for personalized advertising – is limited to anonymized information strictly related to ad personalization and user preferences, and does not include your recordings, transcripts, or generated notes. All data sharing is conducted under strict confidentiality standards and in full compliance with applicable privacy regulations.<br><br>
Please note that due to the system’s design, all data is automatically deleted shortly after processing and is not stored permanently anywhere, unless you as the user choose to save the information locally.`,
  aboutModalHeading: "About",
  aboutModalText: `This website was created to provide healthcare professionals and other users with direct access to high-quality speech-to-text transcription and clinical note generation—without unnecessary costs or intermediaries.<br><br>
By using your own OpenAI API key, you connect directly to the source of the technology. This means you only pay the actual usage cost set by OpenAI, without markups or subscription fees.<br><br>
Many existing providers offer similar services but charge significantly more—often 8 to 10 times the real cost of the underlying technology. This platform offers the same functionality at a fraction of the price.<br><br>
<strong>Key points:</strong><br>
• No subscription, no account required.<br>
• You only pay OpenAI directly for what you use.<br>
• The website itself is completely free.<br><br>
To continue offering this free service, we would greatly appreciate it if you accept the display of ads from Google Ads. Ad revenue helps us cover hosting and operational costs, allowing the service to remain accessible to everyone.`,
  guideModalHeading: "API key - How to make",
  guideModalText: `To use this webapp, you must first create an OpenAI API profile, generate an API key, and fund your OpenAI wallet. Your API key is then copied and pasted into the provided API key field. Once you press Enter, the webapp saves the API key temporarily for your session—this key links you to the OpenAI servers so that speech-to-text transcription and note generation can work. Please note, you are charged immediately per task performed. For more info on cost, please review the "Cost" section on the front page.
<br><br>
<strong>1. Create Your OpenAI API Profile</strong><br>
To begin, you need to create a profile on the OpenAI API platform. This profile serves as your account for managing API keys and billing. To get started, visit the <a href="https://platform.openai.com/signup" style="color:blue;">OpenAI API Signup</a> page. Follow the instructions to sign up by providing your email address, setting a password, and verifying your account. Once registered, you'll have access to your dashboard.
<br><br>
<strong>2. Generate an API Key</strong><br>
After creating your profile, generate an API key by navigating to the <a href="https://platform.openai.com/account/api-keys" style="color:blue;">API key management</a> page. Click the button to create a new API key. Important: You will only see your API key once. Copy it immediately and store it securely (e.g., in a text file) for future use. If you lose the key or suspect it has been compromised, delete it from your account and create a new one.
<br><br>
<strong>3. Fund Your OpenAI Wallet</strong><br>
For the webapp to function, your OpenAI wallet must have sufficient funds. Visit the <a href="https://platform.openai.com/account/billing/overview" style="color:blue;">Billing & Payment</a> page to add funds. You can transfer any amount at any time. As long as funds are available, you'll be able to use the site—each task is charged immediately.
<br><br>
<strong>Session Security Reminder</strong><br>
When you log in by entering your API key, it is stored only temporarily in your browser session. This means if you exit the website, close your browser, or turn off your computer, the API key will not be saved. You will need to re-enter your API key the next time you use the webapp, ensuring your key remains secure.`,
  priceButton: "Price",
  priceModalHeading: "Price",
priceModalText: `
<div>
  <h1>Cost Information</h1>
  <h2>Speech-to-Text Pricing</h2>
  <ul>
    <li><strong>Cost:</strong> $0.006 per minute. <em>Example:</em> A 15-minute consultation will cost 15 × $0.006 = <strong>$0.09</strong> per consultation.</li>
  </ul>
  <h2>Note Generation Pricing</h2>
  <ul>
    <li><strong>Token-based pricing:</strong></li>
    <ul>
      <li><strong>Input (transcription + prompt):</strong> $5.00 per 1,000,000 tokens (i.e., $0.000005 per token).</li>
      <li><strong>Output (generated note):</strong> $15.00 per 1,000,000 tokens (i.e., $0.000015 per token).</li>
    </ul>
  </ul>
  <h3>Example Calculation for a Consultation (Note Generation Only)</h3>
  <ol>
    <li>
      <strong>Input Calculation:</strong>
      <p>Assume the consultation transcription is approximately <strong>700 words</strong> and you add a <strong>30-word prompt</strong>.<br>
      Total words = 700 + 30 = <strong>730 words</strong>.<br>
      Estimated token count = 730 × 0.75 ≈ <strong>547.5 tokens</strong>.<br>
      Input cost = 547.5 tokens × $0.000005 ≈ <strong>$0.0027</strong>.</p>
    </li>
    <li>
      <strong>Output Calculation:</strong>
      <p>Assume the generated note is approximately <strong>250 words</strong>.<br>
      Estimated token count = 250 × 0.75 ≈ <strong>187.5 tokens</strong>.<br>
      Output cost = 187.5 tokens × $0.000015 ≈ <strong>$0.0028</strong>.</p>
    </li>
    <li>
      <strong>Total Note Generation Cost:</strong>
      <p>Combined cost ≈ $0.0027 + $0.0028 = <strong>$0.0055</strong> per consultation.</p>
    </li>
  </ol>
  <h2>Approximate Total Cost per Consultation</h2>
  <p>(for a 15-minute consultation/recording using both features)</p>
  <ul>
    <li><strong>Speech-to-Text:</strong> <strong>$0.09</strong></li>
    <li><strong>Note Generation:</strong> <strong>$0.0055</strong></li>
    <li><strong>Total:</strong> Approximately <strong>$0.0955</strong> per consultation.</li>
  </ul>
  <h2>Monthly Cost Estimates</h2>
  <p>If you conduct 20 consultations per day, 4 days per week, for 4 weeks per month (20 × 4 × 4 = <strong>320 consultations</strong> per month):</p>
  <ol>
    <li>
      <strong>Speech-to-Text Only:</strong><br>
      Monthly cost = 320 × $0.09 = <strong>$28.80</strong>.
    </li>
    <li>
      <strong>Using Both Speech-to-Text and Note Generation:</strong><br>
      Monthly cost = 320 × $0.0955 ≈ <strong>$30.56</strong>.
    </li>
  </ol>
  <h2>Flexible Usage</h2>
  <p>Unlike providers that require a monthly subscription, you only pay for what you actually use. If you take a day off, go on vacation, or have a period with no activity, your costs will be zero. Even if you use the service daily for all your consultations, the per-task cost remains significantly lower than other providers.</p>
  <hr>
  <h2>Direct Connection Advantage</h2>
  <p>Our web app connects you directly to the OpenAI API—no intermediaries, no extra fees. This direct connection means you only pay for the actual AI processing cost, making our service one of the most cost-effective solutions for speech-to-text and note generation available today.</p>
`,
};

export const transcribeTranslations = {
  pageTitle: "Transcription Tool with Ads and Guide Overlay",
  openaiUsageLinkText: "Cost Usage Overview",
  openaiWalletLinkText: "Wallet Balance",
  btnFunctions: "Functions",
  btnGuide: "Guide",
  backToHome: "Back to frontpage",
  recordingAreaTitle: "Recording Area",
  recordTimer: "Recording Timer: 0 sec",
  transcribeTimer: "Completion Timer: 0 sec",
  transcriptionPlaceholder: "Transcription result will appear here...",
  startButton: "Start Recording",
  readFirstText: "Read first! ➔",
  stopButton: "Stop/Complete",
  pauseButton: "Pause Recording",
  statusMessage: "Welcome! Click \"Start Recording\" to begin.",
  noteGenerationTitle: "Note Generation",
  generateNoteButton: "Generate Note",
  noteTimer: "Note Generation Timer: 0 sec",
  generatedNotePlaceholder: "Generated note will appear here...",
  customPromptTitle: "Custom Prompt",
  promptSlotLabel: "Prompt Slot:",
  customPromptPlaceholder: "Enter custom prompt here",
  adUnitText: "Your Ad Here",
  guideHeading: "Guide & Instructions",
guideText: `Welcome to the Whisper Transcription tool. This application allows medical professionals, therapists, and other practitioners to record and transcribe consultations, as well as generate professional notes using an AI-powered note generator.<br><br>

<strong>How to Use the Functions:</strong><br><br>

<ul>
  <li><strong>Recording:</strong> Click "Start Recording" to begin capturing audio. Every 2 minutes, a chunk of audio is automatically sent to the OpenAI servers for transcription. The transcripts will appear sequentially in the transcription output field.<br><br>
  <strong><u>Important:</u> The recorder does not work in every web browser. It is recommended to use either <strong>Google Chrome</strong> or <strong>Microsoft Edge</strong>.</strong></li><br>

  <li><strong>Pause and Resume:</strong> You can use the "Pause" button to temporarily stop the recording—for instance, if the consultation is interrupted or you need to step out of the office briefly. When you click "Pause", the current audio segment is uploaded and transcribed, and the recording is paused. When you're ready to continue, click "Resume", and the recording automatically resumes with the next segment. The timer continues from where it left off, and the session can be ended as usual by clicking "Stop/Complete".</li><br>

  <li><strong>Completion:</strong> After clicking "Stop/Complete", the recording stops. The Completion Timer counts until the full transcript is received (usually within 5–10 seconds).</li><br>

  <li><strong>Custom Prompt:</strong> On the right, select a prompt slot (1–10) and enter your custom prompt. Your prompt is saved automatically and linked to your API key. You can create any prompt that fits your documentation style, tone, and clinical focus. This gives you full flexibility over how your notes are generated.</li><br>

  <li><strong>Note Generation:</strong> Once transcription is complete, click "Generate Note" to create a note based on your transcript and selected/custom prompt.</li><br>

  <li><strong>Usage Overview:</strong> To check your current usage at OpenAI, click on the usage overview hyperlink on the main interface.</li><br>

  <li><strong>Security:</strong> Your audio recording is sent directly to OpenAI’s API servers, which do not store the data and only use it for the purpose of transcription. The transcribed text displayed in your browser is not saved anywhere, and it is deleted/disappears as soon as you close the browser or load new content.</li><br>

  <li><strong>Guide Toggle:</strong> Click the "Guide" button again to return to the main interface.</li>
</ul><br><br>

<strong>Example Prompt:</strong><br>
"Make a medical note based on the doctor–patient conversation transcript. It must contain: Background, Presenting complaint, Clinical findings, Assessment, and Plan. The note must be written in professional language and use appropriate medical terminology."<br><br>

You can customize this prompt however you like to suit your documentation preferences, specialties, or consultation types.`,
};

export default { indexTranslations, transcribeTranslations };
