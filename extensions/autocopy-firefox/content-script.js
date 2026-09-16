/* global browser */
'use strict';
(() => {
  let last = null;
  function announce() {
    return browser.runtime.sendMessage({ type: 'AUTOCOPY_HEALTH' }).then(result => {
      if (!result?.ok) return;
      window.postMessage({ type: 'AUTO_COPY_EXTENSION_PRESENT', browser: 'firefox', version: '1.0.0',
        capabilities: ['copy', 'focus-tab', 'redactor-autocopy', 'event-bridge-v1'] }, location.origin);
    }).catch(() => {});
  }
  function mode() { return document.getElementById('autoCopyModeSelect')?.value || 'off'; }

  window.addEventListener('message', async event => {
    if (event.source !== window || event.origin !== location.origin) return;
    const data = event.data;
    if (!data || typeof data !== 'object') return;
    if (data.type === 'AUTO_COPY_EXTENSION_PING') { void announce(); return; }
    if (data.type === 'AUTO_COPY_EXTENSION_FOCUS_TAB') {
      try { await browser.runtime.sendMessage({ type: 'FOCUS_THIS_TAB' }); } catch (_) {}
      return;
    }
    // The page forwards sanitized plain data rather than CustomEvent.detail,
    // which Firefox isolates from extension content-script realms.
    if (data.type !== 'AUTO_COPY_APP_EVENT') return;
    if (data.reset) { last = null; return; }
    if (!['note', 'transcript'].includes(data.copyKind) || typeof data.text !== 'string' || !data.text.trim()) return;
    if (data.aborted || data.failed) return;
    const redactor = data.sourceEvent === 'redactor:autocopy';
    if (redactor ? !document.getElementById('redactorAutocopyToggle')?.checked : mode() !== data.copyKind) return;
    if (last && last.kind === data.copyKind && last.text === data.text && Date.now() - last.at < 2000) return;
    const marker = { kind: data.copyKind, text: data.text, at: Date.now() };
    last = marker;
    let result;
    try { result = await browser.runtime.sendMessage({ type: 'COPY_TEXT', text: data.text, copyKind: data.copyKind }); }
    catch (error) { result = { ok: false, error: String(error?.message || error) }; }
    if (!result?.ok && last === marker) last = null;
    // Release the text after duplicate-event suppression; no persistent storage.
    setTimeout(() => { if (last === marker) last = null; }, 2100);
    window.postMessage({ type: 'AUTO_COPY_EXTENSION_COPY_RESULT', ok: !!result?.ok,
      copyKind: data.copyKind, sourceEvent: data.sourceEvent, textLength: data.text.length,
      reason: result?.error || '' }, location.origin);
  });
  void announce();
})();
