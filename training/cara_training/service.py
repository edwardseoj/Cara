"""Local training service for the Dev UI (ADR 0003). Localhost only; owns Postgres.

Run: python -m cara_training.service  (DATABASE_URL, PORT env vars optional)
"""
import json
import os
import re
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

import psycopg
from psycopg.types.json import Jsonb

from cara_training import jobs

DEFAULT_URL = "postgresql://cara:cara@127.0.0.1:5433/cara"
DEFAULT_PORT = 8765


class BadRequest(Exception):
    pass


def create_session(conn, body, _match):
    row = conn.execute(
        "INSERT INTO recording_session (recorder_id, lighting, camera, source) VALUES (%s, %s, %s, %s) RETURNING id",
        [body[k] for k in ("recorder_id", "lighting", "camera", "source")],
    ).fetchone()
    return 201, {"id": row[0]}


def save_sample(conn, body, _match):
    """Frames: [{ts_ms, hands}], in order; one frame for a static gesture. ts_ms is from session start."""
    frames = body["frames"]
    if not frames:
        raise BadRequest("frames must not be empty")
    sid = conn.execute(
        "INSERT INTO sample (recording_session_id, gesture_label, start_ms, end_ms) VALUES (%s, %s, %s, %s) RETURNING id",
        (body["recording_session_id"], body["gesture_label"], frames[0]["ts_ms"], frames[-1]["ts_ms"]),
    ).fetchone()[0]
    for idx, f in enumerate(frames):
        conn.execute("INSERT INTO frame (sample_id, idx, ts_ms, hands) VALUES (%s, %s, %s, %s)",
                     (sid, idx, f["ts_ms"], Jsonb(f["hands"])))
    return 201, {"id": sid}


# (method, path regex, handler(conn, body, match) -> (status, json)). New endpoints: add a line here.
ROUTES = [
    ("POST", r"/sessions", create_session),
    ("POST", r"/samples", save_sample),
    ("POST", r"/jobs", jobs.start),
    ("GET", r"/jobs/(\d+)", jobs.get),
]


def make_server(db_url=DEFAULT_URL, port=DEFAULT_PORT):
    class Handler(BaseHTTPRequestHandler):
        def _send(self, status, payload=None):
            data = b"" if payload is None else json.dumps(payload).encode()
            self.send_response(status)
            # Only the Electron Dev UI (app://cara) calls us; the server is bound to 127.0.0.1 anyway.
            self.send_header("Access-Control-Allow-Origin", "app://cara")
            self.send_header("Access-Control-Allow-Methods", "GET, POST, DELETE")
            self.send_header("Access-Control-Allow-Headers", "Content-Type")
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)

        def do_OPTIONS(self):
            self._send(204)

        def _dispatch(self):
            path = self.path.split("?", 1)[0]
            for method, pattern, handler in ROUTES:
                match = re.fullmatch(pattern, path)
                if method == self.command and match:
                    break
            else:
                return self._send(404, {"error": "not found"})
            try:
                length = int(self.headers.get("Content-Length") or 0)
                body = json.loads(self.rfile.read(length) or "{}")
                with psycopg.connect(db_url) as conn:  # one transaction per request
                    self._send(*handler(conn, body, match))
            except (BadRequest, KeyError, TypeError, ValueError, psycopg.errors.IntegrityError, psycopg.errors.DataError) as e:
                self._send(400, {"error": str(e)})

        do_GET = do_POST = do_DELETE = _dispatch

        def log_message(self, *args):
            pass

    return ThreadingHTTPServer(("127.0.0.1", port), Handler)


if __name__ == "__main__":
    server = make_server(os.environ.get("DATABASE_URL", DEFAULT_URL), int(os.environ.get("PORT", DEFAULT_PORT)))
    print(f"training service on http://127.0.0.1:{server.server_address[1]}")
    server.serve_forever()
