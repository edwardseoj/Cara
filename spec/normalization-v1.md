# Landmark normalization v1

Turns one frame of MediaPipe hand landmarks into a fixed-length feature vector. Python (`training/`) and JS (`app/`) implement exactly this, and both must pass `normalization-v1.vectors.json`.

## Input

One frame: a list of 0–2 hands. Each hand has:

- `handedness`: `"Left"` or `"Right"`, as reported by MediaPipe.
- `landmarks`: 21 entries in MediaPipe order (0 = wrist, 9 = middle-finger MCP). Each entry is `[x, y, z]` or `null` if missing.

## Per hand

1. **Validity.** The hand is treated as absent if it has fewer than 21 landmarks or any `null` landmark. Partial hands are dropped, not repaired.
2. **Origin.** Subtract the wrist (landmark 0) from every landmark, on all three axes.
3. **Scale.** `s = sqrt(dx² + dy²)`, the x/y distance from wrist to middle-finger MCP (landmark 9). z is left out because MediaPipe's z is noisy. If `s < 1e-6`, the scale is degenerate and the hand is treated as absent. Otherwise divide x, y and z of every landmark by `s`.
4. **Rotation.** None. Hand orientation is part of the gesture.
5. **Handedness.** For a `"Left"` hand, negate x after steps 2–3, so both hands share the right-hand frame. y and z are unchanged.

## Two-hand layout

The output has two fixed slots: **slot 0 = Left, slot 1 = Right**. Each hand goes in the slot named by its handedness. If two hands claim the same handedness, the first in input order wins; the other is dropped.

## Output vector (128 floats)

| Index | Content |
|-------|---------|
| 0 | Left presence: 1 if a valid Left hand filled slot 0, else 0 |
| 1–63 | Left landmarks: `x0, y0, z0, x1, y1, z1, … x20, y20, z20` |
| 64 | Right presence |
| 65–127 | Right landmarks, same order |

An absent slot (no hand, partial hand, degenerate scale, duplicate) is presence 0 with 63 zeros.

## Test vectors

`normalization-v1.vectors.json`: `{ version, tolerance, cases: [{ name, input, expected }] }`. `input` is the list of hands; `expected` is the 128-float vector. An implementation passes when every element is within `tolerance` (absolute) of `expected`.

## Versioning

This is v1. Any change to the steps, layout or order is a new version with new vectors, updated in both implementations together.
