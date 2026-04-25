$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$backendDir = Join-Path $repoRoot "backend"
$pythonExe = Join-Path $backendDir ".venv\Scripts\python.exe"

if (!(Test-Path $pythonExe)) {
    Write-Error "Backend virtual environment not found at $pythonExe"
    exit 1
}

Set-Location $backendDir

Write-Host "Starting CIS backend on http://127.0.0.1:8000" -ForegroundColor Cyan
Write-Host "Press Ctrl+C in this window to stop it." -ForegroundColor DarkGray

& $pythonExe -u -m uvicorn app.main:app --host 127.0.0.1 --port 8000
