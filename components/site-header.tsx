import Link from "next/link";

export function SiteHeader({ mode }: { mode: "landing" | "portfolio" | "explore" }) {
  return (
    <header className="field-header">
      <Link className="field-brand" href="/experience" prefetch={false}>
        <span className="orbit-mark" aria-hidden="true" />
        Lunar Field Log
      </Link>
      <nav aria-label="Experience">
        {mode === "portfolio" ? (
          <Link className="field-nav-link" prefetch={false} href="/explore">Explore <span aria-hidden="true">↗</span></Link>
        ) : (
          <Link className="field-nav-link" href="/work">Portfolio <span aria-hidden="true">↗</span></Link>
        )}
        {mode === "explore" && <Link className="field-nav-link field-exit" href="/experience" prefetch={false}>Exit <span aria-hidden="true">×</span></Link>}
      </nav>
    </header>
  );
}
