/* global browser */
'use strict';
const origins = new Set(['https://scottyboa.github.io', 'https://tn-beta.netlify.app']);
let copyQueue = Promise.resolve();

function trustedSender(sender) {
  try { return sender.id === browser.runtime.id && Number.isInteger(sender.tab?.id) && origins.has(new URL(sender.url).origin); }
  catch (_) { return false; }
}

async function copyText(message) {
  if (typeof message.text !== 'string' || !message.text.trim()) return { ok: false, error: 'No text to copy.' };
  let result;
  try {
    await navigator.clipboard.writeText(message.text);
    result = { ok: true };
  } catch (error) { result = { ok: false, error: String(error?.message || 'Clipboard write failed.') }; }
  // Never put clinical content in a desktop notification or log.
  try {
    await browser.notifications.create({ type: 'basic', iconUrl: browser.runtime.getURL('icons/icon128.png'),
      title: 'Auto-copy', message: result.ok ? 'Text copied to clipboard.' : 'Could not copy text. Check the app.' });
  } catch (_) { /* Notification permission does not affect clipboard success. */ }
  return result;
}

async function focusTab(tab) {
  try {
    await browser.tabs.update(tab.id, { active: true });
    const win = await browser.windows.get(tab.windowId);
    await browser.windows.update(tab.windowId, { focused: true, ...(win.state === 'minimized' ? { state: 'normal' } : {}) });
    return { ok: true };
  } catch (error) { return { ok: false, error: String(error?.message || 'Cannot focus this tab.') }; }
}

browser.runtime.onMessage.addListener((message, sender) => {
  if (!trustedSender(sender)) return undefined;
  if (message?.type === 'AUTOCOPY_HEALTH') return Promise.resolve({ ok: typeof navigator.clipboard?.writeText === 'function' });
  if (message?.type === 'FOCUS_THIS_TAB') return focusTab(sender.tab);
  if (message?.type !== 'COPY_TEXT') return undefined;
  // Preserve completion order if several workspaces finish at once.
  const work = copyQueue.then(() => copyText(message));
  copyQueue = work.catch(() => {});
  return work;
});
