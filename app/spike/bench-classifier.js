// Spike #26: time the toy classifier inside Electron's main process. Run from app/: npx electron spike/bench-classifier.js
const path = require("node:path");
const { app } = require("electron");
const { loadClassifier } = require("./classifier");

app.whenReady().then(async () => {
  const t0 = performance.now();
  const classify = await loadClassifier(path.join(__dirname, "toy-model", "model.json"));
  const loadMs = performance.now() - t0;
  const vector = Array.from({ length: 128 }, (_, i) => (i % 7) / 7);
  for (let i = 0; i < 100; i++) classify(vector);
  const times = [];
  for (let i = 0; i < 2000; i++) {
    const s = performance.now();
    classify(vector);
    times.push(performance.now() - s);
  }
  times.sort((a, b) => a - b);
  const pct = (p) => times[Math.floor(p * times.length)].toFixed(3);
  console.log(`electron ${process.versions.electron}: load ${loadMs.toFixed(1)} ms, p50 ${pct(0.5)} ms, p99 ${pct(0.99)} ms`);
  app.quit();
});
