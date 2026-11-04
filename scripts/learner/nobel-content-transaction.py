"""Narrow metadata transaction primitives; no CLI publication or Docker authority.

The release caller must separately pass image, audio/browser and independent
content gates. Shared Caddy configuration is never read or written here.
"""
from pathlib import Path
import fcntl
import hashlib
import importlib.util
import json
import os
import secrets
import stat

spec = importlib.util.spec_from_file_location('merge', Path(__file__).with_name('nobel-catalog-merge.py'))
merge = importlib.util.module_from_spec(spec)
spec.loader.exec_module(merge)
NAMES = ('published-courses.json', 'site-content.json')


class MetadataReplaceError(RuntimeError):
    def __init__(self, message, replaced):
        super().__init__(message)
        self.replaced = replaced


def sha(value):
    return hashlib.sha256(value).hexdigest()


def encoded(value):
    return (json.dumps(value, ensure_ascii=False, indent=2) + '\n').encode()


def compare_replace(path, before, after):
    """Reject observed concurrent changes; never restore a stale whole snapshot.

    The task lock coordinates this publisher. Other publishers must respect the
    same lock to exclude the final comparison/rename race. Otherwise a detected
    change stops release and requires a fresh plan; no exclusion is claimed.
    """
    info = path.lstat()
    if not stat.S_ISREG(info.st_mode):
        raise RuntimeError('Metadata must be a regular file')
    temporary = path.with_name('.' + path.name + '.nobel-' + secrets.token_hex(12))
    fd = os.open(temporary, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW,
                 stat.S_IMODE(info.st_mode))
    replaced = False
    try:
        with os.fdopen(fd, 'wb') as file:
            file.write(after)
            file.flush()
            os.fsync(file.fileno())
        current = path.lstat()
        if ((current.st_dev, current.st_ino) != (info.st_dev, info.st_ino) or path.read_bytes() != before):
            raise RuntimeError('Concurrent metadata change: ' + path.name)
        os.replace(temporary, path)
        replaced = True
        directory = os.open(path.parent, os.O_RDONLY | os.O_DIRECTORY)
        try:
            os.fsync(directory)
        finally:
            os.close(directory)
        if path.read_bytes() != after:
            raise RuntimeError('Metadata changed after replacement: ' + path.name)
    except BaseException as error:
        raise MetadataReplaceError(str(error), replaced) from error
    finally:
        temporary.unlink(missing_ok=True)


def plan(content):
    before = {name: (content / name).read_bytes() for name in NAMES}
    catalog, site = merge.merge_catalogs(json.loads(before[NAMES[0]]), json.loads(before[NAMES[1]]),
                                         merge.APPROVED_MAPPING)
    after = dict(zip(NAMES, map(encoded, [catalog, site])))
    return {'before': before, 'after': after,
            'beforeSHA256': {name: sha(data) for name, data in before.items()},
            'afterSHA256': {name: sha(data) for name, data in after.items()}}


def rollback_data(path, before, proposed):
    current = path.read_bytes()
    if current == before:
        return None
    if current == proposed:
        return current, before
    # Preserve unrelated concurrent additions/edits rather than restoring a stale
    # whole catalog. Reject changes to any of the six affected entries themselves.
    live = json.loads(current)
    expected = json.loads(proposed)
    original = json.loads(before)
    if path.name == NAMES[0]:
        original_ids = [row['id'] for row in original['courses']]
    else:
        original_ids = [id for row in original['series'] for id in row.get('liveCourseIds', [])]
    # Some editions may already have been published before this transaction.
    reverse = {new: old for old, new in merge.APPROVED_MAPPING.items() if old in original_ids}
    if not reverse:
        return None
    if path.name == NAMES[0]:
        current_ids = [row['id'] for row in live['courses']]
        if any(old in current_ids for old in reverse.values()):
            raise RuntimeError('Rollback destination collision; reconciliation required')
        for new in reverse:
            entries = [row for row in live['courses'] if row['id'] == new]
            approved = [row for row in expected['courses'] if row['id'] == new]
            if len(entries) != 1 or entries != approved:
                raise RuntimeError('Affected classroom changed; rollback requires reconciliation')
        for row in live['courses']:
            row['id'] = reverse.get(row['id'], row['id'])
    else:
        series = [row for row in live['series'] if row.get('slug') == merge.APPROVED_SERIES]
        if len(series) != 1:
            raise RuntimeError('Affected series changed; rollback requires reconciliation')
        all_ids = [id for row in live['series'] for id in row.get('liveCourseIds', [])]
        if any(old in all_ids for old in reverse.values()):
            raise RuntimeError('Rollback destination collision; reconciliation required')
        if any(all_ids.count(new) != 1 or series[0].get('liveCourseIds', []).count(new) != 1 for new in reverse):
            raise RuntimeError('Affected series membership changed; rollback requires reconciliation')
        series[0]['liveCourseIds'] = [reverse.get(id, id) for id in series[0]['liveCourseIds']]
    return current, encoded(live)


def rollback_one(path, before, proposed):
    change = rollback_data(path, before, proposed)
    if change:
        compare_replace(path, *change)


def apply_metadata(content, approved_plan, verify):
    """Caller-owned release gate and verify callback are mandatory, not inferred.

    `approved_plan` must be reviewed against a fresh live snapshot. A separate
    image deployment cannot be rolled back by this content-only primitive.
    """
    lock = content / '.wanli-nobel-publication.lock'
    fd = os.open(lock, os.O_WRONLY | os.O_CREAT | os.O_NOFOLLOW, 0o600)
    with os.fdopen(fd, 'w') as file:
        fcntl.flock(file, fcntl.LOCK_EX | fcntl.LOCK_NB)
        fresh = plan(content)
        if fresh != approved_plan:
            raise RuntimeError('Publication plan is stale; preserve live changes and replan')
        attempted = []
        try:
            # Both old and new links remain resolvable after catalog-first reveal.
            for name in NAMES:
                try:
                    compare_replace(content / name, fresh['before'][name], fresh['after'][name])
                except MetadataReplaceError as error:
                    if error.replaced:
                        attempted.append(name)
                    raise
                attempted.append(name)
            verify()
        except BaseException as error:
            problems = []
            rollback = []
            # Inspect all destinations before changing either dependent surface.
            # A known catalog collision must not leave restored site links dangling.
            try:
                for name in reversed(attempted):
                    change = rollback_data(content / name, fresh['before'][name], fresh['after'][name])
                    if change:
                        rollback.append((name, change))
                planned = dict(rollback)
                if NAMES[0] in planned:
                    current_catalog, restored_catalog = map(json.loads, planned[NAMES[0]])
                    retained = {row['id'] for row in restored_catalog['courses']}
                    retired = {row['id'] for row in current_catalog['courses']} - retained
                    # A rejected site CAS grants no authority to restore that file,
                    # but its surviving references still constrain catalog rollback.
                    site = json.loads(planned[NAMES[1]][1] if NAMES[1] in planned else
                                      (content / NAMES[1]).read_bytes())
                    references = {id for row in site['series'] for id in row.get('liveCourseIds', [])}
                    if references & retired:
                        raise RuntimeError('Surviving site references prevent catalog retirement')
            except Exception as failure:
                raise RuntimeError('Publication failed; rollback needs reconciliation: ' + str(failure)) from error
            # Hide series entries before retiring new publication catalog entries.
            for name, change in rollback:
                try:
                    compare_replace(content / name, *change)
                except Exception as failure:
                    problems.append(name + ': ' + str(failure))
                    # Never retire catalog IDs while surviving site links use them.
                    break
            if problems:
                raise RuntimeError('Publication failed; rollback needs reconciliation: ' + '; '.join(problems)) from error
            raise
    return {'publishedMetadata': True, 'afterSHA256': fresh['afterSHA256'], 'caddyChanged': False}
