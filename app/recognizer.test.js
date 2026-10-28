const test = require("node:test");
const assert = require("node:assert");
const path = require("node:path");
const fs = require("node:fs");
const os = require("node:os");
const { createRecognizer, loadRecognizer } = require("./recognizer");

const LABELS = ["idle", "play"];
// Synthetic fixtures (never dataset exports): each sequence lists one pose per frame.
// "idle" = no hand, "play" = a right hand, "weak" = a left hand the fake model is unsure about.
const fixtures = JSON.parse(fs.readFileSync(path.join(__dirname, "fixtures", "gate-sequences.json"), "utf8"));

// Fake model at the classifier boundary: reads the normalized v1 vector's presence flags.
const classify = (v) => (v[64] === 1 ? [0.05, 0.95] : v[0] === 1 ? [0.4, 0.6] : [0.99, 0.01]);

function run(name) {
  const recognize = createRecognizer({ classify, labels: LABELS, threshold: 0.8, holdFrames: 5 });
  return fixtures.sequences[name]
    .flatMap(([pose, count]) => Array(count).fill(pose))
    .map((pose) => recognize({ timestamp: 0, hands: fixtures.poses[pose] }))
    .filter(Boolean)
    .map((e) => e.gesture);
}

test("idle frames fire nothing", () => assert.deepStrictEqual(run("idle"), []));
test("a held gesture fires exactly one event", () => assert.deepStrictEqual(run("held"), ["play"]));
test("a hold shorter than N frames fires nothing", () => assert.deepStrictEqual(run("shortHold"), []));
test("low confidence fires nothing", () => assert.deepStrictEqual(run("lowConfidence"), []));
test("flicker between gesture and idle fires nothing", () => assert.deepStrictEqual(run("flicker"), []));
test("re-arms after idle: two holds separated by idle fire twice", () =>
  assert.deepStrictEqual(run("twoHolds"), ["play", "play"]));

test("loading refuses a normalization spec version mismatch", async () => {
  const toy = path.join(__dirname, "spike", "toy-model");
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cara-model-"));
  for (const f of fs.readdirSync(toy)) fs.copyFileSync(path.join(toy, f), path.join(dir, f));
  fs.writeFileSync(path.join(dir, "metadata.json"),
    JSON.stringify({ model_kind: "static", labels: LABELS, normalization_spec_version: 2 }));
  await assert.rejects(loadRecognizer(dir), /normalization spec version/);
});
