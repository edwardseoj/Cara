# Training workflow

Local development only. Nothing here ships with the app. Data collection happens in the app's Dev UI ([ADR 0002](adr/0002-record-landmarks-in-the-app-pipeline.md)); this stack stores, trains, and exports.

## Prerequisites

- NVIDIA GPU + driver (`nvidia-smi` works)
- Docker + [NVIDIA Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html)
- Python 3.10+
- A webcam (for the viewer)

## 1. Start the stack

```sh
docker compose up -d          # Postgres on host port 5433
docker compose run --rm train # builds training image, prints TensorFlow GPUs; exit 0 = GPU visible
```

## 2. Migrations

`training/migrations/*.sql` run automatically on the **first** init of an empty Postgres volume. To re-apply after changing one: `docker compose down -v && docker compose up -d` (**deletes the dataset**).

## 3. Python env and tests

```sh
cd training
python3 -m venv .venv && .venv/bin/pip install -e ".[dev,viewer]"
.venv/bin/pytest              # DB tests need Postgres up
```

## 4. Camera landmark viewer

```sh
.venv/bin/python -m cara_training.viewer   # q quits
```

Shows the webcam feed with landmarks for up to two hands. Smoke test only: it never writes to the dataset.

## 5. Record samples

_Placeholder._ Recording sessions run from the app's Dev UI (Milestone 2).

## 6. Train and export

Run the training service (`.venv/bin/python -m cara_training.service`), then press **Start training** in the Dev UI. The service queues one job at a time and runs it as `docker compose run --rm -T train python -m cara_training.stub_train <model kind>` (a stub until the real trainer lands); the trainer's last stdout line is its final metrics as JSON. Job status (queued / running / succeeded / failed) is in memory and lost when the service restarts. Export format is chosen in the export-format spike (Milestone 3).
