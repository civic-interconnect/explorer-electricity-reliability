# explorer-electricity-reliability

[![Open Explorer](https://img.shields.io/badge/⚡️-explorer-green?logo=github)](https://civic-interconnect.github.io/explorer-electricity-reliability/app/)
[![Docs Site](https://img.shields.io/badge/docs-site-blue?logo=github)](https://civic-interconnect.github.io/explorer-electricity-reliability/en/)

[![CI-Node](https://github.com/civic-interconnect/explorer-electricity-reliability/actions/workflows/ci-node.yml/badge.svg?branch=main)](https://github.com/civic-interconnect/explorer-electricity-reliability/actions/workflows/ci-node.yml)
[![CI-Zensical](https://github.com/civic-interconnect/explorer-electricity-reliability/actions/workflows/ci-python-zensical.yml/badge.svg?branch=main)](https://github.com/civic-interconnect/explorer-electricity-reliability/actions/workflows/ci-python-zensical.yml)
[![Docs-Deploy](https://github.com/civic-interconnect/explorer-electricity-reliability/actions/workflows/deploy-zensical-js.yml/badge.svg?branch=main)](https://github.com/civic-interconnect/explorer-electricity-reliability/actions/workflows/deploy-zensical-js.yml)
[![Links](https://github.com/civic-interconnect/explorer-electricity-reliability/actions/workflows/links.yml/badge.svg?branch=main)](https://github.com/civic-interconnect/explorer-electricity-reliability/actions/workflows/links.yml)
[![Dependabot](https://img.shields.io/badge/Dependabot-enabled-brightgreen.svg)](https://github.com/civic-interconnect/explorer-electricity-reliability/security)

> Explore the public record of electricity reliability in the United States.

## About

How reliable has electricity service been?

The Electricity Reliability Explorer helps members,
homeowners, students, and the public understand what electric
utilities report about interruptions to their service.

Find a utility, explore its history, and see how the reported
frequency and duration of interruptions have changed over time.

Interactive charts and plain-language explanations make the
numbers accessible without specialized
knowledge of electric utility reporting.

The explorer uses annual data reported to the
U.S. Energy Information Administration (EIA)
and processed by Catalyst Cooperative through PUDL.

**These are historical, utility-reported system averages.**
It doesn't provide live outage information
and it doesn't make predictions regarding future outages.

## Features

- Find a utility by state, name, or EIA utility identifier.
- Explore reported reliability across available years.
- Examine SAIDI, SAIFI, and CAIDI using interactive charts.
- Compare figures with and without major event days,
  where the utility reported those values.
- See the reporting method associated with each record.
- Learn what the measurements mean and where their
  limitations matter.

## Measurements

| Measure | What it describes                                | Unit                       |
| ------- | ------------------------------------------------ | -------------------------- |
| SAIDI   | Average total interruption duration per customer | Minutes per customer       |
| SAIFI   | Average number of interruptions per customer     | Interruptions per customer |
| CAIDI   | Average duration of a customer interruption      | Minutes per interruption   |

Different reporting standards, service territories, and
operating conditions affect comparisons.

A system average does not establish the interruption
experience of any specific household.

See the
[Methods](https://civic-interconnect.github.io/explorer-electricity-reliability/en/methods/)
and
[Glossary](https://civic-interconnect.github.io/explorer-electricity-reliability/en/glossary/)
for additional explanations.

## Data Attribution

**Original source:**
[U.S. Energy Information Administration, Form EIA-861](https://www.eia.gov/electricity/data/eia861/).

**Processed source:**
[Catalyst Cooperative, Public Utility Data Liberation Project (PUDL)](https://github.com/catalyst-cooperative/pudl).

**Source table:** `core_eia861__yearly_reliability`.

Civic Interconnect reformats the data for use in a static,
publicly accessible explorer.

- `data/utilities.json` contains utility information used for selection.
- `data/reliability/` contains annual reliability records organized by utility.
- `data/core_eia861__yearly_reliability.csv` is the source CSV.

The generated JSON files preserve reported measurements.
Missing values are **not replaced with zero**.

See the [Data Card](data/DATA_CARD.md) for more.

## Model References

### Estimate Solar Electricity Production

The [PVWatts Calculator](https://pvwatts.nlr.gov/),
provided by the National Laboratory of the Rockies (NLR),
estimates electricity generation from photovoltaic solar systems.

PVWatts helps homeowners explore how annual and monthly solar
production depends on:

- Geographic location and local solar resources.
- Solar array capacity (kW).
- Panel orientation and tilt.
- Shading, snow, and other system losses.
- Equipment and installation characteristics.

Results include estimated monthly and annual electricity
generation (kWh).

Location alone does not determine solar production.
Sites at different latitudes may produce similar annual
energy under comparable system assumptions.

### Using Solar Estimates with the Outage Planner

The Electricity Reliability Explorer includes an interactive
Outage Planner for exploring household electricity needs,
generator fuel consumption, and propane storage.

PVWatts provides complementary solar-production estimates
that can inform future solar and battery scenarios.

These calculations answer different questions:

- **Solar production:** How much electricity might an array generate?
- **Electricity consumption:** How much energy does a household use?
- **Battery storage:** How much energy could be available during an outage?
- **Financial payback:** How do installation costs compare with
  estimated electricity savings?

PVWatts does not establish the payback period or outage
backup capability of a solar or battery installation.

Actual performance and financial outcomes depend on
equipment, installation, electricity tariffs, energy
consumption, operating conditions, and applicable incentives.

### PVWatts API

The [PVWatts V8 API documentation](https://developer.nlr.gov/docs/solar/pvwatts/v8/)
describes the inputs, calculations, and outputs used to
estimate photovoltaic electricity production.

The API supports monthly and hourly generation estimates,
making it useful for examining seasonal production,
comparing solar system configurations, and developing
more detailed solar and battery scenarios.

It also documents the underlying weather data,
model assumptions, and available system parameters.

### Solar and Outage Resilience

The U.S. Department of Energy's
[The Road to Resilience with Rooftop Solar](https://www.energy.gov/cmei/systems/articles/road-resilience-rooftop-solar)
explains why installing solar panels does not necessarily
provide electricity during a grid outage.

The article introduces the roles of battery storage,
backup generators, inverters, and systems capable of
operating independently of the electric grid.

This distinction matters when evaluating solar
generation separately from emergency backup capability.

### Financial Interpretation

Financial results in the Outage Planner use simplified
calculations based on user-entered assumptions.

They are not installation quotes, verified utility tariffs,
or financial forecasts.

Actual savings and payback depend on installation costs,
electricity rates, solar production, export compensation,
equipment performance, maintenance, and applicable incentives.

## Related Explorers

Catalyst Cooperative provides additional tools for exploring
public U.S. energy data through the
[Public Utility Data Liberation (PUDL) project](https://data.catalyst.coop/).

- [Plant Explorer](https://data.catalyst.coop/dashboards/plant-explorer/) -
  Explore generating plants, fuel sources, and equipment.
- [Utility Explorer](https://data.catalyst.coop/dashboards/utility-explorer/) -
  Explore utility operations, customers, revenue, and reliability.
- [Rate Base & Sales Explorer](https://data.catalyst.coop/dashboards/rate-base-sales-explorer/) -
  Explore utility rate bases, sales, and financial relationships.
- [All PUDL Dashboards](https://data.catalyst.coop/dashboards/) -
  Discover additional public energy data visualizations.

## Note

Utilities calculate the same index
in different ways, so numbers from
different utilities are not always comparable.

## Independence

This project is not affiliated with or endorsed by
the U.S. Energy Information Administration,
Catalyst Cooperative, or any reporting utility.

## Development

The application uses JavaScript modules with JSDoc types.
It has no runtime package dependencies and no application
compilation step.

Development requires Node.js and npm.
Python and uv are used for documentation and data preparation.

### Install

- Node.js (includes npm)
- git (and configure user.name and user.email)
- uv (for Python Zensical docs)

Verify by ensuring a version number for the following:

```shell
node --version
npm --version
git --version
uv --version
```

### Clone and Open In VS Code

Open a machine terminal where you want the project:

```shell
git clone https://github.com/civic-interconnect/explorer-electricity-reliability

cd explorer-electricity-reliability
code .
```

### Install and Test

```shell
npm ci
npm run lint
npm run typecheck
npm test
```

### Run Locally

Serve the repository root using any local static web server:

```shell
python -m http.server 8000
```

Open:

http://localhost:8000/index.html#/

### Rebuild the Data

From the repository root:

```shell
uv run --no-project python scripts/build_utilities.py
uv run --no-project python scripts/build_reliability.py
```

Both scripts use the Python standard library.

The source CSV determines the generated datasets.
Generated JSON files should not be edited manually.

### After changes, Save Progress

```shell
# save progress
git add -A
git commit -m "update"
git push -u origin main
```

## Repository Organization

- `index.html` - application entry point.
- `contracts/` - data schemas and definitions.
- `data/` - source and generated reliability data.
- `docs/en/` - English-language Zensical documentation.
- `glossary/` - structured glossary resources.
- `locales/` - localized interface strings.
- `scripts/` - data generation programs.
- `src/` - JavaScript application code and reusable components.
- `src/views/` - application views.
- `test/` - automated tests

## Acknowledgements

- [Favicon.io](https://favicon.io/favicon-generator/) - free
  Favicon generation.

## Application

[App](https://civic-interconnect.github.io/explorer-electricity-reliability/app/)

## Changelog

[Changelog](https://github.com/civic-interconnect/explorer-electricity-reliability/blob/main/CHANGELOG.md)

## Citation

[CITATION.cff](https://github.com/civic-interconnect/explorer-electricity-reliability/blob/main/CITATION.cff)

## Data

[DATA_CARD](./data/DATA_CARD.md)

## Documentation

[Documentation](https://civic-interconnect.github.io/explorer-electricity-reliability/en/)

- [Methods](https://civic-interconnect.github.io/explorer-electricity-reliability/en/methods/)
- [Glossary](https://civic-interconnect.github.io/explorer-electricity-reliability/en/glossary/)

## Explorer

[**⚡️Go to Explorer**](https://civic-interconnect.github.io/explorer-electricity-reliability/app/)

## License

[Apache 2.0](https://github.com/civic-interconnect/explorer-electricity-reliability/blob/main/LICENSE)

## Repository

[Repository](https://github.com/civic-interconnect/explorer-electricity-reliability)

- [Report Issues](https://github.com/civic-interconnect/explorer-electricity-reliability/issues)

## Software Metadata

[CodeMeta (`codemeta.json`)](https://github.com/civic-interconnect/explorer-electricity-reliability/blob/main/codemeta.json)
