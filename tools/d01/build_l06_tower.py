"""Create a distinct, editable teacher-example block tower for D01-06.

This is a teacher sample, not a student outcome or evidence of classroom use.
"""
import bpy
import math
from pathlib import Path
from mathutils import Vector

OUT = Path('/home/ubuntu/d01-qa-20261023-blender-assets')
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

def material(name, rgb, roughness=0.42):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*rgb, 1)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (*rgb, 1)
    bsdf.inputs['Roughness'].default_value = roughness
    return mat

cream = material('warm_cream', (0.93, 0.87, 0.74))
teal = material('sea_teal', (0.10, 0.50, 0.53))
coral = material('sunset_coral', (0.93, 0.40, 0.31))
gold = material('sun_gold', (0.98, 0.68, 0.23))
blue = material('deep_blue', (0.12, 0.25, 0.43))
white = material('gallery_white', (0.81, 0.82, 0.79))

def block(name, pos, scale, mat, bevel=0.10):
    bpy.ops.mesh.primitive_cube_add(size=1, location=pos)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(mat)
    edge = obj.modifiers.new('soft_edges', 'BEVEL')
    edge.width = bevel
    edge.segments = 4
    obj.modifiers.new('weighted_normals', 'WEIGHTED_NORMAL')
    return obj

def cylinder(name, pos, radius, depth, mat):
    bpy.ops.mesh.primitive_cylinder_add(vertices=64, radius=radius, depth=depth, location=pos)
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(mat)
    edge = obj.modifiers.new('soft_edges', 'BEVEL')
    edge.width = 0.035
    edge.segments = 3
    obj.modifiers.new('weighted_normals', 'WEIGHTED_NORMAL')
    return obj

# The tower is intentionally a separate design from the D01-01 round monster.
# Overlapping blocks make each level visually connected, without claiming
# engineering-grade real-world stability.
cylinder('display_plinth', (0, 0, 0.10), 1.85, 0.20, white)
block('01_wide_foundation', (0, 0, 0.43), (2.45, 1.35, 0.46), teal)
block('02_coral_bridge', (-0.15, 0.03, 0.91), (1.85, 1.19, 0.50), coral)
block('03_gold_middle', (0.18, -0.04, 1.45), (1.40, 1.10, 0.57), gold)
block('04_deep_blue_cap', (-0.05, 0.04, 2.02), (1.08, 0.95, 0.57), blue)
block('05_cream_top', (0.09, 0.0, 2.48), (0.78, 0.82, 0.39), cream)

# A simple optional accent is a removable part, so students can ask AI to
# compare versions with and without it.
cylinder('removable_top_accent', (0.09, 0.0, 2.74), 0.26, 0.14, coral)

block('render_floor', (0, 0, -0.12), (200, 200, 0.08), white, 0.02)

def aim(obj, target):
    direction = Vector(target) - obj.location
    obj.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()

bpy.ops.object.camera_add(location=(5.2, -7.3, 4.1))
camera = bpy.context.object
camera.name = 'teacher_preview_camera'
aim(camera, (0, 0, 1.4))
camera.data.type = 'ORTHO'
camera.data.ortho_scale = 5.6
bpy.context.scene.camera = camera

for name, loc, energy, size in [
    ('large_softbox', (3, -4, 7), 1100, 5),
    ('left_fill', (-4, -2, 4), 650, 4),
]:
    bpy.ops.object.light_add(type='AREA', location=loc)
    light = bpy.context.object
    light.name = name
    light.data.energy = energy
    light.data.shape = 'DISK'
    light.data.size = size
    aim(light, (0, 0, 1.25))

scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.samples = 24
scene.render.resolution_x = 720
scene.render.resolution_y = 720
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'
scene.render.filepath = str(OUT / 'D01_L06_teacher_tower.png')
scene.world.color = (0.72, 0.72, 0.72)

bpy.ops.wm.save_as_mainfile(filepath=str(OUT / 'D01_L06_teacher_tower.blend'))
bpy.ops.render.render(write_still=True)
print('D01_TEACHER_TOWER_SAVED', str(OUT))
