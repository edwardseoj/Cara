// Shapes a MediaPipe HandLandmarker result into a raw landmark frame:
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

// The tracker assumes a mirrored (selfie) image but gets unmirrored frames, so its
// handedness is the opposite of the user's real hand. Frames keep the raw label;
// anything user-facing converts through here. Unknown labels give null.
export function userHand(handedness) {
  return handedness === 'Left' ? 'Right' : handedness === 'Right' ? 'Left' : null;
}

const LABEL_OFFSET_Y = 16; // px below the wrist, clear of the palm landmarks

// One overlay label per hand, in frame order: { text: 'Right 97%', x, y } anchored
// just below the wrist (landmark 0), in the unmirrored canvas pixels the landmarks use.
export function handLabels(frame, width, height) {
  return frame.hands.map(({ handedness, score, landmarks: [[x, y]] }) => ({
    text: `${userHand(handedness) ?? '?'} ${Math.round(score * 100)}%`,
    x: x * width,
    y: y * height + LABEL_OFFSET_Y,
  }));
}
