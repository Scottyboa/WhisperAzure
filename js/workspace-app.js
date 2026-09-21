import { createWorkspaceModules, workspaceEntries } from './generated/workspace-modules.js';
import { createWorkspaceContext, nativeWorkspaceContext } from './core/workspace-context.js';

// Capture pristine view markup once, before feature initialization adds state,
// listeners or patient content. No Workspace loads another HTML application.
const viewTemplate = document.createElement('template');
for (const selector of ['.recording-area', '.bottom-half', '#noteHistoryModal']) {
  const node = document.querySelector(selector);
  if (node) viewTemplate.content.append(node.cloneNode(true));
}
const languageTemplate = document.getElementById('lang-select-transcribe')?.cloneNode(true);
const sheets = [];
for (const sheet of document.styleSheets) {
  try {
    const sharedSheet = new CSSStyleSheet();
    sharedSheet.replaceSync(Array.from(sheet.cssRules, rule => rule.cssText).join('\n'));
    sheets.push(sharedSheet);
  } catch { /* Cross-origin font sheets already apply to the host page. */ }
}
const viewSheet = new CSSStyleSheet();
viewSheet.replaceSync(':host{display:block;width:100%;color:#333;font-family:Arial,sans-serif} [data-workspace-body]{margin:0;padding:0} .recording-area{margin-top:0!important} .bottom-half{margin-bottom:0!important}');
sheets.push(viewSheet);

export function createWorkspaceView(id, container) {
  const element = document.createElement('section');
  element.className = 'workspace-preset-view';
  element.dataset.workspaceId = id;
  const root = element.attachShadow({ mode: 'open' });
  root.adoptedStyleSheets = sheets;
  const html = document.createElement('div'); html.dataset.workspaceHtml = '';
  html.lang = document.documentElement.lang;
  const head = document.createElement('div'); head.dataset.workspaceHead = '';
  const body = document.createElement('div'); body.dataset.workspaceBody = '';
  if (languageTemplate) { const language = languageTemplate.cloneNode(true); language.hidden = true; body.append(language); }
  body.append(viewTemplate.content.cloneNode(true));
  html.append(head, body); root.append(html); container.append(element);
  const context = createWorkspaceContext({ id, root });
  const modules = createWorkspaceModules(context);
  try {
    workspaceEntries.forEach(modules.load);
    context.ready();
  } catch (error) {
    void context.window.__app?.disposeWorkspaceResources?.({ reason: 'initialization-failed', final: true });
    context.close(); modules.close(); element.remove(); throw error;
  }
  return { element, root, context, modules, win: context.window, doc: context.document };
}

const primaryModules = createWorkspaceModules(nativeWorkspaceContext());
workspaceEntries.forEach(primaryModules.load);
// The shared shell (Mini Panel, navigation, overlays and Workspace manager)
// remains a single instance in the real document.
