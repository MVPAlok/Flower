import { RippleImage } from "../components/RippleImage";
import { PLATES } from "./Series";

const EDITIONS = [
  { plate: PLATES[0], size: "30 × 40 cm" },
  { plate: PLATES[4], size: "50 × 70 cm" },
  { plate: PLATES[5], size: "30 × 40 cm" },
];

export function Prints() {
  return (
    <section id="prints" className="prints" data-theme="dark">
      <div className="sec-head sec-head--dark" data-reveal>
        <span>(05)</span>
        <span>Prints</span>
        <span className="sec-head__rule" />
        <span>Made to order</span>
      </div>

      <div className="prints__head" data-reveal>
        <h2>
          Take a <em>drop</em> home.
        </h2>
        <p>Three frames from the film as archival prints. Each one is printed after you order it, then signed and numbered.</p>
      </div>

      <div className="prints__grid">
        {EDITIONS.map(({ plate, size }, i) => (
          <article key={plate.n} className="print" data-reveal style={{ "--d": `${i * 0.12}s` } as React.CSSProperties}>
            <div className="print__frame" data-cursor="Enquire">
              <RippleImage src={plate.src} alt={`Plate ${plate.n}: ${plate.title}`} className="print__img" />
            </div>
            <div className="print__info">
              <span className="print__n">Plate {plate.n}</span>
              <h3>{plate.title}</h3>
              <span className="print__meta">{size} · fine-art paper</span>
              <a className="print__cta" href="#newsletter">Enquire <span>→</span></a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
