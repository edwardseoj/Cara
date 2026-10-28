// Dev UI only: builds training service requests. Never shipped (see package.json build.files).
export const SERVICE = 'http://127.0.0.1:8765';
export const GESTURE_LABELS = ['idle', 'open palm', 'fist', 'thumbs up', 'thumbs down'];

// Frame from landmarks.mjs -> one-frame sample in the dataset's raw `hands` shape (0001_dataset.sql).
export function sampleBody({ sessionId, sessionStart, label, frame }) {
  const hands = frame.hands.map(({ handedness, landmarks }) => ({
    handedness,
    landmarks: landmarks.map(([x, y, z]) => ({ x, y, z })),
  }));
  return {
    recording_session_id: sessionId,
    gesture_label: label,
    frames: [{ ts_ms: Math.round(frame.timestamp - sessionStart), hands }],
  };
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
