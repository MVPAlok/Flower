import { useRef } from "react";
import { useScrollVar } from "../lib/scroll";

const STEPS = [
  { n: "I", h: <>Wait for the <em>rain.</em></>, b: "Macro starts with patience. The garden has to be soaked, the air still, the light soft and grey." },
  { n: "II", h: <>Find the <em>drop.</em></>, b: "One bead, at the very tip of a petal, heavy enough to fall and still holding on." },
  { n: "III", h: <>Slow <em>everything</em> down.</>, b: "Thirty seconds, split into 360 frames, so a single fall can be scrolled, paused and played backwards." },
];

const STRIP = Array.from({ length: 14 }, (_, i) => ({
  src: `/stills/strip/s${String(i).padStart(2, "0")}.webp`,
  tc: ["00:00", "00:02", "00:04", "00:06", "00:09", "00:11", "00:14", "00:16", "00:19", "00:21", "00:23", "00:25", "00:26", "00:28"][i],
}));

export function Method() {
  const strip = useRef<HTMLDivElement>(null);
  useScrollVar(strip, "pass");

  return (
    <section id="method" className="method" data-theme="light">
      <div className="sec-head" data-reveal>
        <span>(04)</span>
        <span>The method</span>
        <span className="sec-head__rule" />
        <span>Three rules</span>
      </div>

      <ol className="method__list">
        {STEPS.map((s) => (
          <li key={s.n} data-reveal>
            <span className="method__n">{s.n}</span>
            <h3>{s.h}</h3>
            <p>{s.b}</p>
          </li>
        ))}
      </ol>

      {/* a strip of film that runs as you scroll */}
      <div ref={strip} className="strip" data-theme="dark" aria-label="Frames from the film">
        <div className="strip__track">
          {[...STRIP, ...STRIP].map((f, i) => (
            <figure key={i} className="strip__frame">
              <img src={f.src} alt="" loading="lazy" decoding="async" />
              <figcaption>{f.tc}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
