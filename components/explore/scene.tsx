"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState, type RefObject } from "react";
import { ACESFilmicToneMapping, Group, PCFShadowMap, Quaternion, Vector3 } from "three";
import { disposeSurfaceAssets, loadSurfaceAssets, type SurfaceAssets } from "./asset-loader";
import { createAstronautMotion } from "./astronaut";
import { createCameraRig, type CameraLook } from "./camera";
import { CelestialField } from "./celestial";
import { FootfallDust } from "./footfall-dust";
import type { ExploreInput } from "./input";
import { sunlight } from "./lighting";
import { lowerQuality, qualityTiers, type Quality } from "./quality";
import { CommunicationsRelay } from "./relay";
import { createWalker, groundHeight, nearRelay, spawn, stepWalker } from "./simulation";
import { Terrain } from "./terrain";

export type SceneProps = {
  input: ExploreInput;
  wakeRef: RefObject<() => void>;
  paused: RefObject<boolean>;
  quality: Quality;
  auto: boolean;
  observing: boolean;
  lookRef: RefObject<CameraLook>;
  onReady: () => void;
  onFailure: () => void;
  onNear: (near: boolean) => void;
  onInspect: () => void;
  onLowerQuality: (quality: Quality) => void;
};

const worldUp = new Vector3(0, 1, 0);

function RendererLifecycle({ wakeRef, onFailure }: Pick<SceneProps, "wakeRef" | "onFailure">) {
  const { gl, invalidate } = useThree();
  useEffect(() => {
    const canvas = gl.domElement;
    const contextLost = (event: Event) => {
      event.preventDefault();
      onFailure();
    };
    wakeRef.current = invalidate;
    canvas.addEventListener("webglcontextlost", contextLost);
    return () => {
      wakeRef.current = () => {};
      canvas.removeEventListener("webglcontextlost", contextLost);
    };
  }, [gl, invalidate, onFailure, wakeRef]);
  return null;
}

function Traverse({ assets, props, lookRef }: { assets: SurfaceAssets; props: SceneProps; lookRef: RefObject<CameraLook> }) {
  const player = useRef(createWalker());
  const model = useRef<Group>(null);
  const motion = useRef<ReturnType<typeof createAstronautMotion> | null>(null);
  const [cameraRig] = useState(createCameraRig);
  const [close, setClose] = useState(false);
  const proximity = useRef(false);
  const ready = useRef(false);
  const awakeFor = useRef(0.75);
  const performance = useRef({ frames: 0, slow: 0 });
  const { invalidate } = useThree();

  useEffect(() => {
    const animation = createAstronautMotion(assets.astronaut);
    motion.current = animation;
    invalidate();
    return () => {
      motion.current = null;
      animation.dispose();
    };
  }, [assets, invalidate]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (!document.hidden && !props.paused.current) invalidate();
    }, 84);
    return () => window.clearInterval(timer);
  }, [invalidate, props.paused]);

  useFrame(({ camera, size }, delta) => {
    if (document.hidden || !motion.current || !model.current) return;
    const seconds = delta > 0.15 ? 1 / 60 : Math.min(delta, 0.1);
    const walker = player.current;
    lookRef.current.observing = props.observing;
    const moving = !props.paused.current && props.input.moving;
    if (props.paused.current) {
      walker.vx = walker.vz = walker.speed = 0;
    } else {
      stepWalker(walker, props.input.axis("left", "right"), props.input.axis("up", "down"), seconds);
    }

    const terrainStep = 0.42;
    const slopeX = (groundHeight(walker.x + terrainStep, walker.z) - groundHeight(walker.x - terrainStep, walker.z)) / (terrainStep * 2);
    const slopeZ = (groundHeight(walker.x, walker.z + terrainStep) - groundHeight(walker.x, walker.z - terrainStep)) / (terrainStep * 2);
    const terrainNormal = new Vector3(-slopeX, 1, -slopeZ).normalize();
    const surfaceAlignment = new Quaternion().setFromUnitVectors(worldUp, terrainNormal);
    const heading = new Quaternion().setFromAxisAngle(worldUp, walker.heading);
    model.current.quaternion.slerp(surfaceAlignment.multiply(heading), 1 - Math.exp(-7 * seconds));
    model.current.position.set(walker.x, groundHeight(walker.x, walker.z) + motion.current.groundOffset, walker.z);
    motion.current.update(walker.speed, seconds, groundHeight);
    const tracking = cameraRig(camera, walker, size.width, size.height, seconds, lookRef.current);
    const nearby = nearRelay(walker);
    if (proximity.current !== nearby) {
      proximity.current = nearby;
      setClose(nearby);
      props.onNear(nearby);
    }

    if (!ready.current) {
      ready.current = true;
      props.onReady();
    }

    const sample = performance.current;
    if (moving && props.auto && delta < 0.25) {
      sample.frames++;
      if (delta > 0.039) sample.slow++;
      if (sample.frames >= 72) {
        if (sample.slow >= 49 && props.quality !== "lite") props.onLowerQuality(lowerQuality(props.quality));
        sample.frames = sample.slow = 0;
      }
    } else {
      sample.frames = sample.slow = 0;
    }

    awakeFor.current = moving ? 0.24 : awakeFor.current - seconds;
    if (!props.paused.current && (moving || walker.speed > 0.015 || tracking || awakeFor.current > 0)) invalidate();
  });

  const shadowSize = qualityTiers[props.quality].shadows;
  return (
    <>
      <color attach="background" args={["#040506"]} />
      <hemisphereLight color="#d6dce5" groundColor="#898782" intensity={0.29} />
      <directionalLight
        position={sunlight}
        intensity={5.4}
        color="#fffdf8"
        castShadow={shadowSize > 0}
        shadow-mapSize={[shadowSize || 512, shadowSize || 512]}
        shadow-camera-left={-18}
        shadow-camera-right={18}
        shadow-camera-top={18}
        shadow-camera-bottom={-21}
        shadow-camera-far={86}
        shadow-bias={-0.00018}
        shadow-normalBias={0.014}
      />
      <Terrain soil={assets.soil} normal={assets.normal} quality={props.quality} />
      <CelestialField albedo={assets.earth} clouds={assets.earthClouds} />
      <CommunicationsRelay active={close} onInspect={props.onInspect} />
      <FootfallDust walker={player} />
      <group ref={model} position={[spawn.x, 0, spawn.z]} rotation={[0, Math.PI, 0]}>
        <primitive object={assets.astronaut.scene} />
      </group>
    </>
  );
}

export default function LunarScene(props: SceneProps) {
  const [assets, setAssets] = useState<SurfaceAssets | null>(null);
  const { lookRef } = props;
  const { onFailure } = props;
  useEffect(() => {
    const controller = new AbortController();
    let loaded: SurfaceAssets | undefined;
    loadSurfaceAssets(controller.signal).then((result) => {
      if (controller.signal.aborted) {
        disposeSurfaceAssets(result);
        return;
      }
      loaded = result;
      setAssets(result);
    }).catch(() => {
      if (!controller.signal.aborted) onFailure();
    });

    return () => {
      controller.abort();
      if (loaded) disposeSurfaceAssets(loaded);
    };
  }, [onFailure]);

  if (!assets) return null;

  return (
    <Canvas
      aria-hidden="true"
      frameloop="demand"
      dpr={[1, qualityTiers[props.quality].dpr]}
      shadows={qualityTiers[props.quality].shadows > 0 ? { type: PCFShadowMap } : false}
      camera={{ fov: 48, near: 0.12, far: 660, position: [2.6, 3.3, 9.75] }}
      gl={{ antialias: false, alpha: false, powerPreference: "default", toneMapping: ACESFilmicToneMapping }}
    >
      <RendererLifecycle wakeRef={props.wakeRef} onFailure={props.onFailure} />
      <Traverse assets={assets} props={props} lookRef={lookRef} />
    </Canvas>
  );
}
