"""Build the local outer-basin height atlas from CGI Moon Kit ldem_16.tif."""
import argparse
from pathlib import Path
import numpy as np
from PIL import Image

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("ldem", type=Path)
parser.add_argument("output", type=Path)
args = parser.parse_args()

size = 256
axis = np.linspace(-300, 300, size)
x, z = np.meshgrid(axis, axis)
source = np.asarray(Image.open(args.ldem))
if source.shape != (2880, 5760):
    raise ValueError("Expected the NASA CGI Moon Kit LDEM at 16 pixels per degree")


def bilinear(grid, u, v):
    """Sample pixel coordinates, clamped at the image boundaries."""
    u = np.clip(u, 0, grid.shape[1] - 1)
    v = np.clip(v, 0, grid.shape[0] - 1)
    ix, iz = u.astype(int), v.astype(int)
    nx, nz = np.minimum(ix + 1, grid.shape[1] - 1), np.minimum(iz + 1, grid.shape[0] - 1)
    a, b = u - ix, v - iz
    return (grid[iz, ix] * (1 - a) + grid[iz, nx] * a) * (1 - b) + (grid[nz, ix] * (1 - a) + grid[nz, nx] * a) * b


def window(lon, lat, width, height):
    """Sample a projected window of real Orientale topography in metres."""
    longitudes = lon + x / 600 * width
    latitudes = lat - z / 600 * height
    return (bilinear(source, (180 + longitudes) * 16, (90 - latitudes) * 16) - 20000) / 2


def smooth(low, high, value):
    t = np.clip((value - low) / (high - low), 0, 1)
    return t * t * (3 - 2 * t)


rng = np.random.default_rng(93269)
field = rng.uniform(-1, 1, (155, 155))


def noise(u, v):
    """Continuous authoring noise at scene scale."""
    u, v = u + 76, v + 76
    iv = np.floor(v)
    iu = np.floor(u)
    return bilinear(field, iu + smooth(0, 1, u - iu), iv + smooth(0, 1, v - iv))


rook = window(-95.4, -13.1, 16.5, 13.4)
cordillera = window(-92.0, -22.1, 19, 16.3)
bedrock = np.clip((rook - np.median(rook)) * 0.0024, -5.1, 6.2)
highlands = np.clip((cordillera - np.median(cordillera)) * 0.0032, -7.5, 9.0)


def escarpment(path, height, inside_width, outside_width, observed_relief, salt):
    """Build steep fault blocks over a sloped apron, with breaks along the rim."""
    along = x * 0.037 + salt
    offsets = noise(along, salt) * 6.2 + noise(x * 0.109, salt) * 3.0
    setback = z - path - offsets
    blocks = 0.8 + 0.3 * noise(x * .092, salt + 13)
    width = np.where(setback > 0, inside_width * blocks, outside_width)
    wall = np.exp(-np.power(np.abs(setback / width), 1.12))
    bench = np.exp(-((setback - 8 - 5 * noise(x * .066, salt)) / (inside_width * .72)) ** 2)
    apron = np.exp(-((setback - 22) / (inside_width + 13)) ** 2)
    gullies = noise((x - z * .24) * .127, z * .055 + salt)
    ribs = noise((x + z * .32) * .28, z * .10 + salt)
    return height * (.72 * wall + .16 * bench + .18 * apron) + wall * (
        observed_relief * 1.32 + (gullies - .26 * abs(gullies)) * 4.9 + ribs * 1.3)


# A close broken shoulder on the left and a more distant massif on the right
# leave an open basin and dark sky above the relay. The crests curve away at
# different angles, so they separate as the visitor moves sideways.
stations = [-300, -175, -137, -106, -87, -72, -57, -44, -32, -17, 0, 20, 39, 60, 78, 112, 159, 300]
near_peaks = [6, 8, 13, 14, 22, 28, 32, 30, 20, 7, 2, 3, 10, 16, 18, 19, 13, 7]
far_peaks = [14, 23, 27, 35, 29, 33, 26, 20, 22, 14, 7, 14, 27, 34, 30, 40, 24, 12]
back_peaks = [15, 19, 28, 26, 33, 27, 34, 26, 18, 22, 14, 17, 26, 31, 27, 29, 32, 20]
forward_wall = escarpment(-102 - 0.0008 * (x + 37) ** 2 - x * .23,
                           np.interp(x, stations, near_peaks), 14, 23, bedrock, 7)
outer_wall = escarpment(-156 - 0.00042 * (x - 33) ** 2 + x * .27,
                         np.interp(x, stations, far_peaks), 21, 29, highlands, 17)
back_wall = escarpment(-224 - 0.00034 * (x + 32) ** 2 - x * .06,
                        np.interp(x, stations, back_peaks), 24, 30, bedrock, 28)


def impact_bowl(cx, cz, rx, rz, depth, height, breach, salt):
    dx, dz = (x - cx) / rx, (z - cz) / rz
    angle = np.arctan2(dz, dx)
    boundary = 1 + .11 * np.sin(angle * 3 + salt) + .04 * np.cos(angle * 7) + .075 * noise(x * .055, z * .043)
    radius = np.hypot(dx, dz) / boundary
    open_rim = 1 - .68 * np.maximum(0, np.cos(angle - breach)) ** 8
    crest = np.exp(-((radius - 1) / np.where(radius > 1, .19, .12)) ** 2)
    apron = .19 * height * np.exp(-((radius - 1.13) / .28) ** 2)
    floor = depth * (1 - smooth(.23, .93, radius))
    return -floor + apron + crest * open_rim * (height + bedrock * .47)


relief = 0.64 * bedrock + 0.24 * highlands + forward_wall + outer_wall + back_wall
relief += impact_bowl(-49, -49, 31, 20, 6.2, 8.4, .91, 2)
relief += impact_bowl(49, -49, 26, 34, 6.3, 9.5, 2.65, 4)
relief += impact_bowl(-8, -104, 31, 20, 6.8, 4.1, 1.52, 5)
relief += impact_bowl(-91, 45, 43, 36, 6.8, 15, -.44, 8)
relief += impact_bowl(92, 47, 48, 38, 7.5, 19, -2.31, 6)
relief += impact_bowl(4, 113, 57, 46, 6.0, 20, -1.55, 9)
relief += (noise(x * .12, z * .13) * .94 + noise(x * .23, z * .24) * .41)
# A small drop toward the outer boundary prevents a raised rim at the mesh edge.
relief -= 6 * smooth(220, 300, np.maximum(abs(x), abs(z)))

# Pack a weathering and ejecta mask in blue. It describes surface variation,
# independent of the position of the sun. The shader supplies the lighting.
slope_z, slope_x = np.gradient(relief, axis[1] - axis[0])
steep = smooth(.14, .82, np.hypot(slope_x, slope_z))
weathering = noise(x * .033 + 5, z * .042 + 3) * .24 + noise(x * .15 + z * .06, z * .082) * .17
outcrops = np.clip(.43 + weathering + steep * .29 + smooth(6, 19, relief) * .10, 0, 1)

# Centimetre-scale steps keep the low bits compressible without visible terracing.
packed = (16384 + 16 * np.rint(32 * relief)).clip(0, 65535).astype(np.uint16)
rgb = np.zeros((size, size, 3), dtype=np.uint8)
rgb[..., 0] = packed >> 8
rgb[..., 1] = packed & 255
rgb[..., 2] = (17 * np.rint(15 * outcrops)).astype(np.uint8)
Image.fromarray(rgb).save(args.output, optimize=True)
print(f"{args.output}: {args.output.stat().st_size:,} bytes, range {relief.min():.1f} to {relief.max():.1f} scene units")
