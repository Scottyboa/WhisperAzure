# Architecture

This document describes the current front-end structure of the app after the refactor pass.

## High-level page model

The app has two browser entry pages:

- `index.html`
  - landing page
  - key / backend credential entry
  - provider setup guides
  - language selection
  - accordion-based informational content
- `transcribe.html`
  - transcription workflow
  - note generation workflow
  - prompt slot UI
  - redactor / OCR tools
  - usage / cost display
  - runtime overlays and status helpers

## JavaScript layout

### 1) App controller

`js/main.js` is the runtime controller for the transcription page.

It owns:
- page bootstrapping for the transcription page
- provider switching
- UI state save / restore
- busy-state coordination
- note-generation lifecycle hooks
- shared app methods exposed on `window.__app`

`js/main-index.js` is the smaller entrypoint for the landing page.

### 2) Core modules

`js/core/` contains shared infrastructure that multiple providers or features depend on.

Current core responsibilities:

- `provider-registry.js`
  - canonical provider metadata
  - transcribe provider resolution
  - note provider resolution
  - effective note-provider derivation
  - module path lookups
  - provider-family helpers / defaults

- `note-runner.js`
  - shared note-generation lifecycle
  - input gathering
  - abort handling
  - timer handling
  - common stream helpers
  - usage normalization helpers
  - shared button binding

- `recording-runner.js`
  - shared recording helper utilities
  - idempotent UI binding scope
  - safe page-load mic shutdown
  - guarded VAD flush helpers
  - common recording control helpers

### 3) Feature modules

`js/features/` contains page-level behavior that is not itself a provider implementation.

Current feature responsibilities include:

- `provider-persistence.js`
  - session/local storage for selected providers and related UI fields
  - restoration of provider-related UI state
  - runtime provider switching through `window.__app`

- `page-ui.js`
  - small page-level toggles and helper UI
  - auto-copy / auto-clear / prompt toggle helpers

- `recording-ui.js`
  - recording timer UI
  - locking provider switching while recording is active
  - controller-aware busy-state reactions

- `field-feedback.js`
  - word/token counters
  - completion flash / pulse helpers
  - UI-only reactions to runtime events

- `note-usage-cost.js`
  - note usage display
  - note cost display
  - provider/model-aware cost estimation

- `analytics.js`
  - page analytics / action logging
  - controller-aware provider snapshots

- `overlays.js`
  - guide overlay
  - news overlay
  - billing/cost links overlay
  - medical calculator picker
  - copy-note helper

- `editor-tools.js`
  - redactor helpers
  - OCR helpers
  - supplementary-field helper utilities

- `prompt-slots-ui.js`
  - prompt slot rendering
  - prompt slot ordering / selection
  - prompt import/export UI
  - PromptManager-backed prompt profile interactions

- `ad-refresh.js`
  - refresh throttling for ad slots when key actions happen

### 4) State / prompt ownership

`js/promptManager.js` is the main owner of prompt-profile state.

It owns:
- prompt profile ID
- legacy prompt migration
- prompt storage per slot
- slot name persistence
- selected slot persistence
- prompt import / export helpers

UI modules should consume PromptManager APIs rather than writing profile-scoped
storage keys directly.

### 5) Provider modules

Providers should be thin adapters over the shared core modules.

#### Note providers
Examples:
- `js/noteGeneration.js`
- `js/noteGeneration_gpt52.js`
- `js/noteGeneration_gpt52_NS.js`
- `js/noteGeneration_gpt54.js`
- `js/noteGeneration_gpt5_NS.js`
- `js/notegeneration gpt-5.js`
- `js/MistralTXT.js`
- `js/LemonfoxTXT.js`
- `js/Gemini3.js`
- `js/GeminiVertex.js`
- `js/AWSBedrock.js`

Expected role of a note provider:
- read provider-specific credentials / model settings
- build provider-specific requests
- interpret provider-specific streamed or final responses
- delegate common lifecycle behavior to `note-runner.js`

#### Transcription providers
Examples:
- `js/recording.js`
- `js/deepgram_nova3.js`
- `js/LemonfoxSTT.js`
- `js/SONIOX_UPDATE.js`
- `js/SONIOX_UPDATE_dia.js`
- `js/VoxtralminiSTT.js`

Expected role of a transcription provider:
- implement provider-specific transcription transport / queue behavior
- keep provider-specific VAD or request details
- delegate common binding / shutdown / guarded flush behavior to `recording-runner.js`

## Storage conventions

### sessionStorage
Used for runtime secrets / session-lifetime settings such as:
- API keys
- backend URLs
- backend secrets
- active provider selections
- provider-specific runtime options

### localStorage
Used for device-persistent user preferences such as:
- selected site language
- prompt profile ID
- prompt slot content / names
- selected prompt slot

## Design rules going forward

1. `main.js` owns transcription-page controller behavior.
2. `PromptManager` owns prompt/profile persistence.
3. `provider-registry.js` owns provider metadata and module resolution.
4. Feature modules should react to controller state, not recreate it.
5. Provider modules should be adapters, not mini-frameworks.
6. Page HTML should stay mostly declarative; avoid large inline runtime scripts.

## Next recommended follow-ups

These are still worth doing later:

- rename awkward legacy filenames such as `notegeneration gpt-5.js`
- merge Soniox standard + diarization variants behind one module option if practical
- add a small automated smoke-test harness around the manual checklist
- centralize pricing tables even further if any provider-local copies remain
- add a lightweight developer README for local maintenance flow
