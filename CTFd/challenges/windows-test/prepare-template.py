"""Run inside the CTFd container after stopping the standalone Windows test."""
import pathlib
import docker

client = docker.from_env()
source = client.containers.get("ctf-windows-test-windows-1")
if source.status != "exited":
    raise SystemExit("Stop the standalone Windows test before capturing its disk.")
password = next(line.split("=", 1)[1] for line in
                pathlib.Path(__file__).with_name(".env").read_text().splitlines()
                if line.startswith("WINDOWS_TEST_PASSWORD="))
name = "ctf-windows-template-v1"
try:
    client.volumes.get(name)
except docker.errors.NotFound:
    client.volumes.create(name=name, labels={"io.ctfd.windows.template": "true"})
script = '''set -e
if [ -f /template/READY ]; then echo "Template already prepared"; exit 0; fi
qemu-img convert -f raw -O qcow2 /storage/data.img /template/data.qcow2
for f in windows.base windows.ver windows.boot windows.rom windows.vars; do
    if [ -f /storage/$f ]; then cp /storage/$f /template/$f; fi
done
python3 -c 'import os,json,pathlib; p=pathlib.Path("/template/credentials.json"); p.write_text(json.dumps({"username":"CTFPlayer","password":os.environ["TEMPLATE_PASSWORD"]})); p.chmod(0o600)'
touch /template/READY
echo "Installed Windows template prepared"
'''
output = client.containers.run(source.image.id, entrypoint="/bin/bash", command=["-c", script],
    volumes_from=[source.name + ":ro"],
    volumes={name: {"bind": "/template", "mode": "rw"}},
    environment={"TEMPLATE_PASSWORD": password}, remove=True, network_disabled=True)
print(output.decode().strip())
