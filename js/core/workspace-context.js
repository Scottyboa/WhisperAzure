// Explicit DOM, storage and event ownership for one Workspace. This is a
// compatibility adapter for the existing feature modules, not a browser realm.
// Async callbacks close over this context; the active Workspace is never used
// to decide where a provider response belongs.
const sharedSessionKeys = new Set([
  'openai_api_key', 'soniox_api_key', 'mistral_api_key', 'requesty_api_key',
  'bedrock_backend_url', 'bedrock_backend_secret', 'redactor_general_terms_session',
  'whisper_cloud_backup_active_provider_v1', 'whisper_cloud_backup_keys_provider_v1',
  'whisper_cloud_backup_password_v1::oneDrive', 'whisper_cloud_backup_password_v1::googleDrive',
]);
const localWorkspaceKeys = new Set(['redactor_visible', 'auto_clear_supplementary', 'auto_clear_note']);

export function createScopedStorage(store, id, session = true) {
  const prefix = `whisper_workspace_runtime::${id}::`;
  const scoped = key => session ? !sharedSessionKeys.has(key)
    : localWorkspaceKeys.has(key) || key.startsWith('prompt_selected_slot::');
  const keyFor = key => scoped(String(key)) ? prefix + String(key) : String(key);
  const keys = () => Array.from({ length: store.length }, (_, i) => store.key(i))
    .filter(key => key && (key.startsWith(prefix) || (!key.startsWith('whisper_workspace_runtime::') && !scoped(key))))
    .map(key => key.startsWith(prefix) ? key.slice(prefix.length) : key);
  return Object.freeze({
    getItem: key => store.getItem(keyFor(key)),
    setItem: (key, value) => store.setItem(keyFor(key), String(value)),
    removeItem: key => store.removeItem(keyFor(key)),
    key: i => keys()[i] ?? null,
    get length() { return keys().length; },
    clear() { keys().filter(scoped).forEach(key => store.removeItem(keyFor(key))); },
  });
}

export function nativeWorkspaceContext(host = window) {
  return {
    window: host, document: host.document,
    sessionStorage: host.sessionStorage, localStorage: host.localStorage,
    setTimeout: host.setTimeout.bind(host), clearTimeout: host.clearTimeout.bind(host),
    setInterval: host.setInterval.bind(host), clearInterval: host.clearInterval.bind(host),
    requestAnimationFrame: host.requestAnimationFrame.bind(host), cancelAnimationFrame: host.cancelAnimationFrame.bind(host),
    MutationObserver: host.MutationObserver, ResizeObserver: host.ResizeObserver,
  };
}

export function createWorkspaceContext({ id, root, host = window }) {
  const nativeDoc = host.document;
  const events = new EventTarget();
  const sessionStorage = createScopedStorage(host.sessionStorage, id);
  const localStorage = createScopedStorage(host.localStorage, id, false);
  const body = root.querySelector('[data-workspace-body]');
  const head = root.querySelector('[data-workspace-head]');
  const html = root.querySelector('[data-workspace-html]');
  const timers = new Set(), intervals = new Set(), frames = new Set(), observers = new Set();
  const listeners = [];
  let closed = false, readyState = 'loading';
  const context = { sessionStorage, localStorage };
  context.setTimeout = (fn, ms, ...args) => {
    if (closed) return 0;
    const timer = host.setTimeout(() => { timers.delete(timer); if (!closed) fn(...args); }, ms);
    timers.add(timer); return timer;
  };
  context.clearTimeout = timer => { timers.delete(timer); host.clearTimeout(timer); };
  context.setInterval = (fn, ms, ...args) => {
    if (closed) return 0;
    const timer = host.setInterval(() => { if (!closed) fn(...args); }, ms);
    intervals.add(timer); return timer;
  };
  context.clearInterval = timer => { intervals.delete(timer); host.clearInterval(timer); };
  context.requestAnimationFrame = fn => {
    if (closed) return 0;
    const frame = host.requestAnimationFrame(time => { frames.delete(frame); if (!closed) fn(time); });
    frames.add(frame); return frame;
  };
  context.cancelAnimationFrame = frame => { frames.delete(frame); host.cancelAnimationFrame(frame); };
  for (const name of ['MutationObserver', 'ResizeObserver']) {
    context[name] = class extends host[name] {
      constructor(callback) { super((...args) => { if (!closed) callback(...args); }); observers.add(this); }
      disconnect() { super.disconnect(); observers.delete(this); }
      observe(...args) { if (!closed) { observers.add(this); return super.observe(...args); } }
    };
  }
  function listen(target, type, fn, options) {
    if (closed) return;
    target.addEventListener(type, fn, options);
    listeners.push([target, type, fn, options]);
  }
  const documentValues = {
    body, head, documentElement: html,
    getElementById: id => root.getElementById(id),
    querySelector: selector => selector === 'body' ? body : selector === 'html' ? html : root.querySelector(selector),
    querySelectorAll: selector => root.querySelectorAll(selector),
    addEventListener: (type, fn, options) => listen(root, type, fn, options),
    removeEventListener: (...args) => root.removeEventListener(...args),
    dispatchEvent: event => root.dispatchEvent(event),
    hasFocus: () => nativeDoc.hasFocus() && root.host.contains(nativeDoc.activeElement),
  };
  context.document = new Proxy(documentValues, {
    get(target, key) {
      if (key === 'readyState') return readyState;
      if (key === 'activeElement') return root.activeElement;
      if (key === 'defaultView') return context.window;
      if (key in target) return target[key];
      const value = nativeDoc[key];
      return typeof value === 'function' ? value.bind(nativeDoc) : value;
    },
    set(target, key, value) { target[key] = value; return true; },
  });
  const values = {
    ...context, document: context.document,
    __workspacePresetFrame: true, // legacy feature guard: shell services belong to the host
    __workspaceSharedRuntime: true, __workspacePresetRuntimeId: id,
    parent: host, top: host,
    addEventListener: (type, fn, options) => listen(events, type, fn, options),
    removeEventListener: (...args) => events.removeEventListener(...args),
    dispatchEvent: event => !closed && events.dispatchEvent(event),
    postMessage: (...args) => host.postMessage(...args),
    __openMiniPanel: () => host.__openMiniPanel?.(),
    __workspacePresetRawStorage: {
      getSession: key => host.sessionStorage.getItem(key),
      setSession: (key, value) => host.sessionStorage.setItem(key, value),
      removeSession: key => host.sessionStorage.removeItem(key),
    },
  };
  context.window = new Proxy(values, {
    get(target, key) {
      if (key === 'window' || key === 'self') return context.window;
      if (key in target) return target[key];
      if (typeof key === 'string' && key.startsWith('__')) return undefined;
      const value = host[key];
      return typeof value === 'function' && typeof key === 'string' && /^[a-z]/.test(key)
        ? value.bind(host) : value;
    },
    set(target, key, value) { target[key] = value; return true; },
  });
  // MessageEvent.source must be the context facade for the existing origin check.
  const messageBridge = event => {
    if (event.source !== host || event.origin !== host.location.origin) return;
    const data = event.data;
    if (!data || !String(data.type).startsWith('AUTO_COPY_')) return;
    if (data.type === 'AUTO_COPY_EXTENSION_COPY_RESULT' && data.workspaceId !== id) return;
    const forwarded = new MessageEvent('message', { data, origin: event.origin });
    Object.defineProperty(forwarded, 'source', { value: context.window });
    events.dispatchEvent(forwarded);
  };
  listen(host, 'message', messageBridge);
  for (const name of ['focus', 'blur', 'storage']) listen(host, name, event => {
    if (name === 'storage') events.dispatchEvent(new StorageEvent('storage', {
      key: event.key, oldValue: event.oldValue, newValue: event.newValue, url: event.url,
    }));
    else events.dispatchEvent(new Event(name));
  });
  const languageSelect = root.getElementById('lang-select-transcribe');
  listen(host, 'transcribe-language-updated', event => {
    if (!languageSelect) return;
    languageSelect.value = event.detail?.lang || host.localStorage.getItem('siteLanguage') || 'en';
    html.lang = languageSelect.value;
    languageSelect.dispatchEvent(new Event('change'));
  });
  return Object.assign(context, {
    ready() {
      if (closed) return;
      readyState = 'interactive';
      root.dispatchEvent(new Event('DOMContentLoaded'));
      readyState = 'complete';
      events.dispatchEvent(new Event('load'));
    },
    close() {
      if (closed) return;
      closed = true;
      timers.forEach(t => host.clearTimeout(t)); intervals.forEach(t => host.clearInterval(t));
      frames.forEach(t => host.cancelAnimationFrame(t)); observers.forEach(o => o.disconnect());
      listeners.forEach(([target,type,fn,options]) => target.removeEventListener(type,fn,options));
      timers.clear(); intervals.clear(); frames.clear(); observers.clear(); listeners.length = 0;
      for (const key of Object.keys(values)) delete values[key];
    },
    get closed() { return closed; },
  });
}
