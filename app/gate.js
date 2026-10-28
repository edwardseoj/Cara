// The gate (CLAUDE.md: never bypass): the one false-trigger filter every recognizer feeds.
// A gesture fires once it is the top class at >= threshold for holdFrames consecutive frames,
// fires once per hold, and re-arms only after a confident idle frame.
function createGate({ threshold = 0.8, holdFrames = 5, idle = "idle" } = {}) {
  let streakLabel = null;
  let streak = 0;
  let armed = true;
  // label: top class; confidence: its probability. Returns the gesture name when it fires, else null.
  return function step(label, confidence) {
    if (confidence < threshold) {
      streakLabel = null;
      streak = 0;
      return null;
    }
    if (label === idle) {
      armed = true;
      streakLabel = null;
      streak = 0;
      return null;
    }
    streak = label === streakLabel ? streak + 1 : 1;
    streakLabel = label;
    if (!armed || streak < holdFrames) return null;
    armed = false;
    return label;
  };
}

module.exports = { createGate };
