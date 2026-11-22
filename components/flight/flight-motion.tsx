"use client";

import { useEffect, useRef, useState } from "react";

const clamp = (value: number) => Math.min(1, Math.max(0, value));
const mix = (start: number, end: number, amount: number) =>
  start + (end - start) * amount;

export function FlightMotion() {
  const control = useRef<HTMLButtonElement>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const root = control.current?.closest<HTMLElement>(".flight");
    const flight = root?.querySelector<HTMLElement>(".flight-track");
    const relay = root?.querySelector<HTMLElement>(".flight-relay");
    const deck = flight?.querySelector<HTMLElement>(".flight-deck");
    const contact = root?.querySelector<HTMLElement>(".flight-connect");
    if (!root || !flight || !relay || !deck) return;

    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const portrait = matchMedia("(max-width: 700px)");
    let frame = 0;

    function paint() {
      frame = 0;
      if (!root || !flight || !relay || !deck) return;
      const viewport = window.innerHeight;
      const range = flight.offsetHeight - deck.offsetHeight;
      const position = clamp(
        -flight.getBoundingClientRect().top / Math.max(1, range),
      );
      const coasting = clamp((position - 0.25) / 0.55);
      const departure = clamp((position - 0.72) / 0.28);
      const mobile = portrait.matches;
      const x =
        mix(mobile ? 0 : 5, mobile ? -24 : -53, coasting) +
        departure * (mobile ? 73 : 85);
      const y =
        -Math.sin(position * Math.PI) * (mobile ? 18 : 15) -
        departure * (mobile ? 33 : 29);
      const lift = clamp(
        (viewport - relay.getBoundingClientRect().top) / (viewport * 0.75),
      );
      deck.style.setProperty("--ship-x", `${x}vw`);
      deck.style.setProperty("--ship-y", `${y}svh`);
      deck.style.setProperty(
        "--ship-angle",
        `${mix(-8, -50, coasting) + departure * 73}deg`,
      );
      deck.style.setProperty(
        "--ship-size",
        String(mix(1, mobile ? 0.72 : 0.63, coasting) - departure * 0.3),
      );
      deck.style.setProperty(
        "--exhaust",
        String(0.24 + Math.sin(position * Math.PI) * 1.1),
      );
      deck.style.setProperty("--ship-alpha", String(1 - departure * 0.88));
      deck.style.setProperty("--ground-y", `${position * 26}svh`);
      deck.style.setProperty(
        "--launch-alpha",
        String(1 - clamp((position - 0.04) / 0.38)),
      );
      deck.style.setProperty(
        "--coast-alpha",
        String(clamp((position - 0.23) / 0.48)),
      );
      deck.style.setProperty("--coast-x", `${(1 - coasting) * 12}vw`);
      relay.style.setProperty("--relay-lift", `${(1 - lift) * 95}px`);
      relay.style.setProperty("--relay-tilt", `${(1 - lift) * -13}deg`);
      relay.style.setProperty("--relay-opacity", String(0.35 + lift * 0.65));
    }

    function schedule() {
      if (!frame) frame = requestAnimationFrame(paint);
    }

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        (entry.target as HTMLElement).toggleAttribute(
          "data-visible",
          entry.isIntersecting,
        );
      }
    });

    function sync() {
      if (!root || !deck || !relay) return;
      const active = !preference.matches && !paused;
      root.toggleAttribute("data-flight-motion", active);
      if (active) {
        observer.observe(deck);
        observer.observe(relay);
        if (contact) observer.observe(contact);
        schedule();
      } else {
        observer.disconnect();
        deck.removeAttribute("data-visible");
        relay.removeAttribute("data-visible");
        contact?.removeAttribute("data-visible");
        cancelAnimationFrame(frame);
        frame = 0;
      }
    }

    function onScroll() {
      if (!paused && !preference.matches) schedule();
    }

    sync();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    preference.addEventListener("change", sync);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      root.removeAttribute("data-flight-motion");
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      preference.removeEventListener("change", sync);
    };
  }, [paused]);

  return (
    <button
      className="flight-motion-toggle"
      type="button"
      ref={control}
      aria-pressed={paused}
      onClick={() => setPaused((value) => !value)}
    >
      <span aria-hidden="true">{paused ? "▷" : "Ⅱ"}</span> Motion
    </button>
  );
}
