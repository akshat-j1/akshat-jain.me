import { AnimationClip, AnimationMixer, Bone, Box3, Quaternion, QuaternionKeyframeTrack, Vector3 } from "three";
import type { GLTF } from "three/addons/loaders/GLTFLoader.js";
import { toeGroundCorrection } from "./foot-contact";

export function createAstronautMotion({ scene, animations }: GLTF) {
  const source = animations.find((clip) => clip.name.toLowerCase() === "walk");
  if (!source) throw new Error("The spacesuit walk animation is missing");

  const walk = source.clone();
  const hips = scene.getObjectByName("Hips");
  for (const track of walk.tracks) {
    if (track.name !== "Hips.position" || !hips) continue;
    for (let i = 0; i < track.values.length; i += 3) {
      track.values[i] = hips.position.x;
      track.values[i + 2] = hips.position.z;
    }
  }

  const idleTracks: QuaternionKeyframeTrack[] = [];
  const spine = scene.getObjectByName("Spine");
  const toes = [scene.getObjectByName("LeftToeBase"), scene.getObjectByName("RightToeBase")].filter((bone): bone is Bone => bone instanceof Bone);
  if (spine) {
    const lift = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), 0.017);
    const atRest = spine.quaternion;
    idleTracks.push(new QuaternionKeyframeTrack("Spine.quaternion", [0, 1.35, 2.7], [
      ...atRest.toArray(), ...atRest.clone().multiply(lift).toArray(), ...atRest.toArray(),
    ]));
  }

  // Use relaxed upper-body poses from the supplied walk cycle for the authored idle.
  for (const name of ["LeftArm", "RightArm", "LeftForeArm", "RightForeArm", "LeftShoulder", "RightShoulder"]) {
    const bone = scene.getObjectByName(name);
    const track = walk.tracks.find((candidate) => candidate.name === `${name}.quaternion`);
    if (!(bone instanceof Bone) || !track) continue;
    const start = new Quaternion().fromArray(track.values, 0);
    const midpoint = new Quaternion().fromArray(track.values, Math.floor(track.times.length / 2) * 4);
    bone.quaternion.copy(start.slerp(midpoint, 0.5));
  }

  const floatTracks: QuaternionKeyframeTrack[] = [];
  for (const [name, angle] of [["LeftUpLeg", -.20], ["RightUpLeg", -.13], ["LeftLeg", .35], ["RightLeg", .28]] as const) {
    const bone = scene.getObjectByName(name);
    if (!(bone instanceof Bone)) continue;
    const pose = bone.quaternion.clone().multiply(new Quaternion().setFromAxisAngle(new Vector3(1,0,0), angle));
    floatTracks.push(new QuaternionKeyframeTrack(name + ".quaternion", [0, 1], [...pose.toArray(), ...pose.toArray()]));
  }
  scene.updateMatrixWorld(true);
  const bounds = new Box3().setFromObject(scene, true);
  const groundOffset = -bounds.min.y;
  const mixer = new AnimationMixer(scene);
  const stride = mixer.clipAction(walk).play();
  const idle = mixer.clipAction(new AnimationClip("Breathing", 2.7, idleTracks)).play();
  const floating = mixer.clipAction(new AnimationClip("Low gravity", 1, floatTracks)).play();
  let floatWeight = 0;
  const toePosition = new Vector3();
  let weight = 0;
  let lift = 0;

  return {
    groundOffset,
    update(speed: number, delta: number, groundAt: (x: number, z: number) => number, airborne = false) {
      const target = airborne ? .17 : Math.min(1, speed / 1.6);
      weight += (target - weight) * (1 - Math.exp(-12 * delta));
      if (target === 0 && weight < 0.012) weight = 0;
      floatWeight += ((airborne ? .8 : 0) - floatWeight) * (1 - Math.exp(-10 * delta));
      floating.weight = floatWeight;
      stride.weight = weight * (1 - floatWeight);
      stride.timeScale = airborne ? .2 : Math.max(0.55, speed / 2.1);
      idle.weight = (1 - weight) * (1 - floatWeight);
      mixer.update(delta);
      if (airborne) lift = 0;
      if (!airborne && toes.length && scene.parent) {
        scene.parent.position.y += lift;
        scene.updateWorldMatrix(true, true);
        let lowestClearance = Number.POSITIVE_INFINITY;
        for (const toe of toes) {
          toe.getWorldPosition(toePosition);
          lowestClearance = Math.min(lowestClearance, toePosition.y - groundAt(toePosition.x, toePosition.z));
        }
        // Toe joints sit just above the sole. Keep small corrections across frames.
        const groundedLift = Math.max(-0.12, Math.min(0.12, lift + toeGroundCorrection(lowestClearance - 0.025, delta)));
        if (groundedLift !== lift) {
          scene.parent.position.y += groundedLift - lift;
          lift = groundedLift;
          scene.parent.updateMatrixWorld(true);
        }
      }
      return weight > 0;
    },
    dispose() {
      mixer.stopAllAction();
      mixer.uncacheRoot(scene);
    },
  };
}
