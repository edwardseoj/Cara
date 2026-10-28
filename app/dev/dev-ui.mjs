// Dev UI form: start a recording session, then after a countdown, save the next N landmark frames as one sample.
import { GESTURE_LABELS, WINDOW_FRAMES, sampleBody, captureFrames, post } from './record.mjs';

const form = document.getElementById('dev');
const status = document.getElementById('status');
const record = document.getElementById('record');
form.label.append(...GESTURE_LABELS.map((l) => new Option(l)));

form.frames.value = WINDOW_FRAMES;

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
    say(`saved sample ${id} (${label}, ${n} frames, ${Math.round(frames.at(-1).timestamp - frames[0].timestamp)} ms)`);
  } catch (e) { say(`error: ${e.message}`); }
  record.disabled = false;
};
