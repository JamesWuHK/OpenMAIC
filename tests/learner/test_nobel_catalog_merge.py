import copy
import importlib.util
import pathlib
import unittest

path = pathlib.Path(__file__).resolve().parents[2] / 'scripts/learner/nobel-catalog-merge.py'
spec = importlib.util.spec_from_file_location('merge', path)
merge = importlib.util.module_from_spec(spec)
spec.loader.exec_module(merge)


class CatalogPreservation(unittest.TestCase):
    def setUp(self):
        self.mapping = merge.APPROVED_MAPPING
        self.extra = {'id': 'hk-nobel-07-new-course', 'description': 'Keep this new course',
                      'unknownMetadata': {'owner': 'another release'}}
        self.catalog = {'courses': [{'id': old, 'description': 'preserve ' + old, 'series': merge.APPROVED_SERIES_TITLE}
                                   for old in self.mapping] + [self.extra], 'revision': 'live'}
        self.site = {'series': [{'slug': merge.APPROVED_SERIES, 'liveCourseIds': list(self.mapping) + [self.extra['id']]},
                                {'slug': 'weather', 'liveCourseIds': ['hk-s04-01-radar-rain']}],
                     'hero': {'title': 'A recently updated title'}}

    def test_only_six_ids_change_and_recent_additions_survive(self):
        before = copy.deepcopy((self.catalog, self.site))
        catalog, site = merge.merge_catalogs(self.catalog, self.site, self.mapping)
        self.assertEqual((self.catalog, self.site), before, 'Plan must not mutate live input')
        self.assertEqual(catalog['courses'][-1], self.extra)
        self.assertEqual(len(catalog['courses']), 7)
        self.assertEqual(catalog['revision'], 'live')
        self.assertEqual(site['hero'], self.site['hero'])
        self.assertEqual(site['series'][1], self.site['series'][1])
        self.assertEqual(site['series'][0]['liveCourseIds'], list(self.mapping.values()) + [self.extra['id']])
        for old, new in self.mapping.items():
            self.assertEqual(next(c for c in catalog['courses'] if c['id'] == new)['description'],
                             'preserve ' + old)

    def test_plan_is_idempotent_after_success(self):
        catalog, site = merge.merge_catalogs(self.catalog, self.site, self.mapping)
        self.assertEqual(merge.merge_catalogs(catalog, site, self.mapping), (catalog, site))

    def test_changed_or_removed_live_version_is_not_overwritten(self):
        self.catalog['courses'][0]['id'] = 'hk-nobel-01-kagan-lecture-v99'
        with self.assertRaisesRegex(ValueError, 'changed version'):
            merge.merge_catalogs(self.catalog, self.site, self.mapping)

    def test_extra_mapping_or_duplicate_target_cannot_expand_release(self):
        changed = dict(self.mapping, unauthorized='other')
        with self.assertRaisesRegex(ValueError, 'approved editions'):
            merge.merge_catalogs(self.catalog, self.site, changed)
        self.catalog['courses'].append(copy.deepcopy(self.catalog['courses'][0]))
        with self.assertRaisesRegex(ValueError, 'Duplicate'):
            merge.merge_catalogs(self.catalog, self.site, self.mapping)

    def test_missing_series_member_is_not_silently_reintroduced(self):
        self.site['series'][0]['liveCourseIds'].pop(0)
        with self.assertRaisesRegex(ValueError, 'membership changed'):
            merge.merge_catalogs(self.catalog, self.site, self.mapping)

    def test_moved_series_member_or_catalog_ownership_fails(self):
        old = self.site['series'][0]['liveCourseIds'].pop(0)
        self.site['series'][1]['liveCourseIds'].append(old)
        with self.assertRaisesRegex(ValueError, 'approved series'):
            merge.merge_catalogs(self.catalog, self.site, self.mapping)
        self.site['series'][1]['liveCourseIds'].remove(old)
        self.site['series'][0]['liveCourseIds'].insert(0, old)
        self.catalog['courses'][0]['series'] = 'weather'
        with self.assertRaisesRegex(ValueError, 'approved series'):
            merge.merge_catalogs(self.catalog, self.site, self.mapping)


if __name__ == '__main__':
    unittest.main()
