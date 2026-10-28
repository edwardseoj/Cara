// Downloads the MediaPipe hand model once at install time, so the app needs no network to track hands.
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';

const URL = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';
const PATH = new globalThis.URL('./models/hand_landmarker.task', import.meta.url);

if (!existsSync(PATH)) {
  mkdirSync(new globalThis.URL('./models/', import.meta.url), { recursive: true });
  const res = await fetch(URL);
  if (!res.ok) throw new Error(`model download failed: ${res.status}`);
  writeFileSync(PATH, Buffer.from(await res.arrayBuffer()));
}
