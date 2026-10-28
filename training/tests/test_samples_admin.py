"""Sample counts and delete (#24), through the training service HTTP API."""
from test_service import HANDS, SESSION, api  # noqa: F401  (api is a fixture)


def record(api, session_id, label):
    return api("POST", "/samples", {"recording_session_id": session_id, "gesture_label": label,
                                    "frames": [{"ts_ms": 0, "hands": HANDS}]})[1]["id"]


def test_counts_by_gesture_and_recording_session(api):
    assert api("GET", "/counts") == (200, {"by_gesture": {}, "by_session": {}})
    s1 = api("POST", "/sessions", SESSION)[1]["id"]
    s2 = api("POST", "/sessions", SESSION)[1]["id"]
    record(api, s1, "fist")
    record(api, s1, "idle")
    record(api, s2, "fist")
    assert api("GET", "/counts") == (200, {"by_gesture": {"fist": 2, "idle": 1},
                                           "by_session": {str(s1): 2, str(s2): 1}})


def test_delete_sample_updates_counts(api):
    s = api("POST", "/sessions", SESSION)[1]["id"]
    keep = record(api, s, "fist")
    bad = record(api, s, "fist")
    assert api("DELETE", f"/samples/{bad}") == (200, {"deleted": bad})
    assert api("GET", "/counts")[1]["by_gesture"] == {"fist": 1}
    assert api("DELETE", f"/samples/{bad}")[0] == 404
    assert keep != bad
