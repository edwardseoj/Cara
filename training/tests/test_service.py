"""Training service HTTP API against real Postgres (ADR 0003). Needs `docker compose up -d`."""
import json
import threading
import urllib.error
import urllib.request

import pytest

from cara_training import service


@pytest.fixture
def api(db_url):
    server = service.make_server(db_url, port=0)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    base = f"http://127.0.0.1:{server.server_address[1]}"

    def call(method, path, body=None):
        data = None if body is None else json.dumps(body).encode()
        req = urllib.request.Request(base + path, method=method, data=data, headers={"Content-Type": "application/json"})
        try:
            with urllib.request.urlopen(req) as r:
                return r.status, json.loads(r.read() or "null")
        except urllib.error.HTTPError as e:
            return e.code, json.loads(e.read() or "null")

    yield call
    server.shutdown()
    server.server_close()


HANDS = [{"handedness": "Right", "landmarks": [{"x": 0.25, "y": 0.5, "z": -0.125}] * 21}]
SESSION = {"recorder_id": "rec-1", "lighting": "daylight", "camera": "built-in", "source": "webcam"}


def test_records_single_frame_sample(api, db):
    status, session = api("POST", "/sessions", SESSION)
    assert status == 201
    status, sample = api("POST", "/samples", {"recording_session_id": session["id"], "gesture_label": "idle",
                                              "frames": [{"ts_ms": 1500, "hands": HANDS}]})
    assert status == 201
    assert db.execute("SELECT recorder_id, lighting, camera, source FROM recording_session WHERE id = %s",
                      (session["id"],)).fetchone() == ("rec-1", "daylight", "built-in", "webcam")
    assert db.execute("SELECT recording_session_id, gesture_label, start_ms, end_ms FROM sample WHERE id = %s",
                      (sample["id"],)).fetchone() == (session["id"], "idle", 1500, 1500)
    assert db.execute("SELECT idx, ts_ms, hands FROM frame WHERE sample_id = %s",
                      (sample["id"],)).fetchall() == [(0, 1500, HANDS)]


def test_rejects_bad_input_without_saving(api, db):
    assert api("POST", "/sessions", {**SESSION, "source": "telepathy"})[0] == 400
    assert api("POST", "/sessions", {"recorder_id": "x"})[0] == 400
    frame = [{"ts_ms": 0, "hands": []}]
    assert api("POST", "/samples", {"recording_session_id": 999, "gesture_label": "fist", "frames": frame})[0] == 400
    assert api("POST", "/samples", {"recording_session_id": 1, "gesture_label": "fist", "frames": []})[0] == 400
    assert db.execute("SELECT count(*) FROM sample").fetchone()[0] == 0


def test_unknown_route_is_404(api):
    assert api("GET", "/nope")[0] == 404


def test_answers_cors_preflight_from_dev_ui(api):
    assert api("OPTIONS", "/samples")[0] == 204
