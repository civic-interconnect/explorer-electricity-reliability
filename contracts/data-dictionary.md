# Data dictionary

This file describes the data files that the explorer reads. The machine-readable
definition is `reliability.schema.json`. If the two disagree, the schema wins.

## File shape

One file per jurisdiction and reporting year. Each file starts with a
`schemaVersion`. The app refuses any file whose major version it does not
support, so a breaking change to the format is a new major version.

## Top-level fields

### schemaVersion

Semantic version of the data format, for example `1.0.0`.

### jurisdiction

Lowercase ISO 3166-1 alpha-2 country code, optionally followed by a hyphen and
an ISO 3166-2 subdivision code. A national file uses the country code alone.

### reportingYear

The calendar year the figures describe.

### source

Where the data came from: the name of the source, the release used, an optional
DOI, the license, and the date the files were retrieved.

### units

The unit of each index. Units are stated in the file so that no reader has to
guess them.

- `saidi`: minutes
- `saifi`: interruptions
- `caidi`: minutes

### records

One record per reporting utility.

## Record fields

### utility

A qualified identifier with three parts: `scheme` (which numbering system the
value belongs to, such as an official utility ID scheme), `value`, and `name`.
Never store a bare number, because the same number can mean different things in
different systems.

### subdivision

Optional. ISO 3166-2 subdivision code as reported for the utility. A utility
can serve more than one subdivision, so this field is descriptive and is not
part of a utility's identity.

### ownership

Optional. A stable lowercase identifier for the ownership type.

### customers

Number of customers served, or `null` if not reported.

### method

How the utility reported calculating the indices: `ieee-1366`, `other` or
`unknown`. Each value has a glossary concept named `method-<value>`.

### metrics

The indices, keyed by variant. Each value has a glossary concept named
`variant-<key>`.

- `including-major-event-days`
- `excluding-major-event-days`
- `including-major-event-days-excluding-loss-of-supply`

A variant the utility did not report is omitted. Inside a variant, an index
that was not reported is `null`.

## Missing values

`null` means not reported. It never means zero.

## Glossary and wording

Every identifier above that appears in the app has a glossary concept with a
stable ID. Wording lives in per-language files, never in the data files.
