# Running CTFd Locally for an Event

This guide covers hosting the CTF on one machine (Windows or Linux) that
participants reach over the same Wi-Fi or LAN. It uses the production-style
stack already in `docker-compose.yml`: CTFd (gunicorn), nginx on port 80,
MariaDB and Redis.

- [Quick start](#quick-start)
- [Requirements](#requirements)
- [Windows](#windows)
- [Linux](#linux)
- [First-time setup](#first-time-setup)
- [Letting participants connect](#letting-participants-connect)
- [Keeping it reliable during the event](#keeping-it-reliable-during-the-event)
- [Backups](#backups)
- [Common operations](#common-operations)
- [Troubleshooting](#troubleshooting)
- [Developing locally with uv](#developing-locally-with-uv)

## Quick start

| | Windows (PowerShell) | Linux (bash) |
|---|---|---|
| Start | `.\start-event.ps1` | `./start-event.sh` |
| Status | `.\start-event.ps1 -Status` | `./start-event.sh status` |
| Logs | `.\start-event.ps1 -Logs` | `./start-event.sh logs` |
| Restart CTFd | `.\start-event.ps1 -Restart` | `./start-event.sh restart` |
| Stop | `.\start-event.ps1 -Stop` | `./start-event.sh stop` |

Then open `http://localhost` and complete the setup wizard.

## Requirements

- **Docker** with the Compose plugin (`docker compose`, not `docker-compose`).
  - Windows: Docker Desktop (WSL2 backend).
  - Linux: Docker Engine + `docker-compose-plugin`.
- A machine that stays on, plugged into power, for the whole event.
- Port **80** free on the host.
- Roughly 2 GB of free RAM and a few GB of disk.

## How it works

The scripts layer `docker-compose.event.yml` on top of `docker-compose.yml`.
The override adds:

| Setting | Value | Why |
|---|---|---|
| `SECRET_KEY` | generated once into `.event.env` | Required when running more than one worker. Changing it logs everyone out. |
| `WORKERS` | 4 (default) | More concurrent requests than the stock `1`. |

`.event.env` is git-ignored. Do not commit it or delete it mid-event.

To change the worker count, edit `WORKERS=` in `.event.env` and run restart.

## Windows

### 1. Install Docker Desktop

Install it, start it, and wait until it reports "running".

### 2. Start the stack

Open **PowerShell as Administrator** in the project folder (admin is only
needed so the script can open the firewall; later runs don't need it):

```powershell
.\start-event.ps1
```

If PowerShell blocks the script:

```powershell
powershell -ExecutionPolicy Bypass -File .\start-event.ps1
```

The script will:

1. Check Docker is running.
2. Generate `.event.env` on first run.
3. Build and start all containers.
4. Wait for `/healthcheck` to answer.
5. Add a Windows Firewall rule for inbound TCP 80 (Private profile).
6. Disable sleep and monitor timeout while on AC power.
7. Print the URLs for you and for participants.

### 3. Set the network to Private

The firewall rule only applies to **Private** networks. Settings → Network &
internet → your Wi-Fi/Ethernet → Network profile type → **Private**.

### 4. Find your IP manually (if needed)

```powershell
Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notmatch '^(127|169\.254)' } | Select-Object InterfaceAlias, IPAddress
```

### Manual firewall rule (if you skipped admin)

```powershell
New-NetFirewallRule -DisplayName "CTFd HTTP" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow -Profile Private
```

### Stop and remove

```powershell
.\start-event.ps1 -Stop
```

## Linux

### 1. Install Docker

Debian / Ubuntu:

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker "$USER"   # log out and back in afterwards
```

Verify:

```bash
docker info
docker compose version
```

### 2. Start the stack

```bash
chmod +x start-event.sh
./start-event.sh
```

If your user isn't in the `docker` group, use `sudo ./start-event.sh`.

The script will:

1. Check Docker and the Compose plugin are available.
2. Generate `.event.env` on first run (mode 600).
3. Build and start all containers.
4. Wait for `/healthcheck` to answer.
5. Print a firewall hint if `ufw` or `firewalld` looks like it's blocking port 80.
6. Print the URLs for you and for participants.

### 3. Open port 80

Only needed if a firewall is active.

`ufw` (Ubuntu/Debian):

```bash
sudo ufw allow 80/tcp
```

`firewalld` (Fedora/RHEL):

```bash
sudo firewall-cmd --add-service=http --permanent
sudo firewall-cmd --reload
```

### 4. Find your IP manually (if needed)

```bash
hostname -I
# or
ip -4 addr show scope global
```

### 5. Keep the machine awake

```bash
sudo systemctl mask sleep.target suspend.target hibernate.target hybrid-sleep.target
```

Undo it after the event:

```bash
sudo systemctl unmask sleep.target suspend.target hibernate.target hybrid-sleep.target
```

If it's a laptop, also set "when lid is closed: do nothing" (`HandleLidSwitch=ignore`
in `/etc/systemd/logind.conf`).

### Start on boot

The containers use `restart: always`, so they return after a reboot as long as
Docker starts at boot:

```bash
sudo systemctl enable docker
```

### Stop and remove

```bash
./start-event.sh stop
```

## First-time setup

Open `http://localhost` on the host. The setup wizard asks for:

- Event name and description
- Mode: **users** or **teams**
- Admin username, email and password
- Start and end times (optional)

Keep the admin password somewhere safe. There's no email service, so there is
no password reset by email.

## Letting participants connect

Participants browse to `http://<host-ip>` (the script prints it).

Checklist:

- **Same network.** Everyone must be on the same LAN or Wi-Fi as the host.
- **No client isolation.** Guest or public Wi-Fi often blocks device-to-device
  traffic. Use a router or hotspot you control.
- **Fixed IP.** Reserve the host's address in your router (DHCP reservation) or
  set a static IP so the URL doesn't change mid-event.
- **Firewall.** Port 80 must be open (see the OS sections above).
- **Test early.** Load the site from a phone on the same network before the
  event starts.

Optional friendly name: add a DNS record on your router, or a hosts entry on
participant machines, pointing a name such as `ctf.local` at the host IP.

## Keeping it reliable during the event

- Plug the host into power and disable sleep (the Windows script does this; on
  Linux see above).
- Disable automatic restarts for OS updates until the event is over.
- Keep Docker running.
- Don't change `SECRET_KEY` or delete `.event.env`.
- Don't run `docker compose down -v` or delete the `.data/` folder.

## Backups

Take one before the event and periodically during it.

**From the UI (recommended):** Admin Panel → Config → Backup → Export.
This downloads a zip you can restore on any CTFd instance.

**Raw data:** everything lives under `.data/` in the project folder:

| Path | Contents |
|---|---|
| `.data/mysql` | Database |
| `.data/CTFd/uploads` | Challenge files and uploads |
| `.data/CTFd/logs` | Logs |
| `.data/redis` | Cache |

For a raw copy, stop the stack first so the database files are consistent.

Windows:

```powershell
.\start-event.ps1 -Stop
Copy-Item -Recurse .data "..\ctfd-backup-$(Get-Date -Format yyyyMMdd-HHmm)"
.\start-event.ps1
```

Linux:

```bash
./start-event.sh stop
cp -a .data "../ctfd-backup-$(date +%Y%m%d-%H%M)"
./start-event.sh
```

## Common operations

| Task | Windows | Linux |
|---|---|---|
| Restart CTFd after a code or plugin change | `.\start-event.ps1 -Restart` | `./start-event.sh restart` |
| Rebuild the image after dependency changes | `.\start-event.ps1` | `./start-event.sh` |
| Start without rebuilding | `.\start-event.ps1 -NoBuild` | `NO_BUILD=1 ./start-event.sh` |
| Follow logs | `.\start-event.ps1 -Logs` | `./start-event.sh logs` |
| See container state | `.\start-event.ps1 -Status` | `./start-event.sh status` |

Plain Docker equivalents (any OS):

```bash
docker compose --env-file .event.env -f docker-compose.yml -f docker-compose.event.yml ps
docker compose --env-file .event.env -f docker-compose.yml -f docker-compose.event.yml logs -f ctfd
```

## Troubleshooting

**Site doesn't load from other devices, works on the host**
Firewall or network profile. Windows: network must be Private and the "CTFd HTTP"
rule must exist. Linux: check `ufw status` / `firewall-cmd --list-all`. Also
rule out Wi-Fi client isolation.

**`port is already allocated` / port 80 in use**
Something else is using port 80 (IIS, Apache, another nginx, Skype/Hyper-V on
Windows). Find it:

```powershell
Get-NetTCPConnection -LocalPort 80 | Select-Object OwningProcess
```

```bash
sudo ss -ltnp 'sport = :80'
```

**CTFd container restarts repeatedly**
Check `logs`. If it complains about `SECRET_KEY` with multiple workers,
`.event.env` is missing or empty; delete it and re-run the script.

**Database not ready on first start**
MariaDB takes longer to initialise the first time. Wait a minute, then run
`status`. CTFd retries its connection.

**Everyone got logged out**
`SECRET_KEY` changed. Restore the original `.event.env`.

**Permission errors on `.data/` (Linux)**
The `permissions` container chowns the uploads and logs folders to uid 1001 on
each start. If it failed, run `docker compose ... up -d` again and check
`docker compose ... logs permissions`.

**Docker not running (Windows)**
Start Docker Desktop and wait for it to say "running".

## Developing locally with uv

This is for working on the code, not for the event. It doesn't use the compose
stack: you run only MariaDB and Redis in Docker and the app through `uv`.

Windows (PowerShell) or Linux, start the services (same commands in both):

```bash
docker run -d --name ctfd-db -p 3306:3306 -e MARIADB_ROOT_PASSWORD=ctfd -e MARIADB_USER=ctfd -e MARIADB_PASSWORD=ctfd -e MARIADB_DATABASE=ctfd -v ctfd-mysql:/var/lib/mysql mariadb:10.11 mysqld --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci --wait_timeout=28800 --log-warnings=0
docker run -d --name ctfd-redis -p 6379:6379 -v ctfd-redis:/data redis:4
```

Install dependencies (needs Python 3.11; uv will fetch it):

```bash
uv sync
```

Windows (PowerShell):

```powershell
$env:DATABASE_URL = "mysql+pymysql://ctfd:ctfd@127.0.0.1:3306/ctfd"
$env:REDIS_URL = "redis://127.0.0.1:6379"
uv run python serve.py
```

Linux (bash):

```bash
export DATABASE_URL="mysql+pymysql://ctfd:ctfd@127.0.0.1:3306/ctfd"
export REDIS_URL="redis://127.0.0.1:6379"
uv run python serve.py
```

Open `http://127.0.0.1:4000`. Use `--port 8000` to change the port.

Stop and clean up:

```bash
docker stop ctfd-db ctfd-redis
docker rm -f ctfd-db ctfd-redis        # keeps the ctfd-mysql / ctfd-redis volumes
docker volume rm ctfd-mysql ctfd-redis # also wipes the data
```
