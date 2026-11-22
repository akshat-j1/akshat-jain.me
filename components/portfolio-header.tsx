"use client";

import Link from "next/link";
import { useRef } from "react";
import { profile } from "../content/profile";

const sections = [
  ["Work", "/work"],
  ["Expedition", "/#expedition"],
  ["Connect", "/#connect"],
] as const;

export function PortfolioHeader() {
  const menu = useRef<HTMLDetailsElement>(null);
  const close = () => {
    if (menu.current) menu.current.open = false;
  };
  return (
    <header className="p-header">
      <Link className="p-brand" href="/" aria-label={`${profile.name} home`}>
        <span className="p-monogram" aria-hidden="true">
          a<span>j</span>.
        </span>
        <span>{profile.name.toUpperCase()}</span>
      </Link>
      <nav className="p-desktop-nav" aria-label="Main navigation">
        {sections.map(([label, href]) => (
          <a key={href} href={href}>
            {label}
          </a>
        ))}
      </nav>
      <details
        className="p-menu"
        ref={menu}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            close();
            menu.current?.querySelector("summary")?.focus();
          }
        }}
      >
        <summary>
          Menu <span aria-hidden="true">+</span>
        </summary>
        <nav aria-label="Mobile navigation">
          {sections.map(([label, href]) => (
            <a onClick={close} key={href} href={href}>
              {label}
              <span aria-hidden="true">↗</span>
            </a>
          ))}
        </nav>
      </details>
    </header>
  );
}
