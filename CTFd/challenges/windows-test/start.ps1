$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

if (-not (Test-Path -LiteralPath ".env")) {
    $passwordBytes = New-Object byte[] 16
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($passwordBytes)
    $password = "Ctf!" + (($passwordBytes | ForEach-Object { $_.ToString("x2") }) -join "")
    Set-Content -LiteralPath ".env" -Value "WINDOWS_TEST_PASSWORD=$password" -Encoding ascii
}

docker run --rm --device=/dev/kvm --device=/dev/net/tun alpine:3.23 sh -c 'test -r /dev/kvm && test -w /dev/kvm'
if ($LASTEXITCODE -ne 0) { throw "Docker must expose KVM and TUN devices for this test." }

docker compose config --quiet
if ($LASTEXITCODE -ne 0) { throw "Invalid Windows test configuration." }
docker compose up -d
if ($LASTEXITCODE -ne 0) { throw "Windows test failed to start." }

Write-Host "Open http://localhost:8006 to watch installation and access the desktop."
Write-Host "RDP: localhost:13389, user CTFPlayer. Password is stored in this folder's .env."
Write-Host "After installation, open C:\CTF\flag.txt inside Windows."
Write-Host "Stop with: docker compose down (the Windows disk is preserved)."
