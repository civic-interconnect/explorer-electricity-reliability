# Electricity Reliability - Data Card

Annual electricity reliability data reported by U.S. utilities to the U.S. Energy Information Administration (EIA), processed by Catalyst Cooperative, and reformatted for the Civic Interconnect Electricity Reliability Explorer.

## Original Sources and Attribution

- **Original data:** [U.S. Energy Information Administration (EIA), Form EIA-861](https://www.eia.gov/electricity/data/eia861/).
- **Data processing:** [Catalyst Cooperative, Public Utility Data Liberation Project (PUDL)](https://github.com/catalyst-cooperative/pudl).
- **Source table:** [core_eia861\_\_yearly_reliability](https://data.catalyst.coop/preview/pudl/core_eia861__yearly_reliability).
- **PUDL data license:** [Creative Commons Attribution 4.0 (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/).

**Attribution:** Source: U.S. Energy Information Administration, Form EIA-861. Data cleaned and published by Catalyst Cooperative (PUDL), CC BY 4.0. Reformatted by Civic Interconnect.

## Published Data

The source CSV is `data/core_eia861__yearly_reliability.csv`.

The generator `scripts/build_reliability.py` produces one JSON file per EIA utility ID in `data/reliability/`.

Each utility file contains available annual records, including:

- State, reporting year, and reporting standard.
- Customer count and entity type.
- SAIDI, SAIFI, and CAIDI, with available major-event-day and loss-of-supply variants.

The transformation preserves reported values. Missing measurements remain `null`, and variants with no reported measurements are omitted. No reliability values are estimated.

## Limitations

- These are historical, utility-reported figures, not live outage information.
- Reporting methods and major-event-day treatments may differ.
- System averages do not describe an individual household's outage experience.
- The dataset does not establish outage causes or provide a basis for unqualified utility rankings.

## Reproduction

Both datasets are generated from
`data/core_eia861__yearly_reliability.csv`.

From the repository root:

```shell
uv run --no-project python scripts/build_utilities.py
uv run --no-project python scripts/build_reliability.py
```

The generated files are:

- `data/utilities.json` - utility dimension for searching and selection.
- `data/reliability/<utility_id>.json` - annual reliability records by utility.

Both scripts use only the Python standard library.

Generated files should not be edited manually.
