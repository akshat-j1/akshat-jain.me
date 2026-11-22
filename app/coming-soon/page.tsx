import type { Metadata } from "next";
import Link from "next/link";

const githubUrl = "https://github.com/akshat-j1";

const title = "Akshat Jain — Computer Science Student, Developer & Builder";
const description =
  "Akshat Jain is a computer science student, developer and builder. His personal website is coming soon.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/coming-soon" },
  robots: { index: false, follow: true },
  openGraph: {
    title,
    description,
    url: "/",
    siteName: "Akshat Jain",
    type: "website",
  },
  twitter: { card: "summary", title, description },
};

export default function Home() {
  return (
    <div className="mx-auto flex min-h-svh max-w-[100rem] flex-col px-6 sm:px-12 lg:px-20">
      <header className="flex flex-wrap items-center justify-between gap-x-5 gap-y-3 border-b border-rule py-6 sm:py-8">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="grid size-8 place-items-center rounded-[0.25rem] bg-accent font-serif text-xl leading-none text-white"
          >
            AJ
          </span>
          <span className="text-sm font-medium tracking-tight">
            akshat-jain.me
          </span>
        </div>
        <Link
          href="/experience"
          prefetch={false}
          className="flex min-h-6 cursor-pointer items-center gap-2.5 text-[0.6875rem] font-semibold tracking-[0.16em] text-accent uppercase underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4"
        >
          <span
            aria-hidden="true"
            className="size-1.5 rounded-full bg-current"
          />
          Coming soon
        </Link>
      </header>

      <main className="grid grow place-items-center py-20 text-center sm:py-24">
        <div className="hero-enter sm:-translate-y-3">
          <h1 className="hero-title font-serif font-normal">
            Akshat <em className="text-accent">Jain</em>
          </h1>
          <p className="mx-auto mt-6 max-w-[28rem] text-base leading-relaxed text-balance text-muted sm:mt-8 sm:text-lg">
            Computer science student, developer and builder.
          </p>
        </div>
      </main>

      <footer className="flex flex-wrap items-center justify-between gap-x-8 gap-y-1 border-t border-rule py-4 sm:py-6">
        <p className="text-sm leading-relaxed text-muted sm:text-base">
          Something exciting is in the works
        </p>
        <a
          href={githubUrl}
          className="group inline-flex min-h-11 items-center gap-2.5 text-sm font-semibold text-accent focus-visible:outline-2 focus-visible:outline-offset-4"
        >
          <span className="underline decoration-accent/35 underline-offset-4 group-hover:decoration-current motion-safe:transition-colors">
            GitHub
          </span>
          <span
            aria-hidden="true"
            className="text-base leading-none motion-safe:transition-transform motion-safe:group-hover:translate-x-0.5 motion-safe:group-hover:-translate-y-0.5"
          >
            ↗
          </span>
        </a>
      </footer>
    </div>
  );
}
