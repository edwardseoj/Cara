# Cara

Cara is a desktop app that lets you control Spotify with your hands: it watches a webcam, recognizes hand gestures, and turns them into playback actions.

## Language

### Gestures

**Gesture**:
A hand pose or hand movement that Cara recognizes as meaningful.
_Avoid_: Symbol, sign, hand symbol

**Static gesture**:
A gesture defined by a single hand pose, independent of movement.
_Avoid_: Pose, still gesture

**Motion gesture**:
A gesture defined by how a hand moves over a short window of frames, such as a swipe.
_Avoid_: Dynamic gesture, movement

**Two-hand gesture**:
A gesture that requires both hands to be recognized, such as volume control.
_Avoid_: Dual gesture

**Handedness**:
Whether a hand is the user's left or right hand, from the user's own point of view. The landmark frame's `handedness` field holds the tracker's raw label, which is mirrored relative to this; `userHand` in `app/landmarks.mjs` converts between the two (see ADR 0004).
_Avoid_: Side, chirality

**Idle**:
The state in which no gesture is being made; Cara treats it as a recognized class of its own.
_Avoid_: None, null, background, no-gesture

### Spotify

**Action**:
A Spotify operation that a gesture triggers, such as play, pause, next, previous, like, unlike, or volume.
_Avoid_: Command, control

**Like / Unlike**:
The action of adding the current track to, or removing it from, the user's Liked Songs.
_Avoid_: Favorite, save, heart

**Mapping**:
A pairing of one gesture with one action.
_Avoid_: Binding, shortcut

### Data

**Recording session**:
One sitting of collecting labeled hand landmarks, live at the webcam or from an imported video, tagged with who recorded it and under what conditions.
_Avoid_: Capture, take, run

**Sample**:
One labeled span of consecutive frames within a recording session. A static gesture sample may be a single frame; a motion or two-hand gesture sample spans a short window.
_Avoid_: Take, clip, example

**Training job**:
One run of training a model (static or motion) on the dataset, started from the Dev UI and run by the local training service (see ADR 0003).
_Avoid_: Training run, build

**Dev UI**:
The developer-only screen shown when the app runs from source, used to record samples, manage the dataset and start training jobs. Packaged builds exclude it.
_Avoid_: Admin panel, debug page
