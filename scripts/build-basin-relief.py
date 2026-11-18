"""Bake Copernicus terrain from the SLDEM2015 512 ppd 00N–30N, 315E–360E float tile.

Usage: python3 scripts/build-basin-relief.py TILE.img public/lunar --scarp rock_face_01.gltf
The IMG is flat little-endian float32 kilometres. Read only its Copernicus window.
"""
import argparse
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("tile", type=Path)
parser.add_argument("output", type=Path)
parser.add_argument("--scarp", type=Path, required=True, help="Poly Haven Rock Face 01 glTF with its adjacent .bin")
args = parser.parse_args()

tile = np.memmap(args.tile, dtype="<f4", mode="r", shape=(15360, 23040))
# Position the trail on the northwestern crater floor. North is -Z.
size = 1024
span = 3.30
west, north = 339.23 - span / 2, 9.86 + span / 2
column = int((west - 315) * 512)
row = int((30 - north) * 512)
width = round(span * 512)
crop = Image.fromarray(np.array(tile[row:row + width, column:column + width]))
elevation = np.asarray(crop.resize((size, size), Image.Resampling.LANCZOS))
# Compress horizontal distances and exaggerate relief to frame the walking area.
height = (elevation - elevation[size // 2, size // 2]) * 7.6
# Compose distinct intermediate massifs from measured central-uplift profiles.
# The surrounding crater becomes the second skyline, visible through the saddles.
axis = np.linspace(-300, 300, size, dtype=np.float32)
x, z = np.meshgrid(axis, axis)
def uplift(cx, cz, lon, lat, width, depth, angle, gain):
    c, s = np.cos(angle), np.sin(angle)
    u = ((x - cx) * c + (z - cz) * s) / width
    v = ((z - cz) * c - (x - cx) * s) / depth
    # Sample a separate window of the deposit, keeping the captured drainage lines.
    px = (lon + u * 0.24 - 315) * 512
    py = (30 - lat + v * 0.20) * 512
    px = np.clip(px, (lon-315-.3)*512, (lon-315+.3)*512)
    py = np.clip(py, (30-lat-.3)*512, (30-lat+.3)*512)
    ix, iy = px.astype(int), py.astype(int)
    a, b = px-ix, py-iy
    value = ((1-a)*tile[iy,ix]+a*tile[iy,ix+1])*(1-b) + ((1-a)*tile[iy+1,ix]+a*tile[iy+1,ix+1])*b
    blend = np.clip((1.35 - np.hypot(u, v)) / .55, 0, 1)
    return gain * np.maximum(0, value + 3.52) * blend**2 * (3-2*blend)

height += uplift(-50, -98, 339.72, 9.50, 60, 48, -.52, 17)
height += uplift(74, -85, 340.22, 9.68, 49, 34, .56, 17)
height += uplift(83, 57, 339.66, 9.56, 44, 35, 1.23, 13)
height += uplift(-45, 96, 340.14, 9.68, 58, 42, -.89, 15)
height += uplift(-104, 13, 339.76, 9.44, 43, 29, 1.4, 17)
spacing = 600 / (size - 1)
# Add measured, fractured inner-wall relief at a second horizontal scale.
# Subtract its low frequencies so the source contributes gullies and broken
# shoulders without adding another wall on top of the composed skyline.
wall = np.array(tile[9550:10450, 11600:12450])
small = Image.fromarray(wall).resize((23, 25), Image.Resampling.BOX)
residual = wall - np.asarray(small.resize((850, 900), Image.Resampling.BICUBIC))
def folded(t, length):
    return np.abs(np.mod(t, 2 * (length - 1)) - (length - 1)).astype(int)

u = folded((x * 1.7 + z * .66) * 5.9, 850)
v = folded((z - x * .38) * 4.8, 900)
gz, gx = np.gradient(height, spacing)
slope = np.clip(np.hypot(gx, gz) * 1.9, 0, 1)
height += residual[v, u] * (0.55 + slope * 3.3)
# Broken scarps step down towards their talus. Incline the bedding so benches
# don't follow contour lines around each peak.
phase = height * 0.31 + x * 0.063 - z * 0.044 + residual[v, u]
height += slope * (np.tanh(np.sin(phase) * 3.0) * 0.56 + np.sin(phase) * 0.22)
# Orthographically rasterize a scanned bedrock exposure into the same elevation
# field. Integrating the geometry before baking light avoids mesh intersections
# and inconsistent exposure on steep walls.
def scan_relief(path):
    model = json.loads(path.read_text())
    buffer = (path.parent / model["buffers"][0]["uri"]).read_bytes()
    primitive = model["meshes"][0]["primitives"][0]

    def attribute(index):
        a = model["accessors"][index]
        view = model["bufferViews"][a["bufferView"]]
        dtype = np.dtype({5126: "<f4", 5123: "<u2", 5125: "<u4"}[a["componentType"]])
        dim = 3 if a["type"] == "VEC3" else 1
        return np.ndarray((a["count"], dim), dtype=dtype, buffer=buffer,
                          offset=view.get("byteOffset", 0) + a.get("byteOffset", 0),
                          strides=(view.get("byteStride", dim * dtype.itemsize), dtype.itemsize))

    vertices = attribute(primitive["attributes"]["POSITION"])
    normalized = (vertices - vertices.min(axis=0)) / np.ptp(vertices, axis=0)
    triangles = normalized[attribute(primitive["indices"]).reshape(-1, 3)]
    stamp = Image.new("L", (384, 384))
    draw = ImageDraw.Draw(stamp)
    levels = triangles[:, :, 1].mean(axis=1)
    for k in np.argsort(levels):
        draw.polygon([tuple(point) for point in triangles[k][:, [0, 2]] * 383],
                     fill=int(255 * levels[k]))
    return np.asarray(stamp.filter(ImageFilter.GaussianBlur(1.1))) / 255

stamp = scan_relief(args.scarp)
exposures = [
    (-48,-91,28,19,4.1), (-66,-102,34,18,4.5), (-32,-77,23,14,3.8),
    (72,-72,24,16,4.1), (89,-82,31,20,4.3), (60,53,26,19,3.9),
    (-39,78,31,18,4.5), (-62,85,25,16,3.7), (-91,12,33,19,4.3),
    (-30,-50,15,11,2.5), (37,-41,18,12,2.9), (40,12,17,11,2.2),
    (-27,38,19,11,2.7), (9,48,22,13,2.9),
]
for cx, cz, width, depth, rise in exposures:
    i, j = round((cx+300)/spacing), round((cz+300)/spacing)
    angle = np.arctan2(-gx[j,i], -gz[j,i])
    c, s = np.cos(angle), np.sin(angle)
    u = ((x-cx)*c - (z-cz)*s)/width + 0.5
    v = ((x-cx)*s + (z-cz)*c)/depth + 0.5
    inside = (u>0) & (u<1) & (v>0) & (v<1)
    edge = np.minimum.reduce([u[inside], v[inside], 1-u[inside], 1-v[inside]])
    taper = np.clip(edge * 8, 0, 1)
    field = stamp[(v[inside]*383).astype(int), (u[inside]*383).astype(int)]
    height[inside] += taper * taper * (3-2*taper) * rise * field

dz, dx = np.gradient(height, spacing)
length = np.sqrt(1 + dx * dx + dz * dz)
normal_x, normal_z = -dx / length, -dz / length

# Search towards the scene sun in the DEM for the highest intervening horizon.
# Opposite edges must never cast onto one another.
yy, xx = np.ogrid[:size, :size]
horizon = np.full_like(height, -2)
for step in np.geomspace(1.5, 320, 62):
    u = np.clip(xx - round(step * 45 / 51), 0, size - 1)
    v = np.clip(yy + round(step * 24 / 51), 0, size - 1)
    horizon = np.maximum(horizon, (height[v, u] - height - 0.12) / (step * spacing))
visibility = np.clip(0.5 + (12 / 51 - horizon) * 12, 0, 1)
# Estimate sky visibility across the local horizon. This preserves relief
# inside the main shadow using the same measured slopes as the direct light.
occlusion = np.zeros_like(height)
for azimuth in np.arange(8) * np.pi / 4:
    obstruction = np.zeros_like(height)
    for step in (4, 10, 24, 58, 128):
        u = np.clip(xx + round(step * np.cos(azimuth)), 0, size - 1)
        v = np.clip(yy + round(step * np.sin(azimuth)), 0, size - 1)
        obstruction = np.maximum(obstruction, (height[v, u] - height) / (step * spacing))
    occlusion += obstruction / np.sqrt(1 + obstruction ** 2) / 8
normal_y = 1 / length
cosine = np.maximum(0, (-45 * normal_x + 12 * normal_y + 24 * normal_z) / np.hypot(51, 12))
opposing_wall = np.maximum(0, 0.67 * normal_x + 0.45 * normal_y - 0.59 * normal_z)
irradiance = visibility * cosine * 1.85 + (1 - occlusion) ** 2 * (0.15 + opposing_wall * 0.58)
light = np.sqrt(np.clip(irradiance / 2.6, 0, 1))
surface = np.stack((normal_x * 0.5 + 0.5, normal_z * 0.5 + 0.5, light), axis=-1)
Image.fromarray(np.uint8(np.rint(surface * 255))).save(args.output / "crater-surface.webp", quality=85, method=6)

# Geometry and exposure mask use the same footprint as the per-fragment atlas.
def downsample(values):
    return np.asarray(Image.fromarray(values).resize((320, 320), Image.Resampling.LANCZOS))

packed = np.clip(16384 + 16 * np.rint(32 * downsample(height)), 0, 65535).astype(np.uint16)
rock = np.clip(downsample(np.hypot(dx, dz)) * 1.2, 0, 1)
image = np.stack((packed >> 8, packed & 255, np.rint(rock * 15) * 17), axis=-1)
Image.fromarray(image.astype(np.uint8)).save(args.output / "basin-relief.png", optimize=True)

# Traverse-scale relief. Sample distinct observed impact bowls, remove the
# regional tilt of each patch, and register them around the relay route. These
# source locations are pixel coordinates relative to 337.5 E, 12 N in SLDEM.
trail_size = 384
axis = np.linspace(-48, 48, trail_size)
tx, tz = np.meshgrid(axis, axis)

def observed(px, py):
    ix, iy = px.astype(int), py.astype(int)
    a, b = px - ix, py - iy
    ix, iy = ix + 11520, iy + 9216
    return ((1-a)*tile[iy,ix] + a*tile[iy,ix+1])*(1-b) + ((1-a)*tile[iy+1,ix] + a*tile[iy+1,ix+1])*b

floor = observed(1120 + tx*6.8, 1240 + tz*6.8)
trail = (floor - np.median(floor)) * 0.42
bowls = [
    (-6,-8,5.0,4.2,1.35,255,1295,17,0.36), (8,-7,4.4,3.1,0.9,105,1210,17,-0.4),
    (-15,-18,8.9,5.4,2.9,535,920,61,-0.73), (12,-24,7.4,6.3,2.2,1840,1270,27,0.62),
    (-19,7,9.4,6.7,2.3,1440,2195,41,1.15), (15,10,6.3,5.8,1.3,330,335,17,1.26),
    (1,19,8.8,5.4,1.9,1270,1840,29,0.42), (-7,4,1.4,1.1,0.27,330,335,15,-0.2),
    (2,4,1.0,0.9,0.14,255,1295,18,0.35), (-2,-3,0.9,0.65,0.16,1270,1840,17,1.3),
    (-4,-31,8.7,7.3,1.7,260,1295,23,-0.87), (27,-1,8.4,6.0,2.1,540,905,40,0.53),
]
for cx, cz, rx, rz, depth, sx, sy, radius, turn in bowls:
    u = ((tx-cx)*np.cos(turn) + (tz-cz)*np.sin(turn)) / rx
    v = ((tz-cz)*np.cos(turn) - (tx-cx)*np.sin(turn)) / rz
    distance = np.hypot(u,v)
    inside = distance < 1.7
    patch = observed(sx + radius*u[inside], sy + radius*v[inside])
    rim = distance[inside] > 1.3
    plane = np.stack((np.ones_like(patch),u[inside],v[inside]),axis=1)
    reference = np.linalg.lstsq(plane[rim],patch[rim],rcond=None)[0]
    relative = patch - plane @ reference
    amount = depth / max(0.1,-np.percentile(relative,3))
    taper = np.clip((1.7-distance[inside])/.48,0,1)
    trail[inside] += relative*amount*taper*taper*(3-2*taper)
encoded = np.uint8(np.clip(np.rint(128 + trail*31),0,255))
Image.fromarray(encoded).save(args.output / "trail-impacts.png",optimize=True)
