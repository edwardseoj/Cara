// Dev UI form: start a recording session, then save the latest landmark frame as a one-frame sample.
import { GESTURE_LABELS, sampleBody, post } from './record.mjs';

const form = document.getElementById('dev');
const status = document.getElementById('status');
const record = document.getElementById('record');
form.label.append(...GESTURE_LABELS.map((l) => new Option(l)));

let latest = null;
window.addEventListener('landmarks', (e) => { latest = e.detail; });

let session = null;
const say = (msg) => { status.textContent = msg; };

document.getElementById('start').onclick = async () => {
  if (!form.reportValidity()) return;
  const fields = Object.fromEntries(['recorder_id', 'lighting', 'camera'].map((k) => [k, form[k].value]));
  try {
    const { id } = await post('/sessions', { ...fields, source: 'webcam' });
    session = { id, start: performance.now() };
    record.disabled = false;
    say(`session ${id}`);
  } catch (e) { say(`error: ${e.message}`); }
};

record.onclick = async () => {
  if (!latest) return say('no frame yet');
  try {
    const body = sampleBody({ sessionId: session.id, sessionStart: session.start, label: form.label.value, frame: latest });
    const { id } = await post('/samples', body);
    say(`saved sample ${id} (${body.gesture_label}, ${latest.hands.length} hand(s))`);
  } catch (e) { say(`error: ${e.message}`); }
};
