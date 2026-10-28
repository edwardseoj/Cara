# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Cara

Electron app that maps webcam hand gestures to Spotify actions. `README.md` holds the stack, roadmap, and reliability targets.

**Status**: pre-alpha, Milestone 0. `app/`, `training/` and `spec/` are scaffolded (placeholder tests, dataset schema); the rest of the README roadmap is planned. Check it before assuming a component exists.

## Commands

- App (`app/`): `npm install`, `npm start`, `npm test` (Node built-in runner)
- Dev UI stylesheet (`app/dev/dev-ui.css`, untracked) is built by `npm start` (prestart) or `npm run dev:css` (watch); missing it gives ERR_FILE_NOT_FOUND.
- Training (`training/`): `python3 -m venv .venv && .venv/bin/pip install -e ".[dev]"`, `.venv/bin/pytest` (DB tests need Postgres up)
- Postgres: `docker compose up -d` (host port 5433, schema from `training/migrations/` on first init; `docker compose down -v` to reset)

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
