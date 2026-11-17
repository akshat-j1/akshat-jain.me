import { Vector3, type Camera } from "three";
import { boulders, groundHeight, relay, spawn, type Walker } from "./simulation";

export type CameraLook = { yaw: number; pitch: number; observing: boolean };

export function createCameraRig() {
  const focus = new Vector3(spawn.x, 1.65, spawn.z - 4.3);
  const desiredPosition = new Vector3();
  const desiredFocus = new Vector3();
  const obstacles = [relay, ...boulders];

  return (camera: Camera, player: Walker, width: number, height: number, delta: number, look: CameraLook) => {
    const portrait = width / height < 0.94;
    const ground = groundHeight(player.x, player.z);
    const rotation = look.yaw;
    const cosine = Math.cos(rotation);
    const sine = Math.sin(rotation);
    const zoom = look.observing ? 1.48 : 1;
    const horizontal = look.pitch;
    const baseX = portrait ? 0.28 : 2.6;
    const baseZ = portrait ? 6.25 : 7.25;
    const cameraX = Math.max(-28, Math.min(28, player.x + (baseX * cosine + baseZ * sine) * zoom));
    let cameraZ = player.z + (-baseX * sine + baseZ * cosine) * zoom;
    const focusX = portrait ? 0.08 : 0.9;
    const focusZ = portrait ? -3.75 : -3.6;
    const targetX = focusX * cosine + focusZ * sine;
    const targetZ = -focusX * sine + focusZ * cosine;
    // Pull ahead of any solid directly between the walker and the desired camera.
    for (const { x, z, radius } of obstacles) {
      if (z <= player.z || z >= cameraZ) continue;
      const pathX = player.x + (cameraX - player.x) * (z - player.z) / (cameraZ - player.z);
      if (Math.abs(pathX - x) < radius + 0.35) {
        cameraZ = Math.min(cameraZ, Math.max(player.z + 2.3, z - radius - 0.35));
      }
    }
    const clearance = groundHeight(cameraX, cameraZ) + 1.55;
    const baseHeight = (portrait ? 2.85 : 3.15) * (look.observing ? 1.3 : 1);
    const pitchHeight = Math.tan(horizontal) * Math.hypot(cameraX - player.x, cameraZ - player.z);
    desiredPosition.set(cameraX, Math.max(clearance, ground + baseHeight + pitchHeight), cameraZ);
    const targetHeight = (portrait ? 0.94 : 1.64) + Math.tan(horizontal) * (look.observing ? 8 : 5.5);
    desiredFocus.set(player.x + targetX * (look.observing ? 1.35 : 1), ground + targetHeight, player.z + targetZ * (look.observing ? 1.35 : 1));
    const blend = 1 - Math.exp(-7 * delta);
    camera.position.lerp(desiredPosition, blend);
    focus.lerp(desiredFocus, blend);
    camera.lookAt(focus);
    return camera.position.distanceToSquared(desiredPosition) > 0.0001 || focus.distanceToSquared(desiredFocus) > 0.0001;
  };
}
