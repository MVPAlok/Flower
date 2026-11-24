import { useRef } from "react";

/** A giant wordmark that turns to water under the pointer. */
export function Footer() {
  const disp = useRef<SVGFEDisplacementMapElement>(null);
  const turb = useRef<SVGFETurbulenceElement>(null);
  const state = useRef({ target: 0, amp: 0, t: 0, raf: 0 });

  const run = () => {
    const s = state.current;
    cancelAnimationFrame(s.raf);
    const tick = () => {
      s.amp += (s.target - s.amp) * 0.08;
      s.t += 0.016;
      disp.current?.setAttribute("scale", (s.amp * 38).toFixed(2));
      turb.current?.setAttribute("baseFrequency", `${(0.008 + Math.sin(s.t * 0.9) * 0.002).toFixed(4)} ${(0.03 + Math.cos(s.t * 0.7) * 0.006).toFixed(4)}`);
      if (s.target > 0 || s.amp > 0.01) s.raf = requestAnimationFrame(tick);
      else disp.current?.setAttribute("scale", "0");
    };
    s.raf = requestAnimationFrame(tick);
  };
  const enter = () => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    state.current.target = 1;
    run();
  };
  const leave = () => {
    state.current.target = 0;
    run();
  };

  return (
    <footer className="foot" data-theme="dark">
      <div className="foot__cols">
        <div>
          <p className="foot__label">Explore</p>
          <a href="#film">The film</a>
          <a href="#series">The series</a>
          <a href="#anatomy">Anatomy of a drop</a>
          <a href="#prints">Prints</a>
        </div>
        <div>
          <p className="foot__label">Follow</p>
          <a href="#">Instagram</a>
          <a href="#">Vimeo</a>
          <a href="#newsletter">Newsletter</a>
        </div>
        <div className="foot__note">
          <p className="foot__label">About</p>
          <p>bloom is a macro film and print series about rain, roses and looking slower.</p>
        </div>
        <a className="foot__top" href="#top" aria-label="Back to the top" data-cursor="Top">
          <svg viewBox="0 0 20 28" aria-hidden="true"><path d="M10 1C12.5 6 19 11 19 18a9 9 0 1 1-18 0C1 11 7.5 6 10 1Z" /></svg>
        </a>
      </div>

      <div className="foot__word" onPointerEnter={enter} onPointerLeave={leave} aria-hidden="true">
        <svg width="0" height="0" style={{ position: "absolute" }}>
          <filter id="foot-water" x="-5%" y="-20%" width="110%" height="140%">
            <feTurbulence ref={turb} type="fractalNoise" baseFrequency="0.008 0.03" numOctaves="2" seed="8" result="n" />
            <feDisplacementMap ref={disp} in="SourceGraphic" in2="n" scale="0" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </svg>
        <span>bloom</span>
      </div>

      <div className="foot__base">
        <span>© 2026 bloom</span>
        <span>Film generated with Gemini · Fonts under the SIL Open Font License</span>
        <span>Made with WebGL, frame by frame</span>
      </div>
    </footer>
  );
}
