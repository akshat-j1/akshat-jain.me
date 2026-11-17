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

export function createInput() {
  const held = new Map<string, Direction>();
  return {
    set(id: string, direction: Direction) {
      held.set(id, direction);
    },
    release(id: string) {
      held.delete(id);
    },
    clear() {
      held.clear();
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
