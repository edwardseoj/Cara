"""Sample counts and delete for the Dev UI (#24). Routes registered in service.ROUTES."""


def counts(conn, _body, _match):
    by = lambda col: dict(conn.execute(f"SELECT {col}, count(*) FROM sample GROUP BY 1").fetchall())  # noqa: E731
    return 200, {"by_gesture": by("gesture_label"),
                 "by_session": {str(k): v for k, v in by("recording_session_id").items()}}


def delete_sample(conn, _body, match):
    sid = int(match[1])
    if not conn.execute("DELETE FROM sample WHERE id = %s RETURNING id", (sid,)).fetchone():
        return 404, {"error": "no such sample"}
    return 200, {"deleted": sid}
