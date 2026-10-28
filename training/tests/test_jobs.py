"""Training jobs via the service (#25, ADR 0003). A stub trainer stands in for the Docker job."""
import sys
import time

from cara_training import jobs
from test_service import api  # noqa: F401  (fixture)


def wait_for(api, job_id):
    seen = []
    for _ in range(300):
        status, job = api("GET", f"/jobs/{job_id}")
        assert status == 200
        if not seen or seen[-1] != job["status"]:
            seen.append(job["status"])
        if job["status"] in ("succeeded", "failed"):
            return seen, job
        time.sleep(0.02)
    raise AssertionError(seen)


def stub(monkeypatch, code):
    monkeypatch.setattr(jobs, "command", lambda kind: [sys.executable, "-c", code, kind])


def test_jobs_go_queued_running_succeeded_with_metrics(api, monkeypatch):
    stub(monkeypatch, "import sys,time,json; time.sleep(1); print('log'); print(json.dumps({'kind': sys.argv[1], 'accuracy': 0.9}))")
    status, first = api("POST", "/jobs", {"model_kind": "static"})
    assert status == 202
    _, second = api("POST", "/jobs", {"model_kind": "dynamic"})
    assert api("GET", f"/jobs/{second['id']}")[1]["status"] == "queued"  # one GPU job at a time
    seen, job = wait_for(api, first["id"])
    assert seen[-2:] == ["running", "succeeded"]
    assert job["metrics"] == {"kind": "static", "accuracy": 0.9}
    seen, job = wait_for(api, second["id"])
    assert seen[-1] == "succeeded"
    assert job["metrics"]["kind"] == "dynamic"


def test_failing_trainer_marks_job_failed(api, monkeypatch):
    stub(monkeypatch, "import sys; print('boom', file=sys.stderr); sys.exit(1)")
    _, job = api("POST", "/jobs", {"model_kind": "static"})
    _, job = wait_for(api, job["id"])
    assert job["status"] == "failed" and "boom" in job["error"]


def test_unknown_job_is_404_and_kind_required(api):
    assert api("GET", "/jobs/999999")[0] == 404
    assert api("POST", "/jobs", {})[0] == 400
