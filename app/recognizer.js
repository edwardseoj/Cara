// Static gesture recognizer: raw landmark frame -> normalize v1 -> classifier -> gate -> event.
const fs = require("node:fs");
const path = require("node:path");
const { normalize, SPEC_VERSION } = require("./normalize");
const { createGate } = require("./gate");

// Returns recognize(frame) -> { gesture } when the gate fires, else null.
function createRecognizer({ classify, labels, ...gateOptions }) {
  const gate = createGate(gateOptions);
  return (frame) => {
    const probs = classify(normalize(frame.hands));
    const top = probs.indexOf(Math.max(...probs));
    const gesture = gate(labels[top], probs[top]);
    return gesture && { gesture };
  };
}

// Loads an exported model dir (#28: model.json + metadata.json). Refuses a normalization mismatch.
async function loadRecognizer(dir, gateOptions) {
  const meta = JSON.parse(fs.readFileSync(path.join(dir, "metadata.json"), "utf8"));
  if (meta.normalization_spec_version !== SPEC_VERSION) {
    throw new Error(`model normalization spec version ${meta.normalization_spec_version}, app implements ${SPEC_VERSION}`);
  }
  if (!meta.labels.includes("idle")) throw new Error("model labels lack the idle class");
  const { loadClassifier } = require("./spike/classifier");
  const classify = await loadClassifier(path.join(dir, "model.json"));
  return createRecognizer({ classify, labels: meta.labels, ...gateOptions });
}

module.exports = { createRecognizer, loadRecognizer };
