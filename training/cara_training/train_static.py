"""Static gesture trainer (#28): Postgres frames -> normalization v1 -> dense classifier -> TF.js layers (ADR 0005).

Usage: python -m cara_training.train_static [OUT_DIR]   (DATABASE_URL picks the dataset)
Writes OUT_DIR/model.json, weight shards and metadata.json; last stdout line is metrics JSON.
"""
import json
import os
import pathlib
import random
import sys

# TF.js 4.22 can't load Keras 3 layer configs; build with Keras 2 (tf-keras), see ADR 0005
os.environ["TF_USE_LEGACY_KERAS"] = "1"

from cara_training.normalize import SPEC_VERSION, normalize

DEFAULT_OUT = "models/static"


def load(conn):
    """[(recording_session_id, gesture_label, 128 floats)] per frame; idle is just another label."""
    rows = conn.execute("SELECT s.recording_session_id, s.gesture_label, f.hands FROM frame f "
                        "JOIN sample s ON s.id = f.sample_id ORDER BY f.id").fetchall()
    return [(sid, label, normalize([{**h, "landmarks": [p and [p["x"], p["y"], p["z"]] for p in h.get("landmarks") or []]}
                                    for h in hands]))
            for sid, label, hands in rows]


def split(rows, seed=0):
    """(train, val, test) by recording session, so no session's frames leak across splits."""
    sessions = sorted({r[0] for r in rows})
    if len(sessions) < 3:
        raise ValueError("need at least 3 recording sessions to split")
    random.Random(seed).shuffle(sessions)
    n_held = max(1, round(len(sessions) * 0.15))
    held = {"test": set(sessions[:n_held]), "val": set(sessions[n_held:2 * n_held])}
    return ([r for r in rows if r[0] not in held["test"] | held["val"]],
            [r for r in rows if r[0] in held["val"]],
            [r for r in rows if r[0] in held["test"]])


def train(rows, out_dir, epochs=50):
    import numpy as np
    import tensorflow as tf
    import tensorflowjs as tfjs

    tf.random.set_seed(0)  # not keras set_random_seed: tf-keras 2.16 breaks with it on Python 3.12
    labels = sorted({r[1] for r in rows})

    def xy(part):
        return (np.array([r[2] for r in part], dtype="float32").reshape(-1, 128),
                np.array([labels.index(r[1]) for r in part]))

    (x_tr, y_tr), (x_va, y_va), (x_te, y_te) = map(xy, split(rows))
    model = tf.keras.Sequential([
        tf.keras.Input(shape=(128,)),
        tf.keras.layers.Dense(64, activation="relu"),
        tf.keras.layers.Dense(len(labels), activation="softmax"),
    ])
    model.compile(optimizer="adam", loss="sparse_categorical_crossentropy", metrics=["accuracy"])
    model.fit(x_tr, y_tr, validation_data=(x_va, y_va), epochs=epochs, verbose=0)
    out = pathlib.Path(out_dir)
    tfjs.converters.save_keras_model(model, str(out))
    (out / "metadata.json").write_text(json.dumps({"model_kind": "static", "labels": labels,
                                                   "normalization_spec_version": SPEC_VERSION}, indent=2))
    return {"model_kind": "static", "labels": labels, "frames": {"train": len(x_tr), "val": len(x_va), "test": len(x_te)},
            "val_accuracy": float(model.evaluate(x_va, y_va, verbose=0)[1]),
            "test_accuracy": float(model.evaluate(x_te, y_te, verbose=0)[1]), "out_dir": str(out)}


def main(out_dir=DEFAULT_OUT):
    import psycopg

    with psycopg.connect(os.environ["DATABASE_URL"]) as conn:
        rows = load(conn)
    print(json.dumps(train(rows, out_dir)))


if __name__ == "__main__":
    main(*sys.argv[1:])
