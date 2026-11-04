"""Plan only: preserve live catalog additions while switching six approved IDs.

No production I/O or publishing side effects. The caller must separately verify
the six immutable classroom hashes and all runtime release gates.
"""
import copy

APPROVED_SERIES = 'nobel-curiosity-lab'
APPROVED_SERIES_TITLE = '諾獎好奇心實驗室'

APPROVED_MAPPING = {
    'hk-nobel-01-kagan-lecture-v4': 'hk-nobel-01-kagan-discussion-v1',
    'hk-nobel-02-soai-lecture-v4': 'hk-nobel-02-soai-discussion-v1',
    'hk-nobel-03-halzen-lecture-v3': 'hk-nobel-03-halzen-discussion-v1',
    'hk-nobel-04-deisseroth-lecture-v2': 'hk-nobel-04-deisseroth-discussion-v1',
    'hk-nobel-05-hegemann-lecture-v1': 'hk-nobel-05-hegemann-discussion-v1',
    'hk-nobel-06-nagel-lecture-v1': 'hk-nobel-06-nagel-discussion-v1',
}


def merge_catalogs(catalog, site, mapping):
    if mapping != APPROVED_MAPPING:
        raise ValueError('Mapping differs from the six approved editions')
    result_catalog, result_site = copy.deepcopy(catalog), copy.deepcopy(site)
    ids = [course['id'] for course in catalog['courses']]
    if len(ids) != len(set(ids)):
        raise ValueError('Duplicate published classroom ID')
    for old, new in mapping.items():
        if ids.count(old) + ids.count(new) != 1:
            raise ValueError('Live course was removed or changed version: ' + old)
    for course in result_catalog['courses']:
        if course['id'] in mapping or course['id'] in mapping.values():
            if course.get('series') != APPROVED_SERIES_TITLE:
                raise ValueError('Course moved out of the approved series')
        course['id'] = mapping.get(course['id'], course['id'])

    approved_series = [series for series in site['series'] if series.get('slug') == APPROVED_SERIES]
    if len(approved_series) != 1:
        raise ValueError('Expected exactly one approved series')
    approved_ids = approved_series[0].get('liveCourseIds', [])
    site_ids = [id for series in site['series'] for id in series.get('liveCourseIds', [])]
    for old, new in mapping.items():
        if site_ids.count(old) + site_ids.count(new) != 1:
            raise ValueError('Live series membership changed: ' + old)
        if approved_ids.count(old) + approved_ids.count(new) != 1:
            raise ValueError('Course moved out of the approved series: ' + old)
    for series in result_site['series']:
        if 'liveCourseIds' in series:
            series['liveCourseIds'] = [mapping.get(id, id) for id in series['liveCourseIds']]
    return result_catalog, result_site
