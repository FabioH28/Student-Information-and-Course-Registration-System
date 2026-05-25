param(
    [Parameter(Position = 0)]
    [ValidateSet("all", "frontend", "backend")]
    [string]$Target = "all",

    [switch]$Install,
    [switch]$SameWindow,
    [switch]$SkipDbCheck,

    [int]$BackendPort = 8000,
    [int]$FrontendPort = 8088
)

$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendDir = Join-Path $Root "backend"
$BackendVenvPython = Join-Path $BackendDir ".venv\Scripts\python.exe"
$BackendEnv = Join-Path $BackendDir ".env"
$RootNodeModules = Join-Path $Root "node_modules"

function Read-EnvFile {
    param([Parameter(Mandatory = $true)][string]$Path)

    $Values = @{}
    if (-not (Test-Path $Path)) {
        return $Values
    }

    Get-Content $Path | ForEach-Object {
        $Line = $_.Trim()
        if ($Line -eq "" -or $Line.StartsWith("#") -or $Line -notmatch "^\s*([^=]+?)\s*=\s*(.*)\s*$") {
            return
        }

        $Name = $Matches[1].Trim()
        $Value = $Matches[2].Trim().Trim('"').Trim("'")
        $Values[$Name] = $Value
    }

    return $Values
}

function Test-CommandExists {
    param([Parameter(Mandatory = $true)][string]$Name)
    return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

function Convert-ToEncodedCommand {
    param([Parameter(Mandatory = $true)][string]$Command)
    return [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($Command))
}

function Assert-CommandExists {
    param(
        [Parameter(Mandatory = $true)][string]$Name,
        [Parameter(Mandatory = $true)][string]$InstallHint
    )

    if (-not (Test-CommandExists $Name)) {
        throw "'$Name' was not found. $InstallHint"
    }
}

function Get-BackendDatabaseEndpoint {
    $EnvValues = Read-EnvFile $BackendEnv
    $HostName = $EnvValues["DB_HOST"]
    $Port = $EnvValues["DB_PORT"]
    $DatabaseName = $EnvValues["DB_NAME"]

    if ($EnvValues["DATABASE_URL"] -match "@(?<host>[^:/]+)(:(?<port>\d+))?/(?<database>[^?]+)") {
        $HostName = $Matches["host"]
        if ($Matches["port"]) {
            $Port = $Matches["port"]
        }
        $DatabaseName = $Matches["database"]
    }

    if ([string]::IsNullOrWhiteSpace($HostName)) {
        $HostName = "127.0.0.1"
    }
    if ([string]::IsNullOrWhiteSpace($Port)) {
        $Port = "3306"
    }
    if ([string]::IsNullOrWhiteSpace($DatabaseName)) {
        $DatabaseName = "CampusIS"
    }

    [PSCustomObject]@{
        Host = $HostName
        Port = [int]$Port
        Database = $DatabaseName
    }
}

function Test-TcpPort {
    param(
        [Parameter(Mandatory = $true)][string]$HostName,
        [Parameter(Mandatory = $true)][int]$Port
    )

    $Client = New-Object System.Net.Sockets.TcpClient
    try {
        $Connect = $Client.BeginConnect($HostName, $Port, $null, $null)
        if (-not $Connect.AsyncWaitHandle.WaitOne(1200, $false)) {
            return $false
        }

        $Client.EndConnect($Connect)
        return $true
    }
    catch {
        return $false
    }
    finally {
        $Client.Close()
    }
}

function Assert-BackendDatabaseAvailable {
    if ($SkipDbCheck) {
        return
    }

    $Endpoint = Get-BackendDatabaseEndpoint
    Write-Host "Checking MySQL at $($Endpoint.Host):$($Endpoint.Port) for database '$($Endpoint.Database)'..."

    if (Test-TcpPort $Endpoint.Host $Endpoint.Port) {
        Write-Host "MySQL port is reachable."
        Write-Host ""
        return
    }

    Write-Host ""
    Write-Host "MySQL is not reachable at $($Endpoint.Host):$($Endpoint.Port)." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Fix one of these, then run the script again:"
    Write-Host "  1. Start MySQL from XAMPP Control Panel."
    Write-Host "  2. If MySQL uses another port, update backend\.env DATABASE_URL."
    Write-Host "     Current value should match something like:"
    Write-Host "     DATABASE_URL=mysql+pymysql://root:YOUR_PASSWORD@127.0.0.1:3306/CampusIS"
    Write-Host "  3. Or run only the frontend for now:"
    Write-Host "     .\run_project.ps1 frontend"
    Write-Host ""
    Write-Host "Tip: if PowerShell blocks scripts, run:"
    Write-Host "  powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run_project.ps1 all"
    Write-Host ""
    exit 1
}

function Initialize-Backend {
    Assert-CommandExists "python" "Install Python 3.11+ and make sure it is available in PATH."

    if (-not (Test-Path $BackendEnv)) {
        Write-Host "Creating backend .env from backend\.env.example..."
        Copy-Item (Join-Path $BackendDir ".env.example") $BackendEnv
        Write-Host "Created backend\.env. Check DATABASE_URL if your MySQL port/password is different."
        Write-Host ""
    }

    if ($Install -or -not (Test-Path $BackendVenvPython)) {
        Write-Host "Preparing backend virtual environment..."
        Push-Location $BackendDir
        try {
            if (-not (Test-Path $BackendVenvPython)) {
                python -m venv .venv
            }

            & $BackendVenvPython -m pip install --upgrade pip
            & $BackendVenvPython -m pip install -r requirements.txt
        }
        finally {
            Pop-Location
        }
        Write-Host ""
    }

    Assert-BackendDatabaseAvailable
}

function Initialize-Frontend {
    Assert-CommandExists "npm.cmd" "Install Node.js 20+ from https://nodejs.org/ and reopen PowerShell."

    if ($Install -or -not (Test-Path $RootNodeModules)) {
        Write-Host "Installing frontend dependencies..."
        Push-Location $Root
        try {
            if (Test-Path (Join-Path $Root "package-lock.json")) {
                npm.cmd ci
            }
            else {
                npm.cmd install
            }
        }
        finally {
            Pop-Location
        }
        Write-Host ""
    }
}

function Start-Backend {
    $Command = @"
Set-Location -LiteralPath '$BackendDir'
`$Host.UI.RawUI.WindowTitle = 'CampusIS Backend'
& '$BackendVenvPython' -m uvicorn src.main:app --reload --host 127.0.0.1 --port $BackendPort
"@

    if ($SameWindow) {
        Invoke-Expression $Command
    }
    else {
        $EncodedCommand = Convert-ToEncodedCommand $Command
        Start-Process powershell.exe -ArgumentList @("-NoExit", "-ExecutionPolicy", "Bypass", "-EncodedCommand", $EncodedCommand)
    }
}

function Start-Frontend {
    $ApiBaseUrl = "http://127.0.0.1:$BackendPort"
    $Command = @"
Set-Location -LiteralPath '$Root'
`$env:VITE_API_BASE_URL = '$ApiBaseUrl'
`$Host.UI.RawUI.WindowTitle = 'CampusIS Frontend'
npm.cmd run dev -- --host 127.0.0.1 --port $FrontendPort
"@

    if ($SameWindow) {
        Invoke-Expression $Command
    }
    else {
        $EncodedCommand = Convert-ToEncodedCommand $Command
        Start-Process powershell.exe -ArgumentList @("-NoExit", "-ExecutionPolicy", "Bypass", "-EncodedCommand", $EncodedCommand)
    }
}

$Target = $Target.ToLowerInvariant()

Write-Host "Starting Student Information and Course Registration System..."
Write-Host "Target: $Target"
Write-Host ""

if ($Target -in @("all", "backend")) {
    Initialize-Backend
}

if ($Target -in @("all", "frontend")) {
    Initialize-Frontend
}

switch ($Target) {
    "backend" {
        Start-Backend
    }
    "frontend" {
        Start-Frontend
    }
    "all" {
        Start-Backend
        Start-Frontend
    }
}

Write-Host ""
if ($Target -in @("all", "backend")) {
    Write-Host "Backend:  http://127.0.0.1:$BackendPort"
    Write-Host "API docs: http://127.0.0.1:$BackendPort/docs"
}
if ($Target -in @("all", "frontend")) {
    Write-Host "Frontend: http://127.0.0.1:$FrontendPort"
}
Write-Host ""
Write-Host "Examples:"
Write-Host "  .\run_project.ps1 all"
Write-Host "  .\run_project.ps1 backend"
Write-Host "  .\run_project.ps1 frontend"
Write-Host "  .\run_project.ps1 all -Install"
Write-Host "  .\run_project.ps1 backend -SkipDbCheck"
Write-Host ""
Write-Host "Use Ctrl+C in each server window to stop it."
