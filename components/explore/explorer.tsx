"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import {
  Component,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { moon, type Discovery } from "../../content/worlds";
import type { CameraLook } from "./camera";
import { createInput, directionFor, type Direction } from "./input";
import { SurveyMap, type SurveyPose } from "./survey-map";
import { initialQuality, type Quality, type QualityMode } from "./quality";

const LunarScene = dynamic(() => import("./scene"), { ssr: false });
type Status = "probing" | "reduced" | "loading" | "ready" | "failed";

class SceneBoundary extends Component<
  { children: ReactNode; onFailure: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onFailure();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

const pad = [
  { direction: "up", label: "Move forward", arrow: "↑" },
  { direction: "left", label: "Move left", arrow: "←" },
  { direction: "down", label: "Move backward", arrow: "↓" },
  { direction: "right", label: "Move right", arrow: "→" },
] as const;

export function Explorer({
  destinationName,
  points,
}: {
  destinationName: string;
  points: readonly Discovery[];
}) {
  const [status, setStatus] = useState<Status>("probing");
  const [autoQuality, setAutoQuality] = useState<Quality>("balanced");
  const [qualityMode, setQualityMode] = useState<QualityMode>("auto");
  const [observing, setObserving] = useState(false);
  const [overview, setOverview] = useState(false);
  const [mapPose, setMapPose] = useState<SurveyPose>({
    x: 0,
    z: 2.5,
    heading: Math.PI,
  });
  const [mapOpen, setMapOpen] = useState(false);
  const anchoredLabel = useRef<HTMLDivElement>(null);
  const pose = useRef<SurveyPose>({ x: 0, z: 2.5, heading: Math.PI });
  const mapButton = useRef<HTMLButtonElement>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [looked, setLooked] = useState(false);
  const [nearby, setNearby] = useState<Discovery | null>(null);
  const [showHelp, setShowHelp] = useState(true);
  const [input] = useState(createInput);
  const wake = useRef<() => void>(() => {});
  const paused = useRef(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const inspectButton = useRef<HTMLButtonElement>(null);
  const nearbyRef = useRef<Discovery | null>(null);
  const cameraLook = useRef<CameraLook>({ yaw: 0, pitch: 0, observing: false });
  const lookPointer = useRef<{
    id: number;
    x: number;
    y: number;
    startX: number;
    startY: number;
    started: boolean;
  } | null>(null);
  const walkingLook = useRef({ yaw: 0, pitch: 0 });
  const hasLooked = useRef(false);

  const clearInput = useCallback(() => {
    input.clear();
    lookPointer.current = null;
    wake.current();
  }, [input]);

  const toggleOverview = useCallback(() => {
    clearInput();
    setOverview((value) => {
      if (value) {
        cameraLook.current.yaw = walkingLook.current.yaw;
        cameraLook.current.pitch = walkingLook.current.pitch;
      } else {
        walkingLook.current = {
          yaw: cameraLook.current.yaw,
          pitch: cameraLook.current.pitch,
        };
      }
      cameraLook.current.overview = !value;
      cameraLook.current.focus = undefined;
      return !value;
    });
  }, [clearInput]);

  const openMap = useCallback(() => {
    clearInput();
    paused.current = true;
    setMapPose({ ...pose.current });
    setMapOpen(true);
  }, [clearInput]);

  function closeMap() {
    paused.current = false;
    setMapOpen(false);
    clearInput();
    mapButton.current?.focus({ preventScroll: true });
  }

  const start = useCallback(() => {
    try {
      const probe = document
        .createElement("canvas")
        .getContext("webgl2", { failIfMajorPerformanceCaveat: false });
      if (!probe || probe.isContextLost()) {
        setStatus("failed");
        return;
      }
      setAutoQuality(initialQuality(probe));
      probe.getExtension("WEBGL_lose_context")?.loseContext();
      cameraLook.current.reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      setStatus("loading");
    } catch {
      setStatus("failed");
    }
  }, []);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const respectPreference = () => {
      if (preference.matches) {
        paused.current = false;
        cameraLook.current.overview = false;
        setMapOpen(false);
        setOverview(false);
        clearInput();
        nearbyRef.current = null;
        setNearby(null);
        dialog.current?.close();
        setStatus("reduced");
      }
    };
    const boot = window.requestAnimationFrame(() => {
      if (preference.matches) respectPreference();
      else start();
    });
    preference.addEventListener("change", respectPreference);
    return () => {
      window.cancelAnimationFrame(boot);
      preference.removeEventListener("change", respectPreference);
    };
  }, [clearInput, start]);

  const onReady = useCallback(() => setStatus("ready"), []);
  const onFailure = useCallback(() => {
    clearInput();
    paused.current = false;
    setMapOpen(false);
    setOverview(false);
    nearbyRef.current = null;
    setNearby(null);
    dialog.current?.close();
    setStatus("failed");
  }, [clearInput]);

  const onNear = useCallback((value: Discovery | null) => {
    nearbyRef.current = value;
    setNearby(value);
  }, []);

  const inspect = useCallback(
    (id?: string) => {
      if (
        !nearbyRef.current ||
        (id !== undefined && nearbyRef.current.id !== id) ||
        !dialog.current ||
        dialog.current.open
      )
        return;
      paused.current = true;
      clearInput();
      dialog.current.showModal();
    },
    [clearInput],
  );

  function resume() {
    paused.current = false;
    clearInput();
    inspectButton.current?.focus({ preventScroll: true });
  }

  useEffect(() => {
    if (status !== "ready") return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        paused.current ||
        event.altKey ||
        event.metaKey ||
        event.ctrlKey ||
        (event.target instanceof HTMLElement &&
          event.target.closest("select, input, textarea, [contenteditable]"))
      )
        return;

      if (event.code === "KeyM" && !event.repeat) {
        event.preventDefault();
        openMap();
        return;
      }
      if (event.code === "KeyO" && !event.repeat) {
        event.preventDefault();
        toggleOverview();
        return;
      }
      if (cameraLook.current.overview) {
        if (event.code === "Escape") toggleOverview();
        if (event.code === "ArrowLeft") cameraLook.current.yaw += 0.12;
        if (event.code === "ArrowRight") cameraLook.current.yaw -= 0.12;
        if (event.code.startsWith("Arrow")) event.preventDefault();
        wake.current();
        return;
      }
      if (
        event.code === "Space" &&
        !(
          event.target instanceof HTMLElement &&
          event.target.closest("button, a")
        )
      ) {
        event.preventDefault();
        if (!event.repeat) input.jump();
        wake.current();
        return;
      }
      const direction = directionFor(event.code);
      if (direction) {
        event.preventDefault();
        // Auto-repeat after blur or a modal must not re-arm a released direction.
        if (event.repeat && !input.has(event.code)) return;
        input.set(event.code, direction);
        wake.current();
      } else if (event.code === "KeyE") {
        if (!event.repeat) inspect();
      } else if (event.code === "Escape") {
        clearInput();
        document.querySelector<HTMLElement>(".field-exit")?.focus();
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (!directionFor(event.code)) return;
      input.release(event.code);
      wake.current();
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", clearInput);
    document.addEventListener("visibilitychange", clearInput);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", clearInput);
      document.removeEventListener("visibilitychange", clearInput);
      input.clear();
    };
  }, [clearInput, input, inspect, status, openMap, toggleOverview]);

  useEffect(() => {
    const move = (event: PointerEvent) => {
      const pointer = lookPointer.current;
      if (!pointer || pointer.id !== event.pointerId) return;
      if (paused.current) return;
      if (
        !pointer.started &&
        Math.hypot(
          event.clientX - pointer.startX,
          event.clientY - pointer.startY,
        ) <= 5
      )
        return;
      const dx = event.clientX - pointer.x;
      const dy = event.clientY - pointer.y;
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.started = true;
      if (event.cancelable) event.preventDefault();
      cameraLook.current.yaw =
        (cameraLook.current.yaw - dx * 0.0044) % (Math.PI * 2);
      cameraLook.current.pitch = Math.max(
        -0.51,
        Math.min(0.4, cameraLook.current.pitch + dy * 0.0032),
      );
      if (!hasLooked.current) {
        hasLooked.current = true;
        setLooked(true);
      }
      wake.current();
    };
    const end = (event: PointerEvent) => {
      if (lookPointer.current?.id === event.pointerId)
        lookPointer.current = null;
    };
    const blur = () => {
      lookPointer.current = null;
    };
    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
      window.removeEventListener("blur", blur);
      lookPointer.current = null;
    };
  }, []);

  function touchStart(pointerId: number, direction: Direction) {
    if (paused.current || cameraLook.current.overview) return;
    input.set(`pointer-${pointerId}`, direction);
    wake.current();
  }

  function touchEnd(pointerId: number) {
    input.release(`pointer-${pointerId}`);
    wake.current();
  }

  const running = status === "loading" || status === "ready";
  const quality = qualityMode === "auto" ? autoQuality : qualityMode;

  return (
    <div className="explorer-shell">
      {running && (
        <div
          className="surface-canvas"
          data-testid="surface-canvas"
          data-looked={looked ? "true" : "false"}
          onPointerDown={(event) => {
            if (
              paused.current ||
              lookPointer.current ||
              !(event.target instanceof HTMLCanvasElement) ||
              event.button !== 0
            )
              return;
            lookPointer.current = {
              id: event.pointerId,
              x: event.clientX,
              y: event.clientY,
              startX: event.clientX,
              startY: event.clientY,
              started: false,
            };
          }}
        >
          <SceneBoundary onFailure={onFailure}>
            <LunarScene
              input={input}
              wakeRef={wake}
              paused={paused}
              quality={quality}
              auto={qualityMode === "auto"}
              points={points}
              overview={overview}
              observing={observing}
              lookRef={cameraLook}
              poseRef={pose}
              labelRef={anchoredLabel}
              onReady={onReady}
              onFailure={onFailure}
              onNear={onNear}
              onInspect={inspect}
              onLowerQuality={setAutoQuality}
            />
          </SceneBoundary>
        </div>
      )}

      {(status === "probing" || status === "loading") && (
        <section className="scene-fallback scene-loading" aria-busy="true">
          <h1>Approaching the surface</h1>
          <p role="status">Loading the lunar scene…</p>
          <Link className="field-button field-secondary" href="/work">
            View Portfolio <span aria-hidden="true">↗</span>
          </Link>
        </section>
      )}
      {(status === "failed" || status === "reduced") && (
        <section className="scene-fallback">
          <h1>
            {status === "reduced"
              ? "Choose your view"
              : "The lunar scene is unavailable"}
          </h1>
          <p>
            {status === "reduced"
              ? "Reduced motion is enabled. You can read the portfolio or choose to start the interactive scene."
              : "You can browse the portfolio directly."}
          </p>
          <div className="field-actions">
            <Link className="field-button field-primary" href="/work">
              View Portfolio <span aria-hidden="true">↗</span>
            </Link>
            {status === "reduced" && (
              <button className="field-button field-secondary" onClick={start}>
                Start interactive scene
              </button>
            )}
          </div>
        </section>
      )}

      {status === "ready" && (
        <div className="surface-interface" data-overview={overview}>
          <div
            ref={anchoredLabel}
            className="site-label"
            aria-hidden="true"
            hidden={!nearby || overview}
          >
            <span>{nearby?.name}</span>
            <small>
              {nearby?.project.demo ? "Scenic discovery" : nearby?.project.name}{" "}
              · E to inspect
            </small>
          </div>
          <div className="surface-guide">
            <h1>
              {overview
                ? "A wider perspective"
                : (nearby?.name ?? destinationName)}
            </h1>
            {points.length > 0 && (
              <p role="status">
                {nearby
                  ? "Within reach"
                  : "Follow the lights. Discover what lies beyond."}
              </p>
            )}
            <span className="touch-instruction">
              Hold a direction to walk · drag to look
            </span>
          </div>
          <div className="surface-tools">
            <button
              ref={mapButton}
              className="surface-observe"
              onClick={openMap}
              aria-haspopup="dialog"
            >
              Map <span className="tool-key">M</span>
            </button>
            <button
              className="surface-observe"
              aria-pressed={overview}
              onClick={toggleOverview}
            >
              {overview ? "Return to Exploration" : "World overview"}
            </button>
            {!overview && (
              <button
                type="button"
                className="surface-observe"
                aria-pressed={observing}
                aria-label={
                  observing
                    ? "Return to walking view"
                    : "Open wider observation view"
                }
                onClick={() => {
                  setObserving((value) => !value);
                  wake.current();
                }}
              >
                {observing ? "Walking view" : "Observe"}
              </button>
            )}
            <div className="surface-quality">
              <button
                type="button"
                className="surface-settings"
                aria-label="Scene settings"
                aria-expanded={settingsOpen}
                onClick={() => setSettingsOpen((open) => !open)}
              >
                Scene{" "}
                <span aria-hidden="true">{settingsOpen ? "−" : "＋"}</span>
              </button>
              {settingsOpen && (
                <label>
                  <span>Rendering quality</span>
                  <select
                    aria-label="Rendering quality"
                    value={qualityMode}
                    onChange={(event) =>
                      setQualityMode(event.target.value as QualityMode)
                    }
                  >
                    <option value="auto">Auto ({autoQuality})</option>
                    <option value="high">High</option>
                    <option value="balanced">Balanced</option>
                    <option value="lite">Lite</option>
                  </select>
                </label>
              )}
            </div>
          </div>
          {overview && (
            <nav className="overview-locations" aria-label="Survey landmarks">
              {[moon.arrival, ...moon.installations].map((site) => (
                <button
                  key={site.id}
                  onClick={() => {
                    cameraLook.current.focus = site;
                    wake.current();
                  }}
                >
                  {site.name}
                </button>
              ))}
            </nav>
          )}
          {overview && (
            <div className="overview-guide">
              <p>Drag to orbit · ← → to rotate</p>
              <button
                aria-label="Rotate overview left"
                onClick={() => {
                  cameraLook.current.yaw += 0.35;
                  wake.current();
                }}
              >
                ↶
              </button>
              <button
                aria-label="Rotate overview right"
                onClick={() => {
                  cameraLook.current.yaw -= 0.35;
                  wake.current();
                }}
              >
                ↷
              </button>
              <button
                aria-label="Zoom overview in"
                onClick={() => {
                  cameraLook.current.distance = Math.max(
                    2.8,
                    (cameraLook.current.distance ?? 4.5) - 0.5,
                  );
                  wake.current();
                }}
              >
                ＋
              </button>
              <button
                aria-label="Zoom overview out"
                onClick={() => {
                  cameraLook.current.distance = Math.min(
                    6,
                    (cameraLook.current.distance ?? 4.5) + 0.5,
                  );
                  wake.current();
                }}
              >
                −
              </button>
            </div>
          )}
          <div className="surface-actions" hidden={overview}>
            {showHelp ? (
              <div className="surface-help">
                <p>
                  <span className="desktop-help">
                    <kbd>W</kbd>
                    <kbd>A</kbd>
                    <kbd>S</kbd>
                    <kbd>D</kbd> or arrows to move
                  </span>
                  <span className="touch-help">Hold an arrow to walk</span>
                </p>
                <button
                  aria-label="Hide movement controls help"
                  onClick={() => setShowHelp(false)}
                >
                  ×
                </button>
              </div>
            ) : (
              <button
                className="help-trigger"
                onClick={() => setShowHelp(true)}
              >
                Controls
              </button>
            )}
            <div className="touch-pad" role="group" aria-label="Touch movement">
              {pad.map(({ direction, label, arrow }) => (
                <button
                  key={direction}
                  type="button"
                  aria-label={label}
                  className={`pad-${direction}`}
                  onPointerDown={(event) => {
                    if (event.button !== 0) return;
                    event.preventDefault();
                    event.currentTarget.setPointerCapture(event.pointerId);
                    touchStart(event.pointerId, direction);
                  }}
                  onPointerUp={(event) => touchEnd(event.pointerId)}
                  onPointerCancel={(event) => touchEnd(event.pointerId)}
                  onLostPointerCapture={(event) => touchEnd(event.pointerId)}
                  onContextMenu={(event) => event.preventDefault()}
                >
                  {arrow}
                </button>
              ))}
            </div>
            <button
              className="surface-jump"
              aria-label="Jump"
              onPointerDown={(event) => {
                event.preventDefault();
                if (!paused.current) {
                  input.jump();
                  wake.current();
                }
              }}
              onClick={(event) => {
                if (event.detail === 0 && !paused.current) {
                  input.jump();
                  wake.current();
                }
              }}
            >
              Jump <span className="tool-key">Space</span>
            </button>
            {nearby && (
              <button
                ref={inspectButton}
                className="field-button field-primary surface-inspect"
                onClick={() => inspect()}
                aria-haspopup="dialog"
              >
                <kbd aria-hidden="true">E</kbd> {nearby.action}{" "}
                <span aria-hidden="true">↗</span>
              </button>
            )}
          </div>
        </div>
      )}

      {mapOpen && (
        <SurveyMap
          pose={mapPose}
          points={points}
          onClose={closeMap}
          onSurvey={(point) => {
            closeMap();
            if (!cameraLook.current.overview)
              walkingLook.current = {
                yaw: cameraLook.current.yaw,
                pitch: cameraLook.current.pitch,
              };
            cameraLook.current.overview = true;
            cameraLook.current.focus = point;
            setOverview(true);
            wake.current();
          }}
        />
      )}
      <dialog
        className="explore-dialog"
        ref={dialog}
        onClose={resume}
        aria-labelledby="discovery-project-title"
      >
        {nearby && (
          <div className="dialog-inner">
            <p className="dialog-location">
              {nearby.label} · {nearby.name}
            </p>
            <button
              className="dialog-close"
              onClick={() => dialog.current?.close()}
              aria-label="Close project entry"
              autoFocus
            >
              ×
            </button>
            {nearby.project.demo && (
              <p className="demo-label">Interactive world demo</p>
            )}
            <h2 id="discovery-project-title">{nearby.project.name}</h2>
            {nearby.project.summary && <p>{nearby.project.summary}</p>}
            {nearby.project.preparing && (
              <p>This case study is in preparation.</p>
            )}
            {nearby.project.demo ? (
              <button
                className="field-button field-secondary"
                onClick={() => dialog.current?.close()}
              >
                Continue exploring
              </button>
            ) : (
              <Link
                className="field-button field-primary"
                prefetch={false}
                href={nearby.project.href}
              >
                View project entry <span aria-hidden="true">↗</span>
              </Link>
            )}
          </div>
        )}
      </dialog>
    </div>
  );
}
