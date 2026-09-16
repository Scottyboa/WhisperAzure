NOTE AUTO-COPY FOR FIREFOX

A regular popup window is not guaranteed to stay on top of other programs.

Use this extension with the WhisperAzure Mini Panel / Firefox update.
The Chrome package autocopy.zip is separate.

TEST INSTALLATION
1. Extract Autocopy_ff.zip into a folder you keep on your computer.
2. Open about:debugging#/runtime/this-firefox in Firefox.
3. Choose Load Temporary Add-on.
4. Select manifest.json in the extracted folder.
5. Refresh the app tabs. Wait for all Workspaces to load.
6. Select Transcript or Note under Auto-copy and try a short test recording.

READ THIS: Firefox removes temporary extensions when it closes. Repeat steps
2–5 after restarting Firefox. This ZIP is not a permanent installation.
Permanent installation in regular Firefox requires the developer to obtain
Mozilla signing and distribute the resulting signed XPI. Do not disable
signature checking. This ZIP contains all source files needed for signing.

USE
- Transcript: automatically copy the completed transcript.
- Note: automatically copy the completed primary note.
- Off: disable these two automatic copy modes.
- Redactor has its own Auto-copy checkbox.
- Jump to selected tab: activate the browser tab selected in the Mini Panel.
- Notifications depend on Firefox and operating system settings.
- Each Workspace keeps its own Auto-copy choice.

MICROPHONE AND MINI PANEL
Allow microphone access in the main app tab the first time. If the panel shows
Starting or a permission error, open the main tab and check its microphone
permission. The extension cannot bypass browser microphone permissions.
Document Picture-in-Picture is used when supported; other versions open a
popup window. Allow popups for the app if necessary.

TROUBLESHOOTING
If Auto-copy is greyed out, check that the extension is loaded, allow access
to the app website and refresh the app tab. Firefox 128 or later is required.
Supported origins: https://scottyboa.github.io/ and https://tn-beta.netlify.app/.
Access to all websites is not needed.

DATA
Text is handled locally to write it to the clipboard. The extension makes
no server requests, stores no API keys and does not read your clipboard.
Copied text remains on the operating system clipboard until replaced or
cleared. Any clipboard history is managed by your operating system.

Official installation and distribution instructions:
https://extensionworkshop.com/documentation/develop/temporary-installation-in-firefox/
https://extensionworkshop.com/documentation/publish/signing-and-distribution-overview/
