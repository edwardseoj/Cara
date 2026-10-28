import test from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { GESTURE_LABELS, sampleBody, captureFrames } from './record.mjs';

test('label picker includes idle', () => assert.ok(GESTURE_LABELS.includes('idle')));

test('multi-frame sample keeps raw landmarks in order, timed from session start', () => {
  const hands = [{ handedness: 'Left', score: 0.9, landmarks: Array(21).fill([0.25, 0.5, -0.125]) }];
  const raw = [{ handedness: 'Left', landmarks: Array(21).fill({ x: 0.25, y: 0.5, z: -0.125 }) }];
  const frames = [{ timestamp: 1250.6, hands }, { timestamp: 1283.9, hands: [] }];
  const body = sampleBody({ sessionId: 7, sessionStart: 1000, label: 'fist', frames });
  assert.deepStrictEqual(body, {
    recording_session_id: 7,
    gesture_label: 'fist',
    frames: [{ ts_ms: 251, hands: raw }, { ts_ms: 284, hands: [] }],
  });
});

test('captureFrames collects the next N frames from landmark events', async () => {
  const target = new EventTarget();
  const done = captureFrames(target, 2);
  for (const t of [1, 2, 3]) target.dispatchEvent(Object.assign(new Event('landmarks'), { detail: { timestamp: t, hands: [] } }));
  assert.deepStrictEqual((await done).map((f) => f.timestamp), [1, 2]);
});

test('shipped app has no Postgres driver', () => {
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url)));
  const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
  assert.ok(!deps.some((d) => /^(pg|postgres|pg-.*)$/.test(d)), deps.join());
});
