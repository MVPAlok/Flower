import { useEffect, useRef, useState } from "react";
import { CH, CHAPTERS, CLIP_SECONDS, FRAME_COUNT, TRACK_VH, WORD, bump, clamp, frameAt, range, smooth } from "./config";
import { FrameStore } from "./FrameStore";
import { WaterRenderer, type Impulse } from "./WaterRenderer";
import { drawLensText, drawWordMask } from "./WaterMask";
import { dropAt } from "./dropTrack";
import { Sparkle } from "../components/Sparkle";
import { Preloader } from "../components/Preloader";

const FIRST_PASS = Math.ceil(FRAME_COUNT / 8);
const SHOCK_FRAME = 306; // the drop has just let go

const tc = (sec: number) => {
  const s = Math.floor(sec), f = Math.floor((sec - s) * 24);
  return `00:${String(s).padStart(2, "0")}:${String(f).padStart(2, "0")}`;
};

/** Lines that rise out of a mask, one after another (driven by a CSS variable). */
function Rise({ lines, v, className }: { lines: React.ReactNode[]; v: string; className?: string }) {
  return (
    <span className={`rise ${className ?? ""}`} style={{ "--v": `var(${v})` } as React.CSSProperties}>
      {lines.map((l, i) => (
        <span className="rise__mask" key={i}>
          <span className="rise__line" style={{ "--i": i } as React.CSSProperties}>{l}</span>
        </span>
      ))}
    </span>
  );
}

export function BloomHero() {
  const trackRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tcRef = useRef<HTMLSpanElement>(null);
  const focusRef = useRef<HTMLSpanElement>(null);
  const [loaded, setLoaded] = useState(0);
  const [ready, setReady] = useState(false);
  const [noGL] = useState(() => !WaterRenderer.supported());

  useEffect(() => {
    const track = trackRef.current!, stage = stageRef.current!, canvas = canvasRef.current!;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const small = window.innerWidth < 768;
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    const dpr = Math.min(window.devicePixelRatio || 1, small ? 1.25 : 1.75);

    let firstPassDone = false;
    const store = new FrameStore(small || saveData ? "mobile" : "desktop", (n) => {
      setLoaded(n);
      if (!firstPassDone && n >= FIRST_PASS) {
        firstPassDone = true;
        setReady(true);
      }
    });
    store.load();

    // ---------- renderer ----------
    let gl: WaterRenderer | null = null;
    try {
      if (!noGL) gl = new WaterRenderer(canvas, !small && !reduced);
    } catch (e) {
      console.warn("[bloom] WebGL failed, using a plain canvas", e);
    }
    const ctx2d = gl ? null : canvas.getContext("2d");
    stage.classList.toggle("no-gl", !gl);

    let disposed = false;
    const mask = document.createElement("canvas");
    const lensText = document.createElement("canvas");
    let W = 0, H = 0;
    const layout = () => {
      W = stage.clientWidth;
      H = stage.clientHeight;
      if (W <= 0 || H <= 0) return;
      if (gl) {
        gl.resize(dpr);
        drawWordMask(mask, WORD, W, H);
        gl.setMask(mask);
        drawLensText(lensText);
        gl.setLensText(lensText);
      } else {
        canvas.width = Math.round(W * dpr);
        canvas.height = Math.round(H * dpr);
      }
    };
    layout();
    const fonts = Promise.race([
      Promise.all([document.fonts?.load(`700 100px "Outfit"`), document.fonts?.load(`italic 100px "Instrument Serif"`)]).catch(() => null),
      new Promise((r) => setTimeout(r, 2500)),
    ]);
    fonts.then(() => {
      if (disposed || !gl) return;
      if (W > 0 && H > 0) {
        drawWordMask(mask, WORD, W, H);
        gl.setMask(mask);
      }
      drawLensText(lensText);
      gl.setLensText(lensText);
    });
    const ro = new ResizeObserver(layout);
    ro.observe(stage);

    // ---------- pointer: ripples + bokeh parallax ----------
    const ptr = { x: 0.5, y: 0.5, px: 0.5, py: 0.5, moved: 0, inside: false };
    const mouse = { x: 0, y: 0 };
    const onMove = (e: PointerEvent) => {
      const r = stage.getBoundingClientRect();
      if (!r.width || !r.height) return;
      ptr.x = clamp((e.clientX - r.left) / r.width);
      ptr.y = clamp((e.clientY - r.top) / r.height);
      ptr.inside = true;
    };
    const onLeave = () => (ptr.inside = false);
    stage.addEventListener("pointermove", onMove);
    stage.addEventListener("pointerleave", onLeave);

    // ---------- scroll ----------
    const target = () => {
      const r = track.getBoundingClientRect();
      return clamp(-r.top / Math.max(1, track.offsetHeight - window.innerHeight));
    };
    let current = target();
    let lastP = current;
    let last = performance.now();
    let raf = 0;
    let flash = 0;
    let shockArmed = frameAt(current) < SHOCK_FRAME - 10;
    let lastTc = "", lastFocus = "", lastCh = -1;

    // video uv → screen uv (same cover-fit as the shader)
    const toScreen = (vx: number, vy: number, vw: number, vh: number, push: number, cx: number) => {
      const sa = W / H, va = vw / vh;
      let x = 0.5 + (vx - 0.5) * push, y = 0.5 + (vy - 0.5) * push;
      if (sa > va) y = (y - 0.5) / (va / sa) + 0.5;
      else x = (x - cx) / (sa / va) + 0.5;
      return { x, y, k: sa > va ? sa / va : 1 };
    };

    const set = (k: string, v: number) => stage.style.setProperty(k, v.toFixed(3));

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      // pause all drawing once the hero is fully off screen
      const tr = track.getBoundingClientRect();
      if (tr.bottom < 0 || tr.top > window.innerHeight) {
        raf = requestAnimationFrame(tick);
        return;
      }
      const t = target();
      current += (t - current) * (1 - Math.exp(-dt * (reduced ? 30 : 6)));
      if (Math.abs(t - current) < 0.0001) current = t;
      const p = current;
      const speed = Math.abs(p - lastP) / Math.max(dt, 1e-3); // progress per second
      lastP = p;

      const focus = range(p, CH.focus), rain = range(p, CH.rain), drop = range(p, CH.drop);
      const fall = range(p, CH.fall), bokeh = range(p, CH.bokeh);
      const fi = frameAt(p);

      // ---------- camera ----------
      const lod =
        (p < CH.focus[0] ? 4.2 : 4.2 * (1 - smooth(0.08, 0.85, focus))) +
        bump(0, 0.22, drop) * 1.6 +
        bump(0.15, 0.75, fall) * 2.4;
      const fallKick = bump(0.1, 0.6, fall);

      // ---------- DOM variables ----------
      set("--p", p);
      set("--bars", p < CH.focus[0] ? 1 : (1 - smooth(0.25, 0.8, focus)) + fallKick * 0.75);
      set("--intro", 1 - smooth(0.04, 0.45, focus));
      set("--rain-in", smooth(0.12, 0.4, rain));
      set("--rain-out", smooth(0.84, 1, rain));
      set("--drop-in", smooth(0.1, 0.34, drop));
      set("--drop-out", smooth(0.8, 0.96, drop));
      set("--end", smooth(0.28, 0.62, bokeh));
      set("--hud", 1 - smooth(0.6, 0.9, bokeh) * 0.4);
      const chapter = p < CH.focus[0] ? 0 : p < CH.rain[0] ? 1 : p < CH.drop[0] ? 2 : p < CH.fall[0] ? 3 : p < CH.bokeh[0] ? 4 : 5;
      if (chapter !== lastCh) {
        lastCh = chapter;
        stage.dataset.ch = String(chapter);
        stage.dataset.tone = chapter === 5 ? "light" : "dark";
      }
      const time = tc((fi / (FRAME_COUNT - 1)) * CLIP_SECONDS);
      if (time !== lastTc && tcRef.current) tcRef.current.textContent = lastTc = time;
      const fd = `${(0.18 + lod * 0.13).toFixed(2)} m`;
      if (fd !== lastFocus && focusRef.current) focusRef.current.textContent = lastFocus = fd;

      // ---------- frame ----------
      const got = store.get(fi);
      if (got && W > 0) {
        const f = got.frame as ImageBitmap;
        const push = reduced ? 1 : 1 + p * 0.05;
        const centerX = H > W ? 0.52 : 0.5;

        if (gl) {
          gl.setFrame(f);

          // impulses for the ripple simulation
          const imp: Impulse[] = [];
          if (gl.canRipple) {
            if (ptr.inside) {
              const d = Math.hypot(ptr.x - ptr.px, (ptr.y - ptr.py) * (H / W));
              if (d > 0.002) imp.push({ x: ptr.x, y: ptr.y, r: 0.016, s: Math.min(1.4, d * 40) });
            }
            ptr.px = ptr.x;
            ptr.py = ptr.y;
            const rainRate = (p < CH.focus[0] ? 0.7 : 0) + bump(-0.1, 1.05, rain) * (3 + Math.min(speed * 90, 12)) + (p > CH.focus[0] && p < CH.rain[0] ? focus * 3 : 0);
            let n = rainRate * dt;
            while (n > 0 && imp.length < 7) {
              if (Math.random() < n) imp.push({ x: Math.random(), y: Math.random(), r: 0.005 + Math.random() * 0.006, s: 0.6 + Math.random() * 0.7 });
              n -= 1;
            }
          }

          // the drop lens + the shockwave when it lets go
          const d = dropAt(fi);
          const lensAmt = d ? smooth(212, 240, fi) * (1 - smooth(292, 304, fi)) : 0;
          if (fi < SHOCK_FRAME - 10) shockArmed = true;
          if (shockArmed && fi >= SHOCK_FRAME) {
            shockArmed = false;
            flash = 1;
            const s = toScreen(0.5, 0.52, f.width, f.height, push, centerX);
            if (gl.canRipple) imp.push({ x: s.x, y: s.y, r: 0.07, s: 7 }, { x: s.x, y: s.y, r: 0.2, s: -2.5 });
          }
          flash *= Math.exp(-dt * 3.2);

          gl.step(imp, 0.972);
          if (dt > 0.022) gl.step([], 0.972);

          mouse.x += ((ptr.inside ? ptr.x * 2 - 1 : 0) - mouse.x) * (1 - Math.exp(-dt * 4));
          mouse.y += ((ptr.inside ? ptr.y * 2 - 1 : 0) - mouse.y) * (1 - Math.exp(-dt * 4));

          gl.render({
            push,
            focus: reduced ? Math.min(lod, 2) : lod,
            ca: reduced ? 0.3 : 0.5 + drop * 1.1 * (p < CH.fall[1] ? 1 : 0) + fallKick * 3 + (p > CH.bokeh[0] ? 0.4 : 0),
            halation: 0.55 + fallKick * 1.5,
            letters: p < CH.focus[0] ? 1 : 1 - smooth(0.5, 0.95, focus),
            melt: smooth(0.12, 0.9, focus),
            ripple: 1,
            lens: d ? [d.x, d.y, d.r, lensAmt] : [0, 0, 0, 0],
            flash: reduced ? 0 : flash,
            bokeh: smooth(0.05, 0.45, bokeh),
            mouse: [mouse.x, mouse.y],
            wash: smooth(0.2, 0.7, bokeh) * 0.62 + smooth(0.86, 1, bokeh) * 0.38,
            centerX,
          });
        } else if (ctx2d) {
          const s = Math.max((W * dpr) / f.width, (H * dpr) / f.height);
          ctx2d.drawImage(f, (W * dpr - f.width * s) / 2, (H * dpr - f.height * s) / 2, f.width * s, f.height * s);
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      stage.removeEventListener("pointermove", onMove);
      stage.removeEventListener("pointerleave", onLeave);
      store.dispose();
      gl?.dispose();
    };
  }, [noGL]);

  return (
    <section ref={trackRef} className="bloom" style={{ height: `${TRACK_VH}vh` }} aria-label="The art of bloom">
      <div ref={stageRef} className="bloom__stage" data-ch="0" data-tone="dark">
        <canvas ref={canvasRef} className="bloom__film" aria-hidden="true" />

        {/* letterbox */}
        <div className="bars" aria-hidden="true"><i /><i /></div>

        {/* viewfinder readout */}
        <div className="vf" aria-hidden="true">
          <span className="vf__rec"><b /> bloom — a macro film</span>
          <span className="vf__mid">
            ƒ/2.8 <Sparkle /> 1:1 <Sparkle /> focus <span ref={focusRef}>0.73 m</span>
          </span>
          <span className="vf__tc"><span ref={tcRef}>00:00:00</span> / 00:30:00</span>
        </div>

        {/* 01 · surface — the word itself is water, drawn by the shader */}
        <div className="intro">
          <span className="intro__pre">The art of</span>
          <h1 className={noGL ? "intro__word" : "sr-only"}>{WORD}</h1>
          <span className="intro__sub">Macro stories</span>
        </div>
        <div className="hints">
          <span className="pill glass">{noGL ? "A 30-second film" : <>Move to make ripples <i className="ripple-ico" /></>}</span>
          <span className="pill glass glass--dark">Scroll to explore <i aria-hidden="true">↓</i></span>
        </div>

        {/* 03 · rain */}
        <div className="copy copy--rain">
          <p className="copy__label">03 — Rain</p>
          <Rise v="--rain-in" className="copy__big" lines={["Every petal holds", <>a small <em>storm.</em></>]} />
        </div>

        {/* 04 · inside the drop */}
        <div className="copy copy--drop">
          <p className="copy__label">04 — Inside the drop</p>
          <Rise v="--drop-in" className="copy__big" lines={["A whole garden,", <>in a single <em>drop.</em></>]} />
          <p className="copy__note">Look closely: it's upside down.</p>
        </div>

        {/* 06 · stay a while — comes into focus */}
        <div className="end">
          <p className="end__label">06 — Stay a while</p>
          <h2 className="end__title">Stay a <em>while.</em></h2>
          <p className="end__sub">Thirty seconds of a rose after the rain, one frame at a time.</p>
          <div className="end__ctas">
            <a className="pill pill--solid" href="#series">View the series <i aria-hidden="true">→</i></a>
            <a className="pill glass glass--light" href="#method">Behind the lens</a>
          </div>
        </div>

        {/* chapter strip */}
        <div className="chapters" aria-hidden="true">
          {CHAPTERS.map((c, i) => (
            <span key={c} data-i={i}><b>{String(i + 1).padStart(2, "0")}</b> {c}</span>
          ))}
          <span className="chapters__line"><i /></span>
        </div>

        <Preloader value={Math.min(1, loaded / FIRST_PASS)} done={ready} />
      </div>
    </section>
  );
}
