// Dev UI form: start a recording session, then after a countdown, save the next N landmark frames as one sample.
import { GESTURE_LABELS, WINDOW_FRAMES, sampleBody, captureFrames, post } from './record.mjs';

const form = document.getElementById('dev');
const status = document.getElementById('status');
const record = document.getElementById('record');
form.label.append(...GESTURE_LABELS.map((l) => new Option(l)));

form.frames.value = WINDOW_FRAMES;

let session = null;
// Each card has its own status line; errors show in the destructive style.
const sayIn = (el) => (msg, error = false) => { el.textContent = msg; el.classList.toggle('text-destructive', error); };
const say = sayIn(status);
const saySession = sayIn(document.getElementById('session-status'));
const badge = document.getElementById('session-badge');

document.getElementById('start').onclick = async () => {
  if (!form.reportValidity()) return;
  const fields = Object.fromEntries(['recorder_id', 'lighting', 'camera'].map((k) => [k, form[k].value]));
  try {
    const { id } = await post('/sessions', { ...fields, source: 'webcam' });
    session = { id, start: performance.now() };
    record.disabled = false;
    saySession(`Recording session ${id} started`);
    badge.textContent = `Recording session ${id} active`;
    badge.hidden = false;
  } catch (e) { saySession(`error: ${e.message}`, true); }
};

record.onclick = async () => {
  const n = Math.max(1, Number(form.frames.value) || WINDOW_FRAMES);
  const label = form.label.value;
  record.disabled = true;
  try {
    for (let s = Number(form.countdown.value) || 0; s > 0; s--) {
      say(`get ready: ${s}`);
      await new Promise((r) => setTimeout(r, 1000));
    }
    say(`recording ${n} frames...`);
    const frames = await captureFrames(window, n);
    const { id } = await post('/samples', sampleBody({ sessionId: session.id, sessionStart: session.start, label, frames }));
    document.dispatchEvent(new Event('sample-saved'));
    say(`saved sample ${id} (${label}, ${n} frames, ${Math.round(frames.at(-1).timestamp - frames[0].timestamp)} ms)`);
  } catch (e) { say(`error: ${e.message}`, true); }
  record.disabled = false;
};
