import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

path = Path(__file__).resolve().parents[2] / 'scripts/qa/hk-relay-firewall.py'
spec = importlib.util.spec_from_file_location('firewall', path)
firewall = importlib.util.module_from_spec(spec)
spec.loader.exec_module(firewall)


class RunnerOnlyFirewall(unittest.TestCase):
    def setUp(self):
        self.sha = 'a' * 40
        self.image = 'b' * 40
        self.handshake = {'workflowSource': self.sha, 'imageSource': self.image,
                          'qaRun': '123', 'qaAttempt': '1', 'qaJob': 'native_qa',
                          'runnerIPv4': '20.1.2.3', 'ephemeralPublicRunner': True, 'published': False}
        self.rule = {'fromPort': 8787, 'toPort': 8787, 'protocol': 'tcp',
                     'cidrs': ['20.1.2.3/32'], 'ipv6Cidrs': [], 'cidrListAliases': []}
        self.https = {'fromPort': 443, 'toPort': 443, 'protocol': 'tcp', 'state': 'open',
                      'cidrs': ['0.0.0.0/0'], 'ipv6Cidrs': ['::/0'], 'cidrListAliases': []}
        self.run = {'head_sha': self.sha, 'status': 'in_progress', 'head_repository': {'full_name': firewall.REPO},
                    'path': '.github/workflows/learner-cloud-image.yml', 'run_attempt': 1}
        self.jobs = {'jobs': [{'name': 'native_qa', 'status': 'in_progress', 'labels': ['ubuntu-24.04']}]}

    def test_only_exact_runner_rule_is_opened_and_other_ports_preserved(self):
        with tempfile.TemporaryDirectory() as directory:
            handshake = Path(directory) / 'handshake.json'
            handshake.write_text(json.dumps(self.handshake))
            with patch.object(firewall, 'command', side_effect=[self.run, self.jobs]), \
                    patch.object(firewall, 'download_handshake', return_value=(self.handshake, {'run': '123'})), \
                    patch.object(firewall, 'rules', side_effect=[[self.https], [self.https, dict(self.rule, state='open')]]), \
                    patch.object(firewall, 'aws') as aws:
                firewall.open_rule(directory, '123', self.sha, self.image)
            aws.assert_called_once()
            args = aws.call_args.args
            self.assertEqual(args[0], 'open-instance-public-ports')
            self.assertEqual(json.loads(args[2]), self.rule)

    def test_preexisting_relay_port_is_not_merged_replaced_or_closed(self):
        with tempfile.TemporaryDirectory() as directory:
            handshake = Path(directory) / 'handshake.json'
            handshake.write_text(json.dumps(self.handshake))
            with patch.object(firewall, 'command', side_effect=[self.run, self.jobs]), \
                    patch.object(firewall, 'download_handshake', return_value=(self.handshake, {'run': '123'})), \
                    patch.object(firewall, 'rules', return_value=[dict(self.rule, state='open')]), \
                    patch.object(firewall, 'aws') as aws:
                with self.assertRaisesRegex(RuntimeError, 'already has an owner'):
                    firewall.open_rule(directory, '123', self.sha, self.image)
            aws.assert_not_called()

    def test_close_sends_only_owned_cidr_and_keeps_unrelated_rules(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'receipt.json'
            path.write_text(json.dumps({'rule': self.rule}))
            with patch.object(firewall, 'aws') as aws, \
                    patch.object(firewall, 'rules', return_value=[self.https]):
                firewall.close(path)
            self.assertEqual(json.loads(aws.call_args.args[2]), self.rule)
            self.assertTrue(path.with_suffix('.closed.json').exists())

    def test_wrong_workflow_handshake_has_no_cloud_side_effect(self):
        with tempfile.TemporaryDirectory() as directory:
            handshake = Path(directory) / 'handshake.json'
            handshake.write_text(json.dumps(dict(self.handshake, workflowSource='c' * 40)))
            with patch.object(firewall, 'command', return_value=self.run), \
                    patch.object(firewall, 'download_handshake', return_value=(dict(self.handshake, qaRun='999'), {})), \
                    patch.object(firewall, 'aws') as aws:
                with self.assertRaisesRegex(RuntimeError, 'identity mismatch'):
                    firewall.open_rule(directory, '123', self.sha, self.image)
            aws.assert_not_called()

    def test_artifact_from_another_run_is_rejected_before_download(self):
        artifact = {'id': 99, 'name': 'nobel-qa-handshake-123-1', 'expired': False,
                    'workflow_run': {'id': 999, 'head_sha': self.sha}}
        with patch.object(firewall, 'command', return_value={'artifacts': [artifact]}), \
                patch.object(firewall.subprocess, 'run') as download:
            with self.assertRaisesRegex(RuntimeError, 'provenance mismatch'):
                firewall.download_handshake('123', 1, self.sha)
            download.assert_not_called()

    def test_existing_selfrunner_is_verified_by_name_and_all_labels(self):
        handshake = dict(self.handshake, ephemeralPublicRunner=False,
                         runnerKind='self-hosted', runnerName='openmaic-cloud-linux')
        labels = ['self-hosted', 'Linux', 'X64', 'openmaic', 'cloud-ci']
        for name, actual_labels, allowed in [('openmaic-cloud-linux', labels, True),
                                            ('another-machine', labels, False),
                                            ('openmaic-cloud-linux', labels[:-1], False)]:
            jobs = {'jobs': [{'name': 'native_qa', 'status': 'in_progress',
                              'labels': actual_labels, 'runner_name': name}]}
            with self.subTest(name=name, labels=actual_labels), tempfile.TemporaryDirectory() as directory:
                with patch.object(firewall, 'command', side_effect=[self.run, jobs]), \
                        patch.object(firewall, 'download_handshake', return_value=(handshake, {})), \
                        patch.object(firewall, 'rules', side_effect=[[self.https], [self.https, dict(self.rule, state='open')]]), \
                        patch.object(firewall, 'aws') as aws:
                    if allowed:
                        firewall.open_rule(directory, '123', self.sha, self.image)
                        aws.assert_called_once()
                    else:
                        with self.assertRaisesRegex(RuntimeError, 'runner does not match'):
                            firewall.open_rule(directory, '123', self.sha, self.image)
                        aws.assert_not_called()

    def test_selfrunner_cannot_claim_to_be_an_ephemeral_public_runner(self):
        jobs = {'jobs': [{'name': 'native_qa', 'status': 'in_progress',
                          'labels': ['self-hosted', 'ubuntu-24.04'], 'runner_name': 'openmaic-cloud-linux'}]}
        with tempfile.TemporaryDirectory() as directory:
            with patch.object(firewall, 'command', side_effect=[self.run, jobs]), \
                    patch.object(firewall, 'download_handshake', return_value=(self.handshake, {})), \
                    patch.object(firewall, 'aws') as aws:
                with self.assertRaisesRegex(RuntimeError, 'runner does not match'):
                    firewall.open_rule(directory, '123', self.sha, self.image)
                aws.assert_not_called()


if __name__ == '__main__':
    unittest.main()
