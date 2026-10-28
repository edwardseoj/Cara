# Static gesture models ship as TF.js layers models

The app needs to run the static gesture classifier trained in `training/` (Keras) without Python. We export it with `tensorflowjs` to the TF.js layers format and run it in the app with `@tensorflow/tfjs`. ONNX was not tried: the user chose TF.js up front, so ONNX was rejected by choice, not by measurement.

The spike (#26) used a toy dense classifier on the 128-float normalization v1 vector (`training/cara_training/export_toy.py`, fixture in `app/spike/toy-model/`, loader `app/spike/classifier.js`). Measured in Node 24 with the pure-JS CPU backend, 2000 runs after warm-up: load 12 ms, predict p50 0.08 ms, p99 0.35 ms. Not measured in the Electron renderer; a dense model this small should not change the picture. Model files: 19 KB. `@tensorflow/tfjs` 4.22 adds 272 MB to `node_modules` (all dist variants); the minified browser bundle is 1.47 MB (368 KB gzipped).

Conversion ran in the `cara-train` image (TF 2.16.2) after `pip install tensorflowjs==4.22.0 tensorflow==2.16.2 tensorflow-decision-forests==1.9.1` (the pins stop pip from upgrading TF). TF.js 4.22 cannot load Keras 3 layer configs (`batch_shape`, `DTypePolicy`), so export must use Keras 2 via `TF_USE_LEGACY_KERAS=1`.

Consequences: the training code builds models with tf-keras (Keras 2) until TF.js reads Keras 3. The app ships the TF.js dependency; a packaged build should pull in only the parts it uses to keep size down. Revisit ONNX if latency in the renderer or bundle size becomes a problem.
