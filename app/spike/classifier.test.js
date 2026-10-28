const test = require("node:test");
const assert = require("node:assert");
const path = require("node:path");
const fs = require("node:fs");
const { loadClassifier } = require("../classifier");

const TOY = path.join(__dirname, "toy-model", "model.json");

const layers = JSON.parse(fs.readFileSync(TOY, "utf8")).modelTopology.model_config.config.layers;

test("toy model returns one probability per class for a nonzero input vector", async () => {
  const classify = await loadClassifier(TOY);
  const features = layers[0].config.batch_input_shape[1];
  const probs = classify(Array.from({ length: features }, (_, i) => (i % 7) / 7));
  assert.strictEqual(probs.length, layers.at(-1).config.units);
  assert.ok(Math.abs(probs.reduce((a, b) => a + b) - 1) < 1e-5);
});
