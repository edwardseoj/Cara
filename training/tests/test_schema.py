"""Needs the compose Postgres: `docker compose up -d`."""
import pathlib
import uuid

import psycopg
import pytest

ADMIN = "postgresql://cara:cara@127.0.0.1:5433/postgres"
MIGRATIONS = sorted(pathlib.Path(__file__).parent.parent.joinpath("migrations").glob("*.sql"))


@pytest.fixture
def db():
    name = f"cara_test_{uuid.uuid4().hex[:8]}"
    with psycopg.connect(ADMIN, autocommit=True) as admin:
        admin.execute(f"CREATE DATABASE {name}")
        try:
            with psycopg.connect(ADMIN.rsplit("/", 1)[0] + "/" + name, autocommit=True) as conn:
                for m in MIGRATIONS:
                    conn.execute(m.read_text())
                yield conn
        finally:
            admin.execute(f"DROP DATABASE {name} WITH (FORCE)")


def hand(side, x):
    return {"handedness": side, "landmarks": [{"x": x, "y": 0.5, "z": -0.1}] * 21}


def new_session(db, source="webcam"):
    return db.execute(
        "INSERT INTO recording_session (recorder_id, lighting, camera, source)"
        " VALUES ('rec-1', 'daylight', 'built-in', %s) RETURNING id",
        (source,),
    ).fetchone()[0]


def test_session_with_multi_frame_sample_round_trips(db):
    sid = new_session(db)
    smp = db.execute(
        "INSERT INTO sample (recording_session_id, gesture_label, start_ms, end_ms)"
        " VALUES (%s, 'idle', 0, 90) RETURNING id",
        (sid,),
    ).fetchone()[0]
    frames = [(i, i * 30, [hand("Left", 0.1 * i)]) for i in range(3)]
    for idx, ts, hands in reversed(frames):
        db.execute(
            "INSERT INTO frame (sample_id, idx, ts_ms, hands) VALUES (%s, %s, %s, %s::jsonb)",
            (smp, idx, ts, psycopg.types.json.Jsonb(hands)),
        )

    session = db.execute(
        "SELECT recorder_id, lighting, camera, source, created_at FROM recording_session WHERE id = %s", (sid,)
    ).fetchone()
    assert session[:4] == ("rec-1", "daylight", "built-in", "webcam")
    assert session[4] is not None
    assert db.execute("SELECT gesture_label, start_ms, end_ms FROM sample WHERE id = %s", (smp,)).fetchone() == ("idle", 0, 90)
    rows = db.execute("SELECT idx, ts_ms, hands FROM frame WHERE sample_id = %s ORDER BY idx", (smp,)).fetchall()
    assert rows == [(i, ts, hands) for i, ts, hands in frames]


def test_rejects_unknown_source(db):
    with pytest.raises(psycopg.errors.CheckViolation):
        new_session(db, source="telepathy")


def test_rejects_duplicate_frame_index(db):
    sid = new_session(db)
    smp = db.execute(
        "INSERT INTO sample (recording_session_id, gesture_label, start_ms, end_ms) VALUES (%s, 'fist', 0, 0) RETURNING id",
        (sid,),
    ).fetchone()[0]
    ins = "INSERT INTO frame (sample_id, idx, ts_ms, hands) VALUES (%s, 0, 0, '[]')"
    db.execute(ins, (smp,))
    with pytest.raises(psycopg.errors.UniqueViolation):
        db.execute(ins, (smp,))
