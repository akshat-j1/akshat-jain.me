import Image from "next/image";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { PortfolioHeader } from "../../../components/portfolio-header";
import { ProjectVisual } from "../../../components/project-showcase";
import { catalog } from "../../../content/projects";

type Props = { params: Promise<{ slug: string }> };
export function generateStaticParams() {
  return [...catalog.bySlug.keys(), ...catalog.redirects.keys()].map(
    (slug) => ({ slug }),
  );
}
function resolveProject(slug: string) {
  const redirect = catalog.redirects.get(slug);
  if (redirect) permanentRedirect(redirect);
  return catalog.bySlug.get(slug) ?? notFound();
}
export async function generateMetadata({ params }: Props) {
  const project = resolveProject((await params).slug);
  return {
    title: `${project.name} · Akshat Jain`,
    description: project.summary,
    alternates: { canonical: `/work/${project.slug}` },
  };
}
export default async function ProjectPage({ params }: Props) {
  const project = resolveProject((await params).slug);
  return (
    <div className="portfolio p-inner">
      <a className="p-skip" href="#main">
        Skip to content
      </a>
      <PortfolioHeader />
      <main className="p-inner-main" id="main" tabIndex={-1}>
        <Link className="p-text-link" href="/work">
          ← Portfolio
        </Link>
        <h1>{project.name}</h1>
        <p className="p-inner-intro">{project.summary}</p>
        <p className="p-detail-status">{project.status}</p>
        {project.presentation && (
          <div className="p-project-detail">
            <ProjectVisual project={project} />
          </div>
        )}
        <div className="p-detail-body">
          <aside>
            <p className="p-eyebrow">BUILT WITH</p>
            <ul className="p-tags">
              {project.technologies?.map((tool) => (
                <li key={tool}>{tool}</li>
              ))}
            </ul>
            {project.links?.map((link) => (
              <a className="p-text-link" key={link.href} href={link.href}>
                {link.label} ↗
              </a>
            ))}
            {catalog.places.get(project.id)?.map(({ world, point }) => (
              <Link
                className="p-scenic-link"
                key={`${world.id}/${point.id}`}
                href={world.href}
                prefetch={false}
              >
                Visit {point.name.toLowerCase()} ↗
              </Link>
            ))}
          </aside>
          <div>
            {project.entry === "in-preparation" && (
              <section>
                <h2>A project brief, for now.</h2>
                <p>This case study is in preparation.</p>
              </section>
            )}
            {project.sections?.map((section) => (
              <section key={section.heading}>
                <h2>{section.heading}</h2>
                {section.paragraphs.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </section>
            ))}
          </div>
        </div>
        <div className="p-detail-media">
          {project.screenshots?.map((image) => (
            <figure key={image.src}>
              <Image
                src={image.src}
                alt={image.alt}
                width={image.width}
                height={image.height}
                sizes="(max-width: 760px) 100vw, 80vw"
              />
              {image.credit && <figcaption>{image.credit}</figcaption>}
            </figure>
          ))}
        </div>
      </main>
      <footer className="p-inner-footer">
        <Link href="/work">← All projects</Link>
        <div>
          <Link href="/explore" prefetch={false}>
            Explore
          </Link>
          <Link href="/#connect">Connect ↗</Link>
        </div>
      </footer>
    </div>
  );
}
