# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Cara

Electron app that maps webcam hand gestures to Spotify actions. `README.md` holds the stack, roadmap, and reliability targets.

**Status**: pre-alpha, Milestone 0. No code exists yet: `app/`, `training/`, and `spec/` are planned, not present, so there are no build or test commands. Check the README roadmap before assuming a component exists, and add commands here as they land.

- **Vocabulary**: use the terms in `GLOSSARY.md` (gesture, action, mapping, idle, recording session, like/unlike) in code, docs, and commits.
- **Decisions**: before changing architecture, Spotify auth, or the training/app split, read `docs/adr/`. Record new hard-to-reverse decisions there as the next numbered ADR.
- **Normalization**: landmark preprocessing is defined once in `spec/`. A change to it updates the spec, the test vectors, and both the Python and JS implementations together.
- **Shipped vs dev-only**: `app/` ships and runs without Python. `training/` (Python, TensorFlow, Postgres, Docker) stays local.
- **Data**: the landmark dataset stays private. Keep it, and any recordings, out of git.
- **Privacy**: camera frames never leave the machine. The app's only network traffic is to Spotify (login and actions), with no telemetry.
- **False triggers**: idle is a trained class. A gesture fires only after it passes the confidence threshold and is held for N consecutive frames. Don't bypass this gate.

## Agent skills

### Issue tracker

Issues live in GitHub Issues on `edwardseoj/Cara`, managed with the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `GLOSSARY.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.
