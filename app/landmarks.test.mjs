import test from 'node:test';
import assert from 'node:assert';
import { toFrame, userHand, handLabels } from './landmarks.mjs';

const pt = (x, y, z) => ({ x, y, z, visibility: 0 });
const hand = (x, y, handedness = 'Left', score = 0.5) => ({ handedness, score, landmarks: [[x, y, 0]] });
const labels = (hands, width = 640, height = 480) => handLabels({ timestamp: 1, hands }, width, height);
const anchors = (hands) => labels(hands).map(({ x, y }) => [x, y]);
const texts = (hands) => labels(hands).map(({ text }) => text);

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

test('userHand gives the raw tracker label as the user\'s real hand (camera check, #73)', () => {
  assert.deepStrictEqual(['Left', 'Right', 'Unknown', undefined, 'toString'].map(userHand), ['Left', 'Right', null, null, null]);
});

test('an empty frame gives no hand labels', () => {
  assert.deepStrictEqual(labels([]), []);
});

test('one hand is labeled with the user\'s real hand and confidence just below its wrist', () => {
  const left = { ...hand(0.25, 0.5, 'Left', 0.97), landmarks: [[0.25, 0.5, 0], [0.9, 0.9, 0]] };
  assert.deepStrictEqual(labels([left]), [{ text: 'Left 97%', x: 160, y: 256 }]);
});

test('two hands give two labels in frame order, each at its own wrist', () => {
  assert.deepStrictEqual(labels([hand(0.75, 0.25, 'Right', 0.8), hand(0.5, 0.75, 'Left', 0.6)], 800, 400), [
    { text: 'Right 80%', x: 600, y: 116 },
    { text: 'Left 60%', x: 400, y: 316 },
  ]);
});

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

test('an unknown raw handedness shows ? with its confidence', () => {
  assert.deepStrictEqual(texts([hand(0.5, 0.5, 'Unknown', 0.42)]), ['? 42%']);
});

test('two hands with the same raw handedness both show it, not de-duplicated', () => {
  assert.deepStrictEqual(texts([hand(0.25, 0.5, 'Right', 0.9), hand(0.75, 0.5, 'Right', 0.9)]), ['Right 90%', 'Right 90%']);
});

test('confidence rounds to the nearest whole percent at the boundaries', () => {
  assert.deepStrictEqual(texts([0.995, 0.994, 0.005, 0.004, 1, 0].map((s) => hand(0.5, 0.5, 'Left', s))),
    ['Left 100%', 'Left 99%', 'Left 1%', 'Left 0%', 'Left 100%', 'Left 0%']);
});
