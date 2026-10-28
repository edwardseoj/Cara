import test from 'node:test';
import assert from 'node:assert';
import { jobText } from './train.mjs';

test('job status text shows final metrics or error', () => {
  assert.strictEqual(jobText({ id: 3, model_kind: 'static', status: 'running' }), 'job 3 (static): running');
  assert.strictEqual(jobText({ id: 3, model_kind: 'static', status: 'succeeded', metrics: { accuracy: 0.9 } }),
    'job 3 (static): succeeded {"accuracy":0.9}');
  assert.strictEqual(jobText({ id: 3, model_kind: 'static', status: 'failed', error: 'boom' }), 'job 3 (static): failed: boom');
});
