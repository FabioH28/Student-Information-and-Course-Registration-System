$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot

Set-Location $repoRoot

Write-Host "Starting CIS frontend on http://127.0.0.1:8080" -ForegroundColor Cyan
Write-Host "Press Ctrl+C in this window to stop it." -ForegroundColor DarkGray

& npm.cmd run dev -- --host 127.0.0.1 --port 8080
