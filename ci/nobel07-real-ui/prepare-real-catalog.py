"""Prepare only an isolated CI catalog; never edit the production allowlist."""
from pathlib import Path
import hashlib
import json
import os
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent))
from verify_cloud_lane import verify_cloud_lane

assert os.environ.get('CI') == 'true'
verify_cloud_lane()
workspace = Path(os.environ['TASK_WORKSPACE']).resolve()
assert Path.cwd().resolve() == workspace
assert workspace.name == f"nobel07-app-{os.environ['GITHUB_RUN_ID']}-{os.environ['GITHUB_RUN_ATTEMPT']}"
cid = 'hk-nobel-07-sakaguchi-lecture-v1'
fixture = workspace / 'data' / 'classrooms' / (cid + '.json')
raw = fixture.read_bytes()
assert hashlib.sha256(raw).hexdigest() == '2a5d774804f67bb07811b4b64ad5613c979dfd822f5b58b2981cd0a9b5e56a86'
entry_bytes = (Path(__file__).resolve().parent / 'publication-entry-candidate.json').read_bytes()
assert hashlib.sha256(entry_bytes).hexdigest() == 'a4ae12438cbc605cd7b56e631d6021bd40aafbc3e1bb3dbccb1299f71e94bc6a'
entry = json.loads(entry_bytes)
assert entry['id'] == cid and set(entry) == {'id', 'description', 'topics', 'audiences', 'gradeRange', 'language', 'series', 'lessonNumber'}
# Required schema timestamp is synthetic test metadata, not a publication claim.
entry['publishedAt'] = 0
catalog = {'courses': [entry]}
target = workspace / 'artifacts' / 'nobel07-real-ui' / 'catalog'
def assert_owned_path(path):
    assert path.is_relative_to(workspace)
    current = workspace
    for part in path.relative_to(workspace).parts:
        current = current / part
        assert not current.is_symlink(), 'Refuse symlink in isolated catalog path'
    assert path.resolve().is_relative_to(workspace)
assert_owned_path(target)
target.mkdir(parents=True, exist_ok=False)
assert_owned_path(target)
catalog_bytes = (json.dumps(catalog, ensure_ascii=False, indent=2) + '\n').encode()
with (target / 'published-courses.json').open('xb') as output:
    output.write(catalog_bytes)
proof = {'courseId': cid, 'classroomSHA256': hashlib.sha256(raw).hexdigest(), 'entrySHA256': hashlib.sha256(entry_bytes).hexdigest(), 'catalogSHA256': hashlib.sha256(catalog_bytes).hexdigest(), 'publishedAtIsSynthetic': True, 'productionTouched': False, 'published': False, 'containerCatalogPath': '/qa-catalog/published-courses.json', 'requiredEnvironmentName': 'LEARNER_PUBLISHED_COURSES_PATH'}
(target / 'proof.json').write_text(json.dumps(proof, indent=2) + '\n')
print(json.dumps(proof))
