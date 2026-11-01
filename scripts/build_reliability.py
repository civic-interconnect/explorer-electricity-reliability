"""scripts/build_reliability.py.

Generate one data/reliability/<utility_id>.json file per utility from the
core EIA 861 yearly reliability CSV.

Each file holds every state, year, and reporting standard recorded for that
utility. Values that the CSV leaves blank are written as null, never as zero.

Run from project root folder with:

uv run --no-project python scripts/build_reliability.py
"""

import csv
import json
from pathlib import Path

source = Path("data/core_eia861__yearly_reliability.csv")
target_folder = Path("data/reliability")

# Each variant maps the three indices to their column names in the CSV.
variants = {
    "including-major-event-days": {
        "saidi": "saidi_w_major_event_days_minutes",
        "saifi": "saifi_w_major_event_days_customers",
        "caidi": "caidi_w_major_event_days_minutes",
    },
    "excluding-major-event-days": {
        "saidi": "saidi_wo_major_event_days_minutes",
        "saifi": "saifi_wo_major_event_days_customers",
        "caidi": "caidi_wo_major_event_days_minutes",
    },
    "including-major-event-days-excluding-loss-of-supply": {
        "saidi": "saidi_w_major_event_days_minus_loss_of_service_minutes",
        "saifi": "saifi_w_major_event_days_minus_loss_of_service_customers",
        "caidi": "caidi_w_major_event_days_minus_loss_of_service_minutes",
    },
}

required = {
    "utility_id_eia",
    "utility_name_eia",
    "state",
    "report_date",
    "standard",
    "entity_type",
    "customers",
}
for columns in variants.values():
    required.update(columns.values())

if not source.is_file():
    raise SystemExit(f"Missing source: {source}")


def number_or_none(text, line_number, column):
    """Return a float for a filled cell, or None for a blank or "null" cell."""
    text = (text or "").strip()
    if text == "" or text.lower() == "null":
        return None
    try:
        return float(text)
    except ValueError:
        raise SystemExit(
            f"Line {line_number}: column {column} is not a number: {text!r}"
        )


utilities = {}
rows_read = 0
rows_skipped = 0
standards_seen = set()

with source.open("r", encoding="utf-8-sig", newline="") as stream:
    reader = csv.DictReader(stream)

    missing = required.difference(reader.fieldnames or [])
    if missing:
        raise SystemExit(f"Missing CSV columns: {sorted(missing)}")

    for row in reader:
        rows_read += 1
        line_number = reader.line_num

        utility_id = (row["utility_id_eia"] or "").strip()
        # Some CSV exports write whole numbers as 123.0
        utility_id = utility_id.removesuffix(".0")
        name = (row["utility_name_eia"] or "").strip()
        state = (row["state"] or "").strip().upper()
        date = (row["report_date"] or "").strip()
        standard = (row["standard"] or "").strip()
        entity_type = (row["entity_type"] or "").strip()

        # The ID becomes a file name, so it must be digits only.
        if (
            not utility_id.isdigit()
            or not name
            or not state
            or len(date) < 4
            or not date[:4].isdigit()
        ):
            rows_skipped += 1
            continue

        customers_number = number_or_none(row["customers"], line_number, "customers")
        customers = None if customers_number is None else int(customers_number)

        metrics = {}
        for variant, columns in variants.items():
            indices = {}
            for index_name, column in columns.items():
                indices[index_name] = number_or_none(row[column], line_number, column)
            # A variant the utility did not report at all is omitted.
            if any(value is not None for value in indices.values()):
                metrics[variant] = indices

        standards_seen.add(standard)

        entry = utilities.setdefault(
            utility_id, {"latestDate": "", "name": name, "records": []}
        )
        # Use the name from the most recent report.
        if date >= entry["latestDate"]:
            entry["latestDate"] = date
            entry["name"] = name

        entry["records"].append(
            {
                "state": state,
                "year": int(date[:4]),
                "standard": standard,
                "entityType": entity_type,
                "customers": customers,
                "metrics": metrics,
            }
        )

target_folder.mkdir(parents=True, exist_ok=True)

years = []
for utility_id, entry in utilities.items():
    entry["records"].sort(
        key=lambda record: (record["state"], record["year"], record["standard"])
    )
    years.extend(record["year"] for record in entry["records"])

    document = {
        "schemaVersion": "1.0.0",
        "id": utility_id,
        "name": entry["name"],
        "units": {"saidi": "minutes", "saifi": "interruptions", "caidi": "minutes"},
        "records": entry["records"],
    }
    (target_folder / f"{utility_id}.json").write_text(
        json.dumps(document, separators=(",", ":"), ensure_ascii=False) + "\n",
        encoding="utf-8",
    )

print(f"Created {len(utilities):,} files in {target_folder}")
print(f"CSV rows read: {rows_read:,}")
print(f"CSV rows skipped (no usable ID, name, state, or date): {rows_skipped:,}")
if years:
    print(f"Years: {min(years)} to {max(years)}")
print(f"Distinct values of the standard column: {sorted(standards_seen)}")
