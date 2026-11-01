"""scripts/build_utilities.py.

Generate data/utilities.json from core EIA 861 yearly reliability CSV.

Run from project root folder with:

uv run --no-project python scripts/build_utilities.py
"""

import csv
import json
from pathlib import Path

source = Path("data/core_eia861__yearly_reliability.csv")
target = Path("data/utilities.json")

required = {
    "utility_id_eia",
    "utility_name_eia",
    "state",
    "report_date",
    "entity_type",
}

if not source.is_file():
    raise SystemExit(f"Missing source: {source}")

utilities = {}

with source.open("r", encoding="utf-8-sig", newline="") as stream:
    reader = csv.DictReader(stream)

    missing = required.difference(reader.fieldnames or [])
    if missing:
        raise SystemExit(f"Missing CSV columns: {sorted(missing)}")

    for row in reader:
        utility_id = (row["utility_id_eia"] or "").strip()
        utility_id = utility_id.removesuffix(".0")
        name = (row["utility_name_eia"] or "").strip()
        state = (row["state"] or "").strip().upper()
        date = (row["report_date"] or "").strip()
        entity_type = (row["entity_type"] or "").strip()

        if not utility_id or not name or not state:
            continue

        key = (state, utility_id)
        previous = utilities.get(key)

        # Retain the most recent record for each state/utility pair.
        if previous is None or date >= previous[0]:
            utilities[key] = (
                date,
                {
                    "id": utility_id,
                    "name": name,
                    "state": state,
                    "entityType": entity_type,
                },
            )

items = [record for _, record in utilities.values()]
items.sort(
    key=lambda row: (
        row["state"],
        row["name"].casefold(),
        row["id"],
    )
)

target.write_text(
    json.dumps(
        {
            "schemaVersion": "1.0.0",
            "utilities": items,
        },
        indent=2,
        ensure_ascii=False,
    )
    + "\n",
    encoding="utf-8",
)

print(f"Created {target}")
print(f"Utility/state entries: {len(items):,}")
print(f"Distinct utilities: {len({row['id'] for row in items}):,}")
print(f"Distinct states: {len({row['state'] for row in items}):,}")
