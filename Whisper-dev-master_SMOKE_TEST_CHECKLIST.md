# Smoke Test Checklist

Use this checklist **before** and **after** each refactor step.

Goal:
- Catch regressions early
- Keep refactors small and reversible
- Verify the most fragile flows in a repeatable order

Recommended browser:
- Google Chrome or Microsoft Edge

---

## Test setup

Before each run:

1. Open the app fresh in a new tab.
2. Use a normal browser window unless the test explicitly mentions Incognito.
3. Open DevTools Console and keep it visible.
4. Make sure you have at least:
   - one transcription provider configured
   - one note-generation provider configured
   - one prompt profile ID available for testing
5. If a test changes local/session state, either:
   - note that this is expected, or
   - clear the test state before the next run

Record for each run:
- Date/time
- Branch / commit
- Browser
- Pass / Fail
- Notes / console errors

---

## Pass criteria

A run passes when:

- no blocking console errors appear
- the tested UI flow completes
- the expected text/state survives the action being tested
- buttons/toggles/providers do not end up visually or functionally “stuck”

---

## Test 1 — Front page loads

Page:
- `index.html`

Steps:
1. Open the front page.
2. Confirm the language selector is visible.
3. Confirm provider credential inputs are visible.
4. Confirm the “Enter Transcription Tool” button is visible.

Expected:
- No broken layout
- No blocking console errors
- Front page controls render correctly

---

## Test 2 — Front page key persistence (session/local behavior)

Page:
- `index.html`

Steps:
1. Enter a test Prompt profile ID.
2. Fill one or two provider fields.
3. Refresh the page.

Expected:
- Prompt profile ID persists from local storage
- Key/secret/url fields refill from session storage in the same tab
- No duplicate event behavior on repeated refreshes

---

## Test 3 — Front page import/export/clear keys

Page:
- `index.html`

Steps:
1. Fill multiple key/URL/secret fields.
2. Export keys.
3. Clear keys.
4. Import the exported JSON.
5. Confirm fields are restored.

Expected:
- Export creates valid JSON
- Clear removes the key fields but does not remove the Prompt profile ID
- Import restores the same fields cleanly
- Status message updates correctly

---

## Test 4 — Guide modals load and close correctly

Page:
- `index.html`

Steps:
1. Open AWS Bedrock Guide.
2. Close it.
3. Open Vertex Guide.
4. Close it with the close button.
5. Re-open one guide and close it with `Escape`.
6. Change language and re-open the guide.

Expected:
- Guide content loads
- Modal opens and closes reliably
- Language-sensitive guide text updates correctly
- No double-open or stuck overlay behavior

---

## Test 5 — Enter Transcription Tool navigation

From:
- `index.html`

To:
- `transcribe.html`

Steps:
1. Click “Enter Transcription Tool”.
2. Verify navigation completes.
3. Confirm the main transcription UI appears.

Expected:
- Navigation works on first click
- No duplicate redirects
- Main recording/note UI renders

---

## Test 6 — Transcribe page loads with both provider selectors

Page:
- `transcribe.html`

Steps:
1. Confirm the transcription provider selector is visible.
2. Confirm the note provider selector is visible.
3. Change each selector once.

Expected:
- Selectors render correctly
- Changing provider does not break the page
- Buttons remain usable after switching

---

## Test 7 — Provider switching does not duplicate handlers

Page:
- `transcribe.html`

Steps:
1. Switch transcription provider several times.
2. Switch note provider several times.
3. Click “Generate Note” once.
4. Click any provider-related buttons only once per action.

Expected:
- One user action causes one result
- No duplicate note requests
- No duplicated UI listeners
- No extra button side effects after repeated switching

---

## Test 8 — Basic recording flow

Page:
- `transcribe.html`

Steps:
1. Click “Start Recording”.
2. Speak briefly.
3. Click “Stop/Complete”.

Expected:
- Recording starts
- Timer moves
- Stop completes without freezing
- Transcription area receives text
- Status text updates appropriately

---

## Test 9 — Pause / resume flow

Page:
- `transcribe.html`

Steps:
1. Start recording.
2. Click “Pause”.
3. Wait briefly.
4. Click “Resume”.
5. Record again.
6. Click “Stop/Complete”.

Expected:
- Pause works without breaking the session
- Resume continues cleanly
- Timer behavior is consistent
- Final transcription still completes

---

## Test 10 — Abort during recording

Page:
- `transcribe.html`

Steps:
1. Start recording.
2. While recording is active, use the abort/cancel control if available.
3. Try starting a fresh recording afterwards.

Expected:
- Active recording can be aborted safely
- UI returns to a usable idle state
- A new recording can start normally afterwards

---

## Test 11 — Manual note generation

Page:
- `transcribe.html`

Steps:
1. Ensure there is transcription text in the field.
2. Click “Generate Note”.

Expected:
- Generate starts once
- Completion indicator/timer updates
- Generated note appears
- Generate button disables while busy and returns afterwards

---

## Test 12 — Abort note generation

Page:
- `transcribe.html`

Steps:
1. Start note generation.
2. Click “Abort” while generation is in progress.

Expected:
- In-flight generation stops cleanly
- UI returns to an idle state
- Generate can be used again immediately afterwards
- No stuck “busy” state remains

---

## Test 13 — Auto-generate note flow

Page:
- `transcribe.html`

Steps:
1. Turn auto-generate ON.
2. Run a short recording from start to finish.
3. Wait for transcription completion.

Expected:
- Note generation starts automatically after transcription finishes
- It starts once, not multiple times
- Turning the toggle OFF prevents auto-generation on the next run

---

## Test 14 — Prompt slot save/load

Page:
- `transcribe.html`

Steps:
1. Select prompt slot 1.
2. Enter a unique test prompt.
3. Select prompt slot 2.
4. Enter a different prompt.
5. Switch back to slot 1.

Expected:
- Each slot keeps its own content
- Switching slots restores the correct prompt
- No cross-slot overwrites occur

---

## Test 15 — Prompt profile switching

Pages:
- `index.html`
- `transcribe.html`

Steps:
1. Set Prompt profile ID A.
2. Save a distinctive prompt in one slot.
3. Change to Prompt profile ID B.
4. Confirm the slot content changes to that profile’s stored content.
5. Switch back to profile A.

Expected:
- Prompt content follows the active profile
- Switching profiles does not mix slot content
- Returning to a prior profile restores that profile’s prompts

---

## Test 16 — Prompt import/export

Page:
- `transcribe.html`

Steps:
1. Export prompts for the active profile.
2. Change one or more slot values.
3. Import the previously exported prompt JSON.

Expected:
- Export file is valid
- Import restores prompt content into the active profile
- Slot selection and prompt UI remain stable

---

## Test 17 — Reload fallback preserves text areas

Page:
- `transcribe.html`

Steps:
1. Put text in:
   - transcription
   - generated note
   - custom prompt
2. Trigger a provider switch or refresh path that relies on state restoration.
3. Reload if needed.

Expected:
- Text content is restored correctly
- Scroll/selection behavior is not badly broken
- No accidental clearing of user work

---

## Test 18 — Supplementary information and counters

Page:
- `transcribe.html`

Steps:
1. Type text into the transcription field.
2. Type text into the supplementary information field.
3. Type text into the prompt field.

Expected:
- Live word/token counters update
- Counters still work after provider changes
- No console errors appear during typing

---

## Test 19 — Language switching on transcribe page

Page:
- `transcribe.html`

Steps:
1. Change language once.
2. Open any language-sensitive tooltip or text block.
3. Change language again.

Expected:
- UI copy updates correctly
- Tooltips/labels refresh correctly
- No mixed-language broken state appears

---

## Test 20 — End-to-end happy path

Pages:
- `index.html`
- `transcribe.html`

Steps:
1. Open front page.
2. Enter/select test credentials and Prompt profile ID.
3. Enter transcription tool.
4. Record a short sample.
5. Wait for transcription.
6. Generate a note.
7. Copy/save the result if relevant.
8. Refresh and confirm the app is still usable.

Expected:
- Core user journey works from start to finish
- No critical console errors
- No stuck state after completion

---

## Failure log template

Use this block for any failed test:

```text
Test:
Browser:
Date/Time:
Branch/Commit:

Observed:
Expected:

Console errors:
1.
2.
3.

Notes:
```

---

## How to use this during the refactor

For each refactor step:

1. Run Tests 1, 5, 6, 7, 11, 12, 14, 15, 17, and 20 at minimum.
2. If the step touches recording, also run 8, 9, and 10.
3. If the step touches prompt/profile code, also run 14, 15, and 16.
4. If the step touches language/guide UI, also run 4 and 19.
5. Only move to the next file when the changed area passes.

---

## Suggested first “core regression subset”

If you want the smallest useful subset before every file patch, run only these:

- Test 5 — Enter Transcription Tool navigation
- Test 6 — Provider selectors load
- Test 7 — No duplicated handlers after provider switching
- Test 11 — Manual note generation
- Test 12 — Abort note generation
- Test 14 — Prompt slot save/load
- Test 17 — Reload fallback preserves text areas
- Test 20 — End-to-end happy path
