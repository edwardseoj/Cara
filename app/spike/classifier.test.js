const test = require("node:test");
const assert = require("node:assert");
const path = require("node:path");
const { loadClassifier } = require("./classifier");

const TOY = path.join(__dirname, "toy-model", "model.json");

test("toy model returns one probability per class for a normalized vector", async () => {
  const classify = await loadClassifier(TOY);
  const probs = classify(new Array(128).fill(0));
  assert.strictEqual(probs.length, 3);
  assert.ok(Math.abs(probs.reduce((a, b) => a + b) - 1) < 1e-5);
});
