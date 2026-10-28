import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatCounts } from './samples.mjs';

test('formats counts per gesture and per recording session', () => {
  assert.equal(
    formatCounts({ by_gesture: { fist: 2, idle: 1 }, by_session: { 7: 3 } }),
    'gesture: fist 2, idle 1\nrecording session: 7: 3',
  );
});

test('formats empty dataset', () => {
  assert.equal(formatCounts({ by_gesture: {}, by_session: {} }), 'gesture: none\nrecording session: none');
});
