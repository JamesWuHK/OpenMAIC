"""Per-run CI resources. Never remove containers by a reusable name."""
import hashlib
import json
import os
import pathlib
import re
import shutil
import subprocess
import sys
import time
import urllib.request
import uuid

PROMPTS = ['lib/prompts/templates', 'lib/prompts/snippets',
           'packages/@openmaic/generation/templates', 'packages/@openmaic/generation/snippets',
           'packages/@openmaic/generation/prompts-pbl']


def command(*args, **kwargs):
    return subprocess.check_output(args, text=True, **kwargs).strip()


def owned(actual, expected):
    labels = actual.get('Config', {}).get('Labels') or {}
    return (actual.get('Id') == expected['cid'] and
            actual.get('Name') == '/' + expected['name'] and
            actual.get('Image') == expected['image'] and
            labels.get('wanli.ci.owner') == 'nobel-candidate' and
            labels.get('wanli.ci.run') == expected['run'] and
            labels.get('org.opencontainers.image.revision') == expected['sha'])


def enough(memory, disk, inodes, minimum_inodes=1000000):
    # Leave at least 1 GiB beyond the builder's hard 5 GiB limit for host/runner/daemon.
    return memory >= 6 * 1024**3 and disk >= 20 * 1024**3 and inodes >= minimum_inodes


def capacity():
    memory = int(re.search(r'^MemAvailable:\s+(\d+)', pathlib.Path('/proc/meminfo').read_text(), re.M)[1]) * 1024
    docker_root = command('docker', 'info', '--format', '{{.DockerRootDir}}')
    # Measure Docker's actual filesystem, which may be a separate mounted volume.
    disk_paths = [pathlib.Path.cwd(), pathlib.Path(docker_root)]
    disk = min(shutil.disk_usage(p).free for p in disk_paths)
    inodes = min(os.statvfs(p).f_favail for p in disk_paths)
    print(json.dumps({'memory_available': memory, 'disk_free': disk, 'inodes_free': inodes}))
    if not enough(memory, disk, inodes, 300000 if '--after-install' in sys.argv else 1000000):
        raise RuntimeError('Insufficient capacity; stop without reclaiming unrelated resources')


def context():
    run = os.environ['GITHUB_RUN_ID'] + '-' + os.environ['GITHUB_RUN_ATTEMPT']
    sha = os.environ['GITHUB_SHA']
    if not re.fullmatch(r'\d+-\d+', run) or not re.fullmatch(r'[0-9a-f]{40}', sha):
        raise RuntimeError('Invalid run identity')
    task = pathlib.Path(os.environ['RUNNER_TEMP']) / ('nobel-ci-' + run)
    return run, sha, task


def initialize():
    run, sha, task = context()
    task.mkdir(mode=0o700)  # Refuse to adopt an existing path, including symlinks.
    (task / 'owner.json').write_text(json.dumps({'run': run, 'sha': sha}))
    (task / 'docker').mkdir(mode=0o700)
    (task / 'submissions').mkdir(mode=0o777)
    (task / 'submissions').chmod(0o777)
    with open(os.environ['GITHUB_ENV'], 'a') as env:
        env.write(f'TASK_DIR={task}\nDOCKER_CONFIG={task / "docker"}\nIMAGE_TAG=wanli-nobel-ci:{run}\n')
        env.write(f'BUILDER_NAME=nobel-{run}-{uuid.uuid4().hex}\n')
    pathlib.Path('artifacts/learner-image-qa').mkdir(parents=True, exist_ok=True)


def checked_task():
    run, sha, task = context()
    if task.is_symlink() or json.loads((task / 'owner.json').read_text()) != {'run': run, 'sha': sha}:
        raise RuntimeError('Task ownership mismatch')
    return run, sha, task


def inspect(cid):
    result = subprocess.run(['docker', 'inspect', cid], capture_output=True, text=True)
    if result.returncode:
        # Do not treat daemon or permission errors as proof that the resource is gone.
        if 'No such object:' in result.stderr or 'No such container:' in result.stderr:
            return None
        raise RuntimeError(result.stderr)
    return json.loads(result.stdout)[0]


def resource(kind):
    run, sha, task = checked_task()
    cidpath = task / (kind + '.cid')
    if not cidpath.exists():
        return None  # A failed name collision never gives authority to remove that name.
    cid = cidpath.read_text().strip()
    if not re.fullmatch(r'[0-9a-f]{64}', cid):
        raise RuntimeError('Malformed container receipt')
    actual = inspect(cid)
    if actual is None:
        return None
    expected = json.loads((task / (kind + '.json')).read_text())
    expected.update(cid=cid, run=run, sha=sha)
    if not owned(actual, expected):
        raise RuntimeError('Container ownership mismatch: refusing any operation')
    return actual


def start(kind, image, args, command_args=()):
    run, sha, task = checked_task()
    image_id = command('docker', 'image', 'inspect', image, '--format', '{{.Id}}')
    name = f'nobel-{run}-{kind}'
    (task / (kind + '.json')).write_text(json.dumps({'name': name, 'image': image_id}))
    return command('docker', 'run', '-d', '--cidfile', str(task / (kind + '.cid')),
                   '--name', name, '--label', 'wanli.ci.owner=nobel-candidate',
                   '--label', 'wanli.ci.run=' + run,
                   '--label', 'org.opencontainers.image.revision=' + sha,
                   '--cap-drop=ALL', '--security-opt=no-new-privileges', '--pids-limit=192',
                   *args, image, *command_args)


def candidate():
    run, sha, task = checked_task()
    image = os.environ['IMAGE_TAG']
    revision = command('docker', 'image', 'inspect', image, '--format', '{{index .Config.Labels "org.opencontainers.image.revision"}}')
    if revision != sha:
        raise RuntimeError('Candidate source mismatch')
    start('app', image, ['--memory=384m', '--memory-swap=768m', '--cpus=0.5',
          '-p', '127.0.0.1::3000', '-e', 'NODE_OPTIONS=--max-old-space-size=256',
          '-e', 'OPENMAIC_DEPLOYMENT_MODE=learner', '-e', 'OPENAI_API_KEY=synthetic-ci-not-a-secret',
          '-e', 'OPENAI_BASE_URL=http://127.0.0.1:9/v1', '-e', 'DEFAULT_MODEL=openai:gpt-4o-mini',
          '-v', str(pathlib.Path('content/learner').resolve()) + ':/app/content/learner:ro',
          '-v', str(pathlib.Path('content/learner/media').resolve()) + ':/app/public/learner/runtime:ro',
          '-v', str(task / 'submissions') + ':/app/data/teacher-submissions:rw'])
    actual = resource('app')
    binding = actual['NetworkSettings']['Ports']['3000/tcp'][0]
    if binding['HostIp'] != '127.0.0.1':
        raise RuntimeError('Candidate port must be loopback only')
    url = 'http://127.0.0.1:' + binding['HostPort']
    with open(os.environ['GITHUB_ENV'], 'a') as env:
        env.write('LEARNER_QA_BASE_URL=' + url + '\n')
    (task / 'candidate.json').write_text(json.dumps({'url': url, 'image': actual['Image'], 'sha': sha}))
    # No proxy inheritance, and no health claim from the SPA fallback.
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
    for attempt in range(30):
        try:
            with opener.open(url + '/api/health', timeout=3) as response:
                health = json.load(response)
                if response.status == 200 and health.get('status') == 'ok':
                    return
        except (OSError, ValueError):
            pass
        time.sleep(2)
    raise RuntimeError('Candidate health contract did not pass')


def prompts():
    actual = resource('app')
    if actual is None:
        raise RuntimeError('Candidate missing')
    manifest = {}
    for directory in PROMPTS:
        files = sorted(pathlib.Path(directory).rglob('*.md'))
        if not files:
            raise RuntimeError('Empty prompt input: ' + directory)
        for path in files:
            manifest[str(path)] = hashlib.sha256(path.read_bytes()).hexdigest()
    script = 'const fs=require("fs"),c=require("crypto"); const m=JSON.parse(fs.readFileSync(0,"utf8")); for(const [p,h] of Object.entries(m)){if(c.createHash("sha256").update(fs.readFileSync(p)).digest("hex")!==h)throw Error("Prompt mismatch: "+p)} console.log("Verified "+Object.keys(m).length+" runtime prompt files");'
    subprocess.run(['docker', 'exec', '-i', actual['Id'], 'node', '-e', script],
                   input=json.dumps(manifest), text=True, check=True)
    pathlib.Path('artifacts/learner-image-qa/prompt-sha256.json').write_text(json.dumps(manifest, indent=2))


def browser():
    image = 'mcr.microsoft.com/playwright:v1.58.2-noble'
    subprocess.run(['docker', 'pull', image], check=True)
    root = pathlib.Path.cwd()
    artifacts = root / 'artifacts'
    # This isolated test image has its own browsers and OS libraries; no host apt changes.
    start('browser', image, ['--network=host', '--memory=768m', '--memory-swap=1g',
          '--cpus=0.75', '--shm-size=128m', '--workdir=/work',
          '-e', 'CI=true', '-e', 'NODE_OPTIONS=--max-old-space-size=384',
          '-e', 'LEARNER_QA_BASE_URL=' + os.environ['LEARNER_QA_BASE_URL'],
          '-e', 'NO_PROXY=127.0.0.1,localhost', '-v', str(root) + ':/work:ro',
          '-v', str(artifacts) + ':/work/artifacts:rw'],
          ['node', 'node_modules/@playwright/test/cli.js', 'test', '--config', 'playwright.learner.config.ts'])
    actual = resource('browser')
    result = command('docker', 'wait', actual['Id'], timeout=900)
    subprocess.run(['docker', 'logs', actual['Id']], check=True)
    if result != '0':
        raise RuntimeError('Browser regression failed: ' + result)


def collect_cleanup():
    run, sha, task = context()
    if not (task / 'owner.json').exists():
        return
    checked_task()
    failures = []
    for kind in ['browser', 'app']:
        try:
            actual = resource(kind)
            if actual is None:
                continue
            log = subprocess.run(['docker', 'logs', '--tail', '300', actual['Id']], capture_output=True, text=True)
            pathlib.Path(f'artifacts/learner-image-qa/{kind}.log').write_text(log.stdout + log.stderr)
            pathlib.Path(f'artifacts/learner-image-qa/{kind}-state.json').write_text(json.dumps(actual['State']))
            subprocess.run(['docker', 'rm', '-f', actual['Id']], check=True)
        except Exception as error:
            failures.append(str(error))
    if failures:
        raise RuntimeError('; '.join(failures))
    # Image tag is unique to this run. Remove only if both run and source labels match.
    tag = 'wanli-nobel-ci:' + run
    found = subprocess.run(['docker', 'image', 'inspect', tag], capture_output=True, text=True)
    if found.returncode == 0:
        image = json.loads(found.stdout)[0]
        labels = image['Config'].get('Labels') or {}
        if labels.get('wanli.ci.run') != run or labels.get('org.opencontainers.image.revision') != sha:
            raise RuntimeError('Image ownership mismatch; refusing removal')
        receipt = task / 'app.json'
        if receipt.exists() and json.loads(receipt.read_text())['image'] != image['Id']:
            raise RuntimeError('Image tag changed after candidate start; refusing removal')
        subprocess.run(['docker', 'image', 'rm', tag], check=True)
    elif 'No such image:' not in found.stderr and 'No such object:' not in found.stderr:
        raise RuntimeError(found.stderr)


if __name__ == '__main__':
    {'capacity': capacity, 'init': initialize, 'start': candidate,
     'prompts': prompts, 'browser': browser, 'cleanup': collect_cleanup}[sys.argv[1]]()
