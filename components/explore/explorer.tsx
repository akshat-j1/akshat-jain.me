"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Component, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { meetflix } from "../../content/projects";
import type { CameraLook } from "./camera";
import { createInput, directionFor, type Direction } from "./input";
import { initialQuality, type Quality, type QualityMode } from "./quality";

const LunarScene = dynamic(() => import("./scene"), { ssr: false });
type Status = "probing" | "reduced" | "loading" | "ready" | "failed";

class SceneBoundary extends Component<{ children: ReactNode; onFailure: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFailure(); }
  render() { return this.state.failed ? null : this.props.children; }
}

const pad = [
  { direction: "up", label: "Move forward", arrow: "↑" },
  { direction: "left", label: "Move left", arrow: "←" },
  { direction: "down", label: "Move backward", arrow: "↓" },
  { direction: "right", label: "Move right", arrow: "→" },
] as const;

export function Explorer() {
  const [status, setStatus] = useState<Status>("probing");
  const [autoQuality, setAutoQuality] = useState<Quality>("balanced");
  const [qualityMode, setQualityMode] = useState<QualityMode>("auto");
  const [observing, setObserving] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [looked, setLooked] = useState(false);
  const [nearby, setNearby] = useState(false);
  const [showHelp, setShowHelp] = useState(true);
  const [input] = useState(createInput);
  const wake = useRef<() => void>(() => {});
  const paused = useRef(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const inspectButton = useRef<HTMLButtonElement>(null);
  const nearbyRef = useRef(false);
  const cameraLook = useRef<CameraLook>({ yaw: 0, pitch: 0, observing: false });
  const lookPointer = useRef<{ id: number; x: number; y: number; startX: number; startY: number; started: boolean } | null>(null);
  const hasLooked = useRef(false);

  const clearInput = useCallback(() => {
    input.clear();
    lookPointer.current = null;
    wake.current();
  }, [input]);

  const start = useCallback(() => {
    try {
      const probe = document.createElement("canvas").getContext("webgl2", { failIfMajorPerformanceCaveat: false });
      if (!probe || probe.isContextLost()) {
        setStatus("failed");
        return;
      }
      setAutoQuality(initialQuality(probe));
      probe.getExtension("WEBGL_lose_context")?.loseContext();
      setStatus("loading");
    } catch {
      setStatus("failed");
    }
  }, []);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const respectPreference = () => {
      if (preference.matches) {
        clearInput();
        nearbyRef.current = false;
        setNearby(false);
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
    nearbyRef.current = false;
    setNearby(false);
    dialog.current?.close();
    setStatus("failed");
  }, [clearInput]);

  const onNear = useCallback((value: boolean) => {
    nearbyRef.current = value;
    setNearby(value);
  }, []);

  const inspect = useCallback(() => {
    if (!nearbyRef.current || !dialog.current || dialog.current.open) return;
    paused.current = true;
    clearInput();
    dialog.current.showModal();
  }, [clearInput]);

  function resume() {
    paused.current = false;
    clearInput();
    inspectButton.current?.focus({ preventScroll: true });
  }

  useEffect(() => {
    if (status !== "ready") return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (paused.current || event.altKey || event.metaKey || event.ctrlKey
        || (event.target instanceof HTMLElement && event.target.closest("select, input, textarea, [contenteditable]"))) return;

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
  }, [clearInput, input, inspect, status]);

  useEffect(() => {
    const move = (event: PointerEvent) => {
      const pointer = lookPointer.current;
      if (!pointer || pointer.id !== event.pointerId) return;
      if (paused.current) return;
      if (!pointer.started && Math.hypot(event.clientX - pointer.startX, event.clientY - pointer.startY) <= 5) return;
      const dx = event.clientX - pointer.x;
      const dy = event.clientY - pointer.y;
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.started = true;
      if (event.cancelable) event.preventDefault();
      cameraLook.current.yaw = (cameraLook.current.yaw - dx * 0.0044) % (Math.PI * 2);
      cameraLook.current.pitch = Math.max(-0.51, Math.min(0.40, cameraLook.current.pitch + dy * 0.0032));
      if (!hasLooked.current) {
        hasLooked.current = true;
        setLooked(true);
      }
      wake.current();
    };
    const end = (event: PointerEvent) => {
      if (lookPointer.current?.id === event.pointerId) lookPointer.current = null;
    };
    const blur = () => { lookPointer.current = null; };
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
    if (paused.current) return;
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
            if (paused.current || lookPointer.current || !(event.target instanceof HTMLCanvasElement) || event.button !== 0) return;
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
              input={input} wakeRef={wake} paused={paused} quality={quality} auto={qualityMode === "auto"}
              observing={observing} lookRef={cameraLook}
              onReady={onReady} onFailure={onFailure} onNear={onNear}
              onInspect={inspect} onLowerQuality={setAutoQuality}
            />
          </SceneBoundary>
        </div>
      )}

      {(status === "probing" || status === "loading") && (
        <section className="scene-fallback scene-loading" aria-busy="true">
          <h1>Approaching the surface</h1>
          <p role="status">Loading the lunar scene…</p>
          <Link className="field-button field-secondary" href="/work">View Portfolio <span aria-hidden="true">↗</span></Link>
        </section>
      )}
      {(status === "failed" || status === "reduced") && (
        <section className="scene-fallback">
          <h1>{status === "reduced" ? "Choose your view" : "The lunar scene is unavailable"}</h1>
          <p>{status === "reduced" ? "Reduced motion is enabled. You can read the portfolio or choose to start the interactive scene." : "You can still access the project from the portfolio."}</p>
          <div className="field-actions">
            <Link className="field-button field-primary" href="/work">View Portfolio <span aria-hidden="true">↗</span></Link>
            {status === "reduced" && <button className="field-button field-secondary" onClick={start}>Start interactive scene</button>}
          </div>
        </section>
      )}

      {status === "ready" && (
        <div className="surface-interface">
          <div className="surface-guide">
            <h1>{meetflix.location}</h1>
            <p role="status">{nearby ? "Relay within reach" : "Walk toward the dish to open the project."}</p>
            <span className="touch-instruction">Hold a direction to walk · drag to look</span>
          </div>
          <div className="surface-tools">
            <button
              type="button"
              className="surface-observe"
              aria-pressed={observing}
              aria-label={observing ? "Return to walking view" : "Open wider observation view"}
              onClick={() => {
                setObserving((value) => !value);
                wake.current();
              }}
            >
              {observing ? "Walking view" : "Observe"}
            </button>
            <div className="surface-quality">
              <button
                type="button"
                className="surface-settings"
                aria-label="Scene settings"
                aria-expanded={settingsOpen}
                onClick={() => setSettingsOpen((open) => !open)}
              >
                Scene <span aria-hidden="true">{settingsOpen ? "−" : "＋"}</span>
              </button>
              {settingsOpen && (
                <label>
                  <span>Rendering quality</span>
                  <select aria-label="Rendering quality" value={qualityMode} onChange={(event) => setQualityMode(event.target.value as QualityMode)}>
                    <option value="auto">Auto ({autoQuality})</option>
                    <option value="high">High</option>
                    <option value="balanced">Balanced</option>
                    <option value="lite">Lite</option>
                  </select>
                </label>
              )}
            </div>
          </div>
          <div className="surface-actions">
            {showHelp ? (
              <div className="surface-help">
                <p><span className="desktop-help"><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> or arrows to move</span><span className="touch-help">Hold an arrow to walk</span></p>
                <button aria-label="Hide movement controls help" onClick={() => setShowHelp(false)}>×</button>
              </div>
            ) : <button className="help-trigger" onClick={() => setShowHelp(true)}>Controls</button>}
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
            {nearby && (
              <button ref={inspectButton} className="field-button field-primary surface-inspect" onClick={inspect} aria-haspopup="dialog">
                <kbd aria-hidden="true">E</kbd> Inspect relay <span aria-hidden="true">↗</span>
              </button>
            )}
          </div>
        </div>
      )}

      <dialog className="explore-dialog" ref={dialog} onClose={resume} aria-labelledby="relay-project-title">
        <div className="dialog-inner">
          <p className="dialog-location">{meetflix.station} · {meetflix.location}</p>
          <button className="dialog-close" onClick={() => dialog.current?.close()} aria-label="Close relay entry" autoFocus>×</button>
          <h2 id="relay-project-title">{meetflix.name}</h2>
          <p>This case study is in preparation.</p>
          <Link className="field-button field-primary" href={meetflix.href}>View project entry <span aria-hidden="true">↗</span></Link>
        </div>
      </dialog>
    </div>
  );
}
