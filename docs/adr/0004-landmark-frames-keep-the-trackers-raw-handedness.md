# Landmark frames keep the tracker's raw handedness

MediaPipe reports handedness assuming a mirrored (selfie) input image. Cara passes the tracker unmirrored camera frames; the CSS `scaleX(-1)` only mirrors what is shown on screen. So the raw `Left`/`Right` label is the opposite of the user's real hand.

We keep the raw label in landmark frames and samples, and convert it for display only, through the mirror-rule function in the landmarks module. That is the one place the rule lives. If the camera path turns out not to be swapped, only that function changes.

Consequences: samples already recorded, normalization v1 and its test vectors stay valid. Every user-facing consumer (the live overlay, roles in a two-hand gesture, the direction of a motion gesture) must go through the conversion and never read the raw label as the user's hand. We rejected fixing it in the data. Swapping only the label moves each hand into the other slot and flips which hand gets x-negated. Feeding the tracker mirrored frames gives the same normalized values, but in the other slot. Either way old and new samples disagree, which would need a normalization v2, new vectors and re-recording every recording session.
