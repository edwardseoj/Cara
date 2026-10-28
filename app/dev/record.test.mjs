import test from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { GESTURE_LABELS, sampleBody } from './record.mjs';

test('label picker includes idle', () => assert.ok(GESTURE_LABELS.includes('idle')));

test('single-frame sample keeps raw landmarks, timed from session start', () => {
  const hands = [{ handedness: 'Left', score: 0.9, landmarks: Array(21).fill([0.25, 0.5, -0.125]) }];
  const body = sampleBody({ sessionId: 7, sessionStart: 1000, label: 'fist', frame: { timestamp: 1250.6, hands } });
  assert.deepStrictEqual(body, {
    recording_session_id: 7,
    gesture_label: 'fist',
    frames: [{ ts_ms: 251, hands: [{ handedness: 'Left', landmarks: Array(21).fill({ x: 0.25, y: 0.5, z: -0.125 }) }] }],
  });
});

test('shipped app has no Postgres driver', () => {
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url)));
  const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
  assert.ok(!deps.some((d) => /^(pg|postgres|pg-.*)$/.test(d)), deps.join());
});
