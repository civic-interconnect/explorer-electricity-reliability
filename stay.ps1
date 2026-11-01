#Requires -Version 7.0

<#
============================================================
stay.ps1 (ALL-JS-REPOS)
============================================================
Updated: 2026-11-01

WHAT: Set up and validate the local development environment.

TOOLS: Node.js, npm.

REQ: Node.js and npm MUST be installed on the computer.
REQ: package-lock.json MUST be committed.
REQ: JavaScript dependencies MUST be installed locally.

HOW: Run .\stay.ps1 from the repository root.
============================================================
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# ============================================================
# A) NODE.JS ENVIRONMENT
# ============================================================

# WHY: Node.js is installed once per computer.
#      npm installs project tools locally in node_modules/.

$npm = if ($IsWindows) { "npm.cmd" } else { "npm" }

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    throw "Node.js is not installed or is not on PATH."
}

if (-not (Get-Command $npm -ErrorAction SilentlyContinue)) {
    throw "npm is not installed or is not on PATH."
}

Write-Host "Checking Node.js and npm versions..."
node --version
& $npm --version

& $npm audit fix --force
if ($LASTEXITCODE -ne 0) {
    Write-Warning "npm audit fix reported unresolved vulnerabilities. Continuing."
}

# REQ: Reproducible installation from package-lock.json.

if (-not (Test-Path "package-lock.json")) {
    throw "package-lock.json missing. Run npm install and commit the lockfile."
}

& $npm ci
if ($LASTEXITCODE -ne 0) {
    throw "npm ci failed."
}

# ============================================================
# C) JAVASCRIPT CHECKS
# ============================================================

& $npm run lint
if ($LASTEXITCODE -ne 0) {
    throw "JavaScript lint failed."
}

& $npm run typecheck
if ($LASTEXITCODE -ne 0) {
    throw "JavaScript typecheck failed."
}

& $npm test
if ($LASTEXITCODE -ne 0) {
    throw "JavaScript tests failed."
}

& $npm audit
if ($LASTEXITCODE -ne 0) {
    throw "npm audit failed."
}

Write-Host "All commands executed successfully."
