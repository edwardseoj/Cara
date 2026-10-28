// Dev UI form: start a recording session, then after a countdown, save the next N landmark frames as one sample.
import { GESTURE_LABELS, WINDOW_FRAMES, sampleBody, captureFrames, post, showStatus } from './record.mjs';

const form = document.getElementById('dev');
const status = document.getElementById('status');
const record = document.getElementById('record');
form.label.append(...GESTURE_LABELS.map((l) => new Option(l)));

form.frames.value = WINDOW_FRAMES;

let session = null;
const countdownEl = document.getElementById('stage-countdown');
const recordingEl = document.getElementById('stage-recording');
// Camera overlay: a number during countdown, the Recording badge while capturing, nothing otherwise.
const overlay = (countdown, recording = false) => {
  countdownEl.textContent = countdown ?? '';
  countdownEl.hidden = countdown == null;
  recordingEl.hidden = !recording;
};
// Each card has its own status line; errors show as Basecoat's destructive alert.
const sayRecord = (msg, error) => showStatus(status, msg, error);
const saySession = (msg, error) => showStatus(document.getElementById('session-status'), msg, error);
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
      sayRecord(`get ready: ${s}`);
      overlay(s);
      await new Promise((r) => setTimeout(r, 1000));
    }
    sayRecord(`recording ${n} frames...`);
    overlay(null, true);
    const frames = await captureFrames(window, n);
    const { id } = await post('/samples', sampleBody({ sessionId: session.id, sessionStart: session.start, label, frames }));
    document.dispatchEvent(new Event('sample-saved'));
    sayRecord(`saved sample ${id} (${label}, ${n} frames, ${Math.round(frames.at(-1).timestamp - frames[0].timestamp)} ms)`);
  } catch (e) { sayRecord(`error: ${e.message}`, true); }
  overlay(null);
  record.disabled = false;
};
