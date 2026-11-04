import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

path = Path(__file__).resolve().parents[2] / 'scripts/learner/nobel-content-transaction.py'
spec = importlib.util.spec_from_file_location('transaction', path)
transaction = importlib.util.module_from_spec(spec)
spec.loader.exec_module(transaction)


class MetadataTransaction(unittest.TestCase):
    def files(self, root):
        mapping = transaction.merge.APPROVED_MAPPING
        catalog = {'courses': [{'id': id, 'series': transaction.merge.APPROVED_SERIES_TITLE,
                               'description': 'keep ' + id} for id in mapping]}
        site = {'hero': {'title': 'Keep title'}, 'series': [
            {'slug': transaction.merge.APPROVED_SERIES, 'liveCourseIds': list(mapping)}]}
        for name, data in zip(transaction.NAMES, [catalog, site]):
            (root / name).write_bytes(transaction.encoded(data))

    def test_stale_plan_cannot_overwrite_recent_new_course(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            self.files(root)
            plan = transaction.plan(root)
            path = root / transaction.NAMES[0]
            current = json.loads(path.read_bytes())
            current['courses'].append({'id': 'someone-elses-new-course'})
            path.write_bytes(transaction.encoded(current))
            with self.assertRaisesRegex(RuntimeError, 'stale'):
                transaction.apply_metadata(root, plan, lambda: self.fail('must not verify'))
            self.assertEqual(json.loads(path.read_bytes()), current)

    def test_verification_failure_restores_original_bytes(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            self.files(root)
            plan = transaction.plan(root)
            def verify():
                raise RuntimeError('real API check failed')
            with self.assertRaisesRegex(RuntimeError, 'API check failed'):
                transaction.apply_metadata(root, plan, verify)
            for name in transaction.NAMES:
                self.assertEqual((root / name).read_bytes(), plan['before'][name])

    def test_rollback_keeps_unrelated_edits_made_during_verification(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            self.files(root)
            plan = transaction.plan(root)
            def verify():
                path = root / transaction.NAMES[0]
                live = json.loads(path.read_bytes())
                live['courses'].append({'id': 'new-course', 'owner': 'another-publisher'})
                path.write_bytes(transaction.encoded(live))
                path = root / transaction.NAMES[1]
                live = json.loads(path.read_bytes())
                live['hero']['title'] = 'A concurrent new title'
                path.write_bytes(transaction.encoded(live))
                raise RuntimeError('real check failed')
            with self.assertRaisesRegex(RuntimeError, 'real check failed'):
                transaction.apply_metadata(root, plan, verify)
            catalog = json.loads((root / transaction.NAMES[0]).read_bytes())
            self.assertEqual(catalog['courses'][-1], {'id': 'new-course', 'owner': 'another-publisher'})
            self.assertEqual([x['id'] for x in catalog['courses'][:-1]], list(transaction.merge.APPROVED_MAPPING))
            site = json.loads((root / transaction.NAMES[1]).read_bytes())
            self.assertEqual(site['hero']['title'], 'A concurrent new title')
            self.assertEqual(site['series'][0]['liveCourseIds'], list(transaction.merge.APPROVED_MAPPING))

    def test_rollback_refuses_to_clobber_affected_course_edit(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            self.files(root)
            plan = transaction.plan(root)
            def verify():
                path = root / transaction.NAMES[0]
                live = json.loads(path.read_bytes())
                live['courses'][0]['description'] = 'A concurrent affected edit'
                path.write_bytes(transaction.encoded(live))
                raise RuntimeError('real check failed')
            with self.assertRaisesRegex(RuntimeError, 'reconciliation'):
                transaction.apply_metadata(root, plan, verify)
            current = json.loads((root / transaction.NAMES[0]).read_bytes())
            self.assertEqual(current['courses'][0]['description'], 'A concurrent affected edit')

    def test_rollback_preserves_editions_already_new_before_this_transaction(self):
        for migrated in [1, 6]:
            with self.subTest(migrated=migrated), tempfile.TemporaryDirectory() as directory:
                root = Path(directory)
                self.files(root)
                mapping = dict(list(transaction.merge.APPROVED_MAPPING.items())[:migrated])
                catalog = json.loads((root / transaction.NAMES[0]).read_bytes())
                site = json.loads((root / transaction.NAMES[1]).read_bytes())
                for row in catalog['courses']:
                    row['id'] = mapping.get(row['id'], row['id'])
                site['series'][0]['liveCourseIds'] = [mapping.get(id, id) for id in site['series'][0]['liveCourseIds']]
                (root / transaction.NAMES[0]).write_bytes(transaction.encoded(catalog))
                (root / transaction.NAMES[1]).write_bytes(transaction.encoded(site))
                plan = transaction.plan(root)
                def verify():
                    for name in transaction.NAMES:
                        path = root / name
                        data = json.loads(path.read_bytes())
                        data['unrelatedConcurrentField'] = True
                        path.write_bytes(transaction.encoded(data))
                    raise RuntimeError('verification failed')
                with self.assertRaisesRegex(RuntimeError, 'verification failed'):
                    transaction.apply_metadata(root, plan, verify)
                actual = json.loads((root / transaction.NAMES[0]).read_bytes())
                self.assertEqual(actual['courses'], catalog['courses'])
                actual_site = json.loads((root / transaction.NAMES[1]).read_bytes())
                self.assertEqual(actual_site['series'], site['series'])

    def test_failed_site_rollback_does_not_retire_referenced_catalog_ids(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            self.files(root)
            plan = transaction.plan(root)
            def verify():
                path = root / transaction.NAMES[1]
                live = json.loads(path.read_bytes())
                live['series'][0]['liveCourseIds'].pop(0)
                path.write_bytes(transaction.encoded(live))
                raise RuntimeError('verification failed')
            with self.assertRaisesRegex(RuntimeError, 'reconciliation'):
                transaction.apply_metadata(root, plan, verify)
            catalog = json.loads((root / transaction.NAMES[0]).read_bytes())
            self.assertEqual([row['id'] for row in catalog['courses']], list(transaction.merge.APPROVED_MAPPING.values()))

    def test_concurrent_old_id_collision_blocks_both_rollback_writes(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            self.files(root)
            plan = transaction.plan(root)
            old = next(iter(transaction.merge.APPROVED_MAPPING))
            def verify():
                path = root / transaction.NAMES[0]
                live = json.loads(path.read_bytes())
                live['courses'].append({'id': old, 'owner': 'concurrent'})
                path.write_bytes(transaction.encoded(live))
                raise RuntimeError('verification failed')
            with self.assertRaisesRegex(RuntimeError, 'collision'):
                transaction.apply_metadata(root, plan, verify)
            catalog = json.loads((root / transaction.NAMES[0]).read_bytes())
            ids = [row['id'] for row in catalog['courses']]
            self.assertEqual(len(ids), len(set(ids)))
            self.assertEqual((root / transaction.NAMES[1]).read_bytes(), plan['after'][transaction.NAMES[1]])

    def test_unclaimed_concurrent_site_references_prevent_catalog_retirement(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            self.files(root)
            plan = transaction.plan(root)
            replace = transaction.compare_replace
            def competing(path, before, after):
                if path.name == transaction.NAMES[1]:
                    concurrent = json.loads(after)
                    concurrent['anotherWriter'] = True
                    path.write_bytes(transaction.encoded(concurrent))
                return replace(path, before, after)
            with patch.object(transaction, 'compare_replace', side_effect=competing):
                with self.assertRaisesRegex(RuntimeError, 'Surviving site references'):
                    transaction.apply_metadata(root, plan, lambda: self.fail('CAS should fail first'))
            self.assertEqual((root / transaction.NAMES[0]).read_bytes(), plan['after'][transaction.NAMES[0]])
            site = json.loads((root / transaction.NAMES[1]).read_bytes())
            self.assertTrue(site['anotherWriter'])
            self.assertEqual(site['series'][0]['liveCourseIds'], list(transaction.merge.APPROVED_MAPPING.values()))


if __name__ == '__main__':
    unittest.main()
