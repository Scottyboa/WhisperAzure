import { initTranscribeLanguage } from './languageLoaderUsage.js';
import {
  DEFAULTS,
  deriveNoteUiStateFromEffectiveProvider,
  getNoteProviderLogLabel,
  inferNoteProviderUi,
  normalizeTranscribeProvider,
  resolveNoteModulePath as resolveNoteModulePathFromRegistry,
  resolveTranscribeModulePath as resolveTranscribeModulePathFromRegistry,
} from './core/provider-registry.js';

document.addEventListener('DOMContentLoaded', () => {
  initTranscribeLanguage();

  const STATE_KEY = '__ui_state_v1';
  const AUTO_GENERATE_KEY = 'auto_generate_enabled';
  const AUTO_COPY_MODE_KEY = 'auto_copy_mode';
  const AUTO_COPY_EXTENSION_SIGNAL = 'AUTO_COPY_EXTENSION_PRESENT';
  const AUTO_COPY_EXTENSION_COPY_RESULT = 'AUTO_COPY_EXTENSION_COPY_RESULT';
  const AUTO_COPY_EXTENSION_PING = 'AUTO_COPY_EXTENSION_PING';
  const AUTO_COPY_EXTENSION_PING_TIMEOUT_MS = 1200;
  const PROMPT_PROFILE_STORAGE_KEY = 'prompt_profile_id';
  const DEFAULT_PROMPT_PROFILE_ID = 'default';

  function getApp() {
    const existing = window.__app || {};
    const app = (window.__app = existing);
    app.cachedModules = app.cachedModules || {};
    if (typeof app.miniPanelOpen !== 'boolean') {
      app.miniPanelOpen = false;
    }
    return app;
  }

  function emitAppStateChanged(reason = 'unknown', extra = {}) {
    try {
      window.dispatchEvent(
        new CustomEvent('app:state-changed', {
          detail: {
            reason,
            at: Date.now(),
            ...extra,
          },
        })
      );
    } catch (_) {}
  }

  function setMiniPanelStatusPhase(phase) {
    const app = getApp();
    const next = String(phase || '').trim() || 'idle';
    if (app.miniPanelStatusPhase === next) return;
    app.miniPanelStatusPhase = next;
    emitAppStateChanged('mini-panel-status-phase', { phase: next });
  }

  function setAutoCopyExtensionAvailable(available) {
    const app = getApp();
    const next = !!available;
    if (app.autoCopyExtensionAvailable === next) return;
    app.autoCopyExtensionAvailable = next;
    emitAppStateChanged('auto-copy-extension-availability', { available: next });
  }

  function isAutoCopyExtensionAvailable() {
    return !!getApp().autoCopyExtensionAvailable;
  }

  function pingAutoCopyExtension() {
    return new Promise((resolve) => {
      let settled = false;

      const finish = (available) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeoutId);
        window.removeEventListener('message', onMessage);
        setAutoCopyExtensionAvailable(available);
        resolve(available);
      };

      const onMessage = (event) => {
        if (event.source !== window) return;
        const data = event?.data || {};
        if (data.type !== AUTO_COPY_EXTENSION_SIGNAL) return;
        finish(true);
      };

      const timeoutId = window.setTimeout(() => finish(false), AUTO_COPY_EXTENSION_PING_TIMEOUT_MS);
      window.addEventListener('message', onMessage);

      try {
        window.postMessage({ type: AUTO_COPY_EXTENSION_PING }, window.location.origin);
      } catch (_) {
        finish(false);
      }
    });
  }

  function readSession(key, fallback = '') {
    try {
      const value = sessionStorage.getItem(key);
      return value == null ? fallback : value;
    } catch (_) {
      return fallback;
    }
  }

  function writeSession(key, value) {
    try {
      sessionStorage.setItem(key, String(value ?? ''));
    } catch (_) {}
  }

  function readLocal(key, fallback = '') {
    try {
      const value = localStorage.getItem(key);
      return value == null ? fallback : value;
    } catch (_) {
      return fallback;
    }
  }

  function writeLocal(key, value) {
    try {
      localStorage.setItem(key, String(value ?? ''));
    } catch (_) {}
  }

  function reloadWithSavedState(reason = '') {
    if (reason) {
      console.warn(reason);
    }

    try {
      saveState();
    } catch (_) {}

    window.location.reload();
  }

  function saveState() {
    const grab = (id) => {
      const el = document.getElementById(id);
      if (!el) return null;
      return {
        value: el.value ?? '',
        selStart: el.selectionStart ?? null,
        selEnd: el.selectionEnd ?? null,
        scrollTop: el.scrollTop ?? 0,
      };
    };

    const payload = {
      transcription: grab('transcription'),
      generatedNote: grab('generatedNote'),
      customPrompt: grab('customPrompt'),
      ts: Date.now(),
    };

    try {
      sessionStorage.setItem(STATE_KEY, JSON.stringify(payload));
    } catch {}
  }

  function restoreState() {
    let raw = null;
    try {
      raw = sessionStorage.getItem(STATE_KEY);
    } catch {}
    if (!raw) return;

    try {
      const s = JSON.parse(raw);
      const put = (id, sObj) => {
        if (!sObj) return;
        const el = document.getElementById(id);
        if (!el) return;

        el.value = sObj.value || '';
        if (typeof sObj.scrollTop === 'number') el.scrollTop = sObj.scrollTop;

        setTimeout(() => {
          if (typeof sObj.selStart === 'number' && typeof sObj.selEnd === 'number') {
            try {
              el.setSelectionRange(sObj.selStart, sObj.selEnd);
            } catch {}
          }
        }, 0);
      };

      put('transcription', s.transcription);
      put('generatedNote', s.generatedNote);
      put('customPrompt', s.customPrompt);
    } finally {
      try {
        sessionStorage.removeItem(STATE_KEY);
      } catch {}
    }

    emitAppStateChanged('state-restored');
  }

  function syncNoteActionButtons() {
    const generateNoteButton = document.getElementById('generateNoteButton');
    const abortNoteButton = document.getElementById('abortNoteButton');
    const noteProviderSelect = document.getElementById('noteProvider');
    const openaiModelSelect = document.getElementById('openaiModel');
    const noteModeSelect = document.getElementById('noteProviderMode');
    const vertexModelSelect = document.getElementById('vertexModel');
    const bedrockModelSelect = document.getElementById('bedrockModel');
    const busy = !!getApp().noteGenerationInFlight;

    if (generateNoteButton) {
      generateNoteButton.disabled = busy;
      generateNoteButton.title = busy ? 'A note is currently generating.' : '';
    }

    if (abortNoteButton) {
      abortNoteButton.disabled = !busy;
      abortNoteButton.title = busy ? '' : 'No active note generation to abort.';
    }

    [
      noteProviderSelect,
      openaiModelSelect,
      noteModeSelect,
      vertexModelSelect,
      bedrockModelSelect,
    ].forEach((el) => {
      if (!el) return;
      el.disabled = busy;
      el.title = busy ? 'Provider settings are locked while a note is generating.' : '';
    });
  }

  function beginNoteGeneration(meta = {}) {
    const app = getApp();
    if (app.noteGenerationInFlight) return null;

    const controller = new AbortController();
    app.noteGenerationInFlight = true;
    app.noteGenerationAbortController = controller;
    app.noteGenerationMeta = meta || {};
    syncNoteActionButtons();
    emitAppStateChanged('note-generation-begin', { meta: meta || {} });
    return controller;
  }

  function finishNoteGeneration() {
    const app = getApp();
    app.noteGenerationInFlight = false;
    app.noteGenerationAbortController = null;
    app.noteGenerationMeta = null;
    syncNoteActionButtons();
    emitAppStateChanged('note-generation-finish');
  }

  function abortNoteGeneration() {
    const controller = getApp().noteGenerationAbortController;
    if (controller) {
      try {
        controller.abort();
      } catch (_) {}
    }
    emitAppStateChanged('note-generation-abort-requested');
  }

  function normalizeAutoCopyMode(value) {
    const mode = String(value || '').toLowerCase();
    if (mode === 'both') return 'note';
    return ['off', 'transcript', 'note'].includes(mode) ? mode : 'off';
  }

  function getAutoCopyMode() {
    const next = normalizeAutoCopyMode(readLocal(AUTO_COPY_MODE_KEY, ''));
    if (next !== readLocal(AUTO_COPY_MODE_KEY, '')) {
      writeLocal(AUTO_COPY_MODE_KEY, next);
    }
    return next;
  }

  function setAutoCopyMode(mode) {
    const next = normalizeAutoCopyMode(mode);
    if (next !== 'off' && !isAutoCopyExtensionAvailable()) {
      writeLocal(AUTO_COPY_MODE_KEY, 'off');

      const el = document.getElementById('autoCopyModeSelect');
      if (el && el.value !== 'off') {
        el.value = 'off';
      }

      emitAppStateChanged('auto-copy-mode-blocked-no-extension', {
        requestedMode: next,
        appliedMode: 'off',
      });
      return 'off';
    }

    writeLocal(AUTO_COPY_MODE_KEY, next);

    const el = document.getElementById('autoCopyModeSelect');
    if (el && el.value !== next) {
      el.value = next;
    }

    emitAppStateChanged('auto-copy-mode-changed', { mode: next });
    return next;
  }

  function autoCopyIncludesTranscript() {
    const mode = getAutoCopyMode();
    return mode === 'transcript';
  }

  function autoCopyIncludesNote() {
    const mode = getAutoCopyMode();
    return mode === 'note';
  }

  function buildFinishedNoteDetail(meta = {}) {
    const noteEl = document.getElementById('generatedNote');
    const text = String(noteEl?.value || '');
    return {
      status: meta?.aborted ? 'aborted' : 'success',
      text,
      textLength: text.length,
      autoCopyEnabled: autoCopyIncludesNote(),
      autoCopyMode: getAutoCopyMode(),
      emittedAt: Date.now(),
      ...meta,
    };
  }

  function emitCopiedEvent(text, source = 'manual-copy') {
    try {
      window.dispatchEvent(new CustomEvent('note-copied', {
        detail: {
          textLength: String(text || '').length,
          copiedAt: Date.now(),
          source,
        }
      }));
    } catch (_) {}
    emitAppStateChanged('note-copied', {
      textLength: String(text || '').length,
      source,
    });
  }

  function emitTranscriptCopiedEvent(text, source = 'manual-copy-transcript') {
    try {
      window.dispatchEvent(new CustomEvent('transcript-copied', {
        detail: {
          textLength: String(text || '').length,
          copiedAt: Date.now(),
          source,
        }
      }));
    } catch (_) {}
    emitAppStateChanged('transcript-copied', {
      textLength: String(text || '').length,
      source,
    });
  }

  function emitTranscriptCopyFailedEvent(text, source = 'manual-copy-transcript', reason = 'unknown') {
    try {
      window.dispatchEvent(new CustomEvent('transcript-copy-failed', {
        detail: {
          textLength: String(text || '').length,
          failedAt: Date.now(),
          source,
          reason,
        }
      }));
    } catch (_) {}
    emitAppStateChanged('transcript-copy-failed', {
      textLength: String(text || '').length,
      source,
      reason,
    });
  }

  function initAutoCopyExtensionCopyBridge() {
    const app = getApp();
    if (app.__autoCopyExtensionCopyBridgeBound) return;
    app.__autoCopyExtensionCopyBridgeBound = true;

    window.addEventListener('message', (event) => {
      if (event.source !== window) return;

      const data = event?.data || {};
      if (data.type !== AUTO_COPY_EXTENSION_COPY_RESULT) return;

      const copyKind = String(data.copyKind || '').trim().toLowerCase();
      const ok = !!data.ok;
      const reason = String(data.reason || '').trim() || 'extension-copy-failed';
      const sourceEvent = String(data.sourceEvent || '').trim();
      const source =
        copyKind === 'transcript'
          ? `extension-auto-copy-transcript:${sourceEvent || 'unknown'}`
          : `extension-auto-copy-note:${sourceEvent || 'unknown'}`;

      const textLength = Number(data.textLength || 0);
      const placeholderText = textLength > 0 ? 'x'.repeat(textLength) : '';

      if (copyKind === 'transcript') {
        if (ok) {
          emitTranscriptCopiedEvent(placeholderText, source);
        } else {
          emitTranscriptCopyFailedEvent(placeholderText, source, reason);
        }
        return;
      }

      if (ok) {
        emitCopiedEvent(placeholderText, source);
      } else {
        emitCopyFailedEvent(placeholderText, source, reason);
      }
    });
  }

  function emitCopyFailedEvent(text, source = 'manual-copy', reason = 'unknown') {
    try {
      window.dispatchEvent(new CustomEvent('note-copy-failed', {
        detail: {
          textLength: String(text || '').length,
          failedAt: Date.now(),
          source,
          reason,
        }
      }));
    } catch (_) {}
    emitAppStateChanged('note-copy-failed', {
      textLength: String(text || '').length,
      source,
      reason,
    });
  }

  function delay(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  async function tryClipboardWriteWithRetries(text, retryCount = 5, retryDelayMs = 300) {
    if (!(navigator.clipboard && typeof navigator.clipboard.writeText === 'function')) {
      return { ok: false, reason: 'clipboard-api-unavailable' };
    }

    let lastError = null;

    for (let attempt = 0; attempt < retryCount; attempt += 1) {
      if (attempt > 0) {
        await delay(retryDelayMs);
      }

      try {
        await navigator.clipboard.writeText(text);
        return { ok: true };
      } catch (error) {
        lastError = error;
      }
    }

    return {
      ok: false,
      reason: lastError?.name || 'clipboard-write-failed',
    };
  }

  function tryExecCommandCopyFromField(field, text, source = 'manual-copy') {
    try {
      if (!field) return false;
      const previousSelectionStart = field.selectionStart;
      const previousSelectionEnd = field.selectionEnd;
      const previousActive = document.activeElement;

      field.focus();
      field.select();
      const ok = document.execCommand('copy');

      try {
        if (
          typeof previousSelectionStart === 'number' &&
          typeof previousSelectionEnd === 'number'
        ) {
          field.setSelectionRange(previousSelectionStart, previousSelectionEnd);
        }
      } catch (_) {}

      try {
        if (previousActive && typeof previousActive.focus === 'function' && previousActive !== field) {
          previousActive.focus();
        }
      } catch (_) {}

      if (ok) {
        emitCopiedEvent(text, source);
      } else {
        emitCopyFailedEvent(text, source, 'execCommand-returned-false');
      }
      return !!ok;
    } catch (_) {
      emitCopyFailedEvent(text, source, 'execCommand-threw');
      return false;
    } finally {
      try { window.getSelection()?.removeAllRanges?.(); } catch (_) {}
    }
  }

  function tryExecCommandCopyTranscriptFromField(field, text, source = 'manual-copy-transcript') {
    try {
      if (!field) return false;
      const previousSelectionStart = field.selectionStart;
      const previousSelectionEnd = field.selectionEnd;
      const previousActive = document.activeElement;

      field.focus();
      field.select();
      const ok = document.execCommand('copy');

      try {
        if (
          typeof previousSelectionStart === 'number' &&
          typeof previousSelectionEnd === 'number'
        ) {
          field.setSelectionRange(previousSelectionStart, previousSelectionEnd);
        }
      } catch (_) {}

      try {
        if (previousActive && typeof previousActive.focus === 'function' && previousActive !== field) {
          previousActive.focus();
        }
      } catch (_) {}

      if (ok) {
        emitTranscriptCopiedEvent(text, source);
      } else {
        emitTranscriptCopyFailedEvent(text, source, 'execCommand-returned-false');
      }
      return !!ok;
    } catch (_) {
      emitTranscriptCopyFailedEvent(text, source, 'execCommand-threw');
      return false;
    } finally {
      try { window.getSelection()?.removeAllRanges?.(); } catch (_) {}
    }
  }

  function getPageLanguage() {
    const lang =
      document.documentElement?.lang ||
      localStorage.getItem('selectedLanguage') ||
      'en';
    return String(lang || 'en').toLowerCase();
  }

  function tNotify(key) {
    const lang = getPageLanguage();
    const dict = {
      copiedTitle: {
        en: 'Finished note copied',
        no: 'Ferdig notat kopiert',
        nb: 'Ferdig notat kopiert',
        nn: 'Ferdig notat kopiert',
        sv: 'Färdig anteckning kopierad',
        da: 'Færdig note kopieret',
        de: 'Fertige Notiz kopiert',
        fr: 'Note finale copiée',
        it: 'Nota finale copiata',
      },
      copiedBody: {
        en: 'The finished note is now on your clipboard.',
        no: 'Det ferdige notatet er nå kopiert til utklippstavlen.',
        nb: 'Det ferdige notatet er nå kopiert til utklippstavlen.',
        nn: 'Det ferdige notatet er no kopiert til utklippstavla.',
        sv: 'Den färdiga anteckningen är nu kopierad till urklipp.',
        da: 'Den færdige note er nu kopieret til udklipsholderen.',
        de: 'Die fertige Notiz befindet sich jetzt in der Zwischenablage.',
        fr: 'La note finale a été copiée dans le presse-papiers.',
        it: 'La nota finale è stata copiata negli appunti.',
      },
      permissionTitle: {
        en: 'Enable notifications?',
        no: 'Aktivere varsler?',
        nb: 'Aktivere varsler?',
        nn: 'Aktivere varsel?',
        sv: 'Aktivera notiser?',
        da: 'Aktivér notifikationer?',
        de: 'Benachrichtigungen aktivieren?',
        fr: 'Activer les notifications ?',
        it: 'Attivare le notifiche?',
      },
    };
    const row = dict[key] || {};
    return row[lang] || row[lang.split('-')[0]] || row.en || key;
  }

  function canUseWebNotifications() {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  function isMiniPanelOpen() {
    return !!getApp().miniPanelOpen;
  }

  function shouldShowCopiedSystemNotification(detail) {
    return !!(
      detail &&
      detail.status !== 'aborted' &&
      detail.autoCopyEnabled &&
      !isMiniPanelOpen()
    );
  }

  async function requestNotificationPermissionIfNeeded() {
    // Legacy page-notification path retained for future use,
    // but extension-driven auto-copy should handle notifications now.
    return 'extension-handled';
  }

  function showCopiedSystemNotification(detail) {
    if (!canUseWebNotifications()) {
      console.warn('[notify] Web Notifications API not supported in this browser/context.');
      emitAppStateChanged('notification-unsupported');
      return false;
    }

    if (Notification.permission !== 'granted') {
      console.warn(
        '[notify] Notification skipped because permission is not granted:',
        Notification.permission
      );
      emitAppStateChanged('notification-not-granted', { permission: Notification.permission });
      return false;
    }

    try {
      const title = tNotify('copiedTitle');
      const body = tNotify('copiedBody');
      const notification = new Notification(title, {
        body,
        tag: 'finished-note-copied',
        renotify: true,
        silent: false,
      });

      notification.onclick = () => {
        try {
          window.focus();
        } catch (_) {}
        try {
          notification.close();
        } catch (_) {}
      };

      setTimeout(() => {
        try {
          notification.close();
        } catch (_) {}
      }, 5000);

      emitAppStateChanged('system-notification-shown', {
        textLength: detail?.textLength || 0,
      });
      return true;
    } catch (err) {
      console.warn('[notify] Notification creation failed:', err);
      emitAppStateChanged('system-notification-failed');
      return false;
    }
  }

  function tryAutoCopyFinishedNote(detail) {
    // Legacy browser-page auto-copy path kept intentionally but no longer active.
    // Auto-copy is now extension-only.
    return;

    const text = String(detail?.text || '').trim();
    if (!text) return;
    if (detail?.status === 'aborted') return;
    if (!autoCopyIncludesNote()) return;

    const noteEl = document.getElementById('generatedNote');
    const shouldNotify = shouldShowCopiedSystemNotification(detail);

    if (shouldNotify) {
      if (Notification.permission === 'granted') {
        showCopiedSystemNotification(detail);
      } else if (Notification.permission === 'default') {
        requestNotificationPermissionIfNeeded()
          .then((permission) => {
            if (permission === 'granted') {
              showCopiedSystemNotification(detail);
            }
          })
          .catch(() => {});
      }
    }

    (async () => {
      const result = await tryClipboardWriteWithRetries(text, 5, 300);
      if (result.ok) {
        emitCopiedEvent(text, 'auto-copy');
        return;
      }

      const ok = tryExecCommandCopyFromField(noteEl, text, 'auto-copy');
      if (!ok) {
        emitCopyFailedEvent(
          text,
          'auto-copy',
          result.reason || 'clipboard-write-failed'
        );
      }
    })().catch((error) => {
      const ok = tryExecCommandCopyFromField(noteEl, text, 'auto-copy');
      if (!ok) {
        emitCopyFailedEvent(
          text,
          'auto-copy',
          error?.name || 'clipboard-write-failed'
        );
      }
    });
  }

  function buildFinishedTranscriptDetail(meta = {}) {
    const trEl = document.getElementById('transcription');
    const text = String(trEl?.value || '');
    return {
      status: meta?.aborted ? 'aborted' : 'success',
      text,
      textLength: text.length,
      autoCopyEnabled: autoCopyIncludesTranscript(),
      autoCopyMode: getAutoCopyMode(),
      emittedAt: Date.now(),
      ...meta,
    };
  }

  function tryAutoCopyFinishedTranscript(detail) {
    // Legacy browser-page auto-copy path kept intentionally but no longer active.
    // Auto-copy is now extension-only.
    return;

    const text = String(detail?.text || '').trim();
    if (!text) return;
    if (detail?.status === 'aborted') return;
    if (!autoCopyIncludesTranscript()) return;

    const trEl = document.getElementById('transcription');

    (async () => {
      const result = await tryClipboardWriteWithRetries(text, 5, 300);
      if (result.ok) {
        emitTranscriptCopiedEvent(text, 'auto-copy-transcript');
        return;
      }

      const ok = tryExecCommandCopyTranscriptFromField(trEl, text, 'auto-copy-transcript');
      if (!ok) {
        emitTranscriptCopyFailedEvent(
          text,
          'auto-copy-transcript',
          result.reason || 'clipboard-write-failed'
        );
      }
    })().catch((error) => {
      const ok = tryExecCommandCopyTranscriptFromField(trEl, text, 'auto-copy-transcript');
      if (!ok) {
        emitTranscriptCopyFailedEvent(
          text,
          'auto-copy-transcript',
          error?.name || 'clipboard-write-failed'
        );
      }
    });
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
    emitAppStateChanged('note-generation-reset');
  }

  function getSelectedTranscribeProvider() {
    const fromUi = document.getElementById('transcribeProvider')?.value;
    const normalized = normalizeTranscribeProvider(
      fromUi || readSession('transcribe_provider', DEFAULTS.transcribeProvider)
    );

    if (normalized !== readSession('transcribe_provider', DEFAULTS.transcribeProvider)) {
      writeSession('transcribe_provider', normalized);
    }
    if (normalized === 'soniox' && readSession('soniox_speaker_labels', '') !== 'on') {
      // no-op; legacy migration is handled inside normalizeTranscribeProvider + provider persistence
    }

    return normalized;
  }

  function getSelectedSonioxRegion() {
    return String(
      document.getElementById('sonioxRegion')?.value ||
        readSession('soniox_region', DEFAULTS.sonioxRegion)
    ).toLowerCase();
  }

  function getSelectedSonioxSpeakerLabels() {
    return String(
      document.getElementById('sonioxSpeakerLabels')?.value ||
        readSession('soniox_speaker_labels', DEFAULTS.sonioxSpeakerLabels)
    ).toLowerCase();
  }

  function getSelectedEffectiveNoteProvider() {
    return String(readSession('note_provider', DEFAULTS.noteProvider)).toLowerCase();
  }

  function getDerivedNoteUiState() {
    return deriveNoteUiStateFromEffectiveProvider(
      getSelectedEffectiveNoteProvider(),
      readSession('note_provider_mode', DEFAULTS.noteMode)
    );
  }

  function getSelectedNoteProviderUi() {
    return String(
      document.getElementById('noteProvider')?.value ||
        inferNoteProviderUi(getSelectedEffectiveNoteProvider())
    ).toLowerCase();
  }

  function getSelectedOpenAiModel() {
    const domValue = String(document.getElementById('openaiModel')?.value || '').toLowerCase();
    if (domValue) return domValue;

    const stored = String(readSession('openai_model', '')).toLowerCase();
    if (stored) return stored;

    return getDerivedNoteUiState().openaiModel;
  }

  function getSelectedVertexModel() {
    return String(
      document.getElementById('vertexModel')?.value ||
        readSession('vertex_model', '')
    ).toLowerCase();
  }

  function getSelectedBedrockModel() {
    return String(
      document.getElementById('bedrockModel')?.value ||
        readSession('bedrock_model', '')
    ).toLowerCase();
  }

  function getSelectedNoteProviderMode() {
    const domValue = String(document.getElementById('noteProviderMode')?.value || '').toLowerCase();
    if (domValue) return domValue;

    const stored = String(readSession('note_provider_mode', '')).toLowerCase();
    if (stored) return stored;

    return getDerivedNoteUiState().mode;
  }

  function getTranscribeProviderSnapshot() {
    return {
      transcribeProvider: getSelectedTranscribeProvider(),
      sonioxRegion: getSelectedSonioxRegion(),
      sonioxSpeakerLabels: getSelectedSonioxSpeakerLabels(),
    };
  }

  function getNoteProviderSnapshot() {
    const effective = getSelectedEffectiveNoteProvider();
    const uiProvider = getSelectedNoteProviderUi();
    const vertexModel = getSelectedVertexModel();
    const bedrockModel = getSelectedBedrockModel();
    const openaiModel = getSelectedOpenAiModel();
    const noteProviderMode = getSelectedNoteProviderMode();

    return {
      noteProviderUi: uiProvider,
      noteProviderEffective: effective,
      noteProviderMode,
      openaiModel,
      vertexModel,
      bedrockModel,
      noteProviderLogLabel: getNoteProviderLogLabel({
        effectiveProvider: effective,
        openaiModel,
        vertexModel,
        bedrockModel,
      }),
    };
  }

  function getEffectivePromptProfileId() {
    return String(readLocal(PROMPT_PROFILE_STORAGE_KEY, '') || '').trim() || DEFAULT_PROMPT_PROFILE_ID;
  }

  function getPromptSlotNamesMap() {
    const profileId = getEffectivePromptProfileId();
    const raw = readLocal(`prompt_slot_names::${profileId}`, '');
    if (!raw) return {};
    try {
      const parsed = JSON.parse(raw);
      return (parsed && typeof parsed === 'object') ? parsed : {};
    } catch (_) {
      return {};
    }
  }

  function getPromptSlotSelect() {
    return document.getElementById('promptSlot');
  }

  function getPromptSlotDisplayLabel(slotValue, namesMap) {
    const slot = String(slotValue || '').trim();
    if (!slot) return '';
    const explicitName = String((namesMap && namesMap[slot]) || '').trim();
    if (explicitName) {
      return `${slot}. ${explicitName}`;
    }
    return `${slot}.`;
  }

  function getMiniPanelPromptOptions() {
    const select = getPromptSlotSelect();
    const namesMap = getPromptSlotNamesMap();

    if (!select) {
      const selected = String(readLocal(`prompt_selected_slot::${getEffectivePromptProfileId()}`, '1') || '1').trim() || '1';
      return [
        { id: selected, label: getPromptSlotDisplayLabel(selected, namesMap) }
      ];
    }

    return Array.from(select.options)
      .map((opt) => String(opt.value || '').trim())
      .filter(Boolean)
      .map((slot) => ({
        id: slot,
        label: getPromptSlotDisplayLabel(slot, namesMap),
      }));
  }

  function getSelectedPromptSlot() {
    const select = getPromptSlotSelect();
    if (select && select.value) {
      return String(select.value).trim();
    }
    return String(readLocal(`prompt_selected_slot::${getEffectivePromptProfileId()}`, '1') || '1').trim() || '1';
  }

  function selectPromptSlot(slot) {
    const next = String(slot || '').trim();
    if (!next) return false;

    const select = getPromptSlotSelect();
    const allowed = new Set(getMiniPanelPromptOptions().map((item) => String(item.id)));

    if (!allowed.has(next)) {
      return false;
    }

    if (select) {
      if (select.value !== next) {
        select.value = next;
      }

      try {
        select.dispatchEvent(new Event('change', { bubbles: true }));
      } catch (_) {}

      try {
        window.dispatchEvent(new CustomEvent('prompt-slot-selection-changed', {
          detail: {
            profileId: getEffectivePromptProfileId(),
            slot: next,
          },
        }));
      } catch (_) {}

      emitAppStateChanged('prompt-slot-selected', { slot: next });
      return true;
    }

    try {
      localStorage.setItem(`prompt_selected_slot::${getEffectivePromptProfileId()}`, next);
    } catch (_) {}

    emitAppStateChanged('prompt-slot-selected-fallback', { slot: next });
    return true;
  }

  function resolveTranscribeModulePath(provider) {
    return resolveTranscribeModulePathFromRegistry(provider, {
      sonioxSpeakerLabels: getSelectedSonioxSpeakerLabels(),
    });
  }

  function resolveNoteModulePath(choice) {
    return resolveNoteModulePathFromRegistry(choice || getSelectedEffectiveNoteProvider());
  }

  async function loadCachedModule(path) {
    const app = getApp();
    if (!app.cachedModules[path]) {
      app.cachedModules[path] = await import(path);
    }
    return app.cachedModules[path];
  }

  function replaceButtonWithClone(id, beforeReplace) {
    const btn = document.getElementById(id);
    if (!btn || !btn.parentNode) return null;

    const clone = btn.cloneNode(true);
    if (typeof beforeReplace === 'function') beforeReplace(clone, btn);
    btn.parentNode.replaceChild(clone, btn);
    return clone;
  }

  async function initRecordingProvider(provider) {
    const normalized = normalizeTranscribeProvider(provider || getSelectedTranscribeProvider());
    const path = resolveTranscribeModulePath(normalized);

    console.info('[recording:init] provider:', normalized, 'module:', path);

    try {
      const mod = await loadCachedModule(path);
      if (mod && typeof mod.initRecording === 'function') {
        mod.initRecording();
        emitAppStateChanged('recording-provider-initialized', { provider: normalized });
      } else {
        console.error('Selected recording module lacks initRecording()');
      }
    } catch (e) {
      console.error('Failed to load recording module for provider:', normalized, e);
    }
  }

  async function initNoteProvider(choice) {
    const path = resolveNoteModulePath(choice || getSelectedEffectiveNoteProvider());

    try {
      const mod = await loadCachedModule(path);
      if (mod && typeof mod.initNoteGeneration === 'function') {
        mod.initNoteGeneration();
        emitAppStateChanged('note-provider-initialized', { provider: choice || getSelectedEffectiveNoteProvider() });
      } else {
        console.warn(`Module ${path} missing initNoteGeneration(); falling back to GPT-4-latest`);
        const fallback = await loadCachedModule('./noteGeneration.js');
        fallback.initNoteGeneration?.();
        emitAppStateChanged('note-provider-fallback-initialized');
      }
    } catch (e) {
      console.warn(`Failed to load ${path}; falling back to GPT-4-latest`, e);
      const fallback = await loadCachedModule('./noteGeneration.js');
      fallback.initNoteGeneration?.();
      emitAppStateChanged('note-provider-fallback-initialized');
    }
  }

  async function initMiniControllerFeature() {
    try {
      const mod = await import('./features/mini-controller.js');
      if (mod && typeof mod.init === 'function') {
        mod.init(getApp());
      }
    } catch (err) {
      console.warn('[mini-panel] Failed to initialize mini controller feature', err);
    }
  }

  function isTranscribeBusy() {
    const stopBtn = document.getElementById('stopButton');
    if (stopBtn && stopBtn.disabled === false) return true;

    const status = (document.getElementById('statusMessage')?.innerText || '').trim();
    if (!status) return false;
    if (/finishing transcription/i.test(status)) return true;
    if (/(transcribing|processing|uploading)/i.test(status) && !/transcription finished/i.test(status)) {
      return true;
    }

    return false;
  }

  function getAutoGenerateEnabled() {
    return readSession(AUTO_GENERATE_KEY, '') === '1';
  }

  function setAutoGenerateEnabled(enabled) {
    writeSession(AUTO_GENERATE_KEY, enabled ? '1' : '0');
    const el = document.getElementById('autoGenerateToggle');
    if (el && el.type === 'checkbox') el.checked = !!enabled;
    emitAppStateChanged('auto-generate-toggle', { enabled: !!enabled });
  }

  function initAutoGenerateToggle() {
    const el = document.getElementById('autoGenerateToggle');
    if (!el || el.type !== 'checkbox') return;

    if (el.dataset.bound === '1') return;
    el.dataset.bound = '1';

    if (readSession(AUTO_GENERATE_KEY, null) == null) {
      writeSession(AUTO_GENERATE_KEY, '0');
    }

    el.checked = getAutoGenerateEnabled();
    el.addEventListener('change', async () => {
      writeSession(AUTO_GENERATE_KEY, el.checked ? '1' : '0');
      emitAppStateChanged('auto-generate-toggle-change', { enabled: el.checked });

      if (el.checked && autoCopyIncludesNote()) {
        await requestNotificationPermissionIfNeeded();
      }
    });
  }

  function initAutoCopyModeSelect() {
    const el = document.getElementById('autoCopyModeSelect');
    if (!el || el.dataset.bound === '1') return;
    el.dataset.bound = '1';
    el.value = getAutoCopyMode();
    el.addEventListener('change', () => {
      const applied = setAutoCopyMode(el.value);
      el.value = applied;
    });
  }

  function initNotificationPermissionHooks() {
    // Legacy page-notification hooks intentionally disabled.
  }

  function emitTranscriptionFinished(opts) {
    const detail = {
      ...buildFinishedTranscriptDetail(opts || {}),
      ...(opts || {}),
    };

    try {
      window.dispatchEvent(new CustomEvent('transcription:finished', { detail }));
    } catch (err) {
      try {
        const ev = document.createEvent('CustomEvent');
        ev.initCustomEvent('transcription:finished', false, false, detail);
        window.dispatchEvent(ev);
      } catch {}
    }
    emitAppStateChanged('transcription-finished', { detail });
  }

  function tryAutoGenerateNote(eventDetail) {
    if (!getAutoGenerateEnabled()) return;

    const genBtn = document.getElementById('generateNoteButton');
    if (!genBtn || genBtn.disabled) return;

    const transcript = (document.getElementById('transcription')?.value || '').trim();
    if (!transcript) return;

    if (typeof getApp().isTranscribeBusy === 'function' && getApp().isTranscribeBusy()) {
      return;
    }

    const now = Date.now();
    const fp = `${eventDetail?.provider || 'unknown'}:${eventDetail?.transcriptLength || transcript.length}`;
    const last = getApp().__lastAutoGenerate || null;
    if (last && last.fp === fp && (now - last.at) < 2000) return;
    getApp().__lastAutoGenerate = { fp, at: now };

    if (getApp().isNoteGenerationBusy?.()) return;
    genBtn.click();
    emitAppStateChanged('auto-generate-clicked');
  }

  function initAutoGenerateOnFinishListener() {
    const app = getApp();
    if (app.__autoGenerateListenerBound) return;
    app.__autoGenerateListenerBound = true;

    window.addEventListener('transcription:finished', (e) => {
      try {
        tryAutoGenerateNote(e && e.detail ? e.detail : null);
      } catch (err) {
        console.warn('Auto-generate failed', err);
      }
    });
  }
  function setSharedStatusMessage(message, color = '') {
  const text = String(message || '').trim();
  if (!text) return;

  try {
    if (typeof window.updateStatusMessage === 'function') {
      window.updateStatusMessage(text, color || undefined);
    } else {
      const statusEl = document.getElementById('statusMessage');
      if (statusEl) {
        statusEl.innerText = text;
        if (color) statusEl.style.color = color;
      }
    }
  } catch (_) {
    const statusEl = document.getElementById('statusMessage');
    if (statusEl) {
      statusEl.innerText = text;
      if (color) statusEl.style.color = color;
    }
  }
}

function initStatusFlowListeners() {
  const app = getApp();
  if (app.__statusFlowListenersBound) return;
  app.__statusFlowListenersBound = true;

  window.addEventListener('app:state-changed', (event) => {
    const reason = String(event?.detail?.reason || '').trim();

    if (reason === 'note-generation-begin') {
      setSharedStatusMessage('Generating note...', 'blue');
    } else if (reason === 'start-recording-click' || reason === 'record-hotkey') {
      setSharedStatusMessage('Recording...', 'red');
    }
  });

  window.addEventListener('transcription:finished', (event) => {
    const detail = event?.detail || {};
    if (detail?.status === 'aborted') {
      setSharedStatusMessage('Recording aborted.', 'red');
      return;
    }

    if (getAutoGenerateEnabled()) {
      setSharedStatusMessage('Generating note...', 'blue');
    } else {
      setSharedStatusMessage('Transcript finished.', 'green');
    }
  });

  const handleNoteFinished = (event) => {
    const detail = event?.detail || {};
    if (detail?.status === 'aborted') return;
    setSharedStatusMessage('Note finished.', 'green');
  };

  window.addEventListener('note-generation-finished', handleNoteFinished);
  window.addEventListener('note:finished', handleNoteFinished);
}

  function copyGeneratedNoteToClipboard() {
    const noteEl = document.getElementById('generatedNote');
    const text = String(noteEl?.value || '').trim();
    if (!text) return false;

    const emitCopied = () => {
      emitCopiedEvent(text, 'manual-copy');
    };

    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      navigator.clipboard.writeText(text)
        .then(() => {
          emitCopied();
        })
        .catch((error) => {
          try {
            noteEl?.focus();
            noteEl?.select();
            const ok = document.execCommand('copy');
            if (ok) {
              emitCopied();
            } else {
              emitCopyFailedEvent(text, 'manual-copy', 'execCommand-returned-false');
            }
          } catch (_) {
            emitCopyFailedEvent(text, 'manual-copy', error?.name || 'clipboard-write-failed');
          }
          finally {
            try { window.getSelection()?.removeAllRanges?.(); } catch (_) {}
          }
        });
      return true;
    }

    try {
      noteEl?.focus();
      noteEl?.select();
      const ok = document.execCommand('copy');
      if (ok) {
        emitCopied();
        return true;
      }
      emitCopyFailedEvent(text, 'manual-copy', 'execCommand-returned-false');
      return false;
    } catch (_) {
      emitCopyFailedEvent(text, 'manual-copy', 'execCommand-threw');
      return false;
    } finally {
      try { window.getSelection()?.removeAllRanges?.(); } catch (_) {}
    }
  }

  function copyTranscriptionToClipboard() {
    const trEl = document.getElementById('transcription');
    const text = String(trEl?.value || '').trim();
    if (!text) return false;

    const emitCopied = () => {
      emitTranscriptCopiedEvent(text, 'manual-copy-transcript');
    };

    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      navigator.clipboard.writeText(text)
        .then(() => {
          emitCopied();
        })
        .catch((error) => {
          try {
            trEl?.focus();
            trEl?.select();
            const ok = document.execCommand('copy');
            if (ok) {
              emitCopied();
            } else {
              emitTranscriptCopyFailedEvent(text, 'manual-copy-transcript', 'execCommand-returned-false');
            }
          } catch (_) {
            emitTranscriptCopyFailedEvent(text, 'manual-copy-transcript', error?.name || 'clipboard-write-failed');
          } finally {
            try { window.getSelection()?.removeAllRanges?.(); } catch (_) {}
          }
        });
      return true;
    }

    try {
      trEl?.focus();
      trEl?.select();
      const ok = document.execCommand('copy');
      if (ok) {
        emitCopied();
        return true;
      }
      emitTranscriptCopyFailedEvent(text, 'manual-copy-transcript', 'execCommand-returned-false');
      return false;
    } catch (_) {
      emitTranscriptCopyFailedEvent(text, 'manual-copy-transcript', 'execCommand-threw');
      return false;
    } finally {
      try { window.getSelection()?.removeAllRanges?.(); } catch (_) {}
    }
  }

  function getUsePromptToggleElement() {
    return (
      document.getElementById('includePromptToggle') ||
      document.getElementById('usePromptCheckbox') ||
      null
    );
  }

  function getUsePromptEnabled() {
    return !!getUsePromptToggleElement()?.checked;
  }

  function setUsePromptEnabled(enabled) {
    const el = getUsePromptToggleElement();
    if (!el || el.type !== 'checkbox') return false;

    const next = !!enabled;
    if (el.checked === next) return true;

    el.checked = next;
    try {
      el.dispatchEvent(new Event('change', { bubbles: true }));
    } catch (_) {
      try {
        const ev = document.createEvent('Event');
        ev.initEvent('change', true, true);
        el.dispatchEvent(ev);
      } catch {}
    }

    emitAppStateChanged('use-prompt-toggle-change', { enabled: next });
    return true;
  }

  function getMiniPanelState() {
    const startBtn = document.getElementById('startButton');
    const stopBtn = document.getElementById('stopButton');
    const pauseBtn = document.getElementById('pauseResumeButton');
    const abortBtn = document.getElementById('abortButton');
    const noteEl = document.getElementById('generatedNote');
    const statusEl = document.getElementById('statusMessage');

    return {
      transcribeBusy: !!getApp().isTranscribeBusy?.(),
      noteBusy: !!getApp().isNoteGenerationBusy?.(),
      canStart: !(startBtn?.disabled ?? true),
      canStop: !(stopBtn?.disabled ?? true),
      canPauseResume: !(pauseBtn?.disabled ?? true),
      canAbort: !(abortBtn?.disabled ?? true),
      hasNote: !!String(noteEl?.value || '').trim(),
      statusText: String(statusEl?.innerText || '').trim(),
      pauseResumeLabel: String(pauseBtn?.textContent || '').trim(),
      autoGenerateEnabled: !!getAutoGenerateEnabled(),
      autoCopyMode: getAutoCopyMode(),
      autoCopyExtensionAvailable: isAutoCopyExtensionAvailable(),
      miniPanelStatusPhase: String(getApp().miniPanelStatusPhase || 'idle'),
      usePromptEnabled: getUsePromptEnabled(),
    };
  }

  function initMiniPanelStatusPhaseFlow() {
    const app = getApp();
    if (app.__miniPanelStatusPhaseBound) return;
    app.__miniPanelStatusPhaseBound = true;

    const startBtn = document.getElementById('startButton');
    const stopBtn = document.getElementById('stopButton');
    const pauseBtn = document.getElementById('pauseResumeButton');
    const abortBtn = document.getElementById('abortButton');

    if (startBtn && startBtn.dataset.miniPanelStatusBound !== '1') {
      startBtn.dataset.miniPanelStatusBound = '1';
      startBtn.addEventListener('click', () => {
        setMiniPanelStatusPhase('recording');
      });
    }

    if (stopBtn && stopBtn.dataset.miniPanelStatusBound !== '1') {
      stopBtn.dataset.miniPanelStatusBound = '1';
      stopBtn.addEventListener('click', () => {
        setMiniPanelStatusPhase('transcribing');
      });
    }

    if (pauseBtn && pauseBtn.dataset.miniPanelStatusBound !== '1') {
      pauseBtn.dataset.miniPanelStatusBound = '1';
      pauseBtn.addEventListener('click', () => {
        window.setTimeout(() => {
          const label = String(pauseBtn.textContent || '').trim().toLowerCase();
          if (/resume/.test(label)) {
            setMiniPanelStatusPhase('paused');
          } else {
            setMiniPanelStatusPhase('recording');
          }
        }, 30);
      });
    }

    if (abortBtn && abortBtn.dataset.miniPanelStatusBound !== '1') {
      abortBtn.dataset.miniPanelStatusBound = '1';
      abortBtn.addEventListener('click', () => {
        setMiniPanelStatusPhase('aborted');
      });
    }

    window.addEventListener('transcription:finished', (event) => {
      const detail = event?.detail || {};
      if (detail?.status === 'aborted') {
        setMiniPanelStatusPhase('aborted');
        return;
      }

      if (getAutoGenerateEnabled()) {
        setMiniPanelStatusPhase('note-generating');
      } else {
        setMiniPanelStatusPhase('transcript-completed');
      }
    });

    window.addEventListener('note-generation-finished', (event) => {
      const detail = event?.detail || {};
      if (detail?.status === 'aborted') return;
      setMiniPanelStatusPhase('note-completed');
    });

    window.addEventListener('note:finished', (event) => {
      const detail = event?.detail || {};
      if (detail?.status === 'aborted') return;
      setMiniPanelStatusPhase('note-completed');
    });

    window.addEventListener('app:state-changed', (event) => {
      const reason = String(event?.detail?.reason || '').trim();

      if (reason === 'note-generation-begin') {
        setMiniPanelStatusPhase('note-generating');
      } else if (reason === 'start-recording-click' || reason === 'record-hotkey') {
        setMiniPanelStatusPhase('recording');
      }
    });

    setMiniPanelStatusPhase('idle');
  }

  const app = getApp();
  app.saveState = saveState;
  app.restoreState = restoreState;
  app.reloadWithSavedState = reloadWithSavedState;
  app.emitAppStateChanged = emitAppStateChanged;
  app.noteGenerationInFlight = false;
  app.noteGenerationAbortController = null;
  app.noteGenerationMeta = null;
  app.syncNoteActionButtons = syncNoteActionButtons;
  app.beginNoteGeneration = beginNoteGeneration;
  app.finishNoteGeneration = finishNoteGeneration;
  app.abortNoteGeneration = abortNoteGeneration;
  app.emitNoteFinished = emitNoteFinished;
  app.resetNoteGenerationState = resetNoteGenerationState;
  app.isNoteGenerationBusy = () => !!getApp().noteGenerationInFlight;
  app.isTranscribeBusy = isTranscribeBusy;
  app.getAutoGenerateEnabled = getAutoGenerateEnabled;
  app.setAutoGenerateEnabled = setAutoGenerateEnabled;
  app.getAutoCopyMode = getAutoCopyMode;
  app.setAutoCopyMode = setAutoCopyMode;
  app.isAutoCopyExtensionAvailable = () => isAutoCopyExtensionAvailable();
  app.pingAutoCopyExtension = () => pingAutoCopyExtension();
  app.getUsePromptEnabled = getUsePromptEnabled;
  app.setUsePromptEnabled = setUsePromptEnabled;
  app.initAutoGenerateToggle = initAutoGenerateToggle;
  app.initAutoCopyModeSelect = initAutoCopyModeSelect;
  app.emitTranscriptionFinished = emitTranscriptionFinished;
  app.tryAutoGenerateNote = tryAutoGenerateNote;
  app.initAutoGenerateOnFinishListener = initAutoGenerateOnFinishListener;
  app.getSelectedTranscribeProvider = getSelectedTranscribeProvider;
  app.getSelectedSonioxRegion = getSelectedSonioxRegion;
  app.getSelectedSonioxSpeakerLabels = getSelectedSonioxSpeakerLabels;
  app.getSelectedEffectiveNoteProvider = getSelectedEffectiveNoteProvider;
  app.getSelectedNoteProviderUi = getSelectedNoteProviderUi;
  app.getSelectedOpenAiModel = getSelectedOpenAiModel;
  app.getSelectedVertexModel = getSelectedVertexModel;
  app.getSelectedBedrockModel = getSelectedBedrockModel;
  app.getSelectedNoteProviderMode = getSelectedNoteProviderMode;
  app.getTranscribeProviderSnapshot = getTranscribeProviderSnapshot;
  app.getNoteProviderSnapshot = getNoteProviderSnapshot;
  app.getMiniPanelPromptOptions = getMiniPanelPromptOptions;
  app.getSelectedPromptSlot = getSelectedPromptSlot;
  app.selectPromptSlot = selectPromptSlot;
  app.resolveTranscribeModulePath = resolveTranscribeModulePath;
  app.resolveNoteModulePath = resolveNoteModulePath;
  app.requestNotificationPermissionIfNeeded = requestNotificationPermissionIfNeeded;
  app.showCopiedSystemNotification = showCopiedSystemNotification;
  app.isMiniPanelOpen = isMiniPanelOpen;
  app.providerRegistry = {
    defaults: DEFAULTS,
    deriveNoteUiStateFromEffectiveProvider,
    inferNoteProviderUi,
    normalizeTranscribeProvider,
    resolveTranscribeModulePath,
    resolveNoteModulePath,
  };
  app.loadCachedModule = loadCachedModule;
  app.initRecordingProvider = initRecordingProvider;
  app.initNoteProvider = initNoteProvider;
  app.startRecording = () => {
    document.getElementById('startButton')?.click();
    emitAppStateChanged('start-recording-click');
  };
  app.stopRecording = () => {
    document.getElementById('stopButton')?.click();
    emitAppStateChanged('stop-recording-click');
  };
  app.togglePauseResume = () => {
    document.getElementById('pauseResumeButton')?.click();
    emitAppStateChanged('pause-resume-click');
  };
  app.pauseResumeRecording = () => {
    document.getElementById('pauseResumeButton')?.click();
    emitAppStateChanged('pause-resume-click');
  };
  app.abortRecording = () => {
    document.getElementById('abortButton')?.click();
    emitAppStateChanged('abort-recording-click');
  };
  app.copyGeneratedNote = () => copyGeneratedNoteToClipboard();
  app.copyTranscription = () => copyTranscriptionToClipboard();
  app.setSelectedPromptSlot = (slot) => selectPromptSlot(slot);
  app.getMiniPanelState = () => getMiniPanelState();
  app.openMiniPanel = () => {
    try {
      window.dispatchEvent(new CustomEvent('mini-panel:open-requested', {
        detail: { requestedAt: Date.now() }
      }));
    } catch (_) {}
  };

  pingAutoCopyExtension().catch(() => {
    setAutoCopyExtensionAvailable(false);
  });

  window.addEventListener('focus', () => {
    pingAutoCopyExtension().catch(() => {});
  });

  app.switchNoteProvider = async function switchNoteProvider(next) {
    if (getApp().noteGenerationInFlight) {
      console.warn('[note:switch] Ignored provider switch while note generation is active.');
      syncNoteActionButtons();
      emitAppStateChanged('note-provider-switch-ignored');
      return;
    }

    resetNoteGenerationState();
    delete getApp().__noteStartPulseBound;

    replaceButtonWithClone('generateNoteButton', (clone) => {
      delete clone.dataset.noteStartPulseBound;
      clone.removeAttribute('data-note-start-pulse-bound');
    });

    const abortBtn = document.getElementById('abortNoteButton');
    if (abortBtn) abortBtn.disabled = true;

    writeSession('note_provider', String(next || DEFAULTS.noteProvider).toLowerCase());
    const choice = getSelectedEffectiveNoteProvider();
    const path = resolveNoteModulePath(choice);

    try {
      const mod = await loadCachedModule(path);
      if (mod && typeof mod.initNoteGeneration === 'function') {
        mod.initNoteGeneration();
        getApp().bindNoteStartPulse?.();
        syncNoteActionButtons();
        emitAppStateChanged('note-provider-switched', { provider: choice });
      } else {
        throw new Error('initNoteGeneration() missing');
      }
    } catch (e) {
      reloadWithSavedState('Switch note provider failed, falling back to reload');
    }
  };

  app.switchTranscribeProvider = async function switchTranscribeProvider(next) {
    ['startButton', 'stopButton', 'pauseResumeButton', 'abortButton'].forEach((id) => {
      replaceButtonWithClone(id);
    });

    writeSession('transcribe_provider', String(next || DEFAULTS.transcribeProvider).toLowerCase());
    const provider = getSelectedTranscribeProvider();
    const path = resolveTranscribeModulePath(provider);

    console.info('[recording:switch] provider:', provider, 'module:', path);

    try {
      const mod = await loadCachedModule(path);
      if (mod && typeof mod.initRecording === 'function') {
        mod.initRecording();
        emitAppStateChanged('transcribe-provider-switched', { provider });
      } else {
        throw new Error('initRecording() missing');
      }
    } catch (e) {
      reloadWithSavedState('Switch transcribe provider failed, falling back to reload');
    }
  };

  const abortNoteButton = document.getElementById('abortNoteButton');
  if (abortNoteButton && abortNoteButton.dataset.mainAbortBound !== '1') {
    abortNoteButton.dataset.mainAbortBound = '1';
    abortNoteButton.addEventListener('click', () => {
      abortNoteGeneration();
    });
  }

  const openMiniPanelButton = document.getElementById('openMiniPanelButton');
  if (openMiniPanelButton && openMiniPanelButton.dataset.bound !== '1') {
    openMiniPanelButton.dataset.bound = '1';
    openMiniPanelButton.addEventListener('click', () => {
      getApp().openMiniPanel?.();
      emitAppStateChanged('mini-panel-open-button-click');
    });
  }

  const copyTranscriptionButton = document.getElementById('copyTranscriptionButton');
  if (copyTranscriptionButton) {
    const originalLabel = copyTranscriptionButton.textContent;
    copyTranscriptionButton.addEventListener('click', async () => {
      const ok = copyTranscriptionToClipboard();
      if (!ok) return;
      copyTranscriptionButton.textContent = 'Copied';
      setTimeout(() => { copyTranscriptionButton.textContent = originalLabel; }, 1200);
    });
  }

  window.addEventListener('mini-panel:status', (event) => {
    const open = !!event?.detail?.open;
    getApp().miniPanelOpen = open;
    emitAppStateChanged('mini-panel-status-changed', { open });
  });

  window.addEventListener('note-generation-finished', () => {
    finishNoteGeneration();
  });

  const generatedNoteEl = document.getElementById('generatedNote');
  if (generatedNoteEl && generatedNoteEl.dataset.miniStateBound !== '1') {
    generatedNoteEl.dataset.miniStateBound = '1';
    generatedNoteEl.addEventListener('input', () => {
      emitAppStateChanged('generated-note-input');
    });
  }

  const promptSlotSelect = document.getElementById('promptSlot');
  if (promptSlotSelect && promptSlotSelect.dataset.miniBound !== '1') {
    promptSlotSelect.dataset.miniBound = '1';
    promptSlotSelect.addEventListener('change', () => {
      const slot = String(promptSlotSelect.value || '').trim();
      emitAppStateChanged('prompt-slot-changed', { slot });

      try {
        window.dispatchEvent(new CustomEvent('prompt-slot-selection-changed', {
          detail: {
            profileId: getEffectivePromptProfileId(),
            slot,
          },
        }));
      } catch (_) {}
    });
  }

  const promptSlotNameInput = document.getElementById('promptSlotName');
  if (promptSlotNameInput && promptSlotNameInput.dataset.miniBound !== '1') {
    promptSlotNameInput.dataset.miniBound = '1';

    const emitPromptNamesChanged = () => {
      emitAppStateChanged('prompt-slot-names-changed');
      try {
        window.dispatchEvent(new CustomEvent('prompt-slot-names-changed', {
          detail: { profileId: getEffectivePromptProfileId() }
        }));
      } catch (_) {}
    };

    promptSlotNameInput.addEventListener('input', emitPromptNamesChanged);
    promptSlotNameInput.addEventListener('change', emitPromptNamesChanged);
    promptSlotNameInput.addEventListener('blur', emitPromptNamesChanged);
  }

  const promptProfileInput = document.getElementById('promptProfileInput');
  if (promptProfileInput && promptProfileInput.dataset.miniBound !== '1') {
    promptProfileInput.dataset.miniBound = '1';
    promptProfileInput.addEventListener('change', () => {
      emitAppStateChanged('prompt-profile-changed');
      try {
        window.dispatchEvent(new CustomEvent('prompt-profile-changed', {
          detail: { profileId: getEffectivePromptProfileId() }
        }));
      } catch (_) {}
    });
  }

  const statusMessageEl = document.getElementById('statusMessage');
  if (statusMessageEl && !window.__miniStatusObserverBound) {
    window.__miniStatusObserverBound = true;
    try {
      const observer = new MutationObserver(() => {
        emitAppStateChanged('status-message-mutated');
      });
      observer.observe(statusMessageEl, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    } catch (_) {}
  }

  syncNoteActionButtons();
  restoreState();
  initAutoGenerateToggle();
  initAutoCopyModeSelect();
  initAutoCopyExtensionCopyBridge();
  initMiniPanelStatusPhaseFlow();
  initAutoGenerateOnFinishListener();
  initStatusFlowListeners();
  initNotificationPermissionHooks();

  initRecordingProvider(getSelectedTranscribeProvider());
  initNoteProvider(getSelectedEffectiveNoteProvider());
  initMiniControllerFeature();

  emitAppStateChanged('app-boot-complete');

  if (!document.body.dataset.recordHotkeyBound) {
    document.body.dataset.recordHotkeyBound = '1';
    document.addEventListener('keydown', (event) => {
      const activeElement = document.activeElement;
      if (
        activeElement &&
        (activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          activeElement.isContentEditable)
      ) {
        return;
      }

      if (event.key.toLowerCase() === 'r') {
        const startButton = document.getElementById('startButton');
        const stopButton = document.getElementById('stopButton');

        if (startButton && !startButton.disabled) {
          startButton.click();
          emitAppStateChanged('record-hotkey');
          event.preventDefault();
          return;
        }

        if (stopButton && !stopButton.disabled) {
          stopButton.click();
          emitAppStateChanged('record-hotkey-stop');
          event.preventDefault();
        }
      }
    });
  }
});
