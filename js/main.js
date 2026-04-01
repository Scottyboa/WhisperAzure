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

  function isAutoCopyFinishedNoteEnabled() {
    return localStorage.getItem('autoCopyFinishedNote') === 'true';
  }

  function buildFinishedNoteDetail(meta = {}) {
    const noteEl = document.getElementById('generatedNote');
    const text = String(noteEl?.value || '');
    return {
      status: meta?.aborted ? 'aborted' : 'success',
      text,
      textLength: text.length,
      autoCopyEnabled: isAutoCopyFinishedNoteEnabled(),
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
      }
      return !!ok;
    } catch (_) {
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
    if (!canUseWebNotifications()) return 'unsupported';
    if (Notification.permission === 'granted') return 'granted';
    if (Notification.permission === 'denied') return 'denied';

    try {
      const result = await Notification.requestPermission();
      emitAppStateChanged('notification-permission-result', { permission: result });
      return result;
    } catch (_) {
      return 'default';
    }
  }

  function showCopiedSystemNotification(detail) {
    if (!canUseWebNotifications()) {
      emitAppStateChanged('notification-unsupported');
      return false;
    }

    if (Notification.permission !== 'granted') {
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
    } catch (_) {
      emitAppStateChanged('system-notification-failed');
      return false;
    }
  }

  function tryAutoCopyFinishedNote(detail) {
    const text = String(detail?.text || '').trim();
    if (!text) return;
    if (detail?.status === 'aborted') return;
    if (!isAutoCopyFinishedNoteEnabled()) return;

    const noteEl = document.getElementById('generatedNote');

    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      navigator.clipboard.writeText(text)
        .then(() => {
          emitCopiedEvent(text, 'auto-copy');
          if (shouldShowCopiedSystemNotification(detail)) {
            showCopiedSystemNotification(detail);
          }
        })
        .catch(() => {
          const ok = tryExecCommandCopyFromField(noteEl, text, 'auto-copy');
          if (ok) {
            if (shouldShowCopiedSystemNotification(detail)) {
              showCopiedSystemNotification(detail);
            }
          } else {
            emitAppStateChanged('note-auto-copy-failed', {
              textLength: text.length,
            });
          }
        });
      return;
    }

    const ok = tryExecCommandCopyFromField(noteEl, text, 'auto-copy');
    if (ok) {
      if (shouldShowCopiedSystemNotification(detail)) {
        showCopiedSystemNotification(detail);
      }
    } else {
      emitAppStateChanged('note-auto-copy-failed', {
        textLength: text.length,
      });
    }
  }

  function emitNoteFinished(meta = {}) {
    try {
      const detail = buildFinishedNoteDetail(meta);
      window.dispatchEvent(new CustomEvent('note-generation-finished', { detail }));
      window.dispatchEvent(new CustomEvent('note:finished', { detail }));
      tryAutoCopyFinishedNote(detail);
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

      if (el.checked && isAutoCopyFinishedNoteEnabled()) {
        await requestNotificationPermissionIfNeeded();
      }
    });
  }

  function initNotificationPermissionHooks() {
    const autoCopyToggle = document.getElementById('autoCopyFinishedNoteToggle');
    if (autoCopyToggle && autoCopyToggle.dataset.notificationBound !== '1') {
      autoCopyToggle.dataset.notificationBound = '1';
      autoCopyToggle.addEventListener('change', async () => {
        if (autoCopyToggle.checked) {
          await requestNotificationPermissionIfNeeded();
        }
      });
    }

    const openMiniPanelButton = document.getElementById('openMiniPanelButton');
    if (openMiniPanelButton && openMiniPanelButton.dataset.notificationHintBound !== '1') {
      openMiniPanelButton.dataset.notificationHintBound = '1';
      openMiniPanelButton.addEventListener('click', async () => {
        if (isAutoCopyFinishedNoteEnabled()) {
          await requestNotificationPermissionIfNeeded();
        }
      });
    }
  }

  function emitTranscriptionFinished(opts) {
    try {
      window.dispatchEvent(new CustomEvent('transcription:finished', { detail: opts || {} }));
    } catch (err) {
      try {
        const ev = document.createEvent('CustomEvent');
        ev.initCustomEvent('transcription:finished', false, false, opts || {});
        window.dispatchEvent(ev);
      } catch {}
    }
    emitAppStateChanged('transcription-finished', { detail: opts || {} });
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
        .catch(() => {
          try {
            noteEl?.focus();
            noteEl?.select();
            document.execCommand('copy');
            emitCopied();
          } catch (_) {}
          finally {
            try { window.getSelection()?.removeAllRanges?.(); } catch (_) {}
          }
        });
      return true;
    }

    try {
      noteEl?.focus();
      noteEl?.select();
      document.execCommand('copy');
      emitCopied();
      return true;
    } catch (_) {
      return false;
    } finally {
      try { window.getSelection()?.removeAllRanges?.(); } catch (_) {}
    }
  }

  function getMiniPanelState() {
    const startBtn = document.getElementById('startButton');
    const stopBtn = document.getElementById('stopButton');
    const pauseBtn = document.getElementById('pauseResumeButton');
    const noteEl = document.getElementById('generatedNote');
    const statusEl = document.getElementById('statusMessage');

    return {
      transcribeBusy: !!getApp().isTranscribeBusy?.(),
      noteBusy: !!getApp().isNoteGenerationBusy?.(),
      canStart: !(startBtn?.disabled ?? true),
      canStop: !(stopBtn?.disabled ?? true),
      canPauseResume: !(pauseBtn?.disabled ?? true),
      hasNote: !!String(noteEl?.value || '').trim(),
      statusText: String(statusEl?.innerText || '').trim(),
      pauseResumeLabel: String(pauseBtn?.textContent || '').trim(),
    };
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
  app.initAutoGenerateToggle = initAutoGenerateToggle;
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
  app.copyGeneratedNote = () => copyGeneratedNoteToClipboard();
  app.getMiniPanelState = () => getMiniPanelState();
  app.openMiniPanel = () => {
    try {
      window.dispatchEvent(new CustomEvent('mini-panel:open-requested', {
        detail: { requestedAt: Date.now() }
      }));
    } catch (_) {}
  };

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

  const promptSlotEl = document.getElementById('promptSlot');
  if (promptSlotEl && promptSlotEl.dataset.miniPromptBound !== '1') {
    promptSlotEl.dataset.miniPromptBound = '1';
    promptSlotEl.addEventListener('change', () => {
      emitAppStateChanged('prompt-slot-dom-change', {
        slot: String(promptSlotEl.value || '').trim(),
      });
    });
  }

  window.addEventListener('prompt-slot-selection-changed', (event) => {
    emitAppStateChanged('prompt-slot-selection-event', {
      slot: String(event?.detail?.slot || '').trim(),
    });
  });

  window.addEventListener('prompt-slot-names-changed', () => {
    emitAppStateChanged('prompt-slot-names-changed');
  });

  window.addEventListener('prompt-profile-changed', () => {
    emitAppStateChanged('prompt-profile-changed');
  });

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
  initAutoGenerateOnFinishListener();
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
        if (startButton) {
          startButton.click();
          emitAppStateChanged('record-hotkey');
        }
      }
    });
  }
});
