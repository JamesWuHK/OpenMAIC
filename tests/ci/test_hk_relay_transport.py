import importlib.util
import json
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch

path = Path(__file__).resolve().parents[2] / 'scripts/qa/hk-relay-transport.py'
spec = importlib.util.spec_from_file_location('transport', path)
transport = importlib.util.module_from_spec(spec)
spec.loader.exec_module(transport)


class LostRelayReceipt(unittest.TestCase):
    def test_ambiguous_start_reconnects_and_closes_exact_task(self):
        with tempfile.TemporaryDirectory() as directory:
            state = {'run': 'a' * 32, 'root': '/var/tmp/wanli-nobel-relay-' + 'a' * 32,
                     'publicIP': '95.41.72.66'}
            (Path(directory) / 'state.json').write_text(json.dumps(state))
            commands = []
            def ssh(command, body=None, timeout=90):
                commands.append((command(state['publicIP']), timeout))
                if len(commands) == 1:
                    raise subprocess.TimeoutExpired('ssh', timeout)
                return state['publicIP'], json.dumps({'root': state['root'], 'phase': 'closed'})
            with patch.object(transport, 'ssh', side_effect=ssh):
                with self.assertRaisesRegex(RuntimeError, 'reconciled closed'):
                    transport.invoke('start', directory)
            self.assertEqual(len(commands), 2)
            self.assertTrue(commands[0][0].endswith('start ' + state['root']))
            self.assertTrue(commands[1][0].endswith('close ' + state['root']))
            self.assertEqual(commands[0][1], 300)
            self.assertFalse((Path(directory) / 'start-receipt.json').exists())

    def test_changed_server_address_is_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            state = {'run': 'a' * 32, 'root': '/var/tmp/wanli-nobel-relay-' + 'a' * 32,
                     'publicIP': '95.41.72.66'}
            (Path(directory) / 'state.json').write_text(json.dumps(state))
            with patch.object(transport, 'ssh', side_effect=lambda command, **kw: command('1.1.1.1')):
                with self.assertRaisesRegex(RuntimeError, 'address changed'):
                    transport.invoke('close', directory)


if __name__ == '__main__':
    unittest.main()
