const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const { normalize, SPEC_VERSION } = require('./normalize');

// Read from spec/, never copied, so both implementations share one source of truth.
const spec = require(path.join(__dirname, '..', 'spec', 'normalization-v1.vectors.json'));

test('implements the spec version of the vector file', () => {
  assert.strictEqual(SPEC_VERSION, spec.version);
});

for (const c of spec.cases) {
  test(`vector: ${c.name}`, () => {
    const out = normalize(c.input);
    assert.strictEqual(out.length, c.expected.length);
    c.expected.forEach((e, i) =>
      assert.ok(Math.abs(out[i] - e) <= spec.tolerance, `index ${i}: ${out[i]} vs ${e}`));
  });
}
