import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "../../components/site-header";

export const metadata: Metadata = {
  title: "Lunar Field Log — Akshat Jain",
  alternates: { canonical: "/experience" },
  openGraph: { title: "Lunar Field Log — Akshat Jain", url: "/experience", siteName: "Lunar Field Log", type: "website" },
};

export default function Experience() {
  return (
    <div className="field field-landing">
      <picture className="opening-plate">
        <source media="(max-width: 640px)" srcSet="/lunar/opening-portrait.webp" />
        <img src="/lunar/opening.webp" alt="" width={1536} height={1024} fetchPriority="high" />
      </picture>
      <div className="opening-shade" aria-hidden="true" />
      <div className="field-frame opening-frame">
        <SiteHeader mode="landing" />
        <main className="opening-copy">
          <h1>Akshat <em>Jain</em></h1>
          <p>Computer science student, developer and builder.</p>
          <div className="field-actions">
            <Link className="field-button field-primary" href="/explore" prefetch={false}>Begin Exploration <span aria-hidden="true">↗</span></Link>
            <Link className="field-button field-secondary" href="/work">View Portfolio <span aria-hidden="true">→</span></Link>
          </div>
        </main>
        <footer className="opening-caption">
          <span>Akshat Jain · Personal website</span>
          <span>Artist’s impression of the lunar surface</span>
        </footer>
      </div>
    </div>
  );
}
