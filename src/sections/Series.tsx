import { useEffect, useRef } from "react";
import { useScrollVar } from "../lib/scroll";
import { RippleImage } from "../components/RippleImage";

export const PLATES = [
  { n: "I", title: "First light", src: "/stills/plates/1-first-light.webp", tc: "00:01:16", frame: "020" },
  { n: "II", title: "Velvet, wet", src: "/stills/plates/2-velvet.webp", tc: "00:05:00", frame: "060" },
  { n: "III", title: "The edge", src: "/stills/plates/3-the-edge.webp", tc: "00:10:00", frame: "120" },
  { n: "IV", title: "Holding on", src: "/stills/plates/4-holding-on.webp", tc: "00:20:00", frame: "240" },
  { n: "V", title: "A garden, inverted", src: "/stills/plates/5-inverted.webp", tc: "00:25:00", frame: "300" },
  { n: "VI", title: "After", src: "/stills/plates/6-after.webp", tc: "00:27:21", frame: "335" },
];

/** Pinned horizontal gallery: vertical scroll moves the row of plates sideways. */
export function Series() {
  const ref = useRef<HTMLElement>(null);
  const row = useRef<HTMLDivElement>(null);
  const count = useRef<HTMLSpanElement>(null);

  useScrollVar(ref, "pin", (p) => {
    if (count.current) {
      const n = Math.min(PLATES.length, Math.max(1, Math.round(p * (PLATES.length - 1)) + 1));
      count.current.textContent = String(n).padStart(2, "0");
    }
  });

  // how far the row needs to travel
  useEffect(() => {
    const measure = () => {
      const el = row.current, sec = ref.current;
      if (!el || !sec) return;
      sec.style.setProperty("--travel", `${Math.max(0, el.scrollWidth - window.innerWidth)}px`);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (row.current) ro.observe(row.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  return (
    <section ref={ref} id="series" className="series" data-theme="dark">
      <div className="series__stage">
        <div className="series__top">
          <div className="sec-head sec-head--dark">
            <span>(02)</span>
            <span>The series</span>
          </div>
          <span className="series__count"><span ref={count}>01</span> / 06</span>
        </div>

        <div ref={row} className="series__row">
          <div className="series__intro">
            <h2>
              Six plates
              <br />
              <em>from thirty seconds.</em>
            </h2>
            <p>Six frames pulled from the film and printed as still photographs. Hover one, and the water moves.</p>
          </div>

          {PLATES.map((p, i) => (
            <figure key={p.n} className="plate" style={{ "--k": i } as React.CSSProperties} data-cursor="Look">
              <RippleImage src={p.src} alt={`Plate ${p.n}: ${p.title}`} className="plate__img" />
              <figcaption>
                <span className="plate__n">{p.n}</span>
                <span className="plate__title">{p.title}</span>
                <span className="plate__meta">{p.tc} · frame {p.frame}</span>
              </figcaption>
            </figure>
          ))}

          <a className="series__end" href="#prints" data-cursor="Prints">
            <span>Take one home</span>
            <em>→</em>
          </a>
        </div>

        <div className="series__bar"><i /></div>
      </div>
    </section>
  );
}
