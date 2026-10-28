# Landmark normalization v1

Turns one frame of MediaPipe hand landmarks into a fixed-length feature vector. Python (`training/`) and JS (`app/`) implement exactly this, and both must pass `normalization-v1.vectors.json`.

## Input

One frame: a list of 0–2 hands. Each hand has:

- `handedness`: `"Left"` or `"Right"`, as reported by MediaPipe.
- `landmarks`: 21 entries in MediaPipe order (0 = wrist, 9 = middle-finger MCP). Each entry is `[x, y, z]` or `null` if missing.

## Per hand

1. **Validity.** A hand whose `handedness` is anything other than `"Left"` or `"Right"` is ignored entirely. A hand with no `landmarks` list, fewer than 21 landmarks, or any `null` among its first 21 is treated as absent. Partial hands are dropped, not repaired (see [known risks](../docs/known-risks.md)). If there are more than 21 landmarks, only the first 21 are used.
2. **Origin.** Subtract the wrist (landmark 0) from every landmark, on all three axes.
3. **Scale.** `s = sqrt(dx² + dy² + dz²)`, the 3D distance from wrist to middle-finger MCP (landmark 9). Including z keeps the scale stable when the hand tilts toward or away from the camera. If `s < 1e-6`, the scale is degenerate and the hand is treated as absent. Otherwise divide x, y and z of every landmark by `s`.
4. **Rotation.** None. Hand orientation is part of the gesture.
5. **Handedness.** For a `"Left"` hand, negate x after steps 2–3, so both hands share the right-hand frame. y and z are unchanged.

## Two-hand layout

The output has two fixed slots: **slot 0 = Left, slot 1 = Right**. Each hand goes in the slot named by its handedness. If two hands claim the same handedness, the first valid one in input order fills the slot and later ones are dropped. Invalid hands (partial, degenerate, unknown handedness) claim nothing, so a valid hand listed after an invalid one of the same handedness still fills the slot.

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
