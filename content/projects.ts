import { statSync } from "node:fs";
import { join } from "node:path";
import { buildCatalog, type Project, type Retirement } from "./catalog";
import { destinations } from "./worlds";

export const githubUrl = "https://github.com/akshat-j1";

const projects: readonly Project[] = [
  {
    id: "meetflix",
    slug: "meetflix",
    name: "MEETFLIX",
    featured: true,
    publication: "published",
    entry: "in-preparation",
    status: "CodeDay submission · Install from source",
    summary:
      "A Chrome extension that turns hand gestures into live Google Meet video effects, with camera frames processed locally.",
    presentation: {
      category: "Browser tools / Computer vision",
      title: "MEETFLIX",
      hook: "A little cinema.\nAn ordinary meeting.",
      visual: "image",
      overlay: {
        top: "MEETINGS, WITH A PLOT TWIST.",
        title: "This is fine.",
        bottom: "LOCAL VISION. LIVE VIDEO.",
      },
      caption: "Original ‘This Is Fine’ effect background · not a live meeting",
      cover: {
        src: "/portfolio/meetflix-office.webp",
        alt: "MEETFLIX’s original effect artwork of an office with small fires and cool window light",
        width: 1440,
        height: 810,
      },
    },
    technologies: ["TypeScript", "Vite", "MediaPipe", "Chrome Manifest V3"],
    screenshots: [
      {
        src: "/portfolio/meetflix-qa.webp",
        alt: "Synthetic QA frame showing the This Is Fine effect with a drawn test person",
        width: 1280,
        height: 720,
        credit:
          "Synthetic QA capture from the MEETFLIX repository. This is a test subject, not a real meeting participant.",
      },
    ],
    links: [
      {
        label: "Source on GitHub",
        href: "https://github.com/akshat-j1/meetflix",
      },
    ],
    sections: [
      {
        heading: "An ordinary call, with an unexpected turn",
        paragraphs: [
          "MEETFLIX transforms the outgoing Google Meet camera feed. Absolute Cinema, Confused Math and This Is Fine bring short visual effects to a call. Legendary Exit is a separate, explicitly enabled departure effect.",
        ],
      },
      {
        heading: "Built around local vision",
        paragraphs: [
          "The extension combines local MediaPipe hand and face tracking with person segmentation. Three gesture triggers activate the non-exit effects; manual controls remain available. The microphone is unchanged and camera effects run locally rather than through a remote inference service.",
        ],
      },
      {
        heading: "Current state",
        paragraphs: [
          "The repository documents the v0.7.1 CodeDay submission and source installation. It is not listed here as a Chrome Web Store release. The full case study, including a detailed account of contribution and implementation choices, is still in preparation.",
        ],
      },
    ],
    assignments: [{ destination: "moon", installation: "relay" }],
  },
  {
    id: "weather-platform",
    slug: "weather-intelligence",
    name: "National Weather Big Data Analytics Platform",
    featured: true,
    publication: "published",
    entry: "brief",
    status: "Containerized demo · SIH26069",
    summary:
      "A weather intelligence platform connecting citizen reports, meteorological data and geospatial dashboards with explainable credibility scoring.",
    presentation: {
      category: "Data systems / Geospatial intelligence",
      title: "Weather\nintelligence",
      hook: "Many signals.\nA clearer picture.",
      visual: "weather-study",
      study: {
        label: "SIH26069",
        heading: "Finding clarity",
        emphasis: "in the noise.",
        footer: "REPORTS → EVIDENCE → INSIGHT",
      },
      caption:
        "Illustrative signal-field study · no live observations or impact metrics",
    },
    technologies: ["Python", "FastAPI", "React", "PostGIS", "Redis"],
    links: [
      {
        label: "Source on GitHub",
        href: "https://github.com/akshat-j1/sih26069-weather-platform",
      },
    ],
    sections: [
      {
        heading: "Making reports easier to investigate",
        paragraphs: [
          "Built around Smart India Hackathon problem statement SIH26069, the project combines photo and location-based citizen reports with meteorological sources. A map dashboard and operator queue support investigation; credibility scores expose their supporting evidence.",
        ],
      },
      {
        heading: "From ingestion to the map",
        paragraphs: [
          "The documented stack uses FastAPI, PostgreSQL with PostGIS, Redis-backed ingestion and a React/Leaflet interface. A transactional outbox and server-sent events connect backend updates to the dashboard.",
        ],
      },
      {
        heading: "Demo boundaries",
        paragraphs: [
          "This is a containerized project demonstration, not an operational national weather service. The official IMD station integration is a stub requiring credentials. Some corroboration and image-forensics features are gated by configuration. Real-world accuracy and user impact are not established here.",
        ],
      },
    ],
  },
  {
    id: "linguacert-ai",
    slug: "linguacert-ai",
    name: "LinguaCert AI",
    featured: true,
    publication: "published",
    entry: "brief",
    status: "In development · Assessment experiment",
    summary:
      "Exploring AI-assisted English assessment across reading, listening, speaking and writing, aligned to the CEFR A1–C2 framework.",
    presentation: {
      category: "Applied AI / Language assessment",
      title: "LinguaCert AI",
      hook: "Language is human.\nAssessment should be, too.",
      visual: "language-study",
      study: {
        label: "LANGUAGE / POSSIBILITY",
        details: ["Reading · Listening", "Speaking · Writing"],
        scale: ["A1", "A2", "B1", "B2", "C1", "C2"],
      },
      caption:
        "Illustrative typography study · not a product screenshot or assessment result",
    },
    technologies: ["Next.js", "TypeScript", "Supabase", "Gemini API"],
    links: [
      {
        label: "Source on GitHub",
        href: "https://github.com/akshat-j1/linguacert-ai",
      },
    ],
    sections: [
      {
        heading: "A language assessment experiment",
        paragraphs: [
          "LinguaCert AI explores AI-assisted English assessment across four language skills, using CEFR levels A1 to C2 as a framework. The public profile and repository describe Next.js interfaces, Supabase data and authentication, and Gemini integration.",
        ],
      },
      {
        heading: "What is verified",
        paragraphs: [
          "The repository documents an App Router structure, Supabase Auth and row-level security. This portfolio describes the project’s direction and documented stack. It does not claim independently validated scoring, formal accreditation or a finished certification service.",
        ],
      },
      {
        heading: "Still taking shape",
        paragraphs: [
          "The project remains in development. A fuller case study, genuine product captures and a verified breakdown of completed assessment flows will be added as the work matures.",
        ],
      },
    ],
  },
];

const retired: readonly Retirement[] = [];

export const catalog = buildCatalog(
  projects,
  retired,
  destinations,
  (src) =>
    statSync(join(process.cwd(), "public", src), {
      throwIfNoEntry: false,
    })?.isFile() === true,
);
