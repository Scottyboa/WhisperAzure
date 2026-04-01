import { initTranscribeLanguage } from './languageLoaderUsage.js';
// Removed initConsentBanner import since it's no longer needed
// import { initConsentBanner } from './ui.js';

document.addEventListener('DOMContentLoaded', () => {
  // Initialize language support for the transcribe page.
  initTranscribeLanguage();

  // Simple UI state persistence helpers (used for provider switching & reload fallback).
  const stateKey = "__ui_state_v1";
  function saveState() {
    const grab = (id) => {
      const el = document.getElementById(id);
      if (!el) return null;
      return {
        value: el.value ?? "",
        selStart: el.selectionStart ?? null,
        selEnd: el.selectionEnd ?? null,
        scrollTop: el.scrollTop ?? 0
      };
    };
    const payload = {
      transcription: grab("transcription"),
      generatedNote: grab("generatedNote"),
      customPrompt:  grab("customPrompt"),
      ts: Date.now()
    };
    try { sessionStorage.setItem(stateKey, JSON.stringify(payload)); } catch {}
  }

  function restoreState() {
    let raw = null;
    try { raw = sessionStorage.getItem(stateKey); } catch {}
    if (!raw) return;
    try {
      const s = JSON.parse(raw);
      const put = (id, sObj) => {
        if (!sObj) return;
        const el = document.getElementById(id);
        if (!el) return;
        el.value = sObj.value || "";
        if (typeof sObj.scrollTop === "number") el.scrollTop = sObj.scrollTop;
        // Defer selection so the element is in DOM and sized
        setTimeout(() => {
          if (typeof sObj.selStart === "number" && typeof sObj.selEnd === "number") {
            try { el.setSelectionRange(sObj.selStart, sObj.selEnd); } catch {}
          }
        }, 0);
      };
      put("transcription", s.transcription);
      put("generatedNote", s.generatedNote);
      put("customPrompt",  s.customPrompt);
    } finally {
      try { sessionStorage.removeItem(stateKey); } catch {}
    }
  }

  function syncNoteActionButtons() {
    const generateNoteButton = document.getElementById('generateNoteButton');
    const abortNoteButton = document.getElementById('abortNoteButton');
    const busy = !!window.__app?.noteGenerationInFlight;
    if (generateNoteButton) {
      generateNoteButton.disabled = busy;
      generateNoteButton.title = busy ? 'A note is currently generating.' : '';
    }
    if (abortNoteButton) {
      abortNoteButton.disabled = !busy;
      abortNoteButton.title = busy ? '' : 'No active note generation to abort.';
    }
  }

  function beginNoteGeneration(meta = {}) {
    const app = (window.__app = window.__app || {});

    if (app.noteGenerationInFlight) {
      return null;
    }

    const controller = new AbortController();
    app.noteGenerationInFlight = true;
    app.noteGenerationAbortController = controller;
    app.noteGenerationMeta = meta || {};
    syncNoteActionButtons();
    return controller;
  }

  function finishNoteGeneration() {
    const app = (window.__app = window.__app || {});
    app.noteGenerationInFlight = false;
    app.noteGenerationAbortController = null;
    app.noteGenerationMeta = null;
    syncNoteActionButtons();
  }

  function abortNoteGeneration() {
    const app = (window.__app = window.__app || {});
    const controller = app.noteGenerationAbortController;
    if (controller) {
      try { controller.abort(); } catch (_) {}
    }
  }

  function buildFinishedNoteDetail(meta = {}) {
    const noteEl = document.getElementById('generatedNote');
    const text = String(noteEl?.value || '');
    return {
      status: meta?.aborted ? 'aborted' : 'success',
      text,
      textLength: text.length,
      autoCopyEnabled: localStorage.getItem('autoCopyFinishedNote') === 'true',
      emittedAt: Date.now(),
      ...meta,
    };
  }

  function emitNoteFinished(meta = {}) {
    try {
      const detail = buildFinishedNoteDetail(meta);
      window.dispatchEvent(new CustomEvent('note-generation-finished', { detail }));
      window.dispatchEvent(new CustomEvent('note:finished', { detail }));
      finishNoteGeneration();
      return detail;
    } catch (_) {
      finishNoteGeneration();
      return buildFinishedNoteDetail(meta);
    }
  }

  function resetNoteGenerationState() {
    finishNoteGeneration();
  }

  window.__app = window.__app || {};
  window.__app.saveState = saveState;
  window.__app.restoreState = restoreState;
  window.__app.noteGenerationInFlight = false;
  window.__app.noteGenerationAbortController = null;
  window.__app.noteGenerationMeta = null;
  window.__app.syncNoteActionButtons = syncNoteActionButtons;
  window.__app.beginNoteGeneration = beginNoteGeneration;
  window.__app.finishNoteGeneration = finishNoteGeneration;
  window.__app.abortNoteGeneration = abortNoteGeneration;
  window.__app.emitNoteFinished = emitNoteFinished;
  window.__app.resetNoteGenerationState = resetNoteGenerationState;
  window.__app.isNoteGenerationBusy = () => !!window.__app?.noteGenerationInFlight;

  const abortNoteButton = document.getElementById('abortNoteButton');
  if (abortNoteButton) {
    abortNoteButton.addEventListener('click', () => {
      abortNoteGeneration();
    });
  }

  window.addEventListener('note-generation-finished', () => {
    finishNoteGeneration();
  });

  syncNoteActionButtons();

  // True while the current recording/transcription session is still "in flight".
  // Used to decide whether provider changes must hard-reload to prevent stale async writes.
  window.__app.isTranscribeBusy = function isTranscribeBusy() {
    // Actively recording = Stop enabled
    const stopBtn = document.getElementById('stopButton');
    if (stopBtn && stopBtn.disabled === false) return true;

    const status = (document.getElementById('statusMessage')?.innerText || '').trim();
    if (!status) return false;

    // Post-stop window where async transcription chunks are still completing
    if (/finishing transcription/i.test(status)) return true;

    // Extra safety: treat generic "transcribing/processing/uploading" as busy
    if (/(transcribing|processing|uploading)/i.test(status) && !/transcription finished/i.test(status)) {
      return true;
    }

    return false;
  };

  // --- Auto-generate toggle (session-scoped) ---
  // Persist per-tab session: OFF by default.
  const AUTO_GENERATE_KEY = "auto_generate_enabled";

  window.__app.getAutoGenerateEnabled = function getAutoGenerateEnabled() {
    return sessionStorage.getItem(AUTO_GENERATE_KEY) === "1";
  };

  window.__app.setAutoGenerateEnabled = function setAutoGenerateEnabled(enabled) {
    sessionStorage.setItem(AUTO_GENERATE_KEY, enabled ? "1" : "0");
    // Keep UI in sync if checkbox exists
    const el = document.getElementById("autoGenerateToggle");
    if (el && el.type === "checkbox") el.checked = !!enabled;
  };

  window.__app.initAutoGenerateToggle = function initAutoGenerateToggle() {
    const el = document.getElementById("autoGenerateToggle");
    if (!el || el.type !== "checkbox") return;

    // Avoid double binding (provider switching can re-init scripts)
    if (el.dataset.bound === "1") return;
    el.dataset.bound = "1";

    // Default OFF for new sessions
    if (sessionStorage.getItem(AUTO_GENERATE_KEY) == null) {
      sessionStorage.setItem(AUTO_GENERATE_KEY, "0");
    }

    // Initialize UI from storage
    el.checked = window.__app.getAutoGenerateEnabled();

    // Persist changes
    el.addEventListener("change", () => {
      sessionStorage.setItem(AUTO_GENERATE_KEY, el.checked ? "1" : "0");
    });
  };

  // Canonical "transcription finished" signal.
  // STT providers may set status text; we convert that into an event for auto-generate and other hooks.
  // Emits: window event "transcription:finished" with minimal metadata.
  window.__app.emitTranscriptionFinished = function emitTranscriptionFinished(opts) {
    try {
      window.dispatchEvent(new CustomEvent("transcription:finished", { detail: opts || {} }));
    } catch (err) {
      // Older browsers may not support CustomEvent constructor without polyfill.
      try {
        const ev = document.createEvent("CustomEvent");
        ev.initCustomEvent("transcription:finished", false, false, opts || {});
        window.dispatchEvent(ev);
      } catch {}
    }
  };

  // --- Auto-generate listener (Step 5/6) ---
  window.__app.tryAutoGenerateNote = function tryAutoGenerateNote(eventDetail) {
    // Toggle must be ON
    if (!window.__app.getAutoGenerateEnabled?.()) return;

    const genBtn = document.getElementById("generateNoteButton");
    if (!genBtn || genBtn.disabled) return; // respect consent / provider readiness

    // Avoid generating on an empty transcript
    const transcript = (document.getElementById("transcription")?.value || "").trim();
    if (!transcript) return;

    // If app considers itself busy, don't chain generation (avoids races)
    if (typeof window.__app.isTranscribeBusy === "function" && window.__app.isTranscribeBusy()) {
      return;
    }

    // De-dupe: prevent double generation for repeated "finished" events
    const now = Date.now();
    const fp = `${eventDetail?.provider || "unknown"}:${eventDetail?.transcriptLength || transcript.length}`;
    const last = window.__app.__lastAutoGenerate || null;
    if (last && last.fp === fp && (now - last.at) < 2000) return;
    window.__app.__lastAutoGenerate = { fp, at: now };

    // Trigger the same path as manual generation
    if (genBtn) {
      if (window.__app?.isNoteGenerationBusy?.()) {
        return;
      }
      genBtn.click();
    }
  };

  window.__app.initAutoGenerateOnFinishListener = function initAutoGenerateOnFinishListener() {
    // Attach only once even if main.js runs init logic multiple times.
    if (window.__app.__autoGenerateListenerBound) return;
    window.__app.__autoGenerateListenerBound = true;

    window.addEventListener("transcription:finished", (e) => {
      try {
        window.__app.tryAutoGenerateNote?.(e && e.detail ? e.detail : null);
      } catch (err) {
        console.warn("Auto-generate failed", err);
      }
    });
  };

  // Restore any persisted state (e.g., after a fallback reload).
  restoreState();

  // Initialize session-scoped UI toggles.
  window.__app.initAutoGenerateToggle?.();
  window.__app.initAutoGenerateOnFinishListener?.();

  // Initialize the recording functionality dynamically by provider.
  (async function initRecordingByProvider() {
    let provider = (sessionStorage.getItem('transcribe_provider') || 'soniox').toLowerCase();
    // Back-compat: old stored value "soniox_dia" becomes "soniox" + speaker labels on
    if (provider === 'soniox_dia') {
      provider = 'soniox';
      sessionStorage.setItem('transcribe_provider', 'soniox');
      sessionStorage.setItem('soniox_speaker_labels', 'on');
    }
    try {
      function getSonioxPath() {
        const v = (sessionStorage.getItem('soniox_speaker_labels') || 'off').toLowerCase();
        return (v === 'on') ? './SONIOX_UPDATE_dia.js' : './SONIOX_UPDATE.js';
      }
      const path =
        provider === 'soniox'   ? getSonioxPath()          :
        provider === 'lemonfox' ? './LemonfoxSTT.js'       :
        provider === 'voxtral'  ? './VoxtralminiSTT.js'    :
        provider === 'openai'   ? './recording.js'         :
        provider === 'deepgram' ? './deepgram_nova3.js'    :
                                  './recording.js';
      console.info('[recording:init] provider:', provider, 'module:', path);
      const mod = await import(path);
      if (mod && typeof mod.initRecording === 'function') {
        mod.initRecording();
      } else {
        console.error('Selected recording module lacks initRecording()');
      }
    } catch (e) {
      console.error('Failed to load recording module for provider:', provider, e);
    }
  })();

  // Phase 3: Initialize note generation based on note_provider.
  (async function initNoteByProvider() {
    const choice = (sessionStorage.getItem('note_provider') || 'aws-bedrock').toLowerCase();
    // Map dropdown choice → module path (ALL note modules are in /js)
    const path =
      choice === 'gpt4'           ? './noteGeneration.js'          :
      choice === 'lemonfox'       ? './LemonfoxTXT.js'             :
      choice === 'mistral'        ? './MistralTXT.js'              :
      choice === 'gpt52'          ? './noteGeneration_gpt52.js'    :
      choice === 'gpt52-ns'       ? './noteGeneration_gpt52_NS.js' :
      choice === 'gpt54'          ? './noteGeneration_gpt54.js'    :
      choice === 'gpt5-ns'        ? './noteGeneration_gpt5_NS.js'  :
      choice === 'gemini3'        ? './Gemini3.js'                 :
      choice === 'gemini3-vertex' ? './GeminiVertex.js'            :
      choice === 'aws-bedrock'    ? './AWSBedrock.js'              :
                                    './notegeneration%20gpt-5.js'; // default

    try {
      const mod = await import(path);
      if (mod && typeof mod.initNoteGeneration === 'function') {
        mod.initNoteGeneration();
      } else {
        console.warn(`Module ${path} missing initNoteGeneration(); falling back to GPT-4-latest`);
        const fallback = await import('./noteGeneration.js');
        fallback.initNoteGeneration();
      }
    } catch (e) {
      console.warn(`Failed to load ${path}; falling back to GPT-4-latest`, e);
      const fallback = await import('./noteGeneration.js');
      fallback.initNoteGeneration();
    }
  })();

  // Live-switch helpers (used by dropdown handlers in transcribe.html)
  // --- Note Provider Switch (cached import version) ---
  window.__app.cachedModules = window.__app.cachedModules || {};
  window.__app.switchNoteProvider = async function(next) {
    // Reset note run state when switching providers.
    resetNoteGenerationState();
    delete window.__app.__noteStartPulseBound;

    // Remove old listeners safely before reinitializing the generate button.
    // Keep abortNoteButton as the same DOM node because its click handler is
    // owned centrally by main.js and should survive provider switches.
    const btn = document.getElementById('generateNoteButton');
    if (btn && btn.parentNode) {
      const clone = btn.cloneNode(true);
      delete clone.dataset.noteStartPulseBound;
      clone.removeAttribute('data-note-start-pulse-bound');
      btn.parentNode.replaceChild(clone, btn);
    }
    const abortBtn = document.getElementById('abortNoteButton');
    if (abortBtn) {
      abortBtn.disabled = true;
    }

    sessionStorage.setItem('note_provider', (next || 'aws-bedrock').toLowerCase());

    const choice = (sessionStorage.getItem('note_provider') || 'aws-bedrock').toLowerCase();
    const path =
      choice === 'gpt4'           ? './noteGeneration.js'          :
      choice === 'lemonfox'       ? './LemonfoxTXT.js'             :
      choice === 'mistral'        ? './MistralTXT.js'              :
      choice === 'gpt52'          ? './noteGeneration_gpt52.js'    :
      choice === 'gpt52-ns'       ? './noteGeneration_gpt52_NS.js' :
      choice === 'gpt54'          ? './noteGeneration_gpt54.js'    :
      choice === 'gpt5-ns'        ? './noteGeneration_gpt5_NS.js'  :
      choice === 'gemini3'        ? './Gemini3.js'                 :
      choice === 'gemini3-vertex' ? './GeminiVertex.js'            :
      choice === 'aws-bedrock'    ? './AWSBedrock.js'              :
                                    './notegeneration%20gpt-5.js';

    // Load the module only once per session, then reuse from cache
    if (!window.__app.cachedModules[path]) {
      window.__app.cachedModules[path] = await import(path);
    }

    try {
      const mod = window.__app.cachedModules[path];
      if (mod && typeof mod.initNoteGeneration === 'function') {
        mod.initNoteGeneration();
        window.__app.bindNoteStartPulse?.();
        syncNoteActionButtons();
      } else {
        throw new Error('initNoteGeneration() missing');
      }
    } catch (e) {
      console.warn('Switch note provider failed, falling back to reload', e);
      if (typeof window.__app.saveState === 'function') window.__app.saveState();
      window.location.reload();
    }
  };

  // --- Recording Provider Switch (cached import version) ---
  window.__app.switchTranscribeProvider = async function(next) {
    // Clean up old button listeners safely
    ['startButton','stopButton','pauseResumeButton','abortButton'].forEach(id => {
      const b = document.getElementById(id);
      if (b) {
        const clone = b.cloneNode(true);
        b.parentNode.replaceChild(clone, b);
      }
    });

    sessionStorage.setItem('transcribe_provider', (next || 'soniox').toLowerCase());
    let provider = (sessionStorage.getItem('transcribe_provider') || 'soniox').toLowerCase();
    // Back-compat: old stored value "soniox_dia"
    if (provider === 'soniox_dia') {
      provider = 'soniox';
      sessionStorage.setItem('transcribe_provider', 'soniox');
      sessionStorage.setItem('soniox_speaker_labels', 'on');
    }

    function getSonioxPath() {
      const v = (sessionStorage.getItem('soniox_speaker_labels') || 'off').toLowerCase();
      return (v === 'on') ? './SONIOX_UPDATE_dia.js' : './SONIOX_UPDATE.js';
    }

    const path =
      provider === 'soniox'   ? getSonioxPath()          :
      provider === 'lemonfox' ? './LemonfoxSTT.js'       :
      provider === 'voxtral'  ? './VoxtralminiSTT.js'    :
      provider === 'openai'   ? './recording.js'         :
      provider === 'deepgram' ? './deepgram_nova3.js'    :
                                './recording.js';
    console.info('[recording:switch] provider:', provider, 'module:', path);

    try {
      // Cache and reuse modules
      if (!window.__app.cachedModules[path]) {
        window.__app.cachedModules[path] = await import(path);
      }

      const mod = window.__app.cachedModules[path];
      if (mod && typeof mod.initRecording === 'function') {
        mod.initRecording();
      } else {
        throw new Error('initRecording() missing');
      }
    } catch (e) {
      console.warn('Switch transcribe provider failed, falling back to reload', e);
      if (typeof window.__app.saveState === 'function') window.__app.saveState();
      window.location.reload();
    }
  };

  // Add hotkey for the "r" key to trigger the "Start Recording" button,
  // but only when not inside an editable text field.
  document.addEventListener('keydown', (event) => {
    const activeElement = document.activeElement;
    // Check if the active element is an input, textarea, or a contentEditable element.
    if (
      activeElement &&
      (activeElement.tagName === 'INPUT' ||
       activeElement.tagName === 'TEXTAREA' ||
       activeElement.isContentEditable)
    ) {
      return;
    }
    // Check if the pressed key is "r" (case-insensitive).
    if (event.key.toLowerCase() === 'r') {
      const startButton = document.getElementById('startButton');
      if (startButton) {
        startButton.click();
      }
    }
  });
});
