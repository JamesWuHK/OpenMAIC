import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
import subprocess
from unittest.mock import patch

path = Path(__file__).resolve().parents[2] / 'scripts/qa/hk-free-relay.py'
spec = importlib.util.spec_from_file_location('relay', path)
relay = importlib.util.module_from_spec(spec)
spec.loader.exec_module(relay)


class ScopedHostRelay(unittest.TestCase):
    def setUp(self):
        self.state = {'run': 'a' * 32, 'sourceSHA256': 'b' * 64,
                      'cid': 'c' * 64, 'image': 'sha256:' + 'd' * 64, 'phase': 'prepared'}
        self.actual = {'Id': self.state['cid'], 'Image': self.state['image'],
                       'Name': '/wanli-nobel-relay-' + self.state['run'], 'Config': {'Labels': {
                         'wanli.qa.owner': 'nobel-free-relay', 'wanli.qa.run': self.state['run'],
                         'wanli.qa.source': self.state['sourceSHA256']}}}

    def test_only_exact_container_receipt_is_owned(self):
        self.assertTrue(relay.owned(self.actual, self.state))
        for key in ['Id', 'Image', 'Name']:
            self.assertFalse(relay.owned(dict(self.actual, **{key: 'changed'}), self.state))
        changed = dict(self.actual, Config={'Labels': {}})
        self.assertFalse(relay.owned(changed, self.state))

    def test_low_memory_starts_nothing(self):
        with tempfile.TemporaryDirectory() as directory:
            with patch.object(relay, 'checked_root', return_value=(Path(directory), self.state)), \
                    patch.object(relay, 'memory_mib', return_value=383), \
                    patch.object(relay, 'run') as run:
                with self.assertRaisesRegex(RuntimeError, 'headroom'):
                    relay.start(directory)
                run.assert_not_called()

    def test_cleanup_refuses_a_changed_container(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'container.cid').write_text(self.state['cid'])
            with patch.object(relay, 'checked_root', return_value=(root, self.state)), \
                    patch.object(relay, 'inspect', return_value=dict(self.actual, Image='changed')), \
                    patch.object(relay, 'run') as run:
                with self.assertRaisesRegex(RuntimeError, 'mismatched'):
                    relay.close(directory)
                run.assert_not_called()

    def test_duplicate_start_never_removes_an_existing_relay(self):
        with tempfile.TemporaryDirectory() as directory:
            existing = dict(self.state, phase='ready')
            with patch.object(relay, 'checked_root', return_value=(Path(directory), existing)), \
                    patch.object(relay, 'close') as close:
                with self.assertRaisesRegex(RuntimeError, 'already started'):
                    relay.start(directory)
                close.assert_not_called()

    def test_postlaunch_guard_failure_rolls_back_own_attempt(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            with patch.object(relay, 'checked_root', return_value=(root, self.state)), \
                    patch.object(relay, '_start', side_effect=RuntimeError('Guardian startup failed')), \
                    patch.object(relay, '_close') as close:
                with self.assertRaisesRegex(RuntimeError, 'Guardian'):
                    relay.start(directory)
                close.assert_called_once_with(directory)

    def test_diagnostic_write_failure_does_not_skip_owned_cleanup(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            save = relay.save
            def fail_diagnostic(root, name, value):
                if name == 'startup-failed.json':
                    raise OSError('diagnostic disk error')
                save(root, name, value)
            with patch.object(relay, 'checked_root', return_value=(root, self.state)), \
                    patch.object(relay, '_start', side_effect=RuntimeError('startup failed')), \
                    patch.object(relay, 'save', side_effect=fail_diagnostic), \
                    patch.object(relay, '_close') as close:
                with self.assertRaisesRegex(RuntimeError, 'startup failed'):
                    relay.start(directory)
                close.assert_called_once_with(directory)

    def test_competing_start_cannot_acquire_or_clean_up_winner(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            with relay.task_lock(root), \
                    patch.object(relay, 'checked_root', return_value=(root, self.state)), \
                    patch.object(relay, '_start') as start, \
                    patch.object(relay, '_close') as close:
                with self.assertRaisesRegex(RuntimeError, 'already running'):
                    relay.start(directory)
                start.assert_not_called()
                close.assert_not_called()

    def test_guard_failure_stops_its_verified_relay(self):
        with tempfile.TemporaryDirectory() as directory:
            state = dict(self.state, startedAt=relay.time.time())
            actual = dict(self.actual, State={'Running': True})
            with patch.object(relay, 'checked_root', return_value=(Path(directory), state)), \
                    patch.object(relay, 'inspect', return_value=actual), \
                    patch.object(relay, 'memory_mib', side_effect=OSError('read failed')), \
                    patch.object(relay, 'stop_known_proxy') as stop:
                with self.assertRaises(OSError):
                    relay.guard(directory)
                stop.assert_called_once_with(state)

    def test_pid_reuse_prevents_fallback_signal(self):
        state = dict(self.state, processId=1234, processStart='original')
        identity = {'start': 'reused', 'args': [b'/qa/free-proxy.mjs'], 'cgroup': state['cid']}
        with patch.object(relay, 'inspect', side_effect=RuntimeError('daemon unavailable')), \
                patch.object(relay, 'process_identity', return_value=identity), \
                patch.object(relay.os, 'kill') as kill:
            with self.assertRaisesRegex(RuntimeError, 'Unable to stop'):
                relay.stop_known_proxy(state)
            kill.assert_not_called()

    def test_prepare_failure_removes_only_new_private_material(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            def failing(control, source, created):
                created['root'] = root
                (root / 'token.txt').write_text('private')
                (root / 'key.pem').write_text('private')
                (root / 'cert.pem').write_text('public')
                raise RuntimeError('openssl failed')
            with patch.object(relay, '_prepare', side_effect=failing):
                with self.assertRaisesRegex(RuntimeError, 'openssl'):
                    relay.prepare('control', 'source')
            self.assertFalse((root / 'token.txt').exists())
            self.assertFalse((root / 'key.pem').exists())
            self.assertEqual((root / 'cert.pem').read_text(), 'public')

    def test_operation_lock_rejects_symlink(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            target = root / 'untouched'
            target.write_text('retain')
            (root / '.operation.lock').symlink_to(target)
            with self.assertRaises(OSError):
                with relay.task_lock(root):
                    self.fail('symlink lock accepted')
            self.assertEqual(target.read_text(), 'retain')

    def test_missing_container_inspection_accepts_docker_lowercase_error(self):
        result = subprocess.CompletedProcess(['docker'], 1, '', 'error: no such object: ' + self.state['cid'])
        with patch.object(relay.subprocess, 'run', return_value=result):
            self.assertIsNone(relay.inspect(self.state['cid']))
        result.stderr = 'Cannot connect to the Docker daemon'
        with patch.object(relay.subprocess, 'run', return_value=result):
            with self.assertRaisesRegex(RuntimeError, 'unavailable'):
                relay.inspect(self.state['cid'])

    def test_production_port_environment_cannot_redirect_the_relay_listener(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            state = dict(self.state, certificateBase64='public-certificate')
            for name in ['token.txt', 'key.pem']:
                (root / name).write_text('test-only')
            production = dict(self.actual, State={'Running': True, 'StartedAt': 'baseline'}, RestartCount=0,
                              Config={'Env': ['PORT=3000', 'OPENROUTER_API_KEY=synthetic-test-only']})
            captured = {}
            def run(*args):
                if args[:2] == ('docker', 'run'):
                    captured.update(row.split('=', 1) for row in (root / 'relay.env').read_text().splitlines())
                    raise RuntimeError('test stop before any real container creation')
            with patch.object(relay, 'checked_root', return_value=(root, state)), \
                    patch.object(relay, 'memory_mib', return_value=512), \
                    patch.object(relay, 'inspect', return_value=production), \
                    patch.object(relay, 'run', side_effect=run):
                with self.assertRaisesRegex(RuntimeError, 'test stop'):
                    relay._start(directory)
            self.assertEqual(captured['PORT'], '8787')
            self.assertFalse((root / 'relay.env').exists())


if __name__ == '__main__':
    unittest.main()
