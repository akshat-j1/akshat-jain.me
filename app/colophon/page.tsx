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
            <li>Opening artwork generated with OpenAI ImageGen</li>
            <li>Instrument Serif and Inter · SIL Open Font License</li>
          </ul>
        </main>
      </div>
    </div>
  );
}
