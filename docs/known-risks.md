# Known risks

## Hands partly out of frame count as absent

**Risk.** Normalization ([spec](../spec/normalization-v1.md)) drops any hand with a missing landmark (fewer than 21, or a `null`). A hand partly out of frame is treated as no hand at all, so a gesture made near the edge of the frame won't fire.

**Symptoms to watch for.**

- Gestures work in the middle of the frame but not near the edges.
- The hand overlay flickers in and out when the hand is near an edge.
- Recording sessions near the edge produce fewer samples than expected.

**How to fix if it bites.** Keep partial hands instead of dropping them, for example by filling missing landmarks (zeros or last known position) and adding a presence flag per landmark so the model knows which ones are real. This changes the normalization, so per CLAUDE.md it needs a spec version bump, new test vectors, both the Python and JS implementations updated together, and a retrain of the model.

## Handedness label confidence can round half-percents down

**Risk.** `handLabels` in `app/landmarks.mjs` shows confidence as `Math.round(score * 100)`. Some half-percent scores aren't exact in floating point, so they round down. For example, `0.285 * 100` is `28.499999999999996`, which shows `28%` instead of `29%`. The same happens for 0.145 and 0.575. It is display-only: frames, samples and normalization keep the raw `score`.

**Symptoms to watch for.**

- The overlay label reads one percent lower than the tracker's score suggests.
- A test that expects a half-percent to round up fails.

**How to fix if it bites.** Remove the float noise before rounding, for example `Math.round(Number((score * 100).toFixed(6)))`, and add the 0.285 → 29% case to `app/landmarks.test.mjs`. `Math.round(score * 1000) / 10` doesn't fix it.
