import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "../../components/site-header";
import { Explorer } from "../../components/explore/explorer";

export const metadata: Metadata = { title: "Explore · Lunar Field Log" };

export default function Explore() {
  return (
    <div className="field field-explore">
      <div className="explore-header"><SiteHeader mode="explore" /></div>
      <main className="explore-main">
        <Explorer />
        <noscript>
          <style>{".explorer-shell { visibility: hidden; }"}</style>
          <section className="scene-fallback">
            <h1>Explore the portfolio</h1>
            <p>The lunar scene requires JavaScript and WebGL 2.</p>
            <Link href="/work" className="field-button field-primary">View Portfolio <span aria-hidden="true">↗</span></Link>
          </section>
        </noscript>
      </main>
    </div>
  );
}
