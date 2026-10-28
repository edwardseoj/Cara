import test from 'node:test';
import assert from 'node:assert';
import { toFrame } from './landmarks.mjs';

const pt = (x, y, z) => ({ x, y, z, visibility: 0 });

test('no hands gives an empty frame with its timestamp', () => {
  assert.deepStrictEqual(toFrame({ landmarks: [], handedness: [] }, 1000), { timestamp: 1000, hands: [] });
});

test('two hands become per-hand landmarks with handedness', () => {
  const result = {
    landmarks: [[pt(0.1, 0.2, 0.3)], [pt(0.4, 0.5, 0.6)]],
    handedness: [[{ categoryName: 'Left', score: 0.9 }], [{ categoryName: 'Right', score: 0.8 }]],
  };
  assert.deepStrictEqual(toFrame(result, 42), {
    timestamp: 42,
    hands: [
      { handedness: 'Left', score: 0.9, landmarks: [[0.1, 0.2, 0.3]] },
      { handedness: 'Right', score: 0.8, landmarks: [[0.4, 0.5, 0.6]] },
    ],
  });
});
