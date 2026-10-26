# Cara

Electron app that maps webcam hand gestures to Spotify actions. `README.md` holds the stack, roadmap, and reliability targets.

- **Vocabulary**: use the terms in `GLOSSARY.md` (gesture, action, mapping, idle, recording session, like/unlike) in code, docs, and commits.
- **Decisions**: before changing architecture, Spotify auth, or the training/app split, read `docs/adr/`. Record new hard-to-reverse decisions there as the next numbered ADR.
- **Normalization**: landmark preprocessing is defined once in `spec/`. A change to it updates the spec, the test vectors, and both the Python and JS implementations together.
- **Shipped vs dev-only**: `app/` ships and runs without Python. `training/` (Python, TensorFlow, Postgres, Docker) stays local.
- **Data**: the landmark dataset stays private. Keep it, and any recordings, out of git.
