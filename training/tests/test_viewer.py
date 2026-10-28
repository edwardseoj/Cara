import pytest

pytest.importorskip("mediapipe")  # viewer extra is optional

import numpy as np

from cara_training.viewer import draw_landmarks, hands_mod


def test_blank_frame_has_no_hands():
    with hands_mod.Hands(max_num_hands=2, static_image_mode=True) as hands:
        assert draw_landmarks(hands, np.zeros((240, 320, 3), np.uint8)) == 0
