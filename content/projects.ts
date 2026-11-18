import { statSync } from "node:fs";
import { join } from "node:path";
import { buildCatalog, type Project, type Retirement } from "./catalog";
import { destinations } from "./worlds";

export const githubUrl = "https://github.com/akshat-j1";

const projects: readonly Project[] = [
  {
    id: "meetflix", slug: "meetflix", name: "MEETFLIX",
    publication: "published", entry: "in-preparation",
    assignments: [{ destination: "moon", installation: "relay" }],
  },
];

const retired: readonly Retirement[] = [];

export const catalog = buildCatalog(projects, retired, destinations, src =>
  statSync(join(process.cwd(), "public", src), { throwIfNoEntry: false })?.isFile() === true);
