// Dev UI only: builds training service requests. Never shipped (see package.json build.files).
export const SERVICE = 'http://127.0.0.1:8765';
export const GESTURE_LABELS = ['idle', 'open palm', 'fist', 'thumbs up', 'thumbs down'];

export const WINDOW_FRAMES = 30;

// Frames from landmarks.mjs -> one sample in the dataset's raw `hands` shape (0001_dataset.sql), ordered.
export function sampleBody({ sessionId, sessionStart, label, frames }) {
  return {
    recording_session_id: sessionId,
    gesture_label: label,
    frames: frames.map((frame) => ({
      ts_ms: Math.round(frame.timestamp - sessionStart),
      hands: frame.hands.map(({ handedness, landmarks }) => ({
        handedness,
        landmarks: landmarks.map(([x, y, z]) => ({ x, y, z })),
      })),
    })),
  };
}

// Resolves with the next n 'landmarks' event frames dispatched on target.
export function captureFrames(target, n) {
  return new Promise((resolve) => {
    const frames = [];
    const on = (e) => {
      frames.push(e.detail);
      if (frames.length < n) return;
      target.removeEventListener('landmarks', on);
      resolve(frames);
    };
    target.addEventListener('landmarks', on);
  });
}

export async function post(path, body) {
  const res = await fetch(SERVICE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || res.status);
  return json;
}
