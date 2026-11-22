import type { Metadata } from "next";
import { SiteHeader } from "../../components/site-header";

export const metadata: Metadata = { title: "Credits · Lunar Field Log" };

export default function Colophon() {
  return (
    <div className="field field-paper">
      <div className="field-frame">
        <SiteHeader mode="portfolio" />
        <main className="portfolio-main credits">
          <h1>Credits</h1>
          <ul>
            <li>Spacesuit by <a href="https://grab3d.com/models/characters/astronaut-in-spacesuit/">Grab3D</a> · CC0</li>
            <li>Gravelly Sand by <a href="https://polyhaven.com/a/gravelly_sand">Dario Barresi / Poly Haven</a> · CC0</li>
            <li>Earth surface and cloud maps by <a href="https://www.solarsystemscope.com/textures/">Solar System Scope</a> · CC BY 4.0</li>
            <li>Lunar elevation data by <a href="https://svs.gsfc.nasa.gov/4720/">NASA’s Lunar Reconnaissance Orbiter LOLA</a></li>
            <li>Copernicus relief from <a href="https://pgda.gsfc.nasa.gov/products/54">SLDEM2015</a>, NASA/GSFC LOLA and JAXA SELENE Terrain Camera teams</li>
            <li>Moon Rock 02 and 05 and Rock Face 01 and 03 by <a href="https://polyhaven.com/">Poly Haven</a> · CC0</li>
            <li>Milky Way and star positions from <a href="https://svs.gsfc.nasa.gov/4851/">NASA/Goddard Space Flight Center Scientific Visualization Studio</a>, using Gaia, Hipparcos and Tycho catalogs</li>
            <li>Opening artwork, ringed horizon, survey ferry and survey robot generated with OpenAI ImageGen</li>
            <li>Portfolio orbital arrival artwork generated with OpenAI ImageGen. MEETFLIX’s original effect background and synthetic QA frame are from <a href="https://github.com/akshat-j1/meetflix">Akshat’s project repository</a>.</li>
            <li>ASCII portrait from <a href="https://github.com/akshat-j1">Akshat’s public profile</a>. Weather and language showcase studies are original interface artwork, not product screenshots.</li>
            <li>Instrument Serif and Inter · SIL Open Font License</li>
          </ul>
        </main>
      </div>
    </div>
  );
}
