// Landmark source: webcam -> MediaPipe HandLandmarker (local wasm + model) -> raw frames.
// Everything stays in this process; nothing is sent anywhere.
import { FilesetResolver, HandLandmarker, DrawingUtils } from './node_modules/@mediapipe/tasks-vision/vision_bundle.mjs';
import { toFrame, handLabels, LABEL_FONT } from './landmarks.mjs';

const video = document.getElementById('video');
const canvas = document.getElementById('overlay');
const ctx = canvas.getContext('2d');
const draw = new DrawingUtils(ctx);
ctx.font = LABEL_FONT;
ctx.textAlign = 'center';
ctx.textBaseline = 'top';
ctx.fillStyle = '#fff';
ctx.strokeStyle = '#000'; // dark outline keeps white text legible on light backgrounds
ctx.lineWidth = 3;
ctx.lineJoin = 'round';

const fileset = await FilesetResolver.forVisionTasks('./node_modules/@mediapipe/tasks-vision/wasm');
const tracker = await HandLandmarker.createFromOptions(fileset, {
  baseOptions: { modelAssetPath: './models/hand_landmarker.task' },
  runningMode: 'VIDEO',
  numHands: 2,
});

video.srcObject = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
await video.play();

// Later consumers (recording, inference) listen for 'landmarks' events: event.detail is a frame.
let lastTime = -1;
const gestureEl = document.getElementById('gesture');
function tick() {
  if (video.currentTime !== lastTime) {
    lastTime = video.currentTime;
    const timestamp = performance.now();
    const result = tracker.detectForVideo(video, timestamp);
    const frame = toFrame(result, timestamp);
    window.dispatchEvent(new CustomEvent('landmarks', { detail: frame }));
    window.cara?.sendFrame(frame);
    if (!frame.hands.length) gestureEl.hidden = true; // idle: clear the last recognized gesture
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const points of result.landmarks) {
      draw.drawConnectors(points, HandLandmarker.HAND_CONNECTIONS, { color: '#0f0', lineWidth: 3 });
      draw.drawLandmarks(points, { color: '#f00', radius: 3 });
    }
    for (const { text, x, y } of handLabels(frame, canvas.width, canvas.height)) {
      // The canvas is CSS-mirrored; flip locally so the glyphs read normally.
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(-1, 1);
      ctx.strokeText(text, 0, 0);
      ctx.fillText(text, 0, 0);
      ctx.restore();
    }
  }
  requestAnimationFrame(tick);
}
window.cara?.onGesture(({ gesture }) => { gestureEl.textContent = gesture; gestureEl.hidden = false; });
tick();
