import test from 'node:test';
import assert from 'node:assert';
import { jobView } from './train.mjs';

test('training job title line for each status', () => {
  for (const status of ['queued', 'running', 'succeeded', 'failed'])
    assert.strictEqual(jobView({ id: 3, model_kind: 'static', status }).title, `Training job 3 (static): ${status}`);
});

test('metrics come back as label/value rows, empty when none', () => {
  assert.deepStrictEqual(jobView({ id: 3, model_kind: 'static', status: 'succeeded', metrics: { accuracy: 0.9, epochs: 20 } }).rows,
    [['accuracy', '0.9'], ['epochs', '20']]);
  assert.deepStrictEqual(jobView({ id: 3, model_kind: 'static', status: 'running' }).rows, []);
});

test('error comes back separately from the title', () => {
  const v = jobView({ id: 3, model_kind: 'motion', status: 'failed', error: 'boom' });
  assert.strictEqual(v.title, 'Training job 3 (motion): failed');
  assert.strictEqual(v.error, 'boom');
  assert.strictEqual(jobView({ id: 3, model_kind: 'static', status: 'running' }).error, undefined);
});

test('nested metrics flatten into dotted labels', () => {
  assert.deepStrictEqual(jobView({ id: 3, model_kind: 'static', status: 'succeeded', metrics: { accuracy: 0.9, per_class: { idle: 0.8, fist: { f1: 0.7 } } } }).rows,
    [['accuracy', '0.9'], ['per_class.idle', '0.8'], ['per_class.fist.f1', '0.7']]);
});
