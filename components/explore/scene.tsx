"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState, type RefObject } from "react";
import { AgXToneMapping, Group, PCFShadowMap, Quaternion, Vector3 } from "three";
import { disposeSurfaceAssets, loadSurfaceAssets, type SurfaceAssets } from "./asset-loader";
import { createAstronautMotion } from "./astronaut";
import { createCameraRig, type CameraLook } from "./camera";
import { CelestialField } from "./celestial";
import { Bootprints } from "./bootprints";
import { FootfallDust } from "./footfall-dust";
import { cameraRelativeAxes, type ExploreInput } from "./input";
import { sunlight } from "./lighting";
import { lowerQuality, qualityTiers, type Quality } from "./quality";
import { CommunicationsRelay } from "./relay";
import { createWalker, groundHeight, relay, spawn, stepWalker } from "./simulation";
import { RimOutcrop } from "./rim-outcrop";
import { SurveyFerry } from "./survey-ferry";
import { Terrain } from "./terrain";

import { ferryHatch, nearestDiscovery, type Discovery } from "../../content/worlds";

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
  points: readonly Discovery[];
  onNear: (point: Discovery | null) => void;
  onInspect: (id: string) => void;
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
  const viewForward = useRef(new Vector3());
  const terrainNormal = useRef(new Vector3());
  const surfaceAlignment = useRef(new Quaternion());
  const heading = useRef(new Quaternion());
  const [activeId, setActiveId] = useState<string | null>(null);
  const proximity = useRef<Discovery | null>(null);
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
    if (props.paused.current) {
      walker.vx = walker.vz = walker.speed = 0;
      return;
    }
    lookRef.current.observing = props.observing;
    const horizontal = props.input.axis("left", "right");
    const vertical = props.input.axis("up", "down");
    const moving = horizontal !== 0 || vertical !== 0;
    camera.getWorldDirection(viewForward.current);
    const { x, z } = cameraRelativeAxes(horizontal, vertical, viewForward.current.x, viewForward.current.z);
    stepWalker(walker, x, z, seconds);

    const terrainStep = 0.42;
    const slopeX = (groundHeight(walker.x + terrainStep, walker.z) - groundHeight(walker.x - terrainStep, walker.z)) / (terrainStep * 2);
    const slopeZ = (groundHeight(walker.x, walker.z + terrainStep) - groundHeight(walker.x, walker.z - terrainStep)) / (terrainStep * 2);
    const slope = Math.max(1, Math.hypot(slopeX, slopeZ) / 0.26);
    terrainNormal.current.set(-slopeX / slope, 1, -slopeZ / slope).normalize();
    surfaceAlignment.current.setFromUnitVectors(worldUp, terrainNormal.current);
    heading.current.setFromAxisAngle(worldUp, walker.heading);
    model.current.quaternion.slerp(surfaceAlignment.current.multiply(heading.current), 1 - Math.exp(-10 * seconds));
    model.current.position.set(walker.x, groundHeight(walker.x, walker.z) + motion.current.groundOffset, walker.z);
    const animating = motion.current.update(walker.speed, seconds, groundHeight);
    const tracking = cameraRig(camera, walker, size.width, size.height, seconds, lookRef.current);
    const nearby = nearestDiscovery(props.points, walker.x, walker.z);
    if (proximity.current !== nearby) {
      proximity.current = nearby;
      setActiveId(nearby?.id ?? null);
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
    if (moving || animating || walker.speed > 0.015 || tracking || awakeFor.current > 0) invalidate();
  });

  const shadowSize = qualityTiers[props.quality].shadows;
  return (
    <>
      <color attach="background" args={["#040506"]} />
      <hemisphereLight color="#d1ddff" groundColor="#aba6a4" intensity={0.94} />
      <directionalLight
        position={sunlight}
        intensity={5.78}
        color="#fff1de"
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
      <Terrain faultRock={assets.faultRock} rocks={assets.rocks} soil={assets.soil} normal={assets.normal} detail={assets.ejecta} craterSurface={assets.craterSurface} quality={props.quality} />
      <CelestialField brightStars={assets.brightStars} galaxy={assets.galaxy} albedo={assets.earth} clouds={assets.earthClouds} />
      <CommunicationsRelay active={activeId === relay.id} onInspect={() => props.onInspect(relay.id)} />
      <RimOutcrop strata={assets.strata} soil={assets.soil} normal={assets.normal} />
      <SurveyFerry onInspect={activeId === ferryHatch.id ? () => props.onInspect(ferryHatch.id) : undefined} />
      <Bootprints walker={player} />
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
      gl={{ antialias: false, alpha: false, powerPreference: "default", toneMapping: AgXToneMapping, toneMappingExposure: 1.21 }}
    >
      <RendererLifecycle wakeRef={props.wakeRef} onFailure={props.onFailure} />
      <Traverse assets={assets} props={props} lookRef={lookRef} />
    </Canvas>
  );
}
