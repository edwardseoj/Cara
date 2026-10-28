"""Training jobs (#25, ADR 0003): the service, never Electron, runs the Docker GPU job.

One job at a time (one GPU). Job state lives in memory for the service's lifetime.
The trainer's last stdout line is its final metrics as JSON.
"""
import itertools
import json
import queue
import subprocess
import threading

_jobs = {}
_ids = itertools.count(1)
_queue = queue.Queue()
_lock = threading.Lock()
MODEL_KINDS = {"static", "motion"}


def command(model_kind):
    # shortcut: motion still runs the stub trainer, swap it when the motion trainer lands
    trainer = ["cara_training.train_static"] if model_kind == "static" else ["cara_training.stub_train", model_kind]
    return ["docker", "compose", "--profile", "train", "run", "--rm", "-T", "train", "python", "-m", *trainer]


def _worker():
    while True:
        job = _queue.get()
        job["status"] = "running"
        try:
            p = subprocess.run(command(job["model_kind"]), capture_output=True, text=True)
            if p.returncode:
                raise RuntimeError(p.stderr.strip()[-2000:] or f"exit {p.returncode}")
            job["metrics"] = json.loads(p.stdout.strip().splitlines()[-1])
            job["status"] = "succeeded"
        except Exception as e:  # noqa: BLE001  any trainer failure is a failed job
            job["error"] = str(e)
            job["status"] = "failed"


threading.Thread(target=_worker, daemon=True).start()


def start(_conn, body, _match):
    kind = body["model_kind"]
    if kind not in MODEL_KINDS:
        raise ValueError(f"model_kind must be one of {sorted(MODEL_KINDS)}")
    with _lock:
        job = {"id": next(_ids), "model_kind": kind, "status": "queued", "metrics": None, "error": None}
        _jobs[job["id"]] = job
    _queue.put(job)
    return 202, job


def get(_conn, _body, match):
    job = _jobs.get(int(match[1]))
    return (200, job) if job else (404, {"error": "no such job"})
