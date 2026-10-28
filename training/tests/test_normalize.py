import json
from pathlib import Path

import pytest

from cara_training.normalize import SPEC_VERSION, normalize

SPEC = json.loads((Path(__file__).parents[2] / "spec" / "normalization-v1.vectors.json").read_text())


def test_spec_version_matches_vectors():
    assert SPEC_VERSION == SPEC["version"]


@pytest.mark.parametrize("case", SPEC["cases"], ids=lambda c: c["name"])
def test_vector(case):
    assert normalize(case["input"]) == pytest.approx(case["expected"], abs=SPEC["tolerance"], rel=0)
