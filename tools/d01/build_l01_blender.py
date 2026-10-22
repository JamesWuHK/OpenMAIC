"""Build original D01-01 teaching assets inside a fresh Blender process.

This is a deterministic local worked example, not student work or a hosted
generation result. Run with --factory-startup --disable-autoexec --background.
No downloads, plugins, shell calls, or access outside the selected output folder.
"""
import argparse
import hashlib
import json
import math
from pathlib import Path
import sys
import time

import bpy
from mathutils import Vector


def arguments():
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', required=True)
    parser.add_argument('--samples', type=int, default=24)
    argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    return parser.parse_args(argv)


def material(name, color, roughness=0.55):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1.0)
    mat.use_nodes = True
    node = mat.node_tree.nodes.get('Principled BSDF')
    node.inputs['Base Color'].default_value = (*color, 1.0)
    node.inputs['Roughness'].default_value = roughness
    return mat


def move_to_collection(obj, collection):
    for existing in list(obj.users_collection):
        existing.objects.unlink(obj)
    collection.objects.link(obj)


def finish_object(obj, name, mat, collection):
    obj.name = name
    obj.data.name = name + '_editable_geometry'
    obj.data.materials.append(mat)
    move_to_collection(obj, collection)
    if obj.type == 'MESH':
        for polygon in obj.data.polygons:
            polygon.use_smooth = True
    obj['source'] = 'M: original authored classroom example, not student work'
    return obj


def sphere(name, location, scale, mat, collection):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=16, location=location)
    obj = bpy.context.object
    obj.scale = scale
    return finish_object(obj, name, mat, collection)


def aim(obj, target):
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat('-Z', 'Y').to_euler()


def light(name, location, power, size, collection):
    data = bpy.data.lights.new(name, type='AREA')
    data.energy = power
    data.shape = 'DISK'
    data.size = size
    obj = bpy.data.objects.new(name, data)
    collection.objects.link(obj)
    obj.location = location
    aim(obj, (0, 0, 1.2))
    return obj


def snapshot(collection):
    return {
        obj.name: {
            'type': obj.type,
            'location': [round(float(x), 6) for x in obj.location],
            'rotation': [round(float(x), 6) for x in obj.rotation_euler],
            'scale': [round(float(x), 6) for x in obj.scale],
            'parent': obj.parent.name if obj.parent else None,
            'vertices': len(obj.data.vertices) if obj.type == 'MESH' else None,
        }
        for obj in sorted(collection.objects, key=lambda obj: obj.name)
    }


def cast_to(target, direction_to_viewer):
    """One parallel view ray only; not a full visibility or perception metric."""
    bpy.context.view_layer.update()
    point = Vector(target)
    direction = Vector(direction_to_viewer).normalized()
    hit, location, normal, face, obj, matrix = bpy.context.scene.ray_cast(
        bpy.context.evaluated_depsgraph_get(), point + direction * 10, -direction,
        distance=12,
    )
    return obj.name if hit else None


def observations():
    eye = bpy.data.objects['PupilL'].matrix_world.translation.copy()
    ear = bpy.data.objects['EarL'].location.copy() + Vector((0, 0, 0.25))
    return {
        'leftPupilFrontRayFirstHit': cast_to(eye, (0, -1, 0)),
        'leftEarRightSideRayFirstHit': cast_to(ear, (1, 0, 0)),
        'scope': 'Two authored sample rays; not full collision or human recognition testing.',
    }


def set_view(scene, camera, name):
    views = {
        'front': ((0, -8, 1.5), (0, 0, 1.5), 3.8),
        'side': ((8, 0, 1.5), (0, 0, 1.5), 3.8),
        'three-quarter': ((5, -8, 4.0), (0, 0, 1.4), 4.1),
    }
    position, target, scale = views[name]
    camera.location = position
    aim(camera, target)
    camera.data.ortho_scale = scale
    scene.camera = camera
    # A freshly opened .blend starts in an inspectable solid view.
    for screen in bpy.data.screens:
        for area in screen.areas:
            if area.type == 'VIEW_3D':
                area.spaces.active.region_3d.view_rotation = camera.rotation_euler.to_quaternion()
                area.spaces.active.region_3d.view_distance = 5.4
                area.spaces.active.region_3d.view_location = Vector(target)
                area.spaces.active.shading.color_type = 'MATERIAL'


def save_blend(path):
    if path.exists():
        raise RuntimeError('Refusing to overwrite existing asset: ' + str(path))
    bpy.ops.wm.save_as_mainfile(filepath=str(path), check_existing=False, compress=True)


def main():
    args = arguments()
    out = Path(args.output).resolve()
    repo = Path(__file__).resolve().parents[2]
    allowed = (repo / 'output' / 'd01-l01-blender').resolve()
    if not out.is_relative_to(allowed) or out == allowed:
        raise RuntimeError('Use a fresh run folder below output/d01-l01-blender/')
    if out.exists() and any(out.iterdir()):
        raise RuntimeError('Output run folder must be new or empty; no overwrites.')
    out.mkdir(parents=True, exist_ok=True)
    started = time.perf_counter()
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.context.preferences.filepaths.save_version = 0
    scene = bpy.context.scene
    scene['course'] = 'D01-01'
    scene['provenance'] = 'M: authored teaching demonstration; no student results'
    scene['units_note'] = 'Relative scene proportions, not a real-world safety design'
    scene.render.engine = 'CYCLES'
    scene.cycles.device = 'CPU'
    scene.cycles.samples = max(4, min(args.samples, 64))
    scene.cycles.use_denoising = True
    scene.render.threads_mode = 'FIXED'
    scene.render.threads = 2
    scene.render.resolution_x = 640
    scene.render.resolution_y = 640
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGB'
    scene.render.film_transparent = False
    scene.world = bpy.data.worlds.new('StudioWorld')
    scene.world.use_nodes = True
    scene.world.node_tree.nodes['Background'].inputs[0].default_value = (0.78, 0.84, 0.90, 1)
    scene.world.node_tree.nodes['Background'].inputs[1].default_value = 0.35

    model = bpy.data.collections.new('01_Student_Model')
    studio = bpy.data.collections.new('02_Render_Studio')
    scene.collection.children.link(model)
    scene.collection.children.link(studio)
    teal = material('Lagoon', (0.035, 0.38, 0.36))
    apricot = material('Apricot', (0.96, 0.38, 0.12))
    coral = material('SoftCoral', (0.78, 0.24, 0.18))
    cream = material('WarmWhite', (0.94, 0.91, 0.78))
    ink = material('Ink', (0.012, 0.025, 0.04), 0.32)
    floor_mat = material('StudioPaper', (0.80, 0.86, 0.85))
    sphere('Body', (0, 0, 1.18), (0.95, 0.72, 1.0), teal, model)
    bpy.ops.mesh.primitive_cylinder_add(vertices=48, radius=1.18, depth=0.18, location=(0, 0, 0.09))
    base = finish_object(bpy.context.object, 'Base', cream, model)
    bevel = base.modifiers.new('SmallEdgeSoftening', 'BEVEL')
    bevel.width = 0.035
    bevel.segments = 2

    bpy.ops.mesh.primitive_plane_add(size=200, location=(0, 0, -0.02))
    finish_object(bpy.context.object, 'StudioFloor', floor_mat, studio)
    light('Key', (-3, -4, 6), 500, 4.0, studio)
    light('Fill', (4, -2, 4), 220, 3.5, studio)
    light('Rim', (1, 4, 6), 400, 3.0, studio)
    camera_data = bpy.data.cameras.new('ReviewCamera')
    camera_data.type = 'ORTHO'
    camera = bpy.data.objects.new('ReviewCamera', camera_data)
    studio.objects.link(camera)
    set_view(scene, camera, 'three-quarter')
    bpy.ops.object.select_all(action='DESELECT')
    bpy.data.objects['Body'].select_set(True)
    bpy.context.view_layer.objects.active = bpy.data.objects['Body']
    save_blend(out / 'D01_L01_v00_starter.blend')

    for name, x, y, scale in [
        ('EarL', -0.43, -0.28, (0.22, 0.27, 0.46)),
        ('EarR', 0.43, 0, (0.27, 0.28, 0.50)),
    ]:
        sphere(name, (x, y, 2.05), scale, apricot, model)
    for suffix, x, y in [('L', -0.34, -0.54), ('R', 0.34, -0.68)]:
        eye = sphere('Eye' + suffix, (x, y, 1.43), (0.25, 0.14, 0.25), cream, model)
        pupil = sphere('Pupil' + suffix, (0, 0, 0), (0.092, 0.055, 0.105), ink, model)
        # Parent with transform compensation so changing the eye location moves its pupil.
        pupil.parent = eye
        pupil.matrix_parent_inverse = eye.matrix_world.inverted()
        pupil.location = (x + 0.025, y - 0.14, 1.455)
    for x in [-0.59, 0.59]:
        cheek_y = -0.72 * math.sqrt(1 - (x / 0.95) ** 2) - 0.035
        sphere('CheekL' if x < 0 else 'CheekR', (x, cheek_y, 1.18), (0.095, 0.028, 0.048), coral, model)
    curve = bpy.data.curves.new('Smile_editable_curve', 'CURVE')
    curve.dimensions = '3D'
    curve.bevel_depth = 0.023
    curve.bevel_resolution = 2
    spline = curve.splines.new('BEZIER')
    spline.bezier_points.add(2)
    for point, x, z in zip(spline.bezier_points, [-0.23, 0, 0.23], [1.04, 0.94, 1.04]):
        y = -0.72 * math.sqrt(1 - (x / 0.95) ** 2 - (z - 1.18) ** 2) - 0.017
        point.co = (x, y, z)
        point.handle_left_type = 'AUTO'
        point.handle_right_type = 'AUTO'
    mouth = bpy.data.objects.new('Smile', curve)
    model.objects.link(mouth)
    mouth.data.materials.append(ink)

    report = {
        'course': 'D01-01', 'blenderVersion': bpy.app.version_string,
        'method': 'Original local bpy script executed by Codex; not hosted OpenMAIC or student work.',
        'samples': scene.cycles.samples,
        'views': ['front', 'side', 'three-quarter'],
        'variants': {}, 'artifacts': [],
    }
    for variant in ['v01', 'v02']:
        if variant == 'v02':
            bpy.data.objects['EarL'].location.y = -0.48
            bpy.data.objects['EyeL'].location.y = -0.68
        scene['variant'] = variant
        scene['teaching_note'] = ('Both eyes and ears are present; v01 starts with partial viewpoint occlusion.'
                                  if variant == 'v01' else 'Two local example adjustments; not the only design answer')
        bpy.context.view_layer.update()
        inventory = snapshot(model)
        measured = observations()
        report['variants'][variant] = {'objects': inventory, 'sampleRays': measured}
        set_view(scene, camera, 'three-quarter')
        bpy.ops.object.select_all(action='DESELECT')
        bpy.data.objects['EyeL'].select_set(True)
        bpy.context.view_layer.objects.active = bpy.data.objects['EyeL']
        save_blend(out / ('D01_L01_' + variant + '.blend'))
        for view in report['views']:
            set_view(scene, camera, view)
            scene.render.filepath = str(out / (variant + '-' + view + '.png'))
            tick = time.perf_counter()
            bpy.ops.render.render(write_still=True)
            print('D01_RENDER', variant, view, round(time.perf_counter() - tick, 2), flush=True)
    assert report['variants']['v01']['sampleRays']['leftPupilFrontRayFirstHit'] == 'Body'
    assert report['variants']['v01']['sampleRays']['leftEarRightSideRayFirstHit'] == 'EarR'
    assert report['variants']['v02']['sampleRays']['leftPupilFrontRayFirstHit'] == 'PupilL'
    assert report['variants']['v02']['sampleRays']['leftEarRightSideRayFirstHit'] == 'EarL'
    for path in sorted(out.iterdir()):
        if path.is_file():
            report['artifacts'].append({'file': path.name, 'bytes': path.stat().st_size, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()})
    report['buildSeconds'] = round(time.perf_counter() - started, 2)
    report['notVerified'] = ['human student timing', 'school device performance', 'Astra free-form prompt success rate', 'learner website', 'audio', 'teaching outcomes']
    (out / 'build-evidence.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print('D01_BUILD_PASS', out, report['buildSeconds'], flush=True)


if __name__ == '__main__':
    main()
