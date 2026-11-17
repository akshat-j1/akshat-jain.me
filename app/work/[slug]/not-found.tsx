import Link from "next/link";

export default function ProjectNotFound() {
  return <main className="field field-paper portfolio-main">
    <h1>Project unavailable</h1>
    <Link className="field-back" href="/work">Browse the portfolio</Link>
  </main>;
}
