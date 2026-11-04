"""Manage only one bounded temporary QA relay; never change production services.

Run remotely as root. Preparing TLS material starts no service and opens no port.
Firewall changes are a separate, explicitly scoped caller operation.
"""
from pathlib import Path
import base64
import contextlib
import fcntl
import hashlib
import ipaddress
import json
import os
import re
import shutil
import signal
import secrets
import ssl
import stat
import subprocess
import sys
import time
import urllib.parse
import urllib.request

PREFIX = '/var/tmp/wanli-nobel-relay-'
PROD = 'openmaic-learner-openmaic-1'


def run(*args):
    result = subprocess.run(args, capture_output=True, text=True, timeout=30)
    if result.returncode:
        raise RuntimeError('Scoped command failed: ' + args[0])
    return result.stdout.strip()


def inspect(identity):
    result = subprocess.run(['docker', 'inspect', identity], capture_output=True, text=True, timeout=10)
    if result.returncode:
        if 'No such object:' in result.stderr or 'No such container:' in result.stderr:
            return None
        raise RuntimeError('Docker inspection unavailable')
    return json.loads(result.stdout)[0]


def save(root, name, value):
    if Path(name).name != name or name in ['.', '..']:
        raise ValueError('Invalid state filename')
    temporary = root / (name + '.' + secrets.token_hex(8) + '.new')
    fd = os.open(temporary, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o600)
    try:
        with os.fdopen(fd, 'w') as file:
            json.dump(value, file)
            file.flush()
            os.fsync(file.fileno())
        temporary.replace(root / name)
    finally:
        temporary.unlink(missing_ok=True)


def require_root():
    if os.geteuid() != 0:
        raise RuntimeError('Root required for the scoped host operation')


def checked_root(value):
    require_root()
    root = Path(value)
    if not re.fullmatch(re.escape(PREFIX) + '[a-f0-9]{32}', str(root)) or root.is_symlink():
        raise RuntimeError('Invalid relay task path')
    directory = root.lstat()
    if not stat.S_ISDIR(directory.st_mode) or directory.st_uid != 0 or stat.S_IMODE(directory.st_mode) != 0o700:
        raise RuntimeError('Relay task directory must be root-owned and private')
    for name, mode in [('owner.json', 0o600), ('proxy.mjs', 0o644), ('ops.py', 0o644)]:
        info = (root / name).lstat()
        if not stat.S_ISREG(info.st_mode) or info.st_uid != 0 or stat.S_IMODE(info.st_mode) != mode:
            raise RuntimeError('Untrusted relay state/source file')
    state = json.loads((root / 'owner.json').read_text())
    if str(root) != PREFIX + state['run'] or not re.fullmatch('[a-f0-9]{32}', state['run']):
        raise RuntimeError('Relay task identity mismatch')
    if hashlib.sha256((root / 'proxy.mjs').read_bytes()).hexdigest() != state['sourceSHA256']:
        raise RuntimeError('Relay source identity changed')
    return root, state


@contextlib.contextmanager
def task_lock(root):
    fd = os.open(root / '.operation.lock', os.O_RDWR | os.O_CREAT | os.O_NOFOLLOW, 0o600)
    try:
        info = os.fstat(fd)
        if not stat.S_ISREG(info.st_mode) or info.st_uid != os.geteuid() or stat.S_IMODE(info.st_mode) != 0o600:
            raise RuntimeError('Untrusted relay operation lock')
        try:
            fcntl.flock(fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            raise RuntimeError('Another relay operation is already running') from None
        yield
    finally:
        os.close(fd)


def owned(actual, state):
    labels = actual.get('Config', {}).get('Labels') or {}
    return (actual.get('Id') == state['cid'] and actual.get('Image') == state['image'] and
            actual.get('Name') == '/wanli-nobel-relay-' + state['run'] and
            labels.get('wanli.qa.owner') == 'nobel-free-relay' and
            labels.get('wanli.qa.run') == state['run'] and
            labels.get('wanli.qa.source') == state['sourceSHA256'])


def memory_mib():
    return int(next(row.split()[1] for row in Path('/proc/meminfo').read_text().splitlines()
                    if row.startswith('MemAvailable:'))) / 1024


def process_identity(pid):
    try:
        fields = Path(f'/proc/{pid}/stat').read_text().rsplit(')', 1)[1].split()
        if fields[0] in ['Z', 'X']:
            return None
        return {'start': fields[19], 'args': Path(f'/proc/{pid}/cmdline').read_bytes().split(b'\0'),
                'cgroup': Path(f'/proc/{pid}/cgroup').read_text()}
    except FileNotFoundError:
        return None


def stop_known_proxy(state):
    try:
        actual = inspect(state['cid'])
        if actual is None or not actual['State']['Running']:
            return
        if not owned(actual, state):
            raise RuntimeError('Refusing to stop mismatched relay')
        run('docker', 'stop', '--time', '3', state['cid'])
        return
    except (subprocess.TimeoutExpired, RuntimeError):
        # The Docker daemon may be unavailable. A host PID is usable only with
        # its original start identity, exact program and immutable container cgroup.
        pid = state.get('processId')
        identity = process_identity(pid) if type(pid) is int and pid > 1 else None
        if (identity and identity['start'] == state.get('processStart') and
                b'/qa/free-proxy.mjs' in identity['args'] and state['cid'] in identity['cgroup']):
            os.kill(pid, signal.SIGTERM)
            return
        raise RuntimeError('Unable to stop verified relay; unresolved owned receipt') from None


def _prepare(control_path, source_path, created):
    require_root()
    control = json.loads(Path(control_path).read_text())
    if not re.fullmatch('[a-f0-9]{32}', control['run']) or not re.fullmatch('[a-f0-9]{64}', control['token']):
        raise ValueError('Invalid relay identity')
    address = ipaddress.ip_address(control['publicIP'])
    if not address.is_global or address.version != 4:
        raise ValueError('Expected the verified Hong Kong public IPv4')
    source = Path(source_path).read_bytes()
    if hashlib.sha256(source).hexdigest() != control['sourceSHA256']:
        raise RuntimeError('Relay source transport mismatch')
    root = Path(PREFIX + control['run'])
    root.mkdir(mode=0o700)
    created['root'] = root
    (root / 'proxy.mjs').write_bytes(source)
    (root / 'proxy.mjs').chmod(0o644)
    shutil.copy(__file__, root / 'ops.py')
    (root / 'ops.py').chmod(0o644)
    state = {'run': control['run'], 'sourceSHA256': control['sourceSHA256'],
             'publicIP': str(address), 'root': str(root), 'phase': 'preparing',
             'tokenSHA256': hashlib.sha256(control['token'].encode()).hexdigest(),
             'preparedAt': time.time(), 'newInstance': False, 'productionChanged': False}
    save(root, 'owner.json', state)
    (root / 'token.txt').write_text(control['token'])
    (root / 'token.txt').chmod(0o600)
    config = root / 'openssl.cnf'
    config.write_text('[req]\nprompt=no\ndistinguished_name=dn\nx509_extensions=v3\n'
                      '[dn]\nCN=wanli-nobel-qa\n[v3]\nsubjectAltName=IP:' + str(address) +
                      ',IP:127.0.0.1\nbasicConstraints=critical,CA:TRUE\n'
                      'keyUsage=critical,keyCertSign,digitalSignature,keyEncipherment\n'
                      'extendedKeyUsage=serverAuth\n')
    run('openssl', 'req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-days', '1',
        '-config', str(config), '-keyout', str(root / 'key.pem'), '-out', str(root / 'cert.pem'))
    (root / 'key.pem').chmod(0o600)
    state.update(phase='prepared',
                 certificateSHA256=hashlib.sha256((root / 'cert.pem').read_bytes()).hexdigest(),
                 certificateBase64=base64.b64encode((root / 'cert.pem').read_bytes()).decode())
    save(root, 'owner.json', state)
    print(json.dumps(state))


def prepare(control_path, source_path):
    created = {}
    try:
        _prepare(control_path, source_path, created)
    except BaseException:
        # Authority comes from this invocation's successful exclusive mkdir,
        # not merely a caller-supplied path or a pre-existing owner receipt.
        root = created.get('root')
        if root:
            for name in ['key.pem', 'token.txt', 'relay.env']:
                file = root / name
                if file.exists() or file.is_symlink():
                    file.unlink()
        raise


def _start(value):
    root, state = checked_root(value)
    if state['phase'] != 'prepared' or (root / 'container.cid').exists():
        raise RuntimeError('Relay already started; inspect or close instead of replacing')
    if memory_mib() < 384 or shutil.disk_usage(root).free < 512 * 1024**2:
        raise RuntimeError('Insufficient host headroom for the 96 MiB relay')
    before = inspect(PROD)
    if before is None or not before['State']['Running']:
        raise RuntimeError('Production baseline unavailable')
    env = dict(row.split('=', 1) for row in before['Config']['Env'] if '=' in row)
    base = urllib.parse.urlparse(env.get('OPENROUTER_BASE_URL') or 'https://openrouter.ai/api/v1')
    if base.scheme != 'https' or base.hostname != 'openrouter.ai' or base.username or base.password:
        raise RuntimeError('Only existing official OpenRouter credentials may be used')
    key = env.get('OPENROUTER_API_KEY')
    if not key:
        raise RuntimeError('Existing free-provider credential unavailable')
    state['image'] = before['Image']
    state['phase'] = 'starting'
    state['productionBaseline'] = {'id': before['Id'], 'started': before['State']['StartedAt'],
                                   'restarts': before['RestartCount']}
    save(root, 'owner.json', state)
    values = {'OPENROUTER_API_KEY': key, 'QA_RELAY_TOKEN': (root / 'token.txt').read_text(),
              'QA_TLS_KEY_BASE64': base64.b64encode((root / 'key.pem').read_bytes()).decode(),
              'QA_TLS_CERT_BASE64': state['certificateBase64'], 'NODE_OPTIONS': '--max-old-space-size=48'}
    envfile = root / 'relay.env'
    try:
        with open(envfile, 'x', opener=lambda path, flags: os.open(path, flags, 0o600)) as file:
            for name, content in values.items():
                if '\n' in content or '\r' in content:
                    raise RuntimeError('Invalid relay environment')
                file.write(name + '=' + content + '\n')
        run('docker', 'run', '-d', '--name', 'wanli-nobel-relay-' + state['run'],
            '--cidfile', str(root / 'container.cid'), '--label', 'wanli.qa.owner=nobel-free-relay',
            '--label', 'wanli.qa.run=' + state['run'], '--label', 'wanli.qa.source=' + state['sourceSHA256'],
            '--memory=96m', '--memory-swap=128m', '--cpus=0.2', '--pids-limit=32',
            '--cap-drop=ALL', '--security-opt=no-new-privileges', '--log-opt=max-size=2m', '--log-opt=max-file=1',
            '-p', '0.0.0.0:8787:8787', '--env-file', str(envfile),
            '-v', str(root / 'proxy.mjs') + ':/qa/free-proxy.mjs:ro',
            '--entrypoint', 'node', state['image'], '/qa/free-proxy.mjs')
    finally:
        envfile.unlink(missing_ok=True)
    cid = (root / 'container.cid').read_text().strip()
    if not re.fullmatch('[a-f0-9]{64}', cid):
        raise RuntimeError('Malformed container receipt')
    state['cid'] = cid
    state['startedAt'] = time.time()
    state['phase'] = 'starting'
    save(root, 'owner.json', state)
    actual = inspect(cid)
    if actual is None or not owned(actual, state):
        raise RuntimeError('Relay ownership mismatch')
    expected = {'Memory': 96 * 1024**2, 'MemorySwap': 128 * 1024**2, 'NanoCpus': 200000000, 'PidsLimit': 32}
    if any(actual['HostConfig'].get(name) != number for name, number in expected.items()):
        raise RuntimeError('Relay limits not applied')
    state['processId'] = actual['State']['Pid']
    identity = process_identity(state['processId'])
    if not identity or state['cid'] not in identity['cgroup'] or b'/qa/free-proxy.mjs' not in identity['args']:
        raise RuntimeError('Relay host process identity unavailable')
    state['processStart'] = identity['start']
    save(root, 'owner.json', state)
    cert = ssl.create_default_context(cafile=str(root / 'cert.pem'))
    request = urllib.request.Request('https://127.0.0.1:8787/health',
                                    headers={'Authorization': 'Bearer ' + values['QA_RELAY_TOKEN']})
    for attempt in range(20):
        try:
            with urllib.request.urlopen(request, context=cert, timeout=2) as response:
                health = json.load(response)
                if health.get('status') == 'ok' and health.get('sourceSHA256') == state['sourceSHA256']:
                    break
        except (OSError, ValueError):
            pass
        time.sleep(0.5)
    else:
        raise RuntimeError('Relay TLS readiness failed')
    after = inspect(PROD)
    if after is None or after['Id'] != before['Id'] or after['State']['StartedAt'] != before['State']['StartedAt'] or after['RestartCount'] != before['RestartCount']:
        raise RuntimeError('Production baseline changed during relay startup')
    state['phase'] = 'guard-starting'
    save(root, 'owner.json', state)
    with open(os.devnull, 'w') as sink:
        guard = subprocess.Popen(['python3', str(root / 'ops.py'), 'guard', str(root)],
                                 stdin=subprocess.DEVNULL, stdout=sink, stderr=sink, start_new_session=True)
    state['guardPid'] = guard.pid
    guard_identity = process_identity(guard.pid)
    if not guard_identity:
        raise RuntimeError('Guardian exited during startup')
    state['guardProcessStart'] = guard_identity['start']
    save(root, 'owner.json', state)
    for attempt in range(30):
        if (root / 'guard-ready.json').exists():
            ack = json.loads((root / 'guard-ready.json').read_text())
            live = process_identity(guard.pid)
            if (ack.get('pid') == guard.pid and ack.get('processStart') == state['guardProcessStart'] and
                    ack.get('cid') == state['cid'] and ack.get('run') == state['run'] and
                    live and live['start'] == state['guardProcessStart']):
                break
        time.sleep(0.1)
    else:
        raise RuntimeError('Guardian failed to acknowledge readiness')
    state['phase'] = 'ready'
    save(root, 'owner.json', state)
    print(json.dumps({key: state[key] for key in ['root', 'run', 'cid', 'image', 'phase', 'sourceSHA256', 'startedAt']}))


def start(value):
    root, _ = checked_root(value)
    with task_lock(root):
        _, initial = checked_root(value)
        if initial['phase'] != 'prepared' or (root / 'container.cid').exists():
            raise RuntimeError('Relay already started; do not replace it')
        attempt = secrets.token_hex(16)
        initial['startAttempt'] = attempt
        save(root, 'owner.json', initial)
        try:
            _start(value)
        except BaseException:
            # The lock and this explicit claim grant rollback authority even
            # if a failure occurs after creating the process or guardian.
            _, current = checked_root(value)
            if current.get('startAttempt') == attempt:
                _close(value)
            raise


def guard(value):
    root, state = checked_root(value)
    verified = False
    try:
        while time.time() - state['startedAt'] < 3660 and not (root / 'guard.done').exists():
            actual = inspect(state['cid'])
            if actual is None or not actual['State']['Running']:
                return
            if not owned(actual, state):
                raise RuntimeError('Guard refuses unowned container')
            verified = True
            available = memory_mib()
            if available < 192:
                raise RuntimeError('Host memory floor')
            save(root, 'guard-status.json', {'at': time.time(), 'availableMiB': available, 'run': state['run']})
            if not (root / 'guard-ready.json').exists():
                identity = process_identity(os.getpid())
                save(root, 'guard-ready.json', {'pid': os.getpid(), 'processStart': identity['start'],
                      'cid': state['cid'], 'run': state['run'], 'at': time.time()})
            time.sleep(8)
    except BaseException as error:
        try:
            save(root, 'guard-failed.json', {'errorType': type(error).__name__, 'at': time.time(), 'run': state['run']})
        except OSError:
            pass
        raise
    finally:
        # Failure of monitoring must not silently leave the monitored service on.
        if verified:
            stop_known_proxy(state)


def _close(value):
    root, state = checked_root(value)
    (root / 'guard.done').touch()
    receipt = root / 'container.cid'
    if receipt.exists():
        cid = receipt.read_text().strip()
        if not re.fullmatch('[a-f0-9]{64}', cid):
            raise RuntimeError('Invalid cleanup receipt')
        # A failed Docker start may have written its CID before owner.json was updated.
        state['cid'] = cid
        actual = inspect(cid)
        if actual:
            if not owned(actual, state):
                raise RuntimeError('Refusing cleanup of mismatched relay')
            run('docker', 'rm', '-f', cid)
            if inspect(cid) is not None:
                raise RuntimeError('Owned relay still present')
    for name in ['key.pem', 'token.txt', 'relay.env']:
        file = root / name
        if file.is_symlink():
            raise RuntimeError('Refusing secret cleanup through a symlink')
        if file.exists():
            with file.open('r+b') as stream:
                stream.write(b'\0' * file.stat().st_size)
                stream.flush()
                os.fsync(stream.fileno())
            file.unlink()
    state['phase'] = 'closed'
    pid = state.get('guardPid')
    if type(pid) is int and pid > 1:
        for attempt in range(18):
            identity = process_identity(pid)
            if not identity or identity['start'] != state.get('guardProcessStart'):
                break
            time.sleep(0.5)
        else:
            identity = process_identity(pid)
            if (identity and identity['start'] == state.get('guardProcessStart') and
                    str(root / 'ops.py').encode() in identity['args']):
                os.kill(pid, signal.SIGTERM)
                for attempt in range(10):
                    if process_identity(pid) is None:
                        break
                    time.sleep(0.2)
                else:
                    raise RuntimeError('Owned guardian did not exit')
    save(root, 'owner.json', state)
    print(json.dumps({'root': str(root), 'phase': 'closed', 'firewallCleanup': 'separate caller responsibility'}))


def close(value):
    root, _ = checked_root(value)
    with task_lock(root):
        _close(value)


if __name__ == '__main__':
    require_root()
    if sys.argv[1] == 'prepare':
        prepare(sys.argv[2], sys.argv[3])
    else:
        {'start': start, 'guard': guard, 'close': close}[sys.argv[1]](sys.argv[2])
