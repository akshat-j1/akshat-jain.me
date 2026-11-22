import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { FlightMotion } from "../components/flight/flight-motion";
import { profile } from "../content/profile";
import "./flight.css";

const title = `${profile.name} — Developer & Builder`;
const description =
  "Akshat Jain’s personal portfolio. Follow a spacecraft from liftoff to first contact, visit the playable Moon, or browse his work.";
const cover = "/flight/ringed-horizon.webp";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/" },
  openGraph: {
    title,
    description,
    url: "/",
    siteName: profile.name,
    type: "website",
    images: [
      {
        url: cover,
        width: 1536,
        height: 1024,
        alt: "A ringed planet over a copper horizon",
      },
    ],
  },
  twitter: { card: "summary_large_image", title, description, images: [cover] },
};

export default function Home() {
  return (
    <div className="flight" id="top">
      <a className="flight-skip" href="#main">
        Skip to content
      </a>
      <header className="flight-header">
        <Link href="/" className="flight-mark" aria-label="Akshat Jain home">
          AJ<span>✦</span>
        </Link>
        <nav aria-label="Main navigation">
          <a href="#expedition">Expedition</a>
          <Link href="/work" prefetch={false}>
            Work <span aria-hidden="true">↗</span>
          </Link>
          <a href="#connect">Connect</a>
        </nav>
        <FlightMotion />
      </header>

      <main id="main" tabIndex={-1}>
        <section className="flight-track" aria-labelledby="flight-title">
          <div className="flight-deck">
            <div className="flight-ground" aria-hidden="true">
              <Image
                src={cover}
                alt=""
                fill
                preload
                sizes="(max-width: 700px) 1100px, 100vw"
              />
            </div>
            <div className="flight-sky" aria-hidden="true">
              <div className="flight-orbit orbit-a" />
              <div className="flight-orbit orbit-b" />
              <div className="flight-orbit orbit-c" />
            </div>
            <div className="flight-ship" aria-hidden="true">
              <div className="flight-ship-hover">
                <span className="flight-exhaust" />
                <Image
                  src="/flight/survey-ferry.webp"
                  alt=""
                  width={1050}
                  height={700}
                  sizes="(max-width: 700px) 73vw, 45vw"
                  preload
                />
              </div>
            </div>
            <div className="flight-launch">
              <p className="flight-kicker">
                <span aria-hidden="true">✦</span> Personal space program
              </p>
              <h1 id="flight-title" aria-label={profile.name}>
                Akshat
                <br />
                <em>Jain.</em>
              </h1>
              <p className="flight-intro">
                Computer science student.
                <br />
                Developer and builder.
              </p>
              <a className="flight-button flight-boarding" href="#departure">
                Scroll to lift off <span aria-hidden="true">↓</span>
              </a>
            </div>
            <div className="flight-coast">
              <p className="flight-kicker">
                <span aria-hidden="true">✦</span> In orbit
              </p>
              <h2>
                Beyond
                <br />
                the horizon.
              </h2>
            </div>
            <div className="flight-reticle" aria-hidden="true">
              <span /> <b>↑</b> <span />
            </div>
          </div>
          <div id="departure" aria-hidden="true" />
        </section>

        <section
          className="flight-relay"
          id="expedition"
          aria-labelledby="relay-title"
        >
          <div className="flight-relay-art" aria-hidden="true">
            <div className="flight-relay-ring" />
            <div className="flight-relay-ring ring-inner" />
            <div className="flight-relay-image">
              <div className="flight-relay-hover">
                <Image
                  src="/flight/survey-robot.webp"
                  alt=""
                  width={880}
                  height={880}
                  sizes="(max-width: 700px) 85vw, 49vw"
                />
              </div>
            </div>
          </div>
          <div className="flight-relay-copy">
            <p className="flight-kicker">
              <span aria-hidden="true">✦</span> Lunar Field Log
            </p>
            <h2 id="relay-title">
              First
              <br />
              contact.
            </h2>
            <p>
              A survey robot picked up your signal. Say hello, then head down to
              the lunar surface.
            </p>
            <div className="flight-relay-actions">
              <details className="flight-wave">
                <summary className="flight-button">
                  Wave hello <span aria-hidden="true">＋</span>
                </summary>
                <p>Signal received. See you on the Moon.</p>
              </details>
              <Link
                href="/explore"
                prefetch={false}
                className="flight-button flight-primary"
              >
                Enter the universe <span aria-hidden="true">↗</span>
              </Link>
            </div>
          </div>
        </section>

        <section
          className="flight-connect"
          id="connect"
          aria-labelledby="connect-title"
        >
          <div className="flight-contact-orbits" aria-hidden="true">
            <i />
            <i />
            <i />
            <span>✦</span>
          </div>
          <div className="flight-connect-copy">
            <h2 id="connect-title">Open channel.</h2>
            <p>Want to talk about something you’re building?</p>
            <div className="flight-socials">
              {profile.socials.map(({ label, href }) => (
                <a className="flight-button" key={label} href={href}>
                  {label}
                  <span aria-hidden="true">↗</span>
                </a>
              ))}
              <Link className="flight-button" href="/work" prefetch={false}>
                View my work <span aria-hidden="true">↗</span>
              </Link>
            </div>
          </div>
          <footer className="flight-footer">
            <span>Akshat Jain</span>
            <Link href="/colophon">Credits</Link>
            <a href="#top">
              Back to liftoff <span aria-hidden="true">↑</span>
            </a>
          </footer>
        </section>
      </main>
    </div>
  );
}
