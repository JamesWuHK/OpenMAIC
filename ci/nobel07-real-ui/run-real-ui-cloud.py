"""Run the limited real-model pilot against an already tested immutable image.

Draft orchestration: not permission to publish or a full-series acceptance gate.
"""
from pathlib import Path
import hashlib
import json
import os
import re
import signal
import subprocess
import sys
import time
import urllib.request

from verify_cloud_lane import verify_cloud_lane

assert os.environ.get('CI') == 'true'
verify_cloud_lane()
w = Path(os.environ['TASK_WORKSPACE']).resolve()
assert Path.cwd().resolve() == w
assert w.name == f"nobel07-app-{os.environ['GITHUB_RUN_ID']}-{os.environ['GITHUB_RUN_ATTEMPT']}"
q = Path(__file__).resolve().parent
out = w / 'artifacts' / 'nobel07-real-ui'
assert out.is_dir() and not out.is_symlink() and out.resolve().is_relative_to(w)
source = 'dc4e23a273a7933948bfd9236c9bdf411a6a4772'
archive = w / 'artifacts' / 'tested-image'
assert archive.resolve().is_relative_to(w) and not archive.is_symlink()
assert (archive / 'source-sha.txt').read_text().strip() == source
checksum = (archive / 'image.tar.gz.sha256').read_text().strip()
assert re.fullmatch(r'[0-9a-f]{64}  image\.tar\.gz', checksum)
digest = hashlib.sha256()
with (archive / 'image.tar.gz').open('rb') as f:
    for chunk in iter(lambda: f.read(1024 * 1024), b''):
        digest.update(chunk)
assert digest.hexdigest() == checksum.split()[0]
image_id = json.loads((archive / 'image-id.json').read_text())
assert re.fullmatch(r'sha256:[0-9a-f]{64}', image_id)

def docker(*args, timeout=120):
    return subprocess.check_output(['docker', *args], text=True, timeout=timeout).strip()

subprocess.run(['docker', 'load', '--input', str(archive / 'image.tar.gz')], check=True, timeout=300)
image = json.loads(docker('image', 'inspect', image_id))[0]
assert image['Id'] == image_id and image['Architecture'] == 'amd64'
assert image['Config']['Labels']['org.opencontainers.image.revision'] == source
run = os.environ['GITHUB_RUN_ID']
attempt = os.environ['GITHUB_RUN_ATTEMPT']
owner = 'nobel07-real-ui-20261104'
candidate = f'nobel07-real-candidate-{run}-{attempt}'
browser = f'nobel07-real-browser-{run}-{attempt}'
owned = []
cleanup = []
proof = {'testedSource': source, 'appImageId': image_id, 'imageArchiveSHA256': digest.hexdigest(), 'published': False, 'productionCourseOrConfigMutated': False, 'realModelCallsPossible': True, 'fullReleaseAccepted': False}
(out / 'image-provenance.json').write_text(json.dumps(proof, indent=2) + '\n')

def interrupted(signum, frame):
    raise SystemExit(128 + signum)

for sig in (signal.SIGTERM, signal.SIGINT):
    signal.signal(sig, interrupted)

try:
    common = ['--label', 'wanli.qa.owner=' + owner, '--label', 'wanli.qa.run=' + run,
              '--cap-drop', 'ALL', '--security-opt', 'no-new-privileges', '--pids-limit', '256']
    args = ['docker', 'create', '--name', candidate, *common, '--memory', '2048m', '--memory-swap', '2560m', '--cpus', '1', '-p', '127.0.0.1::3002']
    for item in ('PORT=3002', 'OPENMAIC_DEPLOYMENT_MODE=learner', 'OPENAI_API_KEY=synthetic-ci-not-a-secret', 'OPENAI_BASE_URL=http://127.0.0.1:9/v1', 'DEFAULT_MODEL=openai:gpt-4o-mini', 'LEARNER_PUBLISHED_COURSES_PATH=/qa-catalog/published-courses.json'):
        args += ['-e', item]
    for host, dest in ((w / 'content/learner', '/app/content/learner'), (w / 'content/learner/media', '/app/public/learner/runtime'), (w / 'data/classrooms', '/app/data/classrooms'), (out / 'catalog', '/qa-catalog')):
        assert host.is_dir() and host.resolve().is_relative_to(w)
        args += ['-v', f'{host}:{dest}:ro']
    owned.append((candidate, image_id))
    subprocess.run([*args, image_id], check=True, timeout=60)
    docker('start', candidate)
    port = docker('port', candidate, '3002/tcp').splitlines()[0].rsplit(':', 1)[1]
    assert port.isdigit()
    actual = None
    for _ in range(30):
        try:
            with urllib.request.urlopen(f'http://127.0.0.1:{port}/api/learner/courses', timeout=5) as response:
                actual = json.load(response)
            break
        except (OSError, ValueError):
            time.sleep(2)
    assert actual and len(actual['courses']) == 1
    course = actual['courses'][0]
    assert course['id'] == 'hk-nobel-07-sakaguchi-lecture-v1' and course['sceneCount'] == 12
    (out / 'candidate-catalog-api.json').write_text(json.dumps(actual, ensure_ascii=False, indent=2) + '\n')
    qa_ref = 'mcr.microsoft.com/playwright@sha256:65cefd09a5e943921ecd3a6e5414c603db2eb161e9eb48f2e2ccc63486dc7dc0'
    docker('pull', qa_ref, timeout=300)
    qa = json.loads(docker('image', 'inspect', qa_ref))[0]
    assert qa_ref in qa['RepoDigests'] and qa['Architecture'] == 'amd64'
    seccomp = w / 'ci/nobel07-native/seccomp_profile.json'
    assert hashlib.sha256(seccomp.read_bytes()).hexdigest() == '0c4b9e74b24ed79572cf0b1aaa9c92afc8a13019d8f794c13c73aa4174e9db5a'
    args = ['docker', 'create', '--name', browser, *common, '--memory', '768m', '--memory-swap', '1024m', '--cpus', '1', '--shm-size', '256m', '--user', f'{os.getuid()}:{os.getgid()}', '--security-opt', f'seccomp={seccomp}', '--network', 'container:' + candidate, '--init', '--read-only', '--tmpfs', '/tmp:rw,nosuid,nodev,size=256m,mode=1777', '-e', 'HOME=/tmp', '-e', 'CI=true', '-v', f'{w}:/workspace:ro', '-v', f'{q}:/qa:ro', '-v', f'{out}:/workspace/artifacts/nobel07-real-ui:rw', '-w', '/workspace', qa['Id'], 'timeout', '-k', '10s', '900s', 'node', '/qa/qa-real-model-speech.mjs']
    owned.append((browser, qa['Id']))
    subprocess.run(args, check=True, timeout=60)
    docker('start', browser)
    started = time.monotonic()
    while json.loads(docker('inspect', browser))[0]['State']['Running']:
        available = int(next(line.split()[1] for line in Path('/proc/meminfo').read_text().splitlines() if line.startswith('MemAvailable:')))
        assert available >= 3 * 1024 ** 2, 'Host reserve exhausted'
        assert time.monotonic() - started < 930, 'QA container exceeded its deadline'
        time.sleep(5)
    state = json.loads(docker('inspect', browser))[0]['State']
    assert state['ExitCode'] == 0 and not state['OOMKilled'], state
    result = json.loads((out / 'report.json').read_text())
    assert result['pass'] and len(result['cases']) == 3
    assert result['fullReleaseAccepted'] is False
finally:
    for name, expected_image in reversed(owned):
        try:
            inspection = subprocess.run(['docker', 'inspect', name], capture_output=True, text=True, timeout=30)
            if inspection.returncode == 1 and inspection.stderr.strip() in (f'Error: No such object: {name}', f'Error response from daemon: No such container: {name}'):
                cleanup.append({'name': name, 'removed': True, 'alreadyAbsent': True})
                continue
            inspection.check_returncode()
            obj = json.loads(inspection.stdout)[0]
            assert obj['Image'] == expected_image
            assert obj['Config']['Labels']['wanli.qa.owner'] == owner
            assert obj['Config']['Labels']['wanli.qa.run'] == run
            log_error = None
            try:
                (out / (name + '.log')).write_text(docker('logs', name))
            except Exception as error:
                log_error = type(error).__name__
            docker('rm', '-f', name)
            cleanup.append({'name': name, 'removed': True, 'logError': log_error})
        except Exception as error:
            cleanup.append({'name': name, 'removed': False, 'error': type(error).__name__})
    (out / 'container-cleanup.json').write_text(json.dumps(cleanup, indent=2) + '\n')
    assert all(item['removed'] and not item.get('logError') for item in cleanup), 'Owned container cleanup or diagnostics incomplete'
