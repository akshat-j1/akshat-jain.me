import type { Metadata } from "next";
import Link from "next/link";
import { PortfolioHeader } from "../../components/portfolio-header";
import { ProjectShowcase } from "../../components/project-showcase";
import { catalog, githubUrl } from "../../content/projects";

export const metadata: Metadata = {
  title: "Portfolio · Akshat Jain",
  description:
    "Selected software projects by Akshat Jain, with verified project details, source code and development status.",
  alternates: { canonical: "/work" },
};

export default function Work() {
  return (
    <div className="portfolio p-inner">
      <a className="p-skip" href="#main">
        Skip to content
      </a>
      <PortfolioHeader />
      <main className="p-inner-main" id="main" tabIndex={-1}>
        <p className="p-eyebrow">THE BUILD LAB / SELECTED PROJECTS</p>
        <h1>Portfolio</h1>
        <p className="p-inner-intro">
          Useful software. Unexpected possibilities.
          <br />A collection of things I’m building and the questions behind
          them.
        </p>
        <div className="p-work-list">
          {catalog.projects.length === 0 && (
            <p>No project entries are published yet.</p>
          )}
          {catalog.projects.map((project, index) => (
            <ProjectShowcase key={project.id} project={project} index={index} />
          ))}
        </div>
      </main>
      <footer className="p-inner-footer">
        <Link href="/">← Akshat Jain</Link>
        <div>
          <Link href="/explore" prefetch={false}>
            Explore
          </Link>
          <a href={githubUrl}>GitHub ↗</a>
        </div>
      </footer>
    </div>
  );
}
