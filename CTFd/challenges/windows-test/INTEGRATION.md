# Windows RDP challenge

The `Windows RDP Demo` challenge uses `ctf/windows-rdp:1`. Its image label
`io.ctfd.windows.template` identifies the installed template volume
`ctf-windows-template-v1`. Each instance uses its own qcow2 overlay and Docker
network, with the template mounted read-only. Only TCP 3389 is published on an
automatically assigned host port. The browser console is not published.
CTFd withholds the address and login credentials until an RDP negotiation with
the guest succeeds. The challenge shows a booting message and polls every five
seconds. This checks that Remote Desktop is accepting connections; it does not
check every Windows startup application.

In CTFd, use challenge type `container`, image `ctf/windows-rdp:1`, internal
port `3389`, and the Docker host's reachable IP as connection information
(without `http://`). Leave command and volumes empty. Windows credentials are
returned only by the authenticated participant's instance request. The demo
uses the template's existing CTFPlayer login for every clone; passwords and
Windows machine identity are not regenerated. This is a test integration.

Windows gets 4 GB guest RAM, a 6 GB container memory limit, and two virtual
CPUs. The test limit is two simultaneous Windows instances. Keep CTFd at one
worker: launch serialization and the expiration scheduler run in that process.
The existing 30-minute expiration and per-user restriction apply. Reset discards
the writable disk and clones the template again. Destroy and expiration remove
the container, its writable volume, and its network. Template storage remains.

## Applying on another host

1. Run `bash scripts/install-windows-plugin.sh` (Linux) or
   `./scripts/install-windows-plugin.ps1` (PowerShell) from the CTFd checkout.
   This installs the pinned plugin revision and applies the saved patch.
2. Set up Docker/KVM and the socket permissions in `docker-compose.instances.yml`.
3. Install the standalone Windows test, then stop it cleanly. The template must
   come from a completed Windows installation and include `windows.boot`.
4. From the CTFd directory, run:

   ```sh
   docker compose exec -T ctfd python /opt/CTFd/challenges/windows-test/prepare-template.py
   docker build -t ctf/windows-rdp:1 -f challenges/windows-test/Dockerfile.rdp challenges/windows-test
   ```

5. Restart CTFd, configure the challenge as above, and set its connection IP to
   the new host. Docker named volumes do not travel with the repository: prepare
   or explicitly migrate the template and its private credentials on that host.
6. Verify RDP access from a participant device. Published high ports must be
   reachable through that host's firewall. The local test does not configure
   Windows Firewall or router port forwarding.

## Verification

Run inside a development CTFd container with no other Windows instances:

```sh
docker compose exec -T ctfd python /opt/CTFd/challenges/windows-test/verify-integration.py
```

The live check creates temporary users and teams, verifies separate disks,
resource limits, RDP protocol negotiation, reopening, renewal, reset, stop,
expiration, and resource cleanup. It does not automate an RDP desktop login.
The test uses `host.docker.internal` to check published ports on Docker Desktop;
on Linux, add its `host-gateway` mapping to the CTFd container first.

The standalone test disk remains preserved but its container is stopped after
capture. Restarting that standalone test changes its original disk, not the
immutable template captured for CTFd.
