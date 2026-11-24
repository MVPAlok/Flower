import { useEffect, useRef } from "react";

/**
 * A glass droplet cursor (desktop only). It trails the pointer, swells over
 * links, and shows a word over anything with data-cursor="…".
 */
export function Cursor() {
  const ring = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    document.documentElement.classList.add("has-cursor");
    const pos = { x: -100, y: -100 }, cur = { x: -100, y: -100 };
    let raf = 0;
    const move = (e: PointerEvent) => {
      pos.x = e.clientX;
      pos.y = e.clientY;
      dot.current!.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
      const t = (e.target as HTMLElement).closest<HTMLElement>("[data-cursor], a, button, input, label");
      const word = t?.dataset.cursor ?? "";
      ring.current!.dataset.state = t ? (word ? "label" : "link") : "";
      if (label.current && label.current.textContent !== word) label.current.textContent = word;
      ring.current!.classList.toggle("is-dark", !!t?.closest("[data-theme='dark']") || !!(e.target as HTMLElement).closest("[data-theme='dark']"));
    };
    const loop = () => {
      cur.x += (pos.x - cur.x) * 0.2;
      cur.y += (pos.y - cur.y) * 0.2;
      ring.current!.style.transform = `translate3d(${cur.x}px, ${cur.y}px, 0)`;
      raf = requestAnimationFrame(loop);
    };
    const leave = () => (ring.current!.dataset.state = "hidden");
    window.addEventListener("pointermove", move);
    document.addEventListener("pointerleave", leave);
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", leave);
      document.documentElement.classList.remove("has-cursor");
    };
  }, []);

  return (
    <>
      <div ref={ring} className="cursor" aria-hidden="true">
        <span ref={label} />
      </div>
      <div ref={dot} className="cursor-dot" aria-hidden="true" />
    </>
  );
}
