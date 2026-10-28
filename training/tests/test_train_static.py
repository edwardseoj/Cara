"""Static classifier trainer (#28): tiny synthetic fixture, CPU, needs Postgres + tensorflow."""
import json
import random

import pytest

from cara_training import train_static


def hand(handedness, spread):
    rnd = random.Random()
    return {"handedness": handedness,
            "landmarks": [{"x": 0.5 + i * spread * 0.01 + rnd.uniform(0, 0.001), "y": 0.5 + i * 0.01, "z": 0.0}
                          for i in range(21)]}


def seed(db, sessions=6):
    for s in range(sessions):
        sid = db.execute("INSERT INTO recording_session (recorder_id, lighting, camera, source) "
                         "VALUES ('r', 'day', 'cam', 'webcam') RETURNING id").fetchone()[0]
        for label, hands in [("idle", lambda: []), ("palm", lambda: [hand("Right", 1)]), ("fist", lambda: [hand("Left", 3)])]:
            smp = db.execute("INSERT INTO sample (recording_session_id, gesture_label, start_ms, end_ms) "
                             "VALUES (%s, %s, 0, 100) RETURNING id", (sid, label)).fetchone()[0]
            for i in range(5):
                db.execute("INSERT INTO frame (sample_id, idx, ts_ms, hands) VALUES (%s, %s, %s, %s)",
                           (smp, i, i * 10, json.dumps(hands())))


def test_split_is_by_recording_session_not_frame():
    rows = [(s, "idle", [0.0]) for s in range(10) for _ in range(3)]
    parts = train_static.split(rows)
    sessions = [{r[0] for r in p} for p in parts]
    assert all(sessions)
    assert not (sessions[0] & sessions[1] or sessions[0] & sessions[2] or sessions[1] & sessions[2])
    assert sum(len(p) for p in parts) == len(rows)


def test_load_normalizes_with_python_normalizer_and_keeps_idle(db):
    seed(db, sessions=1)
    rows = train_static.load(db)
    assert {r[1] for r in rows} == {"idle", "palm", "fist"}
    assert all(len(r[2]) == 128 for r in rows)
    assert any(r[2][64] == 1.0 for r in rows if r[1] == "palm")  # Right slot present


def test_train_exports_tfjs_layers_model_with_metadata(db, tmp_path):
    pytest.importorskip("tensorflowjs")
    seed(db)
    metrics = train_static.train(train_static.load(db), tmp_path, epochs=2)
    meta = json.loads((tmp_path / "metadata.json").read_text())
    assert meta["labels"] == ["fist", "idle", "palm"]
    assert meta["normalization_spec_version"] == 1
    model = json.loads((tmp_path / "model.json").read_text())
    assert model["format"] == "layers-model"
    assert 0.0 <= metrics["test_accuracy"] <= 1.0


def test_train_refuses_dataset_without_idle(tmp_path):
    rows = [(s, "palm", [0.0] * 128) for s in range(3)]
    with pytest.raises(ValueError, match="idle"):
        train_static.train(rows, tmp_path, epochs=1)
