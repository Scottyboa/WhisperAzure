// Shared by the main page and the floating panel; resolve from this module so
// downloads also work from an about:blank Firefox popup / Document PiP window.
const chromeZip = new URL('../../div/autocopy.zip', import.meta.url).href;
const firefoxZip = new URL('../../div/Autocopy_ff.zip', import.meta.url).href;

export function autoCopyHelpHtml(language = 'en') {
  const no = ['no', 'nb', 'nn'].includes(language);
  return no
    ? `<strong>Auto-copy krever en nettleserutvidelse</strong><br><br>
<strong>Chrome / Edge:</strong> <a href="${chromeZip}" download>autocopy.zip</a><br>
Pakk ut og les README. Åpne <code>chrome://extensions</code> (Edge: <code>edge://extensions</code>), slå på Developer mode og velg Load unpacked. Velg utvidelsens mappe og oppdater appen.<br><br>
<strong>Firefox:</strong> <a href="${firefoxZip}" download>Autocopy_ff.zip</a><br>
Pakk ut og les README. Åpne <code>about:debugging#/runtime/this-firefox</code>, velg Load Temporary Add-on og åpne <code>manifest.json</code>. Oppdater appen. Denne testinstallasjonen må gjentas etter omstart av Firefox; permanent installasjon krever en Mozilla-signert XPI-fil.<br><br>
Velg Transkripsjon eller Notat etter installasjon. Utvidelsen aktiverer også «Jump to selected tab».<br><br>
Auto-generer PÅ velger Notat; AV velger Transkripsjon. Et manuelt Auto-copy-valg beholdes til du endrer Auto-generer igjen. Varsler vises hvis nettleseren og operativsystemet tillater det.`
    : `<strong>Auto-copy requires a browser extension</strong><br><br>
<strong>Chrome / Edge:</strong> <a href="${chromeZip}" download>autocopy.zip</a><br>
Unzip and read the README. Open <code>chrome://extensions</code> (Edge: <code>edge://extensions</code>), enable Developer mode and choose Load unpacked. Select the extension folder and refresh the app.<br><br>
<strong>Firefox:</strong> <a href="${firefoxZip}" download>Autocopy_ff.zip</a><br>
Unzip and read the README. Open <code>about:debugging#/runtime/this-firefox</code>, choose Load Temporary Add-on and open <code>manifest.json</code>. Refresh the app. Repeat this test installation after restarting Firefox; permanent installation requires a Mozilla-signed XPI file.<br><br>
Choose Transcript or Note after installation. The extension also enables “Jump to selected tab”.<br><br>
Auto-generate ON selects Note; OFF selects Transcript. A manual Auto-copy choice stays active until you change Auto-generate again. Notifications appear if allowed by your browser and operating system.`;
}
