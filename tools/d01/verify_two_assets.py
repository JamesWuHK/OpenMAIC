"""Verify two independent D01-06 teacher examples survive a Blender edit/reopen."""
import bpy
import json
from pathlib import Path

root = Path('/home/ubuntu/d01-qa-20261023-blender-assets')
results = []
for label, filename in (
    ('monster', 'D01_L01_teacher_monster.blend'),
    ('tower', 'D01_L06_teacher_tower.blend'),
):
    original = root / filename
    bpy.ops.wm.open_mainfile(filepath=str(original))
    meshes = [obj for obj in bpy.data.objects if obj.type == 'MESH' and obj.name != 'render_floor']
    if len(meshes) < 2:
        raise RuntimeError(f'{label}: fewer than two editable mesh objects')
    if bpy.data.libraries:
        raise RuntimeError(f'{label}: external linked .blend library')
    if any(image.filepath and not image.packed_file for image in bpy.data.images):
        raise RuntimeError(f'{label}: unpacked external image dependency')
    names = sorted(obj.name for obj in meshes)
    target = meshes[0]
    target_name = target.name
    initial_x = target.location.x
    target.location.x += 0.01
    check = root / f'QA_only_{label}_edit_roundtrip.blend'
    bpy.ops.wm.save_as_mainfile(filepath=str(check))
    bpy.ops.wm.open_mainfile(filepath=str(check))
    again = bpy.data.objects.get(target_name)
    if again is None or abs(again.location.x - (initial_x + 0.01)) > 1e-5:
        raise RuntimeError(f'{label}: edit did not persist')
    results.append({
        'label': label,
        'file': filename,
        'roundtrip_file': check.name,
        'editable_mesh_count': len(meshes),
        'mesh_names': names,
        'no_linked_libraries': True,
        'no_unpacked_external_images': True,
        'edit_reopen_pass': True,
    })

report = root / 'two-assets-reopen-verification.json'
report.write_text(json.dumps({'blender_version': bpy.app.version_string, 'results': results}, ensure_ascii=False, indent=2))
print('D01_TWO_ASSETS_PASS', report)
