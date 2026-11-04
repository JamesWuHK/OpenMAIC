import importlib.util
import json
import pathlib
import tempfile
import unittest
from unittest.mock import patch

SCRIPT = pathlib.Path(__file__).resolve().parents[2] / 'scripts/ci/nobel-resources.py'
spec = importlib.util.spec_from_file_location('resources', SCRIPT)
resources = importlib.util.module_from_spec(spec)
spec.loader.exec_module(resources)


class ResourceOwnership(unittest.TestCase):
    def setUp(self):
        self.expected = {'cid': 'a' * 64, 'name': 'nobel-123-1-app',
                         'image': 'sha256:' + 'b' * 64, 'run': '123-1', 'sha': 'c' * 40}
        self.actual = {'Id': self.expected['cid'], 'Name': '/' + self.expected['name'],
                       'Image': self.expected['image'], 'Config': {'Labels': {
                           'wanli.ci.owner': 'nobel-candidate', 'wanli.ci.run': '123-1',
                           'org.opencontainers.image.revision': 'c' * 40}}}

    def test_owned_container_matches(self):
        self.assertTrue(resources.owned(self.actual, self.expected))

    def test_never_clean_by_name_or_reused_tag(self):
        for key in ['Id', 'Name', 'Image']:
            with self.subTest(key=key):
                changed = dict(self.actual, **{key: 'different'})
                self.assertFalse(resources.owned(changed, self.expected))

    def test_all_ownership_labels_required(self):
        for label in self.actual['Config']['Labels']:
            with self.subTest(label=label):
                labels = dict(self.actual['Config']['Labels'])
                labels[label] = 'different'
                changed = dict(self.actual, Config={'Labels': labels})
                self.assertFalse(resources.owned(changed, self.expected))

    def test_capacity_rejects_memory_disk_and_inode_pressure(self):
        self.assertTrue(resources.enough(6 * 1024**3, 30 * 1024**3, 1100000))
        for args in [(4 * 1024**3, 30 * 1024**3, 1100000),
                     (int(5.5 * 1024**3), 30 * 1024**3, 1100000),
                     (6 * 1024**3, 19 * 1024**3, 1100000),
                     (6 * 1024**3, 30 * 1024**3, 999999)]:
            self.assertFalse(resources.enough(*args))

    def test_failed_start_without_cid_never_inspects_or_removes_name(self):
        with tempfile.TemporaryDirectory() as directory:
            task = pathlib.Path(directory)
            (task / 'app.json').write_text(json.dumps(self.expected))
            with patch.object(resources, 'checked_task', return_value=('123-1', 'c' * 40, task)), \
                    patch.object(resources, 'inspect') as inspect:
                self.assertIsNone(resources.resource('app'))
                inspect.assert_not_called()

    def test_actual_inspection_requires_exact_receipt(self):
        with tempfile.TemporaryDirectory() as directory:
            task = pathlib.Path(directory)
            (task / 'app.cid').write_text(self.expected['cid'])
            (task / 'app.json').write_text(json.dumps(self.expected))
            with patch.object(resources, 'checked_task', return_value=('123-1', 'c' * 40, task)), \
                    patch.object(resources, 'inspect', return_value=dict(self.actual, Image='changed')):
                with self.assertRaisesRegex(RuntimeError, 'ownership mismatch'):
                    resources.resource('app')

    def test_daemon_error_is_not_treated_as_absent_container(self):
        result = resources.subprocess.CompletedProcess([], 1, '', 'Cannot connect to Docker daemon')
        with patch.object(resources.subprocess, 'run', return_value=result):
            with self.assertRaisesRegex(RuntimeError, 'Cannot connect'):
                resources.inspect('a' * 64)


if __name__ == '__main__':
    unittest.main()
