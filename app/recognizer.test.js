const test = require("node:test");
const assert = require("node:assert");
const path = require("node:path");
const fs = require("node:fs");
const os = require("node:os");
const { createRecognizer, loadRecognizer } = require("./recognizer");

const LABELS = ["idle", "fist"];
// Synthetic fixtures (never dataset exports): each sequence lists one pose per frame.
// "idle" = no hand, "fist" = a confident right hand, "weak" = the same hand with a low tracker score.
const fixtures = JSON.parse(fs.readFileSync(path.join(__dirname, "fixtures", "gate-sequences.json"), "utf8"));

// Fake model at the classifier boundary: idle with no hand, else "fist" at the tracker's score.
let score = 0;
const classify = (v) => (v[64] === 1 ? [1 - score, score] : [0.99, 0.01]);

function run(name) {
  const recognize = createRecognizer({ classify, labels: LABELS, threshold: 0.8, holdFrames: 5 });
  const step = (hands) => { score = hands[0]?.score ?? 0; return recognize({ timestamp: 0, hands }); };
  return fixtures.sequences[name]
    .flatMap(([pose, count]) => Array(count).fill(pose))
    .map((pose) => step(fixtures.poses[pose]))
    .filter(Boolean)
    .map((e) => e.gesture);
}

test("idle frames fire nothing", () => assert.deepStrictEqual(run("idle"), []));
test("a held gesture fires exactly one event", () => assert.deepStrictEqual(run("held"), ["fist"]));
test("a hold shorter than N frames fires nothing", () => assert.deepStrictEqual(run("shortHold"), []));
test("low confidence fires nothing", () => assert.deepStrictEqual(run("lowConfidence"), []));
test("flicker between gesture and idle fires nothing", () => assert.deepStrictEqual(run("flicker"), []));
test("low-confidence idle between holds does not re-arm: same gesture fires once", () =>
  assert.deepStrictEqual(run("holdThenWeakThenSame"), ["fist"]));
test("re-arms after idle: two holds separated by idle fire twice", () =>
  assert.deepStrictEqual(run("twoHolds"), ["fist", "fist"]));

test("loading refuses a normalization spec version mismatch", async () => {
  const toy = path.join(__dirname, "spike", "toy-model");
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cara-model-"));
  for (const f of fs.readdirSync(toy)) fs.copyFileSync(path.join(toy, f), path.join(dir, f));
  fs.writeFileSync(path.join(dir, "metadata.json"),
    JSON.stringify({ model_kind: "static", labels: LABELS, normalization_spec_version: 2 }));
  await assert.rejects(loadRecognizer(dir), /normalization spec version/);
});
