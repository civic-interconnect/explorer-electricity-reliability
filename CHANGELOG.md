# Changelog

<!-- markdownlint-disable MD024 -->

All notable changes to this project are recorded here.

The format is based on **[Keep a Changelog](https://keepachangelog.com/en/1.1.0/)**
and this project adheres to **[Semantic Versioning](https://semver.org/spec/v2.0.0.html)**.

---

## [Unreleased]

---

## [0.1.0] - 2026-11-01

### Added

- Initial Electricity Reliability Explorer with responsive layouts for mobile, desktop, and larger displays.
- Utility search and selection by state, utility name, and EIA utility identifier.
- Annual SAIDI, SAIFI, and CAIDI visualizations with reusable metric cards and charts.
- Data-driven explanations of reported reliability trends.
- Reporting-method and major-event-day selections.
- Annual reliability tables with explicit handling of missing values.
- Utility dimension (`data/utilities.json`) and per-utility reliability JSON files generated from PUDL's EIA-861 data.
- Reproducible Python scripts for generating both datasets.
- Zensical documentation, including Methods and Glossary pages.
- Data contracts, localization resources, and jurisdiction registry.
- Automated tests, linting, type checking, and GitHub Actions workflows.
- Combined GitHub Pages deployment for documentation and the JavaScript explorer.

---

## Notes on Versioning and Releases

- We use **SemVer**:
  - **MAJOR** - breaking changes
  - **MINOR** - backward-compatible features
  - **PATCH** - fixes, documentation, tests, tooling

Versions are driven by git tags.
Tag `vX.Y.Z` to release.

## Release Procedure (Required)

Follow these steps exactly when creating a new release.

### Task 1. Update release metadata (manual edits)

1.1. `CITATION.cff` - update `version` and `date-released`
1.2. `CHANGELOG.md` - add section, move unreleased entries, update links
1.3. `pyproject.toml` - update version
1.4. `package.json` - updated version

### Task 2. Validate

```pwsh
.\stay.ps1
.\sit.ps1

uv lock
foreach ($v in '3.12','3.13','3.14','3.15') {
  Write-Host "=== Python $v"
  uv run --isolated --frozen --python $v --no-default-groups --group dev python -m pytest -q
}

uvx gha-tools autoupdate --pin=all --write .github/workflows

uvx zizmor@latest .github/
# suppressed and informational are okay

uvx cffconvert --validate
uvx "validate-pyproject[all]" pyproject.toml

uv run --no-project python scripts/build_utilities.py
uv run --no-project python scripts/build_reliability.py
```

### Task 3. Commit, push, tag

```shell
git add -A
git commit -m "Prepare X.Y.Z"
git push -u origin main
```

Verify actions run on GitHub. After success:

```shell
git tag vX.Y.Z -m "X.Y.Z"
git push origin vX.Y.Z
```

### Task 4. Verify the Release and Zenodo archive

The release workflow creates a GitHub Release automatically.
To verify:

```shell
gh release view vX.Y.Z                    # confirm Release exists with notes + artifacts
gh run list --workflow=release-pypi.yml   # confirm the workflow succeeded
```

Confirm Zenodo shows a new version-specific DOI for this release
and that it remains linked under the
repository's concept DOI recorded in `CITATION.cff`.

## Only As Needed (delete a tag)

```shell
git tag -d vX.Y.Z
git push origin :refs/tags/vX.Y.Z
```

## Links

[Unreleased]: https://github.com/civic-interconnect/explorer-electricity-reliability/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/civic-interconnect/explorer-electricity-reliability/releases/tag/v0.1.0

<!-- markdownlint-enable MD024 -->
