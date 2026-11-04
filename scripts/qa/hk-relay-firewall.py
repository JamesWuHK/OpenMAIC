"""Open/close only one verified active public QA runner /32 on the relay port."""
import ipaddress
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import tempfile
import hashlib

AWS = '/Users/wujames/.local/bin/aws'
REPO = 'JamesWuHK/OpenMAIC'


def command(args):
    result = subprocess.run(args, capture_output=True, text=True, timeout=35)
    if result.returncode:
        raise RuntimeError('Scoped command failed: ' + args[0])
    return json.loads(result.stdout) if result.stdout.strip() else None


def aws(operation, *args):
    return command([AWS, 'lightsail', operation, '--profile', 'wanli-lightsail-ops',
                    '--region', 'ap-east-1', '--instance-name', 'openmaic-learner-hk', *args])


def rules():
    return aws('get-instance-port-states')['portStates']


def overlaps(rule):
    return rule['protocol'] in ['tcp', 'all'] and rule['fromPort'] <= 8787 <= rule['toPort'] and rule['state'] == 'open'


def save(path, value):
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o600)
    with os.fdopen(fd, 'w') as file:
        json.dump(value, file)


def close(receipt_path):
    receipt = json.loads(Path(receipt_path).read_text())
    rule = receipt['rule']
    address = ipaddress.ip_network(rule['cidrs'][0])
    if (rule != {'fromPort': 8787, 'toPort': 8787, 'protocol': 'tcp',
                 'cidrs': [str(address)], 'ipv6Cidrs': [], 'cidrListAliases': []} or
            address.version != 4 or address.prefixlen != 32 or not address.network_address.is_global):
        raise RuntimeError('Invalid owned firewall receipt')
    aws('close-instance-public-ports', '--port-info', json.dumps(rule))
    remaining = rules()
    if any(overlaps(row) and str(address) in row.get('cidrs', []) for row in remaining):
        raise RuntimeError('Owned runner firewall rule still present')
    save(Path(receipt_path).with_suffix('.closed.json'), {'closed': True, 'rule': rule})
    print(json.dumps({'closed': True, 'port': 8787, 'runnerCIDR': str(address)}))


def download_handshake(run_id, attempt, expected_source):
    name = f'nobel-qa-handshake-{run_id}-{attempt}'
    artifacts = command(['gh', 'api', f'repos/{REPO}/actions/runs/{run_id}/artifacts'])['artifacts']
    candidates = [row for row in artifacts if row['name'] == name and not row['expired']]
    if len(candidates) != 1:
        raise RuntimeError('Exact active-run handshake artifact unavailable')
    artifact = candidates[0]
    if artifact['workflow_run']['id'] != int(run_id) or artifact['workflow_run']['head_sha'] != expected_source:
        raise RuntimeError('Handshake artifact provenance mismatch')
    with tempfile.TemporaryDirectory(prefix='wanli-nobel-handshake-') as directory:
        result = subprocess.run(['gh', 'run', 'download', run_id, '--repo', REPO,
                                  '--name', name, '--dir', directory],
                                 capture_output=True, text=True, timeout=60)
        if result.returncode:
            raise RuntimeError('Exact-run artifact download failed')
        data = (Path(directory) / 'handshake.json').read_bytes()
    return json.loads(data), {'artifactId': artifact['id'], 'name': name,
                              'run': run_id, 'attempt': str(attempt),
                              'sha256': hashlib.sha256(data).hexdigest()}


def open_rule(session, run_id, expected_source, image_source):
    if not re.fullmatch(r'\d+', run_id) or not all(re.fullmatch('[a-f0-9]{40}', value) for value in [expected_source, image_source]):
        raise ValueError('Invalid workflow identity')
    run = command(['gh', 'api', f'repos/{REPO}/actions/runs/{run_id}'])
    if (run['head_sha'] != expected_source or run['status'] != 'in_progress' or
            run['head_repository']['full_name'] != REPO or
            run['path'].split('@', 1)[0] != '.github/workflows/learner-cloud-image.yml'):
        raise RuntimeError('Expected active exact-source native workflow')
    handshake, provenance = download_handshake(run_id, run['run_attempt'], expected_source)
    if (handshake['workflowSource'] != expected_source or handshake['imageSource'] != image_source or
            handshake.get('published') is not False or
            handshake.get('qaRun') != run_id or handshake.get('qaAttempt') != str(run['run_attempt']) or
            handshake.get('qaJob') != 'native_qa'):
        raise RuntimeError('Runner handshake identity mismatch')
    address = ipaddress.ip_address(handshake['runnerIPv4'])
    if address.version != 4 or not address.is_global:
        raise ValueError('Expected public runner IPv4')
    jobs = command(['gh', 'api', f'repos/{REPO}/actions/runs/{run_id}/jobs'])['jobs']
    active = [job for job in jobs if job['name'] == 'native_qa' and job['status'] == 'in_progress']
    if len(active) != 1:
        raise RuntimeError('Expected one active native QA job')
    job = active[0]
    labels = set(job.get('labels', []))
    if handshake.get('ephemeralPublicRunner') is True:
        valid_runner = ('ubuntu-24.04' in labels and 'self-hosted' not in labels and
                        handshake.get('runnerKind', 'public-standard') == 'public-standard')
    else:
        valid_runner = (handshake.get('ephemeralPublicRunner') is False and
                        handshake.get('runnerKind') == 'self-hosted' and
                        handshake.get('runnerName') == job.get('runner_name') == 'openmaic-cloud-linux' and
                        {'self-hosted', 'Linux', 'X64', 'openmaic', 'cloud-ci'}.issubset(labels))
    if not valid_runner:
        raise RuntimeError('Active QA runner does not match the authenticated handshake')
    before = rules()
    if any(overlaps(row) for row in before):
        raise RuntimeError('Relay port already has an owner; do not merge or replace its rule')
    rule = {'fromPort': 8787, 'toPort': 8787, 'protocol': 'tcp', 'cidrs': [str(address) + '/32'],
            'ipv6Cidrs': [], 'cidrListAliases': []}
    receipt = Path(session) / ('firewall-' + run_id + '.json')
    save(receipt, {'rule': rule, 'before': before, 'qaRun': run_id, 'workflowSource': expected_source,
                   'handshake': handshake, 'artifactProvenance': provenance})
    try:
        aws('open-instance-public-ports', '--port-info', json.dumps(rule))
        after = rules()
        new = [row for row in after if overlaps(row)]
        expected = dict(rule, state='open')
        unchanged = [row for row in after if not overlaps(row)]
        if new != [expected] or sorted(unchanged, key=json.dumps) != sorted(before, key=json.dumps):
            raise RuntimeError('Exact runner-only firewall postcondition failed')
    except BaseException:
        close(receipt)
        raise
    print(json.dumps({'opened': True, 'port': 8787, 'runnerCIDR': rule['cidrs'][0],
                      'receipt': str(receipt), 'otherPortsUnchanged': True}))


if __name__ == '__main__':
    if sys.argv[1] == 'open':
        open_rule(*sys.argv[2:])
    elif sys.argv[1] == 'close':
        close(sys.argv[2])
    else:
        raise ValueError('Only scoped open/close supported')
