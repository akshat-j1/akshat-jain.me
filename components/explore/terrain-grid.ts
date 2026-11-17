import { BufferAttribute, BufferGeometry } from "three";

const trailEdge = 30;

function ringRadius(start: number, progress: number) {
  if (progress <= 0.48) return start + (98 - start) * (progress / 0.48) ** 1.35;
  if (progress <= 0.86) return 98 + 92 * (progress - 0.48) / 0.38;
  return 190 + 110 * (progress - 0.86) / 0.14;
}

export function createTerrainGrid(cells: number, rings: number) {
  const row = cells + 1;
  const coreCount = row * row;
  const around = cells * 4;
  const count = coreCount + around * rings;
  const position = new Float32Array(count * 3);
  const index = count > 65535
    ? new Uint32Array((cells * cells + around * rings) * 6)
    : new Uint16Array((cells * cells + around * rings) * 6);
  let cursor = 0;

  for (let j = 0; j <= cells; j++) {
    for (let i = 0; i <= cells; i++) {
      const at = j * row + i;
      position[at * 3] = (2 * i / cells - 1) * trailEdge;
      position[at * 3 + 2] = (2 * j / cells - 1) * trailEdge;
      if (j === cells || i === cells) continue;
      index.set([at, at + row, at + 1, at + row, at + row + 1, at + 1], cursor);
      cursor += 6;
    }
  }

  // Clockwise around the square without duplicating its four corner vertices.
  const edge = new Uint32Array(around);
  for (let i = 0; i < cells; i++) {
    edge[i] = i;
    edge[cells + i] = (i + 1) * row - 1;
    edge[2 * cells + i] = coreCount - 1 - i;
    edge[3 * cells + i] = (cells - i) * row;
  }

  for (let ring = 0; ring < rings; ring++) {
    const start = coreCount + ring * around;
    const progress = (ring + 1) / rings;
    for (let i = 0; i < around; i++) {
      const x = position[edge[i] * 3];
      const z = position[edge[i] * 3 + 2];
      const distance = Math.hypot(x, z);
      const scale = ringRadius(distance, progress) / distance;
      position[(start + i) * 3] = x * scale;
      position[(start + i) * 3 + 2] = z * scale;

      const next = (i + 1) % around;
      const inner = ring === 0 ? edge[i] : start - around + i;
      const innerNext = ring === 0 ? edge[next] : start - around + next;
      index.set([inner, innerNext, start + i, innerNext, start + next, start + i], cursor);
      cursor += 6;
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(position, 3));
  geometry.setIndex(new BufferAttribute(index, 1));
  return geometry;
}
