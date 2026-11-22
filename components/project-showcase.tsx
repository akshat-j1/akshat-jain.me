import Image from "next/image";
import Link from "next/link";
import { projectHref, type Project } from "../content/catalog";

export function ProjectVisual({ project }: { project: Project }) {
  const p = project.presentation;
  return (
    <figure className={`p-visual p-visual-${p?.visual ?? "image"}`}>
      {p?.cover ? (
        <Image
          src={p.cover.src}
          alt={p.cover.alt}
          width={p.cover.width}
          height={p.cover.height}
          sizes="(max-width: 760px) 100vw, 65vw"
        />
      ) : p?.visual === "weather-study" ? (
        <div
          className="p-weather-study"
          role="img"
          aria-label="Illustrative weather signal field with concentric observation lines and connected sources"
        >
          <div className="p-visual-top">
            <span>OBSERVATION FIELD</span>
            <span>{p.study?.label}</span>
          </div>
          <div className="p-radar" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
            <b className="p-node n1" />
            <b className="p-node n2" />
            <b className="p-node n3" />
            <b className="p-node n4" />
            <span className="p-radar-cross">+</span>
          </div>
          <div className="p-weather-title">
            {p.study?.heading}
            <br />
            <em>{p.study?.emphasis}</em>
          </div>
          <div className="p-visual-bottom">
            <span>{p.study?.footer}</span>
            <span>ILLUSTRATIVE STUDY</span>
          </div>
        </div>
      ) : p?.visual === "language-study" ? (
        <div
          className="p-language-study"
          role="img"
          aria-label="Illustrative language typography study showing letterforms and assessment framework levels"
        >
          <div className="p-visual-top">
            <span>{project.name}</span>
            <span>{p.study?.label}</span>
          </div>
          <span className="p-language-aa" aria-hidden="true">
            Aa<span>✳</span>
          </span>
          <div className="p-language-skills">
            {p.study?.details?.map((detail) => (
              <span key={detail}>
                {detail}
                <br />
              </span>
            ))}
          </div>
          <div className="p-cefr" aria-hidden="true">
            {p.study?.scale?.map((level) => (
              <span key={level}>{level}</span>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-generic-visual" aria-hidden="true">
          {project.name}
        </div>
      )}
      {p?.overlay && (
        <div className="p-film-label" aria-hidden="true">
          <span>{p.overlay.top}</span>
          <strong>{p.overlay.title}</strong>
          <span>{p.overlay.bottom}</span>
        </div>
      )}
      {p?.caption && <figcaption>{p.caption}</figcaption>}
    </figure>
  );
}

export function ProjectShowcase({
  project,
  index,
}: {
  project: Project;
  index: number;
}) {
  return (
    <article className="p-project" data-reveal>
      <div className="p-project-top">
        <span>
          0{index + 1} / {project.presentation?.category ?? "Selected project"}
        </span>
        <span>{project.status}</span>
      </div>
      <div className="p-project-grid">
        <Link
          className="p-visual-link"
          href={projectHref(project)}
          prefetch={false}
          aria-label={`Discover ${project.name}`}
        >
          <ProjectVisual project={project} />
        </Link>
        <div className="p-project-copy">
          <p className="p-project-hook">{project.presentation?.hook}</p>
          <h3>
            <Link href={projectHref(project)} prefetch={false}>
              {project.presentation?.title ?? project.name}
            </Link>
          </h3>
          <p>{project.summary}</p>
          <ul className="p-tags">
            {project.technologies?.map((tool) => (
              <li key={tool}>{tool}</li>
            ))}
          </ul>
          <Link
            className="p-text-link"
            href={projectHref(project)}
            prefetch={false}
          >
            Explore project <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
