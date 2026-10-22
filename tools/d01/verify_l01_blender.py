"""Reopen the actual D01-01 .blend files and exercise a reversible edit."""
import argparse
import hashlib
import json
from pathlib import Path
import sys

import bpy
from mathutils import Vector


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--assets', required=True)
    argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    return parser.parse_args(argv)


def inspect_model():
    collection = bpy.data.collections['01_Student_Model']
    result = {}
    for obj in collection.objects:
        coords = [tuple(round(float(v), 6) for v in vert.co) for vert in obj.data.vertices] if obj.type == 'MESH' else []
        result[obj.name] = {
            'type': obj.type,
            'location': [round(float(v), 6) for v in obj.location],
            'scale': [round(float(v), 6) for v in obj.scale],
            'rotation': [round(float(v), 6) for v in obj.rotation_euler],
            'meshHash': hashlib.sha256(json.dumps(coords).encode()).hexdigest(),
            'parent': obj.parent.name if obj.parent else None,
            'editable': obj.library is None and not obj.hide_select,
        }
    return result


def first_hit(target, viewer_direction):
    direction = Vector(viewer_direction).normalized()
    hit, location, normal, index, obj, matrix = bpy.context.scene.ray_cast(
        bpy.context.evaluated_depsgraph_get(), target + direction * 10, -direction, distance=12,
    )
    return obj.name if hit else None


def main():
    root = Path(parse_args().assets).resolve()
    repo = Path(__file__).resolve().parents[2]
    assert root.is_relative_to(repo / 'output' / 'd01-l01-blender')
    report_path = root / 'reopen-verification.json'
    assert not report_path.exists(), 'Verification report already exists; retain it.'
    report = {'blenderVersion': bpy.app.version_string, 'files': {}, 'scope': 'headless Blender reopening and scripted edit; not a human learner trial'}
    inventories = {}
    for variant in ['v00_starter', 'v01', 'v02']:
        path = root / ('D01_L01_' + variant + '.blend')
        before_hash = hashlib.sha256(path.read_bytes()).hexdigest()
        bpy.ops.wm.open_mainfile(filepath=str(path), load_ui=False, use_scripts=False)
        bpy.context.view_layer.update()
        inventory = inspect_model()
        inventories[variant] = inventory
        expected = {'Body', 'Base'} if variant == 'v00_starter' else {'Body', 'Base', 'EarL', 'EarR', 'EyeL', 'EyeR', 'PupilL', 'PupilR', 'Smile'}
        assert set(inventory) == expected
        assert all(obj['editable'] for obj in inventory.values())
        assert not list(bpy.data.libraries), 'No external linked assets permitted.'
        assert not list(bpy.data.texts), 'No embedded script required.'
        assert not bpy.context.scene.animation_data, 'No hidden scene drivers.'
        for obj in bpy.data.objects:
            assert not obj.animation_data, 'No hidden object drivers.'
        if variant != 'v00_starter':
            for suffix in ['L', 'R']:
                assert bpy.data.objects['Pupil' + suffix].parent == bpy.data.objects['Eye' + suffix]
            pupil = bpy.data.objects['PupilL'].matrix_world.translation.copy()
            ear = bpy.data.objects['EarL'].location.copy() + Vector((0, 0, 0.25))
            rays = {'eye': first_hit(pupil, (0, -1, 0)), 'ear': first_hit(ear, (1, 0, 0))}
            assert rays == ({'eye': 'Body', 'ear': 'EarR'} if variant == 'v01' else {'eye': 'PupilL', 'ear': 'EarL'}), rays
        else:
            rays = None
        assert hashlib.sha256(path.read_bytes()).hexdigest() == before_hash
        report['files'][path.name] = {'reopened': True, 'editableObjects': len(inventory), 'embeddedScripts': 0, 'externalLibraries': 0, 'sampleRays': rays, 'sourceHashUnchanged': True}

    changed = [name for name in inventories['v01'] if inventories['v01'][name] != inventories['v02'][name]]
    assert set(changed) == {'EarL', 'EyeL'}, changed
    for name in changed:
        before, after = inventories['v01'][name], inventories['v02'][name]
        assert before['location'][0] == after['location'][0]
        assert before['location'][2] == after['location'][2]
        for prop in ['meshHash', 'type', 'scale', 'rotation', 'parent']:
            assert before[prop] == after[prop], (name, prop)
    report['onlyLocalChanges'] = {name: {'before': inventories['v01'][name]['location'], 'after': inventories['v02'][name]['location']} for name in sorted(changed)}

    # Exercise an edit on a copy and verify persistence in a second open.
    eye = bpy.data.objects['EyeR']
    pupil = bpy.data.objects['PupilR']
    start_eye = eye.location.copy()
    start_pupil = pupil.matrix_world.translation.copy()
    eye.location.y -= 0.08
    bpy.context.view_layer.update()
    assert abs((pupil.matrix_world.translation - start_pupil).y + 0.08) < 1e-5
    roundtrip = root / 'QA_only_edit_roundtrip.blend'
    assert not roundtrip.exists()
    bpy.context.preferences.filepaths.save_version = 0
    bpy.ops.wm.save_as_mainfile(filepath=str(roundtrip), check_existing=False, compress=True)
    bpy.ops.wm.open_mainfile(filepath=str(roundtrip), load_ui=False, use_scripts=False)
    bpy.context.view_layer.update()
    assert abs(bpy.data.objects['EyeR'].location.y - (start_eye.y - 0.08)) < 1e-5
    # Restore only in memory; leave original teaching files untouched.
    bpy.data.objects['EyeR'].location = start_eye
    bpy.context.view_layer.update()
    assert (bpy.data.objects['PupilR'].matrix_world.translation - start_pupil).length < 1e-5
    report['editRoundtrip'] = {'movedObject': 'EyeR', 'deltaY': -0.08, 'childFollowed': True, 'savedAndReopened': True, 'restoredInMemory': True, 'qaFileNotForStudents': roundtrip.name}
    report['result'] = 'BLENDER_REOPEN_AND_EDIT_PASS'
    report['notVerified'] = ['human UI操作', 'student task completion time', 'school equipment', 'OpenMAIC classroom', 'student website', 'audio', 'unconstrained Astra prompt generation']
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(report, ensure_ascii=False, indent=2), flush=True)


if __name__ == '__main__':
    main()
