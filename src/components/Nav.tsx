import { useEffect, useRef } from "react";
import { onFrame } from "../lib/scroll";

const LINKS = [
  { href: "#film", label: "The film" },
  { href: "#series", label: "Series" },
  { href: "#anatomy", label: "Anatomy" },
  { href: "#method", label: "Method" },
  { href: "#prints", label: "Prints" },
];

/**
 * Hidden while the hero film plays (the viewfinder is the header there).
 * Slides in afterwards and switches ink/blush to match the section under it.
 */
export function Nav() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const hero = document.querySelector<HTMLElement>(".bloom");
    let shown = false, theme = "";
    return onFrame(() => {
      const el = ref.current;
      if (!el || !hero) return;
      const r = hero.getBoundingClientRect();
      const show = r.bottom < window.innerHeight * 0.55;
      if (show !== shown) el.classList.toggle("is-shown", (shown = show));
      // which section is under the nav?
      const under = document.elementsFromPoint(window.innerWidth / 2, 40).find((n) => !el.contains(n));
      const probe = under?.closest<HTMLElement>("[data-theme]");
      const t = probe?.dataset.theme ?? "light";
      if (t !== theme) el.dataset.theme = theme = t;
    });
  }, []);

  return (
    <header ref={ref} className="nav" data-theme="light">
      <a className="nav__brand" href="#top" aria-label="bloom — back to the top">
        <svg viewBox="0 0 20 28" aria-hidden="true"><path d="M10 1C12.5 6 19 11 19 18a9 9 0 1 1-18 0C1 11 7.5 6 10 1Z" /></svg>
        bloom
      </a>
      <nav className="nav__links" aria-label="Sections">
        {LINKS.map((l) => (
          <a key={l.href} href={l.href}>{l.label}</a>
        ))}
      </nav>
      <a className="nav__cta" href="#prints">Collect a print</a>
    </header>
  );
}
