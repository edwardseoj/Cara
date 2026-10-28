import test from 'node:test';
import assert from 'node:assert';
import { toFrame, userHand, handLabels } from './landmarks.mjs';

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

test('userHand swaps the raw tracker label to the user\'s real hand', () => {
  assert.deepStrictEqual(['Left', 'Right', 'Unknown', undefined].map(userHand), ['Right', 'Left', null, null]);
});

test('an empty frame gives no hand labels', () => {
  assert.deepStrictEqual(handLabels({ timestamp: 1, hands: [] }, 640, 480), []);
});

test('one hand is labelled with the user\'s real hand and confidence just below its wrist', () => {
  const frame = { timestamp: 1, hands: [{ handedness: 'Left', score: 0.97, landmarks: [[0.25, 0.5, 0], [0.9, 0.9, 0]] }] };
  assert.deepStrictEqual(handLabels(frame, 640, 480), [{ text: 'Right 97%', x: 160, y: 256 }]);
});

test('two hands give two labels in frame order, each at its own wrist', () => {
  const frame = {
    timestamp: 1,
    hands: [
      { handedness: 'Right', score: 0.8, landmarks: [[0.75, 0.25, 0]] },
      { handedness: 'Left', score: 0.6, landmarks: [[0.5, 0.75, 0]] },
    ],
  };
  assert.deepStrictEqual(handLabels(frame, 200, 100), [
    { text: 'Left 80%', x: 150, y: 41 },
    { text: 'Right 60%', x: 100, y: 91 },
  ]);
});
