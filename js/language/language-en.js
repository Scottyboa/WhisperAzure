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
  adRevenueMessage: "As this website is free to use and relies solely on ad revenue, please consent to personalized ads to help support the service.",
  securityModalHeading: "Privacy",
securityModalText: `Your privacy and the security of patient information are our highest priorities. We use robust measures to ensure that your data remains confidential and secure:<br><br>
- <strong>Data Encryption:</strong> All data processed by our system—including audio recordings, transcripts, and notes—is encrypted using industry-standard methods. Transcripts and notes are linked exclusively to your encrypted personal API key and the device used for access, ensuring that only you can view the generated content.<br><br>
- <strong>Automatic Deletion:</strong> Once a transcript or note is generated and displayed on your screen, it is automatically and irreversibly deleted from our servers within 2 minutes. Audio files are stored only temporarily for processing and are not retained beyond immediate use.<br><br>
- <strong>Unauthorized Access Protection:</strong> Even if unauthorized access to your API key were to occur, your data remains encrypted and secured by device-specific markers, making the information inaccessible.<br><br>
- <strong>GDPR-Compliant Hosting:</strong> All backend processes run on dedicated Microsoft Azure servers located within the EU, fully compliant with GDPR regulations.<br><br>
<strong>Additional Privacy Practices:</strong><br><br>
- <strong>Minimal Data Collection:</strong> We collect only the essential information required to provide our services. This includes your OpenAI API key (stored in encrypted form for the duration of your session), a device token used solely for encryption, and your language preference. No additional personal data is stored.<br><br>
- <strong>Cookie Usage:</strong> Cookies on this site are used exclusively for serving personalized ads and enhancing your experience. We do not use these cookies to collect or store personal data beyond what is required for this purpose. In addition, our website uses cookies to store user preferences and manage consent.<br><br>
- <strong>Data Processing & Retention:</strong> All data processed by our system—including audio recordings, transcripts, and generated notes—is retained only for the duration necessary to complete the transcription and note-generation process and is automatically deleted shortly after processing is complete. We do not store or share any personally identifiable information beyond what is required for the proper functioning of our service.<br><br>
- <strong>Third-Party Data Sharing & Regulatory Compliance:</strong> We do not sell or share your personal data with third parties. Any data shared with external services—such as OpenAI for transcription and note generation or Google AdSense for personalized ads—is limited to anonymized information related solely to ad personalization and user preferences, and does not include your recordings, transcripts, or generated notes. All data sharing is conducted under strict confidentiality standards and in full compliance with applicable privacy regulations.<br><br>
Please note that, due to our system design, all data is automatically deleted shortly after processing and is not stored long-term.`,
  aboutModalHeading: "About",
  aboutModalText: `This website was created to provide healthcare professionals and other users with direct access to high-quality speech-to-text transcription and clinical note generation—without unnecessary costs or intermediaries.<br><br>
By using your own OpenAI API key, you connect directly to the source of the technology. This means you only pay the actual usage cost set by OpenAI, without markups or subscription fees.<br><br>
Many existing providers offer similar services but charge significantly more—often 8 to 10 times the real cost of the underlying technology. This platform offers the same functionality at a fraction of the price.<br><br>
<strong>Key points:</strong><br>
• No subscription, no account required.<br>
• You only pay OpenAI directly for what you use.<br>
• The website itself is completely free.<br><br>
To keep it that way, users are required to accept ads. Ad revenue helps cover hosting and operational costs so the service can remain accessible and free for everyone.`,
  guideModalHeading: "How To Use",
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
    <li><strong>Token-Based Pricing:</strong></li>
    <ul>
      <li><strong>Input (transcription + prompt):</strong> $10 per 1,000,000 tokens (i.e. $0.00001 per token).</li>
      <li><strong>Output (generated note):</strong> $30 per 1,000,000 tokens (i.e. $0.00003 per token).</li>
    </ul>
  </ul>
  <h3>Example Consultation Calculation (Note Generation Only)</h3>
  <ol>
    <li>
      <strong>Input Calculation:</strong>
      <p>Assume the consultation transcription is about <strong>700 words</strong> and you add a <strong>30-word prompt</strong>.<br>
      Total words = 700 + 30 = <strong>730 words</strong>.<br>
      Estimated tokens = 730 × 0.75 ≈ <strong>547.5 tokens</strong>.<br>
      Input cost = 547.5 tokens × $0.00001 ≈ <strong>$0.0055</strong>.</p>
    </li>
    <li>
      <strong>Output Calculation:</strong>
      <p>Assume the generated note is around <strong>250 words</strong>.<br>
      Estimated tokens = 250 × 0.75 ≈ <strong>187.5 tokens</strong>.<br>
      Output cost = 187.5 tokens × $0.00003 ≈ <strong>$0.0056</strong>.</p>
    </li>
    <li>
      <strong>Total Note Generation Cost:</strong>
      <p>Combined cost ≈ $0.0055 + $0.0056 = <strong>$0.0111</strong> per consultation.</p>
    </li>
  </ol>
  <h2>Approximate Combined Cost Per Consultation</h2>
  <p>(for a 15-minute consultation/recording, using both functions)</p>
  <ul>
    <li><strong>Speech-to-Text:</strong> <strong>$0.09</strong></li>
    <li><strong>Note Generation:</strong> <strong>$0.0111</strong></li>
    <li><strong>Total:</strong> Approximately <strong>$0.101</strong> per consultation.</li>
  </ul>
  <h2>Monthly Cost Estimates</h2>
  <p>Assuming you conduct 20 consultations per day, 4 days per week, over 4 weeks per month (20 × 4 × 4 = <strong>320 consultations</strong> per month):</p>
  <ol>
    <li>
      <strong>Using Only Speech-to-Text</strong> (with note generation via your own ChatGPT account, which is essentially free):<br>
      Monthly cost = 320 × $0.09 = <strong>$28.80</strong>.
    </li>
    <li>
      <strong>Using Both Speech-to-Text and Note Generation:</strong><br>
      Monthly cost = 320 × $0.101 ≈ <strong>$32.32</strong>.
    </li>
  </ol>
  <h2>Usage Flexibility</h2>
  <p>Unlike providers that require a monthly subscription, you only pay per usage. If you take a day off, go on vacation, or have a period of no activity, your costs will be zero. Even if you use the service every day for all your patient consultations, the per-use cost remains significantly lower compared to other providers.</p>
  <hr>
  <h2>Direct Connection Advantage</h2>
  <p>Our webapp connects you directly with the OpenAI API—no intermediary, no extra fees. This direct link means you only pay for the actual AI processing cost, making our service one of the most affordable speech-to-text and note generation solutions available today.</p>
`,
};

export const transcribeTranslations = {
  pageTitle: "Transcription Tool with Ads and Guide Overlay",
  openaiUsageLinkText: "Cost Usage Overview",
  btnFunctions: "Functions",
  btnGuide: "Guide",
  recordingAreaTitle: "Recording Area",
  recordTimer: "Recording Timer: 0 sec",
  transcribeTimer: "Completion Timer: 0 sec",
  transcriptionPlaceholder: "Transcription result will appear here...",
  startButton: "Start Recording",
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
<strong>How to Use the Functions:</strong>
<ul>
  <li><strong>Recording:</strong> Click "Start Recording" to begin capturing audio. Every 2 minutes, a chunk of audio is automatically sent to the OpenAI servers for transcription. The transcripts will appear sequentially in the transcription output field.</li>
  <li><strong>Completion:</strong> After clicking "Stop/Complete", the recording stops. The Completion Timer counts until the full transcript is received (usually within 5–10 seconds).</li>
  <li><strong>Note Generation:</strong> Once transcription is complete, click "Generate Note" to create a note based on your transcript and custom prompt.</li>
  <li><strong>Custom Prompt:</strong> On the right, select a prompt slot (1–10) and enter your custom prompt. Your prompt is saved automatically and linked to your API key.</li>
  <li><strong>Usage Overview:</strong> To check your current usage at OpenAI, click on the usage overview hyperlink on the main interface.</li>
  <li><strong>Security:</strong> Your audio is encrypted and processed on secure Microsoft Azure servers. Additionally, transcriptions and notes are automatically deleted shortly after processing to protect your privacy.</li>
  <li><strong>Guide Toggle:</strong> Click the "Guide" button again to return to the main interface.</li>
</ul>`
};

export default { indexTranslations, transcribeTranslations };
