import { projectHref } from "../../content/catalog";
import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "../../components/site-header";
import { catalog, githubUrl } from "../../content/projects";

export const metadata: Metadata = { title: "Portfolio · Akshat Jain" };

export default function Work() {
  return (
    <div className="field field-paper">
      <div className="field-frame">
        <SiteHeader mode="portfolio" />
        <main className="portfolio-main">
          <h1>Portfolio</h1>
          <p className="portfolio-intro">I’m Akshat Jain, a computer science student, developer and builder.</p>
          <section className="portfolio-index" aria-labelledby="work-title">
            <h2 id="work-title">Selected work</h2>
            {catalog.projects.length === 0 && <p>No project entries are published yet.</p>}
            {catalog.projects.map(project => <Link key={project.id} prefetch={false} href={projectHref(project)} className="portfolio-entry">
              <span>{project.name}</span><span aria-hidden="true">↗</span>
            </Link>)}
          </section>
        </main>
        <footer className="portfolio-footer">
          <a href={githubUrl}>GitHub <span aria-hidden="true">↗</span></a>
          <Link href="/colophon">Credits</Link>
        </footer>
      </div>
    </div>
  );
}
