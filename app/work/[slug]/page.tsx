import Image from "next/image";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { SiteHeader } from "../../../components/site-header";
import { catalog } from "../../../content/projects";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return [...catalog.bySlug.keys(), ...catalog.redirects.keys()].map(slug => ({ slug }));
}

function resolveProject(slug: string) {
  const redirect = catalog.redirects.get(slug);
  if (redirect) permanentRedirect(redirect);
  return catalog.bySlug.get(slug) ?? notFound();
}

export async function generateMetadata({ params }: Props) {
  const project = resolveProject((await params).slug);
  return { title: `${project.name} · Akshat Jain`, description: project.summary };
}

export default async function ProjectPage({ params }: Props) {
  const project = resolveProject((await params).slug);
  return (
    <div className="field field-paper">
      <div className="field-frame">
        <SiteHeader mode="portfolio" />
        <main className="portfolio-main">
          <Link className="field-back" href="/work">← Portfolio</Link>
          <h1>{project.name}</h1>
          {project.summary && <p className="portfolio-intro">{project.summary}</p>}
          {project.entry === "in-preparation" && <p className="portfolio-intro">This case study is in preparation.</p>}
          {project.status && <p>{project.status}</p>}
          {project.technologies?.length ? <p>{project.technologies.join(" · ")}</p> : null}
          {project.sections?.map(section => <section key={section.heading} className="portfolio-index">
            <h2>{section.heading}</h2>
            {section.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
          </section>)}
          {project.screenshots?.map(image => <figure key={image.src}>
            <Image unoptimized src={image.src} alt={image.alt} width={image.width} height={image.height} />
            {image.credit && <figcaption>{image.credit}</figcaption>}
          </figure>)}
          {project.links?.map(link => <p key={link.href}><a className="field-back" href={link.href}>{link.label} ↗</a></p>)}
          {catalog.places.get(project.id)?.map(({ world, point }) =>
            <p key={world.id + "/" + point.id}><Link className="field-back" href={world.href} prefetch={false}>
              Visit {point.name.toLowerCase()} <span aria-hidden="true">↗</span>
            </Link></p>)}
        </main>
      </div>
    </div>
  );
}
