export function Preloader({ value, done }: { value: number; done: boolean }) {
  return (
    <div className={`preloader ${done ? "is-done" : ""}`} aria-live="polite">
      <span className="preloader__pre">The art of</span>
      <span className="preloader__word">bloom</span>
      <span className="preloader__line">
        <i style={{ transform: `scaleX(${value})` }} />
      </span>
      <span className="preloader__pct">{String(Math.round(value * 100)).padStart(2, "0")}%</span>
    </div>
  );
}
