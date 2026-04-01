# Refactor Status

This file tracks the structural cleanup that has been completed so far and the
main follow-up items that still make sense.

## Completed

### 1) Smoke-test baseline
A repo-side smoke checklist was added so later refactors can be checked against a
repeatable manual flow.

### 2) `transcribe.html` extraction pass
Large inline runtime blocks were moved into feature modules, including:
- provider persistence / switching UI
- page-level helper UI
- note usage / cost UI
- recording timer / locking UI
- overlays and news / guide logic
- field feedback / counters
- prompt slot controller UI
- analytics logging
- redactor / OCR tools
- ad refresh helper

Result:
`transcribe.html` is less of a control-plane script host and more of a page shell.

### 3) Controller/state cleanup
`js/main.js` was pushed further toward being the single controller owner for the
transcription page.

Result:
dependent modules rely more on controller getters / hooks instead of rebuilding
state from sessionStorage and the DOM.

### 4) Prompt/profile ownership cleanup
`PromptManager` now owns more of the prompt-profile responsibilities that had been
split across page scripts and the prompt-slot UI.

Result:
prompt storage, migration, selected slot, and slot names are more centralized.

### 5) Shared note-generation core
A shared `js/core/note-runner.js` was introduced and multiple note providers were
converted to use it.

Result:
note providers are closer to thin adapters instead of duplicated full flows.

### 6) Shared recording/transcription core
A shared `js/core/recording-runner.js` was introduced and the transcription
providers were moved toward the same helper pattern.

Result:
recording-side modules now share more of the lifecycle plumbing and binding logic.

### 7) Provider registry centralization
A shared `js/core/provider-registry.js` now owns provider metadata and module
resolution instead of repeating those maps in multiple places.

Result:
provider-aware modules can derive provider state from one canonical source.

### 8) Dead compatibility cleanup
The old placeholder `ui.js` pattern was cleaned up and the index-page accordion
ownership was made more explicit.

Result:
less surplus compatibility structure remains.

## Still worth doing later

These are follow-up improvements, not blockers:

### A) Filename cleanup
Some legacy filenames are still awkward or inconsistent, especially:
- `notegeneration gpt-5.js`

A future pass could rename these and update imports in one careful sweep.

### B) Soniox consolidation
`SONIOX_UPDATE.js` and `SONIOX_UPDATE_dia.js` still exist as separate modules.
If their differences stay limited to one mode/flag, they may be mergeable.

### C) Pricing centralization audit
Some cost tables and provider-specific pricing logic may still live close to
individual provider modules. A later pass can decide whether to centralize all of
that into one pricing registry.

### D) Automated regression checks
The current smoke checklist is manual. The next maturity step would be adding a
small automated browser test set for:
- provider switching
- prompt persistence
- note generation
- recording start/stop/abort
- overlay open/close behavior

### E) Developer onboarding docs
A short `README` or `DEVELOPER_GUIDE` could document:
- how provider modules are registered
- where prompt/profile state lives
- how to add a new provider
- where to put page-level UI code vs controller code

## Current maintenance rule of thumb

When making future changes:

- put page orchestration in `main.js`
- put provider metadata in `provider-registry.js`
- put prompt/profile persistence in `PromptManager`
- put reusable provider lifecycle helpers in `js/core/`
- keep provider modules thin
- avoid reintroducing large inline scripts into HTML pages
