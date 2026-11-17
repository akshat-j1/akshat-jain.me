"""Bake Copernicus terrain from the SLDEM2015 512 ppd 00N–30N, 315E–360E float tile.

Usage: python3 scripts/build-basin-relief.py TILE.img public/lunar
The IMG is flat little-endian float32 kilometres. Read only its Copernicus window.
"""
import argparse
from pathlib import Path

import numpy as np
from PIL import Image

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("tile", type=Path)
parser.add_argument("output", type=Path)
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
height = (elevation - elevation[size // 2, size // 2]) * 11.9
spacing = 600 / (size - 1)
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
