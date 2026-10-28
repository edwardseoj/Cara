// Landmark normalization, implementing spec/normalization-v1.md.
const SPEC_VERSION = 1;
const SLOT_SIZE = 64; // presence + 21 * xyz

function normalizeHand({ handedness, landmarks }) {
  if (!landmarks || landmarks.length < 21 || landmarks.some((p) => !p)) return null;
  const [wx, wy, wz] = landmarks[0];
  const s = Math.hypot(landmarks[9][0] - wx, landmarks[9][1] - wy);
  if (s < 1e-6) return null;
  const flip = handedness === 'Left' ? -1 : 1;
  return landmarks.slice(0, 21).flatMap(([x, y, z]) => [flip * (x - wx) / s, (y - wy) / s, (z - wz) / s]);
}

function normalize(hands) {
  const out = new Array(2 * SLOT_SIZE).fill(0);
  const filled = new Set();
  for (const hand of hands) {
    const slot = { Left: 0, Right: 1 }[hand.handedness];
    if (slot === undefined || filled.has(slot)) continue;
    filled.add(slot); // first claim wins even if this hand turns out invalid
    const coords = normalizeHand(hand);
    if (!coords) continue;
    out[slot * SLOT_SIZE] = 1;
    out.splice(slot * SLOT_SIZE + 1, 63, ...coords);
  }
  return out;
}

module.exports = { normalize, SPEC_VERSION };
