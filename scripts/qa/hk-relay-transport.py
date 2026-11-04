"""Scoped SSH transport for the existing Hong Kong host's temporary QA relay.

No port, DNS, production service or billing changes. Provider secrets stay remote.
"""
import base64
import ipaddress
import json
import os
from pathlib import Path
import re
import secrets
import shlex
import subprocess
import sys
import tempfile
import hashlib
import time

SOURCE = Path(__file__).resolve().parent
AWS = '/Users/wujames/.local/bin/aws'


def ssh(command, body=None, timeout=90):
    result = subprocess.run([AWS, 'lightsail', 'get-instance-access-details', '--profile',
        'wanli-lightsail-ops', '--region', 'ap-east-1', '--instance-name', 'openmaic-learner-hk'],
        capture_output=True, text=True, timeout=35)
    if result.returncode:
        raise RuntimeError('Existing AWS profile unavailable; no alternate authority attempted')
    details = json.loads(result.stdout)['accessDetails']
    address = ipaddress.ip_address(details['ipAddress'])
    if details['username'] != 'ubuntu' or address.version != 4 or not address.is_global:
        raise RuntimeError('Unexpected existing server access identity')
    with tempfile.TemporaryDirectory(prefix='wanli-nobel-ssh-') as directory:
        key = Path(directory) / 'key'
        for file, field in [(key, 'privateKey'), (Path(str(key) + '-cert.pub'), 'certKey')]:
            file.write_text(details[field])
            file.chmod(0o600)
        # The returned command is derived only after verifying the current host IP.
        remote = command(str(address))
        output = subprocess.run(['ssh', '-i', str(key), '-o', 'BatchMode=yes', '-o',
            'StrictHostKeyChecking=yes', '-o', 'ConnectTimeout=10', 'ubuntu@' + str(address), remote],
            input=body, text=True, capture_output=True, timeout=timeout)
        if output.returncode:
            # The controller never emits credential values; retain only its final error line.
            lines = output.stderr.splitlines()
            raise RuntimeError('Scoped remote operation failed: ' + (lines[-1][:200] if lines else 'no error receipt'))
        return str(address), output.stdout


def prepare():
    run = secrets.token_hex(16)
    token = secrets.token_hex(32)
    proxy = (SOURCE / 'openrouter-free-proxy.mjs').read_bytes()
    controller = (SOURCE / 'hk-free-relay.py').read_bytes()
    folder = Path(tempfile.mkdtemp(prefix='wanli-nobel-session-'))
    folder.chmod(0o700)
    control = {'run': run, 'token': token, 'sourceSHA256': hashlib.sha256(proxy).hexdigest()}
    # Resolve the existing host first; the second connection must match it.
    address, _ = ssh(lambda address: 'true')
    control['publicIP'] = address
    pack = {'control': control, 'proxy': base64.b64encode(proxy).decode(),
            'ops': base64.b64encode(controller).decode()}
    payload = base64.b64encode(json.dumps(pack).encode()).decode()
    body = '''import base64,json,pathlib,subprocess,tempfile,os
assert os.geteuid()==0
pack=json.loads(base64.b64decode(PAYLOAD))
with tempfile.TemporaryDirectory(prefix='wanli-nobel-transport-',dir='/var/tmp') as directory:
 root=pathlib.Path(directory)
 for name,key in [('proxy.mjs','proxy'),('ops.py','ops')]:
  (root/name).write_bytes(base64.b64decode(pack[key]))
 control=root/'control.json';control.write_text(json.dumps(pack['control']));control.chmod(0o600)
 subprocess.run(['python3',str(root/'ops.py'),'prepare',str(control),str(root/'proxy.mjs')],check=True)
'''.replace('PAYLOAD', repr(payload))
    def same_host(current):
        if current != address:
            raise RuntimeError('Server address changed during preparation')
        return 'sudo python3 -'
    _, output = ssh(same_host, body)
    state = json.loads(output)
    if state['run'] != run or state['publicIP'] != address or state['phase'] != 'prepared':
        raise RuntimeError('Remote preparation receipt mismatch')
    for name, value in [('state.json', json.dumps(state)), ('token.txt', token)]:
        file = folder / name
        fd = os.open(file, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        with os.fdopen(fd, 'w') as stream:
            stream.write(value)
    print(json.dumps({'session': str(folder), 'phase': state['phase'], 'publicIP': address,
                      'root': state['root'], 'providerCredentialsExported': False}))


def invoke(mode, folder):
    if mode not in ['start', 'close']:
        raise ValueError('Expected start or close')
    state = json.loads((Path(folder) / 'state.json').read_text())
    if not re.fullmatch('[a-f0-9]{32}', state['run']) or state['root'] != '/var/tmp/wanli-nobel-relay-' + state['run']:
        raise RuntimeError('Unexpected task receipt')
    def command(address, operation=mode):
        if address != state['publicIP']:
            raise RuntimeError('Existing server address changed')
        return shlex.join(['sudo', 'python3', state['root'] + '/ops.py', operation, state['root']])
    try:
        # Startup includes bounded TLS retries, inspection and possible rollback.
        _, output = ssh(command, timeout=300)
    except (subprocess.TimeoutExpired, RuntimeError) as original:
        if mode != 'start':
            raise
        # A lost SSH receipt is ambiguous. Reconnect and close only this unique
        # task, waiting briefly if the original start still holds its own lock.
        for attempt in range(6):
            try:
                _, closed = ssh(lambda address: command(address, 'close'), timeout=120)
                receipt = json.loads(closed)
                if receipt.get('root') != state['root'] or receipt.get('phase') != 'closed':
                    raise RuntimeError('Ambiguous relay cleanup receipt')
                raise RuntimeError('Start receipt lost; exact task reconciled closed') from original
            except RuntimeError as error:
                if 'already running' not in str(error):
                    raise
                time.sleep(5)
        raise RuntimeError('Start receipt lost; exact task cleanup remains unresolved') from original
    receipt = json.loads(output)
    if receipt['root'] != state['root'] or receipt['phase'] != ('ready' if mode == 'start' else 'closed'):
        raise RuntimeError('Remote operation receipt mismatch')
    file = Path(folder) / (mode + '-receipt.json')
    file.write_text(json.dumps(receipt))
    file.chmod(0o600)
    print(json.dumps(receipt))


if __name__ == '__main__':
    if sys.argv[1] == 'prepare':
        prepare()
    else:
        invoke(sys.argv[1], sys.argv[2])
