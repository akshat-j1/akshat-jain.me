# Flight Log storyboard

The homepage is a short space journey. Akshat’s name and the portfolio links are available on arrival. Project details live in `/work`.

| Moment | What the visitor sees | What the scroll does |
| --- | --- | --- |
| Liftoff | An ivory survey rocket hangs in front of a copper ringed planet. The name has a short staggered entrance. The header offers direct links to Work and Connect. | The launch landscape moves more slowly than the ship. As the visitor starts down the page, the ship gains altitude, follows a curved path and banks toward the edge. The ringed planet drops away. |
| Coast | Deep violet replaces the copper horizon. A flight path and a second typographic scene appear behind the ship. | The same ship crosses the scene and recedes. The transition tracks scroll position, including when the visitor reverses direction. |
| First contact | A small survey robot comes up into view on a new blue and violet stage. | The robot rises and settles into a hover. Opening its wave control changes its pose and reveals a short reply. The expedition opens the playable Moon. |
| End of flight | A spare orbital composition holds direct links to work, GitHub and LinkedIn. | The story returns to ordinary document flow and gives visitors a quick route back to the start. |

The launch and coast share one sticky viewport. Native scrolling drives interpolation with a single animation frame callback. Desktop and portrait layouts have separate ship paths. Keyboard controls and direct links remain in normal document order. Paused motion, reduced motion and unavailable JavaScript expose the same scenes as static sections.

The generated assets depict a fictional moon, spacecraft and survey robot. The existing `/explore` renderer is a separate playable destination.

## Browser review

Captured from the local production build in Chrome at 1440 × 900 and 390 × 844. The [11-second walkthrough](screenshots/flight/walkthrough.mp4) shows the scroll transition and the robot’s response.

| Scene | Desktop | Portrait |
| --- | --- | --- |
| Liftoff | [Capture](screenshots/flight/desktop-launch.jpg) | [Capture](screenshots/flight/mobile-launch.jpg) |
| Coast | [Capture](screenshots/flight/desktop-orbit.jpg) | [Capture](screenshots/flight/mobile-orbit.jpg) |
| First contact | [Capture](screenshots/flight/desktop-relay.jpg) | [Capture](screenshots/flight/mobile-relay.jpg) |
| Open channel | [Capture](screenshots/flight/desktop-connect.jpg) | [Capture](screenshots/flight/mobile-connect.jpg) |

The first orbit capture clipped the ship on desktop and placed it behind the title on mobile. The final trajectory keeps the ship inside both frames through the main orbit shot. The imagery uses approximately 377 KB of source WebP files across the three scenes. The homepage and the interactive lunar scene load separately. The earlier portfolio review refers to the previous design and its measurements.
