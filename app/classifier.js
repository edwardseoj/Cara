// Spike #26: run a TF.js layers model on one normalized landmark vector.
const fs = require("node:fs");
const path = require("node:path");
const tf = require("@tensorflow/tfjs");

// Returns classify(vector) -> class probabilities. Reads files directly so it works in Node and Electron alike.
async function loadClassifier(modelJsonPath) {
  const { modelTopology, weightsManifest } = JSON.parse(fs.readFileSync(modelJsonPath, "utf8"));
  const dir = path.dirname(modelJsonPath);
  const buffers = weightsManifest.flatMap((g) => g.paths.map((p) => fs.readFileSync(path.join(dir, p))));
  const weightData = Buffer.concat(buffers);
  const model = await tf.loadLayersModel(tf.io.fromMemory({
    modelTopology,
    weightSpecs: weightsManifest.flatMap((g) => g.weights),
    weightData: weightData.buffer.slice(weightData.byteOffset, weightData.byteOffset + weightData.byteLength),
  }));
  return (vector) => tf.tidy(() => Array.from(model.predict(tf.tensor2d([vector])).dataSync()));
}

module.exports = { loadClassifier };
