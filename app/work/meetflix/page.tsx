import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "../../../components/site-header";
import { meetflix } from "../../../content/projects";

export const metadata: Metadata = { title: "MEETFLIX · Akshat Jain" };

export default function Meetflix() {
  return (
    <div className="field field-paper">
      <div className="field-frame">
        <SiteHeader mode="portfolio" />
        <main className="portfolio-main">
          <Link className="field-back" href="/work">← Portfolio</Link>
          <h1>{meetflix.name}</h1>
          <p className="portfolio-intro">This case study is in preparation.</p>
          <Link className="field-back" href="/explore" prefetch={false}>Visit the communications relay <span aria-hidden="true">↗</span></Link>
        </main>
      </div>
    </div>
  );
}
