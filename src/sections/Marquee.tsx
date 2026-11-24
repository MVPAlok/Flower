import { useEffect, useRef } from "react";
import { onFrame } from "../lib/scroll";

/** Two giant lines drifting in opposite directions; scrolling speeds them up and leans them. */
export function Marquee() {
  const a = useRef<HTMLDivElement>(null);
  const b = useRef<HTMLDivElement>(null);
  const wrap = useRef<HTMLElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let x = 0, skew = 0;
    return onFrame((dt, vel) => {
      const w = a.current?.scrollWidth ?? 1;
      const boost = Math.min(Math.abs(vel) / 900, 4);
      x = (x + dt * (40 + boost * 260)) % (w / 2);
      skew += (Math.max(-8, Math.min(8, vel / 220)) - skew) * 0.12;
      if (a.current) a.current.style.transform = `translate3d(${-x}px,0,0) skewX(${-skew}deg)`;
      if (b.current) b.current.style.transform = `translate3d(${x - w / 2}px,0,0) skewX(${-skew}deg)`;
    });
  }, []);

  const line = (cls: string) =>
    Array.from({ length: 6 }, (_, i) => (
      <span key={i} className={cls}>
        after the rain <i>✦</i>
      </span>
    ));

  return (
    <section ref={wrap} className="marq" data-theme="light" aria-label="After the rain">
      <div ref={a} className="marq__row">{line("marq__t")}</div>
      <div ref={b} className="marq__row marq__row--b">{line("marq__t marq__t--outline")}</div>
    </section>
  );
}
