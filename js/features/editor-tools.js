// Extracted from transcribe.html inline editor/redactor utilities.
// Keeps page behavior unchanged while reducing page-owned runtime logic.


  // 3) Log pageview after DOM is ready + log clicks with provider context
  document.addEventListener('DOMContentLoaded', () => {
    // Optional: keep pageview lean (no provider fields)
    // Capture the "fresh page load" textarea heights so Clear can restore them.
    const captureDefaultHeight = (el) => {
      if (!el) return;
      const cs = window.getComputedStyle(el);
      // Prefer CSS min-height (your baseline), fall back to rendered height.
      const baseline =
        (cs.minHeight && cs.minHeight !== '0px') ? cs.minHeight :
        `${el.getBoundingClientRect().height}px`;
      el.dataset.defaultHeight = baseline;
    };

    const resetTextareaToDefault = (el) => {
      if (!el) return;
      el.value = '';
      el.scrollTop = 0;
      const baseline = el.dataset.defaultHeight;
      if (baseline) el.style.height = baseline;
      else el.style.height = '';
    };

    
    const transcriptionEl = document.getElementById('transcription');
    const supplementaryInfoEl = document.getElementById('supplementaryInfo');
    const generalTermsEl = document.getElementById('redactorGeneralTerms');
    const redactorTermsEl = document.getElementById('redactorTerms');
    const ocrRawOutputEl = document.getElementById('redactorOcrRawOutput');
    const birthdateInputEl = document.getElementById('redactorBirthdateInput');
    const supplementaryRedactorLayout = document.getElementById('supplementaryRedactorLayout');
    const redactorPane = document.getElementById('redactorPane');
    const toggleRedactorButton = document.getElementById('toggleRedactorButton');
    const applyRedactionButton = document.getElementById('applyRedactionButton');
    const clearRedactorButton = document.getElementById('clearRedactorButton');
    const clearGeneralTermsButton = document.getElementById('clearGeneralTermsButton');
    const uploadGeneralTermsButton = document.getElementById('uploadGeneralTermsButton');
    const generalTermsFileInput = document.getElementById('generalTermsFileInput');
    const exportGeneralTermsButton = document.getElementById('exportGeneralTermsButton');
    const redactorStatus = document.getElementById('redactorStatus');
    const pasteRedactorImageButton = document.getElementById('pasteRedactorImageButton');
    const redactorImageUpload = document.getElementById('redactorImageUpload');
    const clearRedactorImageButton = document.getElementById('clearRedactorImageButton');
    const fetchRedactorImageTextButton = document.getElementById('fetchRedactorImageTextButton');
    const fetchRedactorRawTextButton = document.getElementById('fetchRedactorRawTextButton');
    const redactorImageFrame = document.getElementById('redactorImageFrame');
    const redactorImagePreview = document.getElementById('redactorImagePreview');
    const redactorImagePlaceholder = document.getElementById('redactorImagePlaceholder');
    const addBirthdateFormatsButton = document.getElementById('addBirthdateFormatsButton');
    const copyRedactorRawOutputButton = document.getElementById('copyRedactorRawOutputButton');
    const clearRedactorRawOutputButton = document.getElementById('clearRedactorRawOutputButton');
    const downloadTranscriptButton = document.getElementById('downloadTranscriptButton');

    const REDACTOR_STRINGS = {
      en: {
        showRedactor: 'Show redactor',
        hideRedactor: 'Hide redactor',
        title: 'Redactor',
        help: 'Add one term per line. General and specific terms are both used when you click Redact. General terms stay while this tab remains open, but clear when the tab is closed.',
        ocrSectionTitle: 'Screenshot → OCR',
        ocrMiniHelpHtml: 'Use Windows + Shift + S, then click <strong>Paste image</strong>. You can also press <strong>Ctrl + V</strong> while the image frame is focused, or upload an image file.',
        pasteImage: 'Paste image',
        uploadImage: 'Upload image',
        clearImage: 'Clear image',
        fetchOcrSpecific: 'Fetch OCR → Specific',
        fetchOcrRaw: 'Fetch OCR → Raw text',
        fetching: 'Fetching…',
        imageFrameAriaLabel: 'OCR image preview. Paste an image here with Ctrl plus V.',
        imagePreviewAlt: 'OCR screenshot preview',
        imagePlaceholder: 'No image loaded yet. Paste a screenshot here or upload an image.',
        generalTermsLabel: 'General terms',
        generalTermsPlaceholder: 'General terms (one per line)\ne.g. hospital\nName',
        importGeneral: 'Import General.txt',
        exportGeneral: 'Export General.txt',
        clearGeneral: 'Clear general',
        specificTermsLabel: 'Specific terms',
        specificTermsPlaceholder: 'Specific terms (one per line)\nOla Nordmann\n12345678',
        clearSpecific: 'Clear specific',
        redact: 'Redact',
        rawOutputLabel: 'OCR raw text',
        rawOutputPlaceholder: 'Raw OCR text appears here without formatting or cleanup. Useful when you just want to copy the transcription.',
        copyRaw: 'Copy raw',
        clearRaw: 'Clear raw',
        birthdateLabel: 'Birthdate helper',
        birthdatePlaceholder: 'DDMMYY, e.g. 180289',
        addDates: 'Add dates',
        messages: {
          specificTermsNormalized: 'Specific terms cleaned and normalized.',
          imagePastedReady: 'Image pasted and ready for OCR.',
          noImageForOcr: 'No image to OCR. Paste or upload one first.',
          tesseractLoadFailed: 'Tesseract.js failed to load in this browser tab.',
          ocrRunning: ({ progress }) => `OCR running… ${progress}%`,
          ocrLoadingLanguageData: 'OCR is loading language data…',
          ocrStarting: 'OCR is starting…',
          noTextDetected: 'No text was detected in the image.',
          rawOcrComplete: ({ usedLanguage }) => `Raw OCR complete (${usedLanguage}) → text placed in Raw text.`,
          ocrError: ({ errorMessage }) => `OCR error: ${errorMessage}`,
          noSpecificTermsProduced: 'OCR finished, but no usable Specific terms were produced.',
          noNewUniqueTerms: ({ usedLanguage }) => `OCR finished (${usedLanguage}), but no new unique terms were added.`,
          ocrCompleteAddedSpecific: ({ usedLanguage, addedCount }) => `OCR complete (${usedLanguage}) → added ${addedCount} term${addedCount === 1 ? '' : 's'} to Specific.`,
          ocrCompleteAddedSpecificBirthdate: ({ usedLanguage, addedCount, detectedBirthdate }) => `OCR complete (${usedLanguage}) → added ${addedCount} term${addedCount === 1 ? '' : 's'} to Specific. Birthdate field auto-filled with ${detectedBirthdate}.`,
          redactedTerms: ({ termCount }) => `Redacted ${termCount} term${termCount === 1 ? '' : 's'} in Transcript and Supplementary information.`,
          noMatchingText: 'No matching text was found in Transcript or Supplementary information.',
          clipboardReadImageFailed: ({ errorMessage }) => errorMessage || 'Could not read an image from the clipboard.',
          generalTermsCleared: 'General terms cleared.',
          specificTermsCleared: 'Specific terms and birthdate cleared.',
          loadedGeneralFile: ({ fileName }) => `Loaded ${fileName} into General terms.`,
          couldNotReadFile: ({ fileName, errorMessage }) => `Could not read ${fileName}: ${errorMessage}`,
          savedGeneralSelectedLocation: 'Saved General.txt to the selected location.',
          savedGeneralDownloadFlow: 'Saved General.txt with the browser download flow.',
          saveCanceled: 'Save canceled.',
          couldNotExportGeneral: ({ errorMessage }) => `Could not export General.txt: ${errorMessage}`,
          addAtLeastOneTerm: 'Add at least one General or Specific term to redact.',
          invalidBirthdate: 'Enter a valid 6-digit birthdate in DDMMYY format, for example 180289.',
          birthdateAlreadyPresent: 'Those birthdate formats are already in Specific terms.',
          addedBirthdateFormats: ({ addedCount }) => `Added ${addedCount} birthdate format${addedCount === 1 ? '' : 's'} to Specific.`,
          clipboardNoImage: 'No image was found in the clipboard. Use Windows + Shift + S first, then try again.',
          loadedImage: ({ fileName }) => `Loaded image: ${fileName}`,
          imageCleared: 'Image cleared.',
          rawTextEmpty: 'Raw text is empty.',
          rawTextCopied: 'Raw text copied to clipboard.',
          rawTextCopyFailed: 'Could not copy raw text in this browser tab.',
          rawTextCleared: 'Raw text cleared.',
          pasteFromClipboardHint: 'Paste from clipboard with Ctrl + V, or use the Paste image button.',
        },
      },
      no: {
        showRedactor: 'Vis redactor',
        hideRedactor: 'Skjul redactor',
        title: 'Redactor',
        help: 'Legg til ett begrep per linje. Både generelle og spesifikke begreper brukes når du klikker Sladd. Generelle begreper beholdes så lenge denne fanen er åpen, men tømmes når fanen lukkes.',
        ocrSectionTitle: 'Skjermbilde → OCR',
        ocrMiniHelpHtml: 'Bruk Windows + Shift + S, og klikk deretter <strong>Lim inn bilde</strong>. Du kan også trykke <strong>Ctrl + V</strong> mens bildefeltet er fokusert, eller laste opp en bildefil.',
        pasteImage: 'Lim inn bilde',
        uploadImage: 'Last opp bilde',
        clearImage: 'Tøm bilde',
        fetchOcrSpecific: 'Hent OCR → Spesifikke',
        fetchOcrRaw: 'Hent OCR → Råtekst',
        fetching: 'Henter…',
        imageFrameAriaLabel: 'Forhåndsvisning av OCR-bilde. Lim inn et bilde her med Ctrl pluss V.',
        imagePreviewAlt: 'Forhåndsvisning av OCR-skjermbilde',
        imagePlaceholder: 'Intet bilde lastet inn ennå. Lim inn et skjermbilde her eller last opp et bilde.',
        generalTermsLabel: 'Generelle begreper',
        generalTermsPlaceholder: 'Generelle begreper (ett per linje)\nf.eks. sykehus\nNavn',
        importGeneral: 'Importer General.txt',
        exportGeneral: 'Eksporter General.txt',
        clearGeneral: 'Tøm generelle',
        specificTermsLabel: 'Spesifikke begreper',
        specificTermsPlaceholder: 'Spesifikke begreper (ett per linje)\nOla Nordmann\n12345678',
        clearSpecific: 'Tøm spesifikke',
        redact: 'Sladd',
        rawOutputLabel: 'OCR-råtekst',
        rawOutputPlaceholder: 'Rå OCR-tekst vises her uten formatering eller opprydding. Nyttig når du bare vil kopiere transkripsjonen.',
        copyRaw: 'Kopier råtekst',
        clearRaw: 'Tøm råtekst',
        birthdateLabel: 'Fødselsdatohjelper',
        birthdatePlaceholder: 'DDMMYY, f.eks. 180289',
        addDates: 'Legg til datoer',
        messages: {
          specificTermsNormalized: 'Spesifikke begreper ble renset og normalisert.',
          imagePastedReady: 'Bildet er limt inn og klart for OCR.',
          noImageForOcr: 'Ingen bilde å kjøre OCR på. Lim inn eller last opp et bilde først.',
          tesseractLoadFailed: 'Tesseract.js kunne ikke lastes i denne nettleserfanen.',
          ocrRunning: ({ progress }) => `OCR kjører… ${progress}%`,
          ocrLoadingLanguageData: 'OCR laster språkdata…',
          ocrStarting: 'OCR starter…',
          noTextDetected: 'Ingen tekst ble oppdaget i bildet.',
          rawOcrComplete: ({ usedLanguage }) => `Rå-OCR fullført (${usedLanguage}) → tekst lagt inn i råtekst.`,
          ocrError: ({ errorMessage }) => `OCR-feil: ${errorMessage}`,
          noSpecificTermsProduced: 'OCR ble fullført, men ga ingen brukbare spesifikke begreper.',
          noNewUniqueTerms: ({ usedLanguage }) => `OCR ble fullført (${usedLanguage}), men ingen nye unike begreper ble lagt til.`,
          ocrCompleteAddedSpecific: ({ usedLanguage, addedCount }) => `OCR fullført (${usedLanguage}) → la til ${addedCount} begrep${addedCount === 1 ? '' : 'er'} i Spesifikke begreper.`,
          ocrCompleteAddedSpecificBirthdate: ({ usedLanguage, addedCount, detectedBirthdate }) => `OCR fullført (${usedLanguage}) → la til ${addedCount} begrep${addedCount === 1 ? '' : 'er'} i Spesifikke begreper. Fødselsdatofeltet ble fylt ut automatisk med ${detectedBirthdate}.`,
          redactedTerms: ({ termCount }) => `Sladdet ${termCount} begrep${termCount === 1 ? '' : 'er'} i Transkripsjon og Tilleggsinformasjon.`,
          noMatchingText: 'Fant ingen treff i Transkripsjon eller Tilleggsinformasjon.',
          clipboardReadImageFailed: ({ errorMessage }) => errorMessage || 'Kunne ikke lese et bilde fra utklippstavlen.',
          generalTermsCleared: 'Generelle begreper tømt.',
          specificTermsCleared: 'Spesifikke begreper og fødselsdato tømt.',
          loadedGeneralFile: ({ fileName }) => `${fileName} ble lastet inn i Generelle begreper.`,
          couldNotReadFile: ({ fileName, errorMessage }) => `Kunne ikke lese ${fileName}: ${errorMessage}`,
          savedGeneralSelectedLocation: 'General.txt ble lagret på valgt plassering.',
          savedGeneralDownloadFlow: 'General.txt ble lagret via nettleserens nedlastingsflyt.',
          saveCanceled: 'Lagring avbrutt.',
          couldNotExportGeneral: ({ errorMessage }) => `Kunne ikke eksportere General.txt: ${errorMessage}`,
          addAtLeastOneTerm: 'Legg til minst ett generelt eller spesifikt begrep som skal sladdes.',
          invalidBirthdate: 'Skriv inn en gyldig 6-sifret fødselsdato i DDMMYY-format, for eksempel 180289.',
          birthdateAlreadyPresent: 'Disse fødselsdatoformatene finnes allerede i Spesifikke begreper.',
          addedBirthdateFormats: ({ addedCount }) => `La til ${addedCount} fødselsdatoformat${addedCount === 1 ? '' : 'er'} i Spesifikke begreper.`,
          clipboardNoImage: 'Fant ikke noe bilde i utklippstavlen. Bruk Windows + Shift + S først, og prøv igjen.',
          loadedImage: ({ fileName }) => `Bilde lastet inn: ${fileName}`,
          imageCleared: 'Bildet ble tømt.',
          rawTextEmpty: 'Råtekstfeltet er tomt.',
          rawTextCopied: 'Råtekst kopiert til utklippstavlen.',
          rawTextCopyFailed: 'Kunne ikke kopiere råtekst i denne nettleserfanen.',
          rawTextCleared: 'Råtekst tømt.',
          pasteFromClipboardHint: 'Lim inn fra utklippstavlen med Ctrl + V, eller bruk knappen Lim inn bilde.',
        },
      },
    };

    const getRedactorLanguage = () => {
      const langSelect = document.getElementById('lang-select-transcribe');
      const lang = (langSelect && langSelect.value) || localStorage.getItem('siteLanguage') || 'en';
      return lang === 'no' ? 'no' : 'en';
    };

    const getRedactorStrings = () => REDACTOR_STRINGS[getRedactorLanguage()] || REDACTOR_STRINGS.en;

    const getRedactorMessage = (key, params = {}) => {
      const message = getRedactorStrings().messages?.[key];
      if (typeof message === 'function') return message(params);
      return message || '';
    };

    const applyRedactorTranslations = () => {
      const strings = getRedactorStrings();
      const isOpen = Boolean(!redactorPane?.hidden);

      if (toggleRedactorButton) {
        toggleRedactorButton.textContent = isOpen ? strings.hideRedactor : strings.showRedactor;
      }
      if (document.getElementById('redactorTitle')) {
        document.getElementById('redactorTitle').textContent = strings.title;
      }
      if (document.getElementById('redactorHelp')) {
        document.getElementById('redactorHelp').textContent = strings.help;
      }
      if (document.getElementById('redactorOcrSectionTitle')) {
        document.getElementById('redactorOcrSectionTitle').textContent = strings.ocrSectionTitle;
      }
      if (document.getElementById('redactorOcrMiniHelp')) {
        document.getElementById('redactorOcrMiniHelp').innerHTML = strings.ocrMiniHelpHtml;
      }
      if (pasteRedactorImageButton) {
        pasteRedactorImageButton.textContent = strings.pasteImage;
      }
      if (document.getElementById('redactorImageUploadLabelText')) {
        document.getElementById('redactorImageUploadLabelText').textContent = strings.uploadImage;
      }
      if (clearRedactorImageButton) {
        clearRedactorImageButton.textContent = strings.clearImage;
      }
      if (fetchRedactorImageTextButton && !fetchRedactorImageTextButton.disabled) {
        fetchRedactorImageTextButton.textContent = strings.fetchOcrSpecific;
      }
      if (fetchRedactorRawTextButton && !fetchRedactorRawTextButton.disabled) {
        fetchRedactorRawTextButton.textContent = strings.fetchOcrRaw;
      }
      if (redactorImageFrame) {
        redactorImageFrame.setAttribute('aria-label', strings.imageFrameAriaLabel);
      }
      if (redactorImagePreview) {
        redactorImagePreview.alt = strings.imagePreviewAlt;
      }
      if (redactorImagePlaceholder) {
        redactorImagePlaceholder.textContent = strings.imagePlaceholder;
      }
      if (document.getElementById('redactorGeneralTermsLabel')) {
        document.getElementById('redactorGeneralTermsLabel').textContent = strings.generalTermsLabel;
      }
      if (generalTermsEl) {
        generalTermsEl.placeholder = strings.generalTermsPlaceholder;
      }
      if (uploadGeneralTermsButton) {
        uploadGeneralTermsButton.textContent = strings.importGeneral;
      }
      if (exportGeneralTermsButton) {
        exportGeneralTermsButton.textContent = strings.exportGeneral;
      }
      if (clearGeneralTermsButton) {
        clearGeneralTermsButton.textContent = strings.clearGeneral;
      }
      if (document.getElementById('redactorSpecificTermsLabel')) {
        document.getElementById('redactorSpecificTermsLabel').textContent = strings.specificTermsLabel;
      }
      if (redactorTermsEl) {
        redactorTermsEl.placeholder = strings.specificTermsPlaceholder;
      }
      if (clearRedactorButton) {
        clearRedactorButton.textContent = strings.clearSpecific;
      }
      if (applyRedactionButton) {
        applyRedactionButton.textContent = strings.redact;
      }
      if (document.getElementById('redactorOcrRawOutputLabel')) {
        document.getElementById('redactorOcrRawOutputLabel').textContent = strings.rawOutputLabel;
      }
      if (ocrRawOutputEl) {
        ocrRawOutputEl.placeholder = strings.rawOutputPlaceholder;
      }
      if (copyRedactorRawOutputButton) {
        copyRedactorRawOutputButton.textContent = strings.copyRaw;
      }
      if (clearRedactorRawOutputButton) {
        clearRedactorRawOutputButton.textContent = strings.clearRaw;
      }
      if (document.getElementById('redactorBirthdateLabel')) {
        document.getElementById('redactorBirthdateLabel').textContent = strings.birthdateLabel;
      }
      if (birthdateInputEl) {
        birthdateInputEl.placeholder = strings.birthdatePlaceholder;
      }
      if (addBirthdateFormatsButton) {
        addBirthdateFormatsButton.textContent = strings.addDates;
      }

      if (typeof refreshRedactorStatusText === 'function') {
        refreshRedactorStatusText();
      }
    };

    const redactorLangSelect = document.getElementById('lang-select-transcribe');
    if (redactorLangSelect) {
      redactorLangSelect.addEventListener('change', () => {
        requestAnimationFrame(() => {
          applyRedactorTranslations();
        });
      });
    }


    captureDefaultHeight(transcriptionEl);
    captureDefaultHeight(supplementaryInfoEl);
    captureDefaultHeight(generalTermsEl);
    captureDefaultHeight(redactorTermsEl);
    captureDefaultHeight(ocrRawOutputEl);

    const REDACTOR_VISIBILITY_KEY = 'redactor_visible';
    const REDACTOR_SESSION_KEYS = {
      general: 'redactor_general_terms_session',
      specific: 'redactor_specific_terms_session',
      rawOutput: 'redactor_ocr_raw_output_session',
      birthdate: 'redactor_birthdate_session',
    };

    let currentOcrImageBlob = null;
    let currentOcrImageObjectUrl = '';

    const normalizeNewlines = (value) => (value || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    const readSessionValue = (key, fallback = '') => {
      try {
        const value = sessionStorage.getItem(key);
        return value === null ? fallback : value;
      } catch (_) {
        return fallback;
      }
    };

    const writeSessionValue = (key, value) => {
      try {
        sessionStorage.setItem(key, value);
      } catch (_) {}
    };

    const setRedactorStatus = (message, isError = false, { statusKey = '', statusParams = null } = {}) => {
      if (!redactorStatus) return;
      redactorStatus.textContent = message || '';
      redactorStatus.classList.toggle('is-error', Boolean(isError));

      if (statusKey) {
        redactorStatus.dataset.statusKey = statusKey;
        redactorStatus.dataset.statusParams = JSON.stringify(statusParams || {});
      } else {
        delete redactorStatus.dataset.statusKey;
        delete redactorStatus.dataset.statusParams;
      }
    };

    const setRedactorStatusByKey = (statusKey, statusParams = {}, isError = false) => {
      setRedactorStatus(getRedactorMessage(statusKey, statusParams), isError, { statusKey, statusParams });
    };

    const refreshRedactorStatusText = () => {
      if (!redactorStatus?.dataset?.statusKey) return;

      let statusParams = {};
      try {
        statusParams = JSON.parse(redactorStatus.dataset.statusParams || '{}');
      } catch (_) {
        statusParams = {};
      }

      setRedactorStatus(
        getRedactorMessage(redactorStatus.dataset.statusKey, statusParams),
        redactorStatus.classList.contains('is-error'),
        {
          statusKey: redactorStatus.dataset.statusKey,
          statusParams,
        }
      );
    };

    const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const getLines = (value) => normalizeNewlines(value)
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    const collapseInternalSpacesInNumericToken = (tok) => /^(?:\d+\s+)+\d+$/.test(tok)
      ? tok.replace(/\s+/g, '')
      : tok;

    const collapseInternalSpacesInAlphaToken = (tok) => /^(?:[A-Za-zÆØÅæøå\-]+\s+)+[A-Za-zÆØÅæøå\-]+$/.test(tok)
      ? tok.replace(/\s+/g, '')
      : tok;

    const stripEdgePunct = (tok) => tok.replace(/^[()\[\]{}.,;:]+|[()\[\]{}.,;:]+$/g, '');

    const splitFnrToken = (tok) => /^\d{11}$/.test(tok)
      ? [tok.slice(0, 6), tok.slice(6)]
      : [tok];

    const isWordOnlyRedactionTerm = (term) => /^[\p{L}]+(?:[ -][\p{L}]+)*$/u.test((term || '').trim());

    const normalizeSpecificKey = (s) => (s || '')
      .normalize('NFKC')
      .replace(/\u00A0/g, ' ')
      .replace(/\u00AD/g, '')
      .replace(/[\u200B\u200C\u200D\u2060]/g, '')
      .replace(/[\u2010\u2011\u2012\u2013\u2014\u2212\u2043\uFE58\uFE63\uFF0D]/g, '-')
      .replace(/\s+/g, ' ')
      .trim()
      .toLocaleLowerCase();

    const dedupeSpecificLines = (text) => {
      const seen = new Set();
      const out = [];
      for (const raw of normalizeNewlines(text).split('\n')) {
        const line = raw.trim();
        if (!line) continue;
        const key = normalizeSpecificKey(line);
        if (!key || seen.has(key)) continue;
        seen.add(key);
        out.push(line);
      }
      return out.join('\n');
    };

    const ensurePhoneVariants = (text) => {
      const lines = normalizeNewlines(text).split('\n');
      const seen = new Set();
      const out = [];

      const addLine = (value) => {
        const line = (value || '').trim();
        if (!line) return;
        const key = line.toLocaleLowerCase();
        if (seen.has(key)) return;
        seen.add(key);
        out.push(line);
      };

      for (const raw of lines) {
        const line = raw.trim();
        if (!line) continue;
        addLine(line);

        const digits = (line.match(/\d/g) || []).join('');
        if (/^\d{8}$/.test(line)) {
          addLine(line.replace(/(\d{2})(?=\d)/g, '$1 ').trim());
          addLine(`+47${line}`);
          continue;
        }

        if (/^\+47\d{8}$/.test(line)) {
          const local = line.slice(3);
          addLine(local);
          addLine(local.replace(/(\d{2})(?=\d)/g, '$1 ').trim());
          continue;
        }

        if (digits.length === 10 && digits.startsWith('47')) {
          const local = digits.slice(-8);
          addLine(local);
          addLine(local.replace(/(\d{2})(?=\d)/g, '$1 ').trim());
          addLine(`+47${local}`);
        }
      }

      return out.join('\n');
    };

    const postprocessSpecificTerms = (block) => {
      const lines = getLines(block);
      const out = [];
      let i = 0;

      while (i < lines.length) {
        const s = lines[i];

        if (/^\d{1,3}\s*(?:år|ar)$/i.test(s)) {
          i += 1;
          continue;
        }

        if (/^(?:år|ar|moss|familie|Vei|Forelder|Telefonnummer|Moss|Bam|Barn|foreldre|ektefelle|tlf|ikke|funnet)$/i.test(s)) {
          if (/^(?:år|ar)$/i.test(s) && out.length && /^\d{1,3}$/.test(out[out.length - 1])) {
            out.pop();
          }
          i += 1;
          continue;
        }

        if (/^\d{2}$/.test(s)) {
          i += 1;
          continue;
        }

        let m = s.match(/^(?:tlf|tif|ti|Telefonnummer|telefon|mobil)\s*[.:\-]?\s*(?:\+?\s*47)?\s*([0-9][0-9\s\-]{7,})$/i);
        if (m) {
          const digits = (m[1].match(/\d/g) || []).join('');
          if (digits.length >= 8) {
            const local = digits.slice(-8);
            out.push(local);
            out.push(`+47${local}`);
            i += 1;
            continue;
          }
        }

        if (/^(?:tlf|tif|ti|telefon|mobil)\.?:?$/i.test(s) && i + 1 < lines.length) {
          const nxt = lines[i + 1];
          const digits = (nxt.match(/\d/g) || []).join('');
          if (digits.startsWith('47') && digits.length >= 10) {
            const local = digits.slice(-8);
            out.push(local);
            out.push(`+47${local}`);
            i += 2;
            continue;
          }
          if (digits.length === 8) {
            out.push(digits);
            out.push(`+47${digits}`);
            i += 2;
            continue;
          }
        }

        out.push(s);
        i += 1;
      }

      return out.join('\n');
    };

    const cleanSpecificBlock = (text) => {
      let cleaned = postprocessSpecificTerms(text || '');
      cleaned = ensurePhoneVariants(cleaned);
      cleaned = dedupeSpecificLines(cleaned);
      return cleaned;
    };

    const extractBirthdateFromFnrText = (text) => {
      const s = normalizeNewlines(text || '');

      let m = s.match(/(?:^|[^\d])(\d{6})\s*(?:\n|\s)?\s*(\d{5})(?!\d)/);
      if (m) return m[1];

      m = s.match(/(?:^|[^\d])(\d{11})(?!\d)/);
      if (m) return m[1].slice(0, 6);

      return '';
    };

    const ocrPostprocess = (input, {
      convertAt = false,
      dropCommasStack = true,
      splitTokensNewlines = true,
      splitFnr65 = true,
      merge323Numbers = true,
    } = {}) => {
      let s = normalizeNewlines(input);

      if (convertAt) {
        s = s.replace(/([A-Za-zÆØÅæøå0-9])@(?=[A-Za-zÆØÅæøå0-9])/g, '$1ø');
      }

      if (dropCommasStack) {
        s = s.replace(/,/g, '\n');
        s = s.replace(/[;|•]+/g, '\n');
      }

      if (merge323Numbers) {
        s = s.replace(/\b(\d{3})\s+(\d{2})\s+(\d{3})\b/g, '$1$2$3');
      }

      s = s.replace(/[ \t]+\n/g, '\n');
      s = s.replace(/\n[ \t]+/g, '\n');

      if (splitFnr65) {
        s = s.replace(/(^|[^\d])(\d{6})\s+(\d{5})(?!\d)/g, (_, lead, first, second) => `${lead}${first}\n${second}`);
      }

      s = s.replace(/\((\d+)\)/g, '\n$1\n');

      const linesOut = [];

      for (const rawLine of s.split('\n')) {
        let line = rawLine.trim();
        if (!line) continue;

        if (splitTokensNewlines) {
          let tokens = line.split(/\s+/)
            .map((token) => stripEdgePunct(token))
            .map((token) => collapseInternalSpacesInNumericToken(token))
            .map((token) => collapseInternalSpacesInAlphaToken(token))
            .filter(Boolean);

          if (splitFnr65) {
            tokens = tokens.flatMap((token) => splitFnrToken(token));
          }

          if (!tokens.length) continue;

          if (tokens.every((token) => /^[A-Za-zÆØÅæøå\-]+$/.test(token) || /^\d+$/.test(token))) {
            for (const token of tokens) {
              linesOut.push(token);
            }
            continue;
          }

          line = tokens.join(' ').trim();
        }

        if (!line) continue;
        if (splitFnr65 && /^\d{11}$/.test(line)) {
          const parts = splitFnrToken(line);
          for (const part of parts) {
            linesOut.push(part);
          }
          continue;
        }
        linesOut.push(line);
      }

      return linesOut
        .filter((line, index, arr) => arr.indexOf(line) === index)
        .join('\n')
        .replace(/\n{2,}/g, '\n')
        .trim();
    };

    const persistRedactorTextState = () => {
      if (generalTermsEl) writeSessionValue(REDACTOR_SESSION_KEYS.general, normalizeNewlines(generalTermsEl.value));
      if (redactorTermsEl) writeSessionValue(REDACTOR_SESSION_KEYS.specific, normalizeNewlines(redactorTermsEl.value));
      if (ocrRawOutputEl) writeSessionValue(REDACTOR_SESSION_KEYS.rawOutput, normalizeNewlines(ocrRawOutputEl.value));
      if (birthdateInputEl) writeSessionValue(REDACTOR_SESSION_KEYS.birthdate, birthdateInputEl.value || '');
    };

    const clearSessionValue = (key) => {
      try {
        sessionStorage.removeItem(key);
      } catch (_) {}
    };

    if (generalTermsEl) generalTermsEl.value = readSessionValue(REDACTOR_SESSION_KEYS.general, generalTermsEl.value || '');
    if (redactorTermsEl) {
      redactorTermsEl.value = '';
      clearSessionValue(REDACTOR_SESSION_KEYS.specific);
    }
    if (ocrRawOutputEl) {
      ocrRawOutputEl.value = '';
      clearSessionValue(REDACTOR_SESSION_KEYS.rawOutput);
    }
    if (birthdateInputEl) {
      birthdateInputEl.value = '';
      clearSessionValue(REDACTOR_SESSION_KEYS.birthdate);
    }

    [generalTermsEl, redactorTermsEl, ocrRawOutputEl, birthdateInputEl].forEach((el) => {
      if (!el) return;
      el.addEventListener('input', persistRedactorTextState);
    });

    if (redactorTermsEl) {
      let cleanSpecificTimer = null;

      redactorTermsEl.addEventListener('blur', () => {
        const cleaned = cleanSpecificBlock(redactorTermsEl.value || '');
        if (cleaned !== (redactorTermsEl.value || '')) {
          redactorTermsEl.value = cleaned;
          persistRedactorTextState();
          setRedactorStatusByKey('specificTermsNormalized');
        }
      });

      redactorTermsEl.addEventListener('paste', () => {
        clearTimeout(cleanSpecificTimer);
        cleanSpecificTimer = setTimeout(() => {
          const cleaned = cleanSpecificBlock(redactorTermsEl.value || '');
          if (cleaned !== (redactorTermsEl.value || '')) {
            redactorTermsEl.value = cleaned;
            persistRedactorTextState();
          }
        }, 50);
      });
    }

    const appendUniqueLines = (textarea, text) => {
      if (!textarea) return 0;
      const currentLines = getLines(textarea.value);
      const currentSet = new Set(currentLines.map((line) => line.toLocaleLowerCase()));
      const additions = getLines(text).filter((line) => {
        const key = line.toLocaleLowerCase();
        if (currentSet.has(key)) return false;
        currentSet.add(key);
        return true;
      });

      if (!additions.length) return 0;

      textarea.value = currentLines.length
        ? `${currentLines.join('\n')}\n${additions.join('\n')}`
        : additions.join('\n');

      persistRedactorTextState();
      return additions.length;
    };

    // Built-in rule: a Norwegian fødselsnummer is always redacted,
    // even if the user has not listed it explicitly. Two accepted
    // formats:
    //   - 11 digits, no separator:        12345678901
    //   - 6 digits + ONE space + 5:       123456 78901
    // The match must be bounded by non-word characters on both sides
    // ((?<![\w]) / (?![\w]) — \w is [A-Za-z0-9_] in JS), so:
    //   - 12+ contiguous digits do not match (no digit boundary)
    //   - letters glued to either end do not match (no letter boundary)
    //   - other separators (tab, double-space, dot) do not match the
    //     spaced form — only a single literal space.
    const ELEVEN_DIGIT_PATTERN = /(?<![\w])(?:\d{6} \d{5}|\d{11})(?![\w])/g;

    const redactInText = (text, terms) => {
      let output = text || '';
      let replacedAny = false;

      // Apply built-in 11-digit rule first.
      const updatedDigits = output.replace(ELEVEN_DIGIT_PATTERN, '[REDACTED]');
      if (updatedDigits !== output) {
        replacedAny = true;
        output = updatedDigits;
      }

      for (const term of terms) {
        const escaped = escapeRegex(term);
        const pattern = isWordOnlyRedactionTerm(term)
          ? new RegExp(`(?<![\\p{L}\\p{N}_])${escaped}(?![\\p{L}\\p{N}_])`, 'giu')
          : new RegExp(escaped, 'gi');
        const updated = output.replace(pattern, '[REDACTED]');
        if (updated !== output) {
          replacedAny = true;
          output = updated;
        }
      }

      return { text: output, replacedAny };
    };

    const getRedactorTerms = () => {
      const unique = new Set();
      return [...getLines(generalTermsEl?.value || ''), ...getLines(redactorTermsEl?.value || '')]
        .sort((a, b) => b.length - a.length)
        .filter((term) => {
          const normalizedTerm = term.toLocaleLowerCase();
          if (unique.has(normalizedTerm)) return false;
          unique.add(normalizedTerm);
          return true;
        });
    };

    const revokeCurrentImageUrl = () => {
      if (!currentOcrImageObjectUrl) return;
      try {
        URL.revokeObjectURL(currentOcrImageObjectUrl);
      } catch (_) {}
      currentOcrImageObjectUrl = '';
    };

    const setOcrImage = (blob) => {
      if (!redactorImagePreview || !redactorImagePlaceholder) return;
      revokeCurrentImageUrl();
      currentOcrImageBlob = blob || null;

      if (!blob) {
        redactorImagePreview.hidden = true;
        redactorImagePreview.removeAttribute('src');
        redactorImagePlaceholder.hidden = false;
        return;
      }

      currentOcrImageObjectUrl = URL.createObjectURL(blob);
      redactorImagePreview.src = currentOcrImageObjectUrl;
      redactorImagePreview.hidden = false;
      redactorImagePlaceholder.hidden = true;
    };

    const setRedactorOpen = (isOpen, { persist = true } = {}) => {
      if (!supplementaryRedactorLayout || !redactorPane || !toggleRedactorButton) return;

      supplementaryRedactorLayout.classList.toggle('redactor-open', Boolean(isOpen));
      redactorPane.hidden = !isOpen;
      redactorPane.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
      toggleRedactorButton.textContent = isOpen ? getRedactorStrings().hideRedactor : getRedactorStrings().showRedactor;
      toggleRedactorButton.setAttribute('aria-expanded', isOpen ? 'true' : 'false');

      if (persist) {
        try {
          localStorage.setItem(REDACTOR_VISIBILITY_KEY, isOpen ? '1' : '0');
        } catch (_) {}
      }
    };

    (() => {
      let shouldOpen = false;
      try {
        shouldOpen = localStorage.getItem(REDACTOR_VISIBILITY_KEY) === '1';
      } catch (_) {}
      setRedactorOpen(shouldOpen, { persist: false });
    })();

    applyRedactorTranslations();

    const exportTextFile = async (filename, content) => {
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });

      if (window.showSaveFilePicker) {
        const fileHandle = await window.showSaveFilePicker({
          suggestedName: filename,
          types: [
            {
              description: 'Text files',
              accept: { 'text/plain': ['.txt'] },
            },
          ],
        });

        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();
        return { method: 'picker' };
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 0);
      return { method: 'download' };
    };

    const readTextFile = async (file) => {
      if (!file) return '';
      return file.text();
    };

    const expandBirthdateFormats = (value) => {
      const digits = (value || '').replace(/\D/g, '');
      if (digits.length !== 6 && digits.length !== 8) return [];

      const dd = digits.slice(0, 2);
      const mm = digits.slice(2, 4);
      const yyOrYyyy = digits.slice(4);

      const ddNum = Number(dd);
      const mmNum = Number(mm);
      if (!ddNum || ddNum > 31 || !mmNum || mmNum > 12) return [];

      let yyyy = '';
      let yy = '';

      if (digits.length === 6) {
        yy = yyOrYyyy;
        const currentTwoDigitYear = new Date().getFullYear() % 100;
        const fullYear = Number(yy) > currentTwoDigitYear ? 1900 + Number(yy) : 2000 + Number(yy);
        yyyy = String(fullYear);
      } else {
        yyyy = yyOrYyyy;
        yy = yyyy.slice(-2);
      }

      const d = String(ddNum);
      const m = String(mmNum);

      const monthNamesNo = [
        'januar', 'februar', 'mars', 'april', 'mai', 'juni',
        'juli', 'august', 'september', 'oktober', 'november', 'desember',
      ];
      const weekdayNamesNo = [
        'søndag', 'mandag', 'tirsdag', 'onsdag', 'torsdag', 'fredag', 'lørdag',
      ];
      const monthName = monthNamesNo[mmNum - 1];

      const variants = [
        `${dd}${mm}${yy}`,
        `${dd}${mm}${yyyy}`,
        `${dd}.${mm}.${yy}`,
        `${dd}-${mm}-${yy}`,
        `${dd}/${mm}/${yy}`,
        `${dd} ${mm} ${yy}`,
        `${d}.${m}.${yy}`,
        `${d}-${m}-${yy}`,
        `${d}/${m}/${yy}`,
        `${d} ${m} ${yy}`,
        `${dd}.${mm}.${yyyy}`,
        `${dd}-${mm}-${yyyy}`,
        `${dd}/${mm}/${yyyy}`,
        `${dd} ${mm} ${yyyy}`,
        `${d}.${m}.${yyyy}`,
        `${d}-${m}-${yyyy}`,
        `${d}/${m}/${yyyy}`,
        `${d} ${m} ${yyyy}`,
      ];

      if (monthName) {
        variants.push(
          `${dd}. ${monthName} ${yyyy}`,
          `${d}. ${monthName} ${yyyy}`,
          `${dd} ${monthName} ${yyyy}`,
          `${d} ${monthName} ${yyyy}`,
        );

        const dateObj = new Date(Number(yyyy), mmNum - 1, ddNum);
        if (!Number.isNaN(dateObj.getTime())
          && dateObj.getFullYear() === Number(yyyy)
          && dateObj.getMonth() === mmNum - 1
          && dateObj.getDate() === ddNum) {
          const weekday = weekdayNamesNo[dateObj.getDay()];
          if (weekday) {
            variants.push(
              `${weekday} ${dd}. ${monthName} ${yyyy}`,
              `${weekday} ${d}. ${monthName} ${yyyy}`,
              `${weekday} ${dd} ${monthName} ${yyyy}`,
              `${weekday} ${d} ${monthName} ${yyyy}`,
            );
          }
        }
      }

      return [...new Set(variants)];
    };

    const readClipboardImage = async () => {
      if (!navigator.clipboard || typeof navigator.clipboard.read !== 'function') {
        throw new Error('Clipboard image reading is not available in this browser. Use Ctrl + V in the image frame or upload an image instead.');
      }

      const items = await navigator.clipboard.read();
      for (const item of items) {
        const imageType = item.types.find((type) => type.startsWith('image/'));
        if (imageType) {
          return item.getType(imageType);
        }
      }

      return null;
    };

    const handleImagePasteEvent = (event) => {
      const items = Array.from(event.clipboardData?.items || []);
      const imageItem = items.find((item) => item.type && item.type.startsWith('image/'));
      if (!imageItem) return false;

      const file = imageItem.getAsFile();
      if (!file) return false;

      event.preventDefault();
      setOcrImage(file);
      setRedactorStatusByKey('imagePastedReady');
      return true;
    };

    const runTesseractOnCurrentImage = async ({ logger } = {}) => {
      let recognizedText = '';
      let usedLanguage = 'nor+eng';

      try {
        const result = await window.Tesseract.recognize(currentOcrImageBlob, 'nor+eng', { logger });
        recognizedText = result?.data?.text || '';
      } catch (primaryError) {
        const fallback = await window.Tesseract.recognize(currentOcrImageBlob, 'eng', { logger });
        recognizedText = fallback?.data?.text || '';
        usedLanguage = 'eng';
      }

      recognizedText = normalizeNewlines(recognizedText).trim();
      return { recognizedText, usedLanguage };
    };

    const setRawOcrOutput = (text) => {
      if (!ocrRawOutputEl) return;
      ocrRawOutputEl.value = normalizeNewlines(text || '').trim();
      persistRedactorTextState();
    };

    const runRawOcrOnCurrentImage = async () => {
      if (!currentOcrImageBlob) {
        setRedactorStatusByKey('noImageForOcr', {}, true);
        return;
      }

      if (!window.Tesseract) {
        setRedactorStatusByKey('tesseractLoadFailed', {}, true);
        return;
      }

      const logger = (message) => {
        if (!message || !message.status) return;
        if (message.status === 'recognizing text' && typeof message.progress === 'number') {
          setRedactorStatusByKey('ocrRunning', { progress: Math.round(message.progress * 100) });
          return;
        }
        if (message.status === 'loading language traineddata') {
          setRedactorStatusByKey('ocrLoadingLanguageData');
          return;
        }
        if (message.status === 'initializing tesseract') {
          setRedactorStatusByKey('ocrStarting');
        }
      };

      const originalLabel = fetchRedactorRawTextButton?.textContent || getRedactorStrings().fetchOcrRaw;
      if (fetchRedactorRawTextButton) {
        fetchRedactorRawTextButton.disabled = true;
        fetchRedactorRawTextButton.textContent = getRedactorStrings().fetching;
      }

      try {
        const { recognizedText, usedLanguage } = await runTesseractOnCurrentImage({ logger });

        if (!recognizedText) {
          setRedactorStatusByKey('noTextDetected', {}, true);
          return;
        }

        setRawOcrOutput(recognizedText);
        setRedactorStatusByKey('rawOcrComplete', { usedLanguage });
      } catch (error) {
        setRedactorStatusByKey('ocrError', { errorMessage: error?.message || error }, true);
      } finally {
        if (fetchRedactorRawTextButton) {
          fetchRedactorRawTextButton.disabled = false;
          fetchRedactorRawTextButton.textContent = originalLabel;
        }
      }
    };

    const runOcrOnCurrentImage = async () => {
      if (!currentOcrImageBlob) {
        setRedactorStatusByKey('noImageForOcr', {}, true);
        return;
      }

      if (!window.Tesseract) {
        setRedactorStatusByKey('tesseractLoadFailed', {}, true);
        return;
      }

      const logger = (message) => {
        if (!message || !message.status) return;
        if (message.status === 'recognizing text' && typeof message.progress === 'number') {
          setRedactorStatusByKey('ocrRunning', { progress: Math.round(message.progress * 100) });
          return;
        }
        if (message.status === 'loading language traineddata') {
          setRedactorStatusByKey('ocrLoadingLanguageData');
          return;
        }
        if (message.status === 'initializing tesseract') {
          setRedactorStatusByKey('ocrStarting');
        }
      };

      const originalLabel = fetchRedactorImageTextButton?.textContent || getRedactorStrings().fetchOcrSpecific;
      if (fetchRedactorImageTextButton) {
        fetchRedactorImageTextButton.disabled = true;
        fetchRedactorImageTextButton.textContent = getRedactorStrings().fetching;
      }

      try {
        const { recognizedText, usedLanguage } = await runTesseractOnCurrentImage({ logger });

        if (!recognizedText) {
          setRedactorStatusByKey('noTextDetected', {}, true);
          return;
        }

        const finalText = ocrPostprocess(recognizedText, {
          convertAt: false,
          dropCommasStack: true,
          splitTokensNewlines: true,
          splitFnr65: true,
          merge323Numbers: true,
        });

        if (!finalText.trim()) {
          setRedactorStatusByKey('noSpecificTermsProduced', {}, true);
          return;
        }

        const currentSpecific = redactorTermsEl?.value || '';
        const mergedSpecific = cleanSpecificBlock(
          currentSpecific
            ? `${currentSpecific}\n${finalText}`
            : finalText
        );

        const beforeCount = getLines(currentSpecific).length;
        const afterCount = getLines(mergedSpecific).length;

        if (redactorTermsEl) {
          redactorTermsEl.value = mergedSpecific;
          persistRedactorTextState();
        }

        const detectedBirthdate = extractBirthdateFromFnrText(finalText || recognizedText);
        if (detectedBirthdate && birthdateInputEl) {
          birthdateInputEl.value = detectedBirthdate;
          persistRedactorTextState();
        }

        const addedCount = Math.max(0, afterCount - beforeCount);
        if (!addedCount) {
          setRedactorStatusByKey('noNewUniqueTerms', { usedLanguage });
          return;
        }

        setRedactorStatusByKey(
          detectedBirthdate ? 'ocrCompleteAddedSpecificBirthdate' : 'ocrCompleteAddedSpecific',
          detectedBirthdate ? { usedLanguage, addedCount, detectedBirthdate } : { usedLanguage, addedCount }
        );
      } catch (error) {
        setRedactorStatusByKey('ocrError', { errorMessage: error?.message || error }, true);
      } finally {
        if (fetchRedactorImageTextButton) {
          fetchRedactorImageTextButton.disabled = false;
          fetchRedactorImageTextButton.textContent = originalLabel;
        }
      }
    };


    if (toggleRedactorButton) {
      toggleRedactorButton.addEventListener('click', () => {
        const isOpen = !supplementaryRedactorLayout?.classList.contains('redactor-open');
        setRedactorOpen(isOpen);
        setRedactorStatus('');
        if (isOpen) {
          redactorTermsEl?.focus();
        }
      });
    }

    // Clear button logic for supplementary field
    const clearSupplementaryButton = document.getElementById('clearSupplementaryButton');
    if (clearSupplementaryButton) {
      clearSupplementaryButton.addEventListener('click', () => {
        if (supplementaryInfoEl) {
          resetTextareaToDefault(supplementaryInfoEl);
        }
      });
    }

    if (clearGeneralTermsButton) {
      clearGeneralTermsButton.addEventListener('click', () => {
        if (generalTermsEl) {
          resetTextareaToDefault(generalTermsEl);
          persistRedactorTextState();
        }
        setRedactorStatusByKey('generalTermsCleared');
      });
    }

    if (clearRedactorButton) {
      clearRedactorButton.addEventListener('click', () => {
        if (redactorTermsEl) {
          resetTextareaToDefault(redactorTermsEl);
        }
        if (birthdateInputEl) {
          birthdateInputEl.value = '';
        }
        persistRedactorTextState();
        setRedactorStatusByKey('specificTermsCleared');
      });
    }

    if (uploadGeneralTermsButton && generalTermsFileInput) {
      uploadGeneralTermsButton.addEventListener('click', () => {
        generalTermsFileInput.click();
      });
    }

    if (generalTermsFileInput) {
      generalTermsFileInput.addEventListener('change', async () => {
        const file = generalTermsFileInput.files && generalTermsFileInput.files[0];
        if (!file) return;

        try {
          const text = await readTextFile(file);
          if (generalTermsEl) {
            generalTermsEl.value = normalizeNewlines(text).trim();
            persistRedactorTextState();
          }
          setRedactorStatusByKey('loadedGeneralFile', { fileName: file.name });
        } catch (error) {
          setRedactorStatusByKey('couldNotReadFile', { fileName: file.name, errorMessage: error?.message || error }, true);
        } finally {
          generalTermsFileInput.value = '';
        }
      });
    }

    if (exportGeneralTermsButton) {
      exportGeneralTermsButton.addEventListener('click', async () => {
        const content = normalizeNewlines(generalTermsEl?.value || '').trim();

        try {
          const result = await exportTextFile('General.txt', content);
          if (result?.method === 'picker') {
            setRedactorStatusByKey('savedGeneralSelectedLocation');
          } else {
            setRedactorStatusByKey('savedGeneralDownloadFlow');
          }
        } catch (error) {
          if (error && error.name === 'AbortError') {
            setRedactorStatusByKey('saveCanceled');
            return;
          }
          setRedactorStatusByKey('couldNotExportGeneral', { errorMessage: error?.message || error }, true);
        }
      });
    }

    if (downloadTranscriptButton) {
      downloadTranscriptButton.addEventListener('click', async () => {
        const content = transcriptionEl?.value || '';
        if (!content.trim()) {
          setRedactorStatusByKey('noMatchingText', {}, true);
          return;
        }
        try {
          await exportTextFile('Redacted.txt', content);
        } catch (error) {
          if (error && error.name === 'AbortError') return;
          console.warn('[redactor] download transcript failed', error);
        }
      });
    }

    if (applyRedactionButton) {
      applyRedactionButton.addEventListener('click', () => {
        const terms = getRedactorTerms();
        let replacedAny = false;

        if (transcriptionEl) {
          const result = redactInText(transcriptionEl.value || '', terms);
          transcriptionEl.value = result.text;
          replacedAny = replacedAny || result.replacedAny;
        }

        if (supplementaryInfoEl) {
          const result = redactInText(supplementaryInfoEl.value || '', terms);
          supplementaryInfoEl.value = result.text;
          replacedAny = replacedAny || result.replacedAny;
        }

        // If nothing matched AND the user supplied no terms, surface
        // the original "add at least one term" hint so they know why
        // nothing happened. If they did supply terms but nothing
        // matched, surface "no matching text" as before.
        if (!replacedAny && !terms.length) {
          setRedactorStatusByKey('addAtLeastOneTerm', {}, true);
          (redactorTermsEl || generalTermsEl)?.focus();
          return;
        }

        setRedactorStatusByKey(
          replacedAny ? 'redactedTerms' : 'noMatchingText',
          replacedAny ? { termCount: terms.length } : {}
        );
      });
    }

    if (addBirthdateFormatsButton) {
      addBirthdateFormatsButton.addEventListener('click', () => {
        const variants = expandBirthdateFormats(birthdateInputEl?.value || '');
        if (!variants.length) {
          setRedactorStatusByKey('invalidBirthdate', {}, true);
          birthdateInputEl?.focus();
          return;
        }

        const addedCount = appendUniqueLines(redactorTermsEl, variants.join('\n'));
        if (!addedCount) {
          setRedactorStatusByKey('birthdateAlreadyPresent');
          return;
        }

        setRedactorStatusByKey('addedBirthdateFormats', { addedCount });
      });
    }

    if (pasteRedactorImageButton) {
      pasteRedactorImageButton.addEventListener('click', async () => {
        try {
          const blob = await readClipboardImage();
          if (!blob) {
            setRedactorStatusByKey('clipboardNoImage', {}, true);
            return;
          }
          setOcrImage(blob);
          setRedactorStatusByKey('imagePastedReady');
        } catch (error) {
          setRedactorStatusByKey('clipboardReadImageFailed', { errorMessage: error?.message || 'Could not read an image from the clipboard.' }, true);
        }
      });
    }

    if (redactorImageUpload) {
      redactorImageUpload.addEventListener('change', () => {
        const file = redactorImageUpload.files && redactorImageUpload.files[0];
        if (!file) return;
        setOcrImage(file);
        setRedactorStatusByKey('loadedImage', { fileName: file.name });
        redactorImageUpload.value = '';
      });
    }

    if (clearRedactorImageButton) {
      clearRedactorImageButton.addEventListener('click', () => {
        setOcrImage(null);
        setRedactorStatusByKey('imageCleared');
      });
    }

    if (fetchRedactorImageTextButton) {
      fetchRedactorImageTextButton.addEventListener('click', runOcrOnCurrentImage);
    }

    if (fetchRedactorRawTextButton) {
      fetchRedactorRawTextButton.addEventListener('click', runRawOcrOnCurrentImage);
    }

    if (copyRedactorRawOutputButton) {
      copyRedactorRawOutputButton.addEventListener('click', async () => {
        const rawText = ocrRawOutputEl?.value || '';
        if (!rawText.trim()) {
          setRedactorStatusByKey('rawTextEmpty', {}, true);
          return;
        }
        try {
          await navigator.clipboard.writeText(rawText);
          setRedactorStatusByKey('rawTextCopied');
        } catch (error) {
          setRedactorStatusByKey('rawTextCopyFailed', {}, true);
        }
      });
    }

    if (clearRedactorRawOutputButton) {
      clearRedactorRawOutputButton.addEventListener('click', () => {
        if (!ocrRawOutputEl) return;
        resetTextareaToDefault(ocrRawOutputEl);
        persistRedactorTextState();
        setRedactorStatusByKey('rawTextCleared');
      });
    }

    if (redactorImageFrame) {
      redactorImageFrame.addEventListener('focusin', () => {
        redactorImageFrame.classList.add('is-focus');
      });
      redactorImageFrame.addEventListener('focusout', () => {
        redactorImageFrame.classList.remove('is-focus');
      });
      redactorImageFrame.addEventListener('paste', (event) => {
        if (handleImagePasteEvent(event)) {
          redactorImageFrame.focus();
        }
      });
      redactorImageFrame.addEventListener('click', () => {
        redactorImageFrame.focus();
      });
      redactorImageFrame.addEventListener('keydown', async (event) => {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'v') {
          setRedactorStatusByKey('pasteFromClipboardHint');
        }
      });
    }

    // Insert/update today's date at the TOP of supplementary field
    const insertSupplementaryDateButton = document.getElementById('insertSupplementaryDateButton');
    if (insertSupplementaryDateButton) {
      insertSupplementaryDateButton.addEventListener('click', () => {
        const supEl = document.getElementById('supplementaryInfo');
        if (!supEl) return;

        // Format: DD.MM.YYYY (Norwegian-friendly). Uses the browser's local timezone.
        const today = new Date();
        const dateStr = new Intl.DateTimeFormat('nb-NO', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }).format(today);
        const line = `Dagens dato er ${dateStr}`;

        const current = supEl.value || '';
        const normalized = current.replace(/\r\n/g, '\n');
        const lines = normalized.split('\n');

        if (lines[0]?.startsWith('Dagens dato er ')) {
          // Update existing date line (keeps the rest intact)
          lines[0] = line;
          supEl.value = lines.join('\n');
        } else {
          // Prepend date line
          supEl.value = normalized.trim().length ? `${line}\n${normalized}` : `${line}\n`;
        }

        supEl.focus();
        // Put cursor at end of first line (handy if they want to continue typing)
        const pos = line.length;
        try { supEl.setSelectionRange(pos, pos); } catch (_) {}
      });
    }


    // Auto-clear toggle (default OFF; persist in localStorage)
    const AUTO_CLEAR_KEY = 'auto_clear_supplementary';
    const autoClearToggle = document.getElementById('autoClearSupplementaryToggle');
    if (autoClearToggle) {
      const stored = localStorage.getItem(AUTO_CLEAR_KEY);
      autoClearToggle.checked = stored === '1';
      autoClearToggle.addEventListener('change', () => {
        localStorage.setItem(AUTO_CLEAR_KEY, autoClearToggle.checked ? '1' : '0');
      });
    }

    // When enabled: starting a new recording clears + resets Supplementary info (same as Clear button)
    document.addEventListener('click', (e) => {
      const id = e.target && e.target.id;
      if (id !== 'startButton') return;
      if (!autoClearToggle || autoClearToggle.checked !== true) return;
      if (supplementaryInfoEl) resetTextareaToDefault(supplementaryInfoEl);
    }, true);

    // Note Auto-clear toggle (default OFF; persist in localStorage)
    const AUTO_CLEAR_NOTE_KEY = 'auto_clear_note';
    const autoClearNoteToggle = document.getElementById('autoClearNoteToggle');
    const generatedNoteFieldEl = document.getElementById('generatedNote');
    if (autoClearNoteToggle) {
      const stored = localStorage.getItem(AUTO_CLEAR_NOTE_KEY);
      autoClearNoteToggle.checked = stored === '1';
      autoClearNoteToggle.addEventListener('change', () => {
        localStorage.setItem(AUTO_CLEAR_NOTE_KEY, autoClearNoteToggle.checked ? '1' : '0');
      });
    }

    // When enabled: starting a new recording clears + resets Generated note.
    document.addEventListener('click', (e) => {
      const id = e.target && e.target.id;
      if (id !== 'startButton') return;
      if (!autoClearNoteToggle || autoClearNoteToggle.checked !== true) return;
      if (generatedNoteFieldEl) resetTextareaToDefault(generatedNoteFieldEl);
    }, true);

  // Copy button logic for transcription field (matches Generated Note copy behavior)
  const copyTranscriptionButton = document.getElementById('copyTranscriptionButton');
  if (copyTranscriptionButton) {
    const originalLabel = copyTranscriptionButton.textContent;
    copyTranscriptionButton.addEventListener('click', async () => {
      const trEl = document.getElementById('transcription');
      const value = (trEl?.value || '').trim();
      if (!value) return;
      try {
        await navigator.clipboard.writeText(value);
        copyTranscriptionButton.textContent = 'Copied';
        setTimeout(() => { copyTranscriptionButton.textContent = originalLabel; }, 1200);
      } catch (err) {
        // Fallback for older browsers / blocked clipboard permissions
        try {
          trEl?.focus();
          trEl?.select();
          document.execCommand('copy');
          copyTranscriptionButton.textContent = 'Copied';
          setTimeout(() => { copyTranscriptionButton.textContent = originalLabel; }, 1200);
        } catch (_) {
          console.warn('Copy failed', err);
        } finally {
          try { window.getSelection()?.removeAllRanges?.(); } catch (_) {}
        }
      }
    });
  }
  // Clear button logic for transcription field
  const clearTranscriptionButton = document.getElementById('clearTranscriptionButton');
  if (clearTranscriptionButton) {
    clearTranscriptionButton.addEventListener('click', () => {
      const trEl = document.getElementById('transcription');
      if (trEl) {
        resetTextareaToDefault(trEl);
      }
    });
  }
  });

