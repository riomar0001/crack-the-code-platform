<#
.SYNOPSIS
    Start, stop and inspect the CTFd stack for a local (LAN) event.

.EXAMPLE
    .\start-event.ps1              # build + start everything
    .\start-event.ps1 -Status      # container status + URLs
    .\start-event.ps1 -Logs        # follow CTFd logs
    .\start-event.ps1 -Restart     # restart CTFd (after code/plugin changes)
    .\start-event.ps1 -Stop        # stop everything (data is kept in .data)
#>
[CmdletBinding()]
param(
    [switch]$Stop,
    [switch]$Status,
    [switch]$Logs,
    [switch]$Restart,
    [switch]$NoBuild,
    [int]$Workers = 4
)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$EnvFile = Join-Path $PSScriptRoot ".event.env"
$Compose = @("compose", "--env-file", $EnvFile, "-f", "docker-compose.yml", "-f", "docker-compose.event.yml")

function Write-Step($msg) { Write-Host "==> $msg" -ForegroundColor Cyan }

function Get-LanIPs {
    Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
        Where-Object { $_.IPAddress -notmatch '^(127|169\.254)\.' -and $_.InterfaceAlias -notmatch 'vEthernet|WSL|Loopback|Docker' } |
        Select-Object -ExpandProperty IPAddress
}

function Show-Urls {
    Write-Host ""
    Write-Host "CTFd is reachable at:" -ForegroundColor Green
    Write-Host "  This machine : http://localhost"
    foreach ($ip in Get-LanIPs) { Write-Host "  Participants : http://$ip" }
    Write-Host ""
}

# --- Docker must be available and running ---
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw "docker was not found on PATH. Install and start Docker Desktop first."
}
docker info *> $null
if ($LASTEXITCODE -ne 0) {
    throw "Docker is not running. Start Docker Desktop and try again."
}

# --- Secret key: generate once, reuse afterwards (changing it logs everyone out) ---
if (-not (Test-Path $EnvFile)) {
    Write-Step "Generating SECRET_KEY in .event.env"
    $bytes = New-Object byte[] 32
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    $key = ($bytes | ForEach-Object { $_.ToString("x2") }) -join ""
    Set-Content -Path $EnvFile -Value @("SECRET_KEY=$key", "WORKERS=$Workers") -Encoding ascii
}

if ($Stop) {
    Write-Step "Stopping CTFd stack"
    docker @Compose down
    return
}

if ($Status) {
    docker @Compose ps
    Show-Urls
    return
}

if ($Logs) {
    docker @Compose logs -f --tail 100 ctfd
    return
}

if ($Restart) {
    Write-Step "Restarting CTFd"
    docker @Compose restart ctfd
    return
}

# --- Start ---
Write-Step "Starting CTFd stack"
$upArgs = @("up", "-d")
if (-not $NoBuild) { $upArgs += "--build" }
docker @Compose @upArgs
if ($LASTEXITCODE -ne 0) { throw "docker compose up failed" }

# --- Wait until the site answers through nginx ---
Write-Step "Waiting for CTFd to respond (first start can take a minute)"
$ready = $false
for ($i = 0; $i -lt 60; $i++) {
    try {
        $r = Invoke-WebRequest -Uri "http://localhost/healthcheck" -UseBasicParsing -TimeoutSec 3
        if ($r.StatusCode -eq 200) { $ready = $true; break }
    } catch { }
    Start-Sleep -Seconds 2
}
if (-not $ready) {
    Write-Warning "CTFd did not answer in time. Check: .\start-event.ps1 -Logs"
}

# --- Firewall rule so other devices can connect (needs Administrator) ---
$ruleName = "CTFd HTTP"
if (-not (Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue)) {
    $isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
    if ($isAdmin) {
        Write-Step "Opening inbound TCP 80 in Windows Firewall (Private profile)"
        New-NetFirewallRule -DisplayName $ruleName -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow -Profile Private | Out-Null
    } else {
        Write-Warning "No firewall rule for port 80. Other devices may not connect. Re-run once from an Administrator PowerShell."
    }
}

# --- Keep the machine awake while on AC power ---
powercfg /change standby-timeout-ac 0 | Out-Null
powercfg /change monitor-timeout-ac 0 | Out-Null

Show-Urls
Write-Host "First run? Open the URL and complete the CTFd setup wizard."
Write-Host "Stop with: .\start-event.ps1 -Stop"
