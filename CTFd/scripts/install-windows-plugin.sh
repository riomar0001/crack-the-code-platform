#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
plugin="$root/CTFd/plugins/containers"
patch="$root/scripts/containers-windows.patch"
revision="dc9372cd88d83c2540ac10b49f17d9dd5a3117b1"
if [ ! -d "$plugin" ]; then
    git clone https://github.com/Bigyls/CTFdDockerContainersPlugin.git "$plugin"
    git -C "$plugin" checkout "$revision"
fi
if git -C "$plugin" apply --reverse --check "$patch" 2>/dev/null; then
    echo "Windows RDP integration is already applied."
    exit 0
fi
git -C "$plugin" apply --check "$patch"
git -C "$plugin" apply "$patch"
echo "Windows RDP integration applied. Rebuild/restart CTFd to load it."
