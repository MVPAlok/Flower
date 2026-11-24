import { useId, useRef } from "react";

/**
 * An image that ripples like water when the pointer enters it — an SVG
 * turbulence + displacement filter whose strength swells and settles.
 */
export function RippleImage({ src, alt, className, eager }: { src: string; alt: string; className?: string; eager?: boolean }) {
  const id = useId().replace(/:/g, "");
  const disp = useRef<SVGFEDisplacementMapElement>(null);
  const turb = useRef<SVGFETurbulenceElement>(null);
  const anim = useRef(0);

  const play = () => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    cancelAnimationFrame(anim.current);
    const t0 = performance.now();
    const seed = Math.random() * 100;
    const tick = (t: number) => {
      const k = (t - t0) / 1100;
      if (k >= 1) {
        disp.current?.setAttribute("scale", "0");
        return;
      }
      const amp = Math.sin(Math.PI * Math.min(1, k * 1.6)) * (1 - k) * 46;
      disp.current?.setAttribute("scale", amp.toFixed(2));
      turb.current?.setAttribute("baseFrequency", `${(0.012 + k * 0.01).toFixed(4)} ${(0.02 + k * 0.012).toFixed(4)}`);
      turb.current?.setAttribute("seed", String(Math.floor(seed + k * 6)));
      anim.current = requestAnimationFrame(tick);
    };
    anim.current = requestAnimationFrame(tick);
  };

  return (
    <span className={`ripple ${className ?? ""}`} onPointerEnter={play}>
      <svg width="0" height="0" aria-hidden="true" style={{ position: "absolute" }}>
        <filter id={`r${id}`} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence ref={turb} type="fractalNoise" baseFrequency="0.012 0.02" numOctaves="2" seed="3" result="n" />
          <feDisplacementMap ref={disp} in="SourceGraphic" in2="n" scale="0" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
      <img src={src} alt={alt} loading={eager ? "eager" : "lazy"} decoding="async" style={{ filter: `url(#r${id})` }} />
    </span>
  );
}
