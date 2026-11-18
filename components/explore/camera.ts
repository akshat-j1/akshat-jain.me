import { Vector3, type Camera } from "three";
import { clearBoomFraction, clearEyeHeight } from "./camera-clearance";
import { boulders, groundHeight, relay, type Walker } from "./simulation";

export type CameraLook = { yaw: number; pitch: number; observing: boolean };

import { ferryObstacles, rimBlocks } from "../../content/ferry-site";

const obstacles = [
  ...ferryObstacles, ...rimBlocks,
  { ...relay, radius: 1.58, height: 2.62 },
  ...boulders.map((rock) => ({ ...rock, height: rock.radius * 0.82 })),
];

export function createCameraRig() {
  const pivot = new Vector3();
  const eye = new Vector3();
  const focus = new Vector3();
  let initialized = false;
  let yaw = 0;
  let pitch = 0;
  let zoom = 1;
  let boom = 1;
  let elevation = 0;

  return (camera: Camera, player: Walker, width: number, height: number, delta: number, look: CameraLook) => {
    const portrait = width / height < 0.94;
    const turn = Math.atan2(Math.sin(look.yaw - yaw), Math.cos(look.yaw - yaw));
    const targetZoom = look.observing ? 1.42 : 1;
    const snap = initialized ? 1 - Math.exp(-17 * delta) : 1;
    const follow = initialized ? 1 - Math.exp(-13 * delta) : 1;

    yaw += turn * snap;
    pitch += (look.pitch - pitch) * snap;
    zoom += (targetZoom - zoom) * follow;
    pivot.x += (player.x - pivot.x) * follow;
    pivot.z += (player.z - pivot.z) * follow;
    const ground = groundHeight(pivot.x, pivot.z);
    pivot.y = ground + 1.62;

    const c = Math.cos(yaw);
    const s = Math.sin(yaw);
    const offsetX = portrait ? 0.30 : 2.36;
    const offsetZ = portrait ? 7.0 : 8.05;
    const eyeHeight = (portrait ? 2.68 : 2.92) + 2.2 * (zoom - 1);
    eye.set(
      pivot.x + (offsetX * c + offsetZ * s) * zoom,
      ground + eyeHeight + pitch * 0.48,
      pivot.z + (-offsetX * s + offsetZ * c) * zoom,
    );

    // Solve the orbit from the traveller each frame so rotation follows an arc.
    const safeHeight = clearEyeHeight(pivot, eye, groundHeight);
    elevation = Math.max(safeHeight, elevation + (safeHeight - elevation) * follow);
    eye.y = elevation;
    const safeBoom = clearBoomFraction(pivot, eye, obstacles, groundHeight);
    boom = Math.min(safeBoom, boom + (safeBoom - boom) * (1 - Math.exp(-7 * delta)));
    camera.position.copy(pivot).lerp(eye, boom);
    camera.position.y = Math.max(camera.position.y, groundHeight(camera.position.x, camera.position.z) + 0.82);

    const forward = (portrait ? 3.35 : 3.90) * (1 + 0.52 * (zoom - 1));
    const shoulder = portrait ? 0.13 : 0.35;
    const targetHeight = (portrait ? 1.06 : 1.70) + 1.85 * (zoom - 1)
      - Math.tan(pitch) * (5.9 + 5.2 * (zoom - 1));
    focus.set(pivot.x + shoulder * c - forward * s, ground + targetHeight, pivot.z - shoulder * s - forward * c);
    camera.lookAt(focus);
    initialized = true;

    return Math.hypot(player.x - pivot.x, player.z - pivot.z) > 0.006
      || Math.abs(turn) > 0.002 || Math.abs(look.pitch - pitch) > 0.001
      || Math.abs(zoom - targetZoom) > 0.002 || safeBoom - boom > 0.002 || elevation - safeHeight > 0.005;
  };
}
