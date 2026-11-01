"""Smoke-test both data builders on every supported Python version."""

import csv
import json
from pathlib import Path
import subprocess
import sys


def test_builders_smoke(tmp_path: Path) -> None:
    root = Path(__file__).resolve().parents[1]
    source = root / "data/core_eia861__yearly_reliability.csv"

    # Use the real CSV header so the fixture matches the source schema.
    with source.open(encoding="utf-8-sig", newline="") as stream:
        fieldnames = csv.DictReader(stream).fieldnames

    assert fieldnames is not None

    data_dir = tmp_path / "data"
    data_dir.mkdir()

    row = dict.fromkeys(fieldnames, "")
    row.update(
        utility_id_eia="123",
        utility_name_eia="Smoke Test Utility",
        state="MN",
        report_date="2025-01-01",
        standard="ieee_standard",
        entity_type="Cooperative",
        customers="100",
        saidi_w_major_event_days_minutes="12.5",
        saifi_w_major_event_days_customers="0.5",
        caidi_w_major_event_days_minutes="25",
    )

    with (data_dir / source.name).open("w", encoding="utf-8", newline="") as stream:
        writer = csv.DictWriter(stream, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerow(row)

    for script in ("build_utilities.py", "build_reliability.py"):
        result = subprocess.run(
            [sys.executable, str(root / "scripts" / script)],
            cwd=tmp_path,
            capture_output=True,
            text=True,
            check=False,
        )
        assert result.returncode == 0, (
            f"{script} failed:\n{result.stdout}\n{result.stderr}"
        )

    utilities = json.loads((data_dir / "utilities.json").read_text(encoding="utf-8"))
    reliability = json.loads(
        (data_dir / "reliability/123.json").read_text(encoding="utf-8")
    )

    assert utilities["utilities"][0]["id"] == "123"
    assert reliability["id"] == "123"
    assert (
        reliability["records"][0]["metrics"]["including-major-event-days"]["saidi"]
        == 12.5
    )
