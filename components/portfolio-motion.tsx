"use client";

import { useEffect, useState } from "react";

/** Progressive enhancement only: the server-rendered page is visible without JS. */
export function PortfolioMotion() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".portfolio");
    if (!root) return;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    let cleanup = () => {};
    const setup = () => {
      cleanup();
      const items = [...root.querySelectorAll<HTMLElement>("[data-reveal]")];
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.remove("reveal-pending");
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.08 },
      );
      items.forEach((item) => {
        if (!motion.matches && item.getBoundingClientRect().top > innerHeight) {
          item.classList.add("reveal-pending");
          observer.observe(item);
        }
      });
      let frame = 0;
      const update = () => {
        frame = 0;
        root.classList.toggle("p-scrolled", scrollY > 60);
        const range = document.documentElement.scrollHeight - innerHeight;
        root.style.setProperty("--read", `${range > 0 ? scrollY / range : 0}`);
        root.style.setProperty(
          "--drift",
          `${motion.matches ? 0 : Math.min(scrollY, innerHeight) * 0.12}px`,
        );
      };
      const schedule = () => {
        if (!frame) frame = requestAnimationFrame(update);
      };
      addEventListener("scroll", schedule, { passive: true });
      addEventListener("resize", schedule);
      update();
      cleanup = () => {
        observer.disconnect();
        items.forEach((item) => item.classList.remove("reveal-pending"));
        cancelAnimationFrame(frame);
        removeEventListener("scroll", schedule);
        removeEventListener("resize", schedule);
        root.style.removeProperty("--drift");
      };
    };
    setup();
    motion.addEventListener("change", setup);
    return () => {
      cleanup();
      motion.removeEventListener("change", setup);
    };
  }, []);
  return null;
}

export function AmbientControl() {
  const [playing, setPlaying] = useState(true);
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".portfolio");
    const hero = document.querySelector(".p-arrival");
    if (!root || !hero) return;
    root.dataset.enhanced = "true";
    const observer = new IntersectionObserver(([entry]) => {
      root.dataset.ambient = String(playing && entry.isIntersecting);
    });
    observer.observe(hero);
    return () => {
      observer.disconnect();
      delete root.dataset.ambient;
    };
  }, [playing]);
  return (
    <button
      className="p-ambient-control"
      onClick={() => setPlaying((value) => !value)}
      aria-pressed={!playing}
    >
      {playing ? "Pause ambient motion" : "Resume ambient motion"}
      <span aria-hidden="true">{playing ? "Ⅱ" : "▷"}</span>
    </button>
  );
}
