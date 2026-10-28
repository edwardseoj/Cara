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

    call.port = server.server_address[1]
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


def raw(api, method, path, headers, body=b"{}"):
    import http.client
    conn = http.client.HTTPConnection("127.0.0.1", api.port)
    conn.putrequest(method, path, skip_host="Host" in headers)
    for k, v in headers.items():
        conn.putheader(k, v)
    conn.putheader("Content-Length", str(len(body)))
    conn.endheaders(body)
    return conn.getresponse().status


def test_rejects_cross_site_and_rebound_requests(api, db):
    json_ct = {"Content-Type": "application/json"}
    assert raw(api, "POST", "/sessions", {"Content-Type": "text/plain"}) == 415
    assert raw(api, "POST", "/sessions", {**json_ct, "Origin": "https://evil.example"}) == 403
    assert raw(api, "GET", "/counts", {"Origin": "https://evil.example"}) == 403
    assert raw(api, "GET", "/counts", {"Host": f"evil.example:{api.port}"}) == 403
    assert raw(api, "GET", "/counts", {"Origin": "app://cara", "Host": f"localhost:{api.port}"}) == 200
    assert db.execute("SELECT count(*) FROM recording_session").fetchone()[0] == 0


def test_unexpected_error_is_500(api, monkeypatch):
    def boom(*_):
        raise RuntimeError("boom")
    monkeypatch.setattr(service, "ROUTES", [("GET", r"/boom", boom)])
    assert api("GET", "/boom")[0] == 500


def test_replies_only_after_commit(api, monkeypatch):
    # A 2xx must mean the write is committed, or the client's next request can miss it (#82).
    def fails_at_commit(conn, *_):
        conn.execute("CREATE TEMP TABLE p (id int PRIMARY KEY)")
        conn.execute("CREATE TEMP TABLE c (p_id int REFERENCES p DEFERRABLE INITIALLY DEFERRED)")
        conn.execute("INSERT INTO c VALUES (1)")
        return 201, {"id": 1}
    monkeypatch.setattr(service, "ROUTES", [("POST", r"/commit", fails_at_commit)])
    assert api("POST", "/commit", {})[0] == 400
