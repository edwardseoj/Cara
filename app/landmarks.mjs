// Landmark frames and what the overlay shows of them: shapes a MediaPipe
// HandLandmarker result into a raw frame, holds the mirror rule (userHand) that
// turns the tracker's raw handedness into the user's real hand, and lays out the
// per-hand overlay labels (handLabels).
//
// Raw landmark frame:
// { timestamp, hands: [{ handedness: 'Left'|'Right', score, landmarks: [[x, y, z] x21] }] }
// This is the input format of normalize.js (spec/normalization-v1.md).
export function toFrame(result, timestamp) {
  return {
    timestamp,
    hands: result.landmarks.map((points, i) => ({
      handedness: result.handedness[i][0].categoryName,
      score: result.handedness[i][0].score,
      landmarks: points.map(({ x, y, z }) => [x, y, z]),
    })),
  };
}

const USER_HAND = Object.assign(Object.create(null), { Left: 'Right', Right: 'Left' });

// The tracker assumes a mirrored (selfie) image but gets unmirrored frames, so its
// handedness is the opposite of the user's real hand. Frames keep the raw label;
// anything user-facing converts through here. Unknown labels give null.
export function userHand(handedness) {
  return USER_HAND[handedness] ?? null;
}

export const LABEL_FONT = '14px sans-serif';
const LABEL_OFFSET_Y = 16; // px below the wrist, clear of the palm landmarks
const LABEL_MARGIN = 40; // px; sized for LABEL_FONT: room for half of 'Right 100%'

// Keeps v at least LABEL_MARGIN inside both ends of [0, extent].
const inset = (v, extent) => Math.min(Math.max(v, LABEL_MARGIN), extent - LABEL_MARGIN);

// One overlay label per hand, in frame order: { text: 'Right 97%', x, y } anchored
// just below the wrist (landmark 0), in the unmirrored canvas pixels the landmarks use.
// A hand without a usable wrist gets no label rather than a misplaced one.
export function handLabels(frame, width, height) {
  return frame.hands.flatMap(({ handedness, score, landmarks }) => {
    const [x, y] = landmarks?.[0] ?? [];
    if (!Number.isFinite(x) || !Number.isFinite(y)) return [];
    return [{
      text: `${userHand(handedness) ?? '?'} ${Math.round(score * 100)}%`,
      x: inset(x * width, width),
      y: inset(y * height + LABEL_OFFSET_Y, height),
    }];
  });
}
