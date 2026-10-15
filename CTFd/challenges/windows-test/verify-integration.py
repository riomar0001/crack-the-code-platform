"""Live integration check; run inside CTFd. Removes its temporary accounts and VMs."""
import logging
import re
import secrets
import socket
import time
import warnings
import sys
from pathlib import Path

import requests

logging.disable(logging.CRITICAL)
warnings.filterwarnings("ignore")
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
from CTFd import create_app
from CTFd.models import db, Users, Teams
from CTFd.plugins.containers.models import ContainerChallengeModel, ContainerInfoModel

app = create_app()
users, teams, sessions, resources = [], [], [], []
password = secrets.token_urlsafe(24)


def nonce(page):
    match = re.search(r'''csrfNonce['"]?\s*:\s*['"]([^'"]+)''', page)
    assert match, "CSRF token missing"
    return match.group(1)


def post(client, action, challenge_id):
    page = client.get("http://127.0.0.1:8000/challenges", timeout=15)
    response = client.post("http://127.0.0.1:8000/containers/api/" + action,
        json={"chal_id": challenge_id}, headers={"CSRF-Token": nonce(page.text)}, timeout=180)
    assert response.status_code == 200, (action, response.status_code)
    data = response.json()
    assert "error" not in data, (action, data.get("error"))
    return data


def await_rdp(port):
    deadline = time.time() + 240
    while time.time() < deadline:
        try:
            with socket.create_connection(("host.docker.internal", int(port)), timeout=3) as connection:
                connection.sendall(bytes.fromhex("030000130ee000000000000100080003000000"))
                reply = connection.recv(128)
                if len(reply) >= 19 and reply[5] == 0xD0 and reply[11] == 2:
                    print("PASS: Windows RDP negotiation on port", port, flush=True)
                    return
        except OSError:
            pass
        time.sleep(3)
    raise AssertionError("Windows did not become RDP-ready")


def await_details(client, challenge_id):
    deadline = time.time() + 240
    while time.time() < deadline:
        data = post(client, "running", challenge_id)
        if data.get("ready"):
            return data
        assert data.get("hostname") is None and data.get("port") is None
        assert "password" not in data and "username" not in data
        time.sleep(5)
    raise AssertionError("Windows readiness details did not become available")


try:
    with app.app_context():
        cid = ContainerChallengeModel.query.filter_by(name="Windows RDP Demo").one().id
        for label in ("a", "b"):
            name = "windows_check_" + label + "_" + secrets.token_hex(4)
            team = Teams(name=name, hidden=True)
            db.session.add(team); db.session.flush(); teams.append(team.id)
            user = Users(name=name, email=name + "@example.invalid", password=password,
                         verified=True, hidden=True, team_id=team.id)
            db.session.add(user); db.session.flush(); users.append(user.id)
            sessions.append((requests.Session(), name))
        db.session.commit()
    ports = []
    for client, name in sessions:
        page = client.get("http://127.0.0.1:8000/login", timeout=15)
        response = client.post("http://127.0.0.1:8000/login",
            data={"name": name, "password": password, "nonce": nonce(page.text)}, timeout=15)
        assert "/login" not in response.url
        data = post(client, "request", cid)
        assert data["protocol"] == "rdp"
        if not data["ready"]:
            assert data["hostname"] is None and data["port"] is None
            assert "username" not in data and "password" not in data
            print("PASS: connection address and credentials withheld during boot", flush=True)
            data = await_details(client, cid)
        assert data["username"] and data["password"]
        ports.append(data["port"])
        print("PASS: participant starts private Windows disk; RDP port", data["port"], flush=True)
    assert ports[0] != ports[1]
    with app.app_context():
        rows = ContainerInfoModel.query.filter(ContainerInfoModel.user_id.in_(users)).all()
        assert len(rows) == 2
        volumes = set()
        for row in rows:
            container = app.container_manager.client.containers.get(row.container_id)
            labels = container.labels
            resources.append((labels["io.ctfd.windows.storage"], labels["io.ctfd.windows.network"]))
            volumes.add(labels["io.ctfd.windows.storage"])
            assert "8006/tcp" not in container.attrs["HostConfig"]["PortBindings"]
            assert container.attrs["HostConfig"]["Memory"] == 6 * 1024**3
            assert container.attrs["HostConfig"]["CpuQuota"] == 200000
            assert next(m for m in container.attrs["Mounts"] if m["Destination"] == "/template")["RW"] is False
        assert len(volumes) == 2
    print("PASS: distinct disks, immutable template, resource limits, no browser port", flush=True)
    for port in ports:
        await_rdp(port)
    repeat = post(sessions[0][0], "request", cid)
    assert repeat["status"] == "already_running" and repeat["port"] == int(ports[0])
    assert "password" in repeat
    print("PASS: reopening returns existing instance credentials", flush=True)
    post(sessions[0][0], "renew", cid)
    print("PASS: renewal", flush=True)
    reset = post(sessions[0][0], "reset", cid)
    assert reset["protocol"] == "rdp"
    if not reset["ready"]:
        reset = await_details(sessions[0][0], cid)
    assert reset["password"]
    with app.app_context():
        row = ContainerInfoModel.query.filter_by(user_id=users[0], challenge_id=cid).one()
        labels = app.container_manager.client.containers.get(row.container_id).labels
        resources.append((labels["io.ctfd.windows.storage"], labels["io.ctfd.windows.network"]))
    await_rdp(reset["port"])
    print("PASS: reset starts a fresh Windows disk", flush=True)
    post(sessions[0][0], "stop", cid)
    print("PASS: stop", flush=True)
    with app.app_context():
        row = ContainerInfoModel.query.filter_by(user_id=users[1], challenge_id=cid).one()
        row.expires = int(time.time()) - 1
        db.session.commit()
    deadline = time.time() + 160
    while time.time() < deadline:
        with app.app_context():
            db.session.expire_all()
            if ContainerInfoModel.query.filter_by(user_id=users[1], challenge_id=cid).count() == 0:
                break
        time.sleep(3)
    else:
        raise AssertionError("Expiration did not remove the instance")
    print("PASS: automatic expiry", flush=True)
finally:
    with app.app_context():
        for row in ContainerInfoModel.query.filter(ContainerInfoModel.user_id.in_(users)).all():
            app.container_manager.kill_container(row.container_id)
            db.session.delete(row)
        db.session.commit()
        for uid in users:
            db.session.delete(Users.query.get(uid))
        db.session.commit()
        for tid in teams:
            db.session.delete(Teams.query.get(tid))
        db.session.commit()
        for volume, network in resources:
            for collection, name in ((app.container_manager.client.volumes, volume),
                                     (app.container_manager.client.networks, network)):
                try:
                    collection.get(name)
                except Exception as error:
                    assert getattr(error, "status_code", None) == 404, type(error).__name__
                else:
                    raise AssertionError("Instance resource leaked: " + name)
    print("PASS: temporary accounts and instance resources removed", flush=True)
