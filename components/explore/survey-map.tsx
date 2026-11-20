import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { moon, type Discovery } from "../../content/worlds";
import { groundHeight } from "./simulation";

export type SurveyPose = { x: number; z: number; heading: number };
const projectX = (x: number) => (x + 17) * 10;
const projectZ = (z: number) => (z + 27) * 10;

function contourLines() {
  const paths: string[] = [];
  for (let level = -4; level < 8; level += 0.75) {
    let path = "";
    for (let z = -27; z < 14; z += 0.8)
      for (let x = -17; x < 32; x += 0.8) {
        const corners = [
          [x, z],
          [x + 0.8, z],
          [x + 0.8, z + 0.8],
          [x, z + 0.8],
        ];
        const hits: number[][] = [];
        for (let i = 0; i < 4; i++) {
          const a = corners[i],
            b = corners[(i + 1) % 4];
          const ha = groundHeight(a[0], a[1]),
            hb = groundHeight(b[0], b[1]);
          if (ha < level === hb < level) continue;
          const t = (level - ha) / (hb - ha);
          hits.push([
            projectX(a[0] + (b[0] - a[0]) * t),
            projectZ(a[1] + (b[1] - a[1]) * t),
          ]);
        }
        for (let i = 0; i + 1 < hits.length; i += 2)
          path += `M${hits[i][0].toFixed(1)},${hits[i][1].toFixed(1)}L${hits[i + 1][0].toFixed(1)},${hits[i + 1][1].toFixed(1)}`;
      }
    paths.push(path);
  }
  return paths;
}

export function SurveyMap({
  pose,
  points,
  onClose,
  onSurvey,
}: {
  pose: SurveyPose;
  points: readonly Discovery[];
  onClose: () => void;
  onSurvey: (point: { x: number; z: number }) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [selected, setSelected] = useState("relay");
  const contours = useMemo(() => contourLines(), []);
  const locations = [moon.arrival, ...moon.installations];
  const site = locations.find((point) => point.id === selected) ?? moon.arrival;
  const binding = points.find((point) => point.id === site.id);
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  return (
    <dialog
      ref={dialog}
      className="survey-dialog"
      aria-labelledby="survey-title"
      onClose={onClose}
      onKeyDown={(event) => {
        if (event.code === "KeyM") {
          event.preventDefault();
          event.stopPropagation();
          dialog.current?.close();
        }
      }}
    >
      <header className="survey-heading">
        <div>
          <p className="dialog-location">Lunar Field Log · Surface survey</p>
          <h2 id="survey-title">Find your next horizon.</h2>
        </div>
        <button
          onClick={() => dialog.current?.close()}
          aria-label="Close map"
          autoFocus
        >
          ×
        </button>
      </header>
      <div className="survey-layout">
        <div
          className="survey-chart"
          role="group"
          aria-label="Interactive surface map"
        >
          <svg
            viewBox="0 0 490 410"
            aria-hidden="true"
            preserveAspectRatio="none"
          >
            {contours.map((path, i) => (
              <path
                key={i}
                d={path}
                fill="none"
                stroke="#9ab6c4"
                opacity={0.11 + (i % 3) * 0.035}
                strokeWidth=".7"
              />
            ))}
            <path
              d="M170,295 L187,170 L280,168 L365,165"
              fill="none"
              stroke="#e9b486"
              strokeWidth="1"
              strokeDasharray="3 7"
              opacity=".5"
            />
            <g
              transform={`translate(${projectX(pose.x)},${projectZ(pose.z)}) rotate(${(-pose.heading * 180) / Math.PI})`}
            >
              <circle r="12" fill="#d8eced" opacity=".13" />
              <path d="M0,7 L-4,-5 L0,-2 L4,-5 Z" fill="#e4f4f2" />
            </g>
          </svg>
          {locations.map((point) => (
            <button
              key={point.id}
              className={
                selected === point.id ? "survey-pin selected" : "survey-pin"
              }
              style={{
                left: `${(projectX(point.x) / 490) * 100}%`,
                top: `${(projectZ(point.z) / 410) * 100}%`,
              }}
              aria-label={`Select ${point.name}`}
              aria-pressed={selected === point.id}
              onClick={() => setSelected(point.id)}
            >
              <span className="pin-dot" />
              <span>{point.name}</span>
            </button>
          ))}
          <span className="survey-north">N ↑</span>
          <span className="survey-position">△ Your position</span>
        </div>
        <section className="survey-detail" aria-live="polite">
          <p className="dialog-location">{site.label}</p>
          <h3>{site.name}</h3>
          <p>
            {binding?.project.demo
              ? "Scenic installation · Interactive demo"
              : binding
                ? "Portfolio discovery"
                : "Scenic location"}
          </p>
          {binding && (
            <p>
              {binding.project.demo
                ? binding.project.summary
                : binding.project.name}
            </p>
          )}
          <button
            className="field-button field-secondary"
            onClick={() => onSurvey(site)}
          >
            View from above
          </button>
          {binding && !binding.project.demo && (
            <Link className="field-back" href={binding.project.href}>
              Read {binding.project.name}
            </Link>
          )}
          <p className="survey-note">
            Choose a place to look toward it. Continue the journey on foot.
          </p>
        </section>
      </div>
    </dialog>
  );
}
