import { useEffect, type RefObject } from "react";

/**
 * One shared animation loop for the whole page (the hero runs its own).
 * Registered elements get a `--sp` CSS variable (0 → 1) each frame:
 *  "pin"  — how far a tall section has scrolled past its sticky stage
 *  "pass" — how far an element has travelled through the viewport
 * Callbacks registered with onFrame() also receive the scroll velocity.
 */
type Mode = "pin" | "pass";
type Entry = { el: HTMLElement; mode: Mode; cb?: (p: number) => void; last: number };
type FrameCb = (dt: number, velocity: number) => void;

const entries = new Set<Entry>();
const frameCbs = new Set<FrameCb>();
let running = false;
let lastY = 0;
let lastT = 0;
let vel = 0;

const clamp = (v: number) => Math.min(1, Math.max(0, v));

function loop(t: number) {
  const dt = Math.min(0.05, (t - lastT) / 1000 || 0.016);
  lastT = t;
  const y = window.scrollY;
  vel += ((y - lastY) / Math.max(dt, 1e-3) - vel) * 0.2;
  lastY = y;
  const vh = window.innerHeight;
  for (const e of entries) {
    const r = e.el.getBoundingClientRect();
    if (r.bottom < -vh || r.top > vh * 2) continue;
    const p = e.mode === "pin" ? clamp(-r.top / Math.max(1, r.height - vh)) : clamp((vh - r.top) / (vh + r.height));
    if (Math.abs(p - e.last) > 0.0005) {
      e.last = p;
      e.el.style.setProperty("--sp", p.toFixed(4));
      e.cb?.(p);
    }
  }
  for (const cb of frameCbs) cb(dt, vel);
  requestAnimationFrame(loop);
}
function start() {
  if (running) return;
  running = true;
  lastY = window.scrollY;
  requestAnimationFrame(loop);
}

export function useScrollVar(ref: RefObject<HTMLElement | null>, mode: Mode, cb?: (p: number) => void) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const e: Entry = { el, mode, cb, last: -1 };
    entries.add(e);
    start();
    return () => void entries.delete(e);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, mode]);
}

export function onFrame(cb: FrameCb) {
  frameCbs.add(cb);
  start();
  return () => void frameCbs.delete(cb);
}

/** Adds `.is-in` to every [data-reveal] element the first time it enters the viewport. */
export function useReveal() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (list) => list.forEach((en) => en.isIntersecting && (en.target.classList.add("is-in"), io.unobserve(en.target))),
      { threshold: 0.18, rootMargin: "0px 0px -6% 0px" },
    );
    document.querySelectorAll("[data-reveal]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}
