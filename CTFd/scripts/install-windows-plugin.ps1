$ErrorActionPreference = "Stop"
$pluginPath = Join-Path (Split-Path $PSScriptRoot) "CTFd/plugins/containers"
$patchPath = Join-Path $PSScriptRoot "containers-windows.patch"
$revision = "dc9372cd88d83c2540ac10b49f17d9dd5a3117b1"

if (-not (Test-Path -LiteralPath $pluginPath)) {
    git clone https://github.com/Bigyls/CTFdDockerContainersPlugin.git $pluginPath
    if ($LASTEXITCODE -ne 0) { throw "Plugin clone failed." }
    git -C $pluginPath checkout $revision
    if ($LASTEXITCODE -ne 0) { throw "Could not select the supported plugin revision." }
}

git -C $pluginPath apply --reverse --check $patchPath 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "Windows RDP integration is already applied."
    exit 0
}
git -C $pluginPath apply --check $patchPath
if ($LASTEXITCODE -ne 0) { throw "Plugin differs from the supported revision. Review before applying." }
git -C $pluginPath apply $patchPath
if ($LASTEXITCODE -ne 0) { throw "Could not apply Windows integration." }
Write-Host "Windows RDP integration applied. Rebuild/restart CTFd to load it."
