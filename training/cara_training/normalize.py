"""Landmark normalization, implementing spec/normalization-v1.md."""
import math

SPEC_VERSION = 1
LANDMARK_COUNT = 21
WRIST = 0
MIDDLE_MCP = 9
MIN_SCALE = 1e-6
SLOT_SIZE = 1 + 3 * LANDMARK_COUNT  # presence + xyz per landmark
# handedness -> (output slot, x sign); anything else is ignored
SIDES = {"Left": (0, -1), "Right": (1, 1)}


def normalize_hand(hand):
    """63 normalized floats, or None if the hand is partial or degenerate."""
    landmarks = hand.get("landmarks")
    if landmarks is None or len(landmarks) < LANDMARK_COUNT:
        return None
    landmarks = landmarks[:LANDMARK_COUNT]
    if any(p is None for p in landmarks):
        return None
    wx, wy, wz = landmarks[WRIST]
    scale = math.hypot(landmarks[MIDDLE_MCP][0] - wx, landmarks[MIDDLE_MCP][1] - wy)
    if scale < MIN_SCALE:
        return None
    _, x_sign = SIDES[hand["handedness"]]
    return [v for x, y, z in landmarks for v in (x_sign * (x - wx) / scale, (y - wy) / scale, (z - wz) / scale)]


def normalize(hands):
    """One frame of hands -> 128 floats: [Left presence, 63 Left, Right presence, 63 Right]."""
    out = [0.0] * (2 * SLOT_SIZE)
    claimed = set()
    for hand in hands:
        side = SIDES.get(hand.get("handedness"))
        if side is None or side[0] in claimed:
            continue
        slot = side[0]
        claimed.add(slot)  # first claim wins, even if this hand turns out invalid
        coords = normalize_hand(hand)
        if coords:
            start = slot * SLOT_SIZE
            out[start:start + SLOT_SIZE] = [1.0, *coords]
    return out
