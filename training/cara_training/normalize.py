"""Landmark normalization, implementing spec/normalization-v1.md."""
import math

SPEC_VERSION = 1
_SLOTS = ("Left", "Right")


def _hand(landmarks, handedness):
    """63 normalized floats, or None if the hand is partial or degenerate."""
    if len(landmarks) < 21 or any(p is None for p in landmarks):
        return None
    wx, wy, wz = landmarks[0]
    s = math.hypot(landmarks[9][0] - wx, landmarks[9][1] - wy)
    if s < 1e-6:
        return None
    flip = -1 if handedness == "Left" else 1
    return [v for x, y, z in landmarks[:21] for v in (flip * (x - wx) / s, (y - wy) / s, (z - wz) / s)]


def normalize(hands):
    """One frame of hands -> 128 floats: [Left presence, 63 Left, Right presence, 63 Right]."""
    slots = {}
    for h in hands:
        side = h["handedness"]
        if side in _SLOTS and side not in slots:  # first claim wins, even if invalid
            slots[side] = _hand(h["landmarks"], side)
    out = []
    for side in _SLOTS:
        feats = slots.get(side)
        out += [1.0, *feats] if feats else [0.0] * 64
    return out
