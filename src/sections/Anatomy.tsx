import { useRef, useState } from "react";
import { useScrollVar } from "../lib/scroll";

const STEPS = [
  {
    t: "Surface tension",
    b: "Water molecules pull on one another, so the drop's surface tightens like a skin into the smallest shape it can make. It hangs on to the petal until its own weight wins.",
    x: 50, y: 7,
  },
  {
    t: "A tiny lens",
    b: "Curved like glass, the drop bends the light that passes through it. It works as a small, imperfect lens, which is why a whole garden fits inside.",
    x: 79, y: 27,
  },
  {
    t: "Upside down",
    b: "Like any simple lens, it flips what it sees. The rose behind the camera appears inside the drop inverted: petals down, sky below.",
    x: 34, y: 42,
  },
];

/** Sticky diagram: the drop on the left, three steps on the right, a marker that moves between them. */
export function Anatomy() {
  const ref = useRef<HTMLElement>(null);
  const [step, setStep] = useState(0);
  useScrollVar(ref, "pin", (p) => setStep(p < 0.34 ? 0 : p < 0.68 ? 1 : 2));
  const s = STEPS[step];

  return (
    <section ref={ref} id="anatomy" className="anat" data-theme="dark">
      <div className="anat__stage">
        <div className="anat__fig">
          <svg className="anat__ring" viewBox="0 0 200 200" aria-hidden="true">
            <defs>
              <path id="anat-circle" d="M100,100 m-92,0 a92,92 0 1,1 184,0 a92,92 0 1,1 -184,0" />
            </defs>
            <text>
              <textPath href="#anat-circle">anatomy of a drop ✦ anatomy of a drop ✦ anatomy of a drop ✦ anatomy of a drop ✦ </textPath>
            </text>
          </svg>
          <div className="anat__lens">
            <img src="/stills/anatomy-drop.webp" alt="A single drop of rain with an upside-down rose inside it" loading="lazy" decoding="async" />
            <span className="anat__mark" style={{ left: `${s.x}%`, top: `${s.y}%` }}>
              <i />
              <b>{String(step + 1).padStart(2, "0")}</b>
            </span>
          </div>
        </div>

        <div className="anat__text">
          <div className="sec-head sec-head--dark">
            <span>(03)</span>
            <span>Anatomy of a drop</span>
          </div>
          <h2 className="anat__title">
            What one drop <em>does</em>
            <br />
            in thirty seconds.
          </h2>
          <ol className="anat__steps">
            {STEPS.map((st, i) => (
              <li key={st.t} className={i === step ? "is-on" : ""}>
                <span className="anat__num">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <h3>{st.t}</h3>
                  <p>{st.b}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
