// One adjustment on Show/Hide and on a new recording. Do not watch textarea
// resizes: the user must remain free to shrink it to the existing CSS minimum.
export function adjustTranscriptHeight() {
  const transcript = document.getElementById('transcription');
  const secondary = document.getElementById('secondaryNotePane');
  if (!transcript) return;
  transcript.style.removeProperty('height');
  if (!secondary || secondary.hidden) return;

  const field = transcript.getBoundingClientRect();
  const pane = secondary.getBoundingClientRect();
  if (!field.width || !pane.width || pane.top >= field.bottom) return;

  const style = window.getComputedStyle(transcript);
  const borderAndPadding = style.boxSizing === 'border-box' ? 0 :
    ['paddingTop', 'paddingBottom', 'borderTopWidth', 'borderBottomWidth']
      .reduce((sum, property) => sum + (parseFloat(style[property]) || 0), 0);
  transcript.style.height = `${Math.max(0, pane.bottom - field.top - borderAndPadding)}px`;
}
