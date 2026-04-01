import {
  DEFAULTS,
  getNoteProviderLogLabel,
  normalizeNoteMode,
  normalizeTranscribeProvider,
  resolveEffectiveNoteProvider,
} from '../core/provider-registry.js';

const ANALYTICS_ENDPOINT =
  'https://script.google.com/macros/s/AKfycbz3bpMrPJXAtyNCIoj6h2v3GewLRF90dQeEpC81F_m9rNClLVMUuQEGVO8yinlhssc/exec';

function safeLocalStorageGet(key) {
  try {
    return localStorage.getItem(key);
  } catch (_) {
    return null;
  }
}

function safeLocalStorageSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (_) {}
}

function safeSessionStorageGet(key) {
  try {
    return sessionStorage.getItem(key);
  } catch (_) {
    return null;
  }
}

function getOrCreateVisitorId() {
  let visitorId = safeLocalStorageGet('visitorId');
  if (!visitorId) {
    visitorId =
      (crypto.randomUUID && crypto.randomUUID()) ||
      Math.random().toString(36).slice(2, 11);
    safeLocalStorageSet('visitorId', visitorId);
  }
  return visitorId;
}

function getApp() {
  return window.__app || null;
}

function getTranscribeProviderSnapshot() {
  const app = getApp();
  if (app && typeof app.getTranscribeProviderSnapshot === 'function') {
    try {
      return app.getTranscribeProviderSnapshot() || {};
    } catch (_) {}
  }

  const transcribeProvider = normalizeTranscribeProvider(
    document.getElementById('transcribeProvider')?.value ||
      safeSessionStorageGet('transcribe_provider') ||
      DEFAULTS.transcribeProvider
  );

  return {
    transcribeProvider,
    sonioxSpeakerLabels:
      document.getElementById('sonioxSpeakerLabels')?.value ||
      safeSessionStorageGet('soniox_speaker_labels') ||
      DEFAULTS.sonioxSpeakerLabels,
    sonioxRegion:
      document.getElementById('sonioxRegion')?.value ||
      safeSessionStorageGet('soniox_region') ||
      DEFAULTS.sonioxRegion,
  };
}

function getNoteProviderSnapshot() {
  const app = getApp();
  if (app && typeof app.getNoteProviderSnapshot === 'function') {
    try {
      const snapshot = app.getNoteProviderSnapshot() || {};
      return {
        noteProviderUi: snapshot.noteProviderUi || '',
        noteProviderEffective:
          snapshot.noteProviderLogLabel || snapshot.noteProviderEffective || '',
        noteProviderMode: snapshot.noteProviderMode || '',
        openaiModel: snapshot.openaiModel || '',
        vertexModel: snapshot.vertexModel || '',
        bedrockModel: snapshot.bedrockModel || '',
      };
    } catch (_) {}
  }

  const uiProvider =
    document.getElementById('noteProvider')?.value ||
    safeSessionStorageGet('note_provider_ui') ||
    DEFAULTS.noteProvider;

  const openaiModel =
    document.getElementById('openaiModel')?.value ||
    safeSessionStorageGet('openai_model') ||
    DEFAULTS.openaiModel;

  const noteProviderMode = normalizeNoteMode(
    document.getElementById('noteProviderMode')?.value ||
      safeSessionStorageGet('note_provider_mode') ||
      DEFAULTS.noteMode
  );

  const vertexModel =
    document.getElementById('vertexModel')?.value ||
    safeSessionStorageGet('vertex_model') ||
    DEFAULTS.vertexModel;

  const bedrockModel =
    document.getElementById('bedrockModel')?.value ||
    safeSessionStorageGet('bedrock_model') ||
    DEFAULTS.bedrockModel;

  const effectiveProvider = resolveEffectiveNoteProvider({
    provider: uiProvider,
    openaiModel,
    noteMode: noteProviderMode,
  });

  return {
    noteProviderUi: uiProvider,
    noteProviderEffective: getNoteProviderLogLabel({
      effectiveProvider,
      openaiModel,
      vertexModel,
      bedrockModel,
    }),
    noteProviderMode,
    openaiModel,
    vertexModel,
    bedrockModel,
  };
}

function logEvent(params = {}) {
  const visitorId = getOrCreateVisitorId();
  const qs = new URLSearchParams({
    visitorId,
    page: window.location.pathname,
    userAgent: navigator.userAgent,
    referrer: document.referrer,
    ...params,
  }).toString();

  try {
    fetch(`${ANALYTICS_ENDPOINT}?${qs}`, {
      mode: 'no-cors',
      keepalive: true,
    });
  } catch (_) {}
}

function wireAnalyticsClickLogging() {
  document.addEventListener(
    'click',
    (event) => {
      const btn =
        event.target && event.target.closest
          ? event.target.closest('button')
          : null;
      const id = btn && btn.id;

      if (id === 'stopButton') {
        logEvent({ action: 'stopRecording', ...getTranscribeProviderSnapshot() });
        return;
      }

      if (id === 'abortButton') {
        logEvent({ action: 'abortRecording', ...getTranscribeProviderSnapshot() });
        return;
      }

      if (id === 'generateNoteButton') {
        logEvent({ action: 'noteGeneration', ...getNoteProviderSnapshot() });
        return;
      }

      if (id === 'medicalCalcOpenBtn') {
        const select = document.getElementById('medicalCalcSelect');
        const href = select?.value || '';
        const label = (select?.selectedOptions?.[0]?.textContent || '').trim();

        if (href) {
          logEvent({ action: `openClinicalTool|${href}|${label}` });
        }
      }
    },
    true
  );
}

window.logEvent = logEvent;
window.__analytics = {
  getOrCreateVisitorId,
  getTranscribeProviderSnapshot,
  getNoteProviderSnapshot,
  logEvent,
};

document.addEventListener('DOMContentLoaded', () => {
  logEvent({ action: 'pageview' });
  wireAnalyticsClickLogging();
});
