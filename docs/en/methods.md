# Methods

> How metrics are calculated.

---

[**⚡️Go to Explorer**](https://civic-interconnect.github.io/explorer-electricity-reliability/app/)

---

## About the Data

The Electricity Reliability Explorer presents annual electricity
reliability information reported by U.S. utilities to the
U.S. Energy Information Administration (EIA).

The data is processed and published by Catalyst Cooperative
through the Public Utility Data Liberation (PUDL) project.

These are historical, utility-reported measurements.
They are not live outage data.

## Reliability Measures

Three standard indices describe different aspects of reliability.

### SAIDI - Interruption Duration

System Average Interruption Duration Index.

The average total duration of sustained interruptions
per customer during a reporting year.

Displayed in minutes per customer.

### SAIFI - Interruption Frequency

System Average Interruption Frequency Index.

The average number of sustained interruptions per
customer during a reporting year.

Displayed in interruptions per customer.

### CAIDI - Interruption Duration per Interruption

Customer Average Interruption Duration Index.

The average duration of a sustained customer interruption.

Displayed in minutes per interruption.

## Major Event Days

Utilities may report reliability figures using different
treatments of major event days and loss-of-supply events.

The explorer preserves the available distinctions:

- Including major event days.
- Excluding major event days.
- Including major event days, excluding loss of supply.

These figures should not be treated as interchangeable.

A difference between reported values may help identify
the contribution of major event days, but it does not
establish which weather event or other incident caused
the interruptions.

## Reporting Methods

The underlying data distinguishes reporting standards,
including IEEE and other methods.

Comparisons must account for these differences.
The explorer does not silently combine reported values
from different methods.

## Missing Data

"Not reported" is not zero.

Missing values remain missing in charts, tables, and
calculations.

An entirely empty reporting-method record may be omitted
from the display without altering the underlying source data.

## Interpretation

The reliability indices describe reported system averages.

They do not establish:

- The interruption history of an individual household.
- The longest interruption experienced by a customer.
- The reliability of a particular feeder or neighborhood.
- The cause of a particular outage.
- The probability of a future extended outage.

Comparisons between utilities may also be affected by
differences in geography, infrastructure, customer density,
weather exposure, and reporting practices.

## Sources

- [EIA](https://www.eia.gov/)
- [PUDL](https://catalyst.coop/pudl/)

---

[**⚡️Go to Explorer**](https://civic-interconnect.github.io/explorer-electricity-reliability/app/)
