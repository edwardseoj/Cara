import { test } from 'node:test';
import assert from 'node:assert/strict';
import { countRows } from './samples.mjs';

const labels = ['idle', 'fist', 'thumbs up'];

test('lists every gesture label in label order, 0 for missing', () => {
  assert.deepEqual(countRows({ by_gesture: { fist: 2 }, by_session: {} }, labels).gestures,
    [['idle', 0], ['fist', 2], ['thumbs up', 0]]);
});

test('keeps labels in counts that are not in the label list', () => {
  assert.deepEqual(countRows({ by_gesture: { wave: 4 }, by_session: {} }, labels).gestures.at(-1), ['wave', 4]);
});

test('lists recording session id and count; empty dataset has none', () => {
  assert.deepEqual(countRows({ by_gesture: {}, by_session: { 7: 3 } }, labels).sessions, [['7', 3]]);
  assert.deepEqual(countRows({ by_gesture: {}, by_session: {} }, labels).sessions, []);
});
