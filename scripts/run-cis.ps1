$ErrorActionPreference = "Stop"

$backendScript = Join-Path $PSScriptRoot "run-backend.ps1"
$frontendScript = Join-Path $PSScriptRoot "run-frontend.ps1"

Start-Process powershell.exe -ArgumentList @(
    "-NoExit",
    "-ExecutionPolicy",
    "Bypass",
    "-File",
    $backendScript
)

Start-Process powershell.exe -ArgumentList @(
    "-NoExit",
    "-ExecutionPolicy",
    "Bypass",
    "-File",
    $frontendScript
)

Write-Host "Opened backend and frontend in separate PowerShell windows." -ForegroundColor Green
Write-Host "Frontend: http://127.0.0.1:8080" -ForegroundColor Cyan
Write-Host "Backend docs: http://127.0.0.1:8000/docs" -ForegroundColor Cyan
