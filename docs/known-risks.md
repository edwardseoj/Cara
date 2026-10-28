# Known risks

## Hands partly out of frame count as absent

**Risk.** Normalization ([spec](../spec/normalization-v1.md)) drops any hand with a missing landmark (fewer than 21, or a `null`). A hand partly out of frame is treated as no hand at all, so a gesture made near the edge of the frame won't fire.

**Symptoms to watch for.**

- Gestures work in the middle of the frame but not near the edges.
- The hand overlay flickers in and out when the hand is near an edge.
- Recording sessions near the edge produce fewer samples than expected.

**How to fix if it bites.** Keep partial hands instead of dropping them, for example by filling missing landmarks (zeros or last known position) and adding a presence flag per landmark so the model knows which ones are real. This changes the normalization, so per CLAUDE.md it needs a spec version bump, new test vectors, both the Python and JS implementations updated together, and a retrain of the model.
