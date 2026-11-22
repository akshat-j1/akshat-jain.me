export const profile = {
  name: "Akshat Jain",
  role: "Computer science student, developer & builder",
  introduction:
    "I build useful software and explore unexpected possibilities — from local computer vision to weather intelligence and playful browser tools.",
  about: [
    "I’m Akshat. I like taking a ‘what if?’ seriously enough to build it.",
    "My work moves between full-stack applications, practical AI experiments and playful browser tools. Lately, that has meant making Google Meet a little less ordinary, bringing weather reports into focus, and exploring AI-assisted language assessment.",
    "I’m a computer science student who learns by making things. This site is part of that practice — a place for useful software, unfinished questions and the occasional journey beyond the familiar.",
  ],
  socials: [
    { label: "GitHub", href: "https://github.com/akshat-j1" },
    {
      label: "LinkedIn",
      href: "https://www.linkedin.com/in/akshat-jainofficial/",
    },
  ],
  toolkit: [
    {
      id: "interfaces",
      title: "Interfaces",
      description:
        "The part people touch. Clear interactions, considered details, and room for a little personality.",
      tools: ["React", "Next.js", "TypeScript", "Tailwind CSS", "Vite"],
      evidenceProjectIds: ["meetflix", "linguacert-ai", "weather-platform"],
    },
    {
      id: "systems",
      title: "Systems",
      description:
        "The structure underneath. From a geospatial query to a report moving through a data pipeline.",
      tools: [
        "Python",
        "FastAPI",
        "PostgreSQL",
        "PostGIS",
        "Redis",
        "Supabase",
      ],
      evidenceProjectIds: ["weather-platform", "linguacert-ai"],
    },
    {
      id: "intelligence",
      title: "Intelligence",
      description:
        "Experiments with a purpose. Local vision for a gesture, or an AI-assisted way to work with language.",
      tools: ["MediaPipe", "Gemini API"],
      evidenceProjectIds: ["meetflix", "linguacert-ai"],
    },
  ],
} as const;
