"use client";

import { useState } from "react";
type ToolkitGroup = {
  id: string;
  title: string;
  description: string;
  tools: readonly string[];
  evidence: readonly { name: string; href: string }[];
};

export function PortfolioToolkit({
  groups,
}: {
  groups: readonly ToolkitGroup[];
}) {
  const [active, setActive] = useState(0);
  return (
    <div className="p-toolkit">
      <div
        className="p-tool-tabs"
        role="tablist"
        aria-label="Technical toolkit"
      >
        {groups.map((group, index) => (
          <button
            key={group.id}
            id={`tab-${group.id}`}
            role="tab"
            aria-selected={index === active}
            aria-controls={`panel-${group.id}`}
            tabIndex={index === active ? 0 : -1}
            onClick={() => setActive(index)}
            onKeyDown={(event) => {
              const next =
                event.key === "ArrowRight"
                  ? (active + 1) % groups.length
                  : event.key === "ArrowLeft"
                    ? (active + groups.length - 1) % groups.length
                    : event.key === "Home"
                      ? 0
                      : event.key === "End"
                        ? groups.length - 1
                        : null;
              if (next === null) return;
              event.preventDefault();
              setActive(next);
              document.getElementById(`tab-${groups[next].id}`)?.focus();
            }}
          >
            <span>0{index + 1}</span>
            {group.title}
            <span aria-hidden="true">↗</span>
          </button>
        ))}
      </div>
      {groups.map((group, index) => (
        <div
          className="p-tool-panel"
          key={group.id}
          id={`panel-${group.id}`}
          role="tabpanel"
          aria-labelledby={`tab-${group.id}`}
          hidden={active !== index}
          tabIndex={0}
        >
          <p>{group.description}</p>
          <ul>
            {group.tools.map((tool) => (
              <li key={tool}>{tool}</li>
            ))}
          </ul>
          <p className="p-evidence">
            Used in{" "}
            {group.evidence.map((project, index) => (
              <span key={project.href}>
                {index > 0 && " / "}
                <a href={project.href}>{project.name}</a>
              </span>
            ))}
          </p>
        </div>
      ))}
      <noscript>
        <p>
          Full toolkit: {groups.flatMap((group) => group.tools).join(", ")}.
        </p>
      </noscript>
    </div>
  );
}
