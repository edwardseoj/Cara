// Landmark normalization, implementing spec/normalization-v1.md.
const SPEC_VERSION = 1;
const LANDMARK_COUNT = 21;
const WRIST = 0;
const MIDDLE_MCP = 9;
const MIN_SCALE = 1e-6;
const SLOT_SIZE = 1 + 3 * LANDMARK_COUNT; // presence + xyz per landmark
// handedness -> { slot, xSign }; anything else is ignored
const SIDES = { Left: { slot: 0, xSign: -1 }, Right: { slot: 1, xSign: 1 } };

// 63 normalized floats, or null if the hand is partial or degenerate.
function normalizeHand(hand) {
  if (hand.landmarks == null || hand.landmarks.length < LANDMARK_COUNT) return null;
  const landmarks = hand.landmarks.slice(0, LANDMARK_COUNT);
  if (landmarks.some((p) => p == null)) return null;
  const [wx, wy, wz] = landmarks[WRIST];
  const [mx, my, mz] = landmarks[MIDDLE_MCP];
  const scale = Math.hypot(mx - wx, my - wy, mz - wz);
  if (scale < MIN_SCALE) return null;
  const { xSign } = SIDES[hand.handedness];
  return landmarks.flatMap(([x, y, z]) => [xSign * (x - wx) / scale, (y - wy) / scale, (z - wz) / scale]);
}

// One frame of hands -> 128 floats: [Left presence, 63 Left, Right presence, 63 Right].
function normalize(hands) {
  const out = new Array(2 * SLOT_SIZE).fill(0);
  const claimed = new Set();
  for (const hand of hands) {
    const side = Object.hasOwn(SIDES, hand.handedness) ? SIDES[hand.handedness] : undefined;
    if (!side || claimed.has(side.slot)) continue;
    const coords = normalizeHand(hand);
    if (!coords) continue; // invalid hands claim no slot
    claimed.add(side.slot);
    out.splice(side.slot * SLOT_SIZE, SLOT_SIZE, 1, ...coords);
  }
  return out;
}

module.exports = { normalize, normalizeHand, SPEC_VERSION };
