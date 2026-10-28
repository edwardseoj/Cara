"""Stub trainer (#25): proves the job plumbing until real training exists. Prints final metrics as JSON."""
import json
import sys
import time

time.sleep(2)
print(json.dumps({"model_kind": sys.argv[1], "stub": True, "accuracy": None}))
