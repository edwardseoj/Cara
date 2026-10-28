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
