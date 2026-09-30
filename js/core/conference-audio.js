import { registerWorkspaceDisposer } from './workspace-disposal.js';

// One mixer and sharing session per Workspace runtime. Only the mixed audio
// stream reaches STT; captured video is never rendered, recorded or uploaded.
const SETTING_KEY = 'conference_audio_enabled';
const FALLBACK = {
  label: 'Include conference audio',
  tooltip: "This feature lets you record online conversations and consultations, including video calls. It records your voice through the microphone and the other person’s voice that you hear through your computer speakers or headset. It works best in desktop Chrome or Edge; Chrome is recommended for the app overall. Enable “Include conference audio” before clicking “Start Recording”. In Chrome’s sharing dialog, select a screen under “Entire Screen”, enable “Also share system audio”, and click “Share”. System audio may include notifications and sounds from other apps. Only audio is sent for transcription. Without shared audio, recording uses the microphone only. Pause pauses both sources. Stop and Abort end recording but keep sharing ready for the next Start, so you normally only choose the source once. No new audio is recorded or sent between recordings. Uncheck this option to end sharing. The browser’s sharing indicator stays on until sharing ends.",
  waiting: "Select Entire Screen and enable Also share system audio. If unavailable, try Chrome Tab with Also share tab audio.",
  active: 'Microphone + conference audio',
  ready: "Conference audio sharing is ready for the next recording. No new audio is being recorded. Uncheck to end sharing.",
  paused: 'Conference audio paused; sharing remains selected.',
  noAudio: "No shared audio was provided. Recording uses the microphone only. To include the call, stop and start again and enable audio in the sharing dialog.",
  cancelled: 'Audio sharing was cancelled or blocked. Recording uses the microphone only.',
  ended: 'Conference audio sharing ended. Recording continues with the microphone only.',
  unsupported: 'Conference audio sharing is unavailable in this browser. Use desktop Chrome or Edge. Microphone recording remains available.',
};
let sharing = null;
let sharingVersion = 0;
let notice = '';
let paused = false;
let locked = false;
let initialized = false;
const inputs = new Map();

function parentWindow() {
  try { return window.parent && window.parent !== window ? window.parent : null; } catch (_) { return null; }
}
function strings() {
  let parentText;
  try { parentText = parentWindow()?.__conferenceAudioI18n; } catch (_) {}
  return { ...FALLBACK, ...(parentText || window.__conferenceAudioI18n || {}) };
}
function supported() { return typeof window.navigator?.mediaDevices?.getDisplayMedia === 'function'; }
function stopTracks(stream) { stream?.getTracks().forEach(track => { try { track.stop(); } catch (_) {} }); }
function render() {
  const text = strings();
  const checkbox = document.getElementById('conferenceAudioToggle');
  if (checkbox) {
    // Ending an existing share is always available. Starting a new share
    // still requires the next Start click and its browser permission dialog.
    checkbox.disabled = !supported() || (locked && !checkbox.checked);
    checkbox.setAttribute('aria-label', text.label);
  }
  const label = document.getElementById('conferenceAudioLabel');
  if (label) label.textContent = text.label;
  const help = document.getElementById('conferenceAudioTooltipText');
  if (help) help.textContent = text.tooltip;
  document.getElementById('conferenceAudioTooltipContainer')?.setAttribute('aria-label', text.tooltip);
  const status = document.getElementById('conferenceAudioStatus');
  if (status) {
    const key = !supported() ? 'unsupported' : notice;
    status.textContent = key ? text[key] || '' : '';
    status.hidden = !status.textContent;
  }
}

export function initConferenceAudioUi() {
  if (initialized) return;
  initialized = true;
  const checkbox = document.getElementById('conferenceAudioToggle');
  if (!checkbox) return;
  try { checkbox.checked = sessionStorage.getItem(SETTING_KEY) === '1'; } catch (_) {}
  checkbox.addEventListener('change', () => {
    try { sessionStorage.setItem(SETTING_KEY, checkbox.checked ? '1' : '0'); } catch (_) {}
    if (!checkbox.checked) stopConferenceSharing();
    if (!locked) notice = '';
    render();
  });
  window.addEventListener('conference-audio-i18n-changed', render);
  // The visible language selector belongs to the app shell, while recording
  // controls live in Workspace frames. Follow shell changes without touching
  // the active capture or the per-Workspace checkbox setting.
  try {
    const parent = parentWindow();
    if (parent) {
      parent.addEventListener('conference-audio-i18n-changed', render);
      registerWorkspaceDisposer(() => parent.removeEventListener('conference-audio-i18n-changed', render), { scope: 'window' });
    }
  } catch (_) {}
  render();
}

export function lockConferenceAudio(shouldLock) { locked = Boolean(shouldLock); render(); }

export function releaseRecordingInputStream(stream) {
  const dispose = inputs.get(stream);
  if (dispose) dispose();
  else stopTracks(stream);
}

export function releaseRecordingInputs() {
  for (const dispose of [...inputs.values()]) dispose();
}

export function stopConferenceSharing() {
  sharingVersion += 1; // Invalidates an outstanding picker after Abort/close.
  const previous = sharing;
  sharing = null;
  if (previous) {
    previous.stream.getTracks().forEach(track => track.removeEventListener('ended', previous.onEnded));
    stopTracks(previous.stream);
  }
  paused = false;
  notice = '';
  render();
}

export function disposeConferenceAudio() {
  stopConferenceSharing();
  releaseRecordingInputs();
  locked = false;
  render();
}

export function finishConferenceRecording() {
  sharingVersion += 1; // Reject a picker that resolves after Stop/Abort.
  releaseRecordingInputs();
  paused = true;
  if (sharing) {
    sharing.audio.enabled = false;
    notice = 'ready';
  }
  locked = false;
  render();
}

export function pauseConferenceAudio(shouldPause) {
  paused = Boolean(shouldPause);
  if (sharing) {
    sharing.audio.enabled = !paused;
    notice = paused ? 'paused' : 'active';
  }
  render();
}

// Called synchronously from the recording click handler, before any provider
// connection, model download or microphone permission can consume activation.
export async function prepareConferenceAudio(operation) {
  releaseRecordingInputs();
  lockConferenceAudio(true);
  if (!document.getElementById('conferenceAudioToggle')?.checked) {
    stopConferenceSharing();
    return;
  }
  if (!supported()) { notice = 'unsupported'; render(); return; }
  if (sharing?.audio.readyState === 'live') {
    pauseConferenceAudio(false);
    return;
  }
  stopConferenceSharing();
  const version = sharingVersion;
  notice = 'waiting'; render();
  try {
    const stream = await operation.wait(window.navigator.mediaDevices.getDisplayMedia({
      video: { displaySurface: 'monitor', frameRate: 1 },
      audio: { suppressLocalAudioPlayback: false },
      selfBrowserSurface: 'exclude',
      systemAudio: 'include',
      surfaceSwitching: 'exclude',
    }), stopTracks);
    operation.check();
    if (version !== sharingVersion) { stopTracks(stream); throw new Error('Conference sharing was superseded.'); }
    const audio = stream.getAudioTracks().find(track => track.readyState === 'live');
    if (!audio) { stopTracks(stream); notice = 'noAudio'; render(); return; }
    const onEnded = () => {
      if (sharing?.stream !== stream) return;
      stopConferenceSharing();
      notice = 'ended'; render();
    };
    sharing = { stream, audio, onEnded };
    // Keep the display video track alive: stopping it can end tab audio on
    // some platforms. It stays local and is stopped with the sharing session.
    stream.getTracks().forEach(track => track.addEventListener('ended', onEnded));
    notice = 'active'; render();
  } catch (error) {
    operation.check(); // Abort/timeout is not a microphone-only fallback.
    if (version !== sharingVersion) throw error;
    notice = 'cancelled'; render();
  }
}

export async function acquireRecordingInputStream(constraints, operation) {
  let mic, context, output;
  const nodes = [];
  let released = false;
  const dispose = () => {
    if (released) return;
    released = true;
    operation.signal.removeEventListener('abort', dispose);
    inputs.delete(output);
    nodes.forEach(node => { try { node.disconnect(); } catch (_) {} });
    stopTracks(mic);
    if (output !== mic) stopTracks(output);
    if (context) { try { void context.close().catch(() => {}); } catch (_) {} }
  };
  try {
    mic = await operation.wait(window.navigator.mediaDevices.getUserMedia(constraints), stopTracks);
    operation.check();
    if (!sharing || sharing.audio.readyState !== 'live') {
      output = mic;
    } else {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      context = new AudioContextClass();
      const destination = context.createMediaStreamDestination();
      destination.channelCount = 1;
      destination.channelCountMode = 'explicit';
      output = destination.stream;
      // Headroom for simultaneous speech. Neither source is connected to
      // context.destination, avoiding playback, feedback and duplicate audio.
      for (const stream of [mic, sharing.stream]) {
        const source = context.createMediaStreamSource(stream);
        const gain = context.createGain();
        gain.gain.value = 0.5;
        source.connect(gain); gain.connect(destination);
        nodes.push(source, gain);
      }
    }
    inputs.set(output, dispose);
    operation.signal.addEventListener('abort', dispose, { once: true });
    operation.check();
    if (context?.state === 'suspended') await operation.wait(context.resume());
    operation.check();
    if (context && context.state !== 'running') throw new Error('Conference audio mixer could not start.');
    return output;
  } catch (error) { dispose(); throw error; }
}

registerWorkspaceDisposer(disposeConferenceAudio);
