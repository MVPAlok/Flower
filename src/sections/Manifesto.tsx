import { Fragment, useRef } from "react";
import { useScrollVar } from "../lib/scroll";

type Piece = string | { chip: string; alt: string } | { em: string };

/** The manifesto: words "develop" from pale to ink as you scroll, like a print in a tray. */
const TEXT: Piece[] = [
  "Some things only exist up close",
  { chip: "/stills/chips/petal.webp", alt: "Rain beads on a red petal" },
  ". A bead of rain",
  { chip: "/stills/chips/drop.webp", alt: "A drop with the garden reflected in it" },
  "holding a whole garden, upside down. A petal bending under its own small weather. Bloom is a film about",
  { em: "looking slower" },
  "— thirty seconds",
  { chip: "/stills/chips/bokeh.webp", alt: "Soft pink bokeh" },
  "one frame at a time.",
];

export function Manifesto() {
  const ref = useRef<HTMLElement>(null);
  useScrollVar(ref, "pass");

  // flatten into word tokens so every word can be timed
  let i = 0;
  const words: React.ReactNode[] = [];
  TEXT.forEach((piece, k) => {
    if (typeof piece === "string") {
      piece.split(" ").filter(Boolean).forEach((w) => {
        words.push(<span key={`${k}-${i}`} className="mf__w" style={{ "--i": i++ } as React.CSSProperties}>{w}</span>);
        words.push(" ");
      });
    } else if ("chip" in piece) {
      words.push(
        <span key={`c${k}`} className="mf__chip" style={{ "--i": i++ } as React.CSSProperties}>
          <img src={piece.chip} alt={piece.alt} loading="lazy" decoding="async" />
        </span>,
        " ",
      );
    } else {
      piece.em.split(" ").forEach((w) => {
        words.push(<em key={`e${k}-${i}`} className="mf__w" style={{ "--i": i++ } as React.CSSProperties}>{w}</em>);
        words.push(" ");
      });
    }
  });

  return (
    <section ref={ref} id="film" className="mf" data-theme="light" style={{ "--n": i } as React.CSSProperties}>
      <div className="sec-head" data-reveal>
        <span>(01)</span>
        <span>The film</span>
        <span className="sec-head__rule" />
        <span>A 30-second macro study</span>
      </div>

      <p className="mf__text">
        {words.map((w, k) => (
          <Fragment key={k}>{w}</Fragment>
        ))}
      </p>

      <div className="mf__foot">
        <dl className="mf__facts" data-reveal>
          <div><dt>Frames</dt><dd>360</dd></div>
          <div><dt>Seconds</dt><dd>30</dd></div>
          <div><dt>Drops</dt><dd>1</dd></div>
        </dl>
        <p className="mf__body" data-reveal>
          Every frame of the film above is a still you can stop on. Scroll back up and it plays in reverse: the drop climbs back
          onto the petal, the rose falls out of focus, the rain un-falls.
          <a className="link" href="#top">Watch it again ↑</a>
        </p>
      </div>
    </section>
  );
}
