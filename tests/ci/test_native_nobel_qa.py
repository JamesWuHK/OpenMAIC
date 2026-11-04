import importlib.util
from pathlib import Path
import unittest
import zipfile
import json
import os
import tempfile
from unittest.mock import patch

path = Path(__file__).resolve().parents[2] / 'scripts/qa/native-nobel-qa.py'
spec = importlib.util.spec_from_file_location('qa', path)
qa = importlib.util.module_from_spec(spec)
spec.loader.exec_module(qa)


class NativeQAInputs(unittest.TestCase):
    def test_git_request_is_explicit_and_cannot_supply_any_provider_secret(self):
        request = {'nonce': 'c' * 32, 'image_run_id': '123', 'image_source': 'a' * 40,
                   'relay_url': 'https://8.8.8.8:8787/v1', 'relay_ca_base64': 'public-CA-placeholder',
                   'device': 'desktop', 'courses': '01', 'checks': 'core-matrix'}
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'request.json'
            env = Path(directory) / 'env'
            path.write_text(json.dumps(request))
            settings = {'GITHUB_EVENT_NAME': 'push', 'GITHUB_REF': 'refs/heads/codex/nobel-runner-recovery-20261104',
                        'GITHUB_ENV': str(env)}
            with patch.dict(os.environ, settings), patch.object(qa.owned, 'command', return_value='.github/workflows/nobel-native-request.json'):
                qa.git_request(path)
                self.assertIn('CANDIDATE_SOURCE_SHA=' + request['image_source'], env.read_text())
                env.unlink()
                path.write_text(json.dumps(dict(request, OPENROUTER_API_KEY='not-permitted')))
                with self.assertRaisesRegex(ValueError, 'schema'):
                    qa.git_request(path)
                self.assertFalse(env.exists())
            with patch.dict(os.environ, settings), patch.object(qa.owned, 'command', return_value='docs/unrelated.md'):
                with self.assertRaisesRegex(RuntimeError, 'No explicit new QA request'):
                    qa.git_request(path)

    def test_fixture_acceptance_is_required_and_is_not_native_or_publication_approval(self):
        proof = {'source': 'a' * 40, 'image': 'sha256:' + 'b' * 64,
                 'fixtureRegressionPassed': True, 'nativeDiscussionAccepted': False, 'published': False}
        qa.validate_acceptance(proof, proof['source'], proof['image'])
        for key, invalid in [('source', 'c' * 40), ('image', 'sha256:' + 'd' * 64),
                             ('fixtureRegressionPassed', False), ('nativeDiscussionAccepted', True),
                             ('published', True), ('fixtureRegressionPassed', 'true')]:
            with self.subTest(key=key), self.assertRaises(RuntimeError):
                qa.validate_acceptance(dict(proof, **{key: invalid}), proof['source'], proof['image'])

    def test_relay_transport_is_fixed_public_https(self):
        value = 'https://8.8.8.8:8787/v1'
        self.assertEqual(qa.relay_url(value), value)
        for value in ['http://8.8.8.8:8787/v1', 'https://127.0.0.1:8787/v1',
                      'https://169.254.169.254:8787/v1', 'https://8.8.8.8:443/v1',
                      'https://user:pass@8.8.8.8:8787/v1', 'https://8.8.8.8:8787/v1?model=paid']:
            with self.subTest(value=value), self.assertRaises(ValueError):
                qa.relay_url(value)

    def test_transport_bundle_retains_exact_six_frozen_classroom_hashes(self):
        bundle = qa.ROOT / 'tests/fixtures/nobel-native-discussion/payload.zip'
        self.assertEqual(qa.digest(bundle), qa.BUNDLE_SHA)
        with zipfile.ZipFile(bundle) as archive:
            manifest = json.loads(archive.read('manifest.json'))
            self.assertEqual(len(manifest['courses']), 6)
            self.assertEqual(len(archive.namelist()), 9)
            for course in manifest['courses']:
                data = archive.read('classrooms/' + course['id'] + '.json')
                self.assertEqual(qa.hashlib.sha256(data).hexdigest(), course['sha256'])
                classroom = json.loads(data)
                self.assertEqual(classroom['id'], course['id'])
                self.assertEqual(sorted(a['role'] for a in classroom['stage']['generatedAgentConfigs']),
                                 ['assistant', 'student', 'teacher'])
                self.assertEqual(sum(a['type'] == 'discussion' for s in classroom['scenes'] for a in s['actions']), 1)
                if course['id'] == 'hk-nobel-01-kagan-discussion-v1':
                    boundary = (qa.ROOT / 'docs/curriculum/nobel-handedness-boundary-2026-11-04.md').read_text().strip()
                    for agent in classroom['stage']['generatedAgentConfigs']:
                        self.assertTrue(agent['persona'].endswith('\n' + boundary))
                        agent['persona'] = agent['persona'][:-len('\n' + boundary)]
                    original = (json.dumps(classroom, ensure_ascii=False, indent=2) + '\n').encode()
                    self.assertEqual(qa.hashlib.sha256(original).hexdigest(),
                                     'd24332a7710b67c9cf01feb4d4dd907d55e302428b97854b8f409b6dfb1d4220')


if __name__ == '__main__':
    unittest.main()
