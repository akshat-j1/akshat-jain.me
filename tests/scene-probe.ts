import type { Page } from "@playwright/test";

type Traveller = { x: number; z: number; vx: number; vz: number; speed: number; heading: number; y: number; vy: number; grounded: boolean };
type Direction = { x: number; y: number; z: number };
type CameraState = {
  position: Direction & { clone(): Direction };
  getWorldDirection(target: Direction): Direction;
};
type Fiber = {
  child?: Fiber;
  sibling?: Fiber;
  memoizedState?: { memoizedState?: { current?: Traveller }; next?: Fiber["memoizedState"] };
};
type Root = { current: Fiber; containerInfo?: { getState?: () => { camera: CameraState } } };

export function observeExplorer(page: Page) {
  return page.addInitScript(() => {
    const roots = new Set<Root>();
    Object.assign(window, {
      __REACT_DEVTOOLS_GLOBAL_HOOK__: {
        supportsFiber: true,
        inject: () => 1,
        onCommitFiberRoot: (_id: number, root: Root) => {
          if (typeof root.containerInfo?.getState === "function") roots.add(root);
        },
        onCommitFiberUnmount: () => {},
      },
      inspectLunarTraveller: () => {
        // R3F owns a separate renderer root. Inspect it here only in test browsers.
        const root = [...roots].at(-1);
        const camera = root?.containerInfo?.getState?.()?.camera;
        if (!root || !camera) return null;
        const stack: (Fiber | undefined)[] = [root.current];
        while (stack.length) {
          const fiber = stack.pop();
          if (!fiber) continue;
          for (let hook = fiber.memoizedState; hook; hook = hook.next) {
            const traveller = hook.memoizedState?.current;
            if (traveller && Number.isFinite(traveller.heading) && Number.isFinite(traveller.vx)) {
              const view = camera.getWorldDirection(camera.position.clone());
              const length = Math.hypot(view.x, view.z) * traveller.speed;
              return {
                ...traveller,
                alignment: length > 1e-4 ? (traveller.vx * view.x + traveller.vz * view.z) / length : 0,
                viewX: view.x,
                viewZ: view.z,
                cameraY: camera.position.y,
              };
            }
          }
          stack.push(fiber.sibling, fiber.child);
        }
        return null;
      },
    });
  });
}

export function travellerPose(page: Page) {
  return page.evaluate(() => {
    const probe = window as unknown as { inspectLunarTraveller: () => (Traveller & { alignment: number; viewX: number; viewZ: number; cameraY: number }) | null };
    return probe.inspectLunarTraveller();
  });
}
