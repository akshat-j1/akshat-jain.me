export type Direction = "up" | "down" | "left" | "right";

const keys: Partial<Record<string, Direction>> = {
  KeyW: "up", ArrowUp: "up",
  KeyS: "down", ArrowDown: "down",
  KeyA: "left", ArrowLeft: "left",
  KeyD: "right", ArrowRight: "right",
};

export function directionFor(code: string) {
  return keys[code];
}

export function cameraRelativeAxes(horizontal: number, vertical: number, forwardX: number, forwardZ: number) {
  const length = Math.hypot(forwardX, forwardZ);
  if (length < 1e-4) return { x: horizontal, z: vertical };
  // Project the view onto the ground. Screen-right is perpendicular to forward.
  return {
    x: (-forwardZ * horizontal - forwardX * vertical) / length,
    z: (forwardX * horizontal - forwardZ * vertical) / length,
  };
}

export function createInput() {
  const held = new Map<string, Direction>();
  let jump = false;
  return {
    jump() { jump = true; },
    consumeJump() { const queued = jump; jump = false; return queued; },
    set(id: string, direction: Direction) {
      held.set(id, direction);
    },
    release(id: string) {
      held.delete(id);
    },
    has(id: string) {
      return held.has(id);
    },
    clear() {
      held.clear();
      jump = false;
    },
    get moving() {
      return held.size > 0;
    },
    axis(negative: Direction, positive: Direction) {
      let negativeHeld = false;
      let positiveHeld = false;
      for (const direction of held.values()) {
        if (direction === negative) negativeHeld = true;
        if (direction === positive) positiveHeld = true;
      }
      return Number(positiveHeld) - Number(negativeHeld);
    },
  };
}

export type ExploreInput = ReturnType<typeof createInput>;
