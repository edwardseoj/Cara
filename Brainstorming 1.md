I want to recreate Calira from the ground up (the original is messy and I don't want to use tokens just fixing it)
- Solo project, done in free time (no target date)
- Portfolio + fun personal project, extending my old college group project
- I don't think I need to ask permission, as long as I say that it is a recreation of a college project

**New name: Cara**

### Why I want to redo it?
- I really got inspired by those early Ironman films where Tony Stark uses his hands to control his computer. I wanted to do that for Spotify, and the current project is too messy to even fix so it's better to fix from the ground up

### Tech stack

#### Shipped app (Linux first, Windows/Mac later)
- Electron (packaged with electron-builder)
- MediaPipe in JS (`@mediapipe/tasks-vision`) for camera + hand landmarks
- Exported gesture models (TF.js / ONNX) for inference — no Python at runtime
- SQLite / JSON for settings, gesture mappings, Spotify token
- Spotify Web API — remote control of active device, OAuth PKCE, allowlisted users only (dev mode, requires Premium)

#### Local dev / training only (not shipped)
- Python + MediaPipe + OpenCV for data collection
- TensorFlow for GPU training
- PostgreSQL for the landmark dataset + metadata (label, session, hand, conditions)
- Docker for the GPU training container + Postgres (not used for deployment)

### Decisions
- Dataset stores landmarks, not raw video (smaller, private). Include 2–3 other people's hands before calling it "reliable"
- Static gestures: small landmark classifier. Motion gestures: sequence model (LSTM / 1D-CNN over ~30 frames), with rule-based fallback for swipe / volume
- Landmark normalization defined once as a spec with test vectors, shared by Python and JS
- Include an idle / "no gesture" class + confidence threshold + hold-for-N-frames
- "Reliably trained" = ≥95% accuracy on held-out sessions, <1 false trigger per 10 min of normal desk use, <100ms latency
- v1 scope: play/pause, next/prev, favorite/unfavorite, volume. Maximize/minimize/scroll are OS-specific → post-v1

### Features
#### Old
- Static hand symbols
- real time video
- deployed model

#### New
- Hand gestures (two hands)
- Spotify API
- Better UI / frontend
- Handmade data set
- GPU powered AI training (not for deployment)
- Logo
- Executable for Linux (Windows and Mac later)

---
### Milestones

0. Setup: repo, Docker training stack + Postgres, Python script showing camera feed with landmarks. No training yet
0.5. Spotify spike: register app, OAuth PKCE login, play/pause from a script
1. Shared landmark preprocessing spec + test vectors (Python and JS must both pass)
2. Electron dev UI: live landmarks, record mode (pick label → save frames to Postgres), start-training button
3. Static gestures (play, pause, favorite/unfavorite + idle class). Train, export, run inference in JS with threshold + hold-N-frames
4. Connect gestures to Spotify → **MVP v0.1** (Linux build)
5. One-hand motion gestures: next / prev (sequence model, rules fallback)
6. Two-hand gestures: volume
7. Reach the "reliable" targets + polished UI + logo → **v1**
8. Post-v1: Windows/Mac builds via GitHub Actions, OS window controls (maximize, minimize, scroll)
