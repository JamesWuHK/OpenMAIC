"""Cloud-only native QA against a previously tested image. Never publishes."""
import base64
import hashlib
import importlib.util
import ipaddress
import json
import os
from pathlib import Path
import re
import shutil
import ssl
import subprocess
import sys
import time
import urllib.parse
import urllib.request
import zipfile

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('owned', ROOT / 'scripts/ci/nobel-resources.py')
owned = importlib.util.module_from_spec(spec)
spec.loader.exec_module(owned)
BUNDLE_SHA = '970b5ad7d83dca07aa192916f5189396ee0836ebfefdd74b0bf8d79bfcfc157a'


def git_request(path=ROOT / '.github/workflows/nobel-native-request.json'):
    if os.environ.get('GITHUB_EVENT_NAME') != 'push':
        return
    if os.environ.get('GITHUB_REF') != 'refs/heads/codex/nobel-runner-recovery-20261104':
        raise RuntimeError('Git QA requests are limited to the recovery branch')
    changed = owned.command('git', 'diff-tree', '--no-commit-id', '--name-only', '-r', 'HEAD').splitlines()
    if '.github/workflows/nobel-native-request.json' not in changed:
        raise RuntimeError('No explicit new QA request in the current commit')
    request = json.loads(path.read_text())
    mapping = {'image_run_id': 'IMAGE_RUN_ID', 'image_source': 'CANDIDATE_SOURCE_SHA',
               'relay_url': 'QA_RELAY_URL', 'relay_ca_base64': 'QA_RELAY_CA_BASE64',
               'device': 'QA_DEVICE', 'courses': 'QA_COURSES', 'checks': 'QA_CHECKS'}
    if set(request) != set(mapping) | {'nonce'} or not re.fullmatch('[a-f0-9]{32}', request['nonce']):
        raise ValueError('Invalid explicit request schema')
    if (not re.fullmatch(r'\d+', request['image_run_id']) or
            not re.fullmatch('[a-f0-9]{40}', request['image_source']) or
            request['device'] not in ['desktop', 'mobile'] or
            request['checks'] not in ['full', 'core-matrix'] or
            (request['courses'] != 'all' and not set(request['courses'].split(',')).issubset({'01', '02', '03', '04', '05', '06'}))):
        raise ValueError('Invalid native QA request selection')
    relay_url(request['relay_url'])
    with open(os.environ['GITHUB_ENV'], 'a') as env:
        for name, target in mapping.items():
            value = request[name]
            if not isinstance(value, str) or '\n' in value or '\r' in value:
                raise ValueError('Invalid request environment value')
            env.write(target + '=' + value + '\n')
    print(json.dumps({'explicitGitRequest': request['nonce'], 'device': request['device'],
                      'courses': request['courses'], 'checks': request['checks'], 'published': False}))


def digest(path):
    result = hashlib.sha256()
    with open(path, 'rb') as file:
        for block in iter(lambda: file.read(8 * 1024**2), b''):
            result.update(block)
    return result.hexdigest()


def relay_url(value):
    url = urllib.parse.urlparse(value)
    if (url.scheme != 'https' or url.port != 8787 or url.path != '/v1' or
            url.username or url.password or url.query or url.fragment or not url.hostname):
        raise ValueError('Expected a dedicated HTTPS relay on port 8787/v1')
    if not ipaddress.ip_address(url.hostname).is_global:
        raise ValueError('Relay must use the verified public server address')
    return value


def validate_acceptance(acceptance, source, image_id):
    if (acceptance.get('source') != source or acceptance.get('image') != image_id or
            acceptance.get('fixtureRegressionPassed') is not True or
            acceptance.get('nativeDiscussionAccepted') is not False or
            acceptance.get('published') is not False):
        raise RuntimeError('Artifact lacks exact fixture-acceptance evidence')


def prepare():
    source, run_id = os.environ['CANDIDATE_SOURCE_SHA'], os.environ['IMAGE_RUN_ID']
    if not re.fullmatch('[a-f0-9]{40}', source) or not re.fullmatch(r'\d+', run_id):
        raise ValueError('Invalid tested image identity')
    relay_url(os.environ['QA_RELAY_URL'])
    if not re.fullmatch('[a-f0-9]{64}', os.environ.get('QA_RELAY_TOKEN', '')):
        raise ValueError('Missing ephemeral QA relay token')
    # A new workflow can reuse an image only when its runtime sources are identical.
    changed = owned.command('git', 'diff', '--name-only', source, 'HEAD').splitlines()
    allowed = ('.github/workflows/', 'tests/', 'scripts/ci/', 'scripts/qa/', 'scripts/learner/', 'docs/')
    if any(not name.startswith(allowed) for name in changed):
        raise RuntimeError('Runtime sources differ from the tested image; rebuild instead')
    owned.capacity()
    owned.initialize()
    _, _, task = owned.context()
    image_dir = task / 'image'
    image_dir.mkdir()
    run = json.loads(owned.command('gh', 'api', f'repos/JamesWuHK/OpenMAIC/actions/runs/{run_id}'))
    if (run['head_sha'] != source or run['conclusion'] != 'success' or
            run['head_repository']['full_name'] != 'JamesWuHK/OpenMAIC' or
            run['path'].split('@', 1)[0] != '.github/workflows/learner-cloud-image.yml'):
        raise RuntimeError('Image build is not the approved successful source')
    jobs = json.loads(owned.command('gh', 'api',
        f'repos/JamesWuHK/OpenMAIC/actions/runs/{run_id}/jobs?filter=latest&per_page=100'))['jobs']
    candidates = [job for job in jobs if job['name'] == 'candidate']
    if len(candidates) != 1 or candidates[0]['conclusion'] != 'success':
        raise RuntimeError('Expected successful image candidate job')
    attempt = run['run_attempt']
    subprocess.run(['gh', 'run', 'download', run_id, '--repo', 'JamesWuHK/OpenMAIC', '--name',
                    f'learner-image-{source}-{attempt}', '--dir', str(image_dir)], check=True)
    if (image_dir / 'source-sha.txt').read_text().strip() != source:
        raise RuntimeError('Artifact source mismatch')
    expected = (image_dir / 'image.tar.gz.sha256').read_text().split()[0]
    if digest(image_dir / 'image.tar.gz') != expected:
        raise RuntimeError('Image archive checksum mismatch')
    subprocess.run(['docker', 'load', '--input', str(image_dir / 'image.tar.gz')], check=True, timeout=300)
    image_id = json.loads((image_dir / 'image-id.json').read_text())
    if not re.fullmatch(r'sha256:[a-f0-9]{64}', image_id):
        raise RuntimeError('Invalid image ID')
    validate_acceptance(json.loads((image_dir / 'acceptance.json').read_text()), source, image_id)
    image = json.loads(owned.command('docker', 'image', 'inspect', image_id))[0]
    if (image['Id'] != image_id or image['Architecture'] != 'amd64' or image['Os'] != 'linux' or
            image['Config']['Labels'].get('org.opencontainers.image.revision') != source):
        raise RuntimeError('Loaded image provenance mismatch')
    if any(value.partition('=')[0].endswith('_API_KEY') and value.partition('=')[2]
           for value in image['Config'].get('Env', [])):
        raise RuntimeError('Unexpected baked-in provider credential')

    bundle = ROOT / 'tests/fixtures/nobel-native-discussion/payload.zip'
    if digest(bundle) != BUNDLE_SHA:
        raise RuntimeError('Frozen classroom bundle changed')
    candidate = task / 'candidate'
    candidate.mkdir()
    with zipfile.ZipFile(bundle) as archive:
        for name in archive.namelist():
            if '..' in Path(name).parts or Path(name).is_absolute() or not (
                    name == 'manifest.json' or name.startswith(('classrooms/', 'content/'))):
                raise RuntimeError('Unexpected frozen bundle path')
        archive.extractall(candidate)
    manifest = json.loads((candidate / 'manifest.json').read_text())
    if len(manifest['courses']) != 6:
        raise RuntimeError('Expected six frozen classrooms')
    for course in manifest['courses']:
        if digest(candidate / 'classrooms' / (course['id'] + '.json')) != course['sha256']:
            raise RuntimeError('Frozen classroom checksum mismatch')
    (candidate / 'content/media').mkdir(exist_ok=True)
    (task / 'payload').mkdir()
    shutil.copy(candidate / 'manifest.json', task / 'payload/manifest.json')
    shutil.copy(ROOT / 'scripts/qa/nobel-native-browser.mjs', task / 'qa.mjs')
    shutil.copy(ROOT / 'scripts/qa/frozen-media-paths.mjs', task / 'frozen-media-paths.mjs')
    shutil.copy(ROOT / 'scripts/qa/native-audio-observer.mjs', task / 'native-audio-observer.mjs')
    shutil.copy(ROOT / 'scripts/qa/nobel-known-misconception.mjs', task / 'nobel-known-misconception.mjs')
    cert = base64.b64decode(os.environ['QA_RELAY_CA_BASE64'], validate=True)
    (task / 'relay-ca.pem').write_bytes(cert)
    (task / 'relay-ca.pem').chmod(0o644)
    ssl.create_default_context(cafile=str(task / 'relay-ca.pem'))
    (task / 'evidence').mkdir()
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
    with opener.open('https://checkip.amazonaws.com', timeout=10) as response:
        public_ip = response.read(128).decode().strip()
    address = ipaddress.ip_address(public_ip)
    if not address.is_global or address.version != 4:
        raise RuntimeError('Expected a public IPv4 QA runner address')
    handshake = {'runnerIPv4': public_ip, 'workflowSource': os.environ['GITHUB_SHA'],
                 'imageSource': source, 'image': image_id, 'buildRun': run_id,
                 'qaRun': os.environ['GITHUB_RUN_ID'], 'qaAttempt': os.environ['GITHUB_RUN_ATTEMPT'],
                 'qaJob': os.environ['GITHUB_JOB'],
                 'ephemeralPublicRunner': True, 'published': False}
    (task / 'evidence/handshake.json').write_text(json.dumps(handshake, indent=2))
    with open(os.environ['GITHUB_ENV'], 'a') as env:
        env.write('IMAGE_TAG=' + image_id + '\n')
    print(json.dumps(handshake))


def start():
    _, source, task = owned.checked_task()
    cert = ssl.create_default_context(cafile=str(task / 'relay-ca.pem'))
    request = urllib.request.Request(os.environ['QA_RELAY_URL'].removesuffix('/v1') + '/health',
                                     headers={'Authorization': 'Bearer ' + os.environ['QA_RELAY_TOKEN']})
    ready = False
    for attempt in range(60):
        try:
            with urllib.request.urlopen(request, context=cert, timeout=3) as response:
                health = json.load(response)
                if (response.status == 200 and health.get('status') == 'ok' and
                        health.get('model') == 'openrouter/free' and
                        health.get('sourceSHA256') == digest(ROOT / 'scripts/qa/openrouter-free-proxy.mjs') and
                        health.get('remainingRequests', 0) > 0):
                    ready = True
                    break
        except (OSError, ValueError):
            pass
        time.sleep(5)
    if not ready:
        raise RuntimeError('Verified HTTPS relay did not become ready; no fallback allowed')
    envfile = task / 'app.env'
    values = {'NODE_OPTIONS': '--max-old-space-size=256', 'OPENMAIC_DEPLOYMENT_MODE': 'learner',
              'OPENROUTER_API_KEY': os.environ['QA_RELAY_TOKEN'],
              'OPENROUTER_BASE_URL': os.environ['QA_RELAY_URL'], 'OPENROUTER_MODELS': 'openrouter/free',
              'DEFAULT_MODEL': 'openrouter:openrouter/free', 'NODE_EXTRA_CA_CERTS': '/qa-relay-ca.pem',
              'MODEL_ROUTES': json.dumps({'chat-adapter': {'model': 'openrouter:openrouter/free'},
                                         'pbl-v2-runtime': {'model': 'openrouter:openrouter/free'}})}
    with open(envfile, 'x', opener=lambda path, flags: os.open(path, flags, 0o600)) as file:
        for key, value in values.items():
            if '\n' in value or '\r' in value:
                raise RuntimeError('Invalid runtime environment')
            file.write(key + '=' + value + '\n')
    try:
        owned.start('app', os.environ['IMAGE_TAG'], ['--memory=384m', '--memory-swap=768m', '--cpus=0.5',
                    '-p', '127.0.0.1::3000', '--env-file', str(envfile),
                    '-v', str(task / 'candidate/classrooms') + ':/app/data/classrooms:ro',
                    '-v', str(task / 'candidate/content') + ':/app/content/learner:ro',
                    '-v', str(task / 'candidate/content/media') + ':/app/public/learner/runtime:ro',
                    '-v', str(task / 'submissions') + ':/app/data/teacher-submissions:rw',
                    '-v', str(task / 'relay-ca.pem') + ':/qa-relay-ca.pem:ro'])
    finally:
        envfile.unlink(missing_ok=True)
    app = owned.resource('app')
    binding = app['NetworkSettings']['Ports']['3000/tcp'][0]
    if binding['HostIp'] != '127.0.0.1':
        raise RuntimeError('Candidate must be loopback only')
    origin = 'http://127.0.0.1:' + binding['HostPort']
    (task / 'preview.json').write_text(json.dumps({'image': app['Image'], 'source': source,
         'origin': origin, 'container': app['Id'], 'workflowSource': os.environ['GITHUB_SHA'],
         'model': 'openrouter/free', 'paidProviderCredentials': False, 'published': False}))
    for attempt in range(30):
        try:
            with urllib.request.urlopen(origin + '/api/health', timeout=3) as response:
                if response.status == 200 and json.load(response).get('status') == 'ok':
                    with open(os.environ['GITHUB_ENV'], 'a') as env:
                        env.write('QA_ORIGIN=' + origin + '\n')
                    return
        except (OSError, ValueError):
            pass
        time.sleep(2)
    raise RuntimeError('Native candidate failed readiness')


def browser():
    _, source, task = owned.checked_task()
    batch = os.environ['QA_DEVICE']
    if batch not in ['desktop', 'mobile']:
        raise ValueError('Choose one device batch')
    tool = task / 'browser-tool'
    tool.mkdir()
    (tool / 'package.json').write_text(json.dumps({'private': True, 'dependencies': {'playwright': '1.58.2'}}))
    subprocess.run(['npm', 'install', '--prefix', str(tool), '--ignore-scripts', '--no-audit',
                    '--no-fund', '--package-lock=false'], check=True, timeout=180)
    image = 'mcr.microsoft.com/playwright:v1.58.2-noble'
    subprocess.run(['docker', 'pull', image], check=True, timeout=180)
    manifest = json.loads((task / 'candidate/manifest.json').read_text())
    requested = os.environ.get('QA_COURSES', 'all')
    selected = {course['id'].split('-')[2] for course in manifest['courses']} if requested == 'all' else set(requested.split(','))
    if not selected or not selected.issubset({'01', '02', '03', '04', '05', '06'}):
        raise ValueError('Choose approved lesson numbers only')
    checks = os.environ.get('QA_CHECKS', 'full')
    if checks not in ['full', 'core-matrix']:
        raise ValueError('Unknown acceptance matrix')
    for course in sorted(manifest['courses'], key=lambda item: item['id']):
        if course['id'].split('-')[2] not in selected:
            continue
        representative = course['id'].split('-')[2] == '01'
        modes = ['ui'] if checks == 'core-matrix' and batch == 'mobile' and not representative else ['ui', 'discussion']
        for mode in modes:
            if (task / 'browser.cid').exists():
                prior = owned.resource('browser')
                if prior:
                    subprocess.run(['docker', 'rm', prior['Id']], check=True)
                (task / 'browser.cid').unlink()
                (task / 'browser.json').unlink()
            owned.start('browser', image, ['--network=host', '--memory=768m', '--memory-swap=1g',
                '--cpus=0.75', '--shm-size=128m', '--user', f'{os.getuid()}:{os.getgid()}',
                '-e', 'XDG_CACHE_HOME=/tmp/nobel-browser-cache',
                '-e', 'XDG_CONFIG_HOME=/tmp/nobel-browser-config',
                '-e', 'QA_ORIGIN=' + os.environ['QA_ORIGIN'],
                '-e', 'QA_EXPECTED_IMAGE_SOURCE=' + source,
                '-e', 'QA_MATRIX=' + checks,
                '-e', 'QA_FOLLOWUP=' + ('1' if checks == 'full' or representative else '0'),
                '-e', 'QA_PAUSE_RESUME=' + ('1' if representative else '0'),
                '-e', 'QA_MEDIA_ORIGIN=https://class.wanli.ai', '-v', str(task) + ':/task:ro',
                '-v', str(task / 'evidence') + ':/task/evidence:rw', '-v', str(tool) + ':/qa:ro'],
                ['node', '/task/qa.mjs', mode, course['id'], batch])
            actual = owned.resource('browser')
            result = owned.command('docker', 'wait', actual['Id'], timeout=750)
            subprocess.run(['docker', 'logs', '--tail', '40', actual['Id']], check=True)
            if result != '0':
                raise RuntimeError('Native QA failed: ' + course['id'] + '/' + batch + '/' + mode)
    shutil.copy(task / 'preview.json', task / 'evidence/preview.json')


if __name__ == '__main__':
    {'git-request': git_request, 'prepare': prepare, 'start': start, 'browser': browser,
     'cleanup': owned.collect_cleanup}[sys.argv[1]]()
