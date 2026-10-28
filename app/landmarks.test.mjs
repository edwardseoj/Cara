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
  assert.deepStrictEqual(handLabels(frame, 800, 400), [
    { text: 'Left 80%', x: 600, y: 116 },
    { text: 'Right 60%', x: 400, y: 316 },
  ]);
});

const hand = (x, y, handedness = 'Left', score = 0.5) => ({ handedness, score, landmarks: [[x, y, 0]] });
const anchors = (hands) => handLabels({ timestamp: 1, hands }, 640, 480).map(({ x, y }) => [x, y]);

test('a wrist at or past each edge keeps its label 40px inside the canvas', () => {
  assert.deepStrictEqual(anchors([hand(-0.2, 0.5), hand(0, 0.5), hand(1, 0.5), hand(1.3, 0.5)]),
    [[40, 256], [40, 256], [600, 256], [600, 256]]);
  assert.deepStrictEqual(anchors([hand(0.5, -0.2), hand(0.5, 0), hand(0.5, 1), hand(0.5, 1.3)]),
    [[320, 40], [320, 40], [320, 440], [320, 440]]);
});

test('a hand with no landmarks or no wrist gets no label; the others keep theirs', () => {
  const hands = [
    { handedness: 'Left', score: 0.5, landmarks: [] },
    { handedness: 'Left', score: 0.5, landmarks: [null, [0.5, 0.5, 0]] },
    hand(0.5, 0.5),
  ];
  assert.deepStrictEqual(anchors(hands), [[320, 256]]);
});

const texts = (hands) => handLabels({ timestamp: 1, hands }, 640, 480).map(({ text }) => text);

test('an unknown raw handedness shows ? with its confidence', () => {
  assert.deepStrictEqual(texts([hand(0.5, 0.5, 'Unknown', 0.42)]), ['? 42%']);
});

test('two hands with the same raw handedness both show it, not de-duplicated', () => {
  assert.deepStrictEqual(texts([hand(0.25, 0.5, 'Right', 0.9), hand(0.75, 0.5, 'Right', 0.9)]), ['Left 90%', 'Left 90%']);
});

test('confidence rounds to the nearest whole percent at the boundaries', () => {
  assert.deepStrictEqual(texts([0.995, 0.994, 0.005, 0.004, 1, 0].map((s) => hand(0.5, 0.5, 'Left', s))),
    ['Right 100%', 'Right 99%', 'Right 1%', 'Right 0%', 'Right 100%', 'Right 0%']);
});
